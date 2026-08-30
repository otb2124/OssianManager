import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputNumberControl } from '../input-number-control/input-number-control';
import { FormsModule } from '@angular/forms';

export type VectorLike = Record<string, any>;
const DEFAULT_KEYS = ['x', 'y', 'z', 'w'];

@Component({
  selector: 'app-vector-control',
  standalone: true,
  imports: [CommonModule, InputNumberControl, FormsModule],
  templateUrl: './vector-control.html',
})
export class VectorControl {
  @Input({ required: true }) label!: string;
  @Input() value?: VectorLike | null;
  @Input() step = 0.1;
  @Input() displayScale = 1;
  @Input() axisLabels: string[] = ['X', 'Y', 'Z'];

  // InputNumber configurations
  @Input() min: number | null = null;
  @Input() max: number | null = null;
  @Input() minFractionDigits = 0;
  @Input() maxFractionDigits = 2;
  @Input() prefix?: string | string[];
  @Input() suffix?: string | string[];

  get gridClass(): string {
    const count = this.axisLabels.length;
    if (count === 2) return 'grid-cols-2';
    if (count === 4) return 'grid-cols-4';
    return 'grid-cols-3';
  }

  getPrefix(index: number): string | undefined {
    if (Array.isArray(this.prefix)) {
      return this.prefix[index];
    }
    return this.prefix;
  }

  getSuffix(index: number): string | undefined {
    if (Array.isArray(this.suffix)) {
      return this.suffix[index];
    }
    return this.suffix;
  }

  private getKey(index: number): string {
    if (!this.value) return DEFAULT_KEYS[index] ?? 'x';

    const defaultKey = DEFAULT_KEYS[index];
    if (defaultKey && defaultKey in this.value) return defaultKey;

    const labelKey = this.axisLabels[index]?.toLowerCase();
    if (labelKey && labelKey in this.value) return labelKey;

    return defaultKey ?? 'x';
  }

  getVal(index: number): number {
    if (!this.value) return 0;
    const key = this.getKey(index);
    const num = Number(this.value[key] ?? 0);
    return isNaN(num) ? 0 : num * this.displayScale;
  }

  setVal(index: number, val: number | null) {
    if (!this.value) return;
    const key = this.getKey(index);
    const rawVal = val ?? 0;
    this.value[key] = rawVal / this.displayScale;
  }
}