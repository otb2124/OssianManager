import {
  Component, ChangeDetectionStrategy, HostListener, computed, effect,
  inject, input, output, signal, untracked, viewChild,
  ViewEncapsulation,
  ElementRef,
} from '@angular/core';
import { FFlowModule, FCanvasComponent, FReassignConnectionEvent, FFlowComponent, FZoomDirective } from '@foblex/flow';
import { FieldList } from '../field-list/field-list';
import { GraphConfig, GraphModel, SocketDef, GraphNode } from '../../model/graph.model';
import { GraphStore } from '../../services/ui/graph/graphstore';
import { Menu, MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { InputText } from 'primeng/inputtext';

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
  imports: [FFlowModule, FieldList, ButtonModule, MenuModule, TooltipModule, InputText],
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

  /** Store has been filled from the model; f-flow is only created after this. */
  protected readonly storeReady = signal(false);
  /** Foblex has loaded, the view is fitted, and the first frame has settled. */
  protected readonly flowReady = signal(false);

  /** Parent says dependencies (project, config, engine…) aren't ready yet. */
  readonly loading = input(false);
  
  /** f-flow only exists once the store is filled AND nothing upstream is loading. */
  protected readonly renderFlow = computed(() => this.storeReady() && !this.loading());

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly flow = viewChild(FFlowComponent);
  private readonly zoom = viewChild(FZoomDirective);
  private readonly addMenu = viewChild<Menu>('addMenu');
  
  protected readonly hasSelection = computed(() => this.selectedIds().length > 0);

  protected readonly addItems = computed<MenuItem[]>(() =>
    Object.values(this.config().types).map(t => ({
      label: t.title,
      icon: t.icon,
      command: () => this.addNode(t.id),
    })));

  protected readonly editingId = signal<string | null>(null);

  constructor() {
    // Parent -> store
    effect(() => {
      const config = this.config();
      const model = this.model();
      untracked(() => {
        if (model === this.lastEmitted) return;
        this.store.init(config, model);
        this.selectedIds.set([]);
        this.storeReady.set(true);          // safety-net timeout moved below
      });
    });
  
    // Going back into loading => show spinner again; f-flow gets destroyed by @if
    effect(() => {
      if (this.loading()) untracked(() => this.flowReady.set(false));
    });
  
    // Safety net, armed every time f-flow is (re)created
    effect((onCleanup) => {
      if (!this.renderFlow()) return;
      const t = setTimeout(() => this.flowReady.set(true), 1500);
      onCleanup(() => clearTimeout(t));
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
    // Two frames: Foblex applies node sizes/positions, and the field controls
    // finish their first (async ngModel) render, before we reveal the graph.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => this.flowReady.set(true)));
  }

  fit(animated = true): void {
    // VERIFY: method name/signature on FCanvasComponent in your version
    // (resetScaleAndCenter / fitToScreen).
    this.canvas()?.resetScaleAndCenter(animated);
  }


  protected onAddClick(event: Event): void {
    const types = Object.values(this.config().types);
    if (types.length === 1) this.addNode(types[0].id);
    else this.addMenu()?.toggle(event);
  }
  
  private addNode(typeId: string): void {
    if (this.isReadonly()) return;
    const id = this.store.addNode(typeId, this.viewportCenter());
    this.selectNodes([id]);
  }
  
  protected duplicateSelected(): void {
    if (this.isReadonly() || !this.hasSelection()) return;
    this.selectNodes(this.store.duplicateNodes(this.selectedIds()));
  }
  
  protected deleteSelected(): void {
    const ids = this.selectedIds();
    if (this.isReadonly() || !ids.length) return;
    this.store.removeNodes(ids);
    this.selectedIds.set([]);
  }
  
  protected selectAll(): void {
    this.selectNodes(this.store.nodes().map(n => n.id));
  }
  
  protected zoomIn(): void  { this.zoom()?.zoomIn(); }   // VERIFY: FZoomDirective API in 19.x
  protected zoomOut(): void { this.zoom()?.zoomOut(); }
  
  private selectNodes(ids: string[]): void {
    this.flow()?.select(ids, []);                         // VERIFY: FFlowComponent.select(nodeIds, connectionIds)
    this.selectedIds.set(ids);
    this.selectionChange.emit(ids);
  }
  
  /** Center of the visible area, in flow coordinates, offset so the node's middle lands there. */
  private viewportCenter(): { x: number; y: number } {
    const r = this.host.nativeElement.getBoundingClientRect();
    const p = this.flow()?.getPositionInFlow({ x: r.left + r.width / 2, y: r.top + r.height / 2 }); // VERIFY
    return p ? { x: Math.round(p.x - 100), y: Math.round(p.y - 30) } : { x: 0, y: 0 };
  }

  protected startRename(node: GraphNode, event: Event): void {
    event.stopPropagation();                 // don't trigger nodeActivated (scene navigation)
    if (this.isReadonly()) return;
    this.editingId.set(node.id);
    setTimeout(() => {
      const el = this.host.nativeElement.querySelector<HTMLInputElement>('input[data-rename]');
      el?.focus();
      el?.select();
    });
  }
  
  protected commitRename(node: GraphNode, value: string): void {
    if (this.editingId() !== node.id) return;   // already committed/cancelled (Enter then blur)
    this.editingId.set(null);
    if (value.trim() !== (node.name ?? node.id)) this.store.renameNode(node.id, value);
  }
  
  protected cancelRename(): void {
    this.editingId.set(null);
  }

  // ── keyboard ───────────────────────────────────────────────────────────

  @HostListener('keydown', ['$event'])
  protected onKeydown(e: KeyboardEvent): void {
    if (this.isReadonly()) return;
    // Don't hijack Delete while typing in a node's field.
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!this.hasSelection()) return;
      this.deleteSelected();
      e.preventDefault();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      this.duplicateSelected();
      e.preventDefault();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      this.selectAll();
      e.preventDefault();
    }
  }
}