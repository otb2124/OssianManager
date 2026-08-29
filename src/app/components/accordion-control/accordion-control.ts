import { Component, Input, Output, EventEmitter, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { FieldConfig, FieldList } from '../field-list/field-list';
import { DialogFormConfig, DialogFormService } from '../../services/dialog-form/dialog-form.service';

export type AccordionPanelConfig = {
  header: string;
  icon?: string;
  fields: FieldConfig[];
  /** Optional dialog configuration for creating new panels */
  addDialogConfig?: Omit<DialogFormConfig, 'model'>;
};

@Component({
  selector: 'app-accordion-control',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AccordionModule,
    ButtonModule,
    forwardRef(() => FieldList)
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AccordionControl),
      multi: true
    }
  ],
  templateUrl: './accordion-control.html',
})
export class AccordionControl implements ControlValueAccessor {
  @Input() label = '';
  @Input() panelTemplate: AccordionPanelConfig = { header: 'New Panel', fields: [] };
  @Input() allowAdd = true;
  @Input() allowDelete = true;
  @Input() readonly = false;

  private dialogService = inject(DialogFormService);

  value: Record<string, any>[] = [];

  onChange: (value: any[]) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: any[]): void {
    this.value = Array.isArray(val) ? val : [];
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  async addPanel(): Promise<void> {
    if (this.readonly) return;

    let newPanelModel: Record<string, any> | null = {};

    // 1. If addDialogConfig is provided, open the modal dialog first
    if (this.panelTemplate.addDialogConfig) {
      newPanelModel = await this.dialogService.open({
        ...this.panelTemplate.addDialogConfig,
        model: {} // Start empty or pass default values
      });

      // If user canceled the dialog, don't add a panel
      if (!newPanelModel) return;
    } else {
      // 2. Fallback: Initialize empty properties from panelTemplate fields
      for (const field of this.panelTemplate.fields) {
        newPanelModel[field.path] = null;
      }
    }

    this.value = [...this.value, newPanelModel];
    this.notifyChange();
  }

  removePanel(index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.readonly) return;
    this.value = this.value.filter((_, i) => i !== index);
    this.notifyChange();
  }

  onPanelModelChange(index: number, updatedModel: Record<string, any>): void {
    const updated = [...this.value];
    updated[index] = updatedModel;
    this.value = updated;
    this.notifyChange();
  }

  getPanelHeader(index: number): string {
    const item = this.value[index];
    return item?.['headerTitle'] || item?.['name'] || `${this.panelTemplate.header} ${index + 1}`;
  }

  private notifyChange(): void {
    this.onChange(this.value);
    this.onTouched();
  }
}