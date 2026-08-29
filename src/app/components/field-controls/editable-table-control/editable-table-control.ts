import { Component, Input, Output, EventEmitter, forwardRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FieldList, FieldConfig } from '../../field-list/field-list';

export type TableRowData = Record<string, any>;

@Component({
  selector: 'app-editable-table-control',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DragDropModule,
    forwardRef(() => FieldList)
  ],
  templateUrl: './editable-table-control.html',
  styleUrls: ['./editable-table-control.css']
})
export class EditableTableControl {
  @Input() label = '';
  @Input() columns: FieldConfig[] = [];
  @Input() value: TableRowData[] = [];
  @Input() allowAdd = true;
  @Input() allowDelete = true;
  @Input() allowReorder = false;
  @Input() readonly = false;
  @Input() align?: 'left' | 'center' | 'right' = 'left';

  @Output() valueChange = new EventEmitter<TableRowData[]>();

  constructor(private cdr: ChangeDetectorRef) {}

  onDrop(event: CdkDragDrop<TableRowData[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    // Create a shallow copy of array
    const updated = [...(this.value || [])];
    
    // Swap item positions in array
    moveItemInArray(updated, event.previousIndex, event.currentIndex);
    
    // Re-assign new array instance & notify
    this.value = [...updated];
    this.valueChange.emit(this.value);
    
    // Force view check so Angular immediately redraws the updated DOM indices
    this.cdr.markForCheck();
  }

  addRow(): void {
    const newRow: TableRowData = {};
    for (const col of this.columns) {
      newRow[col.path] = null;
    }
    this.notifyChange([...(this.value || []), newRow]);
  }

  deleteRow(index: number): void {
    const updated = (this.value || []).filter((_, i) => i !== index);
    this.notifyChange(updated);
  }

  onRowChange(): void {
    this.notifyChange(this.value);
  }

  private notifyChange(newValue: TableRowData[]): void {
    this.value = [...newValue];
    this.valueChange.emit(this.value);
    this.cdr.markForCheck();
  }
}