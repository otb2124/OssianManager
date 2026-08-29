import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransformNode } from '@babylonjs/core';
import { FieldConfig, FieldList, FieldTarget, PropertyPath } from '../field-list/field-list';
import { BabylonSceneService } from '../../services/babylon/babylonscene.service.ts';
import { NODE_CONTROL_FIELDS_CONFIG } from '../../model/fields-config.model';

export class TransformNodeFieldTarget implements FieldTarget {
  constructor(private node: TransformNode) {}

  getField(path: PropertyPath): unknown {
    return path.split('.').reduce((obj: any, key) => obj?.[key], this.node);
  }

  setField(path: PropertyPath, value: unknown): void {
    const keys = path.split('.');
    const last = keys.pop()!;
    const target = keys.reduce((obj: any, key) => obj?.[key], this.node);
    if (target) target[last] = value;
  }
}

@Component({
  selector: 'app-inspector-panel',
  standalone: true,
  imports: [CommonModule, FieldList],
  templateUrl: './inspector-panel.html',
})
export class InspectorPanel {
  protected readonly sceneService = inject(BabylonSceneService);

  protected readonly transformNode = computed<TransformNode | null>(() => {
    const node = this.sceneService.selectedNode();
    return this.sceneService.isTransformNode(node) ? node : null;
  });

  protected readonly nodeName = computed(() => this.sceneService.selectedNode()?.name ?? '');

  protected readonly fieldTarget = computed<FieldTarget | null>(() => {
    const node = this.transformNode();
    return node ? new TransformNodeFieldTarget(node) : null;
  });

  protected readonly inspectorFields = NODE_CONTROL_FIELDS_CONFIG;
}

