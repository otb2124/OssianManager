// hierarchy-node.ts
import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '@babylonjs/core';
import { BabylonSceneService } from '../../services/babylon/babylonscene.service.ts';

@Component({
  selector: 'app-hierarchy-node',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hierarchy-node.html',
})
export class HierarchyNode {
  @Input({ required: true }) node!: Node;

  protected readonly sceneService = inject(BabylonSceneService);
  protected readonly expanded = signal(true);

  get children(): Node[] {
    return this.node.getChildren();
  }

  get hasChildren(): boolean {
    return this.children.length > 0;
  }

  select(event: Event): void {
    event.stopPropagation();
    this.sceneService.select(this.node);
  }

  toggleExpanded(event: Event): void {
    event.stopPropagation();
    this.expanded.update(v => !v);
  }
}