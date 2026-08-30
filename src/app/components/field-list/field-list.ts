import { Component, computed, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectControl, SelectControlOption } from '../field-controls/select-control/select-control';
import { TreeNode } from 'primeng/api';
import { ResourcePickerAction, ResourcePickerControl } from '../field-controls/resource-picker-control/resource-picker-control';
import { AccordionControlConfig, AccordionControl } from '../field-controls/accordion-control/accordion-control';
import { BooleanControl } from '../field-controls/boolean-control/boolean-control';
import { ColorPickerControl } from '../field-controls/color-picker-control/color-picker-control';
import { EditableTableControl } from '../field-controls/editable-table-control/editable-table-control';
import { ImageSelectOption, ImageSelectSize, ImageSelectControl } from '../field-controls/image-select-control/image-select-control';
import { InputNumberControl } from '../field-controls/input-number-control/input-number-control';
import { InputTextControl } from '../field-controls/input-text-control/input-text-control';
import { ListControl } from '../field-controls/list-control/list-control';
import { TagSelectControl } from '../field-controls/tag-select-control/tag-select-control';
import { TreeSelectControl } from '../field-controls/tree-select-control/tree-select-control';
import { VectorControl } from '../field-controls/vector-control/vector-control';

export type PropertyPath = string;

export interface FieldTarget {
  getField(path: PropertyPath): unknown;
  setField(path: PropertyPath, value: unknown): void;
}

/** Utility adapter to convert a standard object into a FieldTarget */
export class RecordFieldTarget implements FieldTarget {
  constructor(private record: Record<string, any>) {}
  getField(path: PropertyPath): unknown {
    return this.record[path];
  }
  setField(path: PropertyPath, value: unknown): void {
    this.record[path] = value;
  }
}

interface FieldConfigBase {
  path: PropertyPath;
  label: string;
  defaultValue?: any;
  visibleIf?: (target: FieldTarget) => boolean;
}

export type FieldConfig =
  | (FieldConfigBase & { kind: 'text'; inputType?: 'text' | 'email' | 'password'; maxlength?: number; })
  | (FieldConfigBase & { kind: 'number'; step?: number; min?: number; max?: number; minFractionDigits?: number; maxFractionDigits?: number; prefix?: string; suffix?: string; })
  | (FieldConfigBase & { kind: 'select'; options: SelectControlOption[]; })
  | (FieldConfigBase & {
    kind: 'tree-select';
    path: string;
    label: string;
    options: TreeNode[];
    selectionMode?: 'single' | 'multiple' | 'checkbox';
    placeholder?: string;
  })
  | (FieldConfigBase & { kind: 'boolean'; })
  | (FieldConfigBase & { kind: 'color'; allowAlpha?: boolean; })
  | (FieldConfigBase & { kind: 'vector'; axisLabels?: string[]; step?: number; displayScale?: number; min?: number; max?: number; minFractionDigits?: number; maxFractionDigits?: number; prefix?: string | string[]; suffix?: string | string[]; })
  | (FieldConfigBase & { kind: 'tags'; })
  | (FieldConfigBase & { kind: 'resource-picker'; actions: ResourcePickerAction[]; })
  | (FieldConfigBase & { kind: 'image-select'; options: ImageSelectOption[]; size?: ImageSelectSize; showItemLabels?: boolean; })
  | (FieldConfigBase & { kind: 'list'; path: string; label: string; itemConfig: FieldConfig })
  | (FieldConfigBase & { kind: 'editable-table'; columns: FieldConfig[]; allowAdd?: boolean; allowDelete?: boolean; allowReorder?: boolean; })
  | (FieldConfigBase & {
    kind: 'accordion';
    path: string;
    label: string;
    config: AccordionControlConfig;
    allowAdd?: boolean;
    allowDelete?: boolean;
  });

export interface PropertyPanelConfig {
  key: string;
  icon: string;
  label: string;
  fields: FieldConfig[];
}

@Component({
  selector: 'app-field-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextControl,
    InputNumberControl,
    SelectControl,
    TreeSelectControl,
    BooleanControl,
    ResourcePickerControl,
    VectorControl,
    ColorPickerControl,
    TagSelectControl,
    ImageSelectControl,
    EditableTableControl,
    ListControl,
    AccordionControl
  ],
  templateUrl: './field-list.html',
  styleUrl: './field-list.css',
})
export class FieldList implements OnChanges {
  @Input() target?: FieldTarget;
  @Input() model?: Record<string, any>;
  @Input() fields: FieldConfig[] = [];
  @Input() direction: 'vertical' | 'horizontal' = 'vertical';
  @Input() hideLabels = false;
  @Input() fullWidthControls = false;

  @Output() modelChange = new EventEmitter<Record<string, any>>();

  protected effectiveTarget!: FieldTarget;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.target) {
      this.effectiveTarget = this.target;
    } else if (this.model) {
      this.effectiveTarget = new RecordFieldTarget(this.model);
    }
  }

  protected visibleFields = computed(() =>
    this.fields.filter(f => !f.visibleIf || (this.effectiveTarget && f.visibleIf(this.effectiveTarget)))
  );

  protected getValue<T>(path: PropertyPath): T {
    return this.effectiveTarget?.getField(path) as T;
  }

  protected setValue(path: PropertyPath, value: unknown): void {
    this.effectiveTarget?.setField(path, value);
    if (this.model) {
      this.modelChange.emit(this.model);
    }
  }

  protected onResourceAction(path: PropertyPath, event: { actionId: string; path: string | null }) {
    // Route resource action
  }
}