// vector3-field.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Vector3 } from '@babylonjs/core';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-vector3-field',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, FloatLabelModule],
  templateUrl: './vector3-field.html',
})
export class Vector3Field {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: Vector3;
  @Input() step = 0.1;
  @Input() displayScale = 1; // multiply on read, divide on write — e.g. (180/Math.PI) for radians→degrees

  get x() { return this.value.x * this.displayScale; }
  set x(v: number) { this.value.x = v / this.displayScale; }

  get y() { return this.value.y * this.displayScale; }
  set y(v: number) { this.value.y = v / this.displayScale; }

  get z() { return this.value.z * this.displayScale; }
  set z(v: number) { this.value.z = v / this.displayScale; }
}