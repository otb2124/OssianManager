import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PersistenceService } from '../../../persistence/persistence.service';
import { EngineService } from '../../engine-config/engine.service';
import { ResourceCatalogService } from '../../resources/resource-catalog.service';


export interface SceneInfo {
  /** Resource id, e.g. "configfile.scene.player". This is what scene.load takes. */
  id: string;
  /** Display name from the scene file (falls back to the resource id). */
  name: string;
  /** Path relative to Content/, as written in resources.json. */
  file: string | null;
  /** Resource ids of scenes referenced through SceneReferenceProperty. */
  refs: string[];
  /** Referenced but not in resources.json, or the file could not be read. */
  missing: boolean;
}

interface SceneFileNode {
  id?: string;
  name?: string;
  properties?: { type: string; data?: unknown[] }[];
  children?: SceneFileNode[];
}

const SCENE_TYPE = 'configfile.scene';
const SCENE_REF = 'SceneReferenceProperty';

function collectRefs(node: SceneFileNode, out: Set<string>): void {
  for (const p of node.properties ?? []) {
    const target = p.data?.[0];
    if (p.type === SCENE_REF && typeof target === 'string') out.add(target);
  }
  for (const child of node.children ?? []) collectRefs(child, out);
}

/** Scenes of the open project, read from resources.json and the scene files themselves. */
@Injectable({ providedIn: 'root' })
export class SceneCatalogService {
  private readonly catalog = inject(ResourceCatalogService);
  private readonly persistence = inject(PersistenceService);
  private readonly engine = inject(EngineService);

  private readonly _scenes = signal<SceneInfo[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly scenes = this._scenes.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** The scene the engine loads first (mainScene in the project's tree.json). */
  readonly mainSceneId = computed(() => this.engine.config()?.mainScene ?? null);

  private token = 0;

  constructor() {
    effect(() => {
      const entries = this.catalog.entries();   // reload when the project / resources.json changes
      untracked(() => void this.load(entries.filter(e => e.type === SCENE_TYPE)));
    });
  }

  reload(): void {
    this.catalog.reload();
  }

  private async load(sceneEntries: ReturnType<ResourceCatalogService['entries']>): Promise<void> {
    const token = ++this.token;

    if (!sceneEntries.length) {
      this._scenes.set([]);
      this._error.set(null);
      this._loading.set(false);
      return;
    }

    this._loading.set(true);
    const errors: string[] = [];

    const read = await Promise.all(sceneEntries.map(async (entry): Promise<SceneInfo> => {
      const file = typeof entry.data?.[0] === 'string' ? entry.data[0] : null;
      const absolute = file ? this.catalog.contentPath(file) : null;
      const info: SceneInfo = { id: entry.id, name: entry.id, file, refs: [], missing: true };
      if (!absolute) return info;

      try {
        const root = await firstValueFrom(this.persistence.readAbsolute<SceneFileNode>(absolute));
        const refs = new Set<string>();
        collectRefs(root, refs);
        return { ...info, name: root.name || root.id || entry.id, refs: [...refs], missing: false };
      } catch (err) {
        errors.push(`${file}: ${String(err)}`);
        return info;
      }
    }));

    if (token !== this.token) return;   // a newer load superseded this one

    // Scenes that are referenced but not defined in resources.json.
    const known = new Set(read.map(s => s.id));
    const placeholders: SceneInfo[] = [];
    for (const ref of new Set(read.flatMap(s => s.refs))) {
      if (!known.has(ref)) {
        known.add(ref);
        placeholders.push({ id: ref, name: ref, file: null, refs: [], missing: true });
      }
    }

    this._scenes.set([...read, ...placeholders]);
    this._error.set(errors.length ? errors.join('\n') : null);
    this._loading.set(false);
  }
}