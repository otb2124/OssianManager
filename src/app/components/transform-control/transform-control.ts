// transform-control.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransformNode } from '@babylonjs/core';
import { VectorControl } from '../fields/vector-control/vector-control';

@Component({
  selector: 'app-transform-control',
  standalone: true,
  imports: [CommonModule, VectorControl],
  templateUrl: './transform-control.html',
})
export class TransformControl {
  @Input({ required: true }) transformNode!: TransformNode;

  protected readonly radToDeg = 180 / Math.PI;
}