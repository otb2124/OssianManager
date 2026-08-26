// scene.service.ts
import { Injectable, signal } from '@angular/core';
import { Scene, Node, TransformNode } from '@babylonjs/core';

@Injectable({ providedIn: 'root' })
export class BabylonSceneService {
  private readonly _scene = signal<Scene | null>(null);
  private readonly _selectedNode = signal<Node | null>(null);

  readonly scene = this._scene.asReadonly();
  readonly selectedNode = this._selectedNode.asReadonly();

  registerScene(scene: Scene): void {
    this._scene.set(scene);
  }

  unregisterScene(): void {
    this._scene.set(null);
    this._selectedNode.set(null);
  }

  select(node: Node | null): void {
    this._selectedNode.set(node);
  }

  isSelected(node: Node): boolean {
    return this._selectedNode() === node;
  }

  isTransformNode(node: Node | null): node is TransformNode {
    return node instanceof TransformNode;
  }
}