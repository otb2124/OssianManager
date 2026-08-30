// file-explorer.service.ts
import { Injectable, inject, signal, effect } from '@angular/core';
import { PersistenceService, FsEntry } from '../persistence/persistence.service';
import { ProjectService } from '../data/projects/project.service';

@Injectable({ providedIn: 'root' })
export class FileExplorerService {
  private readonly persistence = inject(PersistenceService);
  private readonly projectService = inject(ProjectService);

  private readonly _rootPath = signal<string | null>(null);
  private readonly _selectedEntry = signal<FsEntry | null>(null);

  readonly rootPath = this._rootPath.asReadonly();
  readonly selectedEntry = this._selectedEntry.asReadonly();

  constructor() {
    effect(() => {
      const resDir = this.projectService.resDirectory();
      if (resDir) this._rootPath.set(resDir);
    }, { allowSignalWrites: true });
  }

  setRoot(path: string): void {
    this._rootPath.set(path);
    this._selectedEntry.set(null); // selection from the old root no longer makes sense
  }

  select(entry: FsEntry | null): void {
    this._selectedEntry.set(entry);
  }

  isSelected(entry: FsEntry): boolean {
    return this._selectedEntry()?.path === entry.path;
  }

  listDirectory(path: string) {
    return this.persistence.listDirectory(path);
  }

  rename(oldPath: string, newName: string) {
    return this.persistence.rename(oldPath, newName);
  }
}