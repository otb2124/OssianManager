import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { EngineBridgeService } from '../../services/engine/engine-bridge.service';

@Component({
  selector: 'app-viewport3d',
  template: `<div #container class="viewport-container"></div>`,
  styleUrl: './viewport3d.css'
})
export class Viewport3D implements AfterViewInit, OnDestroy {
  @ViewChild('container') container?: ElementRef<HTMLDivElement>;

  private engineBridgeService = inject(EngineBridgeService);
  private resizeObserver?: ResizeObserver;

  async ngAfterViewInit(): Promise<void> {
    console.log('[Viewport3D] Component mounted. Enabling visibility...');
    
    // 1. Force visibility true first so Rust knows to show the HWND
    await this.engineBridgeService.setVisibility(true);

    // 2. Attach resize tracking once DOM container exists
    if (this.container?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => this.updateBounds());
      this.resizeObserver.observe(this.container.nativeElement);

      // Wait 1 animation frame for browser layout calculation after @switch insertion
      requestAnimationFrame(() => {
        this.updateBounds();
      });
    } else {
      console.warn('[Viewport3D] #container element not found in DOM.');
    }
  }

  async ngOnDestroy(): Promise<void> {
    console.log('[Viewport3D] Component destroyed. Hiding engine...');
    this.resizeObserver?.disconnect();
    await this.engineBridgeService.setVisibility(false);
  }

  private updateBounds(): void {
    if (!this.container?.nativeElement) return;

    const rect = this.container.nativeElement.getBoundingClientRect();
    
    // Avoid sending 0x0 bounds during layout shifts
    if (rect.width > 0 && rect.height > 0) {
      this.engineBridgeService.updateBounds(rect.left, rect.top, rect.width, rect.height);
    }
  }
}