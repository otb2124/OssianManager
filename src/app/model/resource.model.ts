export interface ResourceEntry {
    /** Resource id as the engine knows it, e.g. "texture.brick" */
    id: string;
    /** Resource type, e.g. "mesh", "boxcollider" */
    type: string;
    /** Raw `data` array from resources.json: file paths, other resource ids, or plain numbers. */
    data?: unknown[];
  }
  
  export interface ResourceGroupMeta {
    key: string;
    label: string;
    icon: string;
  }
  
  export const RESOURCE_GROUP_META: ResourceGroupMeta[] = [
    { key: 'files',      label: 'Files',      icon: 'pi pi-file' },
    { key: 'meshes',     label: 'Meshes',     icon: 'pi pi-box' },
    { key: 'textures',   label: 'Textures',   icon: 'pi pi-image' },
    { key: 'shaders',    label: 'Shaders',    icon: 'pi pi-sliders-h' },
    { key: 'colliders',  label: 'Colliders',  icon: 'pi pi-stop' },
    { key: 'animations', label: 'Animations', icon: 'pi pi-play' },
    { key: 'sounds',     label: 'Sounds',     icon: 'pi pi-volume-up' },
    { key: 'fonts',      label: 'Fonts',      icon: 'pi pi-pencil' },
    { key: 'other',      label: 'Other',      icon: 'pi pi-circle' },
  ];
  
  /** Maps an engine resource type to a RESOURCE_GROUP_META key. */
  export function resourceGroupOf(type: string): string {
    if (type.endsWith('file') || type.startsWith('configfile')) return 'files'; // texturefile, meshfile, configfile.scene, ...
    if (type === 'mesh' || type === 'terrainmesh') return 'meshes';
    if (type === 'texture' || type === 'cubemaptexture') return 'textures';
    if (type === 'shader' || type.endsWith('shader')) return 'shaders';
    if (type.includes('collider')) return 'colliders';
    if (type === 'animation') return 'animations';
    if (type === 'sound') return 'sounds';
    if (type === 'font') return 'fonts';
    return 'other';
  }