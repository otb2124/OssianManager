import { ProjectRecord } from "./project-record.model";

export interface ProjectConfig {
    projectRecord?: ProjectRecord;
    resDirectory?: string;
    targetDirectory?: string;
    data?: ProjectData;
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