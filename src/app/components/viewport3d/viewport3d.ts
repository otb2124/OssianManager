// viewport3d.ts
import { Component, OnDestroy, Input, effect, inject } from '@angular/core';
import {
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  Color3,
  Axis,
  LinesMesh,
  TransformNode,
  Scene,
} from '@babylonjs/core';
import { GridMaterial } from '@babylonjs/materials';
import '@babylonjs/materials/grid/grid.fragment';
import '@babylonjs/materials/grid/grid.vertex';
import { BabylonSceneService } from '../../services/babylon/babylonscene.service.ts';

@Component({
  selector: 'app-viewport3d',
  standalone: true,
  imports: [],
  template: '', // no canvas of its own — renders through the shared canvas owned by Workspaces
})
export class Viewport3D implements OnDestroy {
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
      this.buildScene(scene);
    }
  });

  private buildScene(scene: Scene): void {
    this.camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 2.5,
      10,
      Vector3.Zero(),
      scene,
    );
    this.camera.lowerRadiusLimit = 1;
    this.camera.wheelPrecision = 50;
    this.babylonSceneService.registerCamera(this.camera);
    this.syncActive();

    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
    light.intensity = 0.8;

    this.buildPlaceholderHierarchy(scene);
    this.buildGrid(scene);
    this.buildAxes(scene);
  }

  private syncActive(): void {
    if (this._active && this.camera) {
      this.babylonSceneService.setActiveCamera(this.camera);
    }
  }

  private buildPlaceholderHierarchy(scene: Scene): void {
    const root = new TransformNode('Group', scene);

    const parentBox = MeshBuilder.CreateBox('ParentCube', { size: 1 }, scene);
    parentBox.position = new Vector3(0, 0.5, 0);
    parentBox.parent = root;

    const childSphere = MeshBuilder.CreateSphere('ChildSphere', { diameter: 0.5 }, scene);
    childSphere.position = new Vector3(1.5, 0, 0); // relative to parentBox, since it's parented below
    childSphere.parent = parentBox;

    const grandchildCone = MeshBuilder.CreateCylinder(
      'GrandchildCone',
      { diameterTop: 0, diameterBottom: 0.4, height: 0.6 },
      scene,
    );
    grandchildCone.position = new Vector3(0, 0.6, 0); // relative to childSphere
    grandchildCone.parent = childSphere;

    const siblingCylinder = MeshBuilder.CreateCylinder(
      'SiblingCylinder',
      { diameter: 0.4, height: 1 },
      scene,
    );
    siblingCylinder.position = new Vector3(-1.5, 0.5, 0);
    siblingCylinder.parent = root;
  }

  private buildGrid(scene: Scene): void {
    const ground = MeshBuilder.CreateGround('grid', { width: 100, height: 100 }, scene);

    const gridMaterial = new GridMaterial('gridMaterial', scene);
    gridMaterial.majorUnitFrequency = 10;
    gridMaterial.minorUnitVisibility = 0.35;
    gridMaterial.gridRatio = 1;
    gridMaterial.backFaceCulling = false;
    gridMaterial.mainColor = new Color3(0.35, 0.35, 0.35);
    gridMaterial.lineColor = new Color3(0.55, 0.55, 0.55);
    gridMaterial.opacity = 0.9;

    ground.material = gridMaterial;
    ground.isPickable = false; // so it doesn't intercept selection clicks meant for real scene objects later
  }

  private buildAxes(scene: Scene): void {
    const axisLength = 5;

    const makeAxis = (name: string, direction: Vector3, color: Color3): LinesMesh => {
      const axis = MeshBuilder.CreateLines(
        name,
        { points: [Vector3.Zero(), direction.scale(axisLength)] },
        scene,
      );
      axis.color = color;
      axis.isPickable = false;
      return axis;
    };

    makeAxis('axisX', Axis.X, new Color3(1, 0.3, 0.3));
    makeAxis('axisY', Axis.Y, new Color3(0.3, 1, 0.3));
    makeAxis('axisZ', Axis.Z, new Color3(0.3, 0.3, 1));
  }

  ngOnDestroy(): void {
    this.sceneWatcher.destroy();
    if (this.camera) {
      this.babylonSceneService.unregisterCamera(this.camera);
      this.camera.dispose();
    }
  }
}