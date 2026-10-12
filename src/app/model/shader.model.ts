import { FieldConfig } from '../components/field-list/field-list';

export type UniformDef =
  | { type: 'float'; label?: string; default: number; min?: number; max?: number; step?: number }
  | { type: 'int';   label?: string; default: number; min?: number; max?: number }
  | { type: 'bool';  label?: string; default: boolean }
  | { type: 'vec2';  label?: string; default: { x: number; y: number }; step?: number }
  | { type: 'color'; label?: string; default: string };            // '#rrggbb'

export interface ShaderDef {
  id: string;
  name: string;
  /** Either a full `void main()` using gl_FragCoord, or a Shadertoy-style `mainImage`. */
  fragment: string;
  /** Key = uniform name in GLSL. Declared automatically, do not declare them yourself. */
  uniforms?: Record<string, UniformDef>;
}

export type UniformValues = Record<string, unknown>;

export function defaultValues(def: ShaderDef): UniformValues {
  return Object.fromEntries(
    Object.entries(def.uniforms ?? {}).map(([k, u]) => [
      k, u.type === 'vec2' ? { ...u.default } : u.default,
    ]),
  );
}

/** Auto-generated settings UI for <app-field-list>. */
export function uniformFields(def: ShaderDef): FieldConfig[] {
  return Object.entries(def.uniforms ?? {}).map(([path, u]): FieldConfig => {
    const label = u.label ?? path.replace(/^u/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
    switch (u.type) {
      case 'float': return { kind: 'number', path, label, step: u.step ?? 0.05, min: u.min, max: u.max, maxFractionDigits: 3 };
      case 'int':   return { kind: 'number', path, label, step: 1, min: u.min, max: u.max, maxFractionDigits: 0 };
      case 'bool':  return { kind: 'boolean', path, label };
      case 'vec2':  return { kind: 'vector', path, label, axisLabels: ['X', 'Y'], step: u.step ?? 0.05 };
      case 'color': return { kind: 'color', path, label, allowAlpha: false };
    }
  });
}