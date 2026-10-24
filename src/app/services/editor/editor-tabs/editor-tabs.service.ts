import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FsEntry } from '../../persistence/persistence.service';
import { isTextFile } from '../../utils/file-king.util';
import { AppStoreService } from '../../data/app-config/app-store.service';

export const SCENE_EDITOR_URL = '/project/scene-editor';

export type OpenRequest =
  | { kind: 'scene'; id: string; title: string; nonce: number }
  | { kind: 'file'; path: string; title: string; nonce: number };

/**
 * Anyone can ask for a scene/file tab. The request is kept until the ScenePage
 * (which may not exist yet, because we may be navigating to it) consumes it.
 */
@Injectable({ providedIn: 'root' })
export class EditorTabsService {
  private readonly router = inject(Router);
  private readonly store = inject(AppStoreService);
  
  private nonce = 0;

  private readonly _request = signal<OpenRequest | null>(null);
  readonly request = this._request.asReadonly();

  openScene(id: string, title?: string): void {
    this._request.set({ kind: 'scene', id, title: title || id, nonce: ++this.nonce });
    this.ensureRoute();
  }

  openFile(entry: FsEntry): void {
    if (entry.isDirectory || !isTextFile(entry.name, this.store.data()?.editor.textExtensions ?? [])) return;
    this._request.set({ kind: 'file', path: entry.path, title: entry.name, nonce: ++this.nonce });
    this.ensureRoute();
  }

  consume(): void {
    this._request.set(null);
  }

  private ensureRoute(): void {
    if (!this.router.url.startsWith(SCENE_EDITOR_URL)) void this.router.navigateByUrl(SCENE_EDITOR_URL);
  }
}