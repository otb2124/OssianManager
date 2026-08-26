import { Component, computed, inject, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PopoverModule, Popover } from 'primeng/popover';
import { routes, RouteChild } from '../../app.routes';
import { ProjectService } from '../../services/projects/project.service';
import { ButtonModule } from "primeng/button";
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
}

export interface NavRoute {
  route: RouteChild;
  options: RouteOption[];
}

@Component({
  selector: 'app-module-control',
  imports: [CommonModule, FormsModule, PopoverModule, ButtonModule],
  templateUrl: './module-control.html',
})
export class ModuleControl {
  private router = inject(Router);
  private projectService = inject(ProjectService);

  private readonly shortcuts = inject(KeyShortcutService);
  private readonly actionRegistry = inject(ActionRegistryService);

  @ViewChildren('pop') pops!: QueryList<Popover>;

  activeNavOptions: RouteOption[] = [];
  activeNavRoute: NavRoute | null = null;
  private isOpen = false;
  private switching = false;
  private activeIndex = -1;

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

  private resolveOptions(route: RouteChild): RouteOption[] {
    const children = route.children;
    if (!children?.length) return [];
    const leafChildren = this.resolveLeafChildren(children);
  
    const result: RouteOption[] = [];
  
    for (const c of leafChildren) {
      if (!c.displayModule || !c.path) continue;
  
      const value = `/${route.path}/${c.path}`;
  
      if (c.actions?.length) {
        for (const action of c.actions) {
          result.push({
            key: `${value}#${action.id}`,
            label: c.title ?? c.path,
            value,
            icon: c.icon,
            shortcut: action.shortcut,
            actionId: action.id,
            navigates: c.navigatesModule
          });
        }
      } else {
        result.push({
          key: value,
          label: c.title ?? c.path,
          value,
          icon: c.icon,
          navigates: c.navigatesModule
        });
      }
    }
  
    return result;
  }

  private resolveLeafChildren(children: RouteChild[]): RouteChild[] {
    const displayable = children.filter(c => c.displayModule && c.path);
    return displayable;
  }

  getSelectedValue(route: RouteChild, options: RouteOption[]): RouteOption | null {
    const currentUrl = this.router.url;
    return options.find(o => {
      // Check Angular router state OR raw URL match for release builds
      return this.isActiveOption(o) || currentUrl.includes(o.value);
    }) ?? null;
  }

  isActiveOption(option: RouteOption): boolean {
    // exact: false ensures sub-routes remain active
    return this.router.isActive(option.value, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  openNav(event: Event, index: number): void {
    event.stopPropagation();
    const popsArray = this.pops.toArray();
  
    if (this.isOpen && this.activeIndex === index) {
      popsArray[index]?.hide();
      this.isOpen = false;
      this.activeIndex = -1;
      return;
    }
  
    popsArray.forEach((p, i) => { if (i !== index) p.hide(); });
    popsArray[index]?.show(event);
    this.isOpen = true;
    this.activeIndex = index;
  }

  onRouteSelect(option: RouteOption): void {
    if (option.actionId) {
      this.actionRegistry.invoke(option.actionId);
    }
    if (option.navigates) {
      this.router.navigateByUrl(option.value);
    }
  }

  hoverNav(event: Event, index: number): void {
    if (!this.isOpen || this.activeIndex === index) return;
    event.stopPropagation();
    this.switching = true;
    const popsArray = this.pops.toArray();
    popsArray.forEach((p, i) => { if (i !== index) p.hide(); });
    popsArray[index]?.show(event);
    this.activeIndex = index;
    setTimeout(() => this.switching = false, 100);
  }

  closeAll(): void {
    this.isOpen = false;
    this.pops.toArray().forEach(p => p.hide());
  }

  onPopoverHide(): void {
    if (this.switching) return;
    this.isOpen = false;
    this.activeIndex = -1;
  }

  formatShortcut(shortcut: KeyboardShortcut): string {
    return this.shortcuts.formatShortcut(shortcut);
  }
}