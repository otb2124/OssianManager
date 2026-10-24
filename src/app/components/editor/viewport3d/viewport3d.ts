import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, input, effect, untracked } from '@angular/core';
import { EngineBridgeService } from '../../../services/engine/bridge/engine-bridge.service';
import { EngineIpcService } from '../../../services/engine/ipc/engine-ipc';
import { NotificationService } from '../../../services/notifications/notification.service';

@Component({
  selector: 'app-viewport3d',
  template: `<div #container class="viewport-container"></div>`,
  styleUrl: './viewport3d.css'
})
export class Viewport3D implements AfterViewInit, OnDestroy {
  @ViewChild('container') container?: ElementRef<HTMLDivElement>;

  private readonly engine = inject(EngineIpcService);
private readonly notifications = inject(NotificationService);

  /** Scene this tab belongs to (dock panel param). */
  readonly sceneId = input<string | null>(null);

  private readonly bridge = inject(EngineBridgeService);
  private resizeObserver?: ResizeObserver;
  private raf = 0;
  private lastKey = '';
  private visible = false;
  private pendingShow = false;

  private readonly track = () => {
    const el = this.container?.nativeElement;
    if (el) {
      const r = el.getBoundingClientRect();
      const shown = el.isConnected && r.width > 0 && r.height > 0;

      if (shown) {
        if (!this.visible) {                       // hidden -> shown: take over the engine window
          this.visible = true;
          this.lastKey = '';
          this.pendingShow = true;
          this.bridge.claimViewport(this);
          this.activateScene();
        }
        if (this.bridge.isViewportOwner(this)) {
          const key = `${r.left}|${r.top}|${r.width}|${r.height}`;
          if (key !== this.lastKey) { this.lastKey = key; this.updateBounds(); }
          if (this.pendingShow) {                  // bounds first, then show: no flash at the old position
            this.pendingShow = false;
            void this.bridge.setVisibility(true);
          }
        }
      } else if (this.visible) {
        this.visible = false;
        this.pendingShow = false;
        this.lastKey = '';
        this.bridge.releaseViewport(this);
      }
    }
    this.raf = requestAnimationFrame(this.track);
  };

  constructor() {
    effect(() => {
      this.engine.connected();
      this.sceneId();
      untracked(() => this.activateScene());
    });
  }

  private activateScene(): void {
    const id = this.sceneId();
    if (!id || !this.visible || !this.engine.connected()) return;
    if (this.engine.currentSceneId() === id) return;
    this.engine.loadScene(id).catch(err =>
      this.notifications.error(`Could not load scene '${id}'`, String(err)));
  }

  async ngAfterViewInit(): Promise<void> {
    this.raf = requestAnimationFrame(this.track);
    if (this.container?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => this.updateBounds());
      this.resizeObserver.observe(this.container.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    cancelAnimationFrame(this.raf);
    this.bridge.releaseViewport(this);
  }

  private updateBounds(): void {
    if (!this.container?.nativeElement || !this.bridge.isViewportOwner(this)) return;
    const rect = this.container.nativeElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      void this.bridge.updateBounds(rect.left, rect.top, rect.width, rect.height);
    }
  }
}