import {
  AfterViewInit, ApplicationRef, Component, ComponentRef, ElementRef, EnvironmentInjector,
  OnDestroy, Type, ViewEncapsulation, computed, createComponent, inject, input, output, viewChild,
} from '@angular/core';
import {
  AddPanelOptions, DockviewApi, GroupPanelPartInitParameters, IContentRenderer, PanelUpdateEvent, createDockview,
  themeAbyss,
} from 'dockview-core';
import { windowKind, WindowKind } from '../../../services/system/windows/window-kind';

export interface DockPanelDef {
  id: string;
  title: string;
  component: Type<unknown>;
  /** Plain data only (it is serialized with the layout). Applied via setInput. */
  inputs?: Record<string, unknown>;
  position?: AddPanelOptions['position'];
  initialWidth?: number;
  initialHeight?: number;
  /** 'always' keeps the component in the DOM while its tab is hidden. */
  renderer?: 'always' | 'onlyWhenVisible';
  inactive?: boolean;
  floating?: Exclude<AddPanelOptions['floating'], false | undefined>;

  windows?: WindowKind[];
}

/** Hosts any Angular component inside a dockview panel. */
class AngularPanelRenderer implements IContentRenderer {
  readonly element = document.createElement('div');
  private ref?: ComponentRef<unknown>;

  constructor(
    private readonly type: Type<unknown>,
    private readonly injector: EnvironmentInjector,
    private readonly appRef: ApplicationRef,
  ) {
    this.element.style.cssText = 'display:block;height:100%;width:100%;overflow:hidden;';
  }

  init(parameters: GroupPanelPartInitParameters): void {
    this.ref = createComponent(this.type, {
      environmentInjector: this.injector,
      hostElement: this.element,
    });
    for (const [key, value] of Object.entries(parameters.params ?? {})) {
      this.ref.setInput(key, value);
    }
    this.appRef.attachView(this.ref.hostView);
  }

  update(event: PanelUpdateEvent): void {
    for (const [key, value] of Object.entries(event.params ?? {})) {
      this.ref?.setInput(key, value);
    }
  }

  dispose(): void {
    if (!this.ref) return;
    this.appRef.detachView(this.ref.hostView);
    this.ref.destroy();
    this.ref = undefined;
  }
}

@Component({
  selector: 'app-dock-grid',
  standalone: true,
  templateUrl: './dock-grid.html',
  styleUrl: './dock-grid.css',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block h-full w-full' },
})
export class DockGrid implements AfterViewInit, OnDestroy {

  private readonly activePanels = computed(() => panelsForWindow(this.panels(), windowKind));
  readonly panels = input.required<DockPanelDef[]>();
  readonly components = input<Record<string, Type<unknown>>>({});
  /** When set, the layout is saved to localStorage under this key and restored on start. */
  readonly layoutKey = input<string | null>(null);
  readonly ready = output<DockviewApi>();

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private readonly injector = inject(EnvironmentInjector);
  private readonly appRef = inject(ApplicationRef);

  private api?: DockviewApi;
  private saveTimer?: ReturnType<typeof setTimeout>;
  private readonly subs: { dispose(): void }[] = [];

  readonly allowFloating = input(true);

  ngAfterViewInit(): void {
    this.api = createDockview(this.host().nativeElement, {
      theme: themeAbyss,
      disableFloatingGroups: !this.allowFloating(),
      floatingGroupBounds: 'boundedWithinViewport',
      createComponent: ({ name }) => {
        const type = this.activePanels().find(p => p.id === name)?.component ?? this.components()[name];
        if (!type) throw new Error(`[DockGrid] Unknown panel "${name}"`);
        return new AngularPanelRenderer(type, this.injector, this.appRef);
      },
    });

    if (!this.restore()) this.buildDefault();

    this.subs.push(this.api.onDidLayoutChange(() => this.scheduleSave()));
    this.ready.emit(this.api);
  }

  /** Throws away the saved layout and rebuilds the default one. */
  resetLayout(): void {
    const key = this.storageKey();
    if (key) localStorage.removeItem(key);
    this.api?.clear();
    this.buildDefault();
  }

  private buildDefault(): void {
    for (const def of this.activePanels()) {
      const base = {
        id: def.id,
        component: def.id,
        title: def.title,
        params: def.inputs,
        initialWidth: def.initialWidth,
        initialHeight: def.initialHeight,
        renderer: def.renderer,
        inactive: def.inactive,
      };
  
      const floating = def.floating;
      this.api!.addPanel(
        floating
          ? { ...base, floating }
          : { ...base, position: def.position },
      );
    }
  }

  private restore(): boolean {
    const key = this.storageKey();
    const saved = key ? localStorage.getItem(key) : null;
    if (!saved) return false;
    try {
      this.api!.fromJSON(JSON.parse(saved));
      return true;
    } catch (err) {
      console.warn('[DockGrid] Saved layout is invalid, using the default.', err);
      this.api!.clear();
      return false;
    }
  }

  private scheduleSave(): void {
    const key = this.storageKey();
    if (!key || !this.api) return;
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => localStorage.setItem(key, JSON.stringify(this.api!.toJSON())), 300);
  }

  private storageKey(): string | null {
    const key = this.layoutKey();
    return key ? `${key}.${windowKind}` : null;
  }

  ngOnDestroy(): void {
    clearTimeout(this.saveTimer);
    this.subs.forEach(s => s.dispose());
    this.api?.dispose();
  }
}

/**
 * Drops panels that don't belong in `kind`. A panel anchored to a dropped panel is re-anchored
 * to whatever that panel was anchored to (transitively), or loses its position if nothing is left.
 */
export function panelsForWindow(defs: DockPanelDef[], kind: WindowKind): DockPanelDef[] {
  const kept = defs.filter(d => !d.windows || d.windows.includes(kind));
  const keptIds = new Set(kept.map(d => d.id));
  const byId = new Map(defs.map(d => [d.id, d]));

  const refOf = (d: DockPanelDef | undefined): string | null => {
    const pos = d?.position as { referencePanel?: unknown } | undefined;
    return typeof pos?.referencePanel === 'string' ? pos.referencePanel : null;
  };

  const resolve = (id: string, seen = new Set<string>()): string | null => {
    if (keptIds.has(id)) return id;
    if (seen.has(id)) return null;
    seen.add(id);
    const next = refOf(byId.get(id));
    return next ? resolve(next, seen) : null;
  };

  return kept.map(d => {
    const ref = refOf(d);
    if (!ref || keptIds.has(ref)) return d;
    const resolved = resolve(ref);
    return {
      ...d,
      position: resolved ? ({ ...(d.position as object), referencePanel: resolved } as DockPanelDef['position']) : undefined,
    };
  });
}