// bottom-panel.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Terminal } from '../terminal/terminal';
import { FormsModule } from '@angular/forms';

type BottomTabId = 'console' | 'terminal';

interface BottomTab {
  id: BottomTabId;
  title: string;
  icon: string;
}

const BOTTOM_TABS: BottomTab[] = [
  { id: 'console', title: 'Console', icon: 'pi pi-list' },
  { id: 'terminal', title: 'Terminal', icon: 'pi pi-desktop' },
];

@Component({
  selector: 'app-console-panel',
  standalone: true,
  imports: [CommonModule, Terminal, FormsModule],
  templateUrl: './console-panel.html',
})
export class ConsolePanel {
  protected readonly tabs = BOTTOM_TABS;
  protected readonly activeTab = signal<BottomTabId>('console');

  protected activate(tab: BottomTab): void {
    this.activeTab.set(tab.id);
  }
}