import { Injectable, inject, DestroyRef } from '@angular/core';
import { ProjectService } from '../data/projects/project.service';
import { ActionRegistryService } from './action-registry.service';
import { windowKind } from './windows/window-kind';
import { MenuShortcut, collectMenuShortcuts, resolveMenu, MENU } from '../ui/menu/menu.model';
import type { KeyboardShortcut } from '../../model/keyboard-shortcut.model';

export type { KeyboardShortcut };

@Injectable({ providedIn: 'root' })
export class KeyShortcutService {

  private readonly projectService = inject(ProjectService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly actionRegistry = inject(ActionRegistryService);

  private listening = false;

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
    const match = this.collectShortcuts().find(e =>
      this.matchesShortcut(event, e.shortcut) && this.actionRegistry.has(e.actionId));
    if (!match) return;

    event.preventDefault();
    this.actionRegistry.invoke(match.actionId);
  }

  private collectShortcuts(): MenuShortcut[] {
    return collectMenuShortcuts(resolveMenu(MENU, windowKind, this.projectService.hasProject()));
  }
}
