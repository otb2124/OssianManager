import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { PersistenceService } from '../../persistence/persistence.service';
import { AppConfigService } from '../app-config/app-config.service';
import { ResourceEntry } from '../../../model/resource.model';

@Injectable({ providedIn: 'root' })
export class ResourceCatalogService {

  private readonly persistence = inject(PersistenceService);
  private readonly appConfig = inject(AppConfigService);

  private readonly contentRelative = '../Content';
  private readonly resourcesFile = 'ConfigFiles/Core/resources.json';

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
      const enginePath = this.appConfig.engineProjectPath();
      untracked(() => this.load(enginePath));
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
    const enginePath = this.appConfig.engineProjectPath();
    return enginePath ? `${enginePath}/${this.contentRelative}/${relative}` : null;
  }

  reload(): void {
    this.load(this.appConfig.engineProjectPath());
  }

  private load(enginePath: string | null): void {
    if (!enginePath) {
      this._entries.set([]);
      this._error.set(null);
      return;
    }
    const path = `${enginePath}/${this.contentRelative}/${this.resourcesFile}`;
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