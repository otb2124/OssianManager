import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { HydratedProjectRecord } from '../../model/project-record.model';
import { ButtonModule } from "primeng/button";
import { ProjectService } from '../../services/projects/project.service';

@Component({
  selector: 'app-project-record-overview',
  imports: [CommonModule, TagModule, ButtonModule],
  templateUrl: './project-record-overview.html',
})
export class ProjectRecordOverview {
  @Input({ required: true }) project!: HydratedProjectRecord;
  @Input({ required: true }) directoryPath!: string;

  private projectService = inject(ProjectService);
  private router = inject(Router);

  readonly isActive = computed(() => this.projectService.projectId() === this.project.id);

  openProject(event: Event): void {
    event.stopPropagation();
    if (this.isActive()) return;
    this.projectService.setProject(this.project, this.directoryPath);
    this.router.navigateByUrl('/project');
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    const updated = { ...this.project, isFavorite: !this.project.isFavorite };
    this.project = updated;
    this.projectService.save(updated, this.directoryPath).subscribe();
  }
}