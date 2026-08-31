
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

