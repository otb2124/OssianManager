import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TagModule } from 'primeng/tag';
import { NotificationService } from '../../../services/notifications/notification.service';
import { NotificationSeverity } from '../../../model/notification.model';

type LogEntry = ReturnType<NotificationService['log']>[number];
type SortMode = 'newest' | 'oldest' | 'severity' | 'title';
type RangeMode = 'all' | 'hour' | 'day' | 'week';
type ButtonSeverity = 'success' | 'info' | 'warn' | 'danger';

interface LogItem {
  kind: 'item';
  key: string;
  entry: LogEntry;
  count: number;
  first: number;
  last: number;
}

interface LogHeader {
  kind: 'header';
  key: string;
  label: string;
  count: number;
}

type LogRow = LogItem | LogHeader;

const SEVERITIES: NotificationSeverity[] = ['error', 'warn', 'success', 'info'];

const SEVERITY_RANK: Record<NotificationSeverity, number> = {
  error: 0,
  warn: 1,
  success: 2,
  info: 3,
};

const RANGE_MS: Record<Exclude<RangeMode, 'all'>, number> = {
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
};

@Component({
  selector: 'app-notification-log',
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule, IconFieldModule,
    InputIconModule, SelectModule, ToggleButtonModule, TagModule,
  ],
  templateUrl: './notification-log.html',
})
export class NotificationLog {
  protected notificationService = inject(NotificationService);

  // ── filter / sort state ──────────────────────────────────────────────
  protected readonly query = signal('');
  protected readonly sort = signal<SortMode>('newest');
  protected readonly range = signal<RangeMode>('all');
  protected readonly activeSeverities = signal<ReadonlySet<NotificationSeverity>>(new Set());
  protected readonly collapseDuplicates = signal(false);
  protected readonly expanded = signal<ReadonlySet<string>>(new Set());
  protected readonly copiedId = signal<string | null>(null);

  protected readonly severities = SEVERITIES;

  protected readonly sortOptions: { label: string; value: SortMode }[] = [
    { label: 'Newest first', value: 'newest' },
    { label: 'Oldest first', value: 'oldest' },
    { label: 'Severity', value: 'severity' },
    { label: 'Title A-Z', value: 'title' },
  ];

  protected readonly rangeOptions: { label: string; value: RangeMode }[] = [
    { label: 'All time', value: 'all' },
    { label: 'Last hour', value: 'hour' },
    { label: 'Last 24 hours', value: 'day' },
    { label: 'Last 7 days', value: 'week' },
  ];

  // ── pipeline ─────────────────────────────────────────────────────────

  /** Search + time range applied. Severity is not applied yet, so chip counts stay meaningful. */
  private readonly baseFiltered = computed<LogEntry[]>(() => {
    const q = this.query().trim().toLowerCase();
    const range = this.range();
    const cutoff = range === 'all' ? 0 : Date.now() - RANGE_MS[range];

    return this.notificationService.log().filter(e => {
      if (cutoff && this.time(e) < cutoff) return false;
      if (!q) return true;
      return e.title.toLowerCase().includes(q)
        || (e.description ?? '').toLowerCase().includes(q);
    });
  });

  protected readonly severityCounts = computed(() => {
    const counts: Record<NotificationSeverity, number> = { error: 0, warn: 0, success: 0, info: 0 };
    for (const e of this.baseFiltered()) counts[e.severity]++;
    return counts;
  });

  private readonly filtered = computed<LogEntry[]>(() => {
    const active = this.activeSeverities();
    const list = this.baseFiltered();
    return active.size === 0 ? list : list.filter(e => active.has(e.severity));
  });

