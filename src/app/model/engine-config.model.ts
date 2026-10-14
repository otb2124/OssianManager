export interface EngineConfig {
  version: string;
  versionTags?: string[];
  appTitle?: string;
  executablePath?: string;
  mainScene?: string;
  node?: unknown;
}