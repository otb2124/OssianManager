import { ShaderDef } from './shader.model';

export const COSMOS: ShaderDef = {
  id: 'cosmos',
  name: 'Cosmos',
  uniforms: {
    uStarAmount: { type: 'float', label: 'Stars',        default: 0.07, min: 0.01, max: 0.3,  step: 0.01 },
    uSwirl:      { type: 'float', label: 'Swirl',        default: 1.8,  min: 0,    max: 6,    step: 0.1 },
    uArms:       { type: 'int',   label: 'Arms',         default: 2,    min: 1,    max: 8 },
    uCore:       { type: 'float', label: 'Core glow',    default: 0.9,  min: 0,    max: 2,    step: 0.05 },
    uTint:       { type: 'color', label: 'Tint',         default: '#ffffff' },
    uTintAmount: { type: 'float', label: 'Tint amount',  default: 0.0,  min: 0,    max: 1,    step: 0.05 },
    uUseTheme:   { type: 'bool',  label: 'Use theme color', default: false },
  },
  fragment: /* glsl */ `
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

float stars(vec2 uv, float density, float size, float th){
  vec2 g = floor(uv * density);
  vec2 f = fract(uv * density) - 0.5;
  float h = hash(g);
  if (h < th) return 0.0;
  vec2 o = (vec2(hash(g + 1.3), hash(g + 7.1)) - 0.5) * 0.6;
  float tw = 0.65 + 0.35 * sin(uTime * (1.0 + h * 4.0) + h * 60.0);
  return smoothstep(size, 0.0, length(f - o)) * tw * ((h - th) / (1.0 - th));
}

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float r = length(uv), a = atan(uv.y, uv.x), t = uTime * 0.03;
  float th = 1.0 - uStarAmount;

  vec2 w = rot(uSwirl / (r + 0.3) + t) * uv;
  float arms = pow(0.5 + 0.5 * cos(float(uArms) * (a + 2.4 * log(r + 0.04)) - t * 6.0), 3.0);

  float s = stars(w + 11.0, 18.0, 0.22, th)
          + stars(w * 1.7 + 53.0, 32.0, 0.18, th) * 0.8
          + stars(w * 2.9 + 97.0, 60.0, 0.15, th) * 0.6;
  s *= 0.55 + 0.9 * (arms * exp(-r * 1.2));

  float v = exp(-r * 6.0) * uCore + exp(-r * 2.2) * arms * 0.22 + s;
  v *= smoothstep(1.4, 0.2, r);
  v += (hash(gl_FragCoord.xy + uTime) - 0.5) / 255.0;   // dither against banding

  vec3 tint = uUseTheme ? uTheme : uTint;
  gl_FragColor = vec4(mix(vec3(v), vec3(v) * tint, uTintAmount), 1.0);
}`,
};

export const AURORA: ShaderDef = {
  id: 'aurora',
  name: 'Aurora waves',
  uniforms: {
    uScale:  { type: 'float', label: 'Scale',   default: 6, min: 1, max: 20, step: 0.5 },
    uColorA: { type: 'color', label: 'Color A', default: '#0b1020' },
    uColorB: { type: 'color', label: 'Color B', default: '#eb1e92' },
  },
  // Shadertoy-style: no main(), host wraps it
  fragment: /* glsl */ `
void mainImage(out vec4 o, vec2 fc){
  vec2 uv = fc / iResolution.xy;
  float t = iTime * 0.2;
  float v = sin(uv.x * uScale + t)
          + sin(uv.y * uScale * 1.3 - t * 1.2)
          + sin((uv.x + uv.y) * uScale * 0.7 + t * 0.7);
  v = v / 3.0 * 0.5 + 0.5;
  o = vec4(mix(uColorA, uColorB, v), 1.0);
}`,
};

