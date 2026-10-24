import { Injectable, computed, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Notification, NotificationLogEntry, NotificationSeverity } from '../../model/notification.model';
import { AppStoreService } from '../data/app-config/app-store.service';

const FALLBACK_LIFE: Record<NotificationSeverity, number> = { success: 3000, info: 3000, warn: 0, error: 8000 };

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messageService = inject(MessageService);
  private readonly store = inject(AppStoreService);

  readonly log = computed<NotificationLogEntry[]>(() =>
    (this.store.data()?.notifications.log ?? []).map(e => ({ ...e, timestamp: new Date(e.timestamp) })));

  show(notification: Notification): void {
    const life = notification.life ?? this.lifetime(notification.severity);
    this.messageService.add({
      severity: notification.severity,
      summary: notification.title,
      detail: notification.description,
      life,
    });
    this.writeLog({ ...notification, life });
  }

  success(title: string, description?: string, life?: number): void {
    this.show({ severity: 'success', title, description, life });
  }

  info(title: string, description?: string, life?: number): void {
    this.show({ severity: 'info', title, description, life });
  }

  warn(title: string, description?: string, life?: number): void {
    this.show({ severity: 'warn', title, description, life });
  }

  error(title: string, description?: string, life?: number): void {
    this.show({ severity: 'error', title, description, life });
  }

  clearLog(): void {
    void this.store.update(d => ({ ...d, notifications: { ...d.notifications, log: [] } }));
  }

  private writeLog(n: Notification): void {
    const entry: NotificationLogEntry = { ...n, id: crypto.randomUUID(), timestamp: new Date() };
    void this.store.update(d => ({
      ...d,
      notifications: {
        ...d.notifications,
        log: [entry, ...d.notifications.log].slice(0, d.notifications.maxEntries),
      },
    }));
  }

  /** undefined = the toast stays until closed. */
  private lifetime(severity: NotificationSeverity): number | undefined {
    const ms = this.store.data()?.notifications.lifetimes[severity] ?? FALLBACK_LIFE[severity];
    return ms > 0 ? ms : undefined;
  }
}