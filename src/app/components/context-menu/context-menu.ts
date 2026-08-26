import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverModule, Popover } from 'primeng/popover';
import { ContextMenuService, ContextMenuItem } from '../../services/system/context-menu.service';
import { KeyboardShortcut, KeyShortcutService } from '../../services/system/key-shortcut.service';
import { ContextMenuTriggerService } from '../../services/system/context-menu-trigger.service';

@Component({
  selector: 'app-context-menu',
  imports: [CommonModule, PopoverModule],
  templateUrl: './context-menu.html',
})
export class ContextMenu implements OnInit {
  private readonly menuService = inject(ContextMenuService);
  private readonly shortcuts = inject(KeyShortcutService);
  private readonly triggerService = inject(ContextMenuTriggerService);

  @ViewChild('ctxPop') pop!: Popover;

  private readonly currentContextId = signal<string | null>(null);
  private readonly currentTarget = signal<unknown>(null);

  readonly resolvedItems = computed<ContextMenuItem[]>(() => {
    const contextId = this.currentContextId();
    if (!contextId) return [];

    const config = this.menuService.resolve(contextId);
    if (!config) return [];

    return typeof config.items === 'function'
      ? config.items(this.currentTarget())
      : config.items;
  });

  ngOnInit(): void {
    this.triggerService.register(this);
  }

  open(event: MouseEvent, contextId: string, target?: unknown): void {
    this.currentContextId.set(contextId);
    this.currentTarget.set(target);
    this.pop.show(event);
  }

  onItemSelect(item: ContextMenuItem): void {
    if (this.isDisabled(item)) return;
    this.menuService.invoke(item.actionId);
  }

  isDisabled(item: ContextMenuItem): boolean {
    return typeof item.disabled === 'function' ? item.disabled() : !!item.disabled;
  }

  formatShortcut(shortcut: KeyboardShortcut): string {
    return this.shortcuts.formatShortcut(shortcut);
  }
}