// terminal-panel.ts
import { Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { EngineConsoleService, ConsoleStream } from '../../services/engine/console/engine-console.service';

/**
 * Engine console view. With the input shown it is the Terminal (output + prompt);
 * with `[showInput]="false"` it is the read-only Console (output + a small toolbar).
 */
@Component({
  selector: 'app-terminal-component',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './terminal.html',
})
export class Terminal {
  private readonly console = inject(EngineConsoleService);
  private readonly destroyRef = inject(DestroyRef);
 
  readonly showInput = input(true);
 
  /** Hide engine output printed before the engine finished loading (the Terminal does, the Console doesn't). */
  readonly hideStartupOutput = input(false);
 
  protected readonly ready = this.console.ready;
 
  protected readonly visibleLines = computed(() => {
    const lines = this.console.lines();
    return this.hideStartupOutput() ? lines.filter(l => l.phase === 'running') : lines;
  });
  protected readonly draft = signal('');
 
  private readonly output = viewChild.required<ElementRef<HTMLElement>>('output');
  private readonly promptInput = viewChild<ElementRef<HTMLInputElement>>('prompt');
 
  /** Follow new output only while the user is parked at the bottom (like a real terminal). */
  private stickToBottom = true;
 
  // -1 = not browsing history
  private historyIndex = -1;
  private draftBeforeHistory = '';
 
  constructor() {
    effect(() => {
      this.visibleLines(); // re-run whenever output arrives
      if (!this.stickToBottom) return;
      queueMicrotask(() => this.scrollToBottom());
    });
 
    // Re-pins to the bottom when resized or shown again after being hidden
    // (the tabbed wrapper hides inactive panels instead of destroying them).
    afterNextRender(() => {
      const observer = new ResizeObserver(() => {
        if (this.stickToBottom) this.scrollToBottom();
      });
      observer.observe(this.output().nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
 
  protected lineClass(stream: ConsoleStream): string {
    switch (stream) {
      case 'stderr': return 'text-red-400';
      case 'input': return 'text-[var(--theme-color)]';
      case 'system': return 'text-gray-500 italic';
      default: return 'text-neutral-200';
    }
  }
 
  protected onScroll(): void {
    const el = this.output().nativeElement;
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  }
 
  /** Clicking the output focuses the prompt, unless the user is selecting text to copy. */
  protected onOutputClick(): void {
    if (window.getSelection()?.isCollapsed) this.promptInput()?.nativeElement.focus();
  }
 
  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
    this.historyIndex = -1;
  }
 
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.browseHistory(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.browseHistory(1);
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      this.clear();
    }
  }
 
  protected submit(): void {
    const line = this.draft();
    this.draft.set('');
    this.historyIndex = -1;
    this.stickToBottom = true;
    void this.console.send(line); // an empty line is still sent: some consoles use bare Enter
  }
 
  protected clear(): void {
    this.console.clear();
  }
 
  private browseHistory(direction: -1 | 1): void {
    const history = this.console.history;
    if (!history.length) return;
 
    if (this.historyIndex === -1) {
      if (direction === 1) return;
      this.draftBeforeHistory = this.draft();
      this.historyIndex = history.length;
    }
 
    const next = this.historyIndex + direction;
    if (next < 0) return;
 
    if (next >= history.length) {
      this.historyIndex = -1;
      this.draft.set(this.draftBeforeHistory);
    } else {
      this.historyIndex = next;
      this.draft.set(history[next]);
    }
  }
 
  private scrollToBottom(): void {
    const el = this.output().nativeElement;
    el.scrollTop = el.scrollHeight;
  }
}