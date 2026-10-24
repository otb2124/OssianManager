import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { RouteChild, routes } from '../../app.routes';

export interface SidebarModel {
  title: string;
  items: { route: RouteChild; path: string }[];
}

@Injectable({ providedIn: 'root' })
export class RoutesService {

  private router = inject(Router);

  // Get all top-level displayable routes
  getModules(onlyProjectRoutes?: boolean): RouteChild[] {
    return routes.filter(r =>
      r.displayBreadcrumb &&
      r.path &&
      (!onlyProjectRoutes || r.displayOnProjectLoad)
    );
  }

  // Get the top-level route for a given url
  getModule(url: string): RouteChild | null {
    const topSegment = url.split('/').filter(Boolean)[0] ?? '';
    return routes.find(r => r.path === topSegment) ?? null;
  }

  // Get displayable children of a route
  getChildren(route: RouteChild): RouteChild[] {
    return (route.children ?? []).filter(c => c.displayBreadcrumb && c.path && !c.redirectTo);
  }

  // Build full title from url: "General - Home" or "Project - Overview - Detail"
  getFullTitle(url: string): string {
    const parts = this.getTitleParts(url);
    return parts.join(' - ');
  }

  // Get current url's route
  getCurrent(): RouteChild | null {
    return this.findByPath(this.router.url);
  }

  getFullPath(target: RouteChild): string | null {
    const walk = (nodes: RouteChild[], prefix: string): string | null => {
      for (const node of nodes) {
        const path = node.path ? `${prefix}/${node.path}` : prefix;
        if (node === target) return path;
        if (node.children) {
          const found = walk(node.children, path);
          if (found) return found;
        }
      }
      return null;
    };

    return walk(routes, '');
  }

  private consume(route: RouteChild, segments: string[], i: number): number {
    if (!route.path) return 0;
    const parts = route.path.split('/');
    if (i + parts.length > segments.length) return 0;
    return parts.every((p, k) => p.startsWith(':') || p === segments[i + k]) ? parts.length : 0;
  }

  isParam(route: RouteChild): boolean {
    return !!route.path?.split('/').some(p => p.startsWith(':'));
  }

  /** Walks the route tree along a url. Returns true if the whole url was matched. */
  private walk(
    url: string,
    visit: (match: RouteChild, consumed: string[], level: RouteChild[]) => boolean | void
  ): boolean {
    const segments = url.split(/[?#]/)[0].split('/').filter(Boolean);
    let level: RouteChild[] = routes;
    let i = 0;

    while (i < segments.length) {
      let match: RouteChild | undefined;
      let n = 0;
      for (const r of level) {
        n = this.consume(r, segments, i);
        if (n) { match = r; break; }
      }
      if (!match) return false;
      if (visit(match, segments.slice(i, i + n), level) === false) return true;
      i += n;
      level = match.children ?? [];
    }
    return true;
  }

  findByPath(fullPath: string): RouteChild | null {
    let last: RouteChild | null = null;
    const ok = this.walk(fullPath, m => { last = m; });
    return ok ? (last as RouteChild | null) : null;
  }

  getTitleParts(url: string): string[] {
    const parts: string[] = [];
    this.walk(url, (match, consumed) => {
      if (match.title) parts.push(match.title);
      // param segments contribute their value: "Project - Scene - terrainScene"
      match.path!.split('/').forEach((p, k) => {
        if (p.startsWith(':')) parts.push(decodeURIComponent(consumed[k]));
      });
    });
    return parts;
  }

  /** Tab label: the param value for param routes ("terrainScene"), otherwise the route title. */
  getLabel(url: string): string {
    const route = this.findByPath(url);
    if (!route) return '';
    if (!this.isParam(route)) return route.title ?? '';
    return this.getTitleParts(url).at(-1) ?? route.title ?? '';
  }

  getSiblings(url: string): RouteChild[] {
    let siblings: RouteChild[] = [];
    this.walk(url, (_m, _c, level) => { siblings = level; });
    return siblings.filter(r => r.displayBreadcrumb && r.path && !r.redirectTo && !this.isParam(r));
  }

  /**
   * Sidebar for a url. A route with `displaySidebar` is listed in the sidebar together with
   * the siblings that have the flag; the sidebar title is the parent route's title.
   * Returns null when the url is not on a sidebar route.
   */
  getSidebar(url: string): SidebarModel | null {
    let result: SidebarModel | null = null;
    const prefix: string[] = [];
    let parent: RouteChild | null = null;

    this.walk(url, (match, consumed, level) => {
      if (true) {
        const base = '/' + prefix.join('/');
        result = {
          title: parent?.title ?? '',
          items: level
            .filter(r => true && r.path && !r.redirectTo && !this.isParam(r))
            .map(r => ({ route: r, path: `${base}/${r.path}` })),
        };
        return false; // stop
      }
      prefix.push(...consumed);
      parent = match;
      return true;
    });

    return result;
  }
}