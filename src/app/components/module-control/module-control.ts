import { Component, computed, inject, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PopoverModule, Popover } from 'primeng/popover';
import { routes, RouteChild } from '../../app.routes';
import { ProjectService } from '../../services/projects/project.service';
import { ButtonModule } from "primeng/button";
import { KeyboardShortcut, ShortcutService } from '../../services/system/key-shortcut-service';

export interface RouteOption {
  label: string;
  value: string;
  icon?: string;
  shortcut?: KeyboardShortcut | null;
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

  private readonly shortcuts = inject(ShortcutService);

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
    return leafChildren
      .filter(c => c.displayModule && c.path)
      .map(c => ({
        label: c.title ?? c.path!,
        value: `/${route.path}/${c.path}`,
        icon: c.icon,
        shortcut: c.shortcut,
      }));
  }

  private resolveLeafChildren(children: RouteChild[]): RouteChild[] {
    const displayable = children.filter(c => c.displayModule && c.path);
    return displayable;
  }

  getSelectedValue(route: RouteChild, options: RouteOption[]): RouteOption | null {
    return options.find(o =>
      this.router.isActive(o.value, {
        paths: 'subset',
        queryParams: 'ignored',
        fragment: 'ignored',
        matrixParams: 'ignored',
      })
    ) ?? null;
  }

  isActiveOption(option: RouteOption): boolean {
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
    this.router.navigateByUrl(option.value);
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