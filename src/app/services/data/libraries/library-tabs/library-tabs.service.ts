import { Injectable, signal } from '@angular/core';

export interface LibraryOpenRequest { id: string; nonce: number; }

/** Anyone (list rows, dependency links) can ask for a library tab; LibrariesPage consumes the request. */
@Injectable({ providedIn: 'root' })
export class LibraryTabsService {
  private nonce = 0;
  private readonly _request = signal<LibraryOpenRequest | null>(null);
  readonly request = this._request.asReadonly();

  open(id: string): void {
    this._request.set({ id, nonce: ++this.nonce });
  }

  consume(): void {
    this._request.set(null);
  }
}