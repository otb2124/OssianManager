import { Component } from '@angular/core';
import { Viewport3d } from "../../../components/viewport3d/viewport3d";
import { HierarchyPanel } from "../../../components/hierarchy-panel/hierarchy-panel";
import { InspectorPanel } from "../../../components/inspector-panel/inspector-panel";
import { FileExplorerPanel } from "../../../components/file-tree-panel/file-tree-panel";
import { SplitterModule, Splitter } from 'primeng/splitter';

@Component({
  selector: 'app-scene-page',
  imports: [Viewport3d, HierarchyPanel, InspectorPanel, FileExplorerPanel, SplitterModule, Splitter],
  templateUrl: './scene-page.html',
  styleUrl: './scene-page.css',
})
export class ScenePage {

}
