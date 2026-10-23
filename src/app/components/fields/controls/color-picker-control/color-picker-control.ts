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
  @Input() allowAlpha = true;

  private _value = '#000000ff';

  @Input()
  set value(val: string | null | undefined) {
    if (!val || typeof val !== 'string') {
      this._value = '#000000ff';
      return;
    }
    // Ensure hex starts with '#'
    this._value = val.startsWith('#') ? val : `#${val}`;
  }
  get value(): string {
    return this._value;
  }

  @Output() valueChange = new EventEmitter<string>();

  get colorPart(): string {
    return (this._value || '#000000').slice(0, 7); // "#rrggbb"
  }

  get alphaPart(): number {
    if (!this.allowAlpha) return 100;
    const str = this._value || '';
    const hexAlpha = str.length >= 9 ? str.slice(7, 9) : '';
    if (hexAlpha.length !== 2) return 100;
    const parsed = parseInt(hexAlpha, 16);
    return isNaN(parsed) ? 100 : Math.round((parsed / 255) * 100);
  }

  onColorChange(newColor: string): void {
    const formattedColor = newColor?.startsWith('#') ? newColor : `#${newColor || '000000'}`;
    this.emitCombined(formattedColor, this.alphaPart);
  }

  onAlphaChange(newAlphaPercent: number): void {
    this.emitCombined(this.colorPart, newAlphaPercent);
  }

  private emitCombined(color: string, alphaPercent: number): void {
    if (!this.allowAlpha) {
      this._value = color;
      this.valueChange.emit(color);
      return;
    }

    const alphaHex = Math.round((alphaPercent / 100) * 255)
      .toString(16)
      .padStart(2, '0');
    const combined = `${color}${alphaHex}`;
    this._value = combined;
    this.valueChange.emit(combined);
  }
}