import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FieldConfig, FieldList } from '../../field-list/field-list';

@Component({
  selector: 'app-list-control',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    forwardRef(() => FieldList)
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ListControl),
      multi: true
    }
  ],
  templateUrl: './list-control.html',
  styleUrls: ['./list-control.css']
})
export class ListControl implements ControlValueAccessor {
  @Input() label = '';
  /** The field configuration for each item in the list */
  @Input() itemConfig!: FieldConfig;
  @Input() readonly = false;

  private _value: any[] = [];

  // Expose [value] Input binding
  @Input()
  set value(val: any[]) {
    this._value = Array.isArray(val) ? val : [];
  }
  get value(): any[] {
    return this._value;
  }

  // Expose (valueChange) Output binding
  @Output() valueChange = new EventEmitter<any[]>();

  onChange: (value: any[]) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any[]): void {
    this._value = Array.isArray(val) ? val : [];
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  addItem(): void {
    if (this.readonly) return;
    
    // Provide a default fallback based on item kind
    const defaultValue = this.getDefaultValueForKind(this.itemConfig?.kind);
    this._value = [...this._value, defaultValue];
    this.notifyChange();
  }

  removeItem(index: number): void {
    if (this.readonly) return;
    this._value = this._value.filter((_, i) => i !== index);
    this.notifyChange();
  }

  updateItem(index: number, newValue: any): void {
    const updated = [...this._value];
    updated[index] = newValue;
    this._value = updated;
    this.notifyChange();
  }

  /** Gets or builds field configuration for a specific index */
  getItemFieldConfig(index: number): FieldConfig[] {
    return [
      {
        ...this.itemConfig,
        path: `item_${index}`,
        label: '' // Suppress individual field labels in favor of list label
      }
    ];
  }

  /** Wraps primitive items into a temporary model object for FieldList compatibility */
  getItemModel(index: number): Record<string, any> {
    return { [`item_${index}`]: this._value[index] };
  }

  onModelChange(index: number, model: Record<string, any>): void {
    this.updateItem(index, model[`item_${index}`]);
  }

  private notifyChange(): void {
    this.onChange(this._value);
    this.valueChange.emit(this._value);
    this.onTouched();
  }

  private getDefaultValueForKind(kind?: string): any {
    switch (kind) {
      case 'number': return 0;
      case 'boolean': return false;
      case 'vector': return [0, 0, 0];
      case 'color': return '#ffffff';
      case 'text':
      default: return '';
    }
  }
}