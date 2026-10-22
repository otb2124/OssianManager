import { Injectable, inject, signal, computed } from '@angular/core';
import { EMPTY, Observable, tap } from 'rxjs';
import { AppConfigService } from '../app-config/app-config.service';
import { ProjectService } from '../projects/project.service';
import { EngineConfig } from '../../../model/engine-config.model';
import { PersistenceService } from '../../persistence/persistence.service';
import { joinPath } from '../../utils/path.util';

@Injectable({ providedIn: 'root' })
export class EngineService {

  private persistence = inject(PersistenceService);
  private appConfigService = inject(AppConfigService);
  private projectService = inject(ProjectService);

  /** No project open (launcher): the engine's own Content folder. */
  private readonly fallbackRelativePath = '../Content/ConfigFiles/Core/tree.json';

  private readonly _config = signal<EngineConfig | null>(null);
  readonly config = this._config.asReadonly();
  readonly hasConfig = computed(() => this._config() !== null);
  readonly version = computed(() => this._config()?.version ?? null);
  readonly versionTags = computed(() => this._config()?.versionTags ?? []);
  readonly appTitle = computed(() => this._config()?.appTitle ?? null);
  readonly executablePath = computed(() => this._config()?.executablePath ?? null);

  load(): Observable<EngineConfig> {
    const path = this.configPath();
    if (!path) {
      console.warn('[EngineService] No engine path or open project; config not loaded.');
      return EMPTY;
    }
    console.log('[EngineService] loading', path);
    return this.persistence.readAbsolute<EngineConfig>(path).pipe(
      tap(config => this._config.set(config))
    );
  }

  update(partial: Partial<EngineConfig>): Observable<void> {
    const current = this._config();
    const path = this.configPath();
    if (!current || !path) return EMPTY;
    const updated = { ...current, ...partial };
    return this.persistence.writeAbsolute(path, updated).pipe(
      tap(() => this._config.set(updated))
    );
  }

  clear(): void {
    this._config.set(null);
  }

  /** The open project's tree.json, else the engine's own. */
  private configPath(): string | null {
    const content = this.projectService.resDirectory();
    if (content) return joinPath(content, 'ConfigFiles', 'Core', 'tree.json');

    const enginePath = this.appConfigService.engineProjectPath();
    return enginePath ? `${enginePath}/${this.fallbackRelativePath}` : null;
  }
}