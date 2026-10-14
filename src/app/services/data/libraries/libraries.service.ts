import { Injectable, computed, inject, signal } from '@angular/core';
import { LibraryEntry, ResolvedDependency } from '../../../model/library.model';
import { NotificationService } from '../../notifications/notification.service';
import { MOCK_INSTALLED_IDS, MOCK_LIBRARIES } from '../../../model/library.mock';

@Injectable({ providedIn: 'root' })
export class LibrariesService {

  private readonly notifications = inject(NotificationService);

  private readonly _libraries = signal<LibraryEntry[]>(MOCK_LIBRARIES);
  private readonly _installedIds = signal<ReadonlySet<string>>(new Set(MOCK_INSTALLED_IDS));

  readonly libraries = this._libraries.asReadonly();
  readonly installed = computed(() => {
    const ids = this._installedIds();
    return this._libraries().filter(l => ids.has(l.id));
  });

  get(id: string | null | undefined): LibraryEntry | undefined {
    return id ? this._libraries().find(l => l.id === id) : undefined;
  }

  isInstalled(id: string): boolean {
    return this._installedIds().has(id);
  }

  resolveDependencies(lib: LibraryEntry): ResolvedDependency[] {
    return lib.dependencies.map(dependency => ({
      dependency,
      library: this.get(dependency.id) ?? null,
      installed: this.isInstalled(dependency.id),
    }));
  }

  /** Installed libraries that list `id` as a dependency. */
  dependents(id: string): LibraryEntry[] {
    return this.installed().filter(l => l.dependencies.some(d => d.id === id));
  }

  /** Installs the library plus any missing required dependencies. */
  install(id: string): void {
    const lib = this.get(id);
    if (!lib || this.isInstalled(id)) return;

    const toInstall = new Set<string>();
    const visit = (l: LibraryEntry) => {
      if (toInstall.has(l.id) || this.isInstalled(l.id)) return;
      toInstall.add(l.id);
      for (const d of l.dependencies) {
        if (d.optional) continue;
        const dep = this.get(d.id);
        if (dep) visit(dep);
      }
    };
    visit(lib);

    this._installedIds.update(ids => new Set([...ids, ...toInstall]));

    const extras = [...toInstall].filter(x => x !== id).map(x => this.get(x)?.name ?? x);
    this.notifications.success(
      `${lib.name} installed`,
      extras.length ? `Also installed: ${extras.join(', ')}` : undefined,
    );
  }

  /** Refuses to uninstall while another installed library requires it. */
  uninstall(id: string): void {
    const lib = this.get(id);
    if (!lib || !this.isInstalled(id)) return;

    const blockers = this.dependents(id).filter(l =>
      l.dependencies.some(d => d.id === id && !d.optional));
    if (blockers.length) {
      this.notifications.warn(
        `Cannot uninstall ${lib.name}`,
        `Required by: ${blockers.map(b => b.name).join(', ')}`,
      );
      return;
    }

    this._installedIds.update(ids => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
    this.notifications.info(`${lib.name} uninstalled`);
  }
}