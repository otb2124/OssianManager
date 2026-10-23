import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  effect,
  input,
  untracked,
} from '@angular/core';
import { EditorState, Compartment, Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle, StreamLanguage, indentUnit } from '@codemirror/language';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap, completeFromList, completeAnyWord, CompletionSource } from '@codemirror/autocomplete';
import { json } from '@codemirror/lang-json';
import { shader as shaderStreamMode } from '@codemirror/legacy-modes/mode/clike';
import { csharp } from '@replit/codemirror-lang-csharp';
import { oneDark } from '@codemirror/theme-one-dark';
import { FileExplorerService } from '../../../services/persistence/file-explorer.service';
import { PersistenceService } from '../../../services/persistence/persistence.service';
import { FsEntry } from '../../../services/persistence/persistence.service';
import { linter, Diagnostic } from '@codemirror/lint';
import { HighlightStyle, } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import {
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  scrollPastEnd,
} from '@codemirror/view';
import {
  foldGutter,
  foldKeymap,
} from '@codemirror/language';
import {
  search,
  searchKeymap,
  highlightSelectionMatches,
} from '@codemirror/search';

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



const editorTheme = EditorView.theme({
  '&': {
    color: '#e0e0e0',
    backgroundColor: '#1a1a1e',
    height: '100%',
  },
  '.cm-content': {
    caretColor: 'var(--theme-color)',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--theme-color)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--theme-color-muted)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--theme-color-glow)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--theme-color-glow)',
  },
  '.cm-gutters': {
    backgroundColor: '#1a1a1e',
    color: '#5c5c66',
    borderRight: '1px solid var(--theme-color-border)',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    color: '#5c5c66',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
}, { dark: true });


const highlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#c586c0' },
  { tag: t.controlKeyword, color: '#c586c0' },
  { tag: [t.string, t.special(t.string)], color: '#ce9178' },
  { tag: t.number, color: '#b5cea8' },
  { tag: t.bool, color: '#569cd6' },
  { tag: t.null, color: '#569cd6' },
  { tag: t.comment, color: '#6a9955', fontStyle: 'italic' },
  { tag: [t.className, t.typeName], color: '#4ec9b0' },
  { tag: t.propertyName, color: '#9cdcfe' },
  { tag: t.function(t.variableName), color: '#dcdcaa' },
  { tag: t.definition(t.variableName), color: '#9cdcfe' },
  { tag: t.variableName, color: '#e0e0e0' },
  { tag: t.operator, color: '#d4d4d4' },
  { tag: t.punctuation, color: '#d4d4d4' },
  { tag: t.bracket, color: '#d4d4d4' },
  { tag: t.invalid, color: '#f44747' },
]);

@Component({
  selector: 'app-script-editor',
  standalone: true,
  imports: [],
  template: '<div #host class="h-full w-full overflow-hidden"></div>',
})
export class ScriptEditor implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;

  /** Absolute path of the file this tab edits (dock panel param). */
  readonly path = input<string | null>(null);

  private readonly persistence = inject(PersistenceService);

  private view: EditorView | null = null;
  private languageCompartment = new Compartment();
  private currentPath: string | null = null;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingSaveContent: string | null = null;
  csharpLinter: any;

  constructor() {
    effect(() => {
      const path = this.path();
      untracked(() => this.load(path));   // no-op until the view exists
    });
  }

  ngAfterViewInit(): void {
    this.view = new EditorView({ state: this.buildState(''), parent: this.hostRef.nativeElement });
    this.load(this.path());
  }

  private buildState(content: string): EditorState {
    return EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        foldGutter(),
  
        drawSelection(),
        dropCursor(),
        rectangularSelection(),
        crosshairCursor(),
        scrollPastEnd(),
  
        history(),
        bracketMatching(),
        closeBrackets(),
        indentOnInput(),
        highlightSpecialChars(),
  
        EditorState.tabSize.of(4),
        indentUnit.of('    '),
  
        syntaxHighlighting(highlightStyle, { fallback: false }),
  
        search(),
        highlightSelectionMatches(),
  
        keymap.of([
          ...closeBracketsKeymap,
          ...searchKeymap,
          ...completionKeymap,
          ...foldKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab,
        ]),
  
        this.languageCompartment.of([]),
        editorTheme,
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

  private load(path: string | null): void {
    if (!this.view || path === this.currentPath) return;

    this.flushPendingSave();            // still uses the OLD currentPath
    this.currentPath = path;

    if (!path) {
      this.setContent('', []);
      return;
    }

    this.persistence.readTextAbsolute(path).subscribe({
      next: content => {
        if (this.currentPath !== path) return;
        this.setContent(content, languageForPath(path, this.csharpLinter.bind(this)));
      },
      error: () => {
        if (this.currentPath !== path) return;
        this.setContent(`// Failed to read file: ${path}`, []);
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

  // setContent, buildState, csharpLinter, findCloseKeyword, levenshtein: unchanged

  private scheduleSave(content: string): void {
    if (!this.currentPath) return;
    this.pendingSaveContent = content;
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.flushPendingSave(), AUTOSAVE_DEBOUNCE_MS);
  }

  private flushPendingSave(): void {
    if (this.saveTimeout) { clearTimeout(this.saveTimeout); this.saveTimeout = null; }
    if (this.pendingSaveContent === null || !this.currentPath) return;

    const path = this.currentPath;
    const content = this.pendingSaveContent;
    this.pendingSaveContent = null;

    this.persistence.writeTextAbsolute(path, content).subscribe({
      error: err => console.error(`Failed to save ${path}:`, err),
    });
  }

  ngOnDestroy(): void {
    this.flushPendingSave();
    this.view?.destroy();
  }
}