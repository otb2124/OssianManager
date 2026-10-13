// file-explorer-panel.ts
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { map, of } from 'rxjs';
import { FsEntry } from '../../services/persistence/persistence.service';
import { FileExplorerService } from '../../services/persistence/file-explorer.service';
import { DialogService } from '../../services/persistence/dialog.service';
import { TreeControl, AppTreeNode, TreeControlConfig } from '../field-controls/tree-control/tree-control';
import { MOCK_RESOURCE_GROUPS, ResourceEntry } from '../../model/file-tree.mock';

/** What each node in the combined tree stands for. */
export type PanelNodeData =
  | { kind: 'files-root' }
  | { kind: 'fs'; entry: FsEntry }
  | { kind: 'resources-root' }
  | { kind: 'resource-group'; group: string }
  | { kind: 'resource'; resource: ResourceEntry };

type PanelNode = AppTreeNode<PanelNodeData>;

@Component({
  selector: 'app-file-tree-panel',
  standalone: true,
  imports: [CommonModule, TreeControl, ButtonModule],
  templateUrl: './file-tree-panel.html',
})
export class FileExplorerPanel {
  protected readonly explorerService = inject(FileExplorerService);
  private readonly dialogService = inject(DialogService);

  // Root node objects are kept stable on purpose: tree-control mutates them
  // (expanded state, lazily loaded children), so they must survive refreshes.
  private readonly filesRoot: PanelNode = {
    id: 'root:files',
    key: 'root:files',
    label: 'Files',
    icon: 'pi pi-folder',
    styleClass: 'font-semibold',
    data: { kind: 'files-root' },
    leaf: false,
    expanded: true,
    children: [],
  };

  private readonly resourcesRoot: PanelNode = {
    id: 'root:resources',
    key: 'root:resources',
    label: 'Resources',
    icon: 'pi pi-database',
    styleClass: 'font-semibold',
    data: { kind: 'resources-root' },
    leaf: false,
    expanded: true,
    children: this.buildMockResourceNodes(),
  };

  protected readonly nodes = signal<PanelNode[]>([this.filesRoot, this.resourcesRoot]);
  private readonly selectedResourceId = signal<string | null>(null);

  protected readonly treeConfig: TreeControlConfig<PanelNodeData> = {
    showIcons: true,
    isSelected: (node) => {
      const d = node.data;
      if (d?.kind === 'fs') return this.explorerService.isSelected(d.entry);
      if (d?.kind === 'resource') return node.id === this.selectedResourceId();
      return false;
    },
    loadChildren: (node) => {
      const d = node.data;
      if (d?.kind === 'fs') {
        return this.explorerService.listDirectory(d.entry.path).pipe(
          map(entries => entries.map(e => this.toFsNode(e)))
        );
      }
      if (d?.kind === 'files-root') {
        const root = this.explorerService.rootPath();
        if (!root) return of([]);
        return this.explorerService.listDirectory(root).pipe(
          map(entries => entries.map(e => this.toFsNode(e)))
        );
      }
      return of([]);
    },
  };

  constructor() {
    effect(() => {
      const root = this.explorerService.rootPath();
      if (!root) return;
      this.explorerService.listDirectory(root).subscribe(entries => {
        this.filesRoot.children = entries.map(e => this.toFsNode(e));
        this.nodes.set([this.filesRoot, this.resourcesRoot]); // new array ref, same node objects
      });
    });
  }

  private toFsNode(entry: FsEntry): PanelNode {
    return {
      id: entry.path,
      key: entry.path,
      label: entry.name,
      data: { kind: 'fs', entry },
      leaf: !entry.isDirectory,
      icon: entry.isDirectory ? 'pi pi-folder' : 'pi pi-file',
      children: entry.isDirectory ? [] : undefined,
    };
  }

  // MOCK: swap for real resource data later
  private buildMockResourceNodes(): PanelNode[] {
    return MOCK_RESOURCE_GROUPS.map((group: { key: any; label: any; items: any[]; icon: any; }) => ({
      id: `res-group:${group.key}`,
      key: `res-group:${group.key}`,
      label: `${group.label} (${group.items.length})`,
      icon: group.icon,
      data: { kind: 'resource-group', group: group.key } as PanelNodeData,
      leaf: false,
      expanded: false,
      children: group.items.map((item: { id: any; }) => ({
        id: `res:${item.id}`,
        key: `res:${item.id}`,
        label: item.id,
        icon: 'pi pi-circle',
        data: { kind: 'resource', resource: item } as PanelNodeData,
        leaf: true,
      })),
    }));
  }

  onNodeSelect(node: PanelNode): void {
    const d = node.data;
    if (!d) return;
    switch (d.kind) {
      case 'fs':
        this.explorerService.select(d.entry);
        break;
      case 'resource':
        this.selectedResourceId.set(node.id);
        // TODO: hook into the file inspector / engine once real resource data exists
        break;
      default:
        break; // roots and groups only organize the tree
    }
  }

  browseFolder(): void {
    this.dialogService.pickFolder().subscribe(path => {
      if (path) this.explorerService.setRoot(path);
    });
  }
}