import { Route } from "@angular/router";
import { RouteAction } from "./services/system/action-registry.service";
import { windowKind, WindowKind } from "./services/system/windows/window-kind";

export interface RouteChild extends Route {
  title?: string;
  icon?: string;
  children?: RouteChild[];
  displayBreadcrumb?: boolean;
  displayModule?: boolean;
  /** This route is listed in the sidebar (together with its siblings that also have the flag). */
  displayOnProjectLoad?: boolean;
  actions?: RouteAction[];
  navigatesModule?: boolean;
  data?: { id:string };
  windows?: WindowKind[];
}

const allRoutes: RouteChild[] =
[
  {
    path: '',
    redirectTo: 'workspace',
    pathMatch: 'full',
  },
  {
    path: 'workspace',
    title: 'Workspace',
    displayBreadcrumb: true,
    windows: ['launcher', 'editor'],
    loadComponent: () => import('./pages/scene/scene-page.js').then(m => m.ScenePage),
  },
  {
    path: 'empty',
    title: undefined,
    displayBreadcrumb: false,
    loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
  }
]

function prune(list: RouteChild[], kind: WindowKind): RouteChild[] {
  const kept = list
    .filter(r => !r.windows || r.windows.includes(kind))
    .map(r => r.children ? { ...r, children: prune(r.children, kind) } : r);

  return kept.filter(r =>
    typeof r.redirectTo !== 'string' ||
    r.redirectTo.startsWith('/') ||
    kept.some(s => s.path === r.redirectTo)
  );
}

export const routes: RouteChild[] = prune(allRoutes, windowKind);