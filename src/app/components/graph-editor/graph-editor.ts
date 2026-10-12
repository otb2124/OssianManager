import {
  Component, ChangeDetectionStrategy, HostListener, computed, effect,
  inject, input, output, signal, untracked, viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FFlowModule, FCanvasComponent, FReassignConnectionEvent } from '@foblex/flow';
import { FieldList } from '../field-list/field-list';
import { GraphConfig, GraphModel, SocketDef, GraphNode } from '../../model/graph.model';
import { GraphStore } from '../../services/ui/graph/graphstore';

const SEP = '::';
export const socketKey = (nodeId: string, socketId: string) => `${nodeId}${SEP}${socketId}`;
const parseKey = (key: string) => {
  const i = key.indexOf(SEP);
  return { node: key.slice(0, i), socket: key.slice(i + SEP.length) };
};

const FALLBACK_SOCKET_COLOR = '#9ca3af';

@Component({
  selector: 'app-graph-editor',
  standalone: true,
  imports: [FFlowModule, FieldList],
  providers: [GraphStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './graph-editor.html',
  styleUrl: './graph-editor.css'
})
export class GraphEditor {
  protected readonly store = inject(GraphStore);

  /** Node types, socket colors, connection rules. */
  readonly config = input.required<GraphConfig>();
  /** Initial / replacement graph. Treat as a value, not a two-way binding. */
  readonly model = input.required<GraphModel>();
  readonly readonly = input(false);

  /** Emits the full graph after every user edit. */
  readonly modelChange = output<GraphModel>();
  readonly selectionChange = output<string[]>();
  readonly nodeActivated = output<GraphNode>(); // double click

  private readonly canvas = viewChild(FCanvasComponent);

  protected readonly selectedIds = signal<string[]>([]);
  protected readonly isReadonly = computed(() => this.readonly() || !!this.config().readonly);

  /** Last model we emitted, so a parent echoing it back doesn't reset the store. */
  private lastEmitted: GraphModel | null = null;

  constructor() {
    // Parent -> store (only when the parent hands us a genuinely new model).
    effect(() => {
      const config = this.config();
      const model = this.model();
      untracked(() => {
        if (model === this.lastEmitted) return;
        this.store.init(config, model);
        this.selectedIds.set([]);
      });
    });

    // Store -> parent. Skip the initial emission that follows init().
    let first = true;
    effect(() => {
      const nodes = this.store.nodes();
      const edges = this.store.edges();
      untracked(() => {
        if (first) { first = false; return; }
        this.lastEmitted = { nodes, edges };
        this.modelChange.emit(this.lastEmitted);
      });
    });
  }

  // ── template helpers ───────────────────────────────────────────────────

  protected outId(node: GraphNode, socket: SocketDef): string {
    return socketKey(node.id, socket.id);
  }
  protected inId(node: GraphNode, socket: SocketDef): string {
    return socketKey(node.id, socket.id);
  }

  protected socketColor(dataType: string): string {
    return this.config().socketColors?.[dataType] ?? FALLBACK_SOCKET_COLOR;
  }

  protected readonly socketKey = socketKey;

  protected isSelected(nodeId: string): boolean {
    return this.selectedIds().includes(nodeId);
  }

  // ── Foblex event handlers ──────────────────────────────────────────────
  // VERIFY: payload property names against the Foblex version you installed
  // (docs: flow.foblex.com). In 17.x/18.x create/reassign events expose the
  // output id and input id; the exact property names have varied.

  protected onCreateConnection(event: { fOutputId: string; fInputId?: string }): void {
    if (this.isReadonly() || !event.fInputId) return; // dropped on empty canvas
    this.store.connect(parseKey(event.fOutputId), parseKey(event.fInputId));
  }

  protected onReassignConnection(event: FReassignConnectionEvent): void {
    if (this.isReadonly()) return;
  
    const e = event as unknown as Record<string, string | undefined>;
    console.log('[graph] reassign payload', e); // check the real field names here
  
    const outKey = e['fOutputId'];
    const oldIn = e['oldFInputId'] ?? e['fInputId'];
    const newIn = e['newFInputId'];
    if (!outKey || !oldIn) return;
  
    const out = parseKey(outKey);
    const old = parseKey(oldIn);
    const edge = this.store.edges().find(x =>
      x.fromNode === out.node && x.fromSocket === out.socket &&
      x.toNode === old.node && x.toSocket === old.socket);
    if (!edge) return;
  
    this.store.removeEdges([edge.id]);
    if (newIn) this.store.connect(out, parseKey(newIn)); // dropped on empty canvas = just delete
  }

  protected onNodeMoved(nodeId: string, position: { x: number; y: number }): void {
    if (this.isReadonly()) return;
    this.store.moveNode(nodeId, position);
  }

  protected onSelectionChange(event: { fNodeIds?: string[]; fConnectionIds?: string[] }): void {
    const ids = event.fNodeIds ?? [];
    this.selectedIds.set(ids);
    this.selectionChange.emit(ids);
  }

  protected onNodeDblClick(node: GraphNode): void {
    this.nodeActivated.emit(node);
  }

  // ── view control ───────────────────────────────────────────────────────

  /** Call from (fLoaded) on <f-flow>, or from a toolbar button. */
  protected onLoaded(): void {
    this.fit(false);
  }

  fit(animated = true): void {
    // VERIFY: method name/signature on FCanvasComponent in your version
    // (resetScaleAndCenter / fitToScreen).
    this.canvas()?.resetScaleAndCenter(animated);
  }

  // ── keyboard ───────────────────────────────────────────────────────────

  @HostListener('keydown', ['$event'])
  protected onKeydown(e: KeyboardEvent): void {
    if (this.isReadonly()) return;
    // Don't hijack Delete while typing in a node's field.
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const ids = this.selectedIds();
      if (!ids.length) return;
      this.store.removeNodes(ids);
      this.selectedIds.set([]);
      e.preventDefault();
    }
  }
}