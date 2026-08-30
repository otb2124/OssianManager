// services/inspector-sync.service.ts
import { Injectable, inject, signal, effect, computed } from '@angular/core';
import { Node, TransformNode } from '@babylonjs/core';
import { FieldTarget, PropertyPath } from '../../components/field-list/field-list';
import { NodeConfig, createNodeConfigFromBabylonNode } from '../../model/node.config.model';
import { BabylonSceneService } from './babylonscene.service.ts';


export class NodeConfigFieldTarget implements FieldTarget {
  constructor(
    private getConfig: () => NodeConfig | null,
    private onUpdate: () => void
  ) {}

  getField(path: PropertyPath): unknown {
    const config = this.getConfig();
    if (!config) return undefined;

    // 1. Direct path lookup (e.g. "properties.0.name")
    const directVal = path.split('.').reduce((obj: any, key) => obj?.[key], config);
    if (directVal !== undefined) return directVal;

    // 2. Fallback lookup: Search inside the properties array items
    for (const prop of config.properties) {
      if (prop[path] !== undefined) {
        return prop[path];
      }
    }

    return undefined;
  }

  setField(path: PropertyPath, value: unknown): void {
    const config = this.getConfig();
    if (!config) return;

    const keys = path.split('.');

    // Handle nested property path (e.g., "properties.0.name")
    if (keys.length > 1) {
      const last = keys.pop()!;
      const target = keys.reduce((obj: any, key) => obj?.[key], config);
      if (target) {
        target[last] = value;
        this.onUpdate();
        return;
      }
    }

    // Fallback: Find matching key inside property blocks (e.g. "position", "name", "color")
    for (const prop of config.properties) {
      if (path in prop || this.isPropertyForType(prop.type, path)) {
        prop[path] = value;
        this.onUpdate();
        return;
      }
    }
  }

  /** Helper to route top-level form field names to their corresponding property types */
  private isPropertyForType(type: string, path: string): boolean {
    switch (type) {
      case 'node':
        return ['name', 'enable', 'id'].includes(path);
      case 'transform':
        return ['position', 'rotation', 'scaling'].includes(path);
      case 'pointEmission':
      case 'spotEmission':
      case 'sunEmission':
        return ['color', 'intensity', 'radius', 'innerAngle', 'outerAngle'].includes(path);
      case 'wireframeMaterial':
      case 'textureMaterial':
        return ['textureFile', 'shaderFile', 'color'].includes(path);
      default:
        return false;
    }
  }
}

@Injectable({ providedIn: 'root' })
export class InspectorSyncService {
  private readonly sceneService = inject(BabylonSceneService);

  readonly nodeConfig = signal<NodeConfig | null>(null);

  /** A unique ID triggered on every selection change to break component reuse */
  readonly selectionKey = computed(() => {
    const node = this.sceneService.selectedNode();
    return node ? `${node.id}_${node.uniqueId}_${Date.now()}` : null;
  });

  readonly fieldTarget = computed<FieldTarget | null>(() => {
    const config = this.nodeConfig();
    if (!config) return null;

    return new NodeConfigFieldTarget(
      () => this.nodeConfig(),
      () => this.syncToBabylon()
    );
  });

  constructor() {
    effect(() => {
      const selectedNode = this.sceneService.selectedNode();

      // 1. Immediately clear existing config to break state reference
      this.nodeConfig.set(null);

      // 2. Generate a fresh NodeConfig if a node is active
      if (selectedNode) {
        const freshConfig = createNodeConfigFromBabylonNode(selectedNode);
        this.nodeConfig.set(freshConfig);
      }
    }, { allowSignalWrites: true });
  }

  private syncToBabylon(): void {
    const selectedNode = this.sceneService.selectedNode();
    const currentConfig = this.nodeConfig();

    if (selectedNode && currentConfig) {
      applyToBabylonNode(selectedNode, currentConfig);
    }
  }
}


export function applyToBabylonNode(babylonNode: Node, nodeData: NodeConfig): void {
  for (const prop of nodeData.properties) {
    switch (prop.type) {
      case "node":
        if (prop['name'] !== undefined) babylonNode.name = prop['name'];
        if (prop['enable'] !== undefined) babylonNode.setEnabled(!!prop['enable']);
        break;

      case "transform":
        if (babylonNode instanceof TransformNode) {
          if (prop['position']) {
            const [x, y, z] = parseVector3(prop['position']);
            babylonNode.position.set(x, y, z);
          }

          if (prop['rotation']) {
            const [x, y, z] = parseVector3(prop['rotation']);
            babylonNode.rotation.set(x, y, z);
          }

          if (prop['scaling']) {
            const [x, y, z] = parseVector3(prop['scaling']);
            babylonNode.scaling.set(x, y, z);
          }
        }
        break;
    }
  }
}



function parseVector3(val: any): [number, number, number] {
  if (Array.isArray(val)) {
    return [val[0] ?? 0, val[1] ?? 0, val[2] ?? 0];
  }
  if (val && typeof val === 'object') {
    return [val.x ?? 0, val.y ?? 0, val.z ?? 0];
  }
  return [0, 0, 0];
}