import { Component, computed, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectControlOption, SelectControl } from '../select-control/select-control';
import { ResourcePickerAction, ResourcePickerControl } from '../resource-picker-control/resource-picker-control';
import { InputTextControl } from "../input-text-control/input-text-control";
import { InputNumberControl } from "../input-number-control/input-number-control";
import { BooleanControl } from "../boolean-control/boolean-control";
import { VectorControl } from "../vector-control/vector-control";
import { ColorPickerControl } from "../color-picker-control/color-picker-control";
import { TagSelectControl } from '../tag-select-control/tag-select-control';
import { ImageSelectControl, ImageSelectOption, ImageSelectSize } from '../image-select-control/image-select-control';
import { EditableTableControl } from '../editable-table-control/editable-table-control';

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
  visibleIf?: (target: FieldTarget) => boolean;
}

export type FieldConfig =
  | (FieldConfigBase & { kind: 'text'; inputType?: 'text' | 'email' | 'password'; maxlength?: number; })
  | (FieldConfigBase & { kind: 'number'; step?: number; min?: number; max?: number; minFractionDigits?: number; maxFractionDigits?: number; prefix?: string; suffix?: string; })
  | (FieldConfigBase & { kind: 'select'; options: SelectControlOption[]; })
  | (FieldConfigBase & { kind: 'boolean'; })
  | (FieldConfigBase & { kind: 'color'; allowAlpha?: boolean; })
  | (FieldConfigBase & { kind: 'vector'; axisLabels?: string[]; step?: number; displayScale?: number; min?: number; max?: number; minFractionDigits?: number; maxFractionDigits?: number; prefix?: string | string[]; suffix?: string | string[]; })
  | (FieldConfigBase & { kind: 'tags'; })
  | (FieldConfigBase & { kind: 'resource-picker'; actions: ResourcePickerAction[]; })
  | (FieldConfigBase & { kind: 'image-select'; options: ImageSelectOption[]; size?: ImageSelectSize; showItemLabels?: boolean; })
  | (FieldConfigBase & { kind: 'editable-table'; columns: FieldConfig[]; allowAdd?: boolean; allowDelete?: boolean; allowReorder?: boolean; });

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
    InputTextControl,
    InputNumberControl,
    SelectControl,
    BooleanControl,
    ResourcePickerControl,
    VectorControl,
    ColorPickerControl,
    TagSelectControl,
    ImageSelectControl,
    EditableTableControl
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