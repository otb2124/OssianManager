import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { RouteChild, routes } from '../../app.routes';

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

  // Get siblings of the current route at the same level
  getSiblings(url: string): RouteChild[] {
    const segments = url.split('/').filter(Boolean);
    if (segments.length === 0) return [];

    // Navigate to the parent level
    let level: RouteChild[] = routes;
    let parent: RouteChild | null = null;

    for (let i = 0; i < segments.length - 1; i++) {
      const match = level.find(r => r.path === segments[i]);
      if (!match) return [];
      parent = match;
      level = match.children ?? [];
    }

    return level.filter(r => r.displayBreadcrumb && r.path && !r.redirectTo);
  }

  // Build full title from url: "General - Home" or "Project - Overview - Detail"
  getFullTitle(url: string): string {
    const parts = this.getTitleParts(url);
    return parts.join(' - ');
  }

  // Get individual title segments for a url
  getTitleParts(url: string): string[] {
    const segments = url.split('/').filter(Boolean);
    const parts: string[] = [];
    let level: RouteChild[] = routes;

    for (const segment of segments) {
      const match = level.find(r => r.path === segment);
      if (!match) break;
      if (match.title) parts.push(match.title);
      level = match.children ?? [];
    }

    return parts;
  }

  // Find a route config by its full path
  findByPath(fullPath: string): RouteChild | null {
    const segments = fullPath.split('/').filter(Boolean);
    let level: RouteChild[] = routes;
    let match: RouteChild | null = null;

    for (const segment of segments) {
      match = level.find(r => r.path === segment) ?? null;
      if (!match) return null;
      level = match.children ?? [];
    }

    return match;
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


  getSidebarSection(url: string): RouteChild | null {
    const segments = url.split('/').filter(Boolean);
    let level: RouteChild[] = routes;
  
    for (const segment of segments) {
      const match = level.find(r => r.path === segment);
      if (!match) return null;
      if (match.displaySidebar) return match;
      level = match.children ?? [];
    }
  
    return null;
  }
}