import { Component, inject, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { invoke } from '@tauri-apps/api/core';
import { switchMap, filter, catchError, EMPTY, forkJoin } from 'rxjs';
import { DialogService } from '../../services/persistence/dialog.service';
import { DialogWrapper } from '../dialog-wrapper/dialog-wrapper';
import { ProjectRecordForm } from '../project-record-form/project-record-form';
import { HydratedProjectRecord } from '../../model/project-record.model';
import { ProjectService } from '../../services/data/projects/project.service';
import { NotificationService } from '../../services/notifications/notification.service';

@Component({
  selector: 'app-project-management-panel',
  imports: [ButtonModule, DialogWrapper, ProjectRecordForm],
  templateUrl: './project-management-panel.html',
})
export class ProjectManagementPanel {

  private dialog = inject(DialogService);
  private projectService = inject(ProjectService);
  private notifications = inject(NotificationService);

  readonly projectsChanged = output<void>();

  showCreateDialog = false;
  pendingDirectoryPath: string | null = null;

  openCreateDialog(): void {
    this.dialog.pickFolder().subscribe(folder => {
      if (!folder) return;
      this.pendingDirectoryPath = folder;
      this.showCreateDialog = true;
    });
  }

  onCreateSubmitted(partial: Partial<HydratedProjectRecord>): void {
    if (!this.pendingDirectoryPath) return;
    const directoryPath = this.pendingDirectoryPath;
    const newProject: HydratedProjectRecord = {
      id: crypto.randomUUID(),
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      ...partial,
    } as HydratedProjectRecord;

    this.projectService.loadConfig(newProject, directoryPath).pipe(
      switchMap(() => this.projectService.save(newProject, directoryPath)),
      catchError(err => { console.error('createProject error:', err); return EMPTY; })
    ).subscribe(() => {
      this.notifications.success(`${newProject.title} created`);
      this.showCreateDialog = false;
      this.pendingDirectoryPath = null;
      this.projectsChanged.emit();
    });
  }

  importProject(): void {
    this.dialog.pickFolder().pipe(
      filter(folder => !!folder),
      switchMap(folder => this.projectService.importFromDirectory(folder!)),
      catchError(err => { console.error('importProject error:', err); return EMPTY; })
    ).subscribe(() => this.projectsChanged.emit());
  }

  scanForProjects(): void {
    this.dialog.pickFolder().pipe(
      filter(folder => !!folder),
      switchMap(folder => invoke<string[]>('scan_for_projects', { root: folder! })),
      switchMap(paths => {
        if (!paths.length) return EMPTY;
        return forkJoin(paths.map(p => this.projectService.importFromDirectory(p)));
      }),
      catchError(err => { console.error('scanForProjects error:', err); return EMPTY; })
    ).subscribe(() => this.projectsChanged.emit());
  }
}