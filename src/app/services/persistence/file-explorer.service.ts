import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { PersistenceService, FsEntry } from '../persistence/persistence.service';
import { ProjectService } from '../data/projects/project.service';
import { ResourceEntry } from '../../model/resource.model';
import { normalizePath, parentPath, samePath } from '../utils/path.util';
import { Subject, tap } from 'rxjs';
import { AppStoreService } from '../data/app-config/app-store.service';

export type InspectTarget =
  | { kind: 'fs'; entry: FsEntry }
  | { kind: 'resource'; resource: ResourceEntry };

const MAX_HISTORY = 100;

@Injectable({ providedIn: 'root' })
export class FileExplorerService {
  private readonly persistence = inject(PersistenceService);
  private readonly projectService = inject(ProjectService);
  private readonly store = inject(AppStoreService);

  private get maxHistory(): number { return this.store.data()?.editor.fileExplorer.maxHistory ?? 100; }

  private readonly _rootPath = signal<string | null>(null);
  private readonly _selectedEntry = signal<FsEntry | null>(null);
  private readonly _selectedResource = signal<ResourceEntry | null>(null);
  private readonly _inspected = signal<InspectTarget | null>(null);

  // navigation history: _history[_cursor] is always the current root
  private readonly _history = signal<string[]>([]);
  private readonly _cursor = signal(-1);
  private readonly _refreshTick = signal(0);

  readonly rootPath = this._rootPath.asReadonly();
  readonly selectedEntry = this._selectedEntry.asReadonly();
  readonly selectedResource = this._selectedResource.asReadonly();
  readonly inspected = this._inspected.asReadonly();

  /** Bumps on refresh(); the tree panel reloads when it changes. */
  readonly refreshTick = this._refreshTick.asReadonly();

  readonly projectRoot = computed(() => this.projectService.resDirectory());
  readonly parentOfRoot = computed(() => {
    const root = this._rootPath();
    return root ? parentPath(root) : null;
  });

  readonly canBack = computed(() => this._cursor() > 0);
  readonly canForward = computed(() => this._cursor() < this._history().length - 1);
  readonly canUp = computed(() => !!this.parentOfRoot());
  readonly canHome = computed(() => {
    const home = this.projectRoot();
    const root = this._rootPath();
    return !!home && !!root && !samePath(home, root);
  });

  readonly renamed$ = new Subject<{ from: string; to: string }>();

  constructor() {
    // Opening another project starts a fresh history at its content folder.
    effect(() => {
      const resDir = this.projectService.resDirectory();
      if (!resDir) return;
      untracked(() => {
        const start = normalizePath(resDir);
        this._history.set([start]);
        this._cursor.set(0);
        this.applyRoot(start);
      });
    });
  }

  // ── navigation ─────────────────────────────────────────────────────────

  navigate(path: string): void {
    const target = normalizePath(path);
    const current = this._rootPath();
    if (current && samePath(current, target)) return;

    const history = this._history().slice(0, this._cursor() + 1); // drop the forward entries
    history.push(target);
    if (history.length > this.maxHistory) history.shift();

    this._history.set(history);
    this._cursor.set(history.length - 1);
    this.applyRoot(target);
  }

  /** Kept for existing callers (browse button). */
  setRoot(path: string): void {
    this.navigate(path);
  }

  back(): void { this.go(this._cursor() - 1); }
  forward(): void { this.go(this._cursor() + 1); }

  up(): void {
    const parent = this.parentOfRoot();
    if (parent) this.navigate(parent);
  }

  home(): void {
    const home = this.projectRoot();
    if (home) this.navigate(home);
  }

  refresh(): void {
    this._refreshTick.update(n => n + 1);
  }

  private go(index: number): void {
    const history = this._history();
    if (index < 0 || index >= history.length) return;
    this._cursor.set(index);
    this.applyRoot(history[index]);
  }

  private applyRoot(path: string): void {
    this._rootPath.set(path);
    this._selectedEntry.set(null); // selection from the old root no longer makes sense
    if (this._inspected()?.kind === 'fs') this._inspected.set(null);
  }

  // ── selection ──────────────────────────────────────────────────────────

  select(entry: FsEntry | null): void {
    this._selectedEntry.set(entry);
    if (entry) this._inspected.set({ kind: 'fs', entry });
    else if (this._inspected()?.kind === 'fs') this._inspected.set(null);
  }

  selectResource(resource: ResourceEntry | null): void {
    this._selectedResource.set(resource);
    this._inspected.set(resource ? { kind: 'resource', resource } : null);
  }

  isSelected(entry: FsEntry): boolean {
    return this._selectedEntry()?.path === entry.path;
  }

  listDirectory(path: string) {
    return this.persistence.listDirectory(path);
  }

  rename(oldPath: string, newName: string) {
    return this.persistence.rename(oldPath, newName).pipe(
      tap(to => this.renamed$.next({ from: oldPath, to })),
    );
  }
}