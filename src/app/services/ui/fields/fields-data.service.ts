// settings-page-context.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { FieldConfig } from '../../../components/fields/field-list/field-list';
import { RoutesService } from '../../routes/routes.service';
import { NODE_CONTROL_FIELDS_CONFIG, SETTINGS_PAGE_FIELDS_CONFIG, SETTINGS_PAGES } from '../../../model/fields.config.model';
import { BackgroundService } from '../background/background.service';
import { ShaderDef } from '../../../model/shader.model';

/** One header + its fields, ready for the settings page to render. */
export interface SettingsSectionView {
  id: string;
  header: string;
  fields: FieldConfig[];
}

@Injectable({ providedIn: 'root' })
export class FieldsDataService {
  private router = inject(Router);
  private routesService = inject(RoutesService);
  private background = inject(BackgroundService);

  // Tracks the current url; updates on every completed navigation.
  private currentUrl = signal(this.router.url);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.currentUrl.set(this.router.url));
  }

  // Resolves data.id off the current route via the existing
  // RoutesService lookup — no new path-matching logic needed.
  readonly currentDataId = computed<string | null>(() => {
    const route = this.routesService.findByPath(this.currentUrl());
    const id = route?.data?.['id'];
    return typeof id === 'string' ? id : null;
  });

  /** Sections of the current settings page (null when the route is not a settings page). */
  readonly currentSections = computed<SettingsSectionView[] | null>(() => {
    const id = this.currentDataId();
    const sections = id ? SETTINGS_PAGES[id] ?? null : null;
    if (!sections) return null;
    return sections.map(s => ({
      id: s.id,
      header: s.header,
      fields: (SETTINGS_PAGE_FIELDS_CONFIG[s.id] ?? []).map(f => this.withLiveOptions(f)),
    }));
  });

  private withLiveOptions(field: FieldConfig): FieldConfig {
    if (field.kind === 'image-select' && field.path === 'backgroundPreset') {
      return {
        ...field,
        options: Object.values(this.background.presets()).map(def => ({
          value: def.id,
          label: def.name,
          imageUrl: this.presetThumbnail(def),
        })),
      };
    }
    return field;
  }

  presetThumbnail(def: ShaderDef): string {
    let hue = 0;
    for (const ch of def.id) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
      `<stop offset='0' stop-color='hsl(${hue},70%,45%)'/>` +
      `<stop offset='1' stop-color='hsl(${(hue + 60) % 360},70%,15%)'/>` +
      `</linearGradient></defs><rect width='96' height='96' fill='url(#g)'/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

}