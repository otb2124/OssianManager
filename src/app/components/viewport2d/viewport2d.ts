// viewport2d.ts
import { Component, OnDestroy, Input, effect, inject } from '@angular/core';
import { ArcRotateCamera, Scene, Vector3 } from '@babylonjs/core';
import { BabylonSceneService } from '../../services/babylon/babylonscene.service.ts';

@Component({
  selector: 'app-viewport2d',
  standalone: true,
  imports: [],
  template: '', // no canvas of its own — renders through the shared canvas owned by Workspaces
})
export class Viewport2D implements OnDestroy {
  /** Whether this viewport's tab is the one currently shown. */
  @Input() set active(value: boolean) {
    this._active = value;
    this.syncActive();
  }

  private readonly babylonSceneService = inject(BabylonSceneService);

  private _active = false;
  private camera: ArcRotateCamera | null = null;

  private sceneWatcher = effect(() => {
    const scene = this.babylonSceneService.scene();
    if (scene && !this.camera) {
      this.buildCamera(scene);
    }
  });

  /**
   * Top-down orthographic camera on the shared scene. This viewport does
   * NOT create, register, or dispose the Scene itself — that's owned by
   * BabylonSceneService (see init/disposeEngine).
   */
  private buildCamera(scene: Scene): void {
    this.camera = new ArcRotateCamera(
      'camera2d',
      -Math.PI / 2, // alpha: looking down -Z, matches Viewport3D's default heading
      0, // beta: 0 = looking straight down from the north pole (top-down)
      50,
      Vector3.Zero(),
      scene,
    );

    // Top-down, orthographic, no orbit — this is a 2D-style view, not a 3D camera.
    this.camera.mode = ArcRotateCamera.ORTHOGRAPHIC_CAMERA;
    this.camera.lowerBetaLimit = 0;
    this.camera.upperBetaLimit = 0;
    this.camera.lowerRadiusLimit = 1;
    // Panning only — no rotation, since beta/alpha are locked to top-down.
    this.camera.panningSensibility = 50;

    this.babylonSceneService.registerCamera(this.camera);
    this.syncActive();
    this.setOrthoBounds(scene);

    // Ortho bounds depend on canvas aspect ratio and current zoom (radius),
    // so they need to be kept in sync every frame rather than computed once.
    scene.onBeforeRenderObservable.add(() => this.setOrthoBounds(scene));
  }

  private setOrthoBounds(scene: Scene): void {
    if (!this.camera) return;
    const canvas = scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    const aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
    const halfHeight = this.camera.radius / 2;
    const halfWidth = halfHeight * aspect;

    this.camera.orthoLeft = -halfWidth;
    this.camera.orthoRight = halfWidth;
    this.camera.orthoTop = halfHeight;
    this.camera.orthoBottom = -halfHeight;
  }

  private syncActive(): void {
    if (this._active && this.camera) {
      this.babylonSceneService.setActiveCamera(this.camera);
    }
  }

  ngOnDestroy(): void {
    this.sceneWatcher.destroy();
    if (this.camera) {
      this.babylonSceneService.unregisterCamera(this.camera);
      this.camera.dispose();
    }
  }
}