import { Component, computed, Input } from '@angular/core';
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

export type PropertyPath = string;

export interface FieldTarget {
  getField(path: PropertyPath): unknown;
  setField(path: PropertyPath, value: unknown): void;
}

interface FieldConfigBase {
  path: PropertyPath;
  label: string;
  visibleIf?: (target: FieldTarget) => boolean;
}

export type FieldConfig =
  | (FieldConfigBase & { 
      kind: 'text'; 
      inputType?: 'text' | 'email' | 'password'; 
      maxlength?: number;
    })
  | (FieldConfigBase & { 
      kind: 'number'; 
      step?: number;
      min?: number;
      max?: number;
      minFractionDigits?: number;
      maxFractionDigits?: number;
      prefix?: string;
      suffix?: string;
    })
  | (FieldConfigBase & { kind: 'select'; options: SelectControlOption[]; })
  | (FieldConfigBase & { kind: 'boolean'; })
  | (FieldConfigBase & { kind: 'color'; })
  | (FieldConfigBase & { 
    kind: 'vector'; 
    axisLabels?: string[];
    step?: number;
    displayScale?: number;
    min?: number;
    max?: number;
    minFractionDigits?: number;
    maxFractionDigits?: number;
    prefix?: string | string[];
    suffix?: string | string[];
  })
  | (FieldConfigBase & { kind: 'tags'; })
  | (FieldConfigBase & { kind: 'resource-picker'; actions: ResourcePickerAction[]; });

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
    TagSelectControl
  ],
  templateUrl: './field-list.html',
  styleUrl: './field-list.css',
})
export class FieldList {
  @Input({ required: true }) fields!: FieldConfig[];
  @Input({ required: true }) target!: FieldTarget;

  protected visibleFields = computed(() =>
    this.fields.filter(f => !f.visibleIf || f.visibleIf(this.target))
  );

  protected getValue<T>(path: PropertyPath): T {
    return this.target.getField(path) as T;
  }

  protected setValue(path: PropertyPath, value: unknown) {
    this.target.setField(path, value);
  }

  protected onResourceAction(path: PropertyPath, event: { actionId: string; path: string | null }) {
    // route through setValue or a dedicated resource-load handler
  }
}