const TEXT_EXTENSIONS = new Set([
    'cs', 'json', 'txt', 'md', 'xml', 'ini', 'cfg', 'csv', 'log', 'yml', 'yaml',
    'vert', 'frag', 'glsl', 'hlsl', 'comp', 'shader',
  ]);
  
  export function isTextFile(name: string, extensions: readonly string[]): boolean {
    const i = name.lastIndexOf('.');
    return i > 0 && extensions.includes(name.slice(i + 1).toLowerCase());
  }