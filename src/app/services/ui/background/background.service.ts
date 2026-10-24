import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { ThemeService } from '../../theme/theme.service';
import {
  ShaderDef, UniformValues, defaultValues, uniformFields,
} from '../../../model/shader.model';
import { AURORA, COSMOS, SHADER_PRESETS } from '../../../model/shader.presets';
import { AppConfigService } from '../../data/app-config/app-config.service';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

@Injectable({ providedIn: 'root' })
export class BackgroundService {
  private readonly theme = inject(ThemeService);
  private readonly appConfig = inject(AppConfigService);

  // ── state ──────────────────────────────────────────────────────────────
  private readonly _presets = signal<Record<string, ShaderDef>>({ ...SHADER_PRESETS });
  private readonly _shader = signal<ShaderDef>(COSMOS);
  private readonly _values = signal<UniformValues>(defaultValues(COSMOS));
  private readonly _enabled = signal(true);
  private readonly _speed = signal(1);
  private readonly _quality = signal(0.6);
  private readonly _dim = signal(0.25);
  private readonly _error = signal<string | null>(null);

  readonly presets = this._presets.asReadonly();
  readonly shader = this._shader.asReadonly();
  readonly values = this._values.asReadonly();
  readonly enabled = this._enabled.asReadonly();
  readonly speed = this._speed.asReadonly();
  readonly quality = this._quality.asReadonly();
  /** 0..1 black overlay on top of the shader, for text readability. */
  readonly dim = this._dim.asReadonly();
  readonly error = this._error.asReadonly();

  readonly themeColor = this.theme.themeColor;
  /** FieldConfig[] for the current shader, ready for <app-field-list>. */
  readonly fields = computed(() => uniformFields(this._shader()));

  constructor() {
    effect(() => {
      const id = this.appConfig.backgroundPreset();
      const bg = this.appConfig.background();
      untracked(() => {
        if (bg) {
          this._enabled.set(bg.enabled);
          this._speed.set(clamp(bg.speed, 0, 10));
          this._quality.set(clamp(bg.quality, 0.25, 1.5));
          this._dim.set(clamp(bg.dim, 0, 1));
        }
        if (id && this._shader().id !== id) this.setShader(id, (bg?.values[id] ?? {}) as UniformValues);
      });
    });
  }

  // ── shader selection ───────────────────────────────────────────────────

  /** Switch by preset id, or pass a ShaderDef directly (it gets registered as a preset). */
  setShader(ref: string | ShaderDef, overrides: UniformValues = {}): boolean {
    let def: ShaderDef | undefined;
    if (typeof ref === 'string') {
      def = this._presets()[ref];
      if (!def) { console.warn(`[Background] Unknown shader "${ref}"`); return false; }
    } else {
      def = ref;
      this.register(def);
    }
    this._shader.set(def);
    this._values.set({ ...defaultValues(def), ...overrides });
    return true;
  }

  /** Add or replace a preset without switching to it. */
  register(def: ShaderDef): void {
    this._presets.update(p => ({ ...p, [def.id]: def }));
  }

  // ── uniform values ─────────────────────────────────────────────────────

  setValue(name: string, value: unknown): void {
    if (!(name in (this._shader().uniforms ?? {}))) {
      console.warn(`[Background] "${name}" is not a uniform of shader "${this._shader().id}"`);
      return;
    }
    this._values.update(v => ({ ...v, [name]: value }));
  }

  patch(partial: UniformValues): void {
    const known = this._shader().uniforms ?? {};
    const accepted = Object.fromEntries(Object.entries(partial).filter(([k]) => k in known));
    this._values.update(v => ({ ...v, ...accepted }));
  }

  /** For <app-field-list> (modelChange): replaces all values with a copy. */
  setValues(values: UniformValues): void {
    this._values.set({ ...values });
  }

  resetValues(): void {
    this._values.set(defaultValues(this._shader()));
  }

  // ── display options ────────────────────────────────────────────────────

  setEnabled(on: boolean): void { this._enabled.set(on); }
  toggle(): void { this._enabled.update(v => !v); }
  setSpeed(v: number): void { this._speed.set(clamp(v, 0, 10)); }       // 0 = frozen
  setQuality(v: number): void { this._quality.set(clamp(v, 0.25, 1.5)); }
  setDim(v: number): void { this._dim.set(clamp(v, 0, 1)); }

  /** Called by the component; keeps the last compile error readable from anywhere. */
  reportError(message: string | null): void { this._error.set(message); }
}