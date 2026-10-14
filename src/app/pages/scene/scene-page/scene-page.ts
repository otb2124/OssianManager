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

@Component({
  selector: 'app-scene-page',
  imports: [HierarchyPanel, InspectorPanel, FileExplorerPanel, FileInspectorPanel, Workspaces, ConsolePanel],
  templateUrl: './scene-page.html',
  styleUrl: './scene-page.css',
})
export class ScenePage {
  private route = inject(ActivatedRoute);

  readonly sceneId = toSignal(
    this.route.paramMap.pipe(map(p => p.get('id'))),
    { initialValue: null }
  );
}
