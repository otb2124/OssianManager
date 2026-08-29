import { FieldConfig } from "../components/field-list/field-list";


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
      { kind: 'image-select', 
        path: 'themeTemplateId', 
        label: 'Template',
        size: 'xl',
        options: 
        [ 
          { value: 'black', label: 'Black', imageUrl: 'https://www.color-hex.com/palettes/1405.png' },
          { value: 'soft-black', label: 'Soft Black', imageUrl: 'https://www.color-hex.com/palettes/46586.png' },
          { value: 'bleeding-black', label: 'Bleeding Black', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEVKBBVtIxJ17uCUY1jxvIAqij6t6LYemQcYVN0N06KwcTyRWW7xhlRTU&s=10' },
          { value: 'makara', label: 'Makara', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBwSbLrt5roCZ3BjkDZnILjpReHMqlhyIhxK6mehRwdQ&s=10' },
          { value: 'coffee-black', label: 'Coffee Black', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWYGurD-1J-rffnx0GVpLnMsTt8XlK8pNXbPEkyzueCw&s=10' },
          { value: 'pink-black', label: 'Pink Black', imageUrl: 'https://images.media.io/colors/midnight-velvet-black-color-palette.jpg' },
        ] 
      },
      { kind: 'color', path: 'themeColor', label: 'Theme Color', allowAlpha: false },
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
      {
        kind: 'editable-table',
        path: 'transitionsTable',
        label: 'Transitions',
        allowAdd: true,
        allowDelete: true,
        allowReorder: true,
        columns: [
          {
            kind: 'list',
            path: 'globalsListStringPath',
            label: 'Globals',
            itemConfig: {
              kind: 'resource-picker',
              path: '',
              label: '',
              actions: [
                { id: 'load', label: 'Load', icon: 'pi pi-folder-open', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
                { id: 'quick_load', label: 'Quick Load', icon: 'pi pi-bolt', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
              ]
            }
          },
          {
            kind: 'boolean',
            path: 'globalsEnabled',
            label: 'Enable',
          }
        ],
      }
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
      {
        kind: 'editable-table',
        path: 'cursorTable',
        label: 'Pronouns',
        allowAdd: true,
        allowDelete: true,
        allowReorder: true,
        columns: [
          {
            kind: 'select',
            path: 'cursorType',
            label: 'Type',
            options: [
              { value: 'default', label: 'default' },
              { value: 'context', label: 'context' },
              { value: 'crosshair', label: 'Crosshair' },
            ],
          },
          {
            kind: 'resource-picker',
            path: 'cursorImagePath',
            label: 'Image',
            actions:
            [
              { id: 'load', label: 'Load', icon: 'pi pi-folder-open', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
              { id: 'quick_load', label: 'Quick Load', icon: 'pi pi-bolt', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
            ]
          },
          { kind: 'number', path: 'cursorSize', label: 'Size', suffix: ' px' },
        ],
      }
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
      {
        kind: 'editable-table',
        path: 'inputKeysTable',
        label: 'Input Keys',
        allowAdd: true,
        allowDelete: true,
        allowReorder: true,
        columns: [
          {
            kind: 'text',
            path: 'inputKeyId',
            label: 'Id',
          },
          {
            kind: 'select',
            path: 'inputKeyType',
            label: 'Type',
            options: [
              { label: 'Down', value: 'down' },
              { label: 'Release', value: 'release' },
              { label: 'Click', value: 'click' },
            ],
          },
          {
            kind: 'list',
            path: 'inputKeysListString',
            label: 'Keys',
            itemConfig: {
              kind: 'select',
              path: '',
              label: '',
              options: [
                { label: 'Keys.W', value: 'down' },
                { label: 'Keys.Arrow', value: 'release' },
                { label: 'Keys.Enter', value: 'click' },
              ],
            }
          },
          {
            kind: 'boolean',
            path: 'globalsEnabled',
            label: 'Enable',
          }
        ],
      }
    ],
    'input-axis':
    [
      {
        kind: 'editable-table',
        path: 'inputAxisTable',
        label: 'Input Axis',
        allowAdd: true,
        allowDelete: true,
        allowReorder: true,
        columns: [
          {
            kind: 'text',
            path: 'inputAxisId',
            label: 'Id',
          },
          {
            kind: 'select',
            path: 'inputAxisType',
            label: 'Source',
            options: [
              { label: 'Mouse Delta X', value: 'down' },
              { label: 'Mouse Delta Y', value: 'release' },
              { label: 'Mouse Delta Scroll', value: 'click' },
            ],
          },
          {
            kind: 'number',
            path: 'sensitivity',
            label: 'Sensitivity',
            step: 0.01,
            min: 0,
            max: 1,
          },
          {
            kind: 'boolean',
            path: 'axisInverted',
            label: 'Invert',
          },
          {
            kind: 'boolean',
            path: 'globalsEnabled',
            label: 'Enable',
          }
        ],
      }
    ],
    //
    'events-actions':
    [
      {
        kind: 'editable-table',
        path: 'actionsTable',
        label: 'Actions',
        allowAdd: true,
        allowDelete: true,
        allowReorder: true,
        columns: [
          {
            kind: 'text',
            path: 'name',
            label: 'Action Name',
            maxlength: 30,
          },
          {
            kind: 'number',
            path: 'priority',
            label: 'Priority',
            step: 1,
            min: 0,
            max: 10,
          },
          {
            kind: 'select',
            path: 'triggerType',
            label: 'Trigger',
            options: [
              { label: 'On Click', value: 'click' },
              { label: 'On Hover', value: 'hover' },
              { label: 'On Load', value: 'load' },
            ],
          },
          {
            kind: 'list',
            path: 'argsListString',
            label: 'Args',
            itemConfig: {
              kind: 'text',
              path: '',
              label: '',
            }
          },
          {
            kind: 'color',
            path: 'highlightColor',
            label: 'Highlight',
            allowAlpha: false,
          },
          {
            kind: 'boolean',
            path: 'enabled',
            label: 'Active',
          },
        ],
      }
    ],
    'events-conditions':
    [
      {
        kind: 'editable-table',
        path: 'actionsTable',
        label: 'Conditions',
        allowAdd: true,
        allowDelete: true,
        allowReorder: true,
        columns: [
          {
            kind: 'text',
            path: 'name',
            label: 'Action Name',
            maxlength: 30,
          },
          {
            kind: 'number',
            path: 'priority',
            label: 'Priority',
            step: 1,
            min: 0,
            max: 10,
          },
          {
            kind: 'select',
            path: 'triggerType',
            label: 'Trigger',
            options: [
              { label: 'On Click', value: 'click' },
              { label: 'On Hover', value: 'hover' },
              { label: 'On Load', value: 'load' },
            ],
          },
          {
            kind: 'list',
            path: 'argsListString',
            label: 'Args',
            itemConfig: {
              kind: 'text',
              path: '',
              label: '',
            }
          },
          {
            kind: 'color',
            path: 'highlightColor',
            label: 'Highlight',
            allowAlpha: false,
          },
          {
            kind: 'boolean',
            path: 'enabled',
            label: 'Active',
          },
        ],
      }
    ],
    'events-state-machines':
    [
      {
        kind: 'editable-table',
        path: 'statesTable',
        label: 'States',
        allowAdd: true,
        allowDelete: true,
        allowReorder: true,
        columns: [
          {
            kind: 'text',
            path: 'stateId',
            label: 'Id',
          },
          {
            kind: 'list',
            path: 'onEnterActions',
            label: 'OnEnter',
            itemConfig: {
              kind: 'select',
              path: '',
              label: '',
              options: [
                { label: 'action.dosmth', value: 'click' },
                { label: 'action.anim1', value: 'hover' },
                { label: 'action.exit', value: 'load' },
              ],
            }
          },
          {
            kind: 'list',
            path: 'onUpdateActions',
            label: 'OnUpdate',
            itemConfig: {
              kind: 'select',
              path: '',
              label: '',
              options: [
                { label: 'action.dosmth', value: 'click' },
                { label: 'action.anim1', value: 'hover' },
                { label: 'action.exit', value: 'load' },
              ],
            }
          },
          {
            kind: 'list',
            path: 'onExitActions',
            label: 'OnExit',
            itemConfig: {
              kind: 'select',
              path: '',
              label: '',
              options: [
                { label: 'action.dosmth', value: 'click' },
                { label: 'action.anim1', value: 'hover' },
                { label: 'action.exit', value: 'load' },
              ],
            }
          },
        ],
      },
      {
        kind: 'select',
        path: 'initialState',
        label: 'Initial State',
        options: [
          { label: 'Idle', value: 'click' },
          { label: 'Running', value: 'hover' },
          { label: 'Walking', value: 'load' },
        ],
      },
      {
        kind: 'editable-table',
        path: 'transitionsTable',
        label: 'Transitions',
        allowAdd: true,
        allowDelete: true,
        allowReorder: true,
        columns: [
          {
            kind: 'select',
            path: 'stateFrom',
            label: 'From',
            options: [
              { label: 'Idle', value: 'click' },
              { label: 'Running', value: 'hover' },
              { label: 'Walking', value: 'load' },
            ],
          },
          {
            kind: 'select',
            path: 'stateTo',
            label: 'To',
            options: [
              { label: 'Idle', value: 'click' },
              { label: 'Running', value: 'hover' },
              { label: 'Walking', value: 'load' },
            ],
          },
          {
            kind: 'list',
            path: 'conditions',
            label: 'Conditions',
            itemConfig: {
              kind: 'select',
              path: '',
              label: '',
              options: [
                { label: 'condition.grounded', value: 'click' },
                { label: 'condition.iq100', value: 'hover' },
                { label: 'condition.noInput', value: 'load' },
              ],
            }
          },
        ],
      }
    ],
    'events-pronouns':
    [
      {
        kind: 'editable-table',
        path: 'pronounsTable',
        label: 'Pronouns',
        allowAdd: true,
        allowDelete: true,
        allowReorder: true,
        columns: [
          {
            kind: 'text',
            path: 'pronounId',
            label: 'Id',
            maxlength: 30,
          },
          {
            kind: 'text',
            path: 'pronounTarget',
            label: 'Target',
            maxlength: 30,
          },
          {
            kind: 'list',
            path: 'pronounsList',
            label: 'Pronouns',
            itemConfig: {
              kind: 'text',
              path: '',
              label: '',
            }
          },
        ],
      }
    ],
};