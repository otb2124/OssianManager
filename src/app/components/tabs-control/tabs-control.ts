import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { TabsService } from '../../services/app-config/tabs.service';
import { RouteChild } from '../../app.routes';
import { ButtonModule } from "primeng/button";
import { ContextMenuDirective } from '../../services/system/context-menu.directive';

@Component({
  selector: 'app-tabs-control',
  imports: [CommonModule, FormsModule, TooltipModule, ButtonModule, ContextMenuDirective],
  templateUrl: './tabs-control.html',
})
export class TabsControl {
  protected tabsService = inject(TabsService);

  closeTab(tab: RouteChild, event: Event): void {
    event.stopPropagation();
    this.tabsService.closeTab(tab);
  }
}