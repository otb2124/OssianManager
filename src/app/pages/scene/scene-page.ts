import { Component, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DockviewApi, IDockviewPanel } from 'dockview-core';
import { InspectorPanel } from '../../components/editor/inspector-panel/inspector-panel';
import { FileExplorerPanel } from '../../components/editor/file-tree-panel/file-tree-panel';
import { FileInspectorPanel } from '../../components/editor/file-inspector-panel/file-inspector-panel';
import { HierarchyPanel } from '../../components/editor/hierarchy-panel/hierarchy-panel';
import { Viewport3D } from '../../components/editor/viewport3d/viewport3d';
import { ScriptEditor } from '../../components/editor/script-editor/script-editor';
import { Terminal } from '../../components/editor/terminal/terminal';
import { ResourcesPanel } from '../../components/editor/resources-panel/resources-panel';
import { DockGrid, DockPanelDef } from '../../components/layout/dock-grid/dock-grid';
import { FileExplorerService } from '../../services/persistence/file-explorer.service';
import { samePath } from '../../services/utils/path.util';
import { EditorTabsService, OpenRequest } from '../../services/editor/editor-tabs/editor-tabs.service';

/** Shown in the centre until the first scene/file is opened. */
@Component({
  selector: 'app-editor-home',
  template: `
    <div class="h-full w-full flex flex-col items-center justify-center gap-3
                text-gray-400 dark:text-gray-600 select-none">
      <i class="pi pi-objects-column text-4xl"></i>
      <span class="text-sm">Open a scene from the Scenes graph, or a file from Files</span>
    </div>`,
})
export class EditorHome {}

const EDITOR_PANEL = /^(scene|file):/;

@Component({
  selector: 'app-scene-page',
  imports: [DockGrid],
  templateUrl: './scene-page.html',
  styleUrl: './scene-page.css',
  host: { class: 'block h-full w-full' },
})
export class ScenePage {
  private readonly tabs = inject(EditorTabsService);
  private readonly explorer = inject(FileExplorerService);
  private readonly api = signal<DockviewApi | null>(null);

  /** Component names used by dynamically added panels (`component: 'scene' | 'file'`). */
  protected readonly components = { scene: Viewport3D, file: ScriptEditor };

  protected readonly panels: DockPanelDef[] = [
    { id: 'home', title: 'Editor', component: EditorHome },

    { id: 'hierarchy', title: 'Hierarchy', component: HierarchyPanel,
      position: { referencePanel: 'home', direction: 'left' }, initialWidth: 320 },
    { id: 'inspector', title: 'Inspector', component: InspectorPanel,
      position: { referencePanel: 'hierarchy', direction: 'below' } },
    { id: 'files', title: 'Files', component: FileExplorerPanel,
      position: { referencePanel: 'home', direction: 'right' }, initialWidth: 320 },
    { id: 'resources', title: 'Resources', component: ResourcesPanel, inactive: true,
      position: { referencePanel: 'files', direction: 'within' } },
    { id: 'fileInspector', title: 'File Inspector', component: FileInspectorPanel,
      position: { referencePanel: 'files', direction: 'below' } },

    { id: 'terminal', title: 'Terminal', component: Terminal, renderer: 'always',
      position: { referencePanel: 'home', direction: 'below' }, initialHeight: 240,
      inputs: { showInput: true, hideStartupOutput: true } },
    { id: 'console', title: 'Console', component: Terminal, renderer: 'always', inactive: true,
      position: { referencePanel: 'terminal', direction: 'within' },
      inputs: { showInput: false, hideStartupOutput: false } },
  ];

  constructor() {
    // Runs once the dock exists AND a request is pending, so a request made
    // just before navigating here is still picked up.
    effect(() => {
      const api = this.api();
      const req = this.tabs.request();
      if (!api || !req) return;
      untracked(() => {
        this.open(api, req);
        this.tabs.consume();
      });
    });

    this.explorer.renamed$.pipe(takeUntilDestroyed()).subscribe(({ from, to }) => this.onRenamed(from, to));
  }

  protected onReady(api: DockviewApi): void {
    this.api.set(api);
  }

  private open(api: DockviewApi, req: OpenRequest): void {
    const spec = req.kind === 'scene'
      ? {
          id: `scene:${req.id}`,
          params: { sceneId: req.id },
          same: (p: IDockviewPanel) => p.id === `scene:${req.id}`,
        }
      : {
          id: `file:${crypto.randomUUID()}`,   // not path-based, so a rename can't break the id
          params: { path: req.path },
          same: (p: IDockviewPanel) =>
            p.id.startsWith('file:') && samePath(String(p.params?.['path'] ?? ''), req.path),
        };

    const existing = api.panels.find(spec.same);
    if (existing) {
      existing.api.setActive();
      return;
    }

    // Join the group that already holds editor tabs (or the home placeholder).
    const anchor = api.panels.find(p => EDITOR_PANEL.test(p.id)) ?? api.getPanel('home');
    const position = anchor
      ? { referenceGroup: anchor.group, direction: 'within' as const }
      : api.getPanel('terminal')
        ? { referencePanel: 'terminal', direction: 'above' as const }
        : api.getPanel('files')
          ? { referencePanel: 'files', direction: 'left' as const }
          : undefined;

    api.addPanel({
      id: spec.id,
      component: req.kind,
      title: req.title,
      params: spec.params,
      renderer: 'always',
      position,
    });

    api.getPanel('home')?.api.close();
  }

  /** An open file that gets renamed keeps its tab, otherwise autosave would recreate the old path. */
  private onRenamed(from: string, to: string): void {
    const api = this.api();
    if (!api) return;
    for (const p of api.panels) {
      if (p.id.startsWith('file:') && samePath(String(p.params?.['path'] ?? ''), from)) {
        p.api.updateParameters({ path: to });
        p.api.setTitle(to.replace(/^.*[\\/]/, ''));
      }
    }
  }
}