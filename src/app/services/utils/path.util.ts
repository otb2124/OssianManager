// Windows-style path helpers. The engine and the Rust side are Windows-only, and a project's
// .ossian.project.json may hold "./Content", "/res" or "C:\\Games\\X\\Content" (all seen in this repo).

const DRIVE = /^[A-Za-z]:[\\/]/;

export function isAbsolutePath(path: string): boolean {
  return DRIVE.test(path) || path.startsWith('\\\\') || path.startsWith('//');
}

/** Backslashes, no "." / ".." segments, no trailing slash. */
export function normalizePath(path: string): string {
  const s = path.replace(/\//g, '\\');
  const unc = s.startsWith('\\\\');
  const drive = !unc && /^[A-Za-z]:/.test(s) ? s.slice(0, 2) : '';
  const rest = s.slice(unc ? 2 : drive.length);

  const out: string[] = [];
  for (const segment of rest.split('\\')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') { out.pop(); continue; }
    out.push(segment);
  }

  const prefix = unc ? '\\\\' : drive ? drive + '\\' : '';
  return prefix + out.join('\\');
}

export function joinPath(...parts: string[]): string {
  return normalizePath(parts.join('\\'));
}

/**
 * Resolves a path from a project config against the project folder.
 * Absolute paths stay as they are; everything else ("./Content", "Content", "/res") is project-relative.
 */
export function resolveProjectPath(projectDir: string, path: string): string {
  return isAbsolutePath(path) ? normalizePath(path) : normalizePath(`${projectDir}\\${path}`);
}