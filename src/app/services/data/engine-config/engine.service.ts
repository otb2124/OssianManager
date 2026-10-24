import { Injectable, inject, signal, computed } from '@angular/core';
import { EMPTY, Observable, tap } from 'rxjs';
import { EngineConfig } from '../../../model/engine-config.model';
import { PersistenceService } from '../../persistence/persistence.service';
import { WorkspacePathsService } from '../workspace/workspace-paths.service';

@Injectable({ providedIn: 'root' })
export class EngineService {

  private persistence = inject(PersistenceService);
  private workspace = inject(WorkspacePathsService);

  private readonly _config = signal<EngineConfig | null>(null);
  readonly config = this._config.asReadonly();
  readonly hasConfig = computed(() => this._config() !== null);
  readonly version = computed(() => this._config()?.version ?? null);
  readonly versionTags = computed(() => this._config()?.versionTags ?? []);
  readonly appTitle = computed(() => this._config()?.appTitle ?? null);
  readonly executablePath = computed(() => this._config()?.executablePath ?? null);

  load(): Observable<EngineConfig> {
    const path = this.workspace.engineConfigPath();
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
    const path = this.workspace.engineConfigPath();
    if (!current || !path) return EMPTY;
    const updated = { ...current, ...partial };
    return this.persistence.writeAbsolute(path, updated).pipe(
      tap(() => this._config.set(updated))
    );
  }

  clear(): void {
    this._config.set(null);
  }
}
