import { Component } from '@angular/core';
import { ProjectRecordAccordion } from "../../components/projects/project-record-accordion/project-record-accordion";
import { ProjectManagementPanel } from "../../components/projects/project-management-panel/project-management-panel";

@Component({
  selector: 'app-projects-page',
  imports: [ProjectRecordAccordion, ProjectManagementPanel],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.css',
})
export class ProjectsPage {

}
