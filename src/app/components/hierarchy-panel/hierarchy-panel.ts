// hierarchy-panel.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HierarchyNode } from '../hierarchy-node/hierarchy-node';
import { BabylonSceneService } from '../../services/babylon/babylonscene.service.ts';

@Component({
  selector: 'app-hierarchy-panel',
  standalone: true,
  imports: [CommonModule, HierarchyNode],
  templateUrl: './hierarchy-panel.html',
})
export class HierarchyPanel {
  protected readonly sceneService = inject(BabylonSceneService);

  get rootNodes() {
    const scene = this.sceneService.scene();
    return scene ? scene.rootNodes : [];
  }
}