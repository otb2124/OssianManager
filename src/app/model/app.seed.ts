import { AppFile } from './app-file.model';
import { MOCK_LIBRARIES } from '../services/data/libraries/library.mock';

export const APP_SEED: AppFile = {
  schemaVersion: 1,
  seedVersion: 1,

  version: 'v.0.9',
  versionTags: ['dev_start'],
  appTitle: 'OssianManager',
  settings: {
    themeColor: '#8800ff',
    themeFont: 'roboto',
    fontSize: 100,
    backgroundPreset: 'cosmos',
    background: { enabled: true, speed: 1, quality: 0.6, dim: 0.25, values: {} },
  },

  projects: [],
  tags: [],

  notifications: {
    maxEntries: 500,
    lifetimes: { success: 3000, info: 3000, warn: 0, error: 8000 }, // 0 = stays until closed
    log: [],
  },

  git: { repoPath: '../' },

  editor: {
    engineContentRelative: '../Content',
    console: { maxLines: 5000, maxHistory: 200, flushMs: 50 },
    fileExplorer: { maxHistory: 100 },
    textExtensions: [
      'cs', 'json', 'txt', 'md', 'xml', 'ini', 'cfg', 'csv', 'log', 'yml', 'yaml',
      'vert', 'frag', 'glsl', 'hlsl', 'comp', 'shader',
    ],
  },

  defaults: {
    project: { resDirectory: './Content', targetDirectory: './Target' },
    build: { manifest: 'ConfigFiles/Core/resources.json', packName: 'Content.pak', toolsIni: 'Tools.ini' },
  },

  libraries: { catalog: MOCK_LIBRARIES },
  ui: {},
};