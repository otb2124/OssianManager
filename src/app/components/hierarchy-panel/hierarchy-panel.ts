import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node as BabylonNode } from '@babylonjs/core';
import { AppTreeNode, TreeControl, TreeControlConfig } from '../field-controls/tree-control/tree-control';
import { BabylonSceneService } from '../../services/babylon/babylonscene.service.ts';

@Component({
  selector: 'app-hierarchy-panel',
  standalone: true,
  imports: [CommonModule, TreeControl],
  templateUrl: './hierarchy-panel.html',
})
export class HierarchyPanel {
  protected readonly sceneService = inject(BabylonSceneService);

  protected readonly treeNodes = computed<AppTreeNode<BabylonNode>[]>(() => {
    // Reading nodeVersion forces computation whenever nodes change
    this.sceneService.nodeVersion(); 
    
    const scene = this.sceneService.scene();
    if (!scene) return [];

    return scene.rootNodes.map(node => this.toTreeNode(node));
  });

  protected readonly treeConfig: TreeControlConfig<BabylonNode> = {
    showIcons: true,
    isSelected: (node) => !!node.data && this.sceneService.isSelected(node.data),
  };

  private toTreeNode(node: BabylonNode): AppTreeNode<BabylonNode> {
    const children = node.getChildren();
    const hasChildren = children.length > 0;

    return {
      id: node.uniqueId.toString(),
      key: node.uniqueId.toString(),
      label: node.name || `Node_${node.uniqueId}`,
      icon: 'pi pi-box',
      data: node,
      leaf: !hasChildren,
      expanded: hasChildren,
      children: hasChildren ? children.map(child => this.toTreeNode(child)) : undefined,
    };
  }

  onNodeSelect(node: AppTreeNode<BabylonNode>): void {
    if (node.data) {
      this.sceneService.select(node.data);
    }
  }
}