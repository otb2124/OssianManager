// inspector-panel.ts
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransformNode } from '@babylonjs/core';
import { AccordionModule } from 'primeng/accordion';
import { BabylonSceneService } from '../../services/babylon/babylonscene.service.ts';
import { PropertyPanelConfig, FieldList } from '../property-list/field-list';

@Component({
  selector: 'app-inspector-panel',
  standalone: true,
  imports: [CommonModule, AccordionModule, FieldList],
  templateUrl: './inspector-panel.html',
})
export class InspectorPanel {

  protected readonly sceneService = inject(BabylonSceneService);

  protected readonly transformNode = computed<TransformNode | null>(() => {
    const node = this.sceneService.selectedNode();
    return this.sceneService.isTransformNode(node) ? node : null;
  });

  protected readonly nodeName = computed(() => this.sceneService.selectedNode()?.name ?? '');

  protected readonly visiblePanels = computed(() => {
    const node = this.transformNode();
    return node ? panelConfigs.filter(p => p.appliesTo(node)) : [];
  });
}


const materialActions = [
  { id: 'load', label: 'Load', icon: 'pi pi-folder-open', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
  { id: 'quick_load', label: 'Quick Load', icon: 'pi pi-bolt', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
];

const physicsWorldOptions = [
  { value: 'myworld0', label: 'myworld0', icon: 'pi pi-folder-open' },
  { value: '3D_object', label: '3D_object', icon: 'pi pi-bolt' },
];


export const panelConfigs: PropertyPanelConfig[] = [
  {
    key: 'Node',
    icon: 'pi pi-box',
    label: 'Node',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'text', path: 'name', label: 'Name' },
      { kind: 'text', path: 'id', label: 'Id' },
      { kind: 'boolean', path: 'enabled', label: 'Enabled' }, // TODO: confirm actual property names — 'enabled'/'start'/'update'/'render' are guesses, not present in your original template's bindings
      { kind: 'boolean', path: 'start', label: 'Start' },
      { kind: 'boolean', path: 'update', label: 'Update' },
      { kind: 'boolean', path: 'render', label: 'Render' },
    ],
  },
  {
    key: 'Transform',
    icon: 'pi pi-arrows-alt',
    label: 'Transform',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'vector3', path: 'position', label: 'Position' },
      { kind: 'vector3', path: 'rotation', label: 'Rotation' },
      { kind: 'vector3', path: 'scaling', label: 'Scale' },
      { kind: 'select', path: 'renderSpace', label: 'Render Space', options: physicsWorldOptions },
      { kind: 'select', path: 'anchor3D', label: 'Anchor3D', options: physicsWorldOptions },
      { kind: 'select', path: 'propagationLock', label: 'Propagation Lock', options: physicsWorldOptions },
    ],
  },
  {
    key: 'Texture Material',
    icon: 'pi pi-image',
    label: 'Texture Material',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'resource-picker', path: 'textureFile', label: 'Texture File', actions: materialActions }, // TODO: path is a guess
      { kind: 'resource-picker', path: 'shaderFile', label: 'Shader File', actions: materialActions },
    ],
  },
  {
    key: 'Cubemap Material',
    icon: 'pi pi-image',
    label: 'Cubemap Material',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'resource-picker', path: 'cubemapFile', label: 'Cubemap File', actions: materialActions },
      { kind: 'resource-picker', path: 'shaderFile', label: 'Shader File', actions: materialActions },
    ],
  },
  {
    key: 'Text Material',
    icon: 'pi pi-image',
    label: 'Text Material',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'resource-picker', path: 'fontFile', label: 'Font File', actions: materialActions },
      { kind: 'resource-picker', path: 'shaderFile', label: 'Shader File', actions: materialActions },
      { kind: 'text', path: 'content', label: 'Content' },
      { kind: 'text', path: 'size', label: 'Size', inputType: 'number' },
      { kind: 'color', path: 'color', label: 'Color' },
    ],
  },
  {
    key: 'Wireframe Material',
    icon: 'pi pi-image',
    label: 'Wireframe Material',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'color', path: 'color', label: 'Color' },
    ],
  },
  {
    key: 'Mesh',
    icon: 'pi pi-box',
    label: 'Mesh',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'resource-picker', path: 'meshFile', label: 'Mesh File', actions: materialActions },
    ],
  },
  {
    key: 'Rigid Physics',
    icon: 'pi pi-bolt',
    label: 'Rigid Physics',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'select', path: 'physicsWorld', label: 'Physics World', options: physicsWorldOptions },
      { kind: 'text', path: 'mass', label: 'Mass', inputType: 'number' },
      { kind: 'text', path: 'restitution', label: 'Restitution', inputType: 'number' },
      { kind: 'text', path: 'linearDamping', label: 'Linear Damping', inputType: 'number' },
      { kind: 'text', path: 'angularDamping', label: 'Angular Damping', inputType: 'number' },
      { kind: 'text', path: 'friction', label: 'Friction', inputType: 'number' },
    ],
  },
  {
    key: 'Static Physics',
    icon: 'pi pi-bolt',
    label: 'Static Physics',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'select', path: 'physicsWorld', label: 'Physics World', options: physicsWorldOptions },
    ],
  },
  {
    key: 'Collider',
    icon: 'pi pi-globe',
    label: 'Collider',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'resource-picker', path: 'colliderFile', label: 'Collider File', actions: materialActions },
      { kind: 'vector3', path: 'position', label: 'Position' },
      { kind: 'vector3', path: 'rotation', label: 'Rotation' },
      { kind: 'vector3', path: 'scaling', label: 'Scale' },
      { kind: 'select', path: 'anchor3D', label: 'Anchor3D', options: physicsWorldOptions },
    ],
  },
  {
    key: 'Animation',
    icon: 'pi pi-play',
    label: 'Animation',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'resource-picker', path: 'animationFile', label: 'Animation File', actions: materialActions },
    ],
  },
  {
    key: 'Point Emission',
    icon: 'pi pi-sun',
    label: 'Point Emission',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'color', path: 'color', label: 'Color' },
      { kind: 'text', path: 'intensity', label: 'Intensity', inputType: 'number' },
      { kind: 'text', path: 'radius', label: 'Radius', inputType: 'number' },
    ],
  },
  {
    key: 'Spot Emission',
    icon: 'pi pi-sun',
    label: 'Spot Emission',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'color', path: 'color', label: 'Color' },
      { kind: 'text', path: 'intensity', label: 'Intensity', inputType: 'number' },
      { kind: 'text', path: 'radius', label: 'Radius', inputType: 'number' },
      { kind: 'vector3', path: 'position', label: 'Direction' },
      { kind: 'text', path: 'innerAngle', label: 'Innder Angle', inputType: 'number' },
      { kind: 'text', path: 'outerAngle', label: 'Outer Angle', inputType: 'number' },
    ],
  },
  {
    key: 'Sun Emission',
    icon: 'pi pi-sun',
    label: 'Sun Emission',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'color', path: 'color', label: 'Color' },
      { kind: 'text', path: 'intensity', label: 'Intensity', inputType: 'number' },
      { kind: 'vector3', path: 'position', label: 'Direction' },
    ],
  },
  {
    key: 'Camera',
    icon: 'pi pi-camera',
    label: 'Camera',
    appliesTo: (node: TransformNode) => true,
    fields: [], // empty in your original too
  },
  {
    key: 'Orbital Camera',
    icon: 'pi pi-camera',
    label: 'Orbital Camera',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'select', path: 'targetNode', label: 'Target Node', options: physicsWorldOptions },
      { kind: 'text', path: 'distance', label: 'Distance', inputType: 'number' },
      { kind: 'text', path: 'minPitch', label: 'Min Pitch', inputType: 'number' },
      { kind: 'text', path: 'maxPitch', label: 'Max Pitch', inputType: 'number' },
    ],
  },
  {
    key: 'Group',
    icon: 'pi pi-folder',
    label: 'Group',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'select', path: 'group', label: 'Group', options: physicsWorldOptions },
    ],
  },
  {
    key: 'Sound',
    icon: 'pi pi-volume-up',
    label: 'Sound',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'resource-picker', path: 'soundFile', label: 'Sound File', actions: materialActions },
    ],
  },
  {
    key: 'State Machine',
    icon: 'pi pi-sitemap',
    label: 'State Machine',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'resource-picker', path: 'stateMachineFile', label: 'State Machine File', actions: materialActions },
    ],
  },
  {
    key: 'Script',
    icon: 'pi pi-code',
    label: 'Script',
    appliesTo: (node: TransformNode) => true,
    fields: [
      { kind: 'resource-picker', path: 'scriptFile', label: 'Script File', actions: materialActions },
    ],
  },
];