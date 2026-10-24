import { Injectable, computed, inject } from '@angular/core';
import { LibraryEntry, ResolvedDependency } from '../../../model/library.model';
import { NotificationService } from '../../notifications/notification.service';
import { AppStoreService } from '../app-config/app-store.service';
import { ProjectService } from '../projects/project.service';

@Injectable({ providedIn: 'root' })
export class LibrariesService {

  private readonly notifications = inject(NotificationService);
  private readonly store = inject(AppStoreService);
  private readonly project = inject(ProjectService);

  /** Catalog, shipped with the app (app file `libraries.catalog`). */
  readonly libraries = computed(() => this.store.data()?.libraries.catalog ?? []);
  private readonly byId = computed(() => new Map(this.libraries().map(l => [l.id, l])));

  /** Installed set, per project (project config `libraries.installed`). */
  private readonly installedIds = computed(() => new Set(this.project.currentConfig()?.libraries?.installed ?? []));
  readonly installed = computed(() => this.libraries().filter(l => this.installedIds().has(l.id)));

  isInstalled(id: string): boolean {
    return this.installedIds().has(id);
  }

  get(id: string | null | undefined): LibraryEntry | undefined {
    return id ? this.byId().get(id) : undefined;
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
    if (!lib || this.isInstalled(id) || !this.requireProject()) return;

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

    const extras = [...toInstall].filter(x => x !== id).map(x => this.get(x)?.name ?? x);
    this.persist([...this.installedIds(), ...toInstall], () =>
      this.notifications.success(
        `${lib.name} installed`,
        extras.length ? `Also installed: ${extras.join(', ')}` : undefined,
      ));
  }

  /** Refuses to uninstall while another installed library requires it. */
  uninstall(id: string): void {
    const lib = this.get(id);
    if (!lib || !this.isInstalled(id) || !this.requireProject()) return;

    const blockers = this.dependents(id).filter(l =>
      l.dependencies.some(d => d.id === id && !d.optional));
    if (blockers.length) {
      this.notifications.warn(
        `Cannot uninstall ${lib.name}`,
        `Required by: ${blockers.map(b => b.name).join(', ')}`,
      );
      return;
    }

    this.persist([...this.installedIds()].filter(x => x !== id), () =>
      this.notifications.info(`${lib.name} uninstalled`));
  }

  private requireProject(): boolean {
    if (this.project.hasConfig()) return true;
    this.notifications.warn('No project open', 'Open a project to install libraries.');
    return false;
  }

  private persist(ids: Iterable<string>, onSaved: () => void): void {
    this.project.updateConfig({ libraries: { installed: [...ids] } }).subscribe({
      complete: onSaved,
      error: err => this.notifications.error('Could not save libraries', String(err)),
    });
  }
}