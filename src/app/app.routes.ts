import { Route } from "@angular/router";
import { RouteAction } from "./services/system/action-registry.service";
import { windowKind, WindowKind } from "./services/system/windows/window-kind";

export interface RouteChild extends Route {
  title?: string;
  icon?: string;
  children?: RouteChild[];
  displayBreadcrumb?: boolean;
  displayModule?: boolean;
  displaySidebar?: boolean;
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
        path: 'projects',
        title: 'Projects',
        icon: 'pi pi-folder',
        displayBreadcrumb: true,
        displayModule: true,
        navigatesModule: true,
        displaySidebar: true,
        windows: ['launcher'],
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
            displayModule: true,
            loadComponent: () => import('./pages/projects/projects-page.js').then(m => m.ProjectsPage),
            data: { id:"projects-recents" }
          },
          {
            path: 'my-projects',
            title: 'My Projects',
            icon: 'pi pi-folder',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/projects/projects-page.js').then(m => m.ProjectsPage),
            data: { id:"projects-my-projects" }
          },
        ]
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
        navigatesModule: true,
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
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"settings-app" }
          },
          {
            path: 'engine',
            title: 'Engine',
            icon: 'pi pi-microchip',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"settings-engine" }
          },
          {
            path: 'theme',
            title: 'Theme',
            icon: 'pi pi-palette',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"settings-theme" }
          },
        ]
      },
      {
        path: 'libraries',
        title: 'Libraries',
        icon: 'pi pi-book',
        displayBreadcrumb: true,
        displayModule: true,
        navigatesModule: true,
        loadComponent: () => import('./pages/libraries/libraries-page.js').then(m => m.LibrariesPage),
      },
      {
        path: 'library/:id',
        title: 'Library',
        icon: 'pi pi-book',
        displayBreadcrumb: false,
        displayModule: false,
        navigatesModule: true,
        loadComponent: () => import('./pages/library/library-page.js').then(m => m.LibraryPage),
      },
      {
        path: 'logs',
        title: 'Logs',
        icon: 'pi pi-align-justify',
        displayBreadcrumb: true,
        displayModule: true,
        navigatesModule: true,
        loadComponent: () => import('./pages/logs/logs-page.js').then(m => m.LogsPage),
      },
    ]
  },
  {
    path: 'project',
    title: 'Project',
    displayBreadcrumb: true,
    displayModule: true,
    windows: ['editor'],
    children:
    [
      {
        path: '',
        redirectTo: 'scenes',
        pathMatch: 'full'
      },
      {
        path: 'scenes',
        title: 'Scenes',
        displayBreadcrumb: true,
        displayModule: true,
        navigatesModule: true,
        displaySidebar: false,
        loadComponent: () => import('./pages/scene-graph/graph-page.js').then(m => m.GraphPage)
      },
      {
        path: 'scene-editor',
        title: 'Scene Editor',
        icon: 'pi pi-objects-column',
        displayBreadcrumb: true,
        displayModule: true,
        navigatesModule: true,
        loadComponent: () => import('./pages/scene/scene-page.js').then(m => m.ScenePage)
      },
      {
        path: 'build',
        title: 'Build',
        displayBreadcrumb: true,
        displayModule: true,
        navigatesModule: true,
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
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"build-details" }
          },
          {
            path: 'startup',
            title: 'Startup',
            icon: 'pi pi-palette',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"build-startup" }
          },
        ]
      },
      {
        path: 'display',
        title: 'Display',
        displayBreadcrumb: true,
        displayModule: true,
        navigatesModule: true,
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
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"display-window" }
          },
          {
            path: 'accessibility',
            title: 'Accessibility',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"display-accessibility" }          },
          {
            path: 'rendering',
            title: 'Rendering',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"display-rendering" }
          },
          {
            path: 'cursor',
            title: 'Cursor',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"display-cursor" }
          },
          {
            path: 'physics',
            title: 'Physics',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"display-physics" }
          },
        ]
      },
      {
        path: 'input',
        title: 'Input',
        displayBreadcrumb: true,
        displayModule: true,
        navigatesModule: true,
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
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"input-keys" }
          },
          {
            path: 'axis',
            title: 'Axis',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"input-axis" }
          },
          {
            path: 'controllers',
            title: 'Controllers',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"input-controllers" }
          },
        ]
      },
      {
        path: 'events',
        title: 'Events',
        displayBreadcrumb: true,
        displayModule: true,
        navigatesModule: true,
        displaySidebar: true,
        children:
        [
          {
            path: '',
            redirectTo: 'actions',
            pathMatch: 'full'
          },
          {
            path: 'actions',
            title: 'Actions',
            icon: 'pi pi-search',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"events-actions" }
          },
          {
            path: 'conditions',
            title: 'Conditions',
            icon: 'pi pi-search',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"events-conditions" }
          },
          {
            path: 'state-machines',
            title: 'State Machines',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"events-state-machines" }
          },
          {
            path: 'pronouns',
            title: 'Pronouns',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"events-pronouns" }
          },
        ]
      },
      {
        path: 'language',
        title: 'Language',
        displayBreadcrumb: true,
        displayModule: true,
        navigatesModule: true,
        displaySidebar: true,
        children:
        [
          {
            path: '',
            redirectTo: 'translations',
            pathMatch: 'full'
          },
          {
            path: 'translations',
            title: 'Translations',
            icon: 'pi pi-search',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"language-translations" }
          },
          {
            path: 'remap',
            title: 'Remap',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"language-remap" }
          },
          {
            path: 'formats',
            title: 'Formats',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"language-formats" }
          },
          {
            path: 'transnationalization',
            title: 'Transnationalization',
            icon: 'pi pi-cloud-upload',
            displayBreadcrumb: true,
            displayModule: true,
            loadComponent: () => import('./pages/settings/settings-page.js').then(m => m.SettingsPage),
            data: { id:"language-transnationalization" }
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