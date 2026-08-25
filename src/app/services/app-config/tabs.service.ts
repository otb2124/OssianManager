import { Injectable, inject, signal, effect } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { AppConfigService } from '../app-config/app-config.service';
import { RoutesService } from '../routes/routes.service';
import { RouteChild, routes } from '../../app.routes';
import { ProjectService } from '../projects/project.service';

@Injectable({ providedIn: 'root' })
export class TabsService {

  private router = inject(Router);
  private appConfigService = inject(AppConfigService);
  private routesService = inject(RoutesService);
  private projectService = inject(ProjectService);

  private readonly _tabs = signal<RouteChild[]>([]);
  private readonly _activeTab = signal<string>('');

  readonly tabs = this._tabs.asReadonly();
  readonly activeTab = this._activeTab.asReadonly();

  constructor() {
    toObservable(this.appConfigService.hasConfig).pipe(
      filter(loaded => loaded),
    ).subscribe(() => this.init());

    // Close project-only tabs when project is cleared
    effect(() => {
      const hasProject = this.projectService.hasProject();
      if (!hasProject) {
        this.closeProjectTabs();
      }
    });
  }

  private closeProjectTabs(): void {
    const projectPaths = new Set(
      routes
        .filter(r => r.displayOnProjectLoad && r.path)
        .map(r => `/${r.path}`)
    );

    const updated = this._tabs().filter(t => {
      const topSegment = '/' + (t.path ?? '').split('/').filter(Boolean)[0];
      return !projectPaths.has(topSegment);
    });

    if (updated.length === this._tabs().length) return;

    this._tabs.set(updated);

    const activeStillExists = updated.some(t => t.path === this._activeTab());
    if (!activeStillExists) {
      if (updated.length === 0) {
        this._activeTab.set('');
        this.persist();
        this.router.navigate(['/empty']);
        return;
      } else {
        const next = updated[updated.length - 1];
        this.router.navigate([next.path]);
      }
    }

    this.persist();
  }

  private init(): void {
    const config = this.appConfigService.config();

    if (config?.openTabs?.length) {
      const restored = config.openTabs
        .map(path => this.resolveTab(path))
        .filter((t): t is RouteChild => !!t);

      this._tabs.set(restored);
      const savedActive = config.activeTab ?? '';
      this._activeTab.set(savedActive);
      if (savedActive) {
        this.router.navigate([savedActive]);
      }
    }

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      this.onNavigate(e.urlAfterRedirects);
    });

    if (!config?.openTabs?.length) {
      this.onNavigate(this.router.url);
    }
  }

  private onNavigate(url: string): void {
    if (url === '/empty') return;

    const tab = this.resolveTab(url);
    if (!tab) return;

    this._activeTab.set(tab.path!);

    const exists = this._tabs().some(t => t.path === tab.path);
    if (!exists) this._tabs.update(tabs => [...tabs, tab]);

    this.persist();
  }

  private persist(): void {
    if (!this.appConfigService.hasConfig()) return;
    this.appConfigService.update({
      openTabs: this._tabs().map(t => t.path).filter((p): p is string => !!p),
      activeTab: this._activeTab(),
    }).subscribe();
  }

  private resolveTab(url: string): RouteChild | null {
    const found = this.routesService.findByPath(url);
    if (!found) return null;
    return {
      ...found,
      path: url,
      //title: this.routesService.getT(url),
    };
  }

  activateTab(tab: RouteChild): void {
    this.router.navigate([tab.path]);
  }

  closeTab(tab: RouteChild): void {
    const tabs = this._tabs();
    const index = tabs.indexOf(tab);
    const updated = tabs.filter(t => t.path !== tab.path);
    this._tabs.set(updated);

    if (tab.path === this._activeTab()) {
      if (updated.length === 0) {
        this._activeTab.set('');
        this.persist();
        this.router.navigate(['/empty']);
        return;
      } else {
        const next = updated[index] ?? updated[index - 1];
        this.router.navigate([next.path]);
      }
    }

    this.persist();
  }
}