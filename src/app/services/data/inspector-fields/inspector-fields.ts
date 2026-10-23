import { FieldConfig, FieldTarget } from "../../../components/fields/field-list/field-list";


export interface InspectorSection {
  key: string;
  header: string;
  icon: string;
  fields: FieldConfig[];
  target: FieldTarget;
}

/** Members of the NodeProperty base class that are engine plumbing, not something to edit. */
const HIDDEN_MEMBERS = new Set(['NodeId', 'Started', 'Writable']);

const ICONS: [RegExp, string][] = [
  [/transform/i, 'pi pi-arrows-alt'],
  [/material/i, 'pi pi-image'],
  [/collider/i, 'pi pi-globe'],
  [/physics/i, 'pi pi-bolt'],
  [/emission/i, 'pi pi-sun'],
  [/camera/i, 'pi pi-camera'],
  [/statemachine/i, 'pi pi-sitemap'],
  [/script/i, 'pi pi-code'],
  [/sound/i, 'pi pi-volume-up'],
];

export function iconFor(typeName: string): string {
  return ICONS.find(([re]) => re.test(typeName))?.[1] ?? 'pi pi-box';
}

/** "TextureMaterialProperty" -> "Texture Material", "ClipsChildren" -> "Clips Children" */
export function humanize(name: string): string {
  return name
    .replace(/Property$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, c => c.toUpperCase());
}

/** System.Numerics vectors arrive as { X, Y, (Z, (W)) }. */
function isVector(v: unknown): v is Record<string, number> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const keys = Object.keys(v);
  if (keys.length < 2 || keys.length > 4) return false;
  const expected = 'XYZW'.slice(0, keys.length);
  return keys.every(k => expected.includes(k)) && Object.values(v).every(n => typeof n === 'number');
}

/**
 * Maps one engine member to a field. Returns null for members the inspector doesn't show:
 * hidden/private members, nulls, nested objects and collections.
 * Vectors are normalised to lowercase keys because VectorControl looks up x/y/z/w.
 */
export function toField(name: string, raw: unknown): { field: FieldConfig; value: unknown } | null {
  if (HIDDEN_MEMBERS.has(name) || name.startsWith('_') || raw == null) return null;
  const label = humanize(name);

  if (typeof raw === 'boolean') {
    return { field: { kind: 'boolean', path: name, label }, value: raw };
  }

  if (typeof raw === 'number') {
    return {
      field: { kind: 'number', path: name, label, step: Number.isInteger(raw) ? 1 : 0.1, maxFractionDigits: 4 },
      value: raw,
    };
  }

  if (typeof raw === 'string') {
    // Node / resource references: show the id, read-only (picker has no actions).
    const ref = /^(?:node|resource):(.*)$/.exec(raw);
    if (ref) return { field: { kind: 'resource-picker', path: name, label, actions: [] }, value: ref[1] };
    return { field: { kind: 'text', path: name, label }, value: raw };
  }

  if (isVector(raw)) {
    const axes = 'XYZW'.slice(0, Object.keys(raw).length).split('');
    return {
      field: { kind: 'vector', path: name, label, axisLabels: axes, step: 0.1, maxFractionDigits: 4 },
      value: Object.fromEntries(axes.map(a => [a.toLowerCase(), raw[a]])),
    };
  }

  return null;
}

/** UI value -> what node.set expects ({x,y,z} -> [x,y,z]). */
export function toWire(value: unknown): string | number | boolean | number[] {
  if (value && typeof value === 'object') {
    const v = value as Record<string, number>;
    return ['x', 'y', 'z', 'w'].filter(k => k in v).map(k => Number(v[k]));
  }
  return value as string | number | boolean;
}

/** FieldTarget for one engine property: reads from a local copy, writes through to the engine. */
export class EnginePropertyTarget implements FieldTarget {
  constructor(
    private readonly values: Record<string, unknown>,
    private readonly commit: (path: string, value: unknown) => void,
  ) {}

  getField(path: string): unknown {
    return this.values[path];
  }

  setField(path: string, value: unknown): void {
    this.values[path] = value;
    this.commit(path, value);
  }
}