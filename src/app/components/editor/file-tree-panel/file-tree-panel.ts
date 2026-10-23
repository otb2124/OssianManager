import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { invoke } from '@tauri-apps/api/core';
import { map, of } from 'rxjs';
import { FsEntry } from '../../../services/persistence/persistence.service';
import { FileExplorerService } from '../../../services/persistence/file-explorer.service';
import { DialogService } from '../../../services/persistence/dialog.service';
import { NotificationService } from '../../../services/notifications/notification.service';
import { normalizePath } from '../../../services/utils/path.util';
import { TreeControl, AppTreeNode, TreeControlConfig } from '../../shared/tree-control/tree-control';

export type PanelNodeData = { kind: 'fs'; entry: FsEntry };

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
  private readonly notifications = inject(NotificationService);

  private readonly crumbsEl = viewChild<ElementRef<HTMLElement>>('crumbsBar');
  private loadToken = 0;

  protected readonly nodes = signal<PanelNode[]>([]);

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

  protected readonly selectedFolder = computed(() => {
    const e = this.explorerService.selectedEntry();
    return e?.isDirectory ? e : null;
  });

  protected readonly treeConfig: TreeControlConfig<PanelNodeData> = {
    showIcons: true,
    isSelected: (node) => node.data ? this.explorerService.isSelected(node.data.entry) : false,
    loadChildren: (node) => {
      const d = node.data;
      if (!d) return of([]);
      return this.explorerService.listDirectory(d.entry.path).pipe(
        map(entries => entries.map(e => this.toFsNode(e)))
      );
    },
  };

  constructor() {
    effect(() => {
      const root = this.explorerService.rootPath();
      this.explorerService.refreshTick();
      if (!root) {
        this.nodes.set([]);
        return;
      }
    
      const token = ++this.loadToken;
      this.explorerService.listDirectory(root).subscribe({
        next: entries => {
          if (token !== this.loadToken) return;
          this.nodes.set(entries.map(e => this.toFsNode(e)));
        },
        error: err => {
          if (token !== this.loadToken) return;
          this.nodes.set([]);
          this.notifications.error('Could not open folder', String(err));
        },
      });
    });

    effect(() => {
      this.crumbs();
      setTimeout(() => {
        const el = this.crumbsEl()?.nativeElement;
        if (el) el.scrollLeft = el.scrollWidth;
      });
    });
  }

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
    if ((event.target as HTMLElement | null)?.tagName === 'INPUT') return;

    if (event.altKey && event.key === 'ArrowLeft') this.explorerService.back();
    else if (event.altKey && event.key === 'ArrowRight') this.explorerService.forward();
    else if (event.altKey && event.key === 'ArrowUp') this.explorerService.up();
    else if (event.key === 'F5') this.explorerService.refresh();
    else return;

    event.preventDefault();
  }

  onNodeSelect(node: PanelNode): void {
    if (node.data) this.explorerService.select(node.data.entry);
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
}