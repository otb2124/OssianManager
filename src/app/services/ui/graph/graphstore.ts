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
}