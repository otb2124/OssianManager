// script-editor.ts
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  effect,
} from '@angular/core';
import { EditorState, Compartment, Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle, StreamLanguage } from '@codemirror/language';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap, completeFromList, completeAnyWord, CompletionSource } from '@codemirror/autocomplete';
import { json } from '@codemirror/lang-json';
import { shader as shaderStreamMode } from '@codemirror/legacy-modes/mode/clike';
import { csharp } from '@replit/codemirror-lang-csharp';
import { oneDark } from '@codemirror/theme-one-dark';
import { FileExplorerService } from '../../services/persistence/file-explorer.service';
import { PersistenceService } from '../../services/persistence/persistence.service';
import { FsEntry } from '../../services/persistence/persistence.service';
import { linter, Diagnostic } from '@codemirror/lint';

const AUTOSAVE_DEBOUNCE_MS = 500;

// @codemirror/legacy-modes ships a pre-built "shader" stream mode with real
// GLSL keywords/types/builtins (uniform, varying, vec3, gl_FragColor,
// texture2D, etc.) — not a real Lezer grammar, but meaningfully better than
// generic C-like highlighting for .vert/.frag/.glsl/.hlsl files.
const shaderLanguage = StreamLanguage.define(shaderStreamMode);

// Neither @replit/codemirror-lang-csharp nor @codemirror/lang-json register
// a completion source in their languageData (checked their compiled output —
// both only supply commentTokens/closeBrackets/indentOnInput), so "language
// keyword" suggestions have to be supplied here explicitly rather than
// coming from the packages for free. These are plain keyword/type lists,
// not real symbol resolution — they don't know your actual classes or
// members, matching the generic-completion scope this was built for.
const CSHARP_WORD_LIST = [
  'abstract', 'as', 'async', 'await', 'base', 'bool', 'break', 'byte', 'case',
  'catch', 'char', 'checked', 'class', 'const', 'continue', 'decimal',
  'default', 'delegate', 'do', 'double', 'else', 'enum', 'event', 'explicit',
  'extern', 'false', 'finally', 'fixed', 'float', 'for', 'foreach', 'get',
  'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is',
  'lock', 'long', 'namespace', 'new', 'null', 'object', 'operator', 'out',
  'override', 'params', 'private', 'protected', 'public', 'readonly', 'ref',
  'return', 'sbyte', 'sealed', 'set', 'short', 'sizeof', 'stackalloc',
  'static', 'string', 'struct', 'switch', 'this', 'throw', 'true', 'try',
  'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using',
  'value', 'var', 'virtual', 'void', 'volatile', 'where', 'while', 'yield'
];

const CSHARP_KEYWORDS = completeFromList(CSHARP_WORD_LIST);
const CSHARP_WORDS = CSHARP_WORD_LIST;

const JSON_KEYWORDS = completeFromList(['true', 'false', 'null']);

/**
 * Combines a language's keyword list with document-word suggestions
 * (completeAnyWord — CM6's built-in "suggest words already typed elsewhere
 * in the file" source). Both are queried and merged by autocompletion()'s
 * override array automatically.
 */
function completionFor(...sources: CompletionSource[]): Extension {
  return autocompletion({ override: [...sources, completeAnyWord] });
}

/**
 * Picks CodeMirror language + completion extensions based on file
 * extension. .json -> real JSON grammar + JSON keywords. .cs -> real C#
 * grammar (@replit package, Lezer-based) + C# keywords. shader extensions
 * -> the shader stream mode above, no keyword list (GLSL keywords aren't
 * curated here yet — falls back to document-word completion only).
 * Anything else -> plain text, document-word completion only.
 */
function languageForPath(path: string, csharpDiagnostics: (view: EditorView) => Diagnostic[]): Extension {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
  switch (ext) {
    case '.json':
      return [json(), completionFor(JSON_KEYWORDS)];
    case '.cs':
      return [csharp(), completionFor(CSHARP_KEYWORDS), linter(csharpDiagnostics)];
    case '.hlsl':
    case '.glsl':
    case '.shader':
    case '.vert':
    case '.frag':
    case '.comp':
      return [shaderLanguage, completionFor()];
    default:
      return completionFor();
  }
}

