// transform-control.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransformNode } from '@babylonjs/core';
import { Vector3Field } from '../vector3-field/vector3-field';

@Component({
  selector: 'app-transform-control',
  standalone: true,
  imports: [CommonModule, Vector3Field],
  templateUrl: './transform-control.html',
})
export class TransformControl {
  @Input({ required: true }) transformNode!: TransformNode;

  protected readonly radToDeg = 180 / Math.PI;
}