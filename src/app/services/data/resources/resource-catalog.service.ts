import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { PersistenceService } from '../../persistence/persistence.service';
import { ResourceEntry } from '../../../model/resource.model';
import { WorkspacePathsService } from '../workspace/workspace-paths.service';

@Injectable({ providedIn: 'root' })
export class ResourceCatalogService {

  private readonly persistence = inject(PersistenceService);
  private readonly workspace = inject(WorkspacePathsService);

  private readonly _entries = signal<ResourceEntry[]>([]);
  private readonly _error = signal<string | null>(null);

  readonly entries = this._entries.asReadonly();
  readonly error = this._error.asReadonly();

  private readonly byId = computed(() => new Map(this._entries().map(e => [e.id, e])));

  /** target id -> resources whose `data` references it */
  private readonly referencedBy = computed(() => {
    const ids = this.byId();
    const map = new Map<string, ResourceEntry[]>();
    for (const entry of this._entries()) {
      for (const item of entry.data ?? []) {
        if (typeof item !== 'string' || !ids.has(item)) continue;
        const list = map.get(item);
        if (!list) map.set(item, [entry]);
        else if (!list.includes(entry)) list.push(entry);
      }
    }
    return map;
  });

  constructor() {
    effect(() => {
      const path = this.workspace.resourcesPath();   // reload when the project (or its content folder) changes
      untracked(() => this.load(path));
    });
  }

  get(id: string): ResourceEntry | undefined {
    return this.byId().get(id);
  }

  usedBy(id: string): ResourceEntry[] {
    return this.referencedBy().get(id) ?? [];
  }

  /** Absolute path of a file referenced from resources.json (paths there are relative to Content/). */
  contentPath(relative: string): string | null {
    return this.workspace.contentPath(relative);
  }

  reload(): void {
    this.load(this.workspace.resourcesPath());
  }

  private load(path: string | null): void {
    if (!path) {
      this._entries.set([]);
      this._error.set(null);
      return;
    }

    this.persistence.readAbsolute<ResourceEntry[]>(path).subscribe({
      next: list => {
        this._entries.set(Array.isArray(list) ? list : []);
        this._error.set(null);
      },
      error: err => {
        this._entries.set([]);
        this._error.set(String(err));
      },
    });
  }
}
