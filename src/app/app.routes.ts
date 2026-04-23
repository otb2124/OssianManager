import { Route } from "@angular/router";

export interface RouteChild extends Route {
  title?: string;
  icon?: string;
  children?: RouteChild[];
  displayInNavigation?: boolean;
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
    displayInNavigation: true,
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
        displayInNavigation: true,
        loadComponent: () => import('./modules/general/home/home.js').then(m => m.Home),
      },
      {
        path: 'settings',
        title: 'Settings',
        icon: 'pi pi-cog',
        displayInNavigation: true,
        loadComponent: () => import('./modules/general/settings/settings.js').then(m => m.Settings),
      },
      {
        path: 'engine',
        title: 'Engine',
        icon: 'pi pi-cog',
        displayInNavigation: true,
        loadComponent: () => import('./modules/general/engine-page/engine-page').then(m => m.EnginePage),
      },
      {
        path: 'log',
        title: 'Log',
        icon: 'pi pi-align-justify',
        displayInNavigation: true,
        loadComponent: () => import('./modules/general/notifications-page/notifications-page.js').then(m => m.NotificationsPage),
      },
    ]
  },
  {
    path: 'project',
    title: 'Project',
    displayInNavigation: true,
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
        displayInNavigation: true,
        loadComponent: () => import('./modules/project/project-overview/project-overview.js').then(m => m.ProjectOverview),
      }
    ]
  },
  {
    path: 'entities',
    title: 'Entities',
    displayInNavigation: true,
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
        displayInNavigation: true,
        loadComponent: () => import('./modules/general/home/home.js').then(m => m.Home),
      },
      {
        path: 'entities',
        title: 'Entities',
        icon: 'pi pi-sync',
        displayInNavigation: true,
        loadComponent: () => import('./modules/general/home/home.js').then(m => m.Home),
      },
      {
        path: 'environment',
        title: 'Environment',
        icon: 'pi pi-cog',
        displayInNavigation: true,
        loadComponent: () => import('./modules/general/settings/settings.js').then(m => m.Settings),
      }
    ]
  },
  {
    path: 'environment',
    title: 'Environment',
    displayInNavigation: true,
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
        displayInNavigation: true,
        loadComponent: () => import('./modules/general/home/home.js').then(m => m.Home),
      },
      {
        path: 'entities',
        title: 'Entities',
        icon: 'pi pi-sync',
        displayInNavigation: true,
        loadComponent: () => import('./modules/general/home/home.js').then(m => m.Home),
      },
      {
        path: 'environment',
        title: 'Environment',
        icon: 'pi pi-cog',
        displayInNavigation: true,
        loadComponent: () => import('./modules/general/settings/settings.js').then(m => m.Settings),
      }
    ]
  },
  {
    path: 'resources',
    title: 'Resources',
    displayInNavigation: true,
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
        displayInNavigation: true,
        loadComponent: () => import('./modules/general/home/home.js').then(m => m.Home),
      },
      {
        path: 'entities',
        title: 'Entities',
        icon: 'pi pi-sync',
        displayInNavigation: true,
        loadComponent: () => import('./modules/general/home/home.js').then(m => m.Home),
      },
      {
        path: 'environment',
        title: 'Environment',
        icon: 'pi pi-cog',
        displayInNavigation: true,
        loadComponent: () => import('./modules/general/settings/settings.js').then(m => m.Settings),
      }
    ]
  },
  {
    path: 'empty',
    title: undefined,
    displayInNavigation: false,
    loadComponent: () => import('./components/empty/empty').then(m => m.Empty),
  },
]