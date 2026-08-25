import { Route } from "@angular/router";

export interface RouteChild extends Route {
  title?: string;
  icon?: string;
  children?: RouteChild[];
  displayBreadcrumb?: boolean;
  displayModule?: boolean;
  displaySidebar?: boolean;
  displayOnProjectLoad?: boolean;
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
        loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
      },
      {
        path: 'action-save-as-project',
        title: 'Save as',
        displayModule: true,
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
    path: 'empty',
    title: undefined,
    displayBreadcrumb: false,
    loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
  },
]