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

  readonly visible = computed<boolean>(() => {
    this.currentUrl();
    return this.routesService.getSidebarSection(this.router.url) !== null;
  });

  readonly items = computed<SidebarNavItem[]>(() => {
    this.currentUrl(); // re-run on navigation
    const section = this.routesService.getSidebarSection(this.router.url);
    if (!section) return [];
  
    const basePath = this.routesService.getFullPath(section);
    if (!basePath) return [];
  
    return this.routesService.getChildren(section).map(child => ({
      label: child.title ?? child.path ?? '',
      icon: child.icon ?? '',
      route: `${basePath}/${child.path}`,
    }));
  });

  toggle(): void {
    this.expanded.update(v => !v);
  }

}