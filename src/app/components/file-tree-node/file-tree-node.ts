// file-tree-node.ts
import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FsEntry } from '../../services/persistence/persistence.service';
import { FileExplorerService } from '../../services/persistence/file-explorer.service';

@Component({
  selector: 'app-file-tree-node',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-tree-node.html',
})
export class FileTreeNode {
  @Input({ required: true }) entry!: FsEntry;

  private readonly explorerService = inject(FileExplorerService);

  protected readonly expanded = signal(false);
  protected readonly loading = signal(false);
  protected readonly children = signal<FsEntry[] | null>(null);

  toggleExpanded(event: Event): void {
    event.stopPropagation();
    if (!this.entry.isDirectory) return;

    if (this.expanded()) {
      this.expanded.set(false);
      return;
    }

    this.expanded.set(true);
    if (this.children() !== null) return; // already loaded once — don't refetch on every re-expand

    this.loading.set(true);
    this.explorerService.listDirectory(this.entry.path).subscribe({
      next: entries => {
        this.children.set(entries);
        this.loading.set(false);
      },
      error: () => {
        this.children.set([]);
        this.loading.set(false);
      },
    });
  }
}