import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { LibrariesService } from '../../../services/data/libraries/libraries.service';
import { LibraryTabsService } from '../../../services/data/libraries/library-tabs/library-tabs.service';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, TabsModule],
  templateUrl: './library.html',
})
export class Library {
  readonly libraryId = input<string | null>(null);

  protected readonly libs = inject(LibrariesService);
  private readonly libraryTabs = inject(LibraryTabsService);
  private readonly router = inject(Router);

  protected readonly activeTab = signal<string>('description');

  protected readonly library = computed(() => this.libs.get(this.libraryId()));
  protected readonly installed = computed(() => {
    const lib = this.library();
    return !!lib && this.libs.isInstalled(lib.id);
  });
  protected readonly dependencies = computed(() => {
    const lib = this.library();
    return lib ? this.libs.resolveDependencies(lib) : [];
  });
  protected readonly dependents = computed(() => {
    const lib = this.library();
    return lib ? this.libs.dependents(lib.id) : [];
  });

  constructor() {
    // Navigating library -> library (via a dependency link) reuses this component; start on Description again.
    effect(() => {
      this.libraryId();
      untracked(() => this.activeTab.set('description'));
    });
  }

  protected onTabChange(value: string | number | undefined): void {
    this.activeTab.set(String(value ?? 'description'));
  }

  protected toggleInstall(): void {
    const lib = this.library();
    if (!lib) return;
    if (this.installed()) this.libs.uninstall(lib.id);
    else this.libs.install(lib.id);
  }

  protected openLibrary(id: string): void {
    this.libraryTabs.open(id);
  }

  protected back(): void {
    this.router.navigate(['/tools', 'libraries']);
  }
}