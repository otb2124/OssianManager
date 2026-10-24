import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { ProjectService } from '../../../services/data/projects/project.service';
import { KeyShortcutService } from '../../../services/system/key-shortcut.service';
import { ActionRegistryService } from '../../../services/system/action-registry.service';
import { windowKind } from '../../../services/system/windows/window-kind';
import { resolveMenu, MENU, MenuEntry } from '../../../services/ui/menu/menu.model';

@Component({
  selector: 'app-menu-nav',
  imports: [CommonModule, MenubarModule],
  templateUrl: './menu-nav.html',
})
export class MenuNav {
  private readonly projectService = inject(ProjectService);
  private readonly shortcuts = inject(KeyShortcutService);
  private readonly actions = inject(ActionRegistryService);

  readonly menuItems = computed<MenuItem[]>(() =>
    resolveMenu(MENU, windowKind, this.projectService.hasProject()).map(e => this.toMenuItem(e)),
  );

  private toMenuItem(entry: MenuEntry): MenuItem {
    if (entry.separator) return { separator: true };

    const children = entry.children?.map(c => this.toMenuItem(c));
    const actionId = entry.actionId;

    return {
      label: entry.label,
      icon: entry.icon,
      items: children,
      // Unregistered actions are disabled instead of silently warning on click.
      disabled: !children && (!actionId || !this.actions.has(actionId)),
      command: !children && actionId ? () => this.actions.invoke(actionId) : undefined,
      shortcut: entry.shortcut ? this.shortcuts.formatShortcut(entry.shortcut) : undefined,
    };
  }
}