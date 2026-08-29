import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransformNode } from '@babylonjs/core';
import { FieldConfig, FieldList, FieldTarget, PropertyPath } from '../field-list/field-list';
import { BabylonSceneService } from '../../services/babylon/babylonscene.service.ts';

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

const materialActions = [
  { id: 'load', label: 'Load', icon: 'pi pi-folder-open', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
  { id: 'quick_load', label: 'Quick Load', icon: 'pi pi-bolt', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
];

const physicsWorldOptions = [
  { value: 'myworld0', label: 'myworld0', icon: 'pi pi-folder-open' },
  { value: '3D_object', label: '3D_object', icon: 'pi pi-bolt' },
];

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

  protected readonly inspectorFields = inspectorFields;
}

export const inspectorFields: FieldConfig[] = [

  {
    kind: 'accordion',
    path: 'properties',
    label: 'Properties',
    allowAdd: true,
    allowDelete: true,
    config: {
      templateTreeOptions: [
        {
          key: 'node',
          label: 'Node',
        },
        {
          key: 'cat-transform',
          label: 'Transforms',
          icon: 'pi pi-folder',
          selectable: false,
          children: [
            { key: 'transform', label: 'Transform', icon: 'pi pi-arrows-alt' }
          ]
        },
        {
          key: 'cat-materials',
          label: 'Materials',
          icon: 'pi pi-folder',
          selectable: false,
          children: [
            { key: 'textureMaterial', label: 'Texture Material', icon: 'pi pi-image' },
            { key: 'cubemapMaterial', label: 'Cubemap Material', icon: 'pi pi-image' },
            { key: 'textMaterial', label: 'Text Material', icon: 'pi pi-image' },
            { key: 'wireframeMaterial', label: 'Wireframe Material', icon: 'pi pi-image' }
          ]
        },
        {
          key: 'cat-physics',
          label: 'Physics',
          icon: 'pi pi-folder',
          selectable: false,
          children: [
            { key: 'rigidPhysics', label: 'Rigid Physics', icon: 'pi pi-bolt' },
            { key: 'staticPhysics', label: 'Static Physics', icon: 'pi pi-bolt' },
            { key: 'collider', label: 'Collider', icon: 'pi pi-globe' }
          ]
        },
        {
          key: 'cat-lighting',
          label: 'Lighting',
          icon: 'pi pi-folder',
          selectable: false,
          children: [
            { key: 'pointEmission', label: 'Point Emission', icon: 'pi pi-sun' },
            { key: 'spotEmission', label: 'Spot Emission', icon: 'pi pi-sun' },
            { key: 'sunEmission', label: 'Sun Emission', icon: 'pi pi-sun' }
          ]
        },
        {
          key: 'cat-cameras',
          label: 'Cameras',
          icon: 'pi pi-folder',
          selectable: false,
          children: [
            { key: 'camera', label: 'Camera', icon: 'pi pi-camera' },
            { key: 'orbitalCamera', label: 'Orbital Camera', icon: 'pi pi-camera' }
          ]
        },
        {
          key: 'cat-logic',
          label: 'Logic & Scripts',
          icon: 'pi pi-folder',
          selectable: false,
          children: [
            { key: 'stateMachine', label: 'State Machine', icon: 'pi pi-sitemap' },
            { key: 'script', label: 'Script', icon: 'pi pi-code' },
            { key: 'sound', label: 'Sound', icon: 'pi pi-volume-up' }
          ]
        }
      ],
      templates: {
        node: {
          header: 'Node',
          fields: [
            { kind: 'text', path: 'name', label: 'Name' },
            { kind: 'text', path: 'id', label: 'Id' },
            { kind: 'boolean', path: 'enable', label: 'Enable' },
            { kind: 'boolean', path: 'enableStart', label: 'Enable Start' },
            { kind: 'boolean', path: 'enableUpdate', label: 'Enable Update' },
            { kind: 'boolean', path: 'enableRender', label: 'Enable Render' },
          ]
        },
        transform: {
          header: 'Transform',
          icon: 'pi pi-arrows-alt',
          fields: [
            { kind: 'vector', path: 'position', label: 'Position' },
            { kind: 'vector', path: 'rotation', label: 'Rotation' },
            { kind: 'vector', path: 'scaling', label: 'Scale' },
            { kind: 'select', path: 'renderSpace', label: 'Render Space', options: physicsWorldOptions },
            { kind: 'select', path: 'anchor3D', label: 'Anchor3D', options: physicsWorldOptions },
            { kind: 'select', path: 'propagationLock', label: 'Propagation Lock', options: physicsWorldOptions },
          ]
        },
        textureMaterial: {
          header: 'Texture Material',
          icon: 'pi pi-image',
          fields: [
            { kind: 'resource-picker', path: 'textureFile', label: 'Texture File', actions: materialActions },
            { kind: 'resource-picker', path: 'shaderFile', label: 'Shader File', actions: materialActions },
          ]
        },
        cubemapMaterial: {
          header: 'Cubemap Material',
          icon: 'pi pi-image',
          fields: [
            { kind: 'resource-picker', path: 'cubemapFile', label: 'Cubemap File', actions: materialActions },
            { kind: 'resource-picker', path: 'shaderFile', label: 'Shader File', actions: materialActions },
          ]
        },
        textMaterial: {
          header: 'Text Material',
          icon: 'pi pi-image',
          fields: [
            { kind: 'resource-picker', path: 'fontFile', label: 'Font File', actions: materialActions },
            { kind: 'resource-picker', path: 'shaderFile', label: 'Shader File', actions: materialActions },
            { kind: 'text', path: 'content', label: 'Content' },
            { kind: 'number', path: 'size', label: 'Size' },
            { kind: 'color', path: 'color', label: 'Color' },
          ]
        },
        wireframeMaterial: {
          header: 'Wireframe Material',
          icon: 'pi pi-image',
          fields: [
            { kind: 'color', path: 'color', label: 'Color' },
          ]
        },
        rigidPhysics: {
          header: 'Rigid Physics',
          icon: 'pi pi-bolt',
          fields: [
            { kind: 'select', path: 'physicsWorld', label: 'Physics World', options: physicsWorldOptions },
            { kind: 'number', path: 'mass', label: 'Mass' },
            { kind: 'number', path: 'restitution', label: 'Restitution' },
            { kind: 'number', path: 'linearDamping', label: 'Linear Damping' },
            { kind: 'number', path: 'angularDamping', label: 'Angular Damping' },
            { kind: 'number', path: 'friction', label: 'Friction' },
          ]
        },
        staticPhysics: {
          header: 'Static Physics',
          icon: 'pi pi-bolt',
          fields: [
            { kind: 'select', path: 'physicsWorld', label: 'Physics World', options: physicsWorldOptions },
          ]
        },
        collider: {
          header: 'Collider',
          icon: 'pi pi-globe',
          fields: [
            { kind: 'resource-picker', path: 'colliderFile', label: 'Collider File', actions: materialActions },
            { kind: 'vector', path: 'position', label: 'Position' },
            { kind: 'vector', path: 'rotation', label: 'Rotation' },
            { kind: 'vector', path: 'scaling', label: 'Scale' },
            { kind: 'select', path: 'anchor3D', label: 'Anchor3D', options: physicsWorldOptions },
          ]
        },
        pointEmission: {
          header: 'Point Emission',
          icon: 'pi pi-sun',
          fields: [
            { kind: 'color', path: 'color', label: 'Color' },
            { kind: 'number', path: 'intensity', label: 'Intensity' },
            { kind: 'number', path: 'radius', label: 'Radius' },
          ]
        },
        spotEmission: {
          header: 'Spot Emission',
          icon: 'pi pi-sun',
          fields: [
            { kind: 'color', path: 'color', label: 'Color' },
            { kind: 'number', path: 'intensity', label: 'Intensity' },
            { kind: 'number', path: 'radius', label: 'Radius' },
            { kind: 'vector', path: 'position', label: 'Direction' },
            { kind: 'number', path: 'innerAngle', label: 'Inner Angle' },
            { kind: 'number', path: 'outerAngle', label: 'Outer Angle' },
          ]
        },
        sunEmission: {
          header: 'Sun Emission',
          icon: 'pi pi-sun',
          fields: [
            { kind: 'color', path: 'color', label: 'Color' },
            { kind: 'number', path: 'intensity', label: 'Intensity' },
            { kind: 'vector', path: 'position', label: 'Direction' },
          ]
        },
        camera: {
          header: 'Camera',
          icon: 'pi pi-camera',
          fields: []
        },
        orbitalCamera: {
          header: 'Orbital Camera',
          icon: 'pi pi-camera',
          fields: [
            { kind: 'select', path: 'targetNode', label: 'Target Node', options: physicsWorldOptions },
            { kind: 'number', path: 'distance', label: 'Distance' },
            { kind: 'number', path: 'minPitch', label: 'Min Pitch' },
            { kind: 'number', path: 'maxPitch', label: 'Max Pitch' },
          ]
        },
        sound: {
          header: 'Sound',
          icon: 'pi pi-volume-up',
          fields: [
            { kind: 'resource-picker', path: 'soundFile', label: 'Sound File', actions: materialActions },
          ]
        },
        stateMachine: {
          header: 'State Machine',
          icon: 'pi pi-sitemap',
          fields: [
            { kind: 'resource-picker', path: 'stateMachineFile', label: 'State Machine File', actions: materialActions },
          ]
        },
        script: {
          header: 'Script',
          icon: 'pi pi-code',
          fields: [
            { kind: 'resource-picker', path: 'scriptFile', label: 'Script File', actions: materialActions },
          ]
        }
      }
    }
  }
];