import {
  Component, ElementRef, NgZone, OnDestroy, AfterViewInit,
  effect, inject, input, output, signal, untracked, viewChild,
} from '@angular/core';
import { ShaderDef, UniformDef, UniformValues } from '../../../model/shader.model';

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const glslType = (u: UniformDef) =>
  u.type === 'color' ? 'vec3' : u.type === 'vec2' ? 'vec2' : u.type === 'bool' ? 'bool' : u.type;

function buildFragment(def: ShaderDef): string {
  const decls = Object.entries(def.uniforms ?? {})
    .map(([n, u]) => `uniform ${glslType(u)} ${n};`).join('\n');
  const toy = /\bmainImage\s*\(/.test(def.fragment) && !/void\s+main\s*\(/.test(def.fragment);
  return [
    'precision highp float;',
    'uniform vec2 uRes; uniform float uTime; uniform vec3 uTheme;',
    decls,
    toy ? '#define iResolution vec3(uRes, 1.0)\n#define iTime uTime' : '',
    def.fragment,
    toy ? 'void main(){ vec4 c = vec4(0.0); mainImage(c, gl_FragCoord.xy); gl_FragColor = vec4(c.rgb, 1.0); }' : '',
  ].join('\n');
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').slice(0, 6).padEnd(6, '0');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
}

@Component({
  selector: 'app-shader-background',
  standalone: true,
  host: { class: 'block absolute inset-0 overflow-hidden bg-black pointer-events-none' },
  template: `<canvas #cv class="block size-full"></canvas>`,
})
export class ShaderBackground implements AfterViewInit, OnDestroy {
  readonly shader = input.required<ShaderDef>();
  readonly values = input<UniformValues>({});
  readonly speed = input(1);                 // time multiplier, 0 = frozen
  readonly quality = input(0.75);            // render scale vs CSS pixels
  readonly themeColor = input('#ffffff');   // exposed to GLSL as uTheme

  /** null = compiled fine. Emitted on every (re)compile attempt. */
  readonly compileError = output<string | null>();

  private readonly cv = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');
  private readonly zone = inject(NgZone);
  private readonly ready = signal(false);

  private gl!: WebGLRenderingContext;
  private prog: WebGLProgram | null = null;
  private locs = new Map<string, WebGLUniformLocation | null>();
  private raf = 0;
  private clock = 0;
  private last = 0;
  private visible = true;
  private ro?: ResizeObserver;
  private io?: IntersectionObserver;
  private readonly reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly onVis = () => this.syncLoop();

  constructor() {
    // 1. (Re)compile when the shader definition changes.
    effect(() => {
      if (!this.ready()) return;
      const def = this.shader();
      untracked(() => this.compile(def));
    });
    // 2. Push uniform values when anything feeding them changes.
    effect(() => {
      if (!this.ready()) return;
      this.shader(); this.values(); this.themeColor();
      untracked(() => { this.applyUniforms(); if (!this.raf) this.draw(); });
    });
    // 3. Start/stop the animation loop when speed changes.
    effect(() => {
      if (!this.ready()) return;
      this.speed();
      untracked(() => this.syncLoop());
    });
  }

  ngAfterViewInit(): void {
    const canvas = this.cv().nativeElement;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) { console.warn('[ShaderBackground] WebGL unavailable'); return; }
    this.gl = gl;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    this.resize();
    this.ro = new ResizeObserver(() => { this.resize(); this.draw(); });
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; this.syncLoop(); });
    this.io.observe(canvas);
    document.addEventListener('visibilitychange', this.onVis);

    this.ready.set(true);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.io?.disconnect();
    document.removeEventListener('visibilitychange', this.onVis);
    this.gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }

  // ── compile / uniforms ─────────────────────────────────────────────────

  private compile(def: ShaderDef): void {
    const gl = this.gl;
    try {
      const next = this.link(VERT, buildFragment(def));
      if (this.prog) gl.deleteProgram(this.prog);
      this.prog = next;
      this.locs.clear();
      gl.useProgram(next);

      const loc = gl.getAttribLocation(next, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      this.compileError.emit(null);
      this.applyUniforms();
      this.draw();
    } catch (e) {
      // Keep the previous program running so live editing never blanks the screen.
      this.compileError.emit(String((e as Error).message ?? e));
    }
  }

  private loc(name: string): WebGLUniformLocation | null {
    if (!this.locs.has(name)) this.locs.set(name, this.gl.getUniformLocation(this.prog!, name));
    return this.locs.get(name)!;
  }

  private applyUniforms(): void {
    const gl = this.gl;
    if (!this.prog) return;

    const [tr, tg, tb] = hexToRgb(this.themeColor());
    gl.uniform3f(this.loc('uTheme'), tr, tg, tb);

    const vals = this.values();
    for (const [name, u] of Object.entries(this.shader().uniforms ?? {})) {
      const l = this.loc(name);
      if (!l) continue;                       // optimized out by the GLSL compiler
      const v = vals[name] ?? u.default;
      switch (u.type) {
        case 'float': gl.uniform1f(l, Number(v)); break;
        case 'int':   gl.uniform1i(l, Math.round(Number(v))); break;
        case 'bool':  gl.uniform1i(l, v ? 1 : 0); break;
        case 'vec2':  { const o = v as { x: number; y: number }; gl.uniform2f(l, o.x, o.y); break; }
        case 'color': { const [r, g, b] = hexToRgb(String(v)); gl.uniform3f(l, r, g, b); break; }
      }
    }
  }

  // ── render loop (outside Angular so frames never trigger change detection) ──

  private syncLoop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    const animate = this.visible && !document.hidden && !this.reduceMotion && this.speed() > 0;
    if (!animate) return;
    this.last = performance.now();
    this.zone.runOutsideAngular(() => {
      const tick = (now: number) => {
        this.clock += ((now - this.last) / 1000) * this.speed();
        this.last = now;
        this.draw();
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    });
  }

  private draw(): void {
    const gl = this.gl;
    if (!gl || !this.prog) return;
    gl.uniform2f(this.loc('uRes'), gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform1f(this.loc('uTime'), this.clock);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private resize(): void {
    const c = this.cv().nativeElement;
    const scale = Math.min(window.devicePixelRatio || 1, 2) * this.quality();
    const w = Math.max(1, Math.round(c.clientWidth * scale));
    const h = Math.max(1, Math.round(c.clientHeight * scale));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; this.gl.viewport(0, 0, w, h); }
  }

  private link(vs: string, fs: string): WebGLProgram {
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(s) ?? 'shader error';
        gl.deleteShader(s);
        throw new Error(log);
      }
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link error');
    return p;
  }
}