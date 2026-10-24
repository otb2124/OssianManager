export interface HydratedProjectRecord extends Omit<ProjectRecord, 'tags'> {
    tags: ProjectRecordTag[];
}

export interface ProjectRegistryEntry {
  id: string;
  directoryPath: string;
}

export interface ProjectRecord {
  id: string;
  title: string;
  description?: string;

  tags: string[];

  createdAt: Date;
  updatedAt: Date;
  lastOpenedAt?: Date;

  isFavorite: boolean;
  color?: string;
}

export interface ProjectRecordTag {
    id: string;
    label: string;
    color?: string;
  }

/** Stored record (tag ids, ISO date strings from JSON) -> the in-memory record the UI works with. */
export function hydrateRecord(record: ProjectRecord, tags: ProjectRecordTag[]): HydratedProjectRecord {
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
    lastOpenedAt: record.lastOpenedAt ? new Date(record.lastOpenedAt) : undefined,
    tags: record.tags.map(id => tags.find(t => t.id === id)).filter((t): t is ProjectRecordTag => !!t),
  };
}

/** Inverse of hydrateRecord: the shape written to .ossian.project.json. */
export function serializeRecord(project: HydratedProjectRecord): ProjectRecord {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    color: project.color,
    isFavorite: project.isFavorite,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    lastOpenedAt: project.lastOpenedAt ?? undefined,
    tags: project.tags.map(t => t.id),
  };
}
