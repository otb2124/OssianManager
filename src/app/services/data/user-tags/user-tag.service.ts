import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PersistenceService } from '../../persistence/persistence.service';
import { ProjectRecordTag } from '../../../model/project-record.model';

@Injectable({ providedIn: 'root' })
export class UserTagService {

  private persistence = inject(PersistenceService);
  private readonly file = 'user-tags.json';

  getAll(): Observable<ProjectRecordTag[]> {
    return this.persistence.read<ProjectRecordTag[]>(this.file);
  }

  getById(id: string): Observable<ProjectRecordTag | undefined> {
    return this.getAll().pipe(map(tags => tags.find(t => t.id === id)));
  }

  getByLabel(label: string): Observable<ProjectRecordTag | undefined> {
    return this.getAll().pipe(map(tags => tags.find(t => t.label === label)));
  }

  save(tag: ProjectRecordTag): Observable<void> {
    return this.getAll().pipe(
      map(tags => {
        const index = tags.findIndex(t => t.id === tag.id);
        if (index !== -1) tags[index] = tag;
        else tags.push(tag);
        return tags;
      }),
      map(tags => this.persistence.write(this.file, tags)),
      map(() => void 0)
    );
  }

  delete(id: string): Observable<void> {
    return this.getAll().pipe(
      map(tags => tags.filter(t => t.id !== id)),
      map(tags => this.persistence.write(this.file, tags)),
      map(() => void 0)
    );
  }
}