import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverModule } from 'primeng/popover';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DialogService } from '../../services/persistence/dialog.service';
import { ButtonModule } from 'primeng/button';

export interface ResourcePickerAction {
  id: string;
  label: string;
  icon?: string;
  extensions?: { name: string; extensions: string[] }[]; // present on actions that should open a filtered file dialog; absent for actions that don't (e.g. a future "Clear")
}

@Component({
  selector: 'app-resource-picker-control',
  standalone: true,
  imports: [CommonModule, PopoverModule, InputTextModule, FloatLabelModule, ButtonModule],
  templateUrl: './resource-picker-control.html',
})
export class ResourcePickerControl {
  @Input() label = '';
  @Input() itemName: string | null = null;
  @Input({ required: true }) actions!: ResourcePickerAction[];

  @Output() actionSelected = new EventEmitter<{ actionId: string; path: string | null }>();

  private readonly dialogService = inject(DialogService);

  onAction(action: ResourcePickerAction): void {
    if (!action.extensions) {
      this.actionSelected.emit({ actionId: action.id, path: null });
      return;
    }

    this.dialogService.pickFile(action.extensions).subscribe(path => {
      this.actionSelected.emit({ actionId: action.id, path });
    });
  }
}