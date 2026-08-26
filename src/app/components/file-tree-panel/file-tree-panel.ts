// file-explorer-panel.ts
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FsEntry } from '../../services/persistence/persistence.service';
import { FileTreeNode } from '../file-tree-node/file-tree-node';
import { ButtonModule } from 'primeng/button';
import { FileExplorerService } from '../../services/persistence/file-explorer.service';
import { DialogService } from '../../services/persistence/dialog.service';

@Component({
  selector: 'app-file-tree-panel',
  standalone: true,
  imports: [CommonModule, FileTreeNode, ButtonModule],
  templateUrl: './file-tree-panel.html',
})
export class FileExplorerPanel {
  protected readonly explorerService = inject(FileExplorerService);
  private readonly dialogService = inject(DialogService);

  protected readonly rootEntries = signal<FsEntry[]>([]);

  constructor() {
    effect(() => {
      const root = this.explorerService.rootPath();
      if (!root) return;
      this.explorerService.listDirectory(root).subscribe(entries => this.rootEntries.set(entries));
    });
  }

  browseFolder(): void {
    this.dialogService.pickFolder().subscribe(path => {
      if (path) this.explorerService.setRoot(path);
    });
  }
}