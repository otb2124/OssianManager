import { Component } from '@angular/core';
import { GraphEditor } from '../../components/graph-editor/graph-editor';
import { GraphConfig, GraphModel } from '../../model/graph.model';

@Component({
  selector: 'app-graph-page',
  imports: [GraphEditor],
  templateUrl: './graph-page.html',
  styleUrl: './graph-page.css',
})
export class GraphPage {
  config: GraphConfig = SCENE_GRAPH_CONFIG;
  model: GraphModel = SCENE_GRAPH_MODEL; 
}


export const SCENE_GRAPH_CONFIG: GraphConfig = {
  types: {
    scene: {
      id: 'scene',
      title: 'Scene',
      icon: 'pi pi-sitemap',
      color: '#eb1e92',
      inputs:  [{ id: 'parent',   label: 'Parent',   dataType: 'scene' }],
      outputs: [{ id: 'children', label: 'Children', dataType: 'scene', }],
      fields:  [{ kind: 'boolean', path: 'enabled', label: 'Enabled' }],
    },
  },
  socketColors: { scene: '#eb1e92' },
};

export const SCENE_GRAPH_MODEL: GraphModel = {
  nodes: [
    { id: 'tree',            type: 'scene', position: { x: 0,   y: 120 }, values: { enabled: true } },
    { id: 'terrainScene',    type: 'scene', position: { x: 300, y: 120 }, values: { enabled: true } },
    { id: 'playerScene',     type: 'scene', position: { x: 600, y: 20  }, values: { enabled: true } },
    { id: 'freeCameraScene', type: 'scene', position: { x: 600, y: 240 }, values: { enabled: false } },
  ],
  edges: [
    { id: 'e1', fromNode: 'tree',         fromSocket: 'children', toNode: 'terrainScene',    toSocket: 'parent' },
    { id: 'e2', fromNode: 'terrainScene', fromSocket: 'children', toNode: 'playerScene',     toSocket: 'parent' },
    { id: 'e3', fromNode: 'terrainScene', fromSocket: 'children', toNode: 'freeCameraScene', toSocket: 'parent' },
  ],
};