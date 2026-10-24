import { Injectable, signal } from '@angular/core';

/** Which library is currently shown in the libraries page. */
@Injectable({ providedIn: 'root' })
export class LibrarySelectionService {
  private readonly _selectedId = signal<string | null>(null);
  readonly selectedId = this._selectedId.asReadonly();

  select(id: string | null): void {
    this._selectedId.set(id);
  }
}