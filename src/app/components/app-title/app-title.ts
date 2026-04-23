import { Component, inject, ViewChild } from '@angular/core';
import { TagModule } from "primeng/tag";
import { Popover, PopoverModule } from 'primeng/popover';
import { AppConfigService } from '../../services/app-config/app-config.service';
import { CommonModule } from '@angular/common';
import { EngineService } from '../../services/engine-config/engine.service';

@Component({
  selector: 'app-title',
  imports: [TagModule, CommonModule, PopoverModule],
  templateUrl: './app-title.html',
})
export class AppTitle {
  protected appConfigService = inject(AppConfigService);
  protected engineConfigService = inject(EngineService);

  @ViewChild('op') op!: Popover;

  private triggerHovered = false;
  private popoverHovered = false;


  onTriggerEnter(event: Event): void {
    this.triggerHovered = true;
    this.op.show(event);
  }

  onTriggerLeave(event: Event): void {
    this.triggerHovered = false;
    setTimeout(() => {
      if (!this.popoverHovered) this.op.hide();
    }, 100);
  }

  onPopoverEnter(): void {
    this.popoverHovered = true;
  }

  onPopoverLeave(): void {
    this.popoverHovered = false;
    setTimeout(() => {
      if (!this.triggerHovered) this.op.hide();
    }, 100);
  }
}