import { FieldConfig } from "../components/property-list/field-list";


export const SETTINGS_PAGE_CONFIGS: Record<string, FieldConfig[]> = {
  'settings-app':
    [
      { kind: 'text', path: 'versionString', label: 'Version' },
      { kind: 'text', path: 'outputPath', label: 'Output Path' },
      {
        kind: 'select',
        path: 'targetPlatform',
        label: 'Target Platform',
        options: [
          { value: 'windows', label: 'Windows' },
          { value: 'linux', label: 'Linux' },
          { value: 'macos', label: 'macOS' },
        ],
      },
      { kind: 'boolean', path: 'includeDebugSymbols', label: 'Include Debug Symbols' },
    ]
  // 'app', 'engine', 'theme' entries go here too, once their real fields
  // are decided — same registry, same lookup mechanism.
};