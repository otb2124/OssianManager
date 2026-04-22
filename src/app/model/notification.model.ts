export type NotificationSeverity = 'success' | 'info' | 'warn' | 'error';

export interface Notification {
  severity: NotificationSeverity;
  title: string;
  description?: string;
  life?: number;
}

export interface NotificationLogEntry extends Notification {
  id: string;
  timestamp: Date;
}