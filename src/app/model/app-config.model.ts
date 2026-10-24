import { BackgroundSettings } from "./app-file.model";
import { WindowKind } from "./window-kind.model";

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
    themeFont?: string;
    fontSize?: number;          // percent
    backgroundPreset?: string;  // ShaderDef id
    background?: BackgroundSettings;
}