  private readonly items = computed<LogItem[]>(() => {
    const list = this.filtered();

    let items: LogItem[];
    if (this.collapseDuplicates()) {
      const groups = new Map<string, LogItem>();
      for (const e of list) {
        const t = this.time(e);
        const dupKey = `${e.severity}|${e.title}|${e.description ?? ''}`;
        const existing = groups.get(dupKey);
        if (!existing) {
          groups.set(dupKey, { kind: 'item', key: e.id, entry: e, count: 1, first: t, last: t });
        } else {
          existing.count++;
          if (t > existing.last) { existing.last = t; existing.entry = e; existing.key = e.id; }
          if (t < existing.first) existing.first = t;
        }
      }
      items = [...groups.values()];
    } else {
      items = list.map(e => {
        const t = this.time(e);
        return { kind: 'item', key: e.id, entry: e, count: 1, first: t, last: t } as LogItem;
      });
    }

    const byTimeDesc = (a: LogItem, b: LogItem) => b.last - a.last;

    switch (this.sort()) {
      case 'newest': items.sort(byTimeDesc); break;
      case 'oldest': items.sort((a, b) => a.last - b.last); break;
      case 'severity':
        items.sort((a, b) =>
          SEVERITY_RANK[a.entry.severity] - SEVERITY_RANK[b.entry.severity] || byTimeDesc(a, b));
        break;
      case 'title':
        items.sort((a, b) =>
          a.entry.title.localeCompare(b.entry.title) || byTimeDesc(a, b));
        break;
    }
    return items;
  });

  /** Items interleaved with section headers (day for time sorts, severity for severity sort). */
  protected readonly rows = computed<LogRow[]>(() => {
    const mode = this.sort();
    const items = this.items();
    if (mode === 'title') return items;

    const rows: LogRow[] = [];
    let current: LogHeader | null = null;

    for (const item of items) {
      const [key, label] = mode === 'severity'
        ? [item.entry.severity as string, this.severityLabel(item.entry.severity)]
        : [this.dayKey(item.last), this.dayLabel(item.last)];

      if (!current || current.key !== key) {
        current = { kind: 'header', key, label, count: 0 };
        rows.push(current);
      }
      current.count += item.count;
      rows.push(item);
    }
    return rows;
  });

  protected readonly totalCount = computed(() => this.notificationService.log().length);
  protected readonly visibleCount = computed(() =>
    this.items().reduce((sum, i) => sum + i.count, 0));
  protected readonly hasActiveFilters = computed(() =>
    this.query().trim() !== ''
    || this.range() !== 'all'
    || this.activeSeverities().size > 0);

  // ── actions ──────────────────────────────────────────────────────────

  protected toggleSeverity(s: NotificationSeverity): void {
    const next = new Set(this.activeSeverities());
    next.has(s) ? next.delete(s) : next.add(s);
    this.activeSeverities.set(next);
  }

  protected resetFilters(): void {
    this.query.set('');
    this.range.set('all');
    this.activeSeverities.set(new Set());
  }

  protected toggleExpanded(key: string): void {
    const next = new Set(this.expanded());
    next.has(key) ? next.delete(key) : next.add(key);
    this.expanded.set(next);
  }

  protected isLong(item: LogItem): boolean {
    const d = item.entry.description ?? '';
    return d.length > 120 || d.includes('\n');
  }

  protected async copy(item: LogItem): Promise<void> {
    try {
      await navigator.clipboard.writeText(JSON.stringify(item.entry, null, 2));
      this.copiedId.set(item.key);
      setTimeout(() => {
        if (this.copiedId() === item.key) this.copiedId.set(null);
      }, 1200);
    } catch (err) {
      console.error('[NotificationLog] copy failed:', err);
    }
  }

  /** Exports the currently filtered view (not collapsed), newest first. */
  protected exportJson(): void {
    const data = [...this.filtered()].sort((a, b) => this.time(b) - this.time(a));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── helpers ──────────────────────────────────────────────────────────

  private time(e: LogEntry): number {
    return new Date(e.timestamp as unknown as string | number | Date).getTime();
  }

  private dayKey(ms: number): string {
    const d = new Date(ms);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  private dayLabel(ms: number): string {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const diffDays = Math.round((startOfToday.getTime() - new Date(ms).setHours(0, 0, 0, 0)) / 86_400_000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return new Date(ms).toLocaleDateString(undefined, {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  }

  severityLabel(s: NotificationSeverity): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  severityStyle(s: NotificationSeverity): string {
    const map: Record<NotificationSeverity, string> = {
      success: '#22c55e',
      info: '#3b82f6',
      warn: '#f59e0b',
      error: '#ef4444',
    };
    return map[s];
  }

  /** Maps our severities onto PrimeNG's button severities. */
  severityButton(s: NotificationSeverity): ButtonSeverity {
    const map: Record<NotificationSeverity, ButtonSeverity> = {
      success: 'success',
      info: 'info',
      warn: 'warn',
      error: 'danger',
    };
    return map[s];
  }
}