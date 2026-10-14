import { WindowKind } from "../services/system/windows/window-kind";

export interface WindowTabsState { openTabs: string[]; activeTab: string; }

export interface AppConfig {
    version: string;
    versionTags: string[];
    appTitle: string;

    currentProjectId?: string;
    settings: AppConfigSettings;
    engineProjectPath?: string;
    windowTabs?: Partial<Record<WindowKind, WindowTabsState>>;
  }
  
  export interface AppConfigSettings {
    themeColor: string;
  }