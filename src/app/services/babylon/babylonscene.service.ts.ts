// scene.service.ts
import { Injectable, signal } from '@angular/core';
import { Engine, Scene, Node, TransformNode, Camera } from '@babylonjs/core';

@Injectable({ providedIn: 'root' })
export class BabylonSceneService {
  private readonly _scene = signal<Scene | null>(null);
  private readonly _selectedNode = signal<Node | null>(null);
  
  // Signal triggered whenever nodes are added/removed in Babylon
  private readonly _nodeVersion = signal<number>(0);

  readonly scene = this._scene.asReadonly();
  readonly selectedNode = this._selectedNode.asReadonly();
  readonly nodeVersion = this._nodeVersion.asReadonly();

  private engine: Engine | null = null;
  private activeCamera: Camera | null = null;
  private activeControlCanvas: HTMLCanvasElement | null = null;

  init(canvas: HTMLCanvasElement): void {
    if (this.engine) return;

    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });

    const scene = new Scene(this.engine);
    
    // Listen to scene observables to notify Angular Signals on node changes
    const notifyChange = () => this._nodeVersion.update(v => v + 1);
    
    scene.onNewMeshAddedObservable.add(notifyChange);
    scene.onMeshRemovedObservable.add(notifyChange);
    scene.onNewTransformNodeAddedObservable?.add(notifyChange);
    scene.onTransformNodeRemovedObservable?.add(notifyChange);
    scene.onNewCameraAddedObservable.add(notifyChange);
    scene.onCameraRemovedObservable.add(notifyChange);
    scene.onNewLightAddedObservable.add(notifyChange);
    scene.onLightRemovedObservable.add(notifyChange);

    this._scene.set(scene);
    this.engine.runRenderLoop(() => scene.render());
  }

  resize(): void {
    this.engine?.resize();
  }

  /**
   * Registers a camera as usable by the shared scene. Does NOT make it
   * active — call setActiveCamera for that. Kept separate so a camera can
   * exist (e.g. constructed by Viewport2D/Viewport3D) without immediately
   * taking over rendering/input.
   */
  registerCamera(camera: Camera): void {
    const scene = this._scene();
    if (scene && !scene.cameras.includes(camera)) {
      scene.cameras.push(camera);
    }
  }

  unregisterCamera(camera: Camera): void {
    const scene = this._scene();
    if (!scene) return;
    const idx = scene.cameras.indexOf(camera);
    if (idx !== -1) scene.cameras.splice(idx, 1);
    if (this.activeCamera === camera) {
      this.setActiveCamera(null);
    }
  }

  /**
   * Makes the given camera the one actually rendered (via scene.activeCameras,
   * so split-screen remains possible later without changing this contract)
   * and the one receiving pointer input. Detaches control from whichever
   * camera was previously active first, so at most one camera ever listens
   * for input at a time.
   */
  setActiveCamera(camera: Camera | null): void {
    const scene = this._scene();
    if (!scene) return;

    if (this.activeCamera && this.activeControlCanvas) {
      this.activeCamera.detachControl();
    }

    this.activeCamera = camera;
    scene.activeCameras = camera ? [camera] : [];

    if (camera && this.activeControlCanvas) {
      camera.attachControl(this.activeControlCanvas, true);
    }
  }

  /**
   * Canvas used for attachControl on whichever camera is active. Set once
   * by Workspaces (the canvas owner) — camera components never touch the
   * DOM element directly.
   */
  setControlCanvas(canvas: HTMLCanvasElement): void {
    this.activeControlCanvas = canvas;
  }

  disposeEngine(): void {
    this._scene()?.dispose();
    this._scene.set(null);
    this._selectedNode.set(null);
    this.engine?.dispose();
    this.engine = null;
    this.activeCamera = null;
    this.activeControlCanvas = null;
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