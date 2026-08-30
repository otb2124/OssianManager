// settings-page.ts
import { Component, inject } from '@angular/core';
import { FieldList, FieldTarget, PropertyPath } from '../../../components/field-list/field-list';
import { FieldsDataService } from '../../../services/ui/fields/fields-data.service';

export class PlainObjectFieldTarget implements FieldTarget {

  private data: Record<string, unknown> = {}

  constructor() {}

  getField(path: PropertyPath): unknown {
    return this.data[path];
  }

  setField(path: PropertyPath, value: unknown): void {
    this.data[path] = value;
  }
}

@Component({
  selector: 'app-settings-page',
  imports: [FieldList],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage {

  protected context = inject(FieldsDataService);

  protected fieldTarget = new PlainObjectFieldTarget();
}