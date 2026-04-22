import { Component } from '@angular/core';
import { ProjectRecordAccordion } from "../../../components/project-record-accordion/project-record-accordion";
import { ProjectManagementPanel } from "../../../components/project-management-panel/project-management-panel";

@Component({
  selector: 'app-home',
  imports: [ProjectRecordAccordion, ProjectManagementPanel],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

}
