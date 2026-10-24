// model/app-file.model.ts
import { AppConfig } from './app-config.model';
import { NotificationLogEntry, NotificationSeverity } from './notification.model';
import { ProjectRecordTag, ProjectRegistryEntry } from './project-record.model';
import { LibraryEntry } from './library.model';

export interface BackgroundSettings {
  enabled: boolean; speed: number; quality: number; dim: number;
  values: Record<string, Record<string, unknown>>;   // per shader id
}

export interface AppFile extends AppConfig {
  schemaVersion: number;
  seedVersion: number;
  projects: ProjectRegistryEntry[];
  tags: ProjectRecordTag[];
  notifications: {
    maxEntries: number;
    lifetimes: Record<NotificationSeverity, number>;
    log: NotificationLogEntry[];
  };
  git: { repoPath: string };
  editor: {
    engineContentRelative: string;
    console: { maxLines: number; maxHistory: number; flushMs: number };
    fileExplorer: { maxHistory: number };
    textExtensions: string[];
  };
  defaults: {
    project: { resDirectory: string; targetDirectory: string };
    build: { manifest: string; packName: string; toolsIni: string };
  };
  libraries: { catalog: LibraryEntry[] };
  ui: Record<string, any>;   // typed per consumer as each hardcoded config moves over
}