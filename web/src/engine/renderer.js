// Layered 2D painting composited and lit in a single WebGL pass.
//   far   : pre-lit background (sky, distant roofs), parallax < 1
//   near  : albedo of the playable plane + actors, multiplied by the lightmap
//   fg    : foreground silhouettes, lightly lit
//   light : low-res lightmap (half-strength encoded)
//   fog   : animated fog alpha, shaded by the lightmap (volumetric look)
//   glow  : additive halos, wet reflections, rain
import { noiseCanvas } from '../art/noise.js';
import { pixelize, quantizeData } from '../art/pixel.js';

export const W = 1280, H = 720;
// The game is drawn on a 640x360 pixel grid and scaled up with nearest-neighbour filtering.
export const PX = 0.5;

const VS = `
attribute vec2 p; varying vec2 vUv;
void main(){ vUv = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;

const FS = `
precision mediump float;
uniform sampler2D tFar, tNear, tFg, tLight, tFog, tGlow;
uniform vec2 uRes;
uniform float uTime, uMad, uFade, uFlash, uFogAmt, uRedFlash, uDesat;
uniform vec3 uFogCol;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
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
  vec3 col = mix(far.rgb, near.rgb * L, near.a);
  vec4 fog = texture2D(tFog, uv);
  vec3 fogLit = uFogCol * (0.28 + L * 0.95);
  col = mix(col, fogLit, clamp(fog.a * uFogAmt, 0.0, 1.0));
  vec4 fg = texture2D(tFg, uv);
  col = mix(col, fg.rgb * (L * 0.55 + 0.04), fg.a);
  col += texture2D(tGlow, uv).rgb;
  return col;
}
void main(){
  vec2 uv = vUv;
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
  col += g * (0.03 + 0.05 * m);
  col += bayer(px) / 40.0;
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
    this.fx = { mad: 0, fade: 1, flash: 0, red: 0, desat: 0 };
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
    for (const n of ['uRes', 'uTime', 'uMad', 'uFade', 'uFlash', 'uFogAmt', 'uFogCol', 'uRedFlash', 'uDesat']) this.u[n] = gl.getUniformLocation(prog, n);
    this.tex = {};
    ['tFar', 'tNear', 'tFg', 'tLight', 'tFog', 'tGlow'].forEach((n, i) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t);
      const f = i < 3 ? gl.NEAREST : gl.LINEAR; // art layers stay crisp, light and fog stay soft
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(gl.getUniformLocation(prog, n), i);
      this.tex[n] = { t, unit: i };
    });
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  }

  // Fixed pixel grid: the output never depends on the screen size.
  resize() {
    const rs = PX;
    this.rs = rs;
    this.view.width = Math.round(W * rs);
    this.view.height = Math.round(H * rs);
    this.gl.viewport(0, 0, this.view.width, this.view.height);
    const fw = this.view.width, fh = this.view.height;
    this.far = mk2d(fw, fh); this.near = mk2d(fw, fh); this.fg = mk2d(fw, fh);
    this.light = mk2d(320, 180);
    this.fog = mk2d(640, 360);
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
  paintLayer(width, painter, height = H, { dither = 14 } = {}) {
    const c = mk2d(Math.ceil(width), Math.ceil(height));
    const ctx = c.getContext('2d');
    painter(ctx, width, height);
    return pixelize(c, this.rs, { dither });
  }

  // Draw per-frame props on a scratch buffer and quantize them so they match the painted layers.
  dynamicPass(target, draw, camX, camY, t) {
    const c = this.cDyn, rs = this.rs;
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
    if (scene.drawNear || scene.life) this.dynamicPass(cn, (c, tt) => { if (scene.drawNear) scene.drawNear(c, tt); if (scene.life) for (const l of scene.life) l.draw && l.draw(c, tt); }, camX, camY, t);
    cn.setTransform(rs, 0, 0, rs, -camX * rs, camY * rs);
    const sorted = actors.filter((a) => a.visible).sort((a, b) => (a.z || 0) - (b.z || 0));
    const prevLights = this.lightsFrame || scene.lights;
    for (const a of sorted) a.draw(cn, t, prevLights);
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
      const len = (scene.groundY - L.y) + 10, w0 = 10, w1 = L.shaftW || 120;
      const g = cfo.createLinearGradient(0, L.y, 0, L.y + len);
      const k = (L.shaftK ?? 0.38) * (L.intensity ?? 1);
      g.addColorStop(0, `rgba(255,255,255,${k})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      cfo.fillStyle = g;
      cfo.beginPath(); cfo.moveTo(L.x - w0, L.y + 12); cfo.lineTo(L.x + w0, L.y + 12); cfo.lineTo(L.x + w1, L.y + len); cfo.lineTo(L.x - w1, L.y + len); cfo.closePath(); cfo.fill();
    }
    if (scene.life) for (const l of scene.life) if (l.drawFog) l.drawFog(cfo, t);
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
    if (scene.rain) this.drawRain(cgl, scene, camX, dt);
    if (overlay) { cgl.setTransform(fs, 0, 0, fs, 0, 0); overlay(cgl, t); }

    this.present(scene);
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

  upload(name, canvas) {
    const gl = this.gl, tx = this.tex[name];
    gl.activeTexture(gl.TEXTURE0 + tx.unit);
    gl.bindTexture(gl.TEXTURE_2D, tx.t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  }

  present(scene) {
    const gl = this.gl, u = this.u, fx = this.fx;
    if (this.staticDirty) { this.upload('tFar', this.far); this.upload('tFg', this.fg); }
    this.upload('tNear', this.near);
    this.upload('tLight', this.light); this.upload('tFog', this.fog); this.upload('tGlow', this.glow);
    gl.uniform2f(u.uRes, this.view.width, this.view.height);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uMad, fx.mad);
    gl.uniform1f(u.uFade, fx.fade);
    gl.uniform1f(u.uFlash, fx.flash);
    gl.uniform1f(u.uRedFlash, fx.red);
    gl.uniform1f(u.uDesat, fx.desat);
    const f = scene.fog || {};
    gl.uniform1f(u.uFogAmt, f.amount ?? 0.55);
    const fc = f.color || [0.42, 0.5, 0.52];
    gl.uniform3f(u.uFogCol, fc[0], fc[1], fc[2]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
