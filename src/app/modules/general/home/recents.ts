import { Component } from '@angular/core';
import { ProjectRecordAccordion } from "../../../components/project-record-accordion/project-record-accordion";
import { ProjectManagementPanel } from "../../../components/project-management-panel/project-management-panel";

@Component({
  selector: 'app-recents',
  imports: [ProjectRecordAccordion, ProjectManagementPanel],
  templateUrl: './recents.html',
  styleUrl: './recents.css',
})
export class Recents {

}