export const BLOCK_CLOUDS: ShaderDef = {
    id: 'blockClouds',
    name: 'Block clouds',
    uniforms: {
      uCoverage:   { type: 'float', label: 'Coverage',      default: 0.5,  min: 0.1,  max: 0.9, step: 0.02 },
      uClumpSize:  { type: 'float', label: 'Clump size',    default: 6,    min: 2,    max: 20,  step: 0.5 },
      uThickness:  { type: 'float', label: 'Block height',  default: 0.3,  min: 0.1,  max: 2,   step: 0.05 },
      uDrift:      { type: 'float', label: 'Drift speed',   default: 0.3,  min: 0,    max: 3,   step: 0.05 },
      uCamHeight:  { type: 'float', label: 'Camera height', default: -1.2, min: -4,   max: 5,   step: 0.1 },
      uPitch:      { type: 'float', label: 'Look up/down',  default: 0.15, min: -1,   max: 1,   step: 0.02 },
      uFog:        { type: 'float', label: 'View distance', default: 24,   min: 6,    max: 60,  step: 1 },
      uShade:      { type: 'float', label: 'Face shading',  default: 0.8,  min: 0,    max: 1,   step: 0.05 },
      uEdge:       { type: 'float', label: 'Block edges',   default: 0.2,  min: 0,    max: 0.6, step: 0.02 },
      uSkyTop:     { type: 'color', label: 'Sky top',       default: '#000000' }, //#3f7fd8
      uSkyHorizon: { type: 'color', label: 'Sky horizon',   default: '#00000f' }, //#bfe0ff
      uCloud:      { type: 'color', label: 'Cloud',         default: '#ffffff' },
      uShadeColor: { type: 'color', label: 'Cloud shade',   default: '#8fa4c4' },
      uUseTheme:   { type: 'bool',  label: 'Tint sky with theme', default: false },
    },
    fragment: /* glsl */ `
  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  
  // 1.0 if the grid column at cell c contains a cloud block
  float cloud(vec2 c){
    vec2 q = c / uClumpSize;
    float n = vnoise(q) * 0.65 + vnoise(q * 2.7 + 13.0) * 0.35;
    return step(mix(0.7, 0.35, uCoverage), n);
  }
  
  void main(){
    vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    vec3 rd = normalize(vec3(uv.x, uv.y + uPitch, 1.0));
    vec3 ro = vec3(uTime * uDrift, uCamHeight, 0.0);   // clouds slide by moving the camera
  
    vec3 top = uUseTheme ? mix(uSkyTop, uTheme, 0.5) : uSkyTop;
    vec3 sky = mix(uSkyHorizon, top, smoothstep(0.0, 0.7, rd.y));
    vec3 col = sky;
  
    // The cloud layer is a slab: world y in [0, uThickness], cells are 1x1 in xz
    if (abs(rd.y) > 1e-4) {
      float ta = (0.0 - ro.y) / rd.y;
      float tb = (uThickness - ro.y) / rd.y;
      float tEnter = max(min(ta, tb), 0.0);
      float tExit  = max(ta, tb);
  
      if (tExit > 0.0 && tEnter < tExit) {
        vec3 p = ro + rd * tEnter;
        vec2 cell = floor(p.xz);
  
        vec2 r = mix(rd.xz, vec2(1e-5), step(abs(rd.xz), vec2(1e-5)));  // avoid divide by zero
        vec2 stp = sign(r);
        vec2 tDelta = abs(1.0 / r);
        vec2 tMax = tEnter + (cell + step(0.0, stp) - p.xz) / r;
  
        float t = tEnter;
        vec3 n = vec3(0.0, -sign(rd.y), 0.0);   // face normal; starts as the slab's top or bottom plane
        bool hit = false;
  
        for (int i = 0; i < 96; i++) {
          if (t > tExit) break;
          if (cloud(cell) > 0.5) { hit = true; break; }
          if (tMax.x < tMax.y) {                 // cross a cell border along x
            t = tMax.x; tMax.x += tDelta.x; cell.x += stp.x;
            n = vec3(-stp.x, 0.0, 0.0);
          } else {                               // cross a cell border along z
            t = tMax.y; tMax.y += tDelta.y; cell.y += stp.y;
            n = vec3(0.0, 0.0, -stp.y);
          }
        }
  
        if (hit) {
          // Minecraft-style per-face brightness: top brightest, bottom darkest
          float lit = n.y > 0.5 ? 1.0 : (n.y < -0.5 ? 0.62 : (abs(n.x) > 0.5 ? 0.8 : 0.9));
          vec3 base = mix(uShadeColor, uCloud, mix(1.0, lit, uShade));
          base *= 1.0 - hash(cell) * 0.04;       // tiny per-block variation
  
          float fog = smoothstep(uFog * 0.35, uFog, t);
          col = mix(base, sky, fog);
        }
      }
    }
  
    gl_FragColor = vec4(col, 1.0);
  }`,
  };

export const SHADER_PRESETS: Record<string, ShaderDef> = {
  [COSMOS.id]: COSMOS,
  [AURORA.id]: AURORA,
  [BLOCK_CLOUDS.id]: BLOCK_CLOUDS,
};