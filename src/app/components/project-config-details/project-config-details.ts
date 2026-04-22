import { Component, inject, OnInit } from '@angular/core';
import { ProjectService } from '../../services/projects/project.service';

@Component({
  selector: 'app-project-config-details',
  imports: [],
  templateUrl: './project-config-details.html',
  styleUrl: './project-config-details.css',
})
export class ProjectConfigDetails implements OnInit{

  protected projectService = inject(ProjectService);

  ngOnInit(): void {
    this.projectService.loadConfigFromCurrent().subscribe();
  }
}
