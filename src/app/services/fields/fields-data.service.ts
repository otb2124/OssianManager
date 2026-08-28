// settings-page-context.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { RoutesService } from '../routes/routes.service';
import { FieldConfig } from '../../components/property-list/field-list';
import { SETTINGS_PAGE_CONFIGS as FIELD_CONFIGS } from '../../model/fields-config.model';

@Injectable({ providedIn: 'root' })
export class FieldsDataService {
  private router = inject(Router);
  private routesService = inject(RoutesService);

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

  readonly currentConfig = computed<FieldConfig[] | null>(() => {
    const id = this.currentDataId();
    return id ? FIELD_CONFIGS[id] ?? null : null;
  });
}