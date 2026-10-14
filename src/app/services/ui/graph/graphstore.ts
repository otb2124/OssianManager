import { Injectable, signal } from '@angular/core';
import { GraphNode, GraphEdge, GraphConfig, GraphModel } from '../../../model/graph.model';

@Injectable()
export class GraphStore {
  readonly nodes = signal<GraphNode[]>([]);
  readonly edges = signal<GraphEdge[]>([]);
  private config!: GraphConfig;

  init(config: GraphConfig, model: GraphModel) {
    this.config = config; this.nodes.set(model.nodes); this.edges.set(model.edges);
  }

  typeOf(node: GraphNode) { return this.config.types[node.type]; }

  moveNode(id: string, position: { x: number; y: number }) {
    this.nodes.update(ns => ns.map(n => n.id === id ? { ...n, position } : n));
  }

  canConnect(a: { node: string; socket: string }, b: { node: string; socket: string }): boolean {
    const from = this.findSocket(a, 'outputs'), to = this.findSocket(b, 'inputs');
    if (!from || !to || a.node === b.node) return false;
    return from.dataType === to.dataType || !!this.config.canConnect?.(from, to);
  }

  connect(a: { node: string; socket: string }, b: { node: string; socket: string }) {
    if (!this.canConnect(a, b)) return;
    const to = this.findSocket(b, 'inputs')!;
    this.edges.update(es => [
      ...(to.multi ? es : es.filter(e => !(e.toNode === b.node && e.toSocket === b.socket))),
      { id: crypto.randomUUID(), fromNode: a.node, fromSocket: a.socket, toNode: b.node, toSocket: b.socket },
    ]);
  }

  removeEdges(ids: string[]) {
    const set = new Set(ids);
    this.edges.update(es => es.filter(e => !set.has(e.id)));
  }
  
  removeNodes(ids: string[]) {
    const set = new Set(ids);
    this.nodes.update(ns => ns.filter(n => !set.has(n.id)));
    // drop edges attached to removed nodes
    this.edges.update(es => es.filter(e => !set.has(e.fromNode) && !set.has(e.toNode)));
  }
  
  private findSocket(ref: { node: string; socket: string }, side: 'inputs' | 'outputs') {
    const n = this.nodes().find(x => x.id === ref.node);
    return n ? this.typeOf(n)[side].find(s => s.id === ref.socket) : undefined;
  }

  addNode(typeId: string, at: { x: number; y: number }): string {
    const type = this.config.types[typeId];
    const values: Record<string, unknown> = {};
    for (const f of type.fields ?? []) {
      const d = (f as { defaultValue?: unknown }).defaultValue;
      if (d !== undefined) values[String(f.path)] = d;
    }
  
    // nudge so repeated adds don't stack exactly on top of each other
    const pos = { ...at };
    while (this.nodes().some(n => n.position.x === pos.x && n.position.y === pos.y)) {
      pos.x += 30; pos.y += 30;
    }
  
    const id = crypto.randomUUID();
    const count = this.nodes().filter(n => n.type === typeId).length + 1;

    this.nodes.update(ns => [...ns, { id, type: typeId, name: `${type.title} ${count}`, position: pos, values }]);
    return id;
  }
  
  duplicateNodes(ids: string[]): string[] {
    const src = this.nodes().filter(n => ids.includes(n.id));
    if (!src.length) return [];
  
    const idMap = new Map(src.map(n => [n.id, crypto.randomUUID()]));
    const nodeCopies: GraphNode[] = src.map(n => ({
      ...n,
      id: idMap.get(n.id)!,
      name: `${n.name ?? n.id} copy`,
      position: { x: n.position.x + 40, y: n.position.y + 40 },
      values: structuredClone(n.values),
    }));
    const edgeCopies: GraphEdge[] = this.edges()
      .filter(e => idMap.has(e.fromNode) && idMap.has(e.toNode))
      .map(e => ({
        ...e,
        id: crypto.randomUUID(),
        fromNode: idMap.get(e.fromNode)!,
        toNode: idMap.get(e.toNode)!,
      }));
  
    this.nodes.update(ns => [...ns, ...nodeCopies]);
    this.edges.update(es => [...es, ...edgeCopies]);
    return nodeCopies.map(n => n.id);
  }

  renameNode(id: string, name: string) {
    const trimmed = name.trim();
    this.nodes.update(ns => ns.map(n =>
      n.id === id ? { ...n, name: trimmed || undefined } : n));   // empty => back to id
  }
}