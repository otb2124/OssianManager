import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PersistenceService } from '../persistence.service';

export interface IniEdit {
  section: string;
  key: string;
  /** Written quoted ("..."): all three Ossian ini parsers read a quoted value verbatim, so ';' and '#' in paths are safe. */
  value: string;
  /** Leave the key alone when the file already has it (for settings the user is expected to edit). */
  onlyIfMissing?: boolean;
}

const isHeader = (t: string) => t.length > 1 && t[0] === '[' && t[t.length - 1] === ']';
const isComment = (t: string) => t[0] === ';' || t[0] === '#';

/**
 * Sets keys in an ini text and leaves everything else (comments, other sections, other keys, key order) alone.
 * Missing sections / keys are added. `source` null = the file does not exist yet.
 */
export function patchIni(source: string | null, edits: IniEdit[], createHeader = ''): string {
  const text = (source ?? '').replace(/^\uFEFF/, '');
  const eol = text.includes('\n') && !text.includes('\r\n') ? '\n' : '\r\n';

  const lines = text.length > 0 ? text.split(/\r?\n/) : [];
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  if (lines.length === 0 && createHeader) lines.push(...createHeader.split(/\r?\n/), '');

  for (const edit of edits) setValue(lines, edit);
  return lines.join(eol) + eol;
}

function setValue(lines: string[], { section, key, value, onlyIfMissing }: IniEdit): void {
  const wantSection = section.toLowerCase();
  const wantKey = key.toLowerCase();
  const quoted = `"${value}"`;

  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (isHeader(t) && t.slice(1, -1).trim().toLowerCase() === wantSection) { start = i; break; }
  }

  if (start < 0) {
    if (lines.length > 0 && lines[lines.length - 1].trim() !== '') lines.push('');
    lines.push(`[${section}]`, `${key} = ${quoted}`);
    return;
  }

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (isHeader(lines[i].trim())) { end = i; break; }
  }

  let lastKeyLine = start;
  for (let i = start + 1; i < end; i++) {
    const t = lines[i].trim();
    if (t === '' || isComment(t)) continue;

    const eq = lines[i].indexOf('=');
    if (eq < 1) continue;
    lastKeyLine = i;

    if (lines[i].slice(0, eq).trim().toLowerCase() === wantKey) {
      if (!onlyIfMissing) lines[i] = `${lines[i].slice(0, eq).trimEnd()} = ${quoted}`;
      return;
    }
  }

  lines.splice(lastKeyLine + 1, 0, `${key} = ${quoted}`);
}

/** Reads, patches and writes an ini file; only touches the disk when the text actually changes. */
@Injectable({ providedIn: 'root' })
export class IniFileService {
  private readonly persistence = inject(PersistenceService);

  /** Returns true when the file was written. */
  async patch(path: string, edits: IniEdit[], createHeader = ''): Promise<boolean> {
    let current: string | null = null;
    try {
      current = await firstValueFrom(this.persistence.readTextAbsolute(path));
    } catch (err) {
      // Only "file does not exist" may fall through to creating it; any other failure
      // (locked, no access) must not replace a file we could not read.
      if (!/os error (2|3)\b|not found|cannot find/i.test(String(err))) throw err;
    }

    const next = patchIni(current, edits, createHeader);
    if (current !== null && current.replace(/^\uFEFF/, '') === next) return false;

    await firstValueFrom(this.persistence.writeTextAbsolute(path, next));
    return true;
  }
}