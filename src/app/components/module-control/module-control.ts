import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { routes, RouteChild } from '../../app.routes';
import { ProjectService } from '../../services/projects/project.service';

export interface RouteOption {
  label: string;
  value: string;
  icon?: string;
}

export interface NavRoute {
  route: RouteChild;
  options: RouteOption[];
}

@Component({
  selector: 'app-module-control',
  imports: [CommonModule, SelectModule, FormsModule],
  templateUrl: './module-control.html',
  styleUrl: './module-control.css',
  host: { class: 'block shrink-0' }
})
export class ModuleControl {
  private router = inject(Router);
  private projectService = inject(ProjectService);

  readonly navRoutes = computed(() => {
    const hasProject = this.projectService.hasProject();
    return routes
      .filter(r => {
        if (!r.displayInNavigation || !r.path) return false;
        if (r.displayOnProjectLoad && !hasProject) return false;
        return true;
      })
      .map(r => ({
        route: r,
        options: this.resolveOptions(r),
      }));
  });

  /** Walk down redirect chains to get the actual leaf children with display:true */
  private resolveOptions(route: RouteChild): RouteOption[] {
    const children = route.children;
    if (!children?.length) return [];

    // Follow redirectTo until we reach a non-redirect layer
    const leafChildren = this.resolveLeafChildren(children);

    return leafChildren
      .filter(c => c.displayInNavigation && c.path)
      .map(c => ({
        label: c.title ?? c.path!,
        value: `/${route.path}/${c.path}`,
        icon: c.icon,
      }));
  }

  private resolveLeafChildren(children: RouteChild[]): RouteChild[] {
    // Check if ALL displayable children are themselves redirects with their own children
    const displayable = children.filter(c => c.displayInNavigation && c.path);
    const allHaveChildren = displayable.length > 0 && displayable.every(c => c.children?.length);

    if (allHaveChildren) {
      // Recurse deeper — flatten all grandchildren
      return displayable.flatMap(c => this.resolveLeafChildren(c.children!));
    }

    return children;
  }

  getSelectedValue(route: RouteChild, options: RouteOption[]): RouteOption | null {
    return options.find(o => this.router.isActive(o.value, { paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' })) ?? null;
  }

  onRouteSelect(option: RouteOption | null): void {
    if (option?.value) {
      this.router.navigateByUrl(option.value);
    }
  }
}
