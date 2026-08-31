import { Component, ElementRef, OnInit, OnDestroy, ViewChild, inject, NgZone } from '@angular/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { EngineBridgeService } from '../../services/engine/engine-bridge.service';

@Component({
  selector: 'app-viewport3d',
  templateUrl: './viewport3d.html',
  styleUrl: './viewport3d.css'
})
export class Viewport3D implements OnInit, OnDestroy {
  @ViewChild('viewportContainer', { static: true }) viewportContainer!: ElementRef<HTMLDivElement>;

  private resizeObserver!: ResizeObserver;
  private engineBridge = inject(EngineBridgeService);
  private zone = inject(NgZone);
  private initPollInterval: any = null;
  private unlistenWindowResize?: () => void;

  async ngOnInit(): Promise<void> {
    try {
      await this.engineBridge.initializeEngine();
    } catch (err) {
      console.error('Failed to launch C# engine:', err);
    }

    this.zone.runOutsideAngular(async () => {
      // 1. Observe div size changes directly without requestAnimationFrame
      this.resizeObserver = new ResizeObserver(() => {
        this.syncBounds();
      });

      if (this.viewportContainer?.nativeElement) {
        this.resizeObserver.observe(this.viewportContainer.nativeElement);
      }

      window.addEventListener('resize', this.syncBounds);

      // 2. Tauri Native Window Resize Listener (Bypasses WebView2 drag pause)
      const appWindow = getCurrentWindow();
      this.unlistenWindowResize = await appWindow.onResized(() => {
        this.syncBounds();
      });

      // 3. Init poll to catch the C# window attach
      let elapsed = 0;
      this.initPollInterval = setInterval(() => {
        this.syncBounds();
        elapsed += 250;
        if (elapsed >= 5000) {
          clearInterval(this.initPollInterval);
          this.initPollInterval = null;
        }
      }, 250);
    });

    this.syncBounds();
  }

  // Changed to an arrow function so it can be passed directly as a listener
  private syncBounds = (): void => {
    if (!this.viewportContainer?.nativeElement) return;

    const rect = this.viewportContainer.nativeElement.getBoundingClientRect();

    this.engineBridge.updateViewportBounds(
      Math.round(rect.left),
      Math.round(rect.top),
      Math.round(rect.width),
      Math.round(rect.height)
    );
  };

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.syncBounds);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.initPollInterval) {
      clearInterval(this.initPollInterval);
    }
    if (this.unlistenWindowResize) {
      this.unlistenWindowResize();
    }
  }
}