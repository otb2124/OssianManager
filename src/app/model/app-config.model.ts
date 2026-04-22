export interface AppConfig {
    version: string;
    versionTags: string[];
    currentProjectId?: string;
    settings: AppConfigSettings;
    engineProjectPath?: string;
    openTabs?: string[];
    activeTab?: string;
  }
  
  export interface AppConfigSettings {
    themeColor: string;
  }