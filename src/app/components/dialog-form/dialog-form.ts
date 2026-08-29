import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FieldList } from '../field-list/field-list';
import { DialogFormService } from '../../services/dialog-form/dialog-form.service';

@Component({
  selector: 'app-dialog-form',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, FieldList],
  templateUrl: './dialog-form.html'
})
export class DialogFormHostComponent {
  protected dialogService = inject(DialogFormService);
  private cdr = inject(ChangeDetectorRef);

  onModelUpdate(updatedModel: Record<string, any>): void {
    this.dialogService.currentModel.set(updatedModel);
  }

  onSubmit(): void {
    this.dialogService.submit(this.dialogService.currentModel());
    this.cdr.detectChanges(); // Force UI update immediately to close backdrop
  }

  onCancel(): void {
    this.dialogService.cancel();
    this.cdr.detectChanges(); // Force UI update immediately
  }

  onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.dialogService.cancel();
      this.cdr.detectChanges();
    }
  }
}