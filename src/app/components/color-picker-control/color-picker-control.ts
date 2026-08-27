// color-picker-control.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'primeng/colorpicker';
import { SliderModule } from 'primeng/slider';
import { InputText } from "primeng/inputtext";
import { FloatLabelModule } from "primeng/floatlabel";

@Component({
  selector: 'app-color-picker-control',
  standalone: true,
  imports: [CommonModule, FormsModule, ColorPickerModule, SliderModule, InputText, FloatLabelModule],
  templateUrl: './color-picker-control.html',
})
export class ColorPickerControl {
  @Input() label = '';
  @Input() value = '#000000ff'; // 8-digit hex: #rrggbbaa

  @Output() valueChange = new EventEmitter<string>();

  get colorPart(): string {
    return this.value.slice(0, 7); // "#rrggbb"
  }

  get alphaPart(): number {
    const hexAlpha = this.value.slice(7, 9);
    if (hexAlpha.length !== 2) return 100;
    return Math.round((parseInt(hexAlpha, 16) / 255) * 100);
  }

  onColorChange(newColor: string): void {
    this.emitCombined(newColor, this.alphaPart);
  }

  onAlphaChange(newAlphaPercent: number): void {
    this.emitCombined(this.colorPart, newAlphaPercent);
  }

  private emitCombined(color: string, alphaPercent: number): void {
    const alphaHex = Math.round((alphaPercent / 100) * 255)
      .toString(16)
      .padStart(2, '0');
    const combined = `${color}${alphaHex}`;
    this.value = combined;
    this.valueChange.emit(combined);
  }
}