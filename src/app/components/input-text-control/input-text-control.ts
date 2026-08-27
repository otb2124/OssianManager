// text-input-control.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-input-text-control',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, FloatLabelModule],
  templateUrl: './input-text-control.html',
})
export class InputTextControl {
  @Input() label = '';
  @Input() value = '';
  @Input() type: 'text' | 'number' | 'email' | 'password' = 'text';
  @Input() readonly = false;
  @Input() maxlength: number | null = null;
  @Input() placeholder = '';

  @Output() valueChange = new EventEmitter<string>();

  onChange(newValue: string): void {
    this.value = newValue;
    this.valueChange.emit(newValue);
  }
}