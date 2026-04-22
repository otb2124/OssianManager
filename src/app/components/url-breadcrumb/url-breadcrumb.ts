import { Component, HostListener, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { routes, RouteChild } from '../../app.routes';
import { ProjectService } from '../../services/projects/project.service';

interface SiblingItem {
  label: string;
  routerLink: string;
}

interface BreadcrumbItem {
  label: string;
  routerLink: string;
  siblings: SiblingItem[];
}

@Component({
  selector: 'app-url-breadcrumb',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './url-breadcrumb.html',
  styleUrl: './url-breadcrumb.css'
})
export class UrlBreadcrumbComponent {

  private router = inject(Router);
  private projectService = inject(ProjectService);

  openIndex: number | null = null;

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      // map to url to actually change the signal value and trigger computed
    ).pipe(filter(e => !!e)),
    { initialValue: null }
  );

  readonly items = computed<BreadcrumbItem[]>(() => {
    // depend on navigation signal so this recomputes on every navigation
    this.currentUrl();
    return this.buildBreadcrumb();
  });

  @HostListener('document:click')
  onDocumentClick() {
    this.openIndex = null;
  }

  toggleSiblings(event: Event, index: number) {
    event.stopPropagation();
    this.openIndex = this.openIndex === index ? null : index;
  }

  selectSibling(sib: SiblingItem) {
    this.openIndex = null;
    this.router.navigate([sib.routerLink]);
  }

  private buildBreadcrumb(): BreadcrumbItem[] {
    const items: BreadcrumbItem[] = [];
    const segments = this.router.url.split('/').filter(Boolean);
    const hasProject = this.projectService.hasProject();
  
    let configLevel: RouteChild[] = routes;
    let accumulatedPath = '';
  
    for (const segment of segments) {
      const configNode = configLevel.find(r => r.path === segment);
      if (!configNode?.title) {
        configLevel = configNode?.children ?? [];
        continue;
      }
  
      accumulatedPath += `/${segment}`;
  
      const siblings: SiblingItem[] = configLevel
        .filter(r =>
          r.path &&
          r.path !== '' &&
          r.title &&
          !r.redirectTo &&
          r.displayInNavigation &&
          (!r.displayOnProjectLoad || hasProject)
        )
        .map(r => {
          const sibPath = accumulatedPath.split('/').slice(0, -1).join('/') + '/' + r.path!;
          return { label: r.title!, routerLink: sibPath };
        });
  
      items.push({ label: configNode.title, routerLink: accumulatedPath, siblings });
  
      configLevel = configNode.children ?? [];
    }
  
    return items;
  }
}