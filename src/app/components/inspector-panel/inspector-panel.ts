// inspector-panel.ts
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransformNode, Vector3 } from '@babylonjs/core';
import { AccordionModule } from 'primeng/accordion';
import { TransformControl } from '../transform-control/transform-control';
import { ResourcePickerControl, ResourcePickerAction } from '../resource-picker-control/resource-picker-control';
import { BabylonSceneService } from '../../services/babylon/babylonscene.service.ts';
import { SelectControl, SelectControlOption } from "../select-control/select-control";
import { InputTextControl } from "../input-text-control/input-text-control";
import { ColorPickerControl } from "../color-picker-control/color-picker-control";
import { Vector3Field } from "../vector3-field/vector3-field";
import { BooleanControl } from "../boolean-control/boolean-control";

@Component({
  selector: 'app-inspector-panel',
  standalone: true,
  imports: [CommonModule, AccordionModule, TransformControl, ResourcePickerControl, SelectControl, InputTextControl, ColorPickerControl, Vector3Field, BooleanControl],
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

  protected readonly physicsWorldOptions: SelectControlOption[] = [
    { value: 'myworld0', label: 'myworld0', icon: 'pi pi-folder-open' },
    { value: '3D_object', label: '3D_object', icon: 'pi pi-bolt' },
  ];

  protected readonly spotEmissionDirectionVector3: Vector3 = new Vector3();

  onMaterialAction($event: { actionId: string; path: string|null; }) {
    console.log($event.path);
  }
}