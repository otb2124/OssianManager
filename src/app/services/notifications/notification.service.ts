import { Injectable, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { PersistenceService } from '../persistence/persistence.service';
import { NotificationLogEntry, Notification } from '../../model/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private messageService = inject(MessageService);
  private persistence = inject(PersistenceService);

  private readonly logFile = 'notification-log.json';

  private readonly _log = signal<NotificationLogEntry[]>([]);
  readonly log = this._log.asReadonly();

  constructor() {
    this.persistence.read<NotificationLogEntry[]>(this.logFile).subscribe({
      next: entries => this._log.set(entries.map(e => ({ ...e, timestamp: new Date(e.timestamp) }))),
      error: () => this._log.set([])
    });
  }

  show(notification: Notification): void {
    this.messageService.add({
      severity: notification.severity,
      summary: notification.title,
      detail: notification.description,
      life: notification.life,
    });
    this.writeLog(notification);
  }

  success(title: string, description?: string, life = 3000): void {
    this.show({ severity: 'success', title, description, life });
  }

  info(title: string, description?: string, life = 3000): void {
    this.show({ severity: 'info', title, description, life });
  }

  warn(title: string, description?: string): void {
    this.show({ severity: 'warn', title, description });
  }

  error(title: string, description?: string, life?: number): void {
    this.show({ severity: 'error', title, description, life: life ?? 8000 });
  }

  clearLog(): void {
    this._log.set([]);
    this.persistence.write(this.logFile, []).subscribe();
  }

  private writeLog(notification: Notification): void {
    const entry: NotificationLogEntry = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    const updated = [entry, ...this._log()];
    this._log.set(updated);
    this.persistence.write(this.logFile, updated).subscribe();
  }
}