@Component({
  selector: 'app-script-editor',
  standalone: true,
  imports: [],
  template: '<div #host class="h-full w-full overflow-hidden"></div>',
})
export class ScriptEditor implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;

  private readonly explorerService = inject(FileExplorerService);
  private readonly persistence = inject(PersistenceService);

  private view: EditorView | null = null;
  private languageCompartment = new Compartment();

  private currentEntry: FsEntry | null = null;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingSaveContent: string | null = null; // content not yet flushed to disk

  private selectionWatcher = effect(() => {
    const entry = this.explorerService.selectedEntry();
    this.onSelectionChange(entry);
  });

  ngAfterViewInit(): void {
    this.view = new EditorView({
      state: this.buildState(''),
      parent: this.hostRef.nativeElement,
    });
  
    const existing = this.explorerService.selectedEntry();
    if (existing) {
      this.onSelectionChange(existing);
    }
  }

  private onSelectionChange(entry: FsEntry | null): void {
    if (entry === this.currentEntry) return;
  
    this.flushPendingSave();
  
    if (!this.view) {
      // effect() fires synchronously at construction, before ngAfterViewInit
      // creates the view — don't record entry as "current" yet, or the
      // ngAfterViewInit fallback below will see currentEntry already matching
      // and skip the load once the view actually exists.
      return;
    }
  
    this.currentEntry = entry;
  
    if (!entry || entry.isDirectory) {
      this.setContent('', []);
      return;
    }
  
    this.persistence.readTextAbsolute(entry.path).subscribe({
      next: content => {
        if (this.currentEntry !== entry) return;
        this.setContent(content, languageForPath(entry.path, this.csharpLinter.bind(this)));
      },
      error: () => {
        if (this.currentEntry !== entry) return;
        this.setContent(`// Failed to read file: ${entry.path}`, []);
      },
    });
  }

  private setContent(content: string, language: Extension): void {
    if (!this.view) return;
    this.view.setState(this.buildState(content));
    this.view.dispatch({
      effects: this.languageCompartment.reconfigure(language),
    });
  }

  private buildState(content: string): EditorState {
    return EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        bracketMatching(),
        closeBrackets(),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        // completionKeymap must come before defaultKeymap so Enter/Tab/Escape
        // are handled by the completion popup (accept/dismiss) when it's
        // open, rather than falling through to newline/indent/etc.
        keymap.of([...closeBracketsKeymap, ...completionKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        this.languageCompartment.of([]),
        oneDark,
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
        }),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            this.scheduleSave(update.state.doc.toString());
          }
        }),
      ],
    });
  }

  private scheduleSave(content: string): void {
    if (!this.currentEntry || this.currentEntry.isDirectory) return;

    this.pendingSaveContent = content;
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.flushPendingSave(), AUTOSAVE_DEBOUNCE_MS);
  }

  private flushPendingSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    if (this.pendingSaveContent === null || !this.currentEntry) return;

    const entry = this.currentEntry;
    const content = this.pendingSaveContent;
    this.pendingSaveContent = null;

    this.persistence.writeTextAbsolute(entry.path, content).subscribe({
      error: err => console.error(`Failed to save ${entry.path}:`, err),
    });
  }

  csharpLinter(view: EditorView): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const text = view.state.doc.toString();
    const wordPattern = /\b[a-zA-Z_]\w*\b/g;
    const knownWords = new Set(CSHARP_WORDS.map(w => w.toLowerCase()));
    let match: RegExpExecArray | null;
  
    while ((match = wordPattern.exec(text)) !== null) {
      const word = match[0];
      const lower = word.toLowerCase();
      // Only flag words that are CLOSE to a keyword (edit distance 1-2),
      // not just "unrecognized" — otherwise every identifier in the file
      // gets flagged, since we have no symbol table.
      const closeMatch = this.findCloseKeyword(lower, knownWords);
      if (closeMatch && lower !== closeMatch) {
        diagnostics.push({
          from: match.index,
          to: match.index + word.length,
          severity: 'warning',
          message: `Did you mean "${closeMatch}"?`,
        });
      }
    }
    return diagnostics;
  }
  
  findCloseKeyword(word: string, known: Set<string>): string | null {
    for (const kw of known) {
      if (Math.abs(kw.length - word.length) > 2) continue;
      if (this.levenshtein(word, kw) <= 2) return kw;
    }
    return null;
  }

  levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
  
    // Single rolling row instead of a full m×n matrix — fine for
    // short identifiers/keywords, which is all this is ever called with.
    let prevRow = Array.from({ length: n + 1 }, (_, j) => j);
  
    for (let i = 1; i <= m; i++) {
      const currRow = [i];
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        currRow[j] = Math.min(
          currRow[j - 1] + 1,      // insertion
          prevRow[j] + 1,          // deletion
          prevRow[j - 1] + cost,   // substitution
        );
      }
      prevRow = currRow;
    }
  
    return prevRow[n];
  }

  ngOnDestroy(): void {
    this.selectionWatcher.destroy();
    this.flushPendingSave(); // don't lose the last edit on tab/component teardown
    this.view?.destroy();
  }
}

