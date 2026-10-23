import { Component, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { invoke } from '@tauri-apps/api/core';
import { map, of } from 'rxjs';
import { FsEntry } from '../../../services/persistence/persistence.service';
import { FileExplorerService } from '../../../services/persistence/file-explorer.service';
import { DialogService } from '../../../services/persistence/dialog.service';
import { ResourceCatalogService } from '../../../services/data/resources/resource-catalog.service';
import { NotificationService } from '../../../services/notifications/notification.service';
import { normalizePath } from '../../../services/utils/path.util';
import { TreeControl, AppTreeNode, TreeControlConfig } from '../../shared/tree-control/tree-control';
import { MOCK_RESOURCE_GROUPS, ResourceGroup } from '../../../model/file-tree.mock';
import { RESOURCE_GROUP_META, ResourceEntry, resourceGroupOf } from '../../../model/resource.model';

export type PanelNodeData =
  | { kind: 'files-root' }
  | { kind: 'fs'; entry: FsEntry }
  | { kind: 'resources-root' }
  | { kind: 'resource-group'; group: string }
  | { kind: 'resource'; resource: ResourceEntry };

type PanelNode = AppTreeNode<PanelNodeData>;

interface Crumb { label: string; path: string; }

@Component({
  selector: 'app-file-tree-panel',
  standalone: true,
  imports: [CommonModule, TreeControl, ButtonModule, TooltipModule],
  templateUrl: './file-tree-panel.html',
})
export class FileExplorerPanel {
  protected readonly explorerService = inject(FileExplorerService);
  private readonly dialogService = inject(DialogService);
  private readonly catalog = inject(ResourceCatalogService);
  private readonly notifications = inject(NotificationService);

  private readonly crumbsEl = viewChild<ElementRef<HTMLElement>>('crumbsBar');
  private loadToken = 0;

  private readonly filesRoot: PanelNode = {
    id: 'root:files', key: 'root:files', label: 'Files', icon: 'pi pi-folder',
    styleClass: 'font-semibold', data: { kind: 'files-root' },
    leaf: false, expanded: true, children: [],
  };

  private readonly resourcesRoot: PanelNode = {
    id: 'root:resources', key: 'root:resources', label: 'Resources', icon: 'pi pi-database',
    styleClass: 'font-semibold', data: { kind: 'resources-root' },
    leaf: false, expanded: true, children: [],
  };

  protected readonly nodes = signal<PanelNode[]>([this.filesRoot, this.resourcesRoot]);

  /** Address bar: one clickable segment per folder of the current root. */
  protected readonly crumbs = computed<Crumb[]>(() => {
    const root = this.explorerService.rootPath();
    if (!root) return [];

    const p = normalizePath(root);
    const unc = p.startsWith('\\\\');
    const parts = p.slice(unc ? 2 : 0).split('\\').filter(Boolean);

    const out: Crumb[] = [];
    let acc = '';
    parts.forEach((label, i) => {
      acc = i === 0 ? (unc ? `\\\\${label}` : label) : `${acc}\\${label}`;
      const isDrive = i === 0 && !unc && /^[A-Za-z]:$/.test(acc);
      out.push({ label, path: isDrive ? acc + '\\' : acc });
    });
    return out;
  });

  /** Selected entry, only when it is a folder (enables "open selected folder"). */
  protected readonly selectedFolder = computed(() => {
    const e = this.explorerService.selectedEntry();
    return e?.isDirectory ? e : null;
  });

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
    // Reload the Files root when the root folder changes or Refresh is pressed.
    effect(() => {
      const root = this.explorerService.rootPath();
      this.explorerService.refreshTick();
      if (!root) return;

      const token = ++this.loadToken;
      this.explorerService.listDirectory(root).subscribe({
        next: entries => {
          if (token !== this.loadToken) return; // a newer navigation superseded this one
          this.filesRoot.children = entries.map(e => this.toFsNode(e));
          this.nodes.set([this.filesRoot, this.resourcesRoot]);
        },
        error: err => {
          if (token !== this.loadToken) return;
          this.filesRoot.children = [];
          this.nodes.set([this.filesRoot, this.resourcesRoot]);
          this.notifications.error('Could not open folder', String(err));
        },
      });
    });

    effect(() => {
      this.catalog.entries();
      untracked(() => {
        this.resourcesRoot.children = this.buildResourceNodes();
        this.nodes.set([this.filesRoot, this.resourcesRoot]);
      });
    });

    // Keep the end of a long path visible.
    effect(() => {
      this.crumbs();
      setTimeout(() => {
        const el = this.crumbsEl()?.nativeElement;
        if (el) el.scrollLeft = el.scrollWidth;
      });
    });
  }

  // ── toolbar ────────────────────────────────────────────────────────────

  openSelectedFolder(): void {
    const folder = this.selectedFolder();
    if (folder) this.explorerService.navigate(folder.path);
  }

  async revealRoot(): Promise<void> {
    const root = this.explorerService.rootPath();
    if (!root) return;
    try {
      await invoke('reveal_in_explorer', { path: root });
    } catch (err) {
      this.notifications.error('Could not reveal in file explorer', String(err));
    }
  }

  browseFolder(): void {
    this.dialogService.pickFolder().subscribe(path => {
      if (path) this.explorerService.navigate(path);
    });
  }

  onKeydown(event: KeyboardEvent): void {
    // Typing in the tree's filter box must not trigger navigation.
    if ((event.target as HTMLElement | null)?.tagName === 'INPUT') return;

    if (event.altKey && event.key === 'ArrowLeft') this.explorerService.back();
    else if (event.altKey && event.key === 'ArrowRight') this.explorerService.forward();
    else if (event.altKey && event.key === 'ArrowUp') this.explorerService.up();
    else if (event.key === 'F5') this.explorerService.refresh();
    else return;

    event.preventDefault(); // also stops WebView2's own Alt+Arrow history navigation
  }

  // ── tree ───────────────────────────────────────────────────────────────

  onNodeSelect(node: PanelNode): void {
    const d = node.data;
    if (!d) return;
    switch (d.kind) {
      case 'fs': this.explorerService.select(d.entry); break;
      case 'resource': this.explorerService.selectResource(d.resource); break;
      default: break;
    }
  }

  private toFsNode(entry: FsEntry): PanelNode {
    return {
      id: entry.path, key: entry.path, label: entry.name,
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
      id: `res-group:${group.key}`, key: `res-group:${group.key}`,
      label: `${group.label} (${group.items.length})`, icon: group.icon,
      data: { kind: 'resource-group', group: group.key },
      leaf: false, expanded: false,
      children: group.items.map((item): PanelNode => ({
        id: `res:${item.id}`, key: `res:${item.id}`, label: item.id, icon: 'pi pi-circle',
        data: { kind: 'resource', resource: item }, leaf: true,
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
}