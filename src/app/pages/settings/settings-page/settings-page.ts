// settings-page.ts
import { Component, OnDestroy, computed, inject } from '@angular/core';
import { FieldList, FieldTarget, PropertyPath } from '../../../components/field-list/field-list';
import { FieldsDataService } from '../../../services/ui/fields/fields-data.service';
import { AppConfigService } from '../../../services/data/app-config/app-config.service';
import { EngineService } from '../../../services/data/engine-config/engine.service';
import { NotificationService } from '../../../services/notifications/notification.service';
import { AppConfig, AppConfigSettings } from '../../../model/app-config.model';
import { EngineConfig } from '../../../model/engine-config.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-settings-page',
  imports: [FieldList],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage implements OnDestroy {

  protected context = inject(FieldsDataService);
  private appConfigService = inject(AppConfigService);
  private engineService = inject(EngineService);
  private notifications = inject(NotificationService);

  // data id 'settings-app'
  private readonly appTarget = new ConfigFieldTarget<AppConfig>(
    {
      versionString: 'version',
      versionTags: 'versionTags',
    },
    () => this.appConfigService.config(),
    patch => this.appConfigService.update(patch),
    err => this.notifications.error('Could not save app settings', String(err)),
  );

  // data id 'settings-engine' (tree.json)
  private readonly engineTarget = new ConfigFieldTarget<EngineConfig>(
    {
      enginePath: 'executablePath',
      engineVersionString: 'version',
      engineVersionTags: 'versionTags',
    },
    () => this.engineService.config(),
    patch => this.engineService.update(patch),
    err => this.notifications.error('Could not save engine settings', String(err)),
  );

  // data id 'settings-theme' (AppConfig.settings; ThemeService and BackgroundService follow it)
  private readonly themeTarget = new ConfigFieldTarget<AppConfigSettings>(
    {
      backgroundPreset: 'backgroundPreset',
      themeColor: 'themeColor',
      themeFont: 'themeFont',
      fontSize: 'fontSize',
    },
    () => this.appConfigService.config()?.settings ?? null,
    patch => this.appConfigService.updateSettings(patch),
    err => this.notifications.error('Could not save theme settings', String(err)),
    {
      defaults: { backgroundPreset: 'cosmos', themeColor: '#ffffff', themeFont: 'roboto', fontSize: 100 },
      instantPaths: ['backgroundPreset', 'themeFont'],
    },
  );

  /** Registry: data id -> target. Add an entry here for each new settings page. */
  private readonly targets: Record<string, FieldTarget> = {
    'settings-app': this.appTarget,
    'settings-engine': this.engineTarget,
    'settings-theme': this.themeTarget,
  };

  // New reference only when the data id changes, so FieldList re-runs ngOnChanges.
  protected readonly fieldTarget = computed<FieldTarget | undefined>(() => {
    const id = this.context.currentDataId();
    return id ? this.targets[id] : undefined;
  });

  ngOnDestroy(): void {
    this.appTarget.flush();
    this.engineTarget.flush();
    this.themeTarget.flush();
  }
}






export interface ConfigFieldTargetOptions<T> {
  /** Shown while the config has no value for a key. */
  defaults?: Partial<T>;
  /** Debounce for typed input (ms). */
  debounceMs?: number;
  /** Field paths that save immediately (selects, pickers) instead of waiting. */
  instantPaths?: readonly PropertyPath[];
}

/**
 * FieldTarget backed by a config service.
 *  - `keys` maps a field path (from SETTINGS_PAGE_FIELDS_CONFIG) to a config key.
 *  - Reads come from the live signal, so values appear once the config has loaded.
 *  - Writes are debounced and sent as one partial update.
 */
export class ConfigFieldTarget<T extends object> implements FieldTarget {

  /** Values the user changed that are not saved yet. They win over the config while pending. */
  private pending: Record<string, unknown> = {};
  private timer?: ReturnType<typeof setTimeout>;

  private readonly defaults: Partial<T>;
  private readonly debounceMs: number;
  private readonly instant: ReadonlySet<PropertyPath>;

  constructor(
    private readonly keys: Record<PropertyPath, keyof T & string>,
    private readonly read: () => T | null,
    private readonly save: (patch: Partial<T>) => Observable<void>,
    private readonly onError: (err: unknown) => void,
    options: ConfigFieldTargetOptions<T> = {},
  ) {
    this.defaults = options.defaults ?? {};
    this.debounceMs = options.debounceMs ?? 400;
    this.instant = new Set(options.instantPaths ?? []);
  }

  getField(path: PropertyPath): unknown {
    const key = this.keys[path];
    if (!key) return undefined;
    if (key in this.pending) return this.pending[key];
    return this.read()?.[key] ?? this.defaults[key];
  }

  setField(path: PropertyPath, value: unknown): void {
    const key = this.keys[path];
    if (!key) return;
    this.pending[key] = value;

    if (this.instant.has(path)) {
      this.flush();
      return;
    }
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.debounceMs);
  }

  /** Saves pending changes now. Also called when the page is destroyed so edits are not lost. */
  flush(): void {
    clearTimeout(this.timer);
    if (Object.keys(this.pending).length === 0) return;

    const sent = { ...this.pending };
    try {
      this.save(sent as Partial<T>).subscribe({
        error: err => {
          this.release(sent);
          this.onError(err);
        },
        complete: () => this.release(sent),
      });
    } catch (err) {
      this.release(sent);
      this.onError(err);
    }
  }

  /** Drops sent values from pending, unless the user changed them again while saving. */
  private release(sent: Record<string, unknown>): void {
    for (const key of Object.keys(sent)) {
      if (this.pending[key] === sent[key]) delete this.pending[key];
    }
  }
}