import { Component, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectControlOption, SelectControl } from '../select-control/select-control';
import { ResourcePickerAction, ResourcePickerControl } from '../resource-picker-control/resource-picker-control';
import { InputTextControl } from "../input-text-control/input-text-control";
import { BooleanControl } from "../boolean-control/boolean-control";
import { Vector3Field } from "../vector3-field/vector3-field";
import { ColorPickerControl } from "../color-picker-control/color-picker-control";

// A "path" into the target's data — how a field reads/writes its value.
// Kept as a plain string so it's serializable and diffable, not a closure.
export type PropertyPath = string; // e.g. 'name', 'material.color', 'physics.mass'

// Anything FieldList can read/write fields on implements this — a
// TransformNode via dot-path reflection, a flat settings object via direct
// key lookup, a resource's metadata, etc. FieldList only ever talks to
// this interface, never to a concrete data shape.
export interface FieldTarget {
  getField(path: PropertyPath): unknown;
  setField(path: PropertyPath, value: unknown): void;
}

interface FieldConfigBase {
  path: PropertyPath;
  label: string;
  visibleIf?: (target: FieldTarget) => boolean; // field-level, optional — for cases where a panel applies but one field inside it doesn't always
}

export type FieldConfig =
  | (FieldConfigBase & { kind: 'text'; inputType?: 'text' | 'number'; maxlength?: number; })
  | (FieldConfigBase & { kind: 'select'; options: SelectControlOption[]; })
  | (FieldConfigBase & { kind: 'boolean'; })
  | (FieldConfigBase & { kind: 'color'; })
  | (FieldConfigBase & { kind: 'vector3'; })
  | (FieldConfigBase & { kind: 'resource-picker'; actions: ResourcePickerAction[]; });

export interface PropertyPanelConfig {
  key: string;                 // matches accordion `value`
  icon: string;
  label: string;
  fields: FieldConfig[];
}

@Component({
  selector: 'app-field-list',
  imports: [CommonModule, FormsModule, InputTextControl, SelectControl, BooleanControl, ResourcePickerControl, Vector3Field, ColorPickerControl],
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