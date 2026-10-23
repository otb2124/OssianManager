import { Component, inject } from '@angular/core';
import { InspectorPanel } from "../../components/editor/inspector-panel/inspector-panel";
import { FileExplorerPanel } from "../../components/editor/file-tree-panel/file-tree-panel";
import { FileInspectorPanel } from "../../components/editor/file-inspector-panel/file-inspector-panel";
import { HierarchyPanel } from '../../components/editor/hierarchy-panel/hierarchy-panel';
import { Viewport3D } from '../../components/editor/viewport3d/viewport3d';
import { ScriptEditor } from '../../components/editor/script-editor/script-editor';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { DockPanelDef, DockGrid } from '../../components/layout/dock-grid/dock-grid';
import { Terminal } from '../../components/editor/terminal/terminal';

/** The Render tab was only an empty placeholder in Workspaces, so it gets a tiny placeholder component. */
@Component({
  selector: 'app-render-view',
  template: `<div class="h-full w-full bg-neutral-900"></div>`,
})
export class RenderView {}

@Component({
  selector: 'app-scene-page',
  imports: [DockGrid],
  templateUrl: './scene-page.html',
  styleUrl: './scene-page.css',
  host: { class: 'block h-full w-full' },
})
export class ScenePage {
  private route = inject(ActivatedRoute);

  readonly sceneId = toSignal(
    this.route.paramMap.pipe(map(p => p.get('id'))),
    { initialValue: null }
  );

  protected readonly panels: DockPanelDef[] = [
    { id: 'viewport3d', title: '3D', component: Viewport3D, renderer: 'always' },
    { id: 'script', title: 'Script', component: ScriptEditor, inactive: true,
      position: { referencePanel: 'viewport3d', direction: 'within' } },
    { id: 'render', title: 'Render', component: RenderView, inactive: true,
      position: { referencePanel: 'viewport3d', direction: 'within' } },

    { id: 'hierarchy', title: 'Hierarchy', component: HierarchyPanel,
      position: { referencePanel: 'viewport3d', direction: 'left' }, initialWidth: 320 },
    { id: 'inspector', title: 'Inspector', component: InspectorPanel,
      position: { referencePanel: 'hierarchy', direction: 'below' } },
    { id: 'files', title: 'Files', component: FileExplorerPanel,
      position: { referencePanel: 'viewport3d', direction: 'right' }, initialWidth: 320 },
    { id: 'fileInspector', title: 'File Inspector', component: FileInspectorPanel,
      position: { referencePanel: 'files', direction: 'below' } },

    { id: 'terminal', title: 'Terminal', component: Terminal, renderer: 'always',
      position: { referencePanel: 'viewport3d', direction: 'below' }, initialHeight: 240,
      inputs: { showInput: true, hideStartupOutput: true } },
    { id: 'console', title: 'Console', component: Terminal, renderer: 'always', inactive: true,
      position: { referencePanel: 'terminal', direction: 'within' },
      inputs: { showInput: false, hideStartupOutput: false } },
  ];
}