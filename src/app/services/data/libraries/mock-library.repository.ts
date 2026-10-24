import { Observable, of } from 'rxjs';
import type { LibraryRepository } from './library.repository';
import { LibraryEntry } from '../../../model/library.model';
import { MOCK_INSTALLED_IDS, MOCK_LIBRARIES } from './library.mock';

/** In-memory catalog. Emits synchronously, so the service has its data as soon as it is constructed. */
export class MockLibraryRepository implements LibraryRepository {

  getAll(): Observable<LibraryEntry[]> {
    return of(MOCK_LIBRARIES);
  }

  getInstalledIds(): Observable<string[]> {
    return of(MOCK_INSTALLED_IDS);
  }
}
