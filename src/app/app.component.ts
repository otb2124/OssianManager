import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Topbar } from "./components/topbar/topbar";
import { AppConfigService } from './services/app-config/app-config.service';
import { filter, switchMap } from 'rxjs';
import { ThemeService } from './services/theme/theme.service';
import { ToastModule } from 'primeng/toast';
import { ProjectService } from './services/projects/project.service';
import { EngineService } from './services/engine-config/engine.service';
import { Bottombar } from "./components/bottombar/bottombar";
import { SidebarNav } from "./components/sidebar-nav/sidebar-nav";
import { KeyShortcutService } from './services/system/key-shortcut.service';
import { ContextMenu } from "./components/context-menu/context-menu";
import { ContextMenuService } from './services/system/context-menu.service';
import { HydratedProjectRecord } from './model/project-record.model';
import { RouteChild } from './app.routes';
import { DialogFormHostComponent } from "./components/dialog-form/dialog-form";

@Component({
  selector: 'app-root',
  imports: [FormsModule, CommonModule, RouterOutlet, Topbar, ToastModule, Bottombar, SidebarNav, ContextMenu, DialogFormHostComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  private appConfigService = inject(AppConfigService);
  private projectRecordService = inject(ProjectService);
  private themeService = inject(ThemeService);
  private engineService = inject(EngineService);

  private readonly shortcuts = inject(KeyShortcutService);
  
  private readonly contextMenus = inject(ContextMenuService);

  ngOnInit(): void {
    this.appConfigService.load().pipe(
      switchMap(config => {
        if (config.engineProjectPath) {
          this.engineService.load().subscribe();
        }
        if (!config.currentProjectId) return [];
        return this.projectRecordService.getById(config.currentProjectId);
      }),
      filter(result => !!result)
    ).subscribe(result => {
      this.projectRecordService.setProject(result!.project, result!.directoryPath);
    });

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
}