// resource-tree.mock.ts
// MOCK DATA - replace with a real source (e.g. engine IPC / resources.json) later.

export interface ResourceEntry {
    /** Resource id as the engine knows it, e.g. "texture.brick.d" */
    id: string;
    /** Resource type, e.g. "mesh", "boxcollider" */
    type: string;
  }
  
  export interface ResourceGroup {
    key: string;
    label: string;
    icon: string;
    items: ResourceEntry[];
  }
  
  export const MOCK_RESOURCE_GROUPS: ResourceGroup[] = [
    {
      key: 'colliders', label: 'Colliders', icon: 'pi pi-stop',
      items: [
        { id: 'collider.box.unit', type: 'boxcollider' },
        { id: 'collider.capsule.player', type: 'capsulecollider' },
        { id: 'collider.mesh.house', type: 'meshcollider' },
        { id: 'collider.mesh.remy', type: 'meshcollider' },
        { id: 'collider.terrain.main', type: 'terraincollider' },
      ],
    },
    {
      key: 'meshes', label: 'Meshes', icon: 'pi pi-box',
      items: [
        { id: 'mesh.remy', type: 'mesh' },
        { id: 'mesh.gizmo.position', type: 'mesh' },
        { id: 'mesh.gizmo.rotate', type: 'mesh' },
        { id: 'mesh.gizmo.scale', type: 'mesh' },
        { id: 'mesh.terrain.main', type: 'terrainmesh' },
      ],
    },
    {
      key: 'materials', label: 'Materials', icon: 'pi pi-palette',
      items: [
        { id: 'material.brick', type: 'material' },
        { id: 'material.grass', type: 'material' },
        { id: 'material.skin', type: 'material' },
        { id: 'material.skybox.sea', type: 'material' },
        { id: 'material.ui.text', type: 'material' },
      ],
    },
    {
      key: 'textures', label: 'Textures', icon: 'pi pi-image',
      items: [
        { id: 'texture.brick.d', type: 'texture' },
        { id: 'texture.brick.n', type: 'texture' },
        { id: 'texture.grass.d', type: 'texture' },
        { id: 'texture.cubemap.skybox.sea', type: 'cubemaptexture' },
        { id: 'texture.cubemap.skybox.sky', type: 'cubemaptexture' },
      ],
    },
    {
      key: 'shaders', label: 'Shaders', icon: 'pi pi-sliders-h',
      items: [
        { id: 'shader.basic', type: 'basicshader' },
        { id: 'shader.wireframe', type: 'wireframeshader' },
        { id: 'shader.skybox', type: 'skyboxshader' },
        { id: 'shader.sdf', type: 'sdfshader' },
      ],
    },
    {
      key: 'animations', label: 'Animations', icon: 'pi pi-play',
      items: [
        { id: 'animation.remy.idle', type: 'animation' },
        { id: 'animation.remy.walking', type: 'animation' },
        { id: 'animation.remy.run', type: 'animation' },
        { id: 'animation.remy.jump', type: 'animation' },
      ],
    },
    {
      key: 'sounds', label: 'Sounds', icon: 'pi pi-volume-up',
      items: [{ id: 'sound.ambient.wind', type: 'sound' }],
    },
    {
      key: 'fonts', label: 'Fonts', icon: 'pi pi-pencil',
      items: [{ id: 'font.roboto', type: 'font' }],
    },
  ];