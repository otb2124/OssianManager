import { DirectionalLight, Node, PointLight, SpotLight, TransformNode } from "@babylonjs/core";

export interface NodeProperty {
  type: string;
  [key: string]: any;
}

export interface NodeConfig {
  properties: NodeProperty[];
}

export function createPropertyFromTemplate(
  templateKey: string, 
  templatesConfig: Record<string, any>
): NodeProperty {
  const template = templatesConfig[templateKey];
  if (!template) return { type: templateKey };

  const newProperty: NodeProperty = {
    type: templateKey,
  };

  for (const field of template.fields || []) {
    if (field.defaultValue !== undefined) {
      // Return a copy if it's an array/object to avoid shared mutations
      newProperty[field.path] = Array.isArray(field.defaultValue) 
        ? [...field.defaultValue] 
        : typeof field.defaultValue === 'object' && field.defaultValue !== null
        ? { ...field.defaultValue }
        : field.defaultValue;
    } else {
      // Fallback defaults if omitted in config
      newProperty[field.path] = getFallbackValue(field.kind);
    }
  }

  return newProperty;
}

function getFallbackValue(kind: string): any {
  switch (kind) {
    case 'boolean': return false;
    case 'number': return 0;
    case 'vector': return [0, 0, 0];
    case 'color': return '#ffffff';
    default: return '';
  }
}



export function createNodeConfigFromBabylonNode(babylonNode: Node): NodeConfig {
  // Use NodeProperty[] instead of Record<string, any>[]
  const properties: NodeProperty[] = [];

  // 1. Base Node Block (Every Babylon Node has these)
  properties.push({
    type: "node",
    name: babylonNode.name,
    id: babylonNode.id,
    enable: babylonNode.isEnabled(),
    enableStart: true,
    enableUpdate: true,
    enableRender: true
  });

  // 2. Transform Block (Only for TransformNode / AbstractMesh / Camera instances)
  if (babylonNode instanceof TransformNode) {
    properties.push({
      type: "transform",
      position: [
        babylonNode.position.x,
        babylonNode.position.y,
        babylonNode.position.z
      ],
      rotation: [
        babylonNode.rotation.x,
        babylonNode.rotation.y,
        babylonNode.rotation.z
      ],
      scaling: [
        babylonNode.scaling.x,
        babylonNode.scaling.y,
        babylonNode.scaling.z
      ]
    });
  }

  // 3. Lighting Blocks (PointLight, SpotLight, DirectionalLight)
  if (babylonNode instanceof PointLight) {
    properties.push({
      type: "pointEmission",
      color: babylonNode.diffuse.toHexString(),
      intensity: babylonNode.intensity,
      radius: babylonNode.range
    });
  } else if (babylonNode instanceof SpotLight) {
    properties.push({
      type: "spotEmission",
      color: babylonNode.diffuse.toHexString(),
      intensity: babylonNode.intensity,
      radius: babylonNode.range,
      position: [babylonNode.direction.x, babylonNode.direction.y, babylonNode.direction.z],
      innerAngle: babylonNode.innerAngle ?? 0,
      outerAngle: babylonNode.angle
    });
  } else if (babylonNode instanceof DirectionalLight) {
    properties.push({
      type: "sunEmission",
      color: babylonNode.diffuse.toHexString(),
      intensity: babylonNode.intensity,
      position: [babylonNode.direction.x, babylonNode.direction.y, babylonNode.direction.z]
    });
  }

  // 4. Material Blocks (If node has an attached material)
  const meshNode = babylonNode as any;
  if (meshNode.material) {
    const mat = meshNode.material;
    
    if (mat.wireframe) {
      properties.push({
        type: "wireframeMaterial",
        color: mat.diffuseColor ? mat.diffuseColor.toHexString() : "#ffffff"
      });
    } else {
      properties.push({
        type: "textureMaterial",
        textureFile: mat.diffuseTexture?.name ?? "",
        shaderFile: mat.shaderName ?? ""
      });
    }
  }

  return { properties };
}

