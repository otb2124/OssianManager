import { Component } from '@angular/core';
import { HierarchyPanel } from "../../../components/hierarchy-panel/hierarchy-panel";
import { InspectorPanel } from "../../../components/inspector-panel/inspector-panel";
import { FileExplorerPanel } from "../../../components/file-tree-panel/file-tree-panel";
import { FileInspectorPanel } from "../../../components/file-inspector-panel/file-inspector-panel";
import { Workspaces } from "../../../components/workspaces/workspaces";

@Component({
  selector: 'app-scene-page',
  imports: [HierarchyPanel, InspectorPanel, FileExplorerPanel, FileInspectorPanel, Workspaces],
  templateUrl: './scene-page.html',
  styleUrl: './scene-page.css',
})
export class ScenePage {

}
