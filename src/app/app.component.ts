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
import { ShortcutService } from './services/system/key-shortcut-service';

@Component({
  selector: 'app-root',
  imports: [FormsModule, CommonModule, RouterOutlet, Topbar, ToastModule, Bottombar, SidebarNav],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  private appConfigService = inject(AppConfigService);
  private projectRecordService = inject(ProjectService);
  private themeService = inject(ThemeService);
  private engineService = inject(EngineService);

  private readonly shortcuts = inject(ShortcutService);

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
  }
}