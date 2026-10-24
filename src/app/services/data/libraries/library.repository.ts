import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { LibraryEntry } from '../../../model/library.model';
import { MockLibraryRepository } from './mock-library.repository';

/** Where the library catalog and the installed set come from. */
export interface LibraryRepository {
  getAll(): Observable<LibraryEntry[]>;
  getInstalledIds(): Observable<string[]>;
}

/**
 * LibrariesService reads through this token. Point `factory` at a real source
 * (registry / engine scriptPacks.json) when one exists; nothing else has to change.
 */
export const LIBRARY_REPOSITORY = new InjectionToken<LibraryRepository>('LibraryRepository', {
  providedIn: 'root',
  factory: () => new MockLibraryRepository(),
});
