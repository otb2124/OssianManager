import { Component, OnInit, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { HydratedProjectRecord } from '../../model/project-record.model';
import { ProjectRecordOverview } from '../project-record-overview/project-record-overview';
import { ProjectRecordDetails } from '../project-record-details/project-record-details';
import { ProjectUiService } from '../../services/data/projects/project-ui/project-ui.service';
import { ProjectService } from '../../services/data/projects/project.service';
import { ContextMenuDirective } from '../../services/system/context-menu.directive';

export interface ProjectEntry {
  project: HydratedProjectRecord;
  directoryPath: string;
}

@Component({
  selector: 'app-project-record-accordion',
  imports: [CommonModule, AccordionModule, ProjectRecordOverview, ProjectRecordDetails, ContextMenuDirective],
  templateUrl: './project-record-accordion.html',
})
export class ProjectRecordAccordion implements OnInit {

  entries: ProjectEntry[] = [];
  activeValues = signal<string[]>([]);

  private projectService = inject(ProjectService);
  private projectUiService = inject(ProjectUiService);

  constructor() {
    effect(() => {
      const id = this.projectUiService.scrollToProjectId();
      if (!id) return;
      this.activeValues.set([id]);
      setTimeout(() => {
        document.getElementById(`panel-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.projectUiService.clear();
      }, 50);
    });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.projectService.getAll().subscribe(entries => this.entries = entries);
  }

  onDeleted(projectId: string): void {
    this.entries = this.entries.filter(e => e.project.id !== projectId);
  }

  onUpdated(updated: HydratedProjectRecord): void {
    this.entries = this.entries.map(e =>
      e.project.id === updated.id ? { ...e, project: updated } : e
    );
  }
}