import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverModule, Popover } from 'primeng/popover';
import { AppConfigService } from '../../services/app-config/app-config.service';
import { GitService } from '../../services/git/git.service';
import { GitCommit } from '../../model/git.model';
import { AppTitle } from "../app-title/app-title";

@Component({
  selector: 'app-title-alt',
  imports: [CommonModule, PopoverModule, AppTitle],
  templateUrl: './app-title-alt.html',
})
export class AppTitleAlt implements OnInit {
  protected appConfigService = inject(AppConfigService);
  private gitService = inject(GitService);

  @ViewChild('infoPopover') infoPopover!: Popover;

  readonly commit = signal<GitCommit | null>(null);

  private triggerHovered = false;
  private popoverHovered = false;

  ngOnInit(): void {
    this.gitService.getLatestCommit().subscribe(c => this.commit.set(c));
  }

  onTriggerEnter(event: Event): void {
    this.triggerHovered = true;
    this.infoPopover.show(event);
  }

  onTriggerLeave(): void {
    this.triggerHovered = false;
    setTimeout(() => {
      if (!this.popoverHovered) {
        this.infoPopover.hide();
      }
    }, 100);
  }

  onPopoverEnter(): void {
    this.popoverHovered = true;
  }

  onPopoverLeave(): void {
    this.popoverHovered = false;
    setTimeout(() => {
      if (!this.triggerHovered) {
        this.infoPopover.hide();
      }
    }, 100);
  }
}