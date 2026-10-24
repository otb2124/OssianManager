import { ProjectRecord } from "./project-record.model";

export interface ProjectConfig {
    projectRecord?: ProjectRecord;
    resDirectory?: string;
    targetDirectory?: string;
    data?: ProjectData;
    build?: ProjectBuildSettings;
    display?: Record<string, any>;
    language?: Record<string, any>;
    libraries?: { installed: string[] };
  }
  export interface ProjectBuildSettings {
    name?: string; version?: string; versionTags?: string[]; company?: string; copyright?: string;
    description?: string; icon?: string; noConsole?: boolean; zip?: boolean; force?: boolean; allowCookErrors?: boolean;
  }
  


export interface ProjectData {
    modules: ProjectModule[],
}

export interface ProjectModule {
    id: string;
    title: string;
    enabled: boolean;
    elements: ProjectElement[]
}

export interface ProjectElement {
    id: string,
    title: string,
}

export const DEFAULT_RES_DIRECTORY = '/res';
export const DEFAULT_TARGET_DIRECTORY = '/target';

/** Config for a project folder that has none yet. */
export function createDefaultProjectConfig(
    defaults: { resDirectory: string; targetDirectory: string },
    projectRecord?: ProjectRecord,
  ): ProjectConfig {
    return { projectRecord, ...defaults, libraries: { installed: [] } };
  }
