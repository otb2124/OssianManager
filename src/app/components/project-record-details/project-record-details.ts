import { Component, Input, inject, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { HydratedProjectRecord } from '../../model/project-record.model';
import { Router } from '@angular/router';
import { invoke } from '@tauri-apps/api/core';
import { DialogWrapper } from '../dialog-wrapper/dialog-wrapper';
import { ProjectRecordForm } from '../project-record-form/project-record-form';
import { ConfirmForm } from '../confirm-form/confirm-form';
import { NotificationService } from '../../services/notifications/notification.service';
import { ProjectService } from '../../services/projects/project.service';

@Component({
  selector: 'app-project-record-details',
  imports: [CommonModule, TagModule, ButtonModule, DialogWrapper, ProjectRecordForm, ConfirmForm],
  templateUrl: './project-record-details.html',
})
export class ProjectRecordDetails {
  @Input({ required: true }) project!: HydratedProjectRecord;
  @Input({ required: true }) directoryPath!: string;

  readonly deleted = output<void>();
  readonly updated = output<HydratedProjectRecord>();

  private projectService = inject(ProjectService);
  private router = inject(Router);
  private notifications = inject(NotificationService);

  readonly isActive = computed(() => this.projectService.projectId() === this.project.id);

  showEditDialog = false;
  showDeleteDialog = false;
  showRemoveDialog = false;

  openProject(event: Event): void {
    event.stopPropagation();
    if (this.isActive()) return;
    this.projectService.setProject(this.project, this.directoryPath);
    this.router.navigateByUrl('/project');
  }

  closeProject(event: Event): void {
    event.stopPropagation();
    if (!this.isActive()) return;
    this.projectService.clearProject();
  }

  async openInExplorer(event: Event): Promise<void> {
    event.stopPropagation();
    await invoke('reveal_in_explorer', { path: this.directoryPath });
  }

  openDeleteDialog(event: Event): void {
    event.stopPropagation();
    this.showDeleteDialog = true;
  }

  openRemoveDialog(event: Event): void {
    event.stopPropagation();
    this.showRemoveDialog = true;
  }

  confirmRemove(): void {
    if (this.isActive()) this.projectService.clearProject();
    this.projectService.delete(this.project.id).subscribe(() => this.deleted.emit());
  }

  async confirmDelete(): Promise<void> {
    if (this.isActive()) this.projectService.clearProject();
    await invoke('delete_directory', { path: this.directoryPath });
    this.projectService.delete(this.project.id).subscribe(() => this.deleted.emit());
  }

  openEditDialog(event: Event): void {
    event.stopPropagation();
    this.showEditDialog = true;
  }

  onEditSubmitted(partial: Partial<HydratedProjectRecord>): void {
    const updated: HydratedProjectRecord = {
      ...this.project,
      ...partial,
      updatedAt: new Date(),
    };
    this.projectService.save(updated, this.directoryPath).subscribe(() => {
      this.project = updated;
      if (this.isActive()) this.projectService.setProject(updated, this.directoryPath);
      this.showEditDialog = false;
      this.updated.emit(updated);
    });
  }
}