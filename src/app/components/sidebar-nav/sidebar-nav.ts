import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SidebarNavItem, SidebarNavService } from '../../services/routes/sidebar-nav.service';

@Component({
  selector: 'app-sidebar-nav',
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    RouterLink, RouterLinkActive
  ],
  templateUrl: './sidebar-nav.html',
})
export class SidebarNav {

  protected readonly nav = inject(SidebarNavService);
  private readonly router = inject(Router);

  selectItem(item: SidebarNavItem): void {
    if (item.route) {
      this.router.navigateByUrl(item.route);
    }
  }
}