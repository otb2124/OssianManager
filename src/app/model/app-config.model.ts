export interface AppConfig {
    version: string;
    versionTags: string[];
    appTitle: string;

    currentProjectId?: string;
    settings: AppConfigSettings;
    engineProjectPath?: string;
    openTabs?: string[];
    activeTab?: string;
  }
  
  export interface AppConfigSettings {
    themeColor: string;
  }