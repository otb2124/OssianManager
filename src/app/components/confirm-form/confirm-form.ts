import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-confirm-form',
  imports: [ButtonModule],
  templateUrl: './confirm-form.html',
})
export class ConfirmForm {
  readonly message = input<string>('Are you sure?');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}