import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppTreeNode, TreeControl, TreeControlConfig } from '../../shared/tree-control/tree-control';
import { EngineIpcService, EngineTreeNode } from '../../../services/engine/ipc/engine-ipc';

@Component({
  selector: 'app-hierarchy-panel',
  standalone: true,
  imports: [CommonModule, TreeControl],
  templateUrl: './hierarchy-panel.html',
})
export class HierarchyPanel {
  protected readonly engine = inject(EngineIpcService);

  // Plain Set on purpose: it must not retrigger the computed below.
  // Keeps expand/collapse state across tree refreshes (nodes.changed rebuilds every node object).
  private readonly collapsed = new Set<string>();

  protected readonly treeNodes = computed<AppTreeNode<EngineTreeNode>[]>(() =>
    this.engine.tree().map((node, i) => this.toTreeNode(node, `${i}`))
  );

  protected readonly treeConfig: TreeControlConfig<EngineTreeNode> = {
    showIcons: true,
    isSelected: (node) => !!node.data?.id && node.data.id === this.engine.selectedId(),
  };

  // Engine ids can be empty for unnamed nodes, so fall back to the tree path for the key.
  private toTreeNode(node: EngineTreeNode, path: string): AppTreeNode<EngineTreeNode> {
    const key = node.id || `path:${path}`;
    const hasChildren = node.children.length > 0;

    return {
      id: key,
      key,
      label: node.name || node.id || 'Node',
      icon: 'pi pi-box',
      styleClass: node.enabled ? undefined : 'opacity-50',
      data: node,
      leaf: !hasChildren,
      expanded: hasChildren && !this.collapsed.has(key),
      children: hasChildren
        ? node.children.map((child, i) => this.toTreeNode(child, `${path}/${i}`))
        : undefined,
    };
  }

  onNodeSelect(node: AppTreeNode<EngineTreeNode>): void {
    if (node.data?.id) this.engine.select(node.data.id);
  }

  onNodeExpand(node: AppTreeNode<EngineTreeNode>): void {
    this.collapsed.delete(node.id);
  }

  onNodeCollapse(node: AppTreeNode<EngineTreeNode>): void {
    this.collapsed.add(node.id);
  }
}