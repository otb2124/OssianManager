import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { OssianToolsService } from '../ossian-tools/ossian-tools.service';

export type OssianToolName = 'cooker' | 'builder';

export interface ToolRunOptions {
  title: string;
  /** Working directory. Tools look for Cook.ini / Build.ini from here upwards. */
  cwd?: string;
}

/** Live state of the running tool, for a progress UI. */
export interface ToolRunStatus {
  runId: number;
  tool: OssianToolName;
  title: string;
  stage: string | null;
  stageIndex: number;
  stageTotal: number;
  /** Cooker asset progress. */
  done: number;
  total: number;
}

export interface ToolRunResult {
  runId: number;
  tool: OssianToolName;
  code: number;
  ok: boolean;
  cancelled: boolean;
  /** The tool's own {"event":"done"} summary (builder: game/exe/pak/zip...; cooker: pack/assets/...). */
  done: Record<string, unknown> | null;
  warnings: string[];
  errors: string[];
}

interface ToolEvent {
  runId: number;
  type: 'stdout' | 'stderr' | 'exit';
  line?: string;
  code?: number;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));
const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

/**
 * Runs OssianCooker / OssianBuilder through tools.rs and turns their --json output into a result.
 * One run at a time: both tools write into the same target folder.
 */
@Injectable({ providedIn: 'root' })
export class ToolRunnerService {
  private readonly zone = inject(NgZone);
  private readonly tools = inject(OssianToolsService);

  private nextRunId = 1;
  private readonly cancelled = new Set<number>();

  private readonly _status = signal<ToolRunStatus | null>(null);
  readonly status = this._status.asReadonly();
  readonly running = computed(() => this._status() !== null);

  async run(tool: OssianToolName, args: string[], options: ToolRunOptions): Promise<ToolRunResult> {
    if (this._status()) throw new Error('Another build step is still running.');

    const runId = this.nextRunId++;
    this._status.set({
      runId, tool, title: options.title,
      stage: null, stageIndex: 0, stageTotal: 0, done: 0, total: 0,
    });

    const result: ToolRunResult = {
      runId, tool, code: -1, ok: false, cancelled: false, done: null, warnings: [], errors: [],
    };

    let unlisten: (() => void) | undefined;
    try {
      const layout = await this.tools.resolve();
      if (!layout) throw new Error('The engine was not found. Check the engine path in Tools > Settings > Engine.');

      let signalExit!: (code: number) => void;
      const exited = new Promise<number>(resolve => (signalExit = resolve));

      // Listen BEFORE starting: a fast tool can finish before invoke() returns.
      unlisten = await listen<ToolEvent>('tool://event', ({ payload }) => {
        if (payload.runId !== runId) return;
        this.zone.run(() => {
          if (payload.type === 'exit') signalExit(payload.code ?? -1);
          else if (payload.line) this.onLine(payload.line, payload.type === 'stderr', result);
        });
      });

      await invoke('run_ossian_tool', {
        runId,
        enginePath: layout.engineExe,
        tool,
        args,
        cwd: options.cwd ?? null,
      });

      result.code = await exited;
      result.cancelled = this.cancelled.has(runId);
      result.ok = result.code === 0 && !result.cancelled;
      return result;
    } finally {
      unlisten?.();
      this.cancelled.delete(runId);
      this._status.set(null);
    }
  }

  /** Kills the running tool and its children. */
  async cancel(): Promise<boolean> {
    const current = this._status();
    if (!current) return false;
    this.cancelled.add(current.runId);
    return invoke<boolean>('cancel_ossian_tool', { runId: current.runId });
  }

  // ── output parsing ───────────────────────────────────────────────────────

  private onLine(line: string, isStderr: boolean, result: ToolRunResult): void {
    let evt: Record<string, unknown> | null = null;
    if (line.startsWith('{')) {
      try { evt = JSON.parse(line) as Record<string, unknown>; } catch { /* plain text */ }
    }

    if (!evt) {
      // Plain stderr is what the tools print for bad arguments or a crash before logging starts.
      if (isStderr) result.errors.push(line);
      return;
    }

    switch (str(evt['event'])) {
      case 'stage':
        this._status.update(s => s && {
          ...s, stage: str(evt['name']), stageIndex: num(evt['index']), stageTotal: num(evt['total']),
        });
        break;

      case 'progress':
        this._status.update(s => s && { ...s, done: num(evt['done']), total: num(evt['total']) });
        break;

      case 'warn':
        result.warnings.push(this.describe(evt));
        break;

      case 'error':
        result.errors.push(this.describe(evt));
        break;

      case 'done':
        result.done = evt;
        break;

      // 'asset', 'info', 'debug', 'cook-done': not needed here
    }
  }

  private describe(evt: Record<string, unknown>): string {
    const path = str(evt['path']);
    const message = str(evt['message']);
    return path ? `${path}: ${message}` : message;
  }
}