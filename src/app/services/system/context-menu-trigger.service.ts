// context-menu-trigger.service.ts
import { Injectable } from '@angular/core';
import { ContextMenu } from '../../components/context-menu/context-menu';

@Injectable({ providedIn: 'root' })
export class ContextMenuTriggerService {
  private instance: ContextMenu | null = null;

  register(instance: ContextMenu): void {
    this.instance = instance;
  }

  open(event: MouseEvent, contextId: string, target?: unknown): void {
    this.instance?.open(event, contextId, target);
  }
}