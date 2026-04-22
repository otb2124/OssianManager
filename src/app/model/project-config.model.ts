import { ProjectRecord } from "./project-record.model";

export interface ProjectConfig {
    projectRecord?: ProjectRecord;
    resDirectory?: string;
    targetDirectory?: string;
}