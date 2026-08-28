import { FieldConfig } from "../components/property-list/field-list";


export const SETTINGS_PAGE_CONFIGS: Record<string, FieldConfig[]> = {
    'settings-app':
    [
      { kind: 'text', path: 'versionString', label: 'Version' },
      { kind: 'tags', path: 'versionTags', label: 'Version Tags' },
    ],
    'settings-engine':
    [
      { kind: 'text', path: 'enginePath', label: 'Engine Path' },
      { kind: 'text', path: 'engineVersionString', label: 'Version' },
      { kind: 'tags', path: 'engineVersionTags', label: 'Version Tags' },
    ],
    'settings-theme':
    [
      {
        kind: 'select',
        path: 'themeTemplateId',
        label: 'Template (TODO:image-select control)',
        options: [
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
          { value: 'blue', label: 'Blue' },
        ],
      },
      { kind: 'color', path: 'themeColor', label: 'Theme Color' },
      {
        kind: 'select',
        path: 'themeFont',
        label: 'Font',
        options: [
          { value: 'roboto', label: 'Roboto' },
          { value: 'robotoBold', label: 'Roboto Bold' },
          { value: 'otherSystemFonts', label: 'Other System Font...' },
        ],
      },
      { kind: 'number', path: 'fontSize', label: 'Font Size', suffix: '%' },
    ],
    'build-details':
    [
      { kind: 'text', path: 'versionString', label: 'Version' },
      { kind: 'tags', path: 'versionTags', label: 'Version Tags' },
    ],
    'build-tree':
    [
      { kind: 'text', path: 'treeNode', label: 'Tree Node (TODO: add node-control)' },
    ],
    'build-startup':
    [
      {
        kind: 'resource-picker',
        path: 'entryScene',
        label: 'Entry Scene',
        actions: [
          { id: 'load', label: 'Load', icon: 'pi pi-folder-open', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
          { id: 'quick_load', label: 'Quick Load', icon: 'pi pi-bolt', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
        ]
      },
      { kind: 'number', path: 'globalsMultiline', label: 'Globals (TODO: multiline-control)' },
    ],
    'display-window':
    [
      { kind: 'vector', path: 'windowResolutionVector2', label: 'Window Resolution', axisLabels: ['Width', 'Height'], suffix: 'px' },
      {
        kind: 'select',
        path: 'targetPlatform',
        label: 'Window Mode',
        options: [
          { value: 'windowed', label: 'Windowed' },
          { value: 'fullscreen', label: 'Fullscreen' },
          { value: 'borderless', label: 'Borderless' },
        ],
      },
      { kind: 'vector', path: 'windowSizeVector2', label: 'Window Size', axisLabels: ['Width', 'Height'], suffix: 'px'},
      { kind: 'vector', path: 'windowPositionVector2', label: 'Window Position', axisLabels: ['X', 'Y'], suffix: 'px' },
    ],
    'display-accessibility':
    [
      { kind: 'number', path: 'updatesPerSecond', label: 'Updates Per Second', suffix: ' updates'},
      { kind: 'number', path: 'updatesPerSecond', label: 'Frames Per Second', suffix: ' frames' },
    ],
    'display-rendering':
    [
      { kind: 'color', path: 'clearColor', label: 'Clear Color' },
    ],
    'display-cursor':
    [
      { kind: 'boolean', path: 'cursorVisible', label: 'Visible' },
      { kind: 'boolean', path: 'cursorDisabled', label: 'Disabled' },
      { kind: 'text', path: 'cursorImageMultiline', label: 'Cursor Image (TODO: multiline-control)' },
    ],
    'display-physics':
    [
      {
        kind: 'select',
        path: 'physicsEngine',
        label: 'Physics Engine',
        options: [
          { value: 'jitter2', label: 'Jitter2' },
          { value: 'physx', label: 'PhysX' },
          { value: 'none', label: 'None' },
        ],
      },
      { kind: 'number', path: 'physicsTicksPerSecond', label: 'Ticks Per Second', suffix: ' ticks' },
      { kind: 'number', path: 'physicsMaxStepsPerFrame', label: 'Max Steps Per Frame', suffix: ' steps'},
      {
        kind: 'number',
        path: 'gravity',
        label: 'Gravity',
        step: 0.1,
        suffix: ' m/s²',
        min: 0,
      },
      { kind: 'vector', path: 'gravityVector2', label: 'Gravity Vector', axisLabels: ['X', 'Y'] },
    ],
    'input-keys':
    [
      { kind: 'text', path: 'inputKeysMultiline', label: 'Input Keys (TODO: multiline-control)' },
    ],
    'input-axis':
    [
      { kind: 'text', path: 'inputAxisMultiline', label: 'Input Axis (TODO: multiline-control)' },
    ],
    //
    'events-actions':
    [
      { kind: 'text', path: 'actionsMultiline', label: 'Actions (TODO: multiline-control)' },
    ],
    'events-state-machines':
    [
      { kind: 'text', path: 'statemachinesStateMachines', label: 'State Machines (TODO: statemachines-control)' },
    ],
    'events-pronouns':
    [
      { kind: 'text', path: 'pronounsMultiline', label: 'Pronouns (TODO: multiline-control)' },
    ],
};