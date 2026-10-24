import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Topbar } from "./components/layout/topbar/topbar";
import { filter, firstValueFrom, switchMap, tap } from 'rxjs';
import { ThemeService } from './services/theme/theme.service';
import { ToastModule } from 'primeng/toast';
import { ProjectService } from './services/data/projects/project.service';
import { Bottombar } from "./components/layout/bottombar/bottombar";
import { SidebarNav } from "./components/layout/sidebar-nav/sidebar-nav";
import { KeyShortcutService } from './services/system/key-shortcut.service';
import { ContextMenu } from "./components/layout/context-menu/context-menu";
import { ContextMenuService } from './services/system/context-menu.service';
import { HydratedProjectRecord } from './model/project-record.model';
import { RouteChild } from './app.routes';
import { DialogFormHostComponent } from "./components/dialogs/dialog-form/dialog-form";
import { AppConfigService } from './services/data/app-config/app-config.service';
import { EngineBridgeService } from './services/engine/bridge/engine-bridge.service';
import { EngineIpcService } from './services/engine/ipc/engine-ipc';
import { BackgroundService } from './services/ui/background/background.service';
import { ShaderBackground } from './components/layout/shader-background/shader-background';
import { EngineConsoleService } from './services/engine/console/engine-console.service';
import { launchProjectId, windowKind } from './services/system/windows/window-kind';
import { invoke } from '@tauri-apps/api/core';
import { EngineService } from './services/data/engine-config/engine.service';
import { OssianPipelineService } from './services/data/tools/ossian-pipeline/ossian-pipeline.service';
import { ActionRegistryService } from './services/system/action-registry.service';
import { NotificationService } from './services/notifications/notification.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule, CommonModule, RouterOutlet, Topbar, ToastModule, Bottombar, SidebarNav, ContextMenu, DialogFormHostComponent, ShaderBackground],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {

  private appConfigService = inject(AppConfigService);
  private projectRecordService = inject(ProjectService);
  private engineService = inject(EngineService);
  private themeService = inject(ThemeService);

  private engineBridgeService = inject(EngineBridgeService);
  private engineConsole = inject(EngineConsoleService);
  private engineIpc = inject(EngineIpcService);

  private pipeline = inject(OssianPipelineService);
  private actions = inject(ActionRegistryService);
  private notifications = inject(NotificationService);

  private readonly shortcuts = inject(KeyShortcutService);
  private readonly contextMenus = inject(ContextMenuService);

  protected readonly bg = inject(BackgroundService);

  ngOnInit(): void {

    if (windowKind === 'editor') {
      void this.initEditor();
      this.registerBuildActions();
    } else {
      this.loadConfigs();
    }

    this.shortcuts.listen();

    this.contextMenus.register({
      contextId: 'project-record',
      items: (target: unknown) => {
        const project = target as HydratedProjectRecord;
        return [
          { label: 'Open', icon: 'pi pi-folder-open', actionId: 'open_project' },
          { label: 'Rename', icon: 'pi pi-pencil', actionId: 'rename_project' },
          { label: project.isFavorite ? 'Unfavorite' : 'Favorite', icon: 'pi pi-star', actionId: 'toggle_favorite_project' },
          { separator: true } as any,
          { label: 'Delete', icon: 'pi pi-trash', actionId: 'delete_project' },
        ];
      },
    });

    this.contextMenus.register({
      contextId: 'tab',
      items: (target: unknown) => {
        const tab = target as RouteChild;
        return [
          { label: 'Close', actionId: 'close_tab' },
          { label: 'Close Other', actionId: 'close_tab_other' },
          { label: 'Close All', actionId: 'close_tab_all' },
        ];
      },
    });
  }



  private async initEditor(): Promise<void> {
    await firstValueFrom(this.appConfigService.load());
  
    // 1. Project first: its content folder decides what the engine loads.
    let found: Awaited<ReturnType<typeof this.findLaunchProject>>;
    try {
      found = await this.findLaunchProject();
    } catch (err) {
      console.error('[Editor] project lookup failed:', err);
      this.notifications.error('Could not read the project list', String(err));
    }
  
    if (!found) {
      await invoke('close_editor');   // project vanished from the registry
      return;
    }
  
    await firstValueFrom(this.projectRecordService.setProject(found.project, found.directoryPath));
  
    // tree.json of the PROJECT (not awaited: a missing config must not block opening the project).
    this.engineService.load().subscribe({
      error: err => console.error('[AppComponent] engine config load failed:', err),
    });
  
    if (!this.appConfigService.engineProjectPath()) return;
  
    try {
      // 2. Ossian.ini -> project content. The engine reads it once, so this MUST precede the spawn.
      await this.pipeline.syncEngine();
  
      // 3. Listeners, then the engine.
      await this.engineIpc.init();
      await this.engineConsole.init();
      await this.engineBridgeService.spawnEngine();
      this.engineBridgeService.load().subscribe();
    } catch (err) {
      console.error('[Editor] engine init failed:', err);
      this.notifications.error('Could not start the engine for this project', String(err));
    }
  }
  
  private async findLaunchProject() {
    return launchProjectId
      ? firstValueFrom(this.projectRecordService.getById(launchProjectId))
      : undefined;
  }
  
  private registerBuildActions(): void {
    this.actions.register('build_project', () => void this.pipeline.build());
    this.actions.register('build_and_run', () => void this.pipeline.buildAndRun());
    this.actions.register('run_project', () => void this.pipeline.run());
    this.actions.register('clean_project', () => void this.pipeline.cleanBuild());
    this.actions.register('cook_content', () => void this.pipeline.cook());
  }


  private loadConfigs(): void {
    this.appConfigService.load().pipe(
      switchMap(() => this.engineService.load())
    ).subscribe({
      error: err => console.error('[AppComponent] config load failed:', err),
    });
  }
}