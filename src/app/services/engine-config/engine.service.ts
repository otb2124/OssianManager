import { Injectable, inject, signal, computed } from '@angular/core';
import { EMPTY, Observable, tap } from 'rxjs';
import { PersistenceService } from '../persistence/persistence.service';
import { AppConfigService } from '../app-config/app-config.service';
import { EngineConfig } from '../../model/engine-config.model';

@Injectable({ providedIn: 'root' })
export class EngineService {

  private persistence = inject(PersistenceService);
  private appConfigService = inject(AppConfigService);

  private readonly configFileName = '.ossian.engine.json';

  private readonly _config = signal<EngineConfig | null>(null);
  readonly config = this._config.asReadonly();
  readonly hasConfig = computed(() => this._config() !== null);
  readonly version = computed(() => this._config()?.version ?? null);
  readonly versionTags = computed(() => this._config()?.versionTags ?? []);
  readonly appTitle = computed(() => this._config()?.appTitle ?? null);
  readonly executablePath = computed(() => this._config()?.executablePath ?? null);

  load(): Observable<EngineConfig> {
    const engineProjectPath = this.appConfigService.engineProjectPath();
    if (!engineProjectPath) return EMPTY;
    const path = this.configPath(engineProjectPath);
    return this.persistence.readAbsolute<EngineConfig>(path).pipe(
      tap(config => this._config.set(config))
    );
  }

  update(partial: Partial<EngineConfig>): Observable<void> {
    const current = this._config();
    const engineProjectPath = this.appConfigService.engineProjectPath();
    if (!current || !engineProjectPath) return EMPTY;
    const updated = { ...current, ...partial };
    return this.persistence.writeAbsolute(this.configPath(engineProjectPath), updated).pipe(
      tap(() => this._config.set(updated))
    );
  }

  clear(): void {
    this._config.set(null);
  }

  private configPath(engineProjectPath: string): string {
    return `${engineProjectPath}/${this.configFileName}`;
  }
}