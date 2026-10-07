// Layered 2D painting composited and lit in a single WebGL pass.
//   far   : pre-lit background (sky, distant roofs), parallax < 1
//   near  : albedo of the playable plane + actors, multiplied by the lightmap
//   fg    : foreground silhouettes, lightly lit
//   light : low-res lightmap (half-strength encoded)
//   fog   : animated fog alpha, shaded by the lightmap (volumetric look)
//   glow  : additive halos, wet reflections, rain
//   stat  : the static part of near alone, so the shader can tell scenery from figures
// Unless quality is low, the shader also lights the scenery per pixel: relief read from the
// painted albedo, raked by the nearest lights (the player's lantern among them), wet ground that
// mirrors what stands on it, a little bloom on bright things and rays from lamps through fog.
import { noiseCanvas } from '../art/noise.js';
import { pixelize, quantizeData, paletteLut } from '../art/pixel.js';
import { Actor } from './actor.js';

export const W = 1280, H = 720;
// The game is drawn on a 640x360 pixel grid and scaled up with nearest-neighbour filtering.
export const PX = 0.5;

const VS = `
attribute vec2 p; varying vec2 vUv;
void main(){ vUv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;

const NL = 8;
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D tFar, tNear, tFg, tLight, tFog, tGlow, tStat, tFront, tPal;
uniform float uQuant;
uniform vec2 uRes;
uniform float uTime, uMad, uFade, uFlash, uFogAmt, uRedFlash, uDesat;
uniform vec3 uFogCol;
uniform vec3 uZoom;
uniform float uFx, uReflY, uWet, uCamX;
uniform vec4 uL[${NL}];
uniform vec3 uLC[${NL}];
uniform vec4 uRay0, uRay1;
uniform vec3 uRayC0, uRayC1;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
// nearest palette colour, from a 32x32x32 lookup laid out as 32 slices of 32x32 side by side
vec3 pal(vec3 c){
  vec3 q = floor(clamp(c, 0.0, 1.0) * 31.99);
  return texture2D(tPal, vec2((q.b * 32.0 + q.r + 0.5) / 1024.0, 1.0 - (q.g + 0.5) / 32.0)).rgb;
}
float luma(vec3 c){ return dot(c, vec3(0.3, 0.59, 0.11)); }
vec2 toUv(vec2 p){ return vec2(p.x / 1280.0, 1.0 - p.y / 720.0); }
// rays from a lamp through the fog: march toward it, gathering fog the foreground does not hide
vec3 rays(vec2 fp, vec4 R, vec3 c, float j){
  if (R.z <= 0.0) return vec3(0.0);
  vec2 d = R.xy - fp;
  float fall = clamp(1.0 - length(d) / R.w, 0.0, 1.0);
  if (fall <= 0.0) return vec3(0.0);
  float acc = 0.0, w = 1.0;
  for (int i = 0; i < 8; i++) {
    vec2 su = toUv(fp + d * ((float(i) + j) / 8.0) * 0.9);
    acc += texture2D(tFog, su).a * (1.0 - texture2D(tFg, su).a) * w;
    w *= 0.86;
  }
  return c * acc * fall * fall * R.z;
}
float bayer(vec2 p){
  vec2 q = mod(floor(p), 4.0);
  float i = q.x + q.y * 4.0;
  float v = 0.0;
  if (i < 1.0) v = 0.0; else if (i < 2.0) v = 8.0; else if (i < 3.0) v = 2.0; else if (i < 4.0) v = 10.0;
  else if (i < 5.0) v = 12.0; else if (i < 6.0) v = 4.0; else if (i < 7.0) v = 14.0; else if (i < 8.0) v = 6.0;
  else if (i < 9.0) v = 3.0; else if (i < 10.0) v = 11.0; else if (i < 11.0) v = 1.0; else if (i < 12.0) v = 9.0;
  else if (i < 13.0) v = 15.0; else if (i < 14.0) v = 7.0; else if (i < 15.0) v = 13.0; else v = 5.0;
  return v / 16.0 - 0.47;
}
vec3 compose(vec2 uv){
  vec3 L = texture2D(tLight, uv).rgb * 2.0;
  vec4 far = texture2D(tFar, uv);
  vec4 near = texture2D(tNear, uv);
  // live props arrive soft-edged and in true colour: cut their edges and snap them like the rest
  if (uQuant > 0.5) { near.a = step(0.35, near.a); near.rgb = pal(near.rgb); }
  // distance haze: what is far off sits deeper in the fog than the street
  if (uFx > 0.5) far.rgb = mix(far.rgb, uFogCol * 0.42, 0.22 * uFogAmt);
  vec3 lit = near.rgb * L;
  if (uFx > 0.5 && near.a > 0.5) {
    vec2 px1 = 1.0 / uRes;
    vec4 st = texture2D(tStat, uv);
    // scenery is where the frame still shows the static layer; figures and props drawn live are not
    float stat = st.a > 0.5 && distance(st.rgb, near.rgb) < 0.03 ? 1.0 : 0.0;
    // relief from the painting itself: mortar and gaps are darker, so read darker as deeper
    // (scenery reads its relief from the static layer alone, so a figure passing does not emboss the wall)
    float hl, hr, hu, hd;
    if (stat > 0.5) {
      hl = luma(texture2D(tStat, uv - vec2(px1.x, 0.0)).rgb); hr = luma(texture2D(tStat, uv + vec2(px1.x, 0.0)).rgb);
      hu = luma(texture2D(tStat, uv + vec2(0.0, px1.y)).rgb); hd = luma(texture2D(tStat, uv - vec2(0.0, px1.y)).rgb);
    } else {
      hl = luma(texture2D(tNear, uv - vec2(px1.x, 0.0)).rgb); hr = luma(texture2D(tNear, uv + vec2(px1.x, 0.0)).rgb);
      hu = luma(texture2D(tNear, uv + vec2(0.0, px1.y)).rgb); hd = luma(texture2D(tNear, uv - vec2(0.0, px1.y)).rgb);
    }
    vec3 N = normalize(vec3((hl - hr) * 5.0, (hu - hd) * 5.0, 1.0));
    vec2 fp = vec2(uv.x * 1280.0, (1.0 - uv.y) * 720.0);
    // fresh blood stays wet: it catches the light as a sharp highlight
    float blood = near.r > near.g * 2.2 && near.r > near.b * 1.7 && near.r > 0.06 ? 1.0 : 0.0;
    vec3 add = vec3(0.0), shine = vec3(0.0);
    for (int i = 0; i < ${NL}; i++) {
      vec4 Li = uL[i];
      if (Li.z <= 0.0) break;
      vec2 d = Li.xy - fp;
      float dist = length(d);
      float att = clamp(1.0 - dist / Li.z, 0.0, 1.0);
      att *= att;
      if (att <= 0.0) continue;
      // a bull's-eye lantern lights what is in front of it, and only spills behind
      float cone = Li.w == 0.0 ? 1.0 : 0.2 + 0.8 * smoothstep(-0.25, 0.4, -d.x * Li.w / max(dist, 1.0));
      vec3 ld = normalize(vec3(d, 44.0));
      add += uLC[i] * att * cone * (dot(N, ld) - ld.z);
      shine += uLC[i] * att * cone * pow(max(dot(N, normalize(ld + vec3(0.0, 0.0, 1.0))), 0.0), 26.0);
    }
    lit = near.rgb * max(L + add * mix(0.15, 2.4, stat), 0.0) + shine * blood * 0.9;
    // wet ground mirrors the street: rippled, in puddles, strongest far off where the eye grazes it
    if (uReflY > 0.0 && fp.y > uReflY && stat > 0.5) {
      float dy = fp.y - uReflY, wx = fp.x + uCamX;
      float rip = sin(dy * 0.6 - uTime * 2.2 + vnoise(vec2(wx * 0.04, dy * 0.12)) * 6.0) * (0.8 + dy * 0.035);
      vec2 ruv = vec2(uv.x + rip / 1280.0, clamp(1.0 - (uReflY - dy * 1.15) / 720.0, 0.0, 1.0));
      vec4 rs = texture2D(tStat, ruv);
      vec3 refl = mix(texture2D(tFar, ruv).rgb, rs.rgb * texture2D(tLight, ruv).rgb * 2.0, rs.a);
      float pud = smoothstep(0.4, 0.66, vnoise(vec2(wx * 0.012, dy * 0.07 + 3.0)));
      float fres = mix(0.8, 0.22, clamp(dy / 80.0, 0.0, 1.0));
      float k = clamp(uWet, 0.0, 1.5) * fres * (0.25 + 0.75 * pud) * 0.85;
      lit = mix(lit, lit * 0.5 + refl, k);
    }
  }
  vec3 col = mix(far.rgb, lit, near.a);
  vec4 fog = texture2D(tFog, uv);
  vec3 fogLit = uFogCol * (0.28 + L * 0.95);
  col = mix(col, fogLit, clamp(fog.a * uFogAmt, 0.0, 1.0));
  // depth of field: whatever passes in front of the camera is out of focus
  vec2 px1 = 1.0 / uRes;
  vec4 fg = texture2D(tFg, uv) * 0.2;
  fg += texture2D(tFg, uv + vec2(2.0, 0.0) * px1) * 0.1; fg += texture2D(tFg, uv - vec2(2.0, 0.0) * px1) * 0.1;
  fg += texture2D(tFg, uv + vec2(0.0, 2.0) * px1) * 0.1; fg += texture2D(tFg, uv - vec2(0.0, 2.0) * px1) * 0.1;
  fg += texture2D(tFg, uv + vec2(1.5, 1.5) * px1) * 0.1; fg += texture2D(tFg, uv - vec2(1.5, 1.5) * px1) * 0.1;
  fg += texture2D(tFg, uv + vec2(1.5, -1.5) * px1) * 0.1; fg += texture2D(tFg, uv - vec2(1.5, -1.5) * px1) * 0.1;
  col = mix(col, fg.rgb * (L * 0.55 + 0.04), fg.a);
  if (uFx > 0.5) {
    // a bank of fog passing close to the camera, in front of everything
    float fr = texture2D(tFront, uv).a;
    col = mix(col, uFogCol * (0.22 + L * 0.7), clamp(fr * uFogAmt * 0.55, 0.0, 0.6));
  }
  col += texture2D(tGlow, uv).rgb;
  return col;
}
void main(){
  // camera push-in: zoom about a point (uv space)
  vec2 uv = (vUv - uZoom.yz) / uZoom.x + uZoom.yz;
  float m = uMad;
  // madness: slow breathing warp and a faint tidal ripple
  uv.x += sin(uv.y * 14.0 + uTime * 0.9) * 0.0022 * m;
  uv.y += sin(uv.x * 9.0 + uTime * 0.6) * 0.0016 * m;
  vec2 c = uv - 0.5;
  float ca = 0.0007 + 0.0045 * m;
  vec3 col = compose(uv);
  if (m > 0.02) {
    col.r = compose(uv + c * ca).r;
    col.b = compose(uv - c * ca).b;
  }
  if (uFx > 0.5) {
    // bloom: whatever burns brightest bleeds a little into its neighbours
    // (read from the soft light and glow buffers, so it blooms without ghosting the crisp art)
    vec3 b = vec3(0.0);
    for (int i = 0; i < 6; i++) {
      float a = float(i) * 1.047 + 0.5;
      vec2 u2 = uv + vec2(cos(a), sin(a)) * 7.0 / uRes;
      b += max(texture2D(tGlow, u2).rgb - 0.18, 0.0) + max(texture2D(tLight, u2).rgb * 2.0 - 1.25, 0.0) * 0.2;
    }
    col += b * 0.07;
    vec2 fp = vec2(uv.x * 1280.0, (1.0 - uv.y) * 720.0);
    float j = hash(floor(vUv * uRes) + fract(uTime) * 31.0);
    col += rays(fp, uRay0, uRayC0, j) + rays(fp, uRay1, uRayC1, j);
  }
  // grading: teal shadows, warm highlights, gentle filmic shoulder
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col += vec3(-0.004, 0.012, 0.018) * (1.0 - smoothstep(0.0, 0.35, lum));
  col = mix(col, vec3(lum), uDesat + 0.12 * m);
  col = col / (col + vec3(0.72)) * 1.62;
  col = pow(max(col, 0.0), vec3(1.08));
  // vignette
  float v = smoothstep(0.95, 0.25, length(c * vec2(1.0, 0.82)));
  col *= mix(0.42, 1.0, v);
  col *= 1.0 - 0.35 * m * (1.0 - v);
  // grain on the pixel grid, plus ordered dither so smooth light falls off in clean pixel bands
  vec2 px = floor(vUv * uRes);
  float g = hash(px + fract(uTime * 7.31) * 100.0) - 0.5;
  col += g * (0.02 + 0.05 * m);
  col += bayer(px) / 110.0;
  // pulses and fades
  col = mix(col, vec3(0.55, 0.03, 0.02), uRedFlash);
  col = mix(col, vec3(0.95, 0.97, 1.0), uFlash);
  col *= 1.0 - uFade;
  gl_FragColor = vec4(col, 1.0);
}`;

function mk2d(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export class Renderer {
  static uid = 0;
  constructor(view) {
    this.view = view;
    this.gl = view.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!this.gl) throw new Error('WebGL no disponible');
    this.rs = PX;
    this.time = 0;
    this.fx = { mad: 0, fade: 1, flash: 0, red: 0, desat: 0, zoom: [1, 0.5, 0.5] };
    this.cam = { x: 0, shake: 0 };
    const feather = (ny) => Math.pow(Math.sin(Math.PI * ny), 1.6);
    this.fogTex = noiseCanvas(256, 128, { scale: 6, seed: 77, octaves: 5, tile: true, alpha: true, shape: (v, nx, ny) => (v - 0.3) * 1.8 * feather(ny) });
    this.fogTex2 = noiseCanvas(256, 128, { scale: 4, seed: 91, octaves: 4, tile: true, alpha: true, shape: (v, nx, ny) => (v - 0.34) * 2.0 * feather(ny) });
    this.rain = [];
    this.initGL();
    this.resize();
  }

  initGL() {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    this.prog = prog;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    for (const n of ['uRes', 'uTime', 'uMad', 'uFade', 'uFlash', 'uFogAmt', 'uFogCol', 'uRedFlash', 'uDesat', 'uZoom',
      'uFx', 'uReflY', 'uWet', 'uCamX', 'uL', 'uLC', 'uRay0', 'uRay1', 'uRayC0', 'uRayC1', 'uQuant']) this.u[n] = gl.getUniformLocation(prog, n);
    this.lightU = new Float32Array(NL * 4); this.lightC = new Float32Array(NL * 3);
    this.tex = {};
    // a ninth unit for the palette lookup; without it the props are snapped on the CPU instead
    this.gpuQuant = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) >= 9;
    ['tFar', 'tNear', 'tFg', 'tLight', 'tFog', 'tGlow', 'tStat', 'tFront', ...(this.gpuQuant ? ['tPal'] : [])].forEach((n, i) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t);
      const f = i < 3 || i === 6 || i === 8 ? gl.NEAREST : gl.LINEAR; // art layers stay crisp, light and fog stay soft
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(gl.getUniformLocation(prog, n), i);
      this.tex[n] = { t, unit: i };
    });
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    if (this.gpuQuant) this.upload('tPal', paletteLut());
    gl.uniform1f(this.u.uQuant, this.gpuQuant ? 1 : 0);
  }

  // Fixed pixel grid: the output never depends on the screen size.
  resize() {
    const rs = PX;
    this.rs = rs;
    this.view.width = Math.round(W * rs);
    this.view.height = Math.round(H * rs);
    this.gl.viewport(0, 0, this.view.width, this.view.height);
    const fw = this.view.width, fh = this.view.height;
    this.far = mk2d(fw, fh); this.near = mk2d(fw, fh); this.fg = mk2d(fw, fh); this.stat = mk2d(fw, fh);
    this.light = mk2d(320, 180);
    this.fog = mk2d(640, 360);
    this.front = mk2d(320, 180);
    this.glow = mk2d(640, 360);
    this.dyn = mk2d(fw, fh);
    this.cDyn = this.dyn.getContext('2d', { willReadFrequently: true });
    this.cFar = this.far.getContext('2d'); this.cNear = this.near.getContext('2d'); this.cFg = this.fg.getContext('2d');
    this.cNear.imageSmoothingEnabled = false;
    this._staticKey = null;
    this.cLight = this.light.getContext('2d'); this.cFog = this.fog.getContext('2d'); this.cGlow = this.glow.getContext('2d');
  }

  // Paint a static layer once at full logical resolution, then reduce it to the pixel grid
  // and snap it to the palette. `width` is in logical px.
  paintLayer(width, painter, height = H, { dither = 9, blur = 0 } = {}) {
    const c = mk2d(Math.ceil(width), Math.ceil(height));
    const ctx = c.getContext('2d');
    if (blur) ctx.filter = `blur(${blur}px)`;
    painter(ctx, width, height);
    return pixelize(c, this.rs, { dither });
  }

  // Per-frame props (corpses, rats, drips, swinging signs...). Where the GPU has a texture unit to
  // spare they are drawn straight into the frame and the shader snaps them to the palette; reading
  // them back to snap them on the CPU cost more than everything else in a frame together.
  dynamicPass(target, draw, camX, camY, t) {
    const rs = this.rs;
    if (this.gpuQuant) {
      target.setTransform(rs, 0, 0, rs, -camX * rs, camY * rs);
      draw(target, t);
      target.setTransform(1, 0, 0, 1, 0, 0);
      return;
    }
    const c = this.cDyn;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.dyn.width, this.dyn.height);
    c.setTransform(rs, 0, 0, rs, -camX * rs, camY * rs);
    draw(c, t);
    c.setTransform(1, 0, 0, 1, 0, 0);
    const img = c.getImageData(0, 0, this.dyn.width, this.dyn.height);
    quantizeData(img.data, this.dyn.width, this.dyn.height, { dither: 10, alphaCut: 90 });
    c.putImageData(img, 0, 0);
    target.setTransform(1, 0, 0, 1, 0, 0);
    target.drawImage(this.dyn, 0, 0);
  }

  frame(scene, actors, dt, overlay) {
    this.time += dt;
    const rs = this.rs, t = this.time;
    const camX = Math.round((this.cam.x + (Math.random() - 0.5) * this.cam.shake) * rs) / rs;
    const camY = (Math.random() - 0.5) * this.cam.shake * 0.5;

    // far and foreground only change when the camera moves
    if (scene.built && !scene.built._uid) scene.built._uid = ++Renderer.uid;
    const staticKey = `${scene.id}|${scene.built?._uid}|${camX.toFixed(2)}|${camY.toFixed(2)}|${this.far.width}`;
    this.staticDirty = staticKey !== this._staticKey || !!scene.drawFar;
    this._staticKey = staticKey;
    const cf = this.cFar;
    if (this.staticDirty) {
      cf.setTransform(1, 0, 0, 1, 0, 0);
      cf.fillStyle = '#000'; cf.fillRect(0, 0, this.far.width, this.far.height);
      for (const L of scene.layers) if (L.kind === 'far') cf.drawImage(L.canvas, Math.round(-camX * L.parallax * rs), Math.round(camY * rs));
      if (scene.drawFar) { cf.setTransform(rs, 0, 0, rs, 0, 0); scene.drawFar(cf, camX, t); }
    }

    // near (albedo)
    const cn = this.cNear;
    cn.setTransform(1, 0, 0, 1, 0, 0);
    cn.clearRect(0, 0, this.near.width, this.near.height);
    for (const L of scene.layers) if (L.kind === 'near') cn.drawImage(L.canvas, Math.round(-camX * rs), Math.round(camY * rs));
    if (!this.lowFx && this.staticDirty) {
      const cs = this.stat.getContext('2d');
      cs.clearRect(0, 0, this.stat.width, this.stat.height);
      cs.drawImage(this.near, 0, 0);
    }
    Actor.lightsNow = this.lightsFrame || scene.lights;
    if (scene.drawNear || scene.life) this.dynamicPass(cn, (c, tt) => { if (scene.drawNear) scene.drawNear(c, tt); if (scene.life) for (const l of scene.life) l.draw && l.draw(c, tt); }, camX, camY, t);
    cn.setTransform(rs, 0, 0, rs, -camX * rs, camY * rs);
    const sorted = actors.filter((a) => a.visible).sort((a, b) => (a.z || 0) - (b.z || 0));
    const prevLights = this.lightsFrame || scene.lights;
    const wet = !!scene.rain && !scene.indoor;
    for (const a of sorted) {
      a.windy = !scene.indoor; a.wet = wet; a.reflect = wet && !!scene.reflectY && (scene.wet ?? 0) > 0.5;
      // the light that throws this figure's shadow across the ground: strongest nearby, not its own
      let best = null, bk = 0.12;
      for (const L of prevLights) {
        if (L.off || L.cone || L.y > a.y - 20) continue;
        const k = (L.intensity ?? 1) * Math.max(0, 1 - Math.hypot(L.x - a.x, L.y - a.y) / (L.r * 1.6));
        if (k > bk) { bk = k; best = L; }
      }
      a.shadowFrom = best && { x: best.x, y: best.y, k: bk, flicker: best.flicker };
      a.draw(cn, t, prevLights);
    }
    if (scene.drawNearOver) this.dynamicPass(cn, (c, tt) => scene.drawNearOver(c, tt), camX, camY, t);

    // foreground
    const cg = this.cFg;
    if (this.staticDirty) {
      cg.setTransform(1, 0, 0, 1, 0, 0);
      cg.clearRect(0, 0, this.fg.width, this.fg.height);
      for (const L of scene.layers) if (L.kind === 'fg') cg.drawImage(L.canvas, Math.round(-camX * L.parallax * rs), 0);
    }

    // lightmap
    const cl = this.cLight, ls = 320 / W;
    cl.setTransform(1, 0, 0, 1, 0, 0);
    cl.globalCompositeOperation = 'source-over';
    const a = scene.ambient;
    cl.fillStyle = `rgb(${a[0] * 255},${a[1] * 255},${a[2] * 255})`;
    cl.fillRect(0, 0, 320, 180);
    cl.globalCompositeOperation = 'lighter';
    cl.setTransform(ls, 0, 0, ls, -camX * ls, camY * ls);
    const lights = scene.lights.concat(actors.flatMap((ac) => (ac.visible && ac.light ? [ac.light()] : [])).filter(Boolean));
    this.lightsFrame = lights;
    for (const L of lights) {
      if (L.off) continue;
      const fl = L.flicker ? 1 - L.flicker * (0.5 + 0.5 * Math.sin(t * 13 + L.x) * Math.sin(t * 7.3 + L.y)) * Math.random() * 0.6 - L.flicker * 0.15 : 1;
      const k = (L.intensity ?? 1) * fl;
      L._k = k;
      const x = L.x, y = L.y;
      if (L.cone) {
        // directional lamp (bull's-eye lantern): a cone plus a small spill
        cl.save();
        cl.translate(x, y);
        cl.scale(L.cone.dir, 1);
        const g = cl.createRadialGradient(0, 0, 4, 0, 0, L.r);
        const c = (m) => `rgb(${L.color[0] * 255 * k * m},${L.color[1] * 255 * k * m},${L.color[2] * 255 * k * m})`;
        g.addColorStop(0, c(1)); g.addColorStop(0.35, c(0.5)); g.addColorStop(1, 'rgb(0,0,0)');
        cl.fillStyle = g;
        cl.filter = 'blur(5px)';
        cl.beginPath(); cl.moveTo(-10, -4); cl.arc(0, 0, L.r, -L.cone.spread * 0.7, L.cone.spread * 1.3); cl.closePath(); cl.fill();
        cl.filter = 'none';
        cl.restore();
        this.radial(cl, x, y, L.r * 0.35, L.color, k * 0.55);
      } else {
        this.radial(cl, x, y, L.r, L.color, k);
      }
    }

    // fog
    const cfo = this.cFog, fs = 640 / W;
    cfo.setTransform(1, 0, 0, 1, 0, 0);
    cfo.clearRect(0, 0, 640, 360);
    const fog = scene.fog || { density: 0.5 };
    const drift = t * (fog.speed ?? 12);
    for (const [tex, par, yy, hh, al] of [[this.fogTex2, 0.35, -120, 640, 0.5], [this.fogTex, 0.7, 60, 560, 0.7], [this.fogTex, 1.15, 300, 420, 0.9]]) {
      const ox = ((-camX * par - drift * par) * fs) % (640 * 1.5);
      cfo.globalAlpha = al * fog.density;
      for (let k = -1; k < 3; k++) cfo.drawImage(tex, ox + k * 640 * 1.5, yy * fs + (fog.yOffset || 0) * fs, 640 * 1.5, hh * fs);
    }
    cfo.globalAlpha = 1;
    // ground mist
    if (fog.ground !== false) {
      const gy = (scene.groundY - 60) * fs;
      const g = cfo.createLinearGradient(0, gy, 0, 360);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.35 * (fog.ground ?? 1)})`); g.addColorStop(1, `rgba(255,255,255,${0.12 * (fog.ground ?? 1)})`);
      cfo.fillStyle = g; cfo.fillRect(0, gy, 640, 360 - gy);
    }
    cfo.setTransform(fs, 0, 0, fs, -camX * fs, 0);
    if (scene.drawFog) scene.drawFog(cfo, t);
    // light shafts: lamps pour a visible cone of light down through the fog
    for (const L of lights) {
      if (L.off || !L.shaft) continue;
      const y0 = L.shaftY0 ?? L.y + 12, len = scene.groundY + 10 - y0, w0 = L.shaftW0 ?? 10, w1 = L.shaftW || 120, sk = L.shaftSkew || 0;
      const g = cfo.createLinearGradient(0, y0, 0, y0 + len);
      const k = (L.shaftK ?? 0.38) * (L.intensity ?? 1);
      g.addColorStop(0, `rgba(255,255,255,${k})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      cfo.fillStyle = g;
      cfo.beginPath(); cfo.moveTo(L.x - w0, y0); cfo.lineTo(L.x + w0, y0); cfo.lineTo(L.x + sk + w1, y0 + len); cfo.lineTo(L.x + sk - w1, y0 + len); cfo.closePath(); cfo.fill();
    }
    if (scene.life) for (const l of scene.life) if (l.drawFog) l.drawFog(cfo, t);
    if (!this.lowFx) {
      // the near bank: big soft shapes, faster than the street, thin enough to see through
      const cfr = this.front.getContext('2d'), k = 320 / W;
      cfr.setTransform(1, 0, 0, 1, 0, 0);
      cfr.clearRect(0, 0, 320, 180);
      if (fog.front !== false && (fog.density ?? 0.5) > 0.2) {
        const ox = ((-camX * 1.6 - drift * 2.2) * k) % (320 * 2.2);
        cfr.globalAlpha = Math.min(1, 0.5 * (fog.density ?? 0.5) * (scene.indoor ? 0.4 : 1));
        for (let i = -1; i < 3; i++) cfr.drawImage(this.fogTex2, ox + i * 320 * 2.2, 40 * k, 320 * 2.2, 760 * k);
        cfr.globalAlpha = 1;
      }
    }
    if (!scene.indoor) for (const a of sorted) a.breath(cfo, t);

    // glow (halos, reflections, rain)
    const cgl = this.cGlow;
    cgl.setTransform(1, 0, 0, 1, 0, 0);
    cgl.globalCompositeOperation = 'source-over';
    cgl.fillStyle = '#000'; cgl.fillRect(0, 0, 640, 360);
    cgl.globalCompositeOperation = 'lighter';
    cgl.setTransform(fs, 0, 0, fs, -camX * fs, camY * fs);
    for (const L of lights) {
      if (L.off || !L.halo) continue;
      const fl = L.flicker ? 0.85 + Math.random() * 0.15 : 1;
      this.radial(cgl, L.x, L.y, L.halo, L.color, 0.5 * fl * (L.haloK ?? 1));
      this.radial(cgl, L.x, L.y, L.halo * 0.25, [1, 0.95, 0.85], 0.35 * fl * (L.haloK ?? 1));
      if (scene.reflectY && L.reflect !== false && L.y < scene.reflectY) {
        // wet street: a vertical smeared reflection under every light
        const ry = scene.reflectY + (scene.reflectY - L.y) * 0.18;
        cgl.save();
        cgl.translate(L.x, ry); cgl.scale(0.22, 1);
        this.radial(cgl, 0, 0, Math.min(140, L.halo * 1.2), L.color, 0.22 * fl * (scene.wet ?? 1));
        cgl.restore();
      }
    }
    if (scene.drawGlow) scene.drawGlow(cgl, t);
    if (scene.life) for (const l of scene.life) if (l.drawGlow) l.drawGlow(cgl, t);
    // indoors the air is too clear for fog to carry a beam, so window light is laid on as glow
    if (scene.indoor) for (const L of lights) {
      if (L.off || !L.shaft) continue;
      const y0 = L.shaftY0 ?? L.y + 12, len = scene.groundY + 10 - y0, w0 = L.shaftW0 ?? 10, w1 = L.shaftW || 120, sk = L.shaftSkew || 0, c = L.color || [1, 1, 1];
      const k = (L.shaftK ?? 0.38) * (L.intensity ?? 1) * 0.35;
      const g = cgl.createLinearGradient(L.x, y0, L.x + sk, y0 + len);
      g.addColorStop(0, `rgba(${c[0] * 255 | 0},${c[1] * 255 | 0},${c[2] * 255 | 0},${k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      cgl.fillStyle = g;
      cgl.filter = 'blur(6px)';
      cgl.beginPath(); cgl.moveTo(L.x - w0, y0); cgl.lineTo(L.x + w0, y0); cgl.lineTo(L.x + sk + w1, y0 + len); cgl.lineTo(L.x + sk - w1, y0 + len); cgl.closePath(); cgl.fill();
      cgl.filter = 'none';
    }
    // dust and drizzle hanging in each lamp's cone, drifting slowly and catching the light
    if (!this.lowFx) for (const L of lights) {
      if (L.off || !L.shaft) continue;
      const len = scene.groundY + 10 - (L.shaftY0 ?? L.y + 14), w1 = L.shaftW || 120, c = L.color || [1, 0.85, 0.6];
      for (let i = 0; i < 22; i++) {
        const h1 = ((i * 7919) % 1000) / 1000, h2 = ((i * 104729) % 997) / 997;
        const v = (h2 + t * (0.012 + h1 * 0.02)) % 1;
        const x = L.x + (L.shaftSkew || 0) * v + (h1 - 0.5) * 2 * ((L.shaftW0 ?? 10) + (w1 - (L.shaftW0 ?? 10)) * v) * 0.85 + Math.sin(t * 0.6 + i) * 6;
        const y = (L.shaftY0 ?? L.y + 14) + v * len;
        const a = (1 - v) * (0.25 + 0.25 * Math.sin(t * 2.3 + i * 1.7)) * (L.intensity ?? 1);
        if (a <= 0.02) continue;
        cgl.fillStyle = `rgba(${c[0] * 255 | 0},${c[1] * 255 | 0},${c[2] * 255 | 0},${a})`;
        cgl.fillRect(x, y, 2, 2);
      }
    }
    if (!this.lowFx) this.atmosphere(cgl, scene, lights, t);
    if (wet && !this.lowFx) for (const a of sorted) if (!a.noRain) a.rainHits(cgl, t, scene.rain);
    if (this.drops && this.drops.length) {
      for (const d of this.drops) {
        d.life -= dt;
        if (d.ring !== undefined) {
          d.ring += dt;
          cgl.strokeStyle = `rgba(150,175,180,${Math.max(0, d.life) * 0.7})`; cgl.lineWidth = 2;
          cgl.beginPath(); cgl.ellipse(d.x, d.y, 6 + d.ring * 40, 2 + d.ring * 6, 0, 0, Math.PI * 2); cgl.stroke();
        } else {
          d.vy += 500 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
          cgl.fillStyle = `rgba(170,190,195,${Math.max(0, d.life) * 1.4})`; cgl.fillRect(d.x, d.y, 3, 3);
        }
      }
      this.drops = this.drops.filter((d) => d.life > 0);
    }
    if (scene.rain) this.drawRain(cgl, scene, camX, dt);
    if (overlay) { cgl.setTransform(fs, 0, 0, fs, 0, 0); overlay(cgl, t); }

    if (!this.lowFx) this.pickLights(scene, lights, camX, camY);
    this.present(scene, camX);
  }

  // Small things in the air: embers rising from fires, and indoors the dust that hangs in a room,
  // seen only where a light reaches it.
  atmosphere(ctx, scene, lights, t) {
    for (const L of lights) {
      if (L.off || !L.sparks) continue;
      for (let i = 0; i < L.sparks; i++) {
        const h1 = ((i * 7919 + L.x) % 1000) / 1000, h2 = ((i * 104729) % 997) / 997;
        const life = 1.6 + h1 * 1.8, k = ((t + h2 * life) % life) / life;
        const x = L.x + (h1 - 0.5) * 30 + Math.sin(t * (2 + h2 * 3) + i) * (6 + k * 26) + k * k * 40 * Math.sin(t * 0.23 + h1);
        const y = L.y - 10 - k * (120 + h2 * 160);
        const a = (1 - k) * (0.6 + 0.4 * Math.sin(t * 20 + i * 3)) * (L.intensity ?? 1);
        if (a < 0.05) continue;
        ctx.fillStyle = `rgba(255,${150 + (1 - k) * 90 | 0},${60 + (1 - k) * 60 | 0},${Math.min(1, a)})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
    if (scene.indoor) {
      const span = scene.width || W;
      for (let i = 0; i < 90; i++) {
        const h1 = ((i * 7919) % 1000) / 1000, h2 = ((i * 104729) % 997) / 997, h3 = ((i * 15485863) % 991) / 991;
        const x = h1 * span + Math.sin(t * 0.13 + i) * 30 + t * (2 + h3 * 4) % 60;
        const y = 60 + ((h2 * (scene.groundY - 60) + Math.sin(t * 0.21 + i * 1.3) * 24 + t * (1 + h3 * 3)) % (scene.groundY - 60));
        let lum = 0;
        for (const L of lights) {
          if (L.off || L.r > 1000) continue;
          const d = Math.hypot(L.x - x, L.y - y);
          if (d < L.r * 0.8) lum += (L._k ?? L.intensity ?? 1) * (1 - d / (L.r * 0.8));
        }
        const a = Math.min(0.5, lum * 0.7) * (0.5 + 0.5 * Math.sin(t * 1.7 + i * 2.1));
        if (a < 0.03) continue;
        ctx.fillStyle = `rgba(255,236,200,${a})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }

  // droplets kicked up by a boot on a wet street
  splash(x, y) {
    (this.drops ||= []);
    for (let i = 0; i < 7; i++) this.drops.push({ x, y: y - 2, vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 90, life: 0.35 + Math.random() * 0.2 });
    this.drops.push({ x, y: y + 2, ring: 0, life: 0.5 });
  }

  radial(ctx, x, y, r, c, k) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const f = (v) => Math.max(0, Math.min(255, v * 255 * k));
    g.addColorStop(0, `rgb(${f(c[0])},${f(c[1])},${f(c[2])})`);
    g.addColorStop(0.4, `rgb(${f(c[0]) * 0.45},${f(c[1]) * 0.45},${f(c[2]) * 0.45})`);
    g.addColorStop(1, 'rgb(0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  drawRain(ctx, scene, camX, dt) {
    const amount = Math.round(260 * scene.rain);
    while (this.rain.length < amount) this.rain.push({ x: Math.random() * W, y: Math.random() * H, s: 0.6 + Math.random() * 0.9 });
    this.rain.length = amount;
    ctx.save();
    ctx.setTransform(640 / W, 0, 0, 360 / H, 0, 0);
    ctx.strokeStyle = 'rgba(150,170,175,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const d of this.rain) {
      d.y += 900 * d.s * dt; d.x -= 120 * d.s * dt;
      if (d.y > H) { d.y = -20; d.x = Math.random() * (W + 200); }
      ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 4 * d.s, d.y - 22 * d.s);
    }
    ctx.stroke();
    if (!this.lowFx) {
      // fine drizzle hanging in the air, blown about by the gusts, and a few big drops passing close to the eye
      const g = 0.35 + 0.65 * Math.max(0, Math.sin(this.time * 0.23) * Math.sin(this.time * 0.71 + 1.3));
      const fine = Math.round(220 * scene.rain), big = Math.round(10 * scene.rain);
      (this.mist ||= []);
      while (this.mist.length < fine + big) this.mist.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() });
      this.mist.length = fine + big;
      ctx.fillStyle = 'rgba(160,180,186,0.16)';
      for (let i = 0; i < fine; i++) {
        const d = this.mist[i];
        d.y += (160 + d.s * 120) * dt; d.x -= (40 + g * 160) * (0.5 + d.s) * dt + Math.sin(this.time * 2 + i) * 0.3;
        if (d.y > H) { d.y = -4; d.x = Math.random() * (W + 300); }
        if (d.x < -10) d.x += W + 20;
        ctx.fillRect(d.x, d.y, 2, 2 + d.s * 3);
      }
      ctx.strokeStyle = 'rgba(170,190,196,0.1)'; ctx.lineWidth = 5;
      ctx.beginPath();
      for (let i = fine; i < fine + big; i++) {
        const d = this.mist[i];
        d.y += 1500 * dt; d.x -= (180 + g * 120) * dt;
        if (d.y > H + 60) { d.y = -80; d.x = Math.random() * (W + 300); }
        ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 9, d.y - 60);
      }
      ctx.stroke();
    }
    // splashes where drops hit the street
    if (scene.groundY) {
      ctx.fillStyle = 'rgba(170,190,195,0.22)';
      for (let i = 0; i < 46 * scene.rain; i++) {
        const sx = Math.random() * W, sy = scene.groundY + 14 + Math.random() * (H - scene.groundY - 14);
        ctx.fillRect(sx - 3, sy, 2, 2); ctx.fillRect(sx + 2, sy - 1, 2, 2); ctx.fillRect(sx, sy - 3, 2, 2);
      }
    }
    ctx.restore();
  }

  // The few lights that rake the scenery per pixel this frame: those reaching the view, nearest and
  // strongest first, the player's lantern always among them. Plus up to two lamps to throw rays.
  pickLights(scene, lights, camX, camY) {
    const cx = W / 2, cy = H / 2, cand = [];
    for (const L of lights) {
      if (L.off || !(L._k > 0.02) || L.r > 1000) continue;
      const sx = L.x - camX, sy = L.y + camY;
      const out = Math.max(0, Math.abs(sx - cx) - W / 2, Math.abs(sy - cy) - H / 2);
      if (out > L.r) continue;
      cand.push({ L, sx, sy, score: L._k * L.r / (300 + out) + (L.cone ? 100 : 0) });
    }
    cand.sort((a, b) => b.score - a.score);
    const lu = this.lightU, lc = this.lightC;
    lu.fill(0); lc.fill(0);
    cand.slice(0, NL).forEach(({ L, sx, sy }, i) => {
      lu.set([sx, sy, L.r * 0.9, L.cone ? L.cone.dir : 0], i * 4);
      const k = L._k * (L.cone ? 1.15 : 0.9);
      lc.set([L.color[0] * k, L.color[1] * k, L.color[2] * k], i * 3);
    });
    // rays only where there is fog to carry them
    const fog = (scene.fog?.density ?? 0.5) * (scene.fog?.amount ?? 0.55);
    this.rayU = cand.filter(({ L }) => !L.cone && L.rays !== false && (L.halo || 0) >= 40).slice(0, 2).map(({ L, sx, sy }) => ({
      p: [sx, sy, Math.min(0.5, 0.95 * fog * L._k * (scene.indoor ? 0.6 : 1) * (L.raysK ?? 1)), Math.min(560, L.r * 1.05)], c: L.color,
    }));
  }

  upload(name, canvas) {
    const gl = this.gl, tx = this.tex[name];
    gl.activeTexture(gl.TEXTURE0 + tx.unit);
    gl.bindTexture(gl.TEXTURE_2D, tx.t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  }

  present(scene, camX = 0) {
    const gl = this.gl, u = this.u, fx = this.fx;
    if (this.staticDirty) { this.upload('tFar', this.far); this.upload('tFg', this.fg); if (!this.lowFx) this.upload('tStat', this.stat); }
    if (!this.lowFx) this.upload('tFront', this.front);
    gl.uniform1f(u.uFx, this.lowFx ? 0 : 1);
    if (!this.lowFx) {
      gl.uniform4fv(u.uL, this.lightU); gl.uniform3fv(u.uLC, this.lightC);
      gl.uniform1f(u.uReflY, scene.reflectY && (scene.wet ?? 0) > 0 ? scene.reflectY : -1);
      gl.uniform1f(u.uWet, scene.wet ?? 0);
      gl.uniform1f(u.uCamX, camX);
      const r = this.rayU || [];
      for (let i = 0; i < 2; i++) {
        const q = r[i];
        gl.uniform4f(u['uRay' + i], ...(q ? q.p : [0, 0, 0, 1]));
        gl.uniform3f(u['uRayC' + i], ...(q ? q.c : [0, 0, 0]));
      }
    }
    this.upload('tNear', this.near);
    this.upload('tLight', this.light); this.upload('tFog', this.fog); this.upload('tGlow', this.glow);
    gl.uniform2f(u.uRes, this.view.width, this.view.height);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uMad, fx.mad);
    gl.uniform1f(u.uFade, fx.fade);
    gl.uniform1f(u.uFlash, fx.flash);
    gl.uniform1f(u.uRedFlash, fx.red);
    gl.uniform1f(u.uDesat, fx.desat);
    gl.uniform3f(u.uZoom, fx.zoom[0], fx.zoom[1], fx.zoom[2]);
    const f = scene.fog || {};
    gl.uniform1f(u.uFogAmt, f.amount ?? 0.55);
    const fc = f.color || [0.42, 0.5, 0.52];
    gl.uniform3f(u.uFogCol, fc[0], fc[1], fc[2]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

