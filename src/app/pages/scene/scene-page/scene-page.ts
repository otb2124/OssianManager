import { Component, inject } from '@angular/core';
import { InspectorPanel } from "../../../components/inspector-panel/inspector-panel";
import { FileExplorerPanel } from "../../../components/file-tree-panel/file-tree-panel";
import { FileInspectorPanel } from "../../../components/file-inspector-panel/file-inspector-panel";
import { Workspaces } from "../../../components/workspaces/workspaces";
import { HierarchyPanel } from '../../../components/hierarchy-panel/hierarchy-panel';
import { ConsolePanel } from '../../../components/console-panel/console-panel';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { DockPanelDef, DockGrid } from '../../../components/dock-grid/dock-grid';

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
    { id: 'workspaces', title: 'Workspaces', component: Workspaces, renderer: 'always' },
    { id: 'hierarchy', title: 'Hierarchy', component: HierarchyPanel,
      position: { referencePanel: 'workspaces', direction: 'left' }, initialWidth: 320 },
    { id: 'inspector', title: 'Inspector', component: InspectorPanel,
      position: { referencePanel: 'hierarchy', direction: 'below' } },
    { id: 'files', title: 'Files', component: FileExplorerPanel,
      position: { referencePanel: 'workspaces', direction: 'right' }, initialWidth: 320 },
    { id: 'fileInspector', title: 'File Inspector', component: FileInspectorPanel,
      position: { referencePanel: 'files', direction: 'below' } },
    { id: 'console', title: 'Console', component: ConsolePanel,
      position: { referencePanel: 'workspaces', direction: 'below' }, initialHeight: 240 },
  ];
}