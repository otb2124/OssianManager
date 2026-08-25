import { Route } from "@angular/router";

export interface RouteChild extends Route {
  title?: string;
  icon?: string;
  children?: RouteChild[];
  displayBreadcrumb?: boolean;
  displaySidebar?: boolean;
  displayOnProjectLoad?: boolean;
}

export const routes: RouteChild[] =
[
  {
    path: '',
    redirectTo: 'general',
    pathMatch: 'full',
  },
  {
    path: 'general',
    title: 'General',
    displayBreadcrumb: true,
    loadComponent: () => import('./components/shell/shell.js').then(m => m.Shell),
    children:
    [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        title: 'Home',
        icon: 'pi pi-home',
        displayBreadcrumb: true,
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
            icon: 'pi pi-history',
            displayBreadcrumb: true,
            loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
          },
        ]
      },
      {
        path: 'settings',
        title: 'Settings',
        icon: 'pi pi-cog',
        displayBreadcrumb: true,
        displaySidebar: true,
        loadComponent: () => import('./modules/general/settings/settings.js').then(m => m.Settings),
      },
      {
        path: 'engine',
        title: 'Engine',
        icon: 'pi pi-cog',
        displayBreadcrumb: true,
        displaySidebar: true,
        loadComponent: () => import('./modules/general/engine-page/engine-page').then(m => m.EnginePage),
      },
      {
        path: 'log',
        title: 'Log',
        icon: 'pi pi-align-justify',
        displayBreadcrumb: true,
        displaySidebar: true,
        loadComponent: () => import('./modules/general/notifications-page/notifications-page.js').then(m => m.NotificationsPage),
      },
    ]
  },
  {
    path: 'project',
    title: 'Project',
    displayBreadcrumb: true,
    displayOnProjectLoad: true,
    loadComponent: () => import('./components/shell/shell.js').then(m => m.Shell),
    children:
    [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        title: 'Overview',
        displayBreadcrumb: true,
        loadComponent: () => import('./modules/project/project-overview/project-overview.js').then(m => m.ProjectOverview),
      }
    ]
  },
  {
    path: 'entities',
    title: 'Entities',
    displayBreadcrumb: true,
    displayOnProjectLoad: true,
    loadComponent: () => import('./components/shell/shell.js').then(m => m.Shell),
    children:
    [
      {
        path: '',
        redirectTo: 'entities',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        title: 'Overview',
        icon: 'pi pi-sync',
        displayBreadcrumb: true,
        loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
      },
      {
        path: 'entities',
        title: 'Entities',
        icon: 'pi pi-sync',
        displayBreadcrumb: true,
        loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
      },
      {
        path: 'environment',
        title: 'Environment',
        icon: 'pi pi-cog',
        displayBreadcrumb: true,
        loadComponent: () => import('./modules/general/settings/settings.js').then(m => m.Settings),
      }
    ]
  },
  {
    path: 'environment',
    title: 'Environment',
    displayBreadcrumb: true,
    displayOnProjectLoad: true,
    loadComponent: () => import('./components/shell/shell.js').then(m => m.Shell),
    children:
    [
      {
        path: '',
        redirectTo: 'entities',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        title: 'Overview',
        icon: 'pi pi-sync',
        displayBreadcrumb: true,
        loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
      },
      {
        path: 'entities',
        title: 'Entities',
        icon: 'pi pi-sync',
        displayBreadcrumb: true,
        loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
      },
      {
        path: 'environment',
        title: 'Environment',
        icon: 'pi pi-cog',
        displayBreadcrumb: true,
        loadComponent: () => import('./modules/general/settings/settings.js').then(m => m.Settings),
      }
    ]
  },
  {
    path: 'resources',
    title: 'Resources',
    displayBreadcrumb: true,
    displayOnProjectLoad: true,
    loadComponent: () => import('./components/shell/shell.js').then(m => m.Shell),
    children:
    [
      {
        path: '',
        redirectTo: 'entities',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        title: 'Overview',
        icon: 'pi pi-sync',
        displayBreadcrumb: true,
        loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
      },
      {
        path: 'entities',
        title: 'Entities',
        icon: 'pi pi-sync',
        displayBreadcrumb: true,
        loadComponent: () => import('./modules/general/home/recents.js').then(m => m.Recents),
      },
      {
        path: 'environment',
        title: 'Environment',
        icon: 'pi pi-cog',
        displayBreadcrumb: true,
        loadComponent: () => import('./modules/general/settings/settings.js').then(m => m.Settings),
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