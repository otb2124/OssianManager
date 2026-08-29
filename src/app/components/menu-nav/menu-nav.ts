import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { routes, RouteChild } from '../../app.routes';
import { ProjectService } from '../../services/projects/project.service';
import { KeyboardShortcut, KeyShortcutService } from '../../services/system/key-shortcut.service';
import { ActionRegistryService } from '../../services/system/action-registry.service';

export interface RouteOption {
  key: string;
  label: string;
  value: string;
  icon?: string;
  shortcut?: KeyboardShortcut | null;
  actionId?: string;
  navigates?: boolean;
  children?: RouteOption[]; // populated when this option's own children have displayModule routes
}

export interface NavRoute {
  route: RouteChild;
  options: RouteOption[];
}

// isActive isn't a native MenuItem field, so it's still tracked via an
// extended interface rather than assigning it directly. Currently unread
// since the item template that displayed it was dropped in favor of
// PrimeNG's default rendering.
interface RouteMenuItem extends MenuItem {
  isActive?: boolean;
}

@Component({
  selector: 'app-menu-nav',
  imports: [CommonModule, FormsModule, MenubarModule],
  templateUrl: './menu-nav.html',
})
export class MenuNav {
  private router = inject(Router);
  private projectService = inject(ProjectService);

  private readonly shortcuts = inject(KeyShortcutService);
  private readonly actionRegistry = inject(ActionRegistryService);

  readonly navRoutes = computed(() => {
    const hasProject = this.projectService.hasProject();
    return routes
      .filter(r => {
        if (!r.displayModule || !r.path) return false;
        if (r.displayOnProjectLoad && !hasProject) return false;
        return true;
      })
      .map(r => ({
        route: r,
        options: this.resolveOptions(r),
      }));
  });

  readonly menuItems = computed<RouteMenuItem[]>(() =>
    this.navRoutes().map(nav => this.toMenuItem(nav))
  );

  private toMenuItem(nav: NavRoute): RouteMenuItem {
    return {
      label: nav.route.title,
      items: nav.options.length ? nav.options.map(o => this.optionToMenuItem(o)) : undefined,
    };
  }

  private optionToMenuItem(option: RouteOption): RouteMenuItem {
    return {
      label: option.label,
      icon: option.icon,
      isActive: this.isActiveOption(option),
      items: option.children?.length
        ? option.children.map(c => this.optionToMenuItem(c))
        : undefined,
      command: option.children?.length ? undefined : () => this.onRouteSelect(option),
      ...(option.shortcut ? { shortcut: this.formatShortcut(option.shortcut) } : {}),
    };
  }

  private resolveOptions(route: RouteChild): RouteOption[] {
    const children = route.children;
    if (!children?.length) return [];
    const leafChildren = this.resolveLeafChildren(children);

    const result: RouteOption[] = [];

    for (const c of leafChildren) {
      if (!c.displayModule || !c.path) continue;

      const value = `/${route.path}/${c.path}`;
      const childOptions = this.resolveChildOptions(route.path!, c);

      if (c.actions?.length) {
        for (const action of c.actions) {
          result.push({
            key: `${value}#${action.id}`,
            label: c.title ?? c.path,
            value,
            icon: c.icon,
            shortcut: action.shortcut,
            actionId: action.id,
            navigates: c.navigatesModule,
            children: childOptions.length ? childOptions : undefined,
          });
        }
      } else {
        result.push({
          key: value,
          label: c.title ?? c.path,
          value,
          icon: c.icon,
          navigates: c.navigatesModule,
          children: childOptions.length ? childOptions : undefined,
        });
      }
    }

    return result;
  }

  // Builds the one-level-deeper RouteOption[] for a nav item that itself has
  // displayModule children (e.g. 'projects' -> 'recents'/'my-projects').
  // Mirrors resolveOptions' shape but is keyed off the parent option's own
  // path segment rather than the top-level module route.
  private resolveChildOptions(parentSegment: string, route: RouteChild): RouteOption[] {
    const children = route.children;
    if (!children?.length) return [];
    const leafChildren = this.resolveLeafChildren(children);

    const result: RouteOption[] = [];

    for (const c of leafChildren) {
      if (!c.displayModule || !c.path) continue;
      const value = `/${parentSegment}/${route.path}/${c.path}`;

      result.push({
        key: value,
        label: c.title ?? c.path,
        value,
        icon: c.icon,
        navigates: true, // leaf options in a submenu are always click-to-navigate
      });
    }

    return result;
  }

  private resolveLeafChildren(children: RouteChild[]): RouteChild[] {
    return children.filter(c => c.displayModule && c.path);
  }

  getSelectedValue(route: RouteChild, options: RouteOption[]): RouteOption | null {
    const currentUrl = this.router.url;
    return options.find(o => {
      return this.isActiveOption(o) || currentUrl.includes(o.value);
    }) ?? null;
  }

  isActiveOption(option: RouteOption): boolean {
    return this.router.isActive(option.value, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  onRouteSelect(option: RouteOption): void {
    if (option.actionId) {
      this.actionRegistry.invoke(option.actionId);
    }
    if (option.navigates) {
      this.router.navigateByUrl(option.value);
    }
  }

  formatShortcut(shortcut: KeyboardShortcut): string {
    return this.shortcuts.formatShortcut(shortcut);
  }
}