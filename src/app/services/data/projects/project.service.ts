import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin, map, Observable, switchMap, of, catchError, tap, filter, take, shareReplay } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { AppConfigService } from '../app-config/app-config.service';
import { HydratedProjectRecord, ProjectRecord, hydrateRecord, serializeRecord } from '../../../model/project-record.model';
import { ProjectConfig } from '../../../model/project-config.model';
import { NotificationService } from '../../notifications/notification.service';
import { UserTagService } from '../user-tags/user-tag.service';
import { ProjectRegistryRepository } from './project-registry.repository';
import { ProjectConfigRepository } from './project-config.repository';
import { resolveProjectPath } from '../../utils/path.util';

export interface ProjectEntry {
  project: HydratedProjectRecord;
  directoryPath: string;
}

/**
 * The open project (signals) plus the project catalog.
 * Reading and writing files is delegated to ProjectRegistryRepository / ProjectConfigRepository,
 * record <-> JSON mapping lives in project-record.model.ts; this service keeps the state and the user notifications.
 */
@Injectable({ providedIn: 'root' })
export class ProjectService {

  private registry = inject(ProjectRegistryRepository);
  private configs = inject(ProjectConfigRepository);
  private tagService = inject(UserTagService);
  private appConfigService = inject(AppConfigService);
  private notifications = inject(NotificationService);

  // ─── Current project state ───────────────────────────────────────────────

  private readonly _currentProject = signal<HydratedProjectRecord | null>(null);
  private readonly _currentConfig = signal<ProjectConfig | null>(null);
  private readonly _currentDirectoryPath = signal<string | null>(null);

  readonly currentProject = this._currentProject.asReadonly();
  readonly currentConfig = this._currentConfig.asReadonly();

  readonly hasProject = computed(() => this._currentProject() !== null);
  readonly projectId = computed(() => this._currentProject()?.id ?? null);
  readonly projectName = computed(() => this._currentProject()?.title ?? null);
  readonly hasConfig = computed(() => this._currentConfig() !== null);
  readonly resDirectory = computed(() => this.resolveDir(this._currentConfig()?.resDirectory));
  readonly targetDirectory = computed(() => this.resolveDir(this._currentConfig()?.targetDirectory));

  readonly projectData = computed(() => this._currentConfig()?.data ?? null);

  readonly currentDirectoryPath = this._currentDirectoryPath.asReadonly();

  private readonly currentProject$ = toObservable(this._currentProject);

  // ─── State actions ────────────────────────────────────────────────────────

  setProject(project: HydratedProjectRecord, directoryPath: string): Observable<ProjectConfig> {
    this._currentProject.set(project);
    this._currentDirectoryPath.set(directoryPath);
    this.appConfigService.update({ currentProjectId: project.id }).subscribe();

    const config$ = this.loadConfig(project, directoryPath).pipe(shareReplay(1));
    config$.subscribe({
      error: err => this.notifications.error('Could not load the project config', String(err)),
    });

    this.notifications.info(`Project opened`, project.title);
    return config$;
  }

  updateCurrentProject(partial: Partial<HydratedProjectRecord>): void {
    const current = this._currentProject();
    const directoryPath = this._currentDirectoryPath();
    if (!current || !directoryPath) return;
    const updated = { ...current, ...partial, updatedAt: new Date() };
    this._currentProject.set(updated);
    this.saveRecord(updated, directoryPath).subscribe();
  }

  clearProject(): void {
    const title = this._currentProject()?.title;
    this._currentProject.set(null);
    this._currentConfig.set(null);
    this._currentDirectoryPath.set(null);
    this.appConfigService.update({ currentProjectId: undefined }).subscribe();
    this.notifications.info('Project closed', title);
  }

  // ─── Catalog queries ──────────────────────────────────────────────────────

  getAll(): Observable<ProjectEntry[]> {
    return forkJoin({
      entries: this.registry.getAll(),
      tags: this.tagService.getAll(),
    }).pipe(
      switchMap(({ entries, tags }) => {
        if (!entries.length) return of([]);
        return forkJoin(
          entries.map(entry =>
            this.configs.read(entry.directoryPath).pipe(
              map(config => ({
                project: hydrateRecord(config.projectRecord!, tags),
                directoryPath: entry.directoryPath,
              })),
            ),
          ),
        );
      }),
    );
  }

  getFavorites(): Observable<ProjectEntry[]> {
    return this.getAll().pipe(map(items => items.filter(i => i.project.isFavorite)));
  }

  getById(id: string): Observable<ProjectEntry | undefined> {
    return this.getAll().pipe(map(items => items.find(i => i.project.id === id)));
  }

  // ─── Catalog persistence ──────────────────────────────────────────────────

  save(project: HydratedProjectRecord, directoryPath: string): Observable<void> {
    return this.registry.save({ id: project.id, directoryPath }).pipe(
      switchMap(() => this.saveRecord(project, directoryPath)),
    );
  }

  delete(id: string): Observable<void> {
    return this.registry.delete(id).pipe(
      tap(() => this.notifications.success('Project removed', id)),
    );
  }

  /**
   * Registers a project folder. A folder with a project record is imported as it is;
   * a folder without a readable config (or without a record in it) becomes a new project.
   * Failures while saving or registering are NOT mistaken for "no config" and reach the caller.
   */
  importFromDirectory(directoryPath: string): Observable<HydratedProjectRecord> {
    return this.configs.read(directoryPath).pipe(
      catchError(() => of(null)),
      switchMap(config => config?.projectRecord
        ? this.registerExisting(config.projectRecord, directoryPath)
        : this.createForDirectory(directoryPath)),
    );
  }

  // ─── Project config ───────────────────────────────────────────────────────

  loadConfig(project: HydratedProjectRecord, directoryPath: string): Observable<ProjectConfig> {
    const record = serializeRecord(project);
    return this.configs.readOrCreate(directoryPath, record).pipe(
      tap(config => {
        const synced: ProjectConfig = { ...config, projectRecord: record };
        this.configs.write(directoryPath, synced).subscribe();
        this._currentConfig.set(synced);
      }),
    );
  }

  loadConfigFromCurrent(): Observable<ProjectConfig> {
    const directoryPath = this._currentDirectoryPath();
    if (!directoryPath) throw new Error('No current project directory');
    return this.currentProject$.pipe(
      filter(p => !!p),
      take(1),
      switchMap(p => this.loadConfig(p!, directoryPath)),
    );
  }

  updateConfig(partial: Partial<ProjectConfig>): Observable<void> {
    const project = this._currentProject();
    const config = this._currentConfig();
    const directoryPath = this._currentDirectoryPath();
    if (!project || !config || !directoryPath) throw new Error('No current project or config');
    const updated: ProjectConfig = {
      ...config,
      ...partial,
      projectRecord: serializeRecord(project),
    };
    return this.configs.write(directoryPath, updated).pipe(
      tap(() => this._currentConfig.set(updated)),
    );
  }

  clearConfig(): void {
    this._currentConfig.set(null);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /** Writes the project record into the folder's config, telling the user which fields changed. */
  private saveRecord(project: HydratedProjectRecord, directoryPath: string): Observable<void> {
    const record = serializeRecord(project);
    return this.configs.readOrDefault(directoryPath).pipe(
      tap(config => this.notifyRecordChanges(project.title, config.projectRecord, record)),
      switchMap(config => this.configs.write(directoryPath, { ...config, projectRecord: record })),
    );
  }

  private notifyRecordChanges(title: string, stored: ProjectRecord | undefined, next: ProjectRecord): void {
    if (!stored) return;
    const changes = (Object.keys(next) as (keyof ProjectRecord)[])
      .filter(key => JSON.stringify(stored[key]) !== JSON.stringify(next[key]))
      .map(key => `${key}: ${JSON.stringify(stored[key])} → ${JSON.stringify(next[key])}`);
    if (changes.length) {
      this.notifications.info(`${title} record saved`, changes.join('\n'));
    }
  }

  private registerExisting(record: ProjectRecord, directoryPath: string): Observable<HydratedProjectRecord> {
    return this.tagService.getAll().pipe(
      map(tags => hydrateRecord(record, tags)),
      switchMap(project => this.registry.save({ id: project.id, directoryPath }).pipe(map(() => project))),
      tap(project => this.notifications.success('Project imported', project.title)),
    );
  }

  private createForDirectory(directoryPath: string): Observable<HydratedProjectRecord> {
    const title = directoryPath.split(/[\\/]/).pop() ?? 'Imported Project';
    const project: HydratedProjectRecord = {
      id: crypto.randomUUID(),
      title,
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    };
    return this.saveRecord(project, directoryPath).pipe(
      switchMap(() => this.registry.save({ id: project.id, directoryPath })),
      map(() => project),
      tap(() => this.notifications.success('Project created', title)),
    );
  }

  private resolveDir(path: string | undefined): string | null {
    const projectDir = this._currentDirectoryPath();
    return projectDir && path ? resolveProjectPath(projectDir, path) : null;
  }
}
