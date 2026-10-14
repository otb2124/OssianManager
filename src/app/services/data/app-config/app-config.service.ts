import { Injectable, inject, signal, computed } from '@angular/core';
import { EMPTY, Observable, switchMap, tap } from 'rxjs';
import { AppConfig, WindowTabsState } from '../../../model/app-config.model';
import { PersistenceService } from '../../persistence/persistence.service';
import { WindowKind } from '../../system/windows/window-kind';


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

  private mutate(fn: (disk: AppConfig) => AppConfig): Observable<void> {
    return this.persistence.read<AppConfig>(this.file).pipe(
      switchMap(disk => {
        const next = Object.fromEntries(
          Object.entries(fn(disk)).filter(([, v]) => v !== undefined)
        ) as unknown as AppConfig;
        return this.persistence.write(this.file, next).pipe(
          tap(() => this._config.set(next))
        );
      })
    );
  }

  update(partial: Partial<AppConfig>): Observable<void> {
    if (!this._config()) return EMPTY;
    return this.mutate(disk => ({ ...disk, ...partial }));
  }
  
  updateSettings(partial: Partial<AppConfig['settings']>): Observable<void> {
    if (!this._config()) throw new Error('AppConfig not loaded');
    return this.mutate(disk => ({ ...disk, settings: { ...disk.settings, ...partial } }));
  }
  
  updateWindowTabs(kind: WindowKind, state: WindowTabsState): Observable<void> {
    return this.mutate(disk => ({
      ...disk,
      windowTabs: { ...disk.windowTabs, [kind]: state },
    }));
  }
}