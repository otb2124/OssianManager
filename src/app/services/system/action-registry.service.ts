import { Injectable } from '@angular/core';
import { KeyboardShortcut } from './key-shortcut.service';

export type ActionHandler = () => void;

export interface RouteAction {
  id: string;
  shortcut?: KeyboardShortcut | null;
}

@Injectable({ providedIn: 'root' })
export class ActionRegistryService {

  private readonly handlers = new Map<string, ActionHandler>();

  register(action: string, handler: ActionHandler): void {
    if (this.handlers.has(action)) {
      console.warn(`Action "${action}" is already registered — overwriting.`);
    }
    this.handlers.set(action, handler);
  }

  has(action: string): boolean {
    return this.handlers.has(action);
  }

  invoke(action: string): void {
    const handler = this.handlers.get(action);
    if (!handler) {
      console.warn(`No handler registered for action "${action}".`);
      return;
    }
    handler();
  }
}