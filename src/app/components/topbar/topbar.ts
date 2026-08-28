import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TabsControl } from '../tabs-control/tabs-control';
import { ProjectUiService } from '../../services/projects/project-ui/project-ui.service';
import { ProjectService } from '../../services/projects/project.service';
import { MenuNav } from '../module-control/menu-nav';

@Component({
  selector: 'app-topbar',
  imports: [CommonModule, TabsControl, MenuNav],
  templateUrl: './topbar.html',
})
export class Topbar {
  protected projectService = inject(ProjectService);
  private projectUiService = inject(ProjectUiService);
  private router = inject(Router);

  goToProject(): void {
    const id = this.projectService.projectId();
    if (!id) return;
    this.projectUiService.scrollTo(id);
    this.router.navigateByUrl('/general/home');
  }
}