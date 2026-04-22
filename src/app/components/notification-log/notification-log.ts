import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { NotificationService } from '../../services/notifications/notification.service';
import { NotificationSeverity } from '../../model/notification.model';

@Component({
  selector: 'app-notification-log',
  imports: [CommonModule, ButtonModule, TagModule],
  templateUrl: './notification-log.html',
})
export class NotificationLog {
  protected notificationService = inject(NotificationService);

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
}