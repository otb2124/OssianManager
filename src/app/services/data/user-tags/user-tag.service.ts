import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CollectionRepository } from '../../persistence/collection.repository';
import { ProjectRecordTag } from '../../../model/project-record.model';

/** The user's tag catalog (user-tags.json). getAll / getById / save / delete come from CollectionRepository. */
@Injectable({ providedIn: 'root' })
export class UserTagService extends CollectionRepository<ProjectRecordTag> {

  protected readonly key = 'tags';

  protected readonly file = 'user-tags.json';

  getByLabel(label: string): Observable<ProjectRecordTag | undefined> {
    return this.getAll().pipe(map(tags => tags.find(t => t.label === label)));
  }
}
