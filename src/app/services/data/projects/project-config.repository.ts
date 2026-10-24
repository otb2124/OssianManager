import { Injectable, inject } from '@angular/core';
import { catchError, from, map, Observable, switchMap } from 'rxjs';
import { PersistenceService } from '../../persistence/persistence.service';
import { AppStoreService } from '../app-config/app-store.service';
import { ProjectRecord } from '../../../model/project-record.model';
import { ProjectConfig, createDefaultProjectConfig } from '../../../model/project-config.model';

/** The `.ossian.project.json` inside each project folder. */
@Injectable({ providedIn: 'root' })
export class ProjectConfigRepository {

  private readonly persistence = inject(PersistenceService);
  private readonly store = inject(AppStoreService);

  private readonly fileName = '.ossian.project.json';

  read(directoryPath: string): Observable<ProjectConfig> {
    return this.persistence.readAbsolute<ProjectConfig>(this.pathOf(directoryPath));
  }

  write(directoryPath: string, config: ProjectConfig): Observable<void> {
    return this.persistence.writeAbsolute(this.pathOf(directoryPath), config);
  }

  /** The stored config, or a default one when the file is missing or unreadable. Nothing is written. */
  readOrDefault(directoryPath: string, record?: ProjectRecord): Observable<ProjectConfig> {
    return this.read(directoryPath).pipe(
      catchError(() => this.newConfig(record)),
    );
  }

  /** The stored config; when the file is missing or unreadable, a default one is created on disk and returned. */
  readOrCreate(directoryPath: string, record: ProjectRecord): Observable<ProjectConfig> {
    return this.read(directoryPath).pipe(
      catchError(() => this.newConfig(record).pipe(
        switchMap(config => this.write(directoryPath, config).pipe(map(() => config))),
      )),
    );
  }

  private newConfig(record?: ProjectRecord): Observable<ProjectConfig> {
    return from(this.store.load()).pipe(
      map(app => createDefaultProjectConfig(app.defaults.project, record)),
    );
  }

  private pathOf(directoryPath: string): string {
    return `${directoryPath}/${this.fileName}`;
  }
}