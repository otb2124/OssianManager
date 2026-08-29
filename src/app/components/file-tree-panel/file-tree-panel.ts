// file-explorer-panel.ts
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { map } from 'rxjs';
import { FsEntry } from '../../services/persistence/persistence.service';
import { FileExplorerService } from '../../services/persistence/file-explorer.service';
import { DialogService } from '../../services/persistence/dialog.service';
import { TreeControl, AppTreeNode, TreeControlConfig } from '../field-controls/tree-control/tree-control';

@Component({
  selector: 'app-file-tree-panel',
  standalone: true,
  imports: [CommonModule, TreeControl, ButtonModule],
  templateUrl: './file-tree-panel.html',
})
export class FileExplorerPanel {
  protected readonly explorerService = inject(FileExplorerService);
  private readonly dialogService = inject(DialogService);

  protected readonly rootNodes = signal<AppTreeNode<FsEntry>[]>([]);

  protected readonly treeConfig: TreeControlConfig<FsEntry> = {
    showIcons: true,
    isSelected: (node) => !!node.data && this.explorerService.isSelected(node.data),
    loadChildren: (node) => {
      return this.explorerService.listDirectory(node.data!.path).pipe(
        map(entries => entries.map(e => this.toTreeNode(e)))
      );
    }
  };

  constructor() {
    effect(() => {
      const root = this.explorerService.rootPath();
      if (!root) return;
      this.explorerService.listDirectory(root).subscribe(entries => {
        this.rootNodes.set(entries.map(e => this.toTreeNode(e)));
      });
    });
  }

  private toTreeNode(entry: FsEntry): AppTreeNode<FsEntry> {
    return {
      id: entry.path,
      key: entry.path,
      label: entry.name,
      data: entry,
      leaf: !entry.isDirectory,
      icon: entry.isDirectory ? 'pi pi-folder' : 'pi pi-file',
      children: entry.isDirectory ? [] : undefined
    };
  }

  onNodeSelect(node: AppTreeNode<FsEntry>): void {
    if (node.data) {
      this.explorerService.select(node.data);
    }
  }

  browseFolder(): void {
    this.dialogService.pickFolder().subscribe(path => {
      if (path) this.explorerService.setRoot(path);
    });
  }
}