import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProjectUiService {
  readonly scrollToProjectId = signal<string | null>(null);

  scrollTo(id: string): void {
    this.scrollToProjectId.set(id);
  }

  clear(): void {
    this.scrollToProjectId.set(null);
  }
}