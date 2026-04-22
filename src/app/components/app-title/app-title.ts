import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { TagModule } from "primeng/tag";
import { Popover, PopoverModule } from 'primeng/popover';
import { AppConfigService } from '../../services/app-config/app-config.service';
import { CommonModule } from '@angular/common';
import { GitService } from '../../services/git/git.service';
import { GitCommit } from '../../model/git.model';

@Component({
  selector: 'app-title',
  imports: [TagModule, CommonModule, PopoverModule],
  templateUrl: './app-title.html',
})
export class AppTitle implements OnInit {
  protected appConfigService = inject(AppConfigService);
  private gitService = inject(GitService);

  @ViewChild('op') op!: Popover;

  readonly commit = signal<GitCommit | null>(null);

  private triggerHovered = false;
  private popoverHovered = false;

  ngOnInit(): void {
    this.gitService.getLatestCommit().subscribe(c => this.commit.set(c));
  }

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