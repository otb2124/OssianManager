import { CommonModule } from '@angular/common';
import { Component, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Viewport3D } from '../viewport3d/viewport3d';
import { Viewport2D } from '../viewport2d/viewport2d';
import { BabylonSceneService } from '../../services/babylon/babylonscene.service.ts';
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
export class Workspaces implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly babylonSceneService = inject(BabylonSceneService);
  private resizeObserver!: ResizeObserver;

  // TODO: swap back to TabsService once it's wired up; hardcoded for now.
  protected tabs = signal<WorkspaceTab[]>(HARDCODED_TABS);
  protected activeTab = signal<string>(HARDCODED_TABS[0].path);

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.babylonSceneService.setControlCanvas(canvas);
    this.babylonSceneService.init(canvas);

    this.resizeObserver = new ResizeObserver(() => this.babylonSceneService.resize());
    this.resizeObserver.observe(canvas);
  }

  activateTab(tab: WorkspaceTab): void {
    this.activeTab.set(tab.path);
  }

  closeTab(tab: WorkspaceTab, event: Event): void {
    event.stopPropagation();
    // No-op for now — hardcoded tabs aren't removable yet.
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.babylonSceneService.disposeEngine();
  }
}