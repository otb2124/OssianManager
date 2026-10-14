import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { invoke } from '@tauri-apps/api/core';

export interface FsEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string | null;
}

export interface DirStats {
  files: number;
  folders: number;
  totalSize: number;
  directFiles: number;
  directFolders: number;
  truncated: boolean;
  extensions: { ext: string; count: number }[];
}

export interface EntryInfo {
  name: string;
  path: string;
  parent: string | null;
  extension: string | null;
  isDirectory: boolean;
  isSymlink: boolean;
  symlinkTarget: string | null;
  size: number;
  createdMs: number | null;
  modifiedMs: number | null;
  accessedMs: number | null;
  readonly: boolean;
  hidden: boolean;
  detectedType: string | null;
  isText: boolean | null;
  encoding: string | null;
  lineCount: number | null;
  lineEndings: string | null;
  image: { width: number; height: number } | null;
  textPreview: string | null;
  previewTruncated: boolean;
  dir: DirStats | null;
}

@Injectable({ providedIn: 'root' })
export class PersistenceService {

  private readonly basePath = '.ossian';

  read<T>(fileName: string): Observable<T> {
    const path = `${this.basePath}/${fileName}`;
    return from(invoke<string>('read_config', { relativePath: path })).pipe(
      map(text => JSON.parse(text) as T)
    );
  }

  write<T>(fileName: string, data: T): Observable<void> {
    const path = `${this.basePath}/${fileName}`;
    return from(invoke<void>('write_config', {
      relativePath: path,
      content: JSON.stringify(data, null, 2)
    }));
  }

  readAbsolute<T>(absolutePath: string): Observable<T> {
    return from(invoke<string>('read_config_absolute', { path: absolutePath })).pipe(
      map(text => JSON.parse(text) as T)
    );
  }

  writeAbsolute<T>(absolutePath: string, data: T): Observable<void> {
    return from(invoke<void>('write_config_absolute', {
      path: absolutePath,
      content: JSON.stringify(data, null, 2)
    }));
  }

  /**
   * Plain-text read for arbitrary files (.cs, .glsl/.hlsl, .md, etc.) — no
   * JSON parsing. Calls the same read_config_absolute Rust command as
   * readAbsolute<T>, which does a raw fs::read_to_string with no JSON
   * involvement on the Rust side; only this TS wrapper differs.
   */
  readTextAbsolute(absolutePath: string): Observable<string> {
    return from(invoke<string>('read_config_absolute', { path: absolutePath }));
  }

  /**
   * Plain-text write counterpart to readTextAbsolute — no JSON.stringify,
   * content is written to disk exactly as given.
   */
  writeTextAbsolute(absolutePath: string, content: string): Observable<void> {
    return from(invoke<void>('write_config_absolute', {
      path: absolutePath,
      content,
    }));
  }

  listDirectory(path: string): Observable<FsEntry[]> {
    return from(invoke<{ name: string; path: string; is_directory: boolean; size: number; modified: string | null }[]>('list_directory', { path })).pipe(
      map(entries => entries.map(e => ({
        name: e.name,
        path: e.path,
        isDirectory: e.is_directory,
        size: e.size,
        modified: e.modified,
      })))
    );
  }

  rename(oldPath: string, newName: string): Observable<string> {
    return from(invoke<string>('rename_entry', { oldPath, newName }));
  }

  inspectEntry(path: string): Observable<EntryInfo> {
    return from(invoke<EntryInfo>('inspect_entry', { path }));
  }

  hashFile(path: string): Observable<string> {
    return from(invoke<string>('hash_file', { path }));
  }

  readFileBytes(path: string, maxBytes: number): Observable<ArrayBuffer> {
    return from(invoke<ArrayBuffer>('read_file_bytes', { path, maxBytes }));
  }
}