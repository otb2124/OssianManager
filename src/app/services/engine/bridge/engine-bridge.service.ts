import { Injectable, inject } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { Observable, of } from 'rxjs';
import { AppConfigService } from '../../data/app-config/app-config.service';
import { NotificationService } from '../../notifications/notification.service';

@Injectable({
  providedIn: 'root',
})
export class EngineBridgeService {
  private readonly appConfig = inject(AppConfigService);
  private readonly notifications = inject(NotificationService);

  /**
   * Spawns the C# engine process. `path` defaults to `engineProjectPath` from app.json, which can be
   * the engine executable itself or a folder (the Rust side resolves the executable inside it).
   * Returns true when the process was launched.
   */
  async spawnEngine(path: string | null = this.appConfig.engineProjectPath()): Promise<boolean> {
    if (!path) {
      console.warn('[EngineService] No engineProjectPath in app.json; engine not started.');
      return false;
    }

    try {
      // Must pass { exePath } so Tauri maps it to Rust's `exe_path` parameter
      await invoke('spawn_engine_process', { exePath: path });
      console.log('[EngineService] C# Engine initialized.');
      return true;
    } catch (err) {
      console.error('[EngineService] Failed to spawn engine:', err);
      this.notifications.error('Could not start the engine', String(err));
      return false;
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