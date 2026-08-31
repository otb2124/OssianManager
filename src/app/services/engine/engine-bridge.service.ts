import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { Observable, of } from 'rxjs';

export const ENGINE_PATH = `C:\\Users\\orest\\Downloads\\pojects\\OssianForge\\bin\\Debug\\net8.0\\OssianForge.exe`;

@Injectable({
  providedIn: 'root',
})
export class EngineBridgeService {

  /**
   * Spawns the C# engine process using the provided path or default ENGINE_PATH.
   */
  async spawnEngine(path: string = ENGINE_PATH): Promise<void> {
    try {
      // Must pass { exePath } so Tauri maps it to Rust's `exe_path` parameter
      await invoke('spawn_engine_process', { exePath: path });
      console.log('[EngineService] C# Engine initialized.');
    } catch (err) {
      console.error('[EngineService] Failed to spawn engine:', err);
    }
  }

  /**
   * Toggles the C# engine window visibility.
   */
  async setVisibility(visible: boolean): Promise<void> {
    try {
      await invoke('set_engine_visibility', { visible });
    } catch (err) {
      console.error('[EngineService] Visibility toggle failed:', err);
    }
  }

  /**
   * Updates the engine viewport position and dimensions.
   */
  async updateBounds(x: number, y: number, width: number, height: number): Promise<void> {
    try {
      await invoke('update_viewport_bounds', {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height)
      });
    } catch (err) {
      console.error('[EngineService] Bounds update failed:', err);
    }
  }

  load(): Observable<boolean> {
    return of(true);
  }
}