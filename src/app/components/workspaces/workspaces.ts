import { CommonModule } from '@angular/common';
import { Component, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Viewport3D } from '../viewport3d/viewport3d';
import { Viewport2D } from '../viewport2d/viewport2d';
import { ScriptEditor } from "../script-editor/script-editor";

interface WorkspaceTab {
  path: string;
  title: string;
  icon?: string;
}

const HARDCODED_TABS: WorkspaceTab[] = [
  { path: '3d-viewport', title: '3D', icon: 'pi pi-box' },
  { path: '2d-viewport', title: '2D', icon: 'pi pi-image' },
  { path: 'script', title: 'Script', icon: 'pi pi-code' },
  { path: 'render', title: 'Render', icon: 'pi pi-camera' },
];

@Component({
  selector: 'app-workspaces',
  imports: [CommonModule, FormsModule, ButtonModule, Viewport3D, Viewport2D, ScriptEditor],
  templateUrl: './workspaces.html',
  styleUrl: './workspaces.css',
})
export class Workspaces implements OnDestroy {
  private resizeObserver!: ResizeObserver;

  protected tabs = signal<WorkspaceTab[]>(HARDCODED_TABS);
  protected activeTab = signal<string>(HARDCODED_TABS[0].path);

  activateTab(tab: WorkspaceTab): void {
    this.activeTab.set(tab.path);
  }

  closeTab(tab: WorkspaceTab, event: Event): void {
    event.stopPropagation();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
}