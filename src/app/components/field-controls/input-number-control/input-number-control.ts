// input-number-control.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-input-number-control',
  standalone: true,
  imports: [CommonModule, FormsModule, InputNumberModule, FloatLabelModule, ReactiveFormsModule],
  templateUrl: './input-number-control.html'
})
export class InputNumberControl {
  @Input() label = '';
  @Input() value: number | null = null;
  @Input() step = 1;
  @Input() min: number | null = null;
  @Input() max: number | null = null;
  @Input() minFractionDigits = 0;
  @Input() maxFractionDigits = 2;
  @Input() readonly = false;
  
  // Clean, explicit affix properties for numeric controls
  @Input() prefix?: string;
  @Input() suffix?: string;

  @Output() valueChange = new EventEmitter<number | null>();

  onChange(newValue: number | null): void {
    this.value = newValue;
    this.valueChange.emit(newValue);
  }
}