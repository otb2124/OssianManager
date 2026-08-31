import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';

@Injectable({
  providedIn: 'root',
})
export class EngineBridgeService {
  private readonly ENGINE_PATH = `C:\\Users\\orest\\Downloads\\pojects\\OssianForge\\bin\\Debug\\net8.0\\OssianForge.exe`;

  async initializeEngine(): Promise<void> {
    await invoke('spawn_engine_process', { exePath: this.ENGINE_PATH });
  }

  async updateViewportBounds(x: number, y: number, width: number, height: number): Promise<void> {
    await invoke('update_viewport_bounds', {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    });
  }
}