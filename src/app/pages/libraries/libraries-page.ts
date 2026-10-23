import { Component, effect, inject, signal, untracked } from '@angular/core';
import { DockviewApi } from 'dockview-core';
import { LibrariesList } from '../../components/libraries/libraries-list/libraries-list';
import { Library } from '../../components/libraries/library/library';
import { DockGrid, DockPanelDef } from '../../components/layout/dock-grid/dock-grid';
import { LibrariesService } from '../../services/data/libraries/libraries.service';
import { LibraryTabsService } from '../../services/data/libraries/library-tabs/library-tabs.service';

/** Placeholder until the first library is opened. */
@Component({
  selector: 'app-library-home',
  template: `
    <div class="h-full w-full flex flex-col items-center justify-center gap-3
                text-gray-400 dark:text-gray-600 select-none">
      <i class="pi pi-book text-4xl"></i>
      <span class="text-sm">Select a library to see its details</span>
    </div>`,
})
export class LibraryHome {}

@Component({
  selector: 'app-libraries-page',
  imports: [LibrariesList, DockGrid],
  templateUrl: './libraries-page.html',
  styleUrl: './libraries-page.css',
  host: { class: 'block h-full w-full' },
})
export class LibrariesPage {
  private readonly tabs = inject(LibraryTabsService);
  private readonly libs = inject(LibrariesService);
  private readonly api = signal<DockviewApi | null>(null);

  protected readonly components = { library: Library };
  protected readonly panels: DockPanelDef[] = [
    { id: 'home', title: 'Libraries', component: LibraryHome },
  ];

  constructor() {
    effect(() => {
      const api = this.api();
      const req = this.tabs.request();
      if (!api || !req) return;
      untracked(() => {
        this.open(api, req.id);
        this.tabs.consume();
      });
    });
  }

  protected onReady(api: DockviewApi): void {
    this.api.set(api);
  }

  private open(api: DockviewApi, id: string): void {
    const panelId = `library:${id}`;

    const existing = api.getPanel(panelId);
    if (existing) {
      existing.api.setActive();
      return;
    }

    // Join the group that already holds library tabs (or the placeholder).
    const anchor = api.panels.find(p => p.id.startsWith('library:')) ?? api.getPanel('home');

    api.addPanel({
      id: panelId,
      component: 'library',
      title: this.libs.get(id)?.name ?? id,
      params: { libraryId: id },
      position: anchor ? { referenceGroup: anchor.group, direction: 'within' } : undefined,
    });

    api.getPanel('home')?.api.close();
  }
}