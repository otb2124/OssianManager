import { Directive, HostListener, inject, Input } from '@angular/core';
import { ContextMenuService } from '../../services/system/context-menu.service';
import { ContextMenuTriggerService } from '../../services/system/context-menu-trigger.service';

@Directive({
  selector: '[appContextMenu]',
  standalone: true,
})
export class ContextMenuDirective {
  @Input('appContextMenu') contextId!: string;
  @Input() contextTarget?: unknown;

  private readonly menuService = inject(ContextMenuService);
  private readonly triggerService = inject(ContextMenuTriggerService);

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    event.preventDefault();

    const resolved = this.menuService.resolve(this.contextId);
    if (!resolved) return; // no config anywhere in the chain — let it silently do nothing, or fall through to a default app-level menu if you want one

    event.stopPropagation();
    this.triggerService.open(event, this.contextId, this.contextTarget);
  }
}