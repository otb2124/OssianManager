// file-explorer.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { PersistenceService, FsEntry } from '../persistence/persistence.service';
import { ProjectService } from '../projects/project.service';

@Injectable({ providedIn: 'root' })
export class FileExplorerService {
  private readonly persistence = inject(PersistenceService);
  private readonly projectService = inject(ProjectService);

  private readonly _rootPath = signal<string | null>(null);
  readonly rootPath = this._rootPath.asReadonly();

  constructor() {
    // default root: current project's resDirectory, once one exists
    const resDir = this.projectService.resDirectory();
    if (resDir) this._rootPath.set(resDir);
  }

  setRoot(path: string): void {
    this._rootPath.set(path);
  }

  listDirectory(path: string) {
    return this.persistence.listDirectory(path);
  }
}