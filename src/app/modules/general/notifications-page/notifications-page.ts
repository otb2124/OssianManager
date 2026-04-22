import { Component } from '@angular/core';
import { NotificationLog } from "../../../components/notification-log/notification-log";

@Component({
  selector: 'app-notifications-page',
  imports: [NotificationLog],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.css',
})
export class NotificationsPage {

}
