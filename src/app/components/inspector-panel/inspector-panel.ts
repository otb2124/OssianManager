// inspector-panel.ts
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransformNode } from '@babylonjs/core';
import { AccordionModule } from 'primeng/accordion';
import { TransformControl } from '../transform-control/transform-control';
import { ResourcePickerControl, ResourcePickerAction } from '../resource-picker-control/resource-picker-control';
import { BabylonSceneService } from '../../services/babylon/babylonscene.service.ts';

@Component({
  selector: 'app-inspector-panel',
  standalone: true,
  imports: [CommonModule, AccordionModule, TransformControl, ResourcePickerControl],
  templateUrl: './inspector-panel.html',
})
export class InspectorPanel {

  protected readonly sceneService = inject(BabylonSceneService);

  protected readonly transformNode = computed<TransformNode | null>(() => {
    const node = this.sceneService.selectedNode();
    return this.sceneService.isTransformNode(node) ? node : null;
  });

  protected readonly nodeName = computed(() => this.sceneService.selectedNode()?.name ?? '');

  protected readonly materialActions: ResourcePickerAction[] = [
    { id: 'load', label: 'Load', icon: 'pi pi-folder-open', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
    { id: 'quick_load', label: 'Quick Load', icon: 'pi pi-bolt', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
  ];

  onMaterialAction($event: { actionId: string; path: string|null; }) {
    console.log($event.path);
  }
}