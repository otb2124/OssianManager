import { Route } from "@angular/router";
import { KeyboardShortcut } from "./services/system/key-shortcut.service";
import { RouteAction } from "./services/system/action-registry.service";

export interface RouteChild extends Route {
  title?: string;
  icon?: string;
  children?: RouteChild[];
  displayBreadcrumb?: boolean;
  displayModule?: boolean;
  displaySidebar?: boolean;
  displayOnProjectLoad?: boolean;
  actions?: RouteAction[];
}

export const routes: RouteChild[] =
[
  {
    path: '',
    redirectTo: 'file',
    pathMatch: 'full',
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
        redirectTo: 'projects',
        pathMatch: 'full'
      },
      {
        path: 'action-new-project',
        title: 'New Project',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'projects',
        title: 'Projects',
        icon: 'pi pi-folder',
        displayBreadcrumb: true,
        displayModule: true,
        displaySidebar: true,
        children:
        [
          {
            path: '',
            redirectTo: 'recents',
            pathMatch: 'full'
          },
          {
            path: 'recents',
            title: 'Recents',
            icon: 'pi pi-clock',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
          {
            path: 'my-projects',
            title: 'My Projects',
            icon: 'pi pi-folder',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
        ]
      },
      {
        path: 'action-import-project',
        title: 'Import Project...',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-scan-project',
        title: 'Scan Project...',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-save-project',
        title: 'Save',
        displayModule: true,
        actions: [
          { id: 'save_project', shortcut: { key: 's', ctrl: true } },
        ],
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-save-as-project',
        title: 'Save as',
        displayModule: true,
        actions: [
          { id: 'save_project_as', shortcut: { key: 's', ctrl: true, shift: true } },
        ],
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-exit',
        title: 'Exit',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      }
    ]
  },
  {
    path: 'tools',
    title: 'Tools',
    displayBreadcrumb: true,
    displayModule: true,
    children:
    [
      {
        path: '',
        redirectTo: 'settings',
        pathMatch: 'full'
      },
      {
        path: 'settings',
        title: 'Settings',
        icon: 'pi pi-cog',
        displayBreadcrumb: true,
        displayModule: true,
        displaySidebar: true,
        children:
        [
          {
            path: '',
            redirectTo: 'app',
            pathMatch: 'full'
          },
          {
            path: 'app',
            title: 'App',
            icon: 'pi pi-cog',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
          {
            path: 'engine',
            title: 'Engine',
            icon: 'pi pi-microchip',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
          {
            path: 'theme',
            title: 'Theme',
            icon: 'pi pi-palette',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
        ]
      },
      {
        path: 'libraries',
        title: 'Libraries',
        icon: 'pi pi-book',
        displayBreadcrumb: true,
        displayModule: true,
        displaySidebar: true,
        children:
        [
          {
            path: '',
            redirectTo: 'browse',
            pathMatch: 'full'
          },
          {
            path: 'browse',
            title: 'Browse',
            icon: 'pi pi-search',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
          {
            path: 'publish',
            title: 'Publish',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
        ]
      },
      {
        path: 'logs',
        title: 'Logs',
        icon: 'pi pi-align-justify',
        displayBreadcrumb: true,
        displayModule: true,
        loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
      },
    ]
  },
  {
    path: 'edit',
    title: 'Edit',
    displayModule: true,
    children:
    [
      {
        path: 'action-undo',
        title: 'Undo',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-redo',
        title: 'Redo',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-cut',
        title: 'Cut',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-copy',
        title: 'Copy',
        displayModule: true,
        actions: [
          { id: 'copy_selection', shortcut: { key: 'c', ctrl: true } },
          { id: 'copy_as_reference', shortcut: { key: 'c', ctrl: true, alt: true } },
        ],
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-paste',
        title: 'Paste',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-dublicate',
        title: 'Dublicate',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-delete',
        title: 'Delete',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-select-all',
        title: 'Select All',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-find',
        title: 'Find',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-replace',
        title: 'Replace',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      }
    ]
  },
  {
    path: 'project',
    title: 'Project',
    displayBreadcrumb: true,
    displayModule: true,
    children:
    [
      {
        path: '',
        redirectTo: 'build',
        pathMatch: 'full'
      },
      {
        path: 'build',
        title: 'Build',
        displayBreadcrumb: true,
        displayModule: true,
        displaySidebar: true,
        children:
        [
          {
            path: '',
            redirectTo: 'details',
            pathMatch: 'full'
          },
          {
            path: 'details',
            title: 'Details',
            icon: 'pi pi-cog',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
          {
            path: 'tree',
            title: 'Tree',
            icon: 'pi pi-microchip',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
          {
            path: 'startup',
            title: 'Startup',
            icon: 'pi pi-palette',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
        ]
      },
      {
        path: 'display',
        title: 'Display',
        displayBreadcrumb: true,
        displayModule: true,
        displaySidebar: true,
        children:
        [
          {
            path: '',
            redirectTo: 'window',
            pathMatch: 'full'
          },
          {
            path: 'window',
            title: 'Window',
            icon: 'pi pi-search',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
          {
            path: 'accessibility',
            title: 'Accessibility',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
          {
            path: 'rendering',
            title: 'Rendering',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
          {
            path: 'cursor',
            title: 'Cursor',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
          {
            path: 'physics',
            title: 'Physics',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
        ]
      },
      {
        path: 'input',
        title: 'Input',
        displayBreadcrumb: true,
        displayModule: true,
        displaySidebar: true,
        children:
        [
          {
            path: '',
            redirectTo: 'keys',
            pathMatch: 'full'
          },
          {
            path: 'keys',
            title: 'Keys',
            icon: 'pi pi-search',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
          {
            path: 'axis',
            title: 'Axis',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
          {
            path: 'controllers',
            title: 'Controllers',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
        ]
      },
    ]
  },
  {
    path: 'build',
    title: 'Build',
    displayBreadcrumb: true,
    displayModule: true,
    children:
    [
      {
        path: 'action-build-n-run',
        title: 'Build&Run',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-build',
        title: 'Build',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-run',
        title: 'Run',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-clear',
        title: 'Clear',
        displayModule: true,
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      }
    ]
  },
  {
    path: 'empty',
    title: undefined,
    displayBreadcrumb: false,
    loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
  },
]