import { Injectable } from '@angular/core';
import { CollectionRepository } from '../../persistence/collection.repository';
import { ProjectRegistryEntry } from '../../../model/project-record.model';

/** Which project folders the app knows about (project-registry.json): id -> directory. */
@Injectable({ providedIn: 'root' })
export class ProjectRegistryRepository extends CollectionRepository<ProjectRegistryEntry> {

  protected readonly key = 'projects';
  
  protected readonly file = 'project-registry.json';
}
