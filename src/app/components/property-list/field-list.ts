import { Component, computed, Input } from '@angular/core';
import { TransformNode } from '@babylonjs/core';
import { SelectControlOption, SelectControl } from '../select-control/select-control';
import { ResourcePickerAction, ResourcePickerControl } from '../resource-picker-control/resource-picker-control';
import { InputTextControl } from "../input-text-control/input-text-control";
import { BooleanControl } from "../boolean-control/boolean-control";
import { Vector3Field } from "../vector3-field/vector3-field";
import { ColorPickerControl } from "../color-picker-control/color-picker-control";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


export type NodeKind =
  | 'Node' | 'Transform' | 'TextureMaterial' | 'CubemapMaterial'
  | 'TextMaterial' | 'WireframeMaterial' | 'Mesh' | 'RigidPhysics'
  | 'StaticPhysics' | 'Collider' | 'Animation' | 'PointEmission'
  | 'SpotEmission' | 'SunEmission' | 'Camera' | 'OrbitalCamera'
  | 'Group' | 'Sound' | 'StateMachine' | 'Script';

// A "path" into the selected node's data — how a field reads/writes its value.
// Kept as a plain string so it's serializable and diffable, not a closure.
type PropertyPath = string; // e.g. 'name', 'material.color', 'physics.mass'

interface FieldConfigBase {
  path: PropertyPath;
  label: string;
  visibleIf?: (node: TransformNode) => boolean; // field-level, optional — for cases where a panel applies but one field inside it doesn't always
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
  appliesTo: (node: TransformNode) => boolean;
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
  @Input({ required: true }) node!: TransformNode;

  protected visibleFields = computed(() =>
    this.fields.filter(f => !f.visibleIf || f.visibleIf(this.node))
  );

  protected getValue<T>(path: PropertyPath): T {
    return this.getProperty(this.node, path) as T;
  }
  
  protected setValue(path: PropertyPath, value: unknown) { this.setProperty(this.node, path, value); }
  protected onResourceAction(path: PropertyPath, event: { actionId: string; path: string | null }) {
    // route through setValue or a dedicated resource-load handler
  }

  getProperty(node: TransformNode, path: PropertyPath): unknown {
    return path.split('.').reduce((obj: any, key) => obj?.[key], node);
  }
  
  setProperty(node: TransformNode, path: PropertyPath, value: unknown): void {
    const keys = path.split('.');
    const last = keys.pop()!;
    const target = keys.reduce((obj: any, key) => obj?.[key], node);
    if (target) target[last] = value;
  }
}
