import { FieldConfig } from '../components/field-list/field-list';

export interface SocketDef {
  id: string;            // unique within the node type
  label: string;
  dataType: string;      // 'scene' | 'float' | 'vec3' | 'color' | 'texture' | ...
  multi?: boolean;       // inputs: accept several edges (default false)
}

export interface NodeTypeDef {
  id: string;
  title: string;
  icon?: string;
  color?: string;        // header color
  inputs: SocketDef[];
  outputs: SocketDef[];
  fields?: FieldConfig[]; // rendered inside the node body via app-field-list
}

export interface GraphNode {
  id: string;
  name?: string;
  type: string;                       // NodeTypeDef.id
  position: { x: number; y: number };
  values: Record<string, unknown>;    // model for the node's fields
}

export interface GraphEdge {
  id: string;
  fromNode: string; fromSocket: string;
  toNode: string;   toSocket: string;
}

export interface GraphModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphConfig {
  types: Record<string, NodeTypeDef>;
  /** Extra rules beyond equal dataType, e.g. allow float -> vec3. */
  canConnect?: (from: SocketDef, to: SocketDef) => boolean;
  socketColors?: Record<string, string>;   // by dataType
  readonly?: boolean;
}