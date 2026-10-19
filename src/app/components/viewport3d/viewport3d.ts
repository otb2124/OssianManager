import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { EngineBridgeService } from '../../services/engine/bridge/engine-bridge.service';

@Component({
  selector: 'app-viewport3d',
  template: `<div #container class="viewport-container"></div>`,
  styleUrl: './viewport3d.css'
})
export class Viewport3D implements AfterViewInit, OnDestroy {
  @ViewChild('container') container?: ElementRef<HTMLDivElement>;

  private engineBridgeService = inject(EngineBridgeService);
  private resizeObserver?: ResizeObserver;

  private raf = 0;
  private lastKey = '';

  private visible = false;
  
  private readonly track = () => {
    const el = this.container?.nativeElement;
    if (el) {
      const r = el.getBoundingClientRect();
      // Hidden tab (display:none) or detached element => 0x0
      const shown = el.isConnected && r.width > 0 && r.height > 0;
  
      if (shown) {
        const key = `${r.left}|${r.top}|${r.width}|${r.height}`;
        if (key !== this.lastKey) { this.lastKey = key; this.updateBounds(); }
        if (!this.visible) { this.visible = true; void this.engineBridgeService.setVisibility(true); }
      } else if (this.visible) {
        this.visible = false;
        this.lastKey = ''; // resend bounds when it comes back
        void this.engineBridgeService.setVisibility(false);
      }
    }
    this.raf = requestAnimationFrame(this.track);
  };

  async ngAfterViewInit(): Promise<void> {

    this.raf = requestAnimationFrame(this.track);
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
    cancelAnimationFrame(this.raf);
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