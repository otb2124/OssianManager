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

@Injectable({ providedIn: 'root' })
export class PersistenceService {

  private readonly basePath = '../.ossian';

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
}