import { Injectable, NgZone, inject, signal } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { Subject } from 'rxjs';

export interface EngineTreeNode {
  id: string;
  name: string;
  enabled: boolean;
  properties: string[];
  children: EngineTreeNode[];
}

export interface EnginePropertyDetail {
  type: string;
  writable: boolean;
  values: Record<string, unknown>;
}

export interface EngineNodeDetail {
  id: string;
  name: string;
  enabled: boolean;
  parent: string | null;
  properties: EnginePropertyDetail[];
}

export interface EngineEvent {
  event: string;
  data?: unknown;
}

@Injectable({ providedIn: 'root' })
export class EngineIpcService {
  private readonly zone = inject(NgZone);

  private readonly _connected = signal(false);
  private readonly _tree = signal<EngineTreeNode[]>([]);
  readonly connected = this._connected.asReadonly();
  readonly tree = this._tree.asReadonly();

  /** Every raw engine event, for panels that want more than the tree. */
  readonly events$ = new Subject<EngineEvent>();

  private unlisten: UnlistenFn[] = [];
  private refreshTimer?: ReturnType<typeof setTimeout>;


  //FOR HIERARCHY ONLY
  private readonly _selectedId = signal<string | null>(null);
  readonly selectedId = this._selectedId.asReadonly();

  private readonly _currentSceneId = signal<string | null>(null);
  readonly currentSceneId = this._currentSceneId.asReadonly();

  select(id: string | null): void {
    this._selectedId.set(id);
  }

  /** Call BEFORE EngineBridgeService.spawnEngine() so the "connected" event isn't missed. */
  async init(): Promise<void> {
    if (this.unlisten.length) return;
  
    this.unlisten = [
      await listen('engine://connected', () =>
        this.zone.run(() => {
          this._connected.set(true);
          void this.refreshTree();
          void this.refreshCurrentScene();
        })),
      await listen('engine://disconnected', () =>
        this.zone.run(() => {
          this._connected.set(false);
          this._tree.set([]);
          this._currentSceneId.set(null);
        })),
      await listen<EngineEvent>('engine://event', e =>
        this.zone.run(() => this.onEngineEvent(e.payload))),
    ];
  
    // In case the engine connected before we started listening.
    this.request<string>('ping')
      .then(() => this.zone.run(() => {
        this._connected.set(true);
        void this.refreshTree();
        void this.refreshCurrentScene();
      }))
      .catch(() => { /* not connected yet; the event will tell us */ });
  }

  async loadScene(id: string): Promise<void> {
    const res = await this.request<{ id: string | null }>('scene.load', { id });
    this._currentSceneId.set(res.id);
  }
  
  async refreshCurrentScene(): Promise<void> {
    try {
      const res = await this.request<{ id: string | null }>('scene.current');
      this.zone.run(() => this._currentSceneId.set(res.id));
    } catch { /* not connected yet */ }
  }

  dispose(): void {
    this.unlisten.forEach(u => u());
    this.unlisten = [];
  }

  // ── requests ───────────────────────────────────────────────────────────────────────

  request<T>(method: string, params?: unknown): Promise<T> {
    return invoke<T>('engine_request', { method, params: params ?? null });
  }

  getTree(): Promise<EngineTreeNode[]> {
    return this.request<EngineTreeNode[]>('nodes.tree');
  }

  getNode(id: string): Promise<EngineNodeDetail> {
    return this.request<EngineNodeDetail>('node.get', { id });
  }

  /** e.g. setValue('player', 'TransformProperty', 'Transform.Position', [1, 2, 3]) */
  setValue(
    id: string,
    property: string,
    path: string,
    value: string | number | boolean | number[],
  ): Promise<EngineNodeDetail> {
    return this.request<EngineNodeDetail>('node.set', { id, property, path, value });
  }

  setEnabled(id: string, enabled: boolean): Promise<EngineNodeDetail> {
    return this.request<EngineNodeDetail>('node.enable', { id, enabled });
  }

  async refreshTree(): Promise<void> {
    try {
      const tree = await this.getTree();
      this.zone.run(() => this._tree.set(tree));
    } catch (err) {
      console.error('[EngineIpc] Failed to fetch tree:', err);
    }
  }

  // ── events ─────────────────────────────────────────────────────────────────────────

  private onEngineEvent(e: EngineEvent): void {
    this.events$.next(e);

    if (e.event === 'nodes.changed') {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = setTimeout(() => void this.refreshTree(), 100);
    }
  }
}