// components/inspector-panel/inspector-panel.ts
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldList } from '../field-list/field-list';
import { NODE_CONTROL_FIELDS_CONFIG } from '../../model/fields.config.model';
import { BabylonSceneService } from '../../services/babylon/babylonscene.service.ts';
import { InspectorSyncService } from '../../services/babylon/inspector-sync.service';

@Component({
  selector: 'app-inspector-panel',
  standalone: true,
  imports: [CommonModule, FieldList],
  templateUrl: './inspector-panel.html',
})
export class InspectorPanel {
  protected readonly sceneService = inject(BabylonSceneService);
  protected readonly inspectorSync = inject(InspectorSyncService);

  protected readonly nodeName = computed(() => this.sceneService.selectedNode()?.name ?? '');
  protected readonly inspectorFields = NODE_CONTROL_FIELDS_CONFIG;
}