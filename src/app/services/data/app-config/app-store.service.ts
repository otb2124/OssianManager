// services/data/app-store/app-store.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PersistenceService } from '../../persistence/persistence.service';
import { AppFile } from '../../../model/app-file.model';
import { APP_SEED } from '../../../model/app.seed';

const SEED: AppFile = APP_SEED;
const FILE = '.ossian.app.json';
const MANAGED = ['ui', 'libraries'] as const;   // shipped with the app, refreshed when seedVersion rises
const NOT_FOUND = /os error (2|3)\b|not found|cannot find/i;

function applySeed(disk: Partial<AppFile>): AppFile {
  const out = { ...structuredClone(SEED), ...disk } as AppFile;
  out.settings = {
    ...SEED.settings, ...disk.settings,
    background: { ...SEED.settings.background, ...disk.settings?.background } as any,
  };
  out.notifications = { ...SEED.notifications, ...disk.notifications };
  out.editor = { ...SEED.editor, ...disk.editor };
  out.defaults = { ...SEED.defaults, ...disk.defaults };
  out.git = { ...SEED.git, ...disk.git };
  if ((disk.seedVersion ?? 0) < SEED.seedVersion) {
    for (const k of MANAGED) (out as any)[k] = structuredClone(SEED[k]);
    out.seedVersion = SEED.seedVersion;
  }
  return out;
}

@Injectable({ providedIn: 'root' })
export class AppStoreService {
  private readonly persistence = inject(PersistenceService);

  private readonly _data = signal<AppFile | null>(null);
  readonly data = this._data.asReadonly();

  private loading?: Promise<AppFile>;
  private queue: Promise<unknown> = Promise.resolve();

  /** Memoized: safe to call from every window/service. */
  load(): Promise<AppFile> {
    return (this.loading ??= (async () => {
      const disk = await this.readDisk();
      const merged = applySeed(disk ?? (await this.migrateLegacy()));
      this._data.set(merged);
      await firstValueFrom(this.persistence.write(FILE, merged));
      return merged;
    })());
  }

  /** Fresh read from disk (the other window may have written since). */
  async read(): Promise<AppFile> {
    await this.load();
    return applySeed((await this.readDisk()) ?? structuredClone(SEED));
  }

  /** Serialized read-modify-write. Callers only change their own slice, so cross-window edits are kept. */
  update(fn: (disk: AppFile) => AppFile): Promise<AppFile> {
    const run = this.queue.then(async () => {
      const next = fn(await this.read());
      await firstValueFrom(this.persistence.write(FILE, next));
      this._data.set(next);
      return next;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async readDisk(): Promise<AppFile | null> {
    try {
      return await firstValueFrom(this.persistence.read<AppFile>(FILE));
    } catch (err) {
      if (NOT_FOUND.test(String(err))) return null;
      throw err;   // a corrupt file must never be overwritten by defaults
    }
  }

  /** First run after the upgrade: fold the four old files into the new one. */
  private async migrateLegacy(): Promise<Partial<AppFile>> {
    const old = async <T>(name: string, fallback: T): Promise<T> => {
      try { return await firstValueFrom(this.persistence.read<T>(`.ossian/${name}`)); }
      catch { return fallback; }
    };
    const app = await old<Partial<AppFile>>('app.json', {});
    return {
      ...app,
      projects: await old('project-registry.json', []),
      tags: await old('user-tags.json', []),
      notifications: { ...SEED.notifications, log: await old('notification-log.json', []) },
    };
  }
}