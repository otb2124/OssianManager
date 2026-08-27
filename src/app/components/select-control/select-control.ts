// select-control.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';

export interface SelectControlOption<T = unknown> {
  label: string;
  value: T;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select-control',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, FloatLabelModule],
  templateUrl: './select-control.html',
})
export class SelectControl<T = unknown> {
  @Input() label = '';
  @Input({ required: true }) options!: SelectControlOption<T>[];
  @Input() value: T | null = null;
  @Input() placeholder = 'Select…';

  @Output() valueChange = new EventEmitter<T | null>();

  onChange(newValue: T | null): void {
    this.value = newValue;
    this.valueChange.emit(newValue);
  }
}