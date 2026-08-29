import { Observable } from 'rxjs';
import { TreeNode } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef, Output, EventEmitter, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Tree, TreeModule, TreeNodeSelectEvent, TreeNodeExpandEvent } from 'primeng/tree';
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

@Component({
  selector: 'app-tree-control',
  standalone: true,
  imports: [CommonModule, TreeModule, ButtonModule, InputTextModule],
  templateUrl: './tree-control.html',
})
export class TreeControl<T = any> {
  @ViewChild('pTree') pTree?: Tree;

  @Input({ required: true }) nodes: AppTreeNode<T>[] = [];
  @Input() config: TreeControlConfig<T> = {};
  @Input() nodeTemplate?: TemplateRef<any>;

  @Output() nodeSelect = new EventEmitter<AppTreeNode<T>>();
  @Output() nodeUnselect = new EventEmitter<AppTreeNode<T>>();
  @Output() nodeExpand = new EventEmitter<AppTreeNode<T>>();
  @Output() nodeCollapse = new EventEmitter<AppTreeNode<T>>();

  onFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this.pTree) {
      this.pTree._filter(value);
    }
  }

  expandAll(): void {
    this.nodes.forEach(node => this.expandRecursive(node, true));
  }

  collapseAll(): void {
    this.nodes.forEach(node => this.expandRecursive(node, false));
  }

  private expandRecursive(node: AppTreeNode<T>, isExpand: boolean): void {
    node.expanded = isExpand;
    if (node.children) {
      node.children.forEach(childNode => this.expandRecursive(childNode, isExpand));
    }
  }

  onNodeSelect(event: TreeNodeSelectEvent): void {
    const node = event.node as AppTreeNode<T>;
    if (node) this.nodeSelect.emit(node);
  }

  onNodeUnselect(event: TreeNodeSelectEvent): void {
    const node = event.node as AppTreeNode<T>;
    if (node) this.nodeUnselect.emit(node);
  }

  onNodeExpand(event: TreeNodeExpandEvent): void {
    const node = event.node as AppTreeNode<T>;
    this.nodeExpand.emit(node);

    if (this.config.loadChildren && !node.children?.length && !node.leaf) {
      node.loading = true;
      this.config.loadChildren(node).subscribe({
        next: (children) => {
          node.children = children;
          node.loading = false;
        },
        error: () => {
          node.children = [];
          node.loading = false;
        }
      });
    }
  }

  onNodeCollapse(event: TreeNodeExpandEvent): void {
    const node = event.node as AppTreeNode<T>;
    this.nodeCollapse.emit(node);
  }

  isSelected(node: AppTreeNode<T>): boolean {
    return this.config.isSelected ? this.config.isSelected(node) : false;
  }
}