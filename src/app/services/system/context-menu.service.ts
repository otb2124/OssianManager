import { inject, Injectable } from '@angular/core';
import { KeyboardShortcut } from './key-shortcut.service';
import { ActionRegistryService } from './action-registry.service';

export interface ContextMenuItem {
  label: string;
  icon?: string;
  actionId: string;
  shortcut?: KeyboardShortcut | null; // reuse KeyboardShortcut type — you already format these via formatShortcut()
  disabled?: boolean | (() => boolean);
  separator?: boolean;
  children?: ContextMenuItem[];
}

export interface ContextMenuConfig {
  contextId: string;
  parentContextId?: string;
  items: ContextMenuItem[] | ((target: unknown) => ContextMenuItem[]);
}

@Injectable({ providedIn: 'root' })
export class ContextMenuService {
  private registrations = new Map<string, ContextMenuConfig>();
  private readonly actionRegistry = inject(ActionRegistryService);

  register(config: ContextMenuConfig): void {
    this.registrations.set(config.contextId, config);
  }

  unregister(contextId: string): void {
    this.registrations.delete(contextId);
  }

  resolve(contextId: string): ContextMenuConfig | undefined {
    let current = this.registrations.get(contextId);
    while (current && current.items === undefined) {
      if (!current.parentContextId) return undefined;
      current = this.registrations.get(current.parentContextId);
    }
    return current;
  }

  invoke(actionId: string): void {
    this.actionRegistry.invoke(actionId);
  }
}
