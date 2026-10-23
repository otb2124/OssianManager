import { Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { FieldConfig, FieldList, FieldTarget } from '../../fields/field-list/field-list';
import { NotificationService } from '../../../services/notifications/notification.service';
import { EngineIpcService, EngineNodeDetail, EnginePropertyDetail } from '../../../services/engine/ipc/engine-ipc';
import { EnginePropertyTarget, humanize, iconFor, InspectorSection, toField, toWire } from '../../../services/data/inspector-fields/inspector-fields';

@Component({
  selector: 'app-inspector-panel',
  standalone: true,
  imports: [FieldList, AccordionModule, ButtonModule],
  templateUrl: './inspector-panel.html',
})
export class InspectorPanel {
  protected readonly engine = inject(EngineIpcService);
  private readonly notifications = inject(NotificationService);

  protected readonly node = signal<EngineNodeDetail | null>(null);
  protected readonly sections = signal<InspectorSection[]>([]);
  protected readonly openPanels = signal<string[]>([]);
  protected readonly loadError = signal<string | null>(null);

  // The node-level toggle lives outside the property list (it's Node.Enabled, not a NodeProperty member).
  protected readonly nodeFields: FieldConfig[] = [{ kind: 'boolean', path: 'enabled', label: 'Enabled' }];
  protected readonly nodeTarget: FieldTarget = {
    getField: () => this.node()?.enabled ?? false,
    setField: (_path, value) => void this.setEnabled(!!value),
  };

  private loadToken = 0;
  private readonly pendingWrites = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    // Reload when the selection (or the connection) changes.
    effect(() => {
      const id = this.engine.connected() ? this.engine.selectedId() : null;
      untracked(() => void this.load(id));
    });

    // Structural changes in the engine: refresh the current node, keep panel expansion.
    this.engine.events$.pipe(takeUntilDestroyed()).subscribe(e => {
      if (e.event === 'nodes.changed') void this.load(this.engine.selectedId(), true);
    });

    inject(DestroyRef).onDestroy(() => this.pendingWrites.forEach(t => clearTimeout(t)));
  }

  protected reload(): void {
    void this.load(this.engine.selectedId(), true);
  }

  protected onOpenChange(value: unknown): void {
    this.openPanels.set(Array.isArray(value) ? value.map(String) : value == null ? [] : [String(value)]);
  }

  // ── loading ───────────────────────────────────────────────────────────────────────

  private async load(id: string | null, keepOpen = false): Promise<void> {
    const token = ++this.loadToken;

    if (!id) {
      this.node.set(null);
      this.sections.set([]);
      this.loadError.set(null);
      return;
    }

    try {
      const detail = await this.engine.getNode(id);
      if (token !== this.loadToken) return; // a newer selection superseded this request

      const sections = detail.properties.map((p, i) => this.buildSection(detail, p, i));
      this.loadError.set(null);
      this.node.set(detail);
      this.sections.set(sections);
      if (!keepOpen) this.openPanels.set(sections.map(s => s.key));
    } catch (err) {
      if (token !== this.loadToken) return;
      this.node.set(null);
      this.sections.set([]);
      this.loadError.set(String(err));
    }
  }

  private buildSection(_node: EngineNodeDetail, prop: EnginePropertyDetail, index: number): InspectorSection {
    const values: Record<string, unknown> = {};
    const fields: FieldConfig[] = [];

    for (const [name, raw] of Object.entries(prop.values)) {
      const built = toField(name, raw);
      if (!built) continue;
      fields.push(built.field);
      values[name] = built.value;
    }

    return {
      key: `${prop.type}#${index}`,
      header: humanize(prop.type),
      icon: iconFor(prop.type),
      fields,
      target: new EnginePropertyTarget(values, (path, value) => this.commit(prop.type, path, value)),
    };
  }

  // ── writing ───────────────────────────────────────────────────────────────────────

  // Debounced per member so typing / dragging doesn't flood the pipe. On failure the engine's
  // message is shown and the node is re-read, which reverts the UI to the real value.
  private commit(type: string, path: string, value: unknown): void {
    const id = this.node()?.id;
    if (!id || value == null) return;

    const key = `${type}:${path}`;
    clearTimeout(this.pendingWrites.get(key));
    this.pendingWrites.set(
      key,
      setTimeout(async () => {
        this.pendingWrites.delete(key);
        try {
          await this.engine.setValue(id, type, path, toWire(value));
        } catch (err) {
          this.notifications.error(`Could not set ${type}.${path}`, String(err));
          void this.load(id, true);
        }
      }, 80),
    );
  }

  private async setEnabled(enabled: boolean): Promise<void> {
    const id = this.node()?.id;
    if (!id) return;
    try {
      const detail = await this.engine.setEnabled(id, enabled);
      this.node.update(n => (n ? { ...n, enabled: detail.enabled } : n));
      void this.engine.refreshTree();
    } catch (err) {
      this.notifications.error('Could not change node state', String(err));
      void this.load(id, true);
    }
  }
}