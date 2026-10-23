import { Observable } from 'rxjs';
import { TreeNode } from 'primeng/api';
import { CommonModule } from '@angular/common';
import {
  Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, TemplateRef, signal,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TreeModule, TreeNodeSelectEvent, TreeNodeExpandEvent } from 'primeng/tree';
import { InputTextModule } from 'primeng/inputtext';

export interface AppTreeNode<T = any> extends TreeNode<T> {
  id: string;
  data?: T;
  children?: AppTreeNode<T>[];
}

export interface TreeControlConfig<T = any> {
  selectionMode?: 'single' | 'multiple' | 'checkbox';
  showIcons?: boolean;
  /** Custom check to evaluate if a node is currently selected */
  isSelected?: (node: AppTreeNode<T>) => boolean;
  /** Lazy load function triggered on expansion when children are missing */
  loadChildren?: (node: AppTreeNode<T>) => Observable<AppTreeNode<T>[]>;
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

@Component({
  selector: 'app-tree-control',
  standalone: true,
  imports: [CommonModule, TreeModule, ButtonModule, InputTextModule],
  templateUrl: './tree-control.html',
})
export class TreeControl<T = any> implements OnChanges {
  @Input({ required: true }) nodes: AppTreeNode<T>[] = [];
  @Input() config: TreeControlConfig<T> = {};
  @Input() nodeTemplate?: TemplateRef<any>;

  @Output() nodeSelect = new EventEmitter<AppTreeNode<T>>();
  @Output() nodeUnselect = new EventEmitter<AppTreeNode<T>>();
  @Output() nodeExpand = new EventEmitter<AppTreeNode<T>>();
  @Output() nodeCollapse = new EventEmitter<AppTreeNode<T>>();

  /** What p-tree renders: fresh copies of `nodes`, filtered. A new array/objects => OnPush re-renders. */
  protected readonly view = signal<AppTreeNode<T>[]>([]);

  private filterValue = '';
  /** After "collapse all" while filtering, don't force matching branches open again. */
  private suppressReveal = false;
  /** displayed copy -> the consumer's original node */
  private readonly origin = new WeakMap<AppTreeNode<T>, AppTreeNode<T>>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodes']) this.rebuild();
  }

  // ── toolbar ────────────────────────────────────────────────────────────

  onFilter(event: Event): void {
    this.applyFilter((event.target as HTMLInputElement).value);
  }

  clearFilter(input: HTMLInputElement): void {
    input.value = '';
    this.applyFilter('');
  }

  expandAll(): void {
    this.suppressReveal = false;
    this.setExpanded(true);
  }

  collapseAll(): void {
    this.suppressReveal = true;
    this.setExpanded(false);
  }

  // ── p-tree events ──────────────────────────────────────────────────────

  onNodeSelect(event: TreeNodeSelectEvent): void {
    const node = event.node as AppTreeNode<T>;
    if (node) this.nodeSelect.emit(this.toOrigin(node));
  }

  onNodeUnselect(event: TreeNodeSelectEvent): void {
    const node = event.node as AppTreeNode<T>;
    if (node) this.nodeUnselect.emit(this.toOrigin(node));
  }

  onNodeExpand(event: TreeNodeExpandEvent): void {
    const shown = event.node as AppTreeNode<T>;
    const node = this.toOrigin(shown);
    node.expanded = true;                       // persist on the consumer's node
    this.nodeExpand.emit(node);

    if (this.config.loadChildren && !node.children?.length && !node.leaf) {
      node.loading = true;
      shown.loading = true;
      this.config.loadChildren(node).subscribe({
        next: (children) => { node.children = children; node.loading = false; this.rebuild(); },
        error: () => { node.children = []; node.loading = false; this.rebuild(); },
      });
    }
  }

  onNodeCollapse(event: TreeNodeExpandEvent): void {
    const node = this.toOrigin(event.node as AppTreeNode<T>);
    node.expanded = false;
    this.nodeCollapse.emit(node);
  }

  isSelected(node: AppTreeNode<T>): boolean {
    return this.config.isSelected ? this.config.isSelected(node) : false;
  }

  // ── internals ──────────────────────────────────────────────────────────

  private applyFilter(value: string): void {
    this.filterValue = value;
    this.suppressReveal = false;
    this.rebuild();
  }

  private setExpanded(expanded: boolean): void {
    const walk = (list?: AppTreeNode<T>[]) => list?.forEach(n => {
      const was = !!n.expanded;
      n.expanded = expanded;
      if (was !== expanded) (expanded ? this.nodeExpand : this.nodeCollapse).emit(n);
      walk(n.children);
    });
    walk(this.nodes);
    this.rebuild();
  }

  private toOrigin(node: AppTreeNode<T>): AppTreeNode<T> {
    return this.origin.get(node) ?? node;
  }

  private rebuild(): void {
    const query = norm(this.filterValue);
    const out: AppTreeNode<T>[] = [];
    for (const n of this.nodes ?? []) {
      const copy = this.project(n, query);
      if (copy) out.push(copy);
    }
    this.view.set(out);
  }

  /** Lenient filter: a matching node keeps its whole subtree; ancestors of matches are shown (and opened). */
  private project(node: AppTreeNode<T>, query: string): AppTreeNode<T> | null {
    if (!query || norm(node.label ?? '').includes(query)) {
      return this.clone(node, node.children?.map(c => this.project(c, '')!), !!node.expanded);
    }
    const kids = (node.children ?? [])
      .map(c => this.project(c, query))
      .filter((c): c is AppTreeNode<T> => !!c);
    if (!kids.length) return null;
    return this.clone(node, kids, this.suppressReveal ? !!node.expanded : true);
  }

  private clone(node: AppTreeNode<T>, children: AppTreeNode<T>[] | undefined, expanded: boolean): AppTreeNode<T> {
    const copy: AppTreeNode<T> = { ...node, children, expanded };
    this.origin.set(copy, node);
    return copy;
  }
}