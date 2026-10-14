// file-explorer.service.ts
import { Injectable, inject, signal, effect } from '@angular/core';
import { PersistenceService, FsEntry } from '../persistence/persistence.service';
import { ProjectService } from '../data/projects/project.service';
import { ResourceEntry } from '../../model/resource.model';

/** What the file inspector is currently showing. */
export type InspectTarget =
  | { kind: 'fs'; entry: FsEntry }
  | { kind: 'resource'; resource: ResourceEntry };

@Injectable({ providedIn: 'root' })
export class FileExplorerService {
  private readonly persistence = inject(PersistenceService);
  private readonly projectService = inject(ProjectService);

  private readonly _rootPath = signal<string | null>(null);
  private readonly _selectedEntry = signal<FsEntry | null>(null);
  private readonly _selectedResource = signal<ResourceEntry | null>(null);
  private readonly _inspected = signal<InspectTarget | null>(null);

  readonly rootPath = this._rootPath.asReadonly();
  /** Last selected file. The script editor follows this, so selecting a resource does not blank it. */
  readonly selectedEntry = this._selectedEntry.asReadonly();
  readonly selectedResource = this._selectedResource.asReadonly();
  /** Most recent selection of either kind, for the inspector. */
  readonly inspected = this._inspected.asReadonly();

  constructor() {
    effect(() => {
      const resDir = this.projectService.resDirectory();
      if (resDir) this._rootPath.set(resDir);
    }, { allowSignalWrites: true });
  }

  setRoot(path: string): void {
    this._rootPath.set(path);
    this._selectedEntry.set(null); // selection from the old root no longer makes sense
    if (this._inspected()?.kind === 'fs') this._inspected.set(null);
  }

  select(entry: FsEntry | null): void {
    this._selectedEntry.set(entry);
    if (entry) this._inspected.set({ kind: 'fs', entry });
    else if (this._inspected()?.kind === 'fs') this._inspected.set(null);
  }

  selectResource(resource: ResourceEntry | null): void {
    this._selectedResource.set(resource);
    this._inspected.set(resource ? { kind: 'resource', resource } : null);
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