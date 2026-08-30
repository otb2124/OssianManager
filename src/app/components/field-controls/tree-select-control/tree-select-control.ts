// tree-select-control.ts
import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { TreeSelectModule } from 'primeng/treeselect';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TreeNode } from 'primeng/api';

@Component({
  selector: 'app-tree-select-control',
  standalone: true,
  imports: [CommonModule, FormsModule, TreeSelectModule, FloatLabelModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TreeSelectControl),
      multi: true
    }
  ],
  templateUrl: './tree-select-control.html'
})
export class TreeSelectControl implements ControlValueAccessor {
  @Input() label = '';
  @Input() options: TreeNode[] = [];
  @Input() selectionMode: 'single' | 'multiple' | 'checkbox' = 'single';
  @Input() placeholder = '';
  @Input() readonly = false;
  @Input() value: any = null;

  // Emits value back to FieldList when form control value accessor isn't used directly
  @Output() valueChange = new EventEmitter<any>();

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.value = val;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onSelectionChange(newValue: any): void {
    this.value = newValue;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.onTouched();
  }
}