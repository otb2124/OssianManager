import { Component, Input, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TreeNode } from 'primeng/api';
import { FieldConfig, FieldList } from '../../field-list/field-list';
import { DialogFormConfig, DialogFormService } from '../../../services/dialog-form/dialog-form.service';

export interface PanelTypeDefinition {
  type?: string;
  header: string;
  icon?: string;
  fields: FieldConfig[];
  addDialogConfig?: Partial<DialogFormConfig>;
}

export interface AccordionControlConfig {
  templateTreeOptions?: TreeNode[];
  templates: Record<string, PanelTypeDefinition>;
  addDialogConfig?: Partial<DialogFormConfig>;
}

@Component({
  selector: 'app-accordion-control',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AccordionModule,
    ButtonModule,
    TooltipModule,
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
  @Input() config!: AccordionControlConfig;
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
    if (this.readonly || !this.config?.templates) return;

    const templateKeys = Object.keys(this.config.templates);
    if (templateKeys.length === 0) return;

    let selectedType = templateKeys[0];
    let initialData: Record<string, any> = {};

    const currentTemplate = this.config.templates[selectedType];
    const hasMultipleTemplates = templateKeys.length > 1;
    const dialogConfig = currentTemplate?.addDialogConfig || this.config.addDialogConfig;

    // Open dialog ONLY if there are multiple templates to choose from OR an explicit addDialogConfig is set
    if (hasMultipleTemplates || dialogConfig) {
      const modalFields: FieldConfig[] = dialogConfig?.fields ?? [
        {
          kind: 'tree-select',
          path: 'selectedTypeNode',
          label: 'Select Type',
          selectionMode: 'single',
          options: this.config.templateTreeOptions ?? []
        }
      ];

      const dialogResult = await this.dialogService.open({
        title: dialogConfig?.title ?? 'Add Item',
        width: dialogConfig?.width ?? '450px',
        submitLabel: dialogConfig?.submitLabel ?? 'Add',
        fields: modalFields
      });

      if (!dialogResult) return;

      if (dialogResult['selectedTypeNode']) {
        selectedType = typeof dialogResult['selectedTypeNode'] === 'object'
          ? dialogResult['selectedTypeNode'].key
          : dialogResult['selectedTypeNode'];
      }

      initialData = { ...dialogResult };
      delete initialData['selectedTypeNode'];
    }

    const templateDef = this.config.templates[selectedType];
    if (!templateDef) return;

    const newPanelModel: Record<string, any> = {
      type: templateDef.type || selectedType,
      ...initialData
    };

    for (const field of templateDef.fields) {
      if (!(field.path in newPanelModel)) {
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

  getPanelHeader(panelItem: Record<string, any>, index: number): string {
    const templateDef = this.config.templates[panelItem['type']];
    return panelItem['name'] || templateDef?.header || `Panel ${index + 1}`;
  }

  getPanelIcon(panelItem: Record<string, any>): string {
    return this.config.templates[panelItem['type']]?.icon || 'pi pi-box';
  }

  getPanelFields(panelItem: Record<string, any>): FieldConfig[] {
    return this.config.templates[panelItem['type']]?.fields || [];
  }

  private notifyChange(): void {
    this.onChange(this.value);
    this.onTouched();
  }
}