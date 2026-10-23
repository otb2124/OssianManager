import { Component, input, output, contentChild, TemplateRef } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-dialog-wrapper',
  imports: [DialogModule],
  templateUrl: './dialog-wrapper.html',
})
export class DialogWrapper {
  readonly header = input<string>('');
  readonly visible = input<boolean>(false);
  readonly visibleChange = output<boolean>();

  close(): void {
    this.visibleChange.emit(false);
  }
}