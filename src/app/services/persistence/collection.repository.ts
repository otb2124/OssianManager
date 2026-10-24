import { inject } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { AppStoreService } from '../data/app-config/app-store.service';

/** A collection (array of records with an `id`) stored inside the app file. */
export abstract class CollectionRepository<T extends { id: string }> {
  protected readonly store = inject(AppStoreService);
  protected abstract readonly key: 'projects' | 'tags';

  getAll(): Observable<T[]> {
    return from(this.store.read()).pipe(map(d => d[this.key] as unknown as T[]));
  }

  getById(id: string): Observable<T | undefined> {
    return this.getAll().pipe(map(items => items.find(i => i.id === id)));
  }

  save(item: T): Observable<void> {
    return from(this.store.update(d => {
      const items = d[this.key] as unknown as T[];
      const next = items.some(i => i.id === item.id)
        ? items.map(i => (i.id === item.id ? item : i))
        : [...items, item];
      return { ...d, [this.key]: next };
    })).pipe(map(() => void 0));
  }

  delete(id: string): Observable<void> {
    return from(this.store.update(d => ({
      ...d,
      [this.key]: (d[this.key] as unknown as T[]).filter(i => i.id !== id),
    }))).pipe(map(() => void 0));
  }
}