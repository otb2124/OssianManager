// engine-console.service.ts
import { Injectable, NgZone, inject, signal } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { AppStoreService } from '../../data/app-config/app-store.service';

export type ConsoleStream = 'stdout' | 'stderr' | 'input' | 'system';

/** 'startup' = engine output printed before it finished loading; everything else is 'running'. */
export type ConsolePhase = 'startup' | 'running';

export interface ConsoleLine {
  id: number;
  stream: ConsoleStream;
  text: string;
  time: number;
  phase: ConsolePhase;
}

interface ConsolePayload {
  stream: 'stdout' | 'stderr' | 'system';
  line: string;
}

/**
 * Owns the engine console buffer, so the terminal keeps its scrollback when its component is
 * destroyed (tab switch) and so output printed before the terminal ever opened isn't lost.
 */
@Injectable({ providedIn: 'root' })
export class EngineConsoleService {
  private static readonly MAX_LINES = 5000;
  private static readonly MAX_HISTORY = 200;
  private static readonly FLUSH_MS = 50;

  private readonly store = inject(AppStoreService);

  private readonly zone = inject(NgZone);

  private readonly _lines = signal<ConsoleLine[]>([]);
  readonly lines = this._lines.asReadonly();

  /** True once the engine has finished loading (its manager pipe connects at the end of OnLoad). */
  private readonly _ready = signal(false);
  readonly ready = this._ready.asReadonly();

  private readonly _history: string[] = [];
  get history(): readonly string[] { return this._history; }

  private nextId = 0;
  private pending: ConsoleLine[] = [];
  private flushTimer?: ReturnType<typeof setTimeout>;
  private unlisten: UnlistenFn[] = [];

  private get limits() {
    return this.store.data()?.editor.console ?? { maxLines: 5000, maxHistory: 200, flushMs: 50 };
  }

  /** Call BEFORE EngineBridgeService.spawnEngine() so early output isn't missed. */
  async init(): Promise<void> {
    if (this.unlisten.length) return;

    this.unlisten = [
      await listen<ConsolePayload>('engine://console', e =>
        this.enqueue(e.payload.stream, e.payload.line)),
      await listen('engine://connected', () =>
        this.zone.run(() => this._ready.set(true))),
      await listen('engine://disconnected', () =>
        this.zone.run(() => this._ready.set(false))), // next engine's startup output is 'startup' again
    ];
  }

  dispose(): void {
    this.unlisten.forEach(u => u());
    this.unlisten = [];
  }

  /** Types a line into the engine's console (as if you pressed Enter in the console window). */
  async send(line: string): Promise<void> {
    this.enqueue('input', line);

    if (line.trim() && this._history[this._history.length - 1] !== line) {
      this._history.push(line);
      if (this._history.length > EngineConsoleService.MAX_HISTORY) this._history.shift();
    }

    try {
      await invoke('engine_console_write', { line });
    } catch (err) {
      this.enqueue('system', String(err));
    }
  }

  clear(): void {
    clearTimeout(this.flushTimer);
    this.flushTimer = undefined;
    this.pending = [];
    this._lines.set([]);
  }

  // Engines can be chatty; coalesce bursts into one signal update per FLUSH_MS.
  private enqueue(stream: ConsoleStream, text: string): void {
    // Only engine output printed before the engine is ready counts as startup output;
    // your own input and manager messages are always shown.
    const isEngineOutput = stream === 'stdout' || stream === 'stderr';
    const phase: ConsolePhase = isEngineOutput && !this._ready() ? 'startup' : 'running';

    this.pending.push({ id: this.nextId++, stream, text, time: Date.now(), phase });
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => this.zone.run(() => this.flush()), EngineConsoleService.FLUSH_MS);
  }

  private flush(): void {
    this.flushTimer = undefined;
    const batch = this.pending;
    this.pending = [];
    if (!batch.length) return;

    this._lines.update(lines => {
      const merged = lines.concat(batch);
      return merged.length > EngineConsoleService.MAX_LINES
        ? merged.slice(merged.length - EngineConsoleService.MAX_LINES)
        : merged;
    });
  }
}