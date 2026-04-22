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