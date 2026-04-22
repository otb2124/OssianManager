import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { AppConfigService } from '../app-config/app-config.service';
import { ProjectService } from '../projects/project.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private projectService = inject(ProjectService);
  private appConfigService = inject(AppConfigService);

  private readonly _themeColor = signal<string>('#ffffff');
  readonly themeColor = this._themeColor.asReadonly();

  readonly themeColorMuted = computed(() => this.withOpacity(this._themeColor(), 0.15));
  readonly themeColorBorder = computed(() => this.withOpacity(this._themeColor(), 0.3));
  readonly themeColorGlow = computed(() => this.withOpacity(this._themeColor(), 0.08));

  readonly borderStyle = computed(() => ({ 'border-color': this._themeColor() }));
  readonly bgStyle = computed(() => ({ 'background-color': this._themeColor() }));
  readonly bgMutedStyle = computed(() => ({ 'background-color': this.themeColorMuted() }));
  readonly textStyle = computed(() => ({ 'color': this._themeColor() }));
  readonly glowStyle = computed(() => ({ 'box-shadow': `0 0 20px ${this.themeColorGlow()}` }));

  constructor() {
    effect(() => {
      const projectColor = this.projectService.currentProject()?.color;
      const fallback = this.appConfigService.themeColor() ?? '#ffffff';
      this.setColor(projectColor ?? fallback);
    });
  }

  setColor(color: string): void {
    this._themeColor.set(color);
    this.applyToDom(color);
  }

  private applyToDom(color: string): void {
    document.documentElement.style.setProperty('--theme-color', color);
    document.documentElement.style.setProperty('--theme-color-muted', this.withOpacity(color, 0.15));
    document.documentElement.style.setProperty('--theme-color-border', this.withOpacity(color, 0.3));
    document.documentElement.style.setProperty('--theme-color-glow', this.withOpacity(color, 0.08));

    const { r, g, b } = this.hexToRgb(color);

    document.documentElement.style.setProperty('--p-primary-50',  this.lighten(r, g, b, 0.95));
    document.documentElement.style.setProperty('--p-primary-100', this.lighten(r, g, b, 0.85));
    document.documentElement.style.setProperty('--p-primary-200', this.lighten(r, g, b, 0.70));
    document.documentElement.style.setProperty('--p-primary-300', this.lighten(r, g, b, 0.55));
    document.documentElement.style.setProperty('--p-primary-400', this.lighten(r, g, b, 0.35));
    document.documentElement.style.setProperty('--p-primary-500', color);
    document.documentElement.style.setProperty('--p-primary-600', this.darken(r, g, b, 0.10));
    document.documentElement.style.setProperty('--p-primary-700', this.darken(r, g, b, 0.20));
    document.documentElement.style.setProperty('--p-primary-800', this.darken(r, g, b, 0.35));
    document.documentElement.style.setProperty('--p-primary-900', this.darken(r, g, b, 0.50));
    document.documentElement.style.setProperty('--p-primary-950', this.darken(r, g, b, 0.65));

    document.documentElement.style.setProperty('--p-primary-color', color);
    document.documentElement.style.setProperty('--p-primary-contrast-color', '#ffffff');
    document.documentElement.style.setProperty('--p-primary-hover-color', this.darken(r, g, b, 0.10));
    document.documentElement.style.setProperty('--p-primary-active-color', this.darken(r, g, b, 0.20));
    document.documentElement.style.setProperty('--p-button-primary-background', color);
    document.documentElement.style.setProperty('--p-button-primary-hover-background', this.darken(r, g, b, 0.10));
    document.documentElement.style.setProperty('--p-button-primary-active-background', this.darken(r, g, b, 0.20));
    document.documentElement.style.setProperty('--p-button-primary-border-color', color);
    document.documentElement.style.setProperty('--p-button-primary-hover-border-color', this.darken(r, g, b, 0.10));
    document.documentElement.style.setProperty('--p-button-primary-active-border-color', this.darken(r, g, b, 0.20));
    document.documentElement.style.setProperty('--p-focus-ring-color', this.withOpacity(color, 0.4));
  }

  private withOpacity(hex: string, opacity: number): string {
    const { r, g, b } = this.hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  }

  private lighten(r: number, g: number, b: number, amount: number): string {
    const mix = (c: number) => Math.round(c + (255 - c) * amount);
    return this.toHex(mix(r), mix(g), mix(b));
  }

  private darken(r: number, g: number, b: number, amount: number): string {
    const mix = (c: number) => Math.round(c * (1 - amount));
    return this.toHex(mix(r), mix(g), mix(b));
  }

  private toHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }
}