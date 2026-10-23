import { Injectable, computed, inject, signal } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { AppConfigService } from '../../app-config/app-config.service';

/** Absolute paths of the engine and its side tool, resolved by Rust (tools.rs). */
export interface ToolsLayout {
  engineDir: string;
  engineExe: string;
  /** <engineDir>\Ossian.ini: what the engine reads at startup (cwd = exe folder when spawned). */
  ossianIni: string;
  /** null when <engineDir>\OssianTools\OssianTools.exe does not exist. */
  toolsExe: string | null;
}

@Injectable({ providedIn: 'root' })
export class OssianToolsService {
  private readonly appConfig = inject(AppConfigService);

  private readonly _layout = signal<ToolsLayout | null>(null);
  readonly layout = this._layout.asReadonly();
  readonly hasTools = computed(() => !!this._layout()?.toolsExe);

  /** Re-reads the layout from disk (the engine folder may have been rebuilt). Null when it cannot be found. */
  async resolve(): Promise<ToolsLayout | null> {
    const enginePath = this.appConfig.engineProjectPath();
    if (!enginePath) {
      this._layout.set(null);
      return null;
    }

    try {
      const layout = await invoke<ToolsLayout>('ossian_tools_layout', { enginePath });
      this._layout.set(layout);
      return layout;
    } catch (err) {
      console.warn('[OssianTools] engine layout not available:', err);
      this._layout.set(null);
      return null;
    }
  }

  async require(): Promise<ToolsLayout> {
    const layout = this._layout() ?? (await this.resolve());
    if (!layout) throw new Error('The engine was not found. Check the engine path in Tools > Settings > Engine.');
    return layout;
  }
}