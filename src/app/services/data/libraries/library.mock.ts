// MOCK DATA - replace with a real source (registry / engine scriptPacks.json) later.
import { LibraryEntry } from '../../../model/library.model';

export const MOCK_INSTALLED_IDS: string[] = ['state-machine', 'motion', 'vehicle'];

export const MOCK_LIBRARIES: LibraryEntry[] = [
  {
    id: 'state-machine',
    name: 'State Machine',
    publisher: 'Ossian',
    version: '1.2.0',
    summary: 'Data-driven state machines with transitions, conditions and actions.',
    description:
`Adds StateMachineProperty and the JSON state machine format used by the player and free camera scenes.

Features:
- States with onEnter / onUpdate / onExit action lists
- Transition conditions with and / not / copy operators
- Reflection-based condition calls into engine code`,
    icon: 'pi pi-sitemap',
    color: '#eb1e92',
    tags: ['scripting', 'logic', 'official'],
    downloads: 48210,
    rating: 4.8,
    license: 'MIT',
    repository: 'https://github.com/ossian/state-machine',
    updatedAt: '2026-09-28T10:00:00Z',
    dependencies: [],
  },
  {
    id: 'motion',
    name: 'Motion',
    publisher: 'Ossian',
    version: '1.0.4',
    summary: 'Character and object motion helpers built on rigid physics.',
    description:
`Provides MotionProperty, velocity and impulse helpers, and camera-relative movement used by the player controller.

Works with Jitter2 rigid bodies out of the box.`,
    icon: 'pi pi-arrows-alt',
    color: '#3b82f6',
    tags: ['physics', 'movement', 'official'],
    downloads: 39870,
    rating: 4.6,
    license: 'MIT',
    updatedAt: '2026-09-12T10:00:00Z',
    dependencies: [],
  },
  {
    id: 'vehicle',
    name: 'Vehicle',
    publisher: 'Ossian',
    version: '0.9.1',
    summary: 'Wheeled vehicle physics with suspension and steering.',
    description:
`VehicleProperty and VehicleWheelProperty for raycast-style wheeled vehicles.

Status: preview. The API may change between minor versions.`,
    icon: 'pi pi-car',
    color: '#f59e0b',
    tags: ['physics', 'vehicles', 'official', 'preview'],
    downloads: 12040,
    rating: 4.1,
    license: 'MIT',
    updatedAt: '2026-08-30T10:00:00Z',
    dependencies: [{ id: 'motion', version: '^1.0.0' }],
  },
  {
    id: 'terrain-tools',
    name: 'Terrain Tools',
    publisher: 'Highlands Studio',
    version: '2.1.0',
    summary: 'Heightmap import, painting and terrain collider generation.',
    description:
`Import heightmaps, paint texture layers and generate terrain colliders.

Includes helpers for splat maps and runtime terrain queries.`,
    icon: 'pi pi-map',
    color: '#22c55e',
    tags: ['terrain', 'world', 'editor'],
    downloads: 21500,
    rating: 4.5,
    license: 'Apache-2.0',
    updatedAt: '2026-10-02T10:00:00Z',
    dependencies: [],
  },
  {
    id: 'ui-kit',
    name: 'UI Kit',
    publisher: 'Pixel Forge',
    version: '1.4.2',
    summary: 'Screen-space buttons, panels and text widgets.',
    description:
`Ready-made screen-space controls built on TextMaterialProperty and ControlProperty: buttons, labels, panels and layout anchors.`,
    icon: 'pi pi-th-large',
    color: '#8b5cf6',
    tags: ['ui', 'widgets'],
    downloads: 30110,
    rating: 4.3,
    license: 'MIT',
    updatedAt: '2026-09-20T10:00:00Z',
    dependencies: [],
  },
  {
    id: 'dialogue-system',
    name: 'Dialogue System',
    publisher: 'Pixel Forge',
    version: '0.6.0',
    summary: 'Branching dialogue graphs with a ready-made UI.',
    description:
`Author branching conversations as graphs and play them back with the UI Kit widgets.

Dialogue flow is driven by state machines, so conditions and actions work the same way as everywhere else.`,
    icon: 'pi pi-comments',
    color: '#06b6d4',
    tags: ['narrative', 'ui'],
    downloads: 8420,
    rating: 4.0,
    license: 'MIT',
    updatedAt: '2026-09-05T10:00:00Z',
    dependencies: [
      { id: 'state-machine', version: '^1.0.0' },
      { id: 'ui-kit', version: '^1.3.0' },
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory',
    publisher: 'Pixel Forge',
    version: '1.0.0',
    summary: 'Item definitions, stacks and a grid inventory UI.',
    description:
`Item databases, stackable slots and a drag-and-drop grid inventory built on the UI Kit.`,
    icon: 'pi pi-box',
    color: '#ef4444',
    tags: ['gameplay', 'ui'],
    downloads: 6980,
    rating: 3.9,
    updatedAt: '2026-08-14T10:00:00Z',
    dependencies: [{ id: 'ui-kit', version: '^1.4.0' }],
  },
  {
    id: 'post-processing',
    name: 'Post Processing',
    publisher: 'Lumen Labs',
    version: '1.1.3',
    summary: 'Bloom, color grading and vignette passes.',
    description:
`A post-processing stack for the shader.post pipeline: bloom, tone mapping, color grading and vignette, each toggleable per scene.`,
    icon: 'pi pi-palette',
    color: '#ec4899',
    tags: ['rendering', 'effects'],
    downloads: 17650,
    rating: 4.4,
    license: 'MIT',
    updatedAt: '2026-09-25T10:00:00Z',
    dependencies: [],
  },
  {
    id: 'procedural-sky',
    name: 'Procedural Sky',
    publisher: 'Lumen Labs',
    version: '0.3.2',
    summary: 'Dynamic day/night sky replacing cubemap skyboxes.',
    description:
`Sky shader with a sun position driven by time of day, plus atmospheric scattering.

Optionally integrates with Post Processing for sun bloom.`,
    icon: 'pi pi-sun',
    color: '#facc15',
    tags: ['rendering', 'environment'],
    downloads: 5230,
    rating: 4.2,
    license: 'MIT',
    updatedAt: '2026-10-08T10:00:00Z',
    dependencies: [{ id: 'post-processing', version: '^1.0.0', optional: true }],
  },
  {
    id: 'particle-fx',
    name: 'Particle FX',
    publisher: 'Lumen Labs',
    version: '0.8.0',
    summary: 'GPU-friendly particle emitters with editor presets.',
    description:
`Emitter nodes with burst and continuous modes, curves for size and color over lifetime, and a set of presets (smoke, sparks, fire).`,
    icon: 'pi pi-bolt',
    color: '#f97316',
    tags: ['rendering', 'effects'],
    downloads: 9100,
    rating: 4.1,
    updatedAt: '2026-09-18T10:00:00Z',
    dependencies: [],
  },
];
