import { Component, computed, inject } from '@angular/core';
import { GraphEditor } from '../../components/editor/graph-editor/graph-editor';
import { GraphConfig, GraphEdge, GraphModel, GraphNode } from '../../model/graph.model';
import { AppConfigService } from '../../services/data/app-config/app-config.service';
import { ProjectService } from '../../services/data/projects/project.service';
import { EngineIpcService } from '../../services/engine/ipc/engine-ipc';
import { EditorTabsService } from '../../services/editor/editor-tabs/editor-tabs.service';
import { SceneCatalogService, SceneInfo } from '../../services/data/scenes/scene-catalog/scene-catalog.service';

@Component({
  selector: 'app-graph-page',
  imports: [GraphEditor],
  templateUrl: './graph-page.html',
  styleUrl: './graph-page.css',
})
export class GraphPage {
  private readonly editorTabs = inject(EditorTabsService);
  private readonly project = inject(ProjectService);
  private readonly appConfig = inject(AppConfigService);
  private readonly engine = inject(EngineIpcService);
  private readonly scenes = inject(SceneCatalogService);

  config: GraphConfig = SCENE_GRAPH_CONFIG;

  protected readonly model = computed<GraphModel>(() =>
    buildSceneGraph(this.scenes.scenes(), this.scenes.mainSceneId()));

  protected readonly loading = computed(() =>
    !this.project.hasProject() ||
    !this.project.hasConfig() ||
    this.scenes.loading() ||
    (!!this.appConfig.engineProjectPath() && !this.engine.connected())
  );

  protected openScene(node: GraphNode): void {
    if (node.type !== 'scene' || node.values['missing'] === true) return;
    this.editorTabs.openScene(node.id, node.name ?? node.id);
  }
}

export const SCENE_GRAPH_CONFIG: GraphConfig = {
  types: {
    scene: {
      id: 'scene',
      title: 'Scene',
      icon: 'pi pi-sitemap',
      color: '#eb1e92',
      inputs:  [{ id: 'parent',   label: 'Referenced by', dataType: 'scene' }],
      outputs: [{ id: 'children', label: 'References',    dataType: 'scene' }],
    },
  },
  socketColors: { scene: '#eb1e92' },
};

/** Scenes as nodes, scene references as edges; columns are the depth from the main scene. */
function buildSceneGraph(scenes: SceneInfo[], mainId: string | null): GraphModel {
  const byId = new Map(scenes.map(s => [s.id, s]));
  const referenced = new Set(scenes.flatMap(s => s.refs));

  const roots = [
    ...(mainId && byId.has(mainId) ? [mainId] : []),
    ...scenes.map(s => s.id).filter(id => id !== mainId && !referenced.has(id)),
  ];

  const level = new Map<string, number>(roots.map(id => [id, 0]));
  const queue = [...roots];
  while (queue.length) {
    const id = queue.shift()!;
    for (const ref of byId.get(id)?.refs ?? []) {
      if (!level.has(ref)) {
        level.set(ref, level.get(id)! + 1);
        queue.push(ref);
      }
    }
  }
  for (const s of scenes) if (!level.has(s.id)) level.set(s.id, 0);   // cycles with no root

  const rows = new Map<number, number>();
  const nodes: GraphNode[] = scenes.map(s => {
    const col = level.get(s.id)!;
    const row = rows.get(col) ?? 0;
    rows.set(col, row + 1);
    return {
      id: s.id,
      type: 'scene',
      name: s.missing ? `${s.name} (missing)` : s.name,
      position: { x: col * 300, y: row * 140 },
      values: { missing: s.missing },
    };
  });

  const edges: GraphEdge[] = scenes.flatMap(s =>
    s.refs.map(ref => ({
      id: `${s.id}->${ref}`,
      fromNode: s.id, fromSocket: 'children',
      toNode: ref,    toSocket: 'parent',
    })));

  return { nodes, edges };
}