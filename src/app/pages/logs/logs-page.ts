import { Component } from '@angular/core';
import { NotificationLog } from '../../components/logs/notification-log/notification-log';

@Component({
  selector: 'app-logs-page',
  imports: [NotificationLog],
  templateUrl: './logs-page.html',
  styleUrl: './logs-page.css',
})
export class LogsPage {

}
