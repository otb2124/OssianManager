import { Injectable, signal, computed, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { RoutesService } from './routes.service';

export interface SidebarNavItem {
  label: string;
  icon: string;
  route: string;
  tag?: string;
  tagSeverity?: 'info' | 'success' | 'warn' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class SidebarNavService {

  private readonly router = inject(Router);
  private readonly routesService = inject(RoutesService);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)),
    { initialValue: null }
  );

  readonly expanded = signal(false);

  // One lookup per navigation; visible / items / sectionTitle all derive from it.
  private readonly sidebar = computed(() => {
    this.currentUrl(); // re-run on navigation
    return this.routesService.getSidebar(this.router.url);
  });

  readonly visible = computed<boolean>(() => this.sidebar() !== null);

  readonly items = computed<SidebarNavItem[]>(() =>
    (this.sidebar()?.items ?? []).map(({ route, path }) => ({
      label: route.title ?? route.path ?? '',
      icon: route.icon ?? '',
      route: path,
    }))
  );

  readonly sectionTitle = computed<string>(() => this.sidebar()?.title ?? '');

  toggle(): void {
    this.expanded.update(v => !v);
  }

}