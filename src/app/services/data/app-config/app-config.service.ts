import { Injectable, computed, inject } from '@angular/core';
import { defer, map, Observable } from 'rxjs';
import { AppConfig, WindowTabsState } from '../../../model/app-config.model';
import { WindowKind } from '../../../model/window-kind.model';
import { AppStoreService } from './app-store.service';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly store = inject(AppStoreService);

  readonly config = this.store.data;                       // AppFile | null
  readonly hasConfig = computed(() => this.config() !== null);

  readonly version = computed(() => this.config()?.version ?? null);
  readonly versionTags = computed(() => this.config()?.versionTags ?? []);
  readonly appTitle = computed(() => this.config()?.appTitle ?? null);
  readonly engineProjectPath = computed(() => this.config()?.engineProjectPath ?? null);
  readonly currentProjectId = computed(() => this.config()?.currentProjectId ?? null);

  readonly settings = computed(() => this.config()?.settings ?? null);
  readonly themeColor = computed(() => this.settings()?.themeColor ?? null);
  readonly themeFont = computed(() => this.settings()?.themeFont ?? null);
  readonly fontSize = computed(() => this.settings()?.fontSize ?? null);
  readonly backgroundPreset = computed(() => this.settings()?.backgroundPreset ?? null);
  readonly background = computed(() => this.settings()?.background ?? null);

  load() {
    return defer(() => this.store.load());
  }

  update(partial: Partial<AppConfig>): Observable<void> {
    return defer(() => this.store.update(d => ({ ...d, ...partial }))).pipe(map(() => void 0));
  }

  updateSettings(partial: Partial<AppConfig['settings']>): Observable<void> {
    return defer(() => this.store.update(d => ({ ...d, settings: { ...d.settings, ...partial } })))
      .pipe(map(() => void 0));
  }

  updateWindowTabs(kind: WindowKind, state: WindowTabsState): Observable<void> {
    return defer(() => this.store.update(d => ({ ...d, windowTabs: { ...d.windowTabs, [kind]: state } })))
      .pipe(map(() => void 0));
  }
}