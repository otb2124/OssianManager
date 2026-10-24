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
    path: 'file',
    title: 'File',
    displayBreadcrumb: true,
    displayModule: true,
    children:
    [
      {
        path: '',
        redirectTo:
        windowKind === 'launcher' ? 'file' : 'project',
        pathMatch: 'full'
      },
      {
        path: 'action-new-project',
        title: 'New Project',
        displayModule: true,
        windows: ['launcher'],
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-import-project',
        title: 'Import Project...',
        displayModule: true,
        windows: ['launcher'],
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-scan-project',
        title: 'Scan Project...',
        displayModule: true,
        windows: ['launcher'],
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-save-project',
        title: 'Save',
        displayModule: true,
        actions: [
          { id: 'save_project', shortcut: { key: 's', ctrl: true } },
        ],
        windows: ['editor'],
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-save-as-project',
        title: 'Save as',
        displayModule: true,
        actions: [
          { id: 'save_project_as', shortcut: { key: 's', ctrl: true, shift: true } },
        ],
        windows: ['editor'],
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-exit',
        title: 'Exit',
        displayModule: true,
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      }
    ]
  },
  {
    path: 'edit',
    title: 'Edit',
    displayModule: true,
    windows: ['editor'],
    children:
    [
      {
        path: 'action-undo',
        title: 'Undo',
        displayModule: true,
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-redo',
        title: 'Redo',
        displayModule: true,
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-cut',
        title: 'Cut',
        displayModule: true,
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-copy',
        title: 'Copy',
        displayModule: true,
        actions: [
          { id: 'copy_selection', shortcut: { key: 'c', ctrl: true } },
          { id: 'copy_as_reference', shortcut: { key: 'c', ctrl: true, alt: true } },
        ],
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-paste',
        title: 'Paste',
        displayModule: true,
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-dublicate',
        title: 'Dublicate',
        displayModule: true,
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-delete',
        title: 'Delete',
        displayModule: true,
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-select-all',
        title: 'Select All',
        displayModule: true,
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-find',
        title: 'Find',
        displayModule: true,
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-replace',
        title: 'Replace',
        displayModule: true,
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      }
    ]
  },
  {
    path: 'view',
    title: 'View',
    displayModule: true,
    windows: ['editor'],
    children:
    [
      {
        path: 'action-open-file-explorer',
        title: 'File Explorer',
        displayModule: true,
        actions: [
          { id: 'toggle_file_explorer', shortcut: { key: 'e', ctrl: true, shift: true } },
        ],
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-open-inspector',
        title: 'Inspector',
        displayModule: true,
        actions: [
          { id: 'toggle_inspector', shortcut: { key: 'i', ctrl: true, shift: true } },
        ],
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-open-console',
        title: 'Console',
        displayModule: true,
        actions: [
          { id: 'toggle_console', shortcut: { key: 'y', ctrl: true, shift: true } },
        ],
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-open-error-list',
        title: 'Error List',
        displayModule: true,
        actions: [
          { id: 'toggle_error_list', shortcut: { key: 'm', ctrl: true, shift: true } },
        ],
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      }
    ]
  },
  {
    path: 'build',
    title: 'Build',
    displayBreadcrumb: true,
    displayModule: true,
    windows: ['editor'],
    children:
    [
      {
        path: 'action-build-n-run',
        title: 'Build&Run',
        displayModule: true,
        actions: [{ id: 'build_and_run', shortcut: { key: 'F5' } }],
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-build',
        title: 'Build',
        displayModule: true,
        actions: [{ id: 'build_project', shortcut: { key: 'b', ctrl: true, shift: true } }],
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-cook',
        title: 'Cook Content',
        displayModule: true,
        actions: [{ id: 'cook_content' }],
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-run',
        title: 'Run',
        displayModule: true,
        actions: [{ id: 'run_project', shortcut: { key: 'F5', ctrl: true } }],
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-clear',
        title: 'Clear',
        displayModule: true,
        actions: [{ id: 'clean_project' }],
        loadComponent: () => import('./components/shared/empty/empty').then(m => m.Empty),
      }
    ]
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