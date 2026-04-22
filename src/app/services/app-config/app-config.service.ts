import { Injectable, inject, signal, computed } from '@angular/core';
import { EMPTY, Observable, tap } from 'rxjs';
import { PersistenceService } from '../persistence/persistence.service';
import { AppConfig } from '../../model/app-config.model';

@Injectable({ providedIn: 'root' })
export class AppConfigService {

  private persistence = inject(PersistenceService);
  private readonly file = 'app.json';

  private readonly _config = signal<AppConfig | null>(null);
  readonly config = this._config.asReadonly();
  readonly hasConfig = computed(() => this._config() !== null);
  readonly version = computed(() => this._config()?.version ?? null);
  readonly versionTags = computed(() => this._config()?.versionTags ?? []);
  readonly appTitle = computed(() => this._config()?.appTitle ?? null);
  readonly currentProjectId = computed(() => this._config()?.currentProjectId ?? null);
  readonly themeColor = computed(() => this._config()?.settings.themeColor ?? null);
  readonly engineProjectPath = computed(() => this._config()?.engineProjectPath ?? null);

  load(): Observable<AppConfig> {
    return this.persistence.read<AppConfig>(this.file).pipe(
      tap(config => this._config.set(config))
    );
  }

  update(partial: Partial<AppConfig>): Observable<void> {
    const current = this._config();
    if (!current) return EMPTY;
    const merged = { ...current, ...partial };
    const updated = Object.fromEntries(
      Object.entries(merged).filter(([_, v]) => v !== undefined)
    ) as unknown as AppConfig;
    return this.persistence.write(this.file, updated).pipe(
      tap(() => this._config.set(updated))
    );
  }

  updateSettings(partial: Partial<AppConfig['settings']>): Observable<void> {
    const current = this._config();
    if (!current) throw new Error('AppConfig not loaded');
    return this.update({ settings: { ...current.settings, ...partial } });
  }
}