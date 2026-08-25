import { Injectable, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { RouteChild, routes } from '../../app.routes';
import { ProjectService } from '../projects/project.service';
import { ActionRegistryService } from './action-registry.service';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

interface KeyShortcutEntry {
  shortcut: KeyboardShortcut;
  actionId: string;
  route: string;
}

@Injectable({ providedIn: 'root' })
export class KeyShortcutService {

  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly actionRegistry = inject(ActionRegistryService);

  private listening = false;

  /** Call once (e.g. from AppComponent) to start listening app-wide. */
  listen(): void {
    if (this.listening) return;
    this.listening = true;

    const handler = (event: KeyboardEvent) => this.handleKeydown(event);
    document.addEventListener('keydown', handler);
    this.destroyRef.onDestroy(() => document.removeEventListener('keydown', handler));
  }

  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.meta) parts.push('Cmd');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    parts.push(shortcut.key.toUpperCase());
    return parts.join('+');
  }

  matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    return event.key.toLowerCase() === shortcut.key.toLowerCase()
      && event.ctrlKey === !!shortcut.ctrl
      && event.shiftKey === !!shortcut.shift
      && event.altKey === !!shortcut.alt
      && event.metaKey === !!shortcut.meta;
  }

  private handleKeydown(event: KeyboardEvent): void {
    const entries = this.collectShortcuts();
    const match = entries.find(e => this.matchesShortcut(event, e.shortcut));
    if (match) {
      event.preventDefault();
      this.actionRegistry.invoke(match.actionId);
    }
  }

  private collectShortcuts(): KeyShortcutEntry[] {
    const hasProject = this.projectService.hasProject();
    const result: KeyShortcutEntry[] = [];
  
    const walk = (nodes: RouteChild[], basePath: string) => {
      for (const node of nodes) {
        if (!node.path) continue;
        if (node.displayOnProjectLoad && !hasProject) continue;
  
        const path = `${basePath}/${node.path}`;
  
        for (const action of node.actions ?? []) {
          if (action.shortcut) {
            result.push({ shortcut: action.shortcut, actionId: action.id, route: path });
          }
        }
  
        if (node.children?.length) {
          walk(node.children, path);
        }
      }
    };
  
    walk(routes, '');
    return result;
  }
}