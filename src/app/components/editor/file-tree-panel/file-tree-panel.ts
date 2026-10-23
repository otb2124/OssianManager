// file-explorer-panel.ts
import { Component, inject, signal, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { map, of } from 'rxjs';
import { FsEntry } from '../../../services/persistence/persistence.service';
import { FileExplorerService } from '../../../services/persistence/file-explorer.service';
import { DialogService } from '../../../services/persistence/dialog.service';
import { ResourceCatalogService } from '../../../services/data/resources/resource-catalog.service';
import { TreeControl, AppTreeNode, TreeControlConfig } from '../../shared/tree-control/tree-control';
import { MOCK_RESOURCE_GROUPS, ResourceGroup } from '../../../model/file-tree.mock';
import { RESOURCE_GROUP_META, ResourceEntry, resourceGroupOf } from '../../../model/resource.model';

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
  private readonly catalog = inject(ResourceCatalogService);

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
    children: [], // filled by the effect below
  };

  protected readonly nodes = signal<PanelNode[]>([this.filesRoot, this.resourcesRoot]);

  protected readonly treeConfig: TreeControlConfig<PanelNodeData> = {
    showIcons: true,
    isSelected: (node) => {
      const d = node.data;
      if (d?.kind === 'fs') return this.explorerService.isSelected(d.entry);
      if (d?.kind === 'resource') return this.explorerService.selectedResource()?.id === d.resource.id;
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

    // Resources: the engine's resources.json when it can be read, the mock groups otherwise.
    effect(() => {
      this.catalog.entries(); // re-run when the catalog (re)loads
      untracked(() => {
        this.resourcesRoot.children = this.buildResourceNodes();
        this.nodes.set([this.filesRoot, this.resourcesRoot]);
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

  private buildResourceNodes(): PanelNode[] {
    const entries = this.catalog.entries();
    const groups = entries.length ? this.groupEntries(entries) : MOCK_RESOURCE_GROUPS;

    return groups.map((group): PanelNode => ({
      id: `res-group:${group.key}`,
      key: `res-group:${group.key}`,
      label: `${group.label} (${group.items.length})`,
      icon: group.icon,
      data: { kind: 'resource-group', group: group.key },
      leaf: false,
      expanded: false,
      children: group.items.map((item): PanelNode => ({
        id: `res:${item.id}`,
        key: `res:${item.id}`,
        label: item.id,
        icon: 'pi pi-circle',
        data: { kind: 'resource', resource: item },
        leaf: true,
      })),
    }));
  }

  private groupEntries(entries: ResourceEntry[]): ResourceGroup[] {
    const byGroup = new Map<string, ResourceEntry[]>();
    for (const entry of entries) {
      const key = resourceGroupOf(entry.type);
      const list = byGroup.get(key);
      if (list) list.push(entry);
      else byGroup.set(key, [entry]);
    }
    return RESOURCE_GROUP_META
      .filter(meta => byGroup.has(meta.key))
      .map(meta => ({ ...meta, items: byGroup.get(meta.key)! }));
  }

  onNodeSelect(node: PanelNode): void {
    const d = node.data;
    if (!d) return;
    switch (d.kind) {
      case 'fs':
        this.explorerService.select(d.entry);
        break;
      case 'resource':
        this.explorerService.selectResource(d.resource);
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