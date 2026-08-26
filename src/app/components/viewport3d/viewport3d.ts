// viewport.ts
import {
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  NgZone,
  inject,
} from '@angular/core';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  Color3,
  Axis,
  LinesMesh,
  TransformNode,
} from '@babylonjs/core';
import { GridMaterial } from '@babylonjs/materials';
import { BabylonSceneService } from '../../services/babylon/babylonscene.service.ts';

@Component({
  selector: 'app-viewport',
  standalone: true,
  imports: [],
  templateUrl: './viewport3d.html',
})
export class Viewport3d implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly babylonSceneService = inject(BabylonSceneService);

  private engine!: Engine;
  private scene!: Scene;
  private resizeObserver!: ResizeObserver;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initEngine();
      this.initScene();
      this.initGrid();
      this.initAxes();
      this.initResize();
      this.babylonSceneService.registerScene(this.scene);
      this.engine.runRenderLoop(() => this.scene.render());
    });
  }

  private initEngine(): void {
    this.engine = new Engine(this.canvasRef.nativeElement, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });
  }

  private initScene(): void {
    this.scene = new Scene(this.engine);
  
    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 2.5,
      10,
      Vector3.Zero(),
      this.scene,
    );
    camera.attachControl(this.canvasRef.nativeElement, true);
    camera.lowerRadiusLimit = 1;
    camera.wheelPrecision = 50;
  
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.8;
  
    this.buildPlaceholderHierarchy();
  }

  private buildPlaceholderHierarchy(): void {
    const root = new TransformNode('Group', this.scene);
  
    const parentBox = MeshBuilder.CreateBox('ParentCube', { size: 1 }, this.scene);
    parentBox.position = new Vector3(0, 0.5, 0);
    parentBox.parent = root;
  
    const childSphere = MeshBuilder.CreateSphere('ChildSphere', { diameter: 0.5 }, this.scene);
    childSphere.position = new Vector3(1.5, 0, 0); // relative to parentBox, since it's parented below
    childSphere.parent = parentBox;
  
    const grandchildCone = MeshBuilder.CreateCylinder(
      'GrandchildCone',
      { diameterTop: 0, diameterBottom: 0.4, height: 0.6 },
      this.scene,
    );
    grandchildCone.position = new Vector3(0, 0.6, 0); // relative to childSphere
    grandchildCone.parent = childSphere;
  
    const siblingCylinder = MeshBuilder.CreateCylinder(
      'SiblingCylinder',
      { diameter: 0.4, height: 1 },
      this.scene,
    );
    siblingCylinder.position = new Vector3(-1.5, 0.5, 0);
    siblingCylinder.parent = root;
  }

  private initGrid(): void {
    const ground = MeshBuilder.CreateGround('grid', { width: 100, height: 100 }, this.scene);

    const gridMaterial = new GridMaterial('gridMaterial', this.scene);
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

  private initAxes(): void {
    const axisLength = 5;

    const makeAxis = (name: string, direction: Vector3, color: Color3): LinesMesh => {
      const axis = MeshBuilder.CreateLines(
        name,
        { points: [Vector3.Zero(), direction.scale(axisLength)] },
        this.scene,
      );
      axis.color = color;
      axis.isPickable = false;
      return axis;
    };

    makeAxis('axisX', Axis.X, new Color3(1, 0.3, 0.3));
    makeAxis('axisY', Axis.Y, new Color3(0.3, 1, 0.3));
    makeAxis('axisZ', Axis.Z, new Color3(0.3, 0.3, 1));
  }

  private initResize(): void {
    this.resizeObserver = new ResizeObserver(() => this.engine.resize());
    this.resizeObserver.observe(this.canvasRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.babylonSceneService.unregisterScene();
    this.resizeObserver?.disconnect();
    this.scene?.dispose();
    this.engine?.dispose();
  }
}