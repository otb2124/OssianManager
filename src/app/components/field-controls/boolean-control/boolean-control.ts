// boolean-control.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'app-boolean-control',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToggleSwitchModule],
  templateUrl: './boolean-control.html',
})
export class BooleanControl {
  @Input() label = '';
  @Input() value = false;
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<boolean>();

  onChange(newValue: boolean): void {
    this.value = newValue;
    this.valueChange.emit(newValue);
  }
}