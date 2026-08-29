import { FieldConfig } from "../components/field-list/field-list";


export const NODE_CONTROL_FIELDS_CONFIG: FieldConfig[] = [
  {
    kind: 'accordion',
    path: 'properties',
    label: 'Properties',
    allowAdd: true,
    allowDelete: true,
    config: {
      templateTreeOptions: [
        {
          key: 'node',
          label: 'Node',
        },
        {
          key: 'cat-transform',
          label: 'Transforms',
          icon: 'pi pi-folder',
          selectable: false,
          children: [
            { key: 'transform', label: 'Transform', icon: 'pi pi-arrows-alt' }
          ]
        },
        {
          key: 'cat-materials',
          label: 'Materials',
          icon: 'pi pi-folder',
          selectable: false,
          children: [
            { key: 'textureMaterial', label: 'Texture Material', icon: 'pi pi-image' },
            { key: 'cubemapMaterial', label: 'Cubemap Material', icon: 'pi pi-image' },
            { key: 'textMaterial', label: 'Text Material', icon: 'pi pi-image' },
            { key: 'wireframeMaterial', label: 'Wireframe Material', icon: 'pi pi-image' }
          ]
        },
        {
          key: 'cat-physics',
          label: 'Physics',
          icon: 'pi pi-folder',
          selectable: false,
          children: [
            { key: 'rigidPhysics', label: 'Rigid Physics', icon: 'pi pi-bolt' },
            { key: 'staticPhysics', label: 'Static Physics', icon: 'pi pi-bolt' },
            { key: 'collider', label: 'Collider', icon: 'pi pi-globe' }
          ]
        },
        {
          key: 'cat-lighting',
          label: 'Lighting',
          icon: 'pi pi-folder',
          selectable: false,
          children: [
            { key: 'pointEmission', label: 'Point Emission', icon: 'pi pi-sun' },
            { key: 'spotEmission', label: 'Spot Emission', icon: 'pi pi-sun' },
            { key: 'sunEmission', label: 'Sun Emission', icon: 'pi pi-sun' }
          ]
        },
        {
          key: 'cat-cameras',
          label: 'Cameras',
          icon: 'pi pi-folder',
          selectable: false,
          children: [
            { key: 'camera', label: 'Camera', icon: 'pi pi-camera' },
            { key: 'orbitalCamera', label: 'Orbital Camera', icon: 'pi pi-camera' }
          ]
        },
        {
          key: 'cat-logic',
          label: 'Logic & Scripts',
          icon: 'pi pi-folder',
          selectable: false,
          children: [
            { key: 'stateMachine', label: 'State Machine', icon: 'pi pi-sitemap' },
            { key: 'script', label: 'Script', icon: 'pi pi-code' },
            { key: 'sound', label: 'Sound', icon: 'pi pi-volume-up' }
          ]
        }
      ],
      templates: {
        node: {
          header: 'Node',
          fields: [
            { kind: 'text', path: 'name', label: 'Name' },
            { kind: 'text', path: 'id', label: 'Id' },
            { kind: 'boolean', path: 'enable', label: 'Enable' },
            { kind: 'boolean', path: 'enableStart', label: 'Enable Start' },
            { kind: 'boolean', path: 'enableUpdate', label: 'Enable Update' },
            { kind: 'boolean', path: 'enableRender', label: 'Enable Render' },
          ]
        },
        transform: {
          header: 'Transform',
          icon: 'pi pi-arrows-alt',
          fields: [
            { kind: 'vector', path: 'position', label: 'Position' },
            { kind: 'vector', path: 'rotation', label: 'Rotation' },
            { kind: 'vector', path: 'scaling', label: 'Scale' },
            { kind: 'select', path: 'renderSpace', label: 'Render Space',
              options:
              [
                { value: 'myworld0', label: 'myworld0', icon: 'pi pi-folder-open' },
                { value: '3D_object', label: '3D_object', icon: 'pi pi-bolt' },
              ]
             },
            { kind: 'select', path: 'anchor3D', label: 'Anchor3D',
              options:
              [
                { value: 'myworld0', label: 'myworld0', icon: 'pi pi-folder-open' },
                { value: '3D_object', label: '3D_object', icon: 'pi pi-bolt' },
              ]
             },
            { kind: 'select', path: 'propagationLock', label: 'Propagation Lock',
              options:
              [
                { value: 'myworld0', label: 'myworld0', icon: 'pi pi-folder-open' },
                { value: '3D_object', label: '3D_object', icon: 'pi pi-bolt' },
              ]
             },
          ]
        },
        textureMaterial: {
          header: 'Texture Material',
          icon: 'pi pi-image',
          fields: [
            { kind: 'resource-picker', path: 'textureFile', label: 'Texture File',
              actions: 
              [
                { id: 'load', label: 'Load', icon: 'pi pi-folder-open', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
                { id: 'quick_load', label: 'Quick Load', icon: 'pi pi-bolt', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
              ]
             },
            { kind: 'resource-picker', path: 'shaderFile', label: 'Shader File',
              actions: 
              [
                { id: 'load', label: 'Load', icon: 'pi pi-folder-open', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
                { id: 'quick_load', label: 'Quick Load', icon: 'pi pi-bolt', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
              ]
             },
          ]
        },
        cubemapMaterial: {
          header: 'Cubemap Material',
          icon: 'pi pi-image',
          fields: [
            { kind: 'resource-picker', path: 'cubemapFile', label: 'Cubemap File',
              actions: 
              [
                { id: 'load', label: 'Load', icon: 'pi pi-folder-open', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
                { id: 'quick_load', label: 'Quick Load', icon: 'pi pi-bolt', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
              ]
             },
            { kind: 'resource-picker', path: 'shaderFile', label: 'Shader File',
              actions: 
              [
                { id: 'load', label: 'Load', icon: 'pi pi-folder-open', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
                { id: 'quick_load', label: 'Quick Load', icon: 'pi pi-bolt', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
              ]
             },
          ]
        },
        textMaterial: {
          header: 'Text Material',
          icon: 'pi pi-image',
          fields: [
            { kind: 'resource-picker', path: 'fontFile', label: 'Font File',
              actions: 
              [
                { id: 'load', label: 'Load', icon: 'pi pi-folder-open', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
                { id: 'quick_load', label: 'Quick Load', icon: 'pi pi-bolt', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
              ]
             },
            { kind: 'resource-picker', path: 'shaderFile', label: 'Shader File',
              actions: 
              [
                { id: 'load', label: 'Load', icon: 'pi pi-folder-open', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
                { id: 'quick_load', label: 'Quick Load', icon: 'pi pi-bolt', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
              ]
             },
            { kind: 'text', path: 'content', label: 'Content' },
            { kind: 'number', path: 'size', label: 'Size' },
            { kind: 'color', path: 'color', label: 'Color' },
          ]
        },
        wireframeMaterial: {
          header: 'Wireframe Material',
          icon: 'pi pi-image',
          fields: [
            { kind: 'color', path: 'color', label: 'Color' },
          ]
        },
        rigidPhysics: {
          header: 'Rigid Physics',
          icon: 'pi pi-bolt',
          fields: [
            { kind: 'select', path: 'physicsWorld', label: 'Physics World',
              options:
              [
                { value: 'myworld0', label: 'myworld0', icon: 'pi pi-folder-open' },
                { value: '3D_object', label: '3D_object', icon: 'pi pi-bolt' },
              ]
             },
            { kind: 'number', path: 'mass', label: 'Mass' },
            { kind: 'number', path: 'restitution', label: 'Restitution' },
            { kind: 'number', path: 'linearDamping', label: 'Linear Damping' },
            { kind: 'number', path: 'angularDamping', label: 'Angular Damping' },
            { kind: 'number', path: 'friction', label: 'Friction' },
          ]
        },
        staticPhysics: {
          header: 'Static Physics',
          icon: 'pi pi-bolt',
          fields: [
            { kind: 'select', path: 'physicsWorld', label: 'Physics World',
              options:
              [
                { value: 'myworld0', label: 'myworld0', icon: 'pi pi-folder-open' },
                { value: '3D_object', label: '3D_object', icon: 'pi pi-bolt' },
              ]
             },
          ]
        },
        collider: {
          header: 'Collider',
          icon: 'pi pi-globe',
          fields: [
            { kind: 'resource-picker', path: 'colliderFile', label: 'Collider File', 
              actions: 
              [
                { id: 'load', label: 'Load', icon: 'pi pi-folder-open', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
                { id: 'quick_load', label: 'Quick Load', icon: 'pi pi-bolt', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
              ]
             },
            { kind: 'vector', path: 'position', label: 'Position' },
            { kind: 'vector', path: 'rotation', label: 'Rotation' },
            { kind: 'vector', path: 'scaling', label: 'Scale' },
            { kind: 'select', path: 'anchor3D', label: 'Anchor3D',
              options:
              [
                { value: 'myworld0', label: 'myworld0', icon: 'pi pi-folder-open' },
                { value: '3D_object', label: '3D_object', icon: 'pi pi-bolt' },
              ]
             },
          ]
        },
        pointEmission: {
          header: 'Point Emission',
          icon: 'pi pi-sun',
          fields: [
            { kind: 'color', path: 'color', label: 'Color' },
            { kind: 'number', path: 'intensity', label: 'Intensity' },
            { kind: 'number', path: 'radius', label: 'Radius' },
          ]
        },
        spotEmission: {
          header: 'Spot Emission',
          icon: 'pi pi-sun',
          fields: [
            { kind: 'color', path: 'color', label: 'Color' },
            { kind: 'number', path: 'intensity', label: 'Intensity' },
            { kind: 'number', path: 'radius', label: 'Radius' },
            { kind: 'vector', path: 'position', label: 'Direction' },
            { kind: 'number', path: 'innerAngle', label: 'Inner Angle' },
            { kind: 'number', path: 'outerAngle', label: 'Outer Angle' },
          ]
        },
        sunEmission: {
          header: 'Sun Emission',
          icon: 'pi pi-sun',
          fields: [
            { kind: 'color', path: 'color', label: 'Color' },
            { kind: 'number', path: 'intensity', label: 'Intensity' },
            { kind: 'vector', path: 'position', label: 'Direction' },
          ]
        },
        camera: {
          header: 'Camera',
          icon: 'pi pi-camera',
          fields: []
        },
        orbitalCamera: {
          header: 'Orbital Camera',
          icon: 'pi pi-camera',
          fields: [
            { kind: 'select', path: 'targetNode', label: 'Target Node',
              options:
              [
                { value: 'myworld0', label: 'myworld0', icon: 'pi pi-folder-open' },
                { value: '3D_object', label: '3D_object', icon: 'pi pi-bolt' },
              ]
             },
            { kind: 'number', path: 'distance', label: 'Distance' },
            { kind: 'number', path: 'minPitch', label: 'Min Pitch' },
            { kind: 'number', path: 'maxPitch', label: 'Max Pitch' },
          ]
        },
        sound: {
          header: 'Sound',
          icon: 'pi pi-volume-up',
          fields: [
            { kind: 'resource-picker', path: 'soundFile', label: 'Sound File',
              actions: 
              [
                { id: 'load', label: 'Load', icon: 'pi pi-folder-open', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
                { id: 'quick_load', label: 'Quick Load', icon: 'pi pi-bolt', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
              ]
            },
          ]
        },
        stateMachine: {
          header: 'State Machine',
          icon: 'pi pi-sitemap',
          fields: [
            { kind: 'resource-picker', path: 'stateMachineFile', label: 'State Machine File',
              actions: 
              [
                { id: 'load', label: 'Load', icon: 'pi pi-folder-open', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
                { id: 'quick_load', label: 'Quick Load', icon: 'pi pi-bolt', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
              ]
             },
          ]
        },
        script: {
          header: 'Script',
          icon: 'pi pi-code',
          fields: [
            { kind: 'resource-picker', path: 'scriptFile', label: 'Script File',
              actions: 
              [
                { id: 'load', label: 'Load', icon: 'pi pi-folder-open', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
                { id: 'quick_load', label: 'Quick Load', icon: 'pi pi-bolt', extensions: [{ name: 'Materials', extensions: ['png', 'jpg', 'tif'] }] },
              ]
             },
          ]
        }
      }
    }
  }
];



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
    'build-tree': NODE_CONTROL_FIELDS_CONFIG,
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
    'events-state-machines': [
    {
      kind: 'accordion',
      path: 'stateMachines',
      label: 'State Machines',
      allowAdd: true,
      allowDelete: true,
      config: {
        templates: {
          stateMachine: {
            header: 'State Machine',
            icon: 'pi pi-sitemap',
            fields: [
              {
                kind: 'text',
                path: 'name',
                label: 'Machine Name',
              },
              {
                kind: 'select',
                path: 'initialState',
                label: 'Initial State',
                options: [
                  { label: 'Idle', value: 'idle' },
                  { label: 'Running', value: 'running' },
                  { label: 'Walking', value: 'walking' },
                ],
              },
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
                    },
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
                    },
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
                    },
                  },
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
                      { label: 'Idle', value: 'idle' },
                      { label: 'Running', value: 'running' },
                      { label: 'Walking', value: 'walking' },
                    ],
                  },
                  {
                    kind: 'select',
                    path: 'stateTo',
                    label: 'To',
                    options: [
                      { label: 'Idle', value: 'idle' },
                      { label: 'Running', value: 'running' },
                      { label: 'Walking', value: 'walking' },
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
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    },
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




