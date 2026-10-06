// Characters. Each one is painted procedurally at full logical resolution every frame (so the
// animation stays fluid), lit by its nearest lamp, then reduced to the pixel grid as a sprite.
// Silhouette first: hats, coats, shawls, aprons and posture identify people in the dark.
import { P, shade } from '../art/palette.js';
import { pixelizeInto } from '../art/pixel.js';

const DEF = {
  h: 200, hat: 'bowler', hatColor: '#121316', coat: P.coat, coatLen: 0.78, flare: 1.15, build: 1, skin: P.skin,
  trousers: '#1c1d1f', boots: '#121110', skirt: false, apron: null, scarf: null, cane: false, lantern: false,
  stoop: 0, speed: 120, hair: '#1e1712', cape: false, bag: false, beard: null, moustache: null, sideburns: false,
  collarUp: false, buttons: 'single', belt: false, tails: false, rolled: false, patches: false, shawl: null,
  waistcoat: null, chain: false, number: null, bustle: false, lapel: '#d8cfbd', notebook: false, gloves: null, stubble: null,
};

const TAU = Math.PI * 2;
const STRIDE = 50;           // distance the body travels in half a walk cycle (logical px at h = 200)
const TURN = 0.17;           // seconds spent facing the viewer when turning round

// a capsule between two points
function limb(ctx, x0, y0, x1, y1, w0, w1) {
  const len = Math.hypot(x1 - x0, y1 - y0) || 0.001;
  ctx.save();
  ctx.translate(x0, y0);
  ctx.rotate(Math.atan2(-(x1 - x0), y1 - y0));
  segment(ctx, len, w0, w1);
  ctx.restore();
}

// a limb segment as a tapered capsule, drawn from (0,0) downward along +y after rotation
function segment(ctx, len, w0, w1) {
  ctx.beginPath();
  ctx.moveTo(-w0 / 2, 0);
  ctx.lineTo(-w1 / 2, len);
  ctx.arc(0, len, w1 / 2, Math.PI, 0, true);
  ctx.lineTo(w0 / 2, 0);
  ctx.arc(0, 0, w0 / 2, 0, Math.PI, true);
  ctx.fill();
  const prev = ctx.fillStyle, w = Math.max(w0, w1) / 2;
  const g = ctx.createLinearGradient(-w, 0, w, 0);
  g.addColorStop(0, 'rgba(0,0,0,0.32)'); g.addColorStop(0.38, 'rgba(0,0,0,0)');
  g.addColorStop(0.62, 'rgba(255,240,220,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = g; ctx.fill();
  ctx.fillStyle = prev;
}

export class Actor {
  constructor(name, opts = {}) {
    this.name = name;
    Object.assign(this, DEF, opts);
    this.x = opts.x ?? 0;
    this.y = opts.y ?? 600;
    this.facing = opts.facing ?? 1;
    this.phase = 0;
    this.moving = false;
    this.visible = opts.visible ?? true;
    this.talking = false;
    this.z = opts.z ?? 0;
    this.alpha = 1;
    this.lanternOn = opts.lanternOn ?? false;
    this.pose = opts.pose ?? null; // 'kneel', 'reach', 'cower', 'sit'
    this.look = 0;       // glance over the shoulder, 0..1
    this.v = 0; this.walkAmt = 0; this.vf = this.facing;
    this.idleT = Math.random() * 6;
    this.seed = (name.length * 7919 + name.charCodeAt(0) * 131) % 1000;
    this._target = null;
    this._resolve = null;
  }

  walkTo(x, { speed } = {}) {
    if (this._resolve) this._resolve(false);
    this._target = x;
    this._speed = speed || this.speed;
    this.facing = x >= this.x ? 1 : -1;
    if (typeof window !== 'undefined' && window.FAST) { this.x = x; this._target = null; return Promise.resolve(true); }
    return new Promise((res) => { this._resolve = res; if (Math.abs(x - this.x) < 2) this._arrive(true); });
  }

  stop() { if (this._resolve) this._arrive(false); }

  _arrive(ok) {
    this._target = null; this.moving = false;
    const r = this._resolve; this._resolve = null;
    if (r) r(ok);
  }

  update(dt) {
    this.idleT += dt;
    const s = this.h / 200;
    if (this.v === undefined) { this.v = 0; this.walkAmt = 0; this.vf = this.facing; }
    if (this._lastFacing === undefined) this._lastFacing = this.facing;
    if (this.facing !== this._lastFacing) {
      this._lastFacing = this.facing;
      const fast = typeof window !== 'undefined' && window.FAST;
      if (!this.pose && this.visible && !fast) { this.turnT = TURN; this.v *= 0.3; }
    }
    if (this.turnT > 0) this.turnT = Math.max(0, this.turnT - dt);
    if (this._target != null && this.turnT > 0) {
      // plant the feet and turn round before setting off the other way
      this.facing = Math.sign(this._target - this.x) || this.facing; this._lastFacing = this.facing;
      this.moving = false;
    } else if (this._target != null) {
      const d = this._target - this.x;
      const dir = Math.sign(d) || this.facing;
      this.facing = dir;
      // ease into the stride and brake over the last few steps
      const brake = Math.min(1, Math.abs(d) / (60 * s) + 0.3);
      this.v += (this._speed * brake - this.v) * Math.min(1, dt * 6);
      const step = Math.max(this.v, 40 * s) * dt;
      if (Math.abs(d) <= step) { this.x = this._target; this._arrive(true); }
      else {
        this.x += dir * step; this.moving = true;
        const prev = this.phase;
        this.phase += (step / (STRIDE * s)) * Math.PI;
        if (this.onStep && Math.floor(prev / Math.PI) !== Math.floor(this.phase / Math.PI)) this.onStep(this);
      }
    } else {
      this.moving = false;
      this.v = 0;
      // finish the step: bring the phase to the next foot plant
      const target = Math.ceil(this.phase / Math.PI - 0.15) * Math.PI;
      this.phase += (target - this.phase) * Math.min(1, dt * 7);
    }
    const wantWalk = this.moving ? Math.min(1, this.v / (this._speed || 1) + 0.35) : 0;
    this.walkAmt += (wantWalk - this.walkAmt) * Math.min(1, dt * (this.moving ? 6 : 9));
    this.vf = this.facing;
    // an idle glance over the shoulder every few seconds (never while talking or walking)
    const want = !this.moving && !this.talking && (!this.pose || this.fidget === 'look') && (this.idleT % 9) > 7.6 && this.fidget !== 'lantern' ? 1 : 0;
    this.look += (want - this.look) * Math.min(1, dt * 4);
    if (this.isPlayer) this.updateFidget(dt);
  }

  // Standing still for a while, he checks the dark with the lantern or shivers in the cold.
  updateFidget(dt) {
    this.stillT = this.moving || this.talking || !this.idleAllowed || (this.pose && !this.fidget) ? 0 : (this.stillT || 0) + dt;
    if (this.fidget) {
      this.fidgetT -= dt;
      if (this.fidget === 'shiver') this.shiver = Math.sin(this.fidgetT * 60) * 0.8;
      if (this.fidgetT <= 0 || this.stillT === 0) {
        if (this.pose === 'inspect' && this.fidget === 'lantern') this.pose = null;
        this.fidget = null; this.shiver = 0;
        this.nextFidget = 7 + Math.random() * 6;
      }
      return;
    }
    if (this.nextFidget === undefined) this.nextFidget = 8;
    if (this.stillT > this.nextFidget) {
      const pick = Math.random();
      if (pick < 0.45 && this.lantern && this.lanternOn) { this.fidget = 'lantern'; this.fidgetT = 1.6; this.pose = 'inspect'; }
      else if (pick < 0.75) { this.fidget = 'shiver'; this.fidgetT = 0.7; }
      else { this.fidget = 'look'; this.fidgetT = 1.8; this.idleT = 7.7; }
      this.stillT = 0.01;
    }
  }

  light() {
    if (!this.lantern || !this.lanternOn) {
      // the protagonist always keeps a faint fill so he never vanishes in the dark
      return this.isPlayer ? { x: this.x, y: this.y - this.h * 0.55, r: this.h * 1.3, color: [0.55, 0.6, 0.7], intensity: 0.24, halo: 0, reflect: false } : null;
    }
    const s = this.h / 200;
    const lift = this.pose === 'inspect' ? 46 : this.pose === 'take' ? -24 : this.pose === 'kneel' ? -30 : 0;
    const reachX = this.pose === 'inspect' ? 34 : 0;
    return {
      x: this.x + this.facing * (22 + reachX) * s, y: this.y - (92 + lift) * s, r: 430, color: P.lantern, intensity: 0.85, flicker: 0.04,
      cone: { dir: this.facing, spread: 0.3 }, halo: 26, haloK: 0.7, reflect: false,
    };
  }

  // ------------------------------------------------------------ sprite pass
  draw(ctx, t, lights = []) {
    const rs = ctx.getTransform().a || 0.5;
    const W = Math.ceil(this.h * 1.6), Hh = Math.ceil(this.h * 1.4);
    if (!this._hi || this._hiH !== this.h) {
      this._hi = document.createElement('canvas'); this._hi.width = W; this._hi.height = Hh;
      this._hiH = this.h; this._lo = null;
    }
    if (!this._lo || this._loRs !== rs) {
      this._lo = document.createElement('canvas');
      this._lo.width = Math.max(1, Math.round(W * rs)); this._lo.height = Math.max(1, Math.round(Hh * rs));
      this._loRs = rs;
    }
    const ox = W / 2, oy = Hh - this.h * 0.12;
    // still characters only need a fresh sprite a few times per second
    this.blink = this.blinkAt(t);
    const key = `${this.moving}|${this.talking}|${this.pose}|${this.facing}|${this.lanternOn}|${Math.round(this.look * 4)}|${Math.round(this.x)}|${this.turnT > 0}|${this.blink}|${Math.round((this.walkAmt ?? 0) * 8)}|${Math.round((this.shiver || 0) * 2)}`;
    const stale = this.moving || this.talking || this.turnT > 0 || this.grind || (this.walkAmt ?? 0) > 0.01 || key !== this._key || t - (this._drawnAt ?? -1) > 0.12 || t < (this._drawnAt ?? 0);
    if (!stale) { this.blit(ctx, rs, ox, oy, W, Hh); return; }
    this._key = key; this._drawnAt = t;
    const b = this._hi, bc = b.getContext('2d', { willReadFrequently: true });
    bc.setTransform(1, 0, 0, 1, 0, 0);
    bc.clearRect(0, 0, W, Hh);
    bc.translate(ox - this.x, oy - this.y);
    if (this.turnT > 0 && !this.pose) this.drawFront(bc, t);
    else this.drawFigure(bc, t);
    bc.setTransform(1, 0, 0, 1, 0, 0);
    this.rimLights(bc, W, Hh, lights);
    bc.globalCompositeOperation = 'source-atop';
    const g2 = bc.createLinearGradient(0, oy - this.h, 0, oy);
    g2.addColorStop(0, 'rgba(150,170,190,0.10)'); g2.addColorStop(0.6, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,0.4)');
    bc.fillStyle = g2; bc.fillRect(0, 0, W, Hh);
    bc.globalCompositeOperation = 'source-over';
    pixelizeInto(b, this._lo, { dither: 8, alphaCut: 100, edge: 0.62 });
    this.blit(ctx, rs, ox, oy, W, Hh);
  }

  // Edge lighting from the actual lights in the scene. For each of the two strongest lights, the
  // silhouette is subtracted from itself shifted toward the light: what remains is the rim that
  // faces it, which is painted in the light's colour. The far side gets a band of shadow.
  rimLights(bc, W, Hh, lights) {
    const s = this.h / 200, cy = this.y - this.h * 0.6;
    const found = [];
    for (const L of lights) {
      if (L.off || L.cone) continue;
      const dx = L.x - this.x, dy = L.y - cy, d = Math.hypot(dx, dy) || 1;
      const k = (L.intensity ?? 1) * Math.max(0, 1 - d / (L.r * 1.15));
      if (k > 0.03) found.push({ ux: dx / d, uy: dy / d, k, c: L.color || [1, 0.8, 0.6] });
    }
    // a lantern lights its bearer from below and in front
    if (this.lantern && this.lanternOn) found.push({ ux: this.facing * 0.6, uy: 0.8, k: 0.5, c: P.lantern || [1, 0.75, 0.45] });
    found.sort((a, b) => b.k - a.k);
    if (!this._rim || this._rim.width !== W || this._rim.height !== Hh) {
      this._rim = document.createElement('canvas'); this._rim.width = W; this._rim.height = Hh;
    }
    const rc = this._rim.getContext('2d');
    const pass = (ux, uy, width, fill, mode) => {
      rc.globalCompositeOperation = 'copy'; rc.drawImage(this._hi, 0, 0);
      rc.globalCompositeOperation = 'destination-out'; rc.drawImage(this._hi, -ux * width, -uy * width);
      rc.globalCompositeOperation = 'source-in'; rc.fillStyle = fill; rc.fillRect(0, 0, W, Hh);
      rc.globalCompositeOperation = 'source-over';
      bc.globalCompositeOperation = mode; bc.drawImage(this._rim, 0, 0);
      bc.globalCompositeOperation = 'source-over';
    };
    const rgb = (c, a) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;
    if (found[0]) pass(-found[0].ux, -found[0].uy, Math.max(5, 9 * s), `rgba(0,0,0,${Math.min(0.42, 0.18 + found[0].k * 0.4)})`, 'source-atop');
    for (const f of found.slice(0, 2)) pass(f.ux, f.uy, Math.max(2.5, 3.2 * s), rgb(f.c, Math.min(0.7, f.k * 0.95)), 'lighter');
    if (this.wet) pass(0, -1, Math.max(2, 2.2 * s), 'rgba(170,190,205,0.13)', 'lighter');
  }

  // Rain bouncing off the hat brim and the shoulders (drawn into the additive glow layer).
  rainHits(ctx, t, amount) {
    const s = this.h / 200, n = Math.round(6 * amount + 2);
    const top = this.y - this.h * (this.pose === 'kneel' || this.pose === 'sit' ? 0.78 : this.hat === 'top' || this.hat === 'helmet' ? 1.02 : 0.96);
    for (let i = 0; i < n; i++) {
      const h1 = ((i * 92821 + this.seed * 13) % 997) / 997, h2 = ((i * 6871 + this.seed) % 503) / 503;
      const k = (t * (1.1 + h2) + h1) % 1;
      if (k > 0.22) continue;
      const p = k / 0.22, a = (1 - p) * 0.75;
      const onHat = i % 3 === 0;
      const x = this.x + (onHat ? (h2 - 0.5) * 26 * s : (i % 2 ? 1 : -1) * (14 + h1 * 10) * s);
      const y = onHat ? top : this.y - this.h * 0.78 + (this.pose === 'kneel' ? this.h * 0.18 : 0);
      ctx.fillStyle = `rgba(175,195,205,${a})`;
      ctx.fillRect(x - 1 - p * 7, y - p * 9 + p * p * 10, 2, 2);
      ctx.fillRect(x - 1 + p * 7, y - p * 8 + p * p * 10, 2, 2);
      if (p < 0.4) ctx.fillRect(x - 1, y - 1, 3, 2);
    }
  }

  blit(ctx, rs, ox, oy, W, Hh) {
    this.drawShadow(ctx);
    const px = Math.round((this.x - ox) * rs) / rs, py = Math.round((this.y - oy) * rs) / rs;
    if (this.reflect) {
      // a dark, squashed reflection in the wet street, broken up by the cobbles
      ctx.save();
      ctx.beginPath(); ctx.rect(this.x - W / 2, this.y + 2, W, this.h * 0.55); ctx.clip();
      ctx.translate(0, this.y + 2); ctx.scale(1, -0.55); ctx.translate(0, -this.y);
      ctx.globalAlpha = this.alpha * 0.3;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this._lo, px, py, W, Hh);
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this._lo, px, py, W, Hh);
    ctx.restore();
  }

  drawShadow(ctx) {
    const s = this.h / 200;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    const g = ctx.createRadialGradient(this.x, this.y, 2, this.x, this.y, 46 * s * this.build);
    g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.translate(this.x, this.y); ctx.scale(1, 0.16); ctx.translate(-this.x, -this.y);
    ctx.fillRect(this.x - 50 * s, this.y - 50 * s, 100 * s, 100 * s);
    ctx.restore();
  }

  // Breath vapour in the cold, drawn into the fog layer so it is lit like fog.
  breath(ctx, t) {
    if (!this.visible || this.noBreath) return;
    const s = this.h / 200;
    const period = this.moving ? 1.6 : 3.4;
    const k = ((((t + this.x * 0.013) % period) + period) % period) / period;
    if (k > 0.45) return;
    const p = k / 0.45;
    const lift = this.pose === 'kneel' ? 38 : this.pose === 'sit' ? 44 : 0;
    const mx = this.x + this.facing * (20 + p * 26) * s, my = this.y - (178 - lift - p * 10) * s;
    const g = ctx.createRadialGradient(mx, my, 1, mx, my, (6 + p * 16) * s);
    g.addColorStop(0, `rgba(255,255,255,${0.5 * (1 - p)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(mx - 30 * s, my - 30 * s, 60 * s, 60 * s);
  }

  // A head-and-shoulders portrait for the dialogue box, painted from the same figure as the sprite
  // and reduced to the same pixel grid. mode: 'talk' (mouth moves), 'listen', or 'voice' (the Host:
  // Ashgrove's own face, mirrored like a reflection, drowned in green and red).
  drawPortrait(out, t, mode = 'listen') {
    const S = 192;
    if (!this._port) { this._port = document.createElement('canvas'); this._port.width = this._port.height = S; }
    const c = this._port.getContext('2d', { willReadFrequently: true });
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, S, S);
    const keep = ['x', 'y', 'h', 'pose', 'walkAmt', 'look', 'facing', 'shiver', 'turnT', 'talking', 'moving', 'blink', 'phase'];
    const saved = Object.fromEntries(keep.map((k) => [k, this[k]]));
    Object.assign(this, { x: 0, y: 0, h: 200, pose: null, walkAmt: 0, look: 0, facing: 1, shiver: 0, turnT: 0, moving: false, phase: 0 });
    this.talking = mode === 'talk';
    this.blink = mode === 'voice' ? false : this.blinkAt(t);
    const k = 2.7, headY = -183 + this.stoop * 6;
    c.save();
    if (mode === 'voice') { c.translate(S, 0); c.scale(-1, 1); }
    c.translate(S / 2 - (6 + this.stoop * 17) * k, 82 - headY * k);
    c.scale(k, k);
    // a slight sway, as if breathing in front of the lamp
    c.rotate(Math.sin(t * 0.9 + this.seed) * 0.01);
    this.drawFigure(c, t);
    c.restore();
    Object.assign(this, saved);
    // light: warm key from the lamp side, cold fill, the bottom fading into the dark
    c.globalCompositeOperation = 'source-atop';
    const key = c.createLinearGradient(S, 0, 0, 0);
    if (mode === 'voice') { key.addColorStop(0, 'rgba(90,230,170,0.45)'); key.addColorStop(1, 'rgba(120,10,10,0.55)'); }
    else { key.addColorStop(0, 'rgba(255,190,120,0.28)'); key.addColorStop(0.55, 'rgba(0,0,0,0)'); key.addColorStop(1, 'rgba(20,30,50,0.35)'); }
    c.fillStyle = key; c.fillRect(0, 0, S, S);
    const fall = c.createLinearGradient(0, S * 0.55, 0, S);
    fall.addColorStop(0, 'rgba(0,0,0,0)'); fall.addColorStop(1, 'rgba(0,0,0,0.9)');
    c.fillStyle = fall; c.fillRect(0, 0, S, S);
    c.globalCompositeOperation = 'source-over';
    if (!this._portLo) { this._portLo = document.createElement('canvas'); this._portLo.width = this._portLo.height = 72; }
    pixelizeInto(this._port, this._portLo, { dither: 8, alphaCut: 60, edge: 0.62 });
    const o = out.getContext('2d');
    o.imageSmoothingEnabled = false;
    o.clearRect(0, 0, out.width, out.height);
    if (mode === 'voice' && Math.random() < 0.12) o.drawImage(this._portLo, (Math.random() - 0.5) * 6, 0, out.width, out.height);
    else o.drawImage(this._portLo, 0, 0, out.width, out.height);
  }

  // Everyone blinks every few seconds, each on their own rhythm (and now and then twice).
  blinkAt(t) {
    const per = 3.1 + (this.seed % 17) / 6;
    const k = ((t + this.seed * 0.37) % per + per) % per;
    return k < 0.13 || (this.seed % 3 === 0 && k > 0.3 && k < 0.42);
  }

  // ------------------------------------------------------------ figure
  // Where each foot is during the walk. Stance: planted and sliding back under the body at
  // exactly the speed the body moves forward. Swing: an arc forward with the toe lifting.
  footAt(q, w) {
    const S = STRIDE * w, lift = 15 * w;
    q = ((q % TAU) + TAU) % TAU;
    if (q < Math.PI) { const u = q / Math.PI; return { x: S / 2 - u * S, y: 0, pitch: 0 }; }
    const u = (q - Math.PI) / Math.PI, e = u * u * (3 - 2 * u);
    return { x: -S / 2 + e * S, y: -lift * Math.sin(u * Math.PI), pitch: -0.35 * Math.sin(u * Math.PI) + (u > 0.8 ? 0.15 : 0) };
  }

  drawFigure(ctx, t) {
    const s = this.h / 200;
    const w = this.walkAmt;                              // 0 standing .. 1 full stride
    const pose = this.pose;
    const kneel = pose === 'kneel', cower = pose === 'cower', sit = pose === 'sit', reach = pose === 'reach';
    const take = pose === 'take', inspect = pose === 'inspect';
    const qa = this.phase, qb = this.phase + Math.PI;
    const fa = this.footAt(qa, w), fb = this.footAt(qb, w);
    const sw = fa.x / (STRIDE / 2 || 1);                 // -1..1, front leg forward when positive
    const walk = w;
    const breathe = Math.sin(t * 1.7 + this.seed) * 0.8;
    // weight: the pelvis drops when both feet are on the ground and rises as a leg passes under it
    const bobY = 2.6 * Math.cos(2 * qa) * w + breathe * 0.3;
    const lower = kneel ? 38 : sit ? 44 : cower ? 22 : take ? 16 : 0;
    const gl = -lower;

    ctx.save();
    ctx.translate(this.x + (this.shiver || 0), this.y);
    ctx.scale(this.facing * s, s);
    ctx.translate(0, lower);

    const bw = 24 * this.build;                           // half shoulder width
    const lean = this.stoop * 9 + w * 5 + (cower ? 14 : 0) + (take ? 16 : 0) + (inspect ? 6 : 0);
    const hipY = -97 + bobY, shoulderY = -158 + this.stoop * 6 + breathe * 0.4 + (cower ? 10 : 0) + bobY * 0.9;
    const hemY = this.skirt ? (sit ? -48 : -2) : hipY + (this.coatLen - 0.5) * 140;
    const back = shade(this.coat, 0.62), coatLit = shade(this.coat, 1.18);

    // foot targets for every pose (ankle positions, local space)
    let footBack = { x: -3 + fb.x, y: gl - 6 + fb.y, pitch: fb.pitch }, footFront = { x: 4 + fa.x, y: gl - 6 + fa.y, pitch: fa.pitch };
    if (kneel) { footFront = { x: 30, y: gl - 6, pitch: 0 }; footBack = { x: -44, y: gl - 4, pitch: 0.9 }; }
    else if (sit) { footFront = { x: 46, y: gl - 6, pitch: 0 }; footBack = { x: 38, y: gl - 6, pitch: 0 }; }
    else if (cower) { footFront = { x: 16, y: gl - 6, pitch: 0 }; footBack = { x: -20, y: gl - 6, pitch: 0.3 }; }
    else if (take) { footFront = { x: 22, y: gl - 6, pitch: 0 }; footBack = { x: -16, y: gl - 6, pitch: 0.2 }; }

    // ---- back arm and back leg
    this.arm(ctx, -1, shoulderY, lean, bw, -sw * 0.42 * walk, back, t);
    this.legIK(ctx, -3, hipY, footBack, true);

    // ---- coat tails / bustle behind the body
    if (this.tails && !this.skirt) {
      ctx.fillStyle = back;
      ctx.beginPath(); ctx.moveTo(-bw * 0.7, hipY - 4); ctx.lineTo(-bw * 1.05 - sw * 3, hipY + 52); ctx.lineTo(-bw * 0.2, hipY + 50); ctx.closePath(); ctx.fill();
    }
    if (this.bustle && this.skirt) {
      ctx.fillStyle = back;
      ctx.beginPath(); ctx.ellipse(-bw * 0.9, hipY + 6, bw * 0.7, 22, 0, 0, TAU); ctx.fill();
    }

    // ---- front leg (drawn before the coat so the coat covers the thigh)
    this.legIK(ctx, 4, hipY, footFront, false);

    // ---- body
    // the hem is pushed by the forward knee and trails behind; at rest it stirs in the wind
    const sway = w > 0.05 ? -sw * 5 * w : Math.sin(t * 0.9 + this.seed) * 1.2;
    ctx.fillStyle = this.coat;
    ctx.beginPath();
    if (this.skirt) {
      const flareB = (sit ? 2.3 : 1.65) + walk * 0.06, flareF = sit ? 2.4 : 1.55;
      ctx.moveTo(-bw * 0.78 + lean, shoulderY + 4);
      ctx.quadraticCurveTo(-bw * 0.55 + lean, hipY - 26, -bw * 0.62, hipY - 6);
      ctx.quadraticCurveTo(-bw * 1.2, hipY + 40, -bw * flareB + sway, hemY);
      ctx.lineTo(bw * flareF + sway, hemY);
      ctx.quadraticCurveTo(bw * 1.1, hipY + 40, bw * 0.66, hipY - 6);
      ctx.quadraticCurveTo(bw * 0.62 + lean, hipY - 26, bw * 0.84 + lean, shoulderY + 4);
    } else {
      const fl = this.flare;
      // a fitted greatcoat: waist, then a skirt whose front is pushed by the leading knee
      const push = Math.max(0, footFront.x - 4) * 0.35 * w, trail = Math.max(0, -footBack.x - 3) * 0.3 * w;
      const waistY = hipY - 12;
      ctx.moveTo(-bw + lean, shoulderY + 4);
      ctx.quadraticCurveTo(-bw * 0.95 + lean * 0.6, waistY - 20, -bw * 0.8 + lean * 0.3, waistY);
      ctx.quadraticCurveTo(-bw * 0.95, hipY + 10, -bw * fl + sway - trail, hemY);
      ctx.quadraticCurveTo(sway, hemY + 4, bw * fl * 0.92 + sway * 0.6 + push, hemY + 1);
      ctx.quadraticCurveTo(bw * 0.92, hipY + 10, bw * 0.78 + lean * 0.3, waistY);
      ctx.quadraticCurveTo(bw * 0.92 + lean * 0.6, waistY - 20, bw * 0.95 + lean, shoulderY + 4);
    }
    ctx.quadraticCurveTo(lean, shoulderY - 9, -bw + lean, shoulderY + 4);
    ctx.fill();
    {
      const tg = ctx.createLinearGradient(-bw * 1.4, 0, bw * 1.4 + lean, 0);
      tg.addColorStop(0, 'rgba(0,0,0,0.32)'); tg.addColorStop(0.32, 'rgba(0,0,0,0)');
      tg.addColorStop(0.7, 'rgba(255,240,220,0.04)'); tg.addColorStop(1, 'rgba(0,0,0,0.26)');
      ctx.fillStyle = tg; ctx.fill();
    }

    // shadow side, folds and the lit front edge
    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    ctx.beginPath();
    ctx.moveTo(-bw + lean, shoulderY + 6); ctx.lineTo(-bw * 0.2 + lean, shoulderY + 6);
    ctx.lineTo(-bw * 0.1 + sway, hemY); ctx.lineTo(-bw * (this.skirt ? 1.6 : this.flare) + sway, hemY); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
    for (const k of [0.25, 0.55]) { ctx.beginPath(); ctx.moveTo(bw * k * 0.6 + lean * 0.5, hipY + 6); ctx.lineTo(bw * k + sway * 0.8, hemY - 4); ctx.stroke(); }
    if (!this.skirt && this.coatLen > 0.7) {
      // the back vent opens as the legs part
      const open = 3 + Math.abs(sw) * 9 * w;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath(); ctx.moveTo(-bw * 0.2 + sway * 0.6, hipY + 26); ctx.lineTo(-bw * 0.2 + sway * 0.8 - open, hemY + 1); ctx.lineTo(-bw * 0.2 + sway * 0.8 + open, hemY + 1); ctx.closePath(); ctx.fill();
      // half-belt across the waist at the back
      ctx.fillStyle = shade(this.coat, 0.75); ctx.fillRect(-bw * 0.85, hipY - 16, bw * 0.75, 6);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-bw * 0.5, hipY - 15, 3, 4);
    }
    ctx.strokeStyle = coatLit; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(bw * 0.9 + lean, shoulderY + 8); ctx.lineTo(bw * 0.82, hipY); ctx.lineTo(bw * (this.skirt ? 1.5 : this.flare * 0.92) + sway * 0.6, hemY - 2); ctx.stroke();

    if (!this.skirt) {
      // waistcoat / shirt front and lapels
      ctx.fillStyle = this.waistcoat || '#2a2622';
      ctx.beginPath(); ctx.moveTo(bw * 0.42 + lean, shoulderY + 6); ctx.lineTo(bw * 0.86 + lean, shoulderY + 6); ctx.lineTo(bw * 0.7 + lean * 0.4, hipY - 6); ctx.lineTo(bw * 0.5 + lean * 0.4, hipY - 6); ctx.fill();
      ctx.fillStyle = this.lapel;
      ctx.beginPath(); ctx.moveTo(bw * 0.6 + lean, shoulderY + 3); ctx.lineTo(bw * 0.86 + lean, shoulderY + 3); ctx.lineTo(bw * 0.7 + lean, shoulderY + 22); ctx.fill();
      ctx.fillStyle = shade(this.coat, 0.85);
      ctx.beginPath(); ctx.moveTo(bw * 0.3 + lean, shoulderY + 2); ctx.lineTo(bw * 0.62 + lean, shoulderY + 4); ctx.lineTo(bw * 0.5 + lean * 0.6, shoulderY + 40); ctx.closePath(); ctx.fill();
      if (this.chain) { ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(bw * 0.5 + lean * 0.4, hipY - 22); ctx.quadraticCurveTo(bw * 0.68, hipY - 14, bw * 0.84, hipY - 22); ctx.stroke(); }
      ctx.fillStyle = this.belt ? '#b9a36a' : 'rgba(0,0,0,0.55)';
      const cols = this.buttons === 'double' ? [0.55, 0.78] : [0.78];
      for (const cx of cols) for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(bw * cx + lean * (0.7 - i * 0.15), shoulderY + 26 + i * 15, 1.8, 0, TAU); ctx.fill(); }
      if (this.belt) { ctx.fillStyle = '#0c0d10'; ctx.fillRect(-bw * 0.86, hipY - 10, bw * 1.72, 7); ctx.fillStyle = '#b9a36a'; ctx.fillRect(bw * 0.55, hipY - 10, 6, 7); }
      if (this.number) { ctx.fillStyle = '#b9a36a'; ctx.fillRect(bw * 0.55 + lean, shoulderY - 2, 8, 4); }
      if (this.patches) { ctx.fillStyle = shade(this.coat, 1.35); ctx.fillRect(-bw * 0.3, hipY - 30, 10, 9); ctx.fillRect(bw * 0.2, hipY + 22, 9, 11); }
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(bw * 0.15 + lean * 0.3, hipY + 4, 16, 3); // pocket flap
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(-bw * 0.66, hipY - 8, bw * 1.34, 5);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-bw * 1.6 + sway, hemY - 6, bw * 3.1, 6);
      if (this.patches) { ctx.fillStyle = shade(this.coat, 1.4); ctx.fillRect(-bw * 0.8, hipY + 30, 11, 10); ctx.fillRect(bw * 0.4, hipY + 54, 12, 9); }
    }
    if (this.cape) {
      ctx.fillStyle = shade(this.coat, 0.9);
      ctx.beginPath(); ctx.moveTo(-bw - 5 + lean, shoulderY - 1); ctx.quadraticCurveTo(-bw * 1.5, shoulderY + 40, -bw * 1.3 + sway * 0.4, shoulderY + 62); ctx.lineTo(bw * 1.3 + sway * 0.4, shoulderY + 62); ctx.quadraticCurveTo(bw * 1.3, shoulderY + 30, bw + 5 + lean, shoulderY - 1); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-bw * 1.3 + sway * 0.4, shoulderY + 58, bw * 2.6, 4);
    }
    if (this.apron) {
      ctx.fillStyle = this.apron;
      ctx.beginPath(); ctx.moveTo(bw * 0.05 + lean, shoulderY + 12); ctx.lineTo(bw * 0.95 + lean, shoulderY + 12); ctx.lineTo(bw * 1.15 + sway * 0.5, hemY - 4); ctx.lineTo(sway * 0.5, hemY - 4); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bw * 0.3 + lean, shoulderY + 12); ctx.lineTo(bw * 0.1 + lean, shoulderY - 2); ctx.stroke();
      ctx.fillStyle = 'rgba(60,10,8,0.45)'; ctx.beginPath(); ctx.ellipse(bw * 0.6, hipY + 18, 7, 11, 0.3, 0, TAU); ctx.fill();
    }
    if (this.shawl) {
      ctx.fillStyle = this.shawl;
      ctx.beginPath(); ctx.moveTo(-bw * 1.05 + lean, shoulderY - 4); ctx.lineTo(bw * 1.0 + lean, shoulderY - 4); ctx.lineTo(bw * 0.6 + sway * 0.3, shoulderY + 46); ctx.lineTo(-bw * 0.2 + sway * 0.3, shoulderY + 58); ctx.lineTo(-bw * 1.1 + sway * 0.3, shoulderY + 40); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = shade(this.shawl, 0.6); ctx.lineWidth = 1.5;
      for (let i = 0; i < 7; i++) { const x = -bw * 1.0 + i * bw * 0.26 + sway * 0.3; ctx.beginPath(); ctx.moveTo(x, shoulderY + 40 + (i % 3) * 5); ctx.lineTo(x - 1, shoulderY + 48 + (i % 3) * 5); ctx.stroke(); }
    }
    if (this.scarf) {
      ctx.fillStyle = this.scarf;
      ctx.beginPath(); ctx.moveTo(-bw * 0.6 + lean, shoulderY - 3); ctx.lineTo(bw * 0.8 + lean, shoulderY - 3); ctx.lineTo(bw * 0.7 + lean, shoulderY + 10); ctx.lineTo(-bw * 0.5 + lean, shoulderY + 10); ctx.fill();
      // the ends hang down the chest and lift a little with the stride
      const flap = sw * 2 * (this.walkAmt || 0) + Math.sin(t * 2 + this.seed) * 0.8;
      ctx.beginPath(); ctx.moveTo(bw * 0.45 + lean, shoulderY + 6); ctx.lineTo(bw * 0.72 + lean, shoulderY + 6); ctx.lineTo(bw * 0.7 + lean + flap, shoulderY + 34); ctx.lineTo(bw * 0.5 + lean + flap, shoulderY + 32); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(bw * 0.5 + lean + flap, shoulderY + 28, bw * 0.2, 4);
    }
    if (this.bag) { ctx.fillStyle = shade(P.wood, 0.7); ctx.fillRect(-bw * 1.1, hipY - 8, 18, 30); ctx.fillStyle = '#7a6440'; ctx.fillRect(-bw * 1.1 + 6, hipY - 4, 6, 3); }

    // collar
    ctx.fillStyle = shade(this.coat, this.collarUp ? 0.95 : 0.8);
    if (this.collarUp) { ctx.beginPath(); ctx.moveTo(-bw * 0.5 + lean, shoulderY + 2); ctx.lineTo(-bw * 0.35 + lean, shoulderY - 18); ctx.lineTo(bw * 0.55 + lean, shoulderY - 12); ctx.lineTo(bw * 0.6 + lean, shoulderY + 4); ctx.fill(); }
    else if (!this.skirt) ctx.fillRect(-bw * 0.5 + lean, shoulderY - 3, bw * 1.15, 7);

    // ---- head
    const nod = this.talking ? Math.sin(t * 9) * 1.2 : 0;
    const hx = lean + 6 + this.stoop * 8, hy = shoulderY - 22 + nod;
    this.head(ctx, hx, hy, t);

    // ---- front arm
    let armA = sw * 0.42 * walk;
    if (reach) armA = this.grind ? -1.15 + Math.sin(t * 7 + this.seed) * 0.16 : -1.25;
    else if (take) armA = -0.55;
    else if (inspect) armA = -1.35;
    else if (this.lantern && this.lanternOn) armA = -0.18 + sw * 0.07 * walk;
    else if (this.talking && !this.notebook && !this.moving) {
      // a hand that comes up to make a point, then drops again
      const g = Math.max(0, Math.sin(t * 1.3 + this.seed));
      armA = -0.5 * g * g + Math.sin(t * 5.2) * 0.06 * g;
    }
    this.arm(ctx, 1, shoulderY, lean, bw, armA, this.rolled ? this.coat : shade(this.coat, 1.06), t, true);

    ctx.restore();
  }

  // Turning round: for a beat the figure faces the viewer, the face already leading toward the
  // new direction, the knees dipping slightly as the weight shifts. No horizontal squash.
  drawFront(ctx, t) {
    const s = this.h / 200, dir = this.facing;
    const k = 1 - this.turnT / TURN;                     // 0..1 through the turn
    const dip = Math.sin(k * Math.PI) * 3;
    const breathe = Math.sin(t * 1.7 + this.seed) * 0.8;
    const bw = 24 * this.build;
    const hipY = -97 + dip, shoulderY = -158 + this.stoop * 6 + breathe * 0.4 + dip;
    const hemY = this.skirt ? -2 : hipY + (this.coatLen - 0.5) * 140;
    const lead = dir * 2.5;                              // the head turns before the body

    ctx.save();
    ctx.translate(this.x + (this.shiver || 0), this.y);
    ctx.scale(s, s);

    // legs, slightly apart, weight on the foot toward the new direction
    for (const side of [-1, 1]) {
      const hx = side * 9, fxp = side * 11 + (side === dir ? 2 : 0);
      const lift = side === dir ? 0 : Math.sin(k * Math.PI) * 4;
      ctx.fillStyle = side === dir ? this.trousers : shade(this.trousers, 0.75);
      limb(ctx, hx, hipY, (hx + fxp) / 2, -50 + dip * 0.5 - lift * 0.5, 15, 12);
      limb(ctx, (hx + fxp) / 2, -50 + dip * 0.5 - lift * 0.5, fxp, -8 - lift, 12, 10);
      ctx.fillStyle = side === dir ? this.boots : shade(this.boots, 0.7);
      ctx.beginPath(); ctx.ellipse(fxp + side * 2, -3 - lift, 8.5, 6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#050505'; ctx.fillRect(fxp + side * 2 - 8, 1 - lift, 17, 2.5);
    }

    // arms hang at the sides, behind the coat edge
    const armX = bw * 0.98;
    for (const side of [-1, 1]) {
      const swingOut = side === dir ? 4 : 1;
      const hx = side * (armX + swingOut), hy = shoulderY + 76;
      ctx.fillStyle = side === dir ? shade(this.coat, 1.06) : shade(this.coat, 0.7);
      limb(ctx, side * armX, shoulderY + 8, side * (armX + 2), shoulderY + 44, 14, 12);
      limb(ctx, side * (armX + 2), shoulderY + 44, hx, hy - 4, 12, 10);
      ctx.fillStyle = this.gloves || this.skin;
      ctx.beginPath(); ctx.ellipse(hx, hy, 5.5, 7, 0, 0, TAU); ctx.fill();
      if (side === dir && this.lantern && this.lanternOn) {
        ctx.strokeStyle = '#3a3026'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy + 6, 6, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = '#1e1a16'; ctx.fillRect(hx - 10, hy + 8, 20, 24); ctx.fillRect(hx - 6, hy + 4, 12, 5);
        ctx.fillStyle = '#ffd795'; ctx.fillRect(hx - 6, hy + 12, 12, 14);
        ctx.fillStyle = '#fff4d8'; ctx.fillRect(hx - 2, hy + 16, 4, 6);
        ctx.fillStyle = '#7a6440'; ctx.fillRect(hx - 10, hy + 10, 20, 2); ctx.fillRect(hx - 10, hy + 26, 20, 2);
        ctx.fillStyle = '#2a2420'; ctx.fillRect(hx - 12, hy + 30, 24, 4);
      }
      if (side === dir && this.cane) { ctx.fillStyle = '#100c09'; ctx.fillRect(hx - 2, hy, 4, -hy - 4); ctx.fillStyle = '#b9a36a'; ctx.fillRect(hx - 3, hy - 4, 6, 6); }
    }

    // coat / dress, seen from the front
    ctx.fillStyle = this.coat;
    ctx.beginPath();
    const fl = this.skirt ? 1.6 : this.flare;
    const waistY = hipY - 12;
    ctx.moveTo(-bw, shoulderY + 4);
    ctx.quadraticCurveTo(-bw * 0.95, waistY - 20, -bw * 0.8, waistY);
    ctx.quadraticCurveTo(-bw * 0.95, hipY + 10, -bw * fl, hemY);
    ctx.quadraticCurveTo(0, hemY + 4, bw * fl, hemY);
    ctx.quadraticCurveTo(bw * 0.95, hipY + 10, bw * 0.8, waistY);
    ctx.quadraticCurveTo(bw * 0.95, waistY - 20, bw, shoulderY + 4);
    ctx.quadraticCurveTo(0, shoulderY - 9, -bw, shoulderY + 4);
    ctx.fill();
    // the side away from the light falls into shadow; a lit edge on the other
    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    ctx.beginPath(); ctx.moveTo(-dir * bw, shoulderY + 6); ctx.lineTo(-dir * bw * 0.35, shoulderY + 6); ctx.lineTo(-dir * bw * 0.45, hemY); ctx.lineTo(-dir * bw * fl, hemY); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(this.coat, 1.18); ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(dir * bw * 0.92, shoulderY + 8); ctx.lineTo(dir * bw * 0.8, waistY); ctx.lineTo(dir * bw * fl * 0.96, hemY - 2); ctx.stroke();

    if (!this.skirt) {
      // the opening of the coat, waistcoat, lapels and buttons down the middle
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-1, shoulderY + 30, 2, hemY - shoulderY - 32);
      ctx.fillStyle = this.waistcoat || '#2a2622';
      ctx.beginPath(); ctx.moveTo(-bw * 0.32, shoulderY + 2); ctx.lineTo(bw * 0.32, shoulderY + 2); ctx.lineTo(0, shoulderY + 42); ctx.closePath(); ctx.fill();
      ctx.fillStyle = this.lapel;
      ctx.beginPath(); ctx.moveTo(-bw * 0.12, shoulderY + 2); ctx.lineTo(bw * 0.12, shoulderY + 2); ctx.lineTo(0, shoulderY + 16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(this.coat, 0.85);
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * bw * 0.32, shoulderY + 2); ctx.lineTo(side * bw * 0.6, shoulderY + 4); ctx.lineTo(side * bw * 0.08, shoulderY + 40); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = this.belt ? '#b9a36a' : 'rgba(0,0,0,0.55)';
      const cols = this.buttons === 'double' ? [-6, 6] : [3];
      for (const cx of cols) for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(cx, shoulderY + 46 + i * 14, 1.8, 0, TAU); ctx.fill(); }
      if (this.chain) { ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-bw * 0.4, hipY - 22); ctx.quadraticCurveTo(0, hipY - 12, bw * 0.4, hipY - 22); ctx.stroke(); }
      if (this.belt) { ctx.fillStyle = '#0c0d10'; ctx.fillRect(-bw * 0.82, hipY - 10, bw * 1.64, 7); ctx.fillStyle = '#b9a36a'; ctx.fillRect(-3, hipY - 10, 6, 7); }
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-bw * 0.7, hipY + 4, 14, 3); ctx.fillRect(bw * 0.7 - 14, hipY + 4, 14, 3);
      if (this.number) { ctx.fillStyle = '#b9a36a'; ctx.fillRect(-bw * 0.7, shoulderY - 2, 8, 4); ctx.fillRect(bw * 0.7 - 8, shoulderY - 2, 8, 4); }
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(-bw * 0.72, hipY - 8, bw * 1.44, 5);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-bw * 1.6, hemY - 6, bw * 3.2, 6);
    }
    if (this.patches) { ctx.fillStyle = shade(this.coat, 1.35); ctx.fillRect(-bw * 0.5, hipY - 30, 10, 9); ctx.fillRect(bw * 0.3, hipY + 22, 9, 11); }
    if (this.cape) {
      ctx.fillStyle = shade(this.coat, 0.9);
      ctx.beginPath(); ctx.moveTo(-bw - 5, shoulderY - 1); ctx.quadraticCurveTo(-bw * 1.5, shoulderY + 40, -bw * 1.3, shoulderY + 62); ctx.lineTo(bw * 1.3, shoulderY + 62); ctx.quadraticCurveTo(bw * 1.5, shoulderY + 40, bw + 5, shoulderY - 1); ctx.fill();
    }
    if (this.apron) {
      ctx.fillStyle = this.apron;
      ctx.beginPath(); ctx.moveTo(-bw * 0.55, shoulderY + 12); ctx.lineTo(bw * 0.55, shoulderY + 12); ctx.lineTo(bw * 0.8, hemY - 4); ctx.lineTo(-bw * 0.8, hemY - 4); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * bw * 0.45, shoulderY + 12); ctx.lineTo(side * bw * 0.25, shoulderY - 2); ctx.stroke(); }
      ctx.fillStyle = 'rgba(60,10,8,0.45)'; ctx.beginPath(); ctx.ellipse(bw * 0.2, hipY + 18, 7, 11, 0.3, 0, TAU); ctx.fill();
    }
    if (this.shawl) {
      ctx.fillStyle = this.shawl;
      ctx.beginPath(); ctx.moveTo(-bw * 1.08, shoulderY - 4); ctx.lineTo(bw * 1.08, shoulderY - 4); ctx.lineTo(bw * 0.9, shoulderY + 40); ctx.lineTo(0, shoulderY + 58); ctx.lineTo(-bw * 0.9, shoulderY + 40); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = shade(this.shawl, 0.6); ctx.lineWidth = 1.5;
      for (let i = 0; i < 7; i++) { const x = -bw * 0.8 + i * bw * 0.27; const y = shoulderY + 40 + (1 - Math.abs(x) / bw) * 16; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 7); ctx.stroke(); }
    }
    if (this.scarf) {
      ctx.fillStyle = this.scarf;
      ctx.fillRect(-bw * 0.62, shoulderY - 3, bw * 1.24, 12);
      ctx.fillRect(dir * bw * 0.15 - 5, shoulderY + 6, 10, 30);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(dir * bw * 0.15 - 5, shoulderY + 32, 10, 4);
    }
    if (this.bag) { ctx.fillStyle = shade(P.wood, 0.7); ctx.fillRect(-dir * bw * 1.1 - 9, hipY - 8, 18, 30); }
    ctx.fillStyle = shade(this.coat, this.collarUp ? 0.95 : 0.8);
    if (this.collarUp) { ctx.beginPath(); ctx.moveTo(-bw * 0.6, shoulderY + 4); ctx.lineTo(-bw * 0.56, shoulderY - 10); ctx.lineTo(bw * 0.56, shoulderY - 10); ctx.lineTo(bw * 0.6, shoulderY + 4); ctx.lineTo(0, shoulderY + 10); ctx.closePath(); ctx.fill(); }
    else if (!this.skirt) ctx.fillRect(-bw * 0.55, shoulderY - 3, bw * 1.1, 6);

    this.headFront(ctx, lead * 0.6, shoulderY - 22, lead, t);
    ctx.restore();
  }

  headFront(ctx, hx, hy, lead, t) {
    const longHair = this.skirt || this.hat === 'bonnet' || this.hat === 'shawl';
    const fx = hx + lead;                                 // the features, a little ahead of the skull
    ctx.fillStyle = shade(this.skin, 0.72);
    ctx.fillRect(hx - 6, hy + 9, 12, 13);
    if (longHair) { ctx.fillStyle = this.hair || '#1e1712'; ctx.beginPath(); ctx.ellipse(hx, hy + 2, 15, 17, 0, 0, TAU); ctx.fill(); }
    // ears, then the face: a long oval with a firm jaw
    ctx.fillStyle = shade(this.skin, 0.82);
    ctx.beginPath(); ctx.ellipse(hx - 12.5, hy, 3, 4.6, 0, 0, TAU); ctx.ellipse(hx + 12.5, hy, 3, 4.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = this.skin;
    ctx.beginPath(); ctx.ellipse(hx, hy - 3, 12, 14, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx - 11, hy + 2); ctx.quadraticCurveTo(hx - 9, hy + 13, fx, hy + 15); ctx.quadraticCurveTo(hx + 9, hy + 13, hx + 11, hy + 2); ctx.fill();
    // the side turned from the light
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(hx - Math.sign(lead || 1) * 7, hy + 1, 5.5, 12, 0, 0, TAU); ctx.fill();
    if (this.stubble) { ctx.fillStyle = this.stubble; ctx.beginPath(); ctx.moveTo(hx - 10, hy + 4); ctx.quadraticCurveTo(hx - 8, hy + 13, fx, hy + 15); ctx.quadraticCurveTo(hx + 8, hy + 13, hx + 10, hy + 4); ctx.lineTo(fx + 5, hy + 5); ctx.lineTo(fx - 5, hy + 5); ctx.closePath(); ctx.fill(); }
    // sockets, eyes, brows
    ctx.fillStyle = 'rgba(20,10,8,0.4)';
    ctx.beginPath(); ctx.ellipse(fx - 5, hy - 3.5, 3.4, 2.6, 0, 0, TAU); ctx.ellipse(fx + 5, hy - 3.5, 3.4, 2.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#120c0a';
    for (const ex of [fx - 5, fx + 5]) {
      if (this.blink) ctx.fillRect(ex - 2, hy - 3.5, 4, 1);
      else { ctx.beginPath(); ctx.ellipse(ex + lead * 0.25, hy - 3.5, 1.6, 1.4, 0, 0, TAU); ctx.fill(); }
    }
    ctx.fillStyle = shade(this.hair || '#1e1712', 1.1); ctx.fillRect(fx - 8, hy - 7.5, 6, 1.6); ctx.fillRect(fx + 2, hy - 7.5, 6, 1.6);
    // nose: a shadow down one side and under the tip
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(fx - Math.sign(lead || 1) * 1.5 - 0.5, hy - 2, 1.5, 6); ctx.fillRect(fx - 2, hy + 4, 4, 1.4);
    const open = this.talking ? Math.abs(Math.sin(t * 11)) * 2.2 : 0;
    ctx.fillStyle = '#2a1410'; ctx.fillRect(fx - 3.5, hy + 8, 7, 1.2 + open);
    if (this.moustache) { ctx.fillStyle = this.moustache; ctx.beginPath(); ctx.ellipse(fx, hy + 6, 6, 2, 0, 0, TAU); ctx.fill(); }
    if (this.beard) { ctx.fillStyle = this.beard; ctx.beginPath(); ctx.moveTo(hx - 11, hy + 3); ctx.quadraticCurveTo(hx - 10, hy + 20, fx, hy + 21); ctx.quadraticCurveTo(hx + 10, hy + 20, hx + 11, hy + 3); ctx.lineTo(fx + 5, hy + 10); ctx.lineTo(fx - 5, hy + 10); ctx.closePath(); ctx.fill(); }
    // hair
    ctx.fillStyle = this.hair || '#1e1712';
    if (longHair) { ctx.beginPath(); ctx.ellipse(hx, hy - 11, 13, 7, 0, Math.PI, TAU); ctx.fill(); }
    else { ctx.beginPath(); ctx.ellipse(hx, hy - 10, 12.5, 7, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(hx - 12.5, hy - 10, 3, 8); ctx.fillRect(hx + 9.5, hy - 10, 3, 8); }
    if (this.sideburns) { ctx.fillRect(hx - 12, hy - 6, 3.5, 13); ctx.fillRect(hx + 8.5, hy - 6, 3.5, 13); }
    // hats, front on
    const c = this.hatColor, hi = shade(/^#[0-9a-f]{6}$/i.test(c) ? c : '#121316', 1.9);
    const y = hy - 1;
    ctx.fillStyle = c;
    switch (this.hat) {
      case 'top':
        ctx.fillRect(hx - 20, y - 16, 40, 4);
        ctx.beginPath(); ctx.moveTo(hx - 13, y - 14); ctx.lineTo(hx - 14, y - 52); ctx.lineTo(hx + 14, y - 52); ctx.lineTo(hx + 13, y - 14); ctx.fill();
        ctx.fillStyle = '#2a1d16'; ctx.fillRect(hx - 13, y - 22, 26, 5);
        ctx.fillStyle = hi; ctx.fillRect(hx + lead * 2, y - 50, 3, 26);
        break;
      case 'bowler':
        ctx.fillRect(hx - 19, y - 15, 38, 4);
        ctx.beginPath(); ctx.ellipse(hx, y - 18, 14, 15, 0, Math.PI, 0); ctx.fill();
        ctx.fillRect(hx - 14, y - 19, 28, 6);
        ctx.fillStyle = '#26201a'; ctx.fillRect(hx - 14, y - 19, 28, 3);
        ctx.fillStyle = hi; ctx.beginPath(); ctx.arc(hx + lead * 2, y - 27, 3.5, Math.PI * 1.1, Math.PI * 1.9); ctx.fill();
        break;
      case 'cap':
        ctx.beginPath(); ctx.ellipse(hx, y - 13, 16, 10, 0, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.ellipse(fx, y - 12, 13, 4, 0, 0, Math.PI); ctx.fill();
        ctx.fillStyle = hi; ctx.fillRect(hx - 5, y - 21, 10, 2);
        break;
      case 'helmet':
        ctx.fillRect(hx - 17, y - 14, 34, 4);
        ctx.beginPath(); ctx.moveTo(hx - 14, y - 12); ctx.quadraticCurveTo(hx - 15, y - 52, hx, y - 55); ctx.quadraticCurveTo(hx + 15, y - 52, hx + 14, y - 12); ctx.fill();
        ctx.fillRect(hx - 2, y - 60, 4, 6);
        ctx.fillStyle = '#b9a36a'; ctx.beginPath(); ctx.moveTo(hx, y - 36); ctx.lineTo(hx + 5, y - 29); ctx.lineTo(hx, y - 22); ctx.lineTo(hx - 5, y - 29); ctx.fill();
        break;
      case 'bonnet':
        ctx.beginPath(); ctx.ellipse(hx, y - 4, 19, 21, 0, Math.PI * 0.9, Math.PI * 2.1); ctx.lineTo(hx + 13, y - 2); ctx.ellipse(hx, y - 4, 13, 15, 0, Math.PI * 2.05, Math.PI * 0.95, true); ctx.fill();
        ctx.fillStyle = '#5a1e1a'; ctx.fillRect(hx - 12, y + 8, 3, 16); ctx.fillRect(hx + 9, y + 8, 3, 16);
        break;
      case 'shawl':
        ctx.fillStyle = this.shawl || c;
        ctx.beginPath(); ctx.ellipse(hx, y - 4, 18, 21, 0, Math.PI * 0.85, Math.PI * 2.15); ctx.lineTo(hx + 12, y - 2); ctx.ellipse(hx, y - 4, 12.5, 15, 0, Math.PI * 2.1, Math.PI * 0.9, true); ctx.fill();
        break;
      default: break;
    }
    if (this.hat !== 'none' && this.hat !== 'shawl' && this.hat !== 'bonnet') {
      const g = ctx.createLinearGradient(0, hy - 13, 0, hy + 1);
      g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(hx - 12, hy - 13, 24, 14);
    }
  }

  // Two-bone leg solved from hip to ankle; the knee always bends forward.
  legIK(ctx, hx, hy, foot, back) {
    const L1 = 46, L2 = 46;
    let dx = foot.x - hx, dy = foot.y - hy;
    let d = Math.hypot(dx, dy);
    const maxD = L1 + L2 - 0.5;
    if (d > maxD) { dx *= maxD / d; dy *= maxD / d; d = maxD; }
    const base = Math.atan2(dx, dy);
    const a1 = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
    const th = base + a1;
    const kx = hx + Math.sin(th) * L1, ky = hy + Math.cos(th) * L1;
    const ax = hx + dx, ay = hy + dy;
    ctx.fillStyle = back ? shade(this.trousers, 0.65) : this.trousers;
    limb(ctx, hx, hy, kx, ky, 16, 12.5);
    limb(ctx, kx, ky, ax, ay, 12.5, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    limb(ctx, kx + 2, ky + 2, ax + 2, ay - 6, 2, 2);
    // boot: heel, sole and toe cap, pitched with the stride
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(foot.pitch || 0);
    ctx.fillStyle = back ? shade(this.boots, 0.6) : this.boots;
    ctx.beginPath(); ctx.moveTo(-6, -7); ctx.lineTo(6, -7); ctx.quadraticCurveTo(19, -4, 20, 4); ctx.lineTo(-7, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#050505'; ctx.fillRect(-7, 4, 27, 2.5); ctx.fillRect(-7, 2, 7, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(9, -5, 7, 2);
    ctx.restore();
  }

  arm(ctx, side, shoulderY, lean, bw, ang, color, t, front = false) {
    ctx.save();
    ctx.translate(side * bw * 0.55 + lean, shoulderY + 8);
    let a = ang;
    if (this.pose === 'cower') a = front ? -2.4 : -2.1;
    if (this.pose === 'sit') a = -0.7;
    if (this.pose === 'take' && !front) a = -0.2;
    ctx.rotate(a);
    ctx.fillStyle = color;
    segment(ctx, 40, 14, 12);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-7, 30, 14, 3);
    ctx.translate(0, 40);
    const holdLantern = front && this.lantern && this.lanternOn && this.pose !== 'reach';
    let elbow = Math.min(0, a) * -0.35 - 0.18;
    if (holdLantern) elbow = this.pose === 'inspect' ? -0.15 : -0.55;
    if (this.pose === 'sit') elbow = -0.9;
    if (this.pose === 'take' && front) elbow = 0.25;
    if (front && this.notebook && !this.moving && !this.talking) elbow = -1.5 + Math.sin(t * 2 + this.seed) * 0.05;
    ctx.fillStyle = color;
    ctx.rotate(elbow);
    if (this.rolled && front) ctx.fillStyle = shade(this.coat, 1.1);
    segment(ctx, 34, 12, 10);
    ctx.fillStyle = this.rolled ? this.skin : shade(color, 0.7); ctx.fillRect(-6, 28, 12, 5);
    ctx.fillStyle = this.gloves || this.skin;
    ctx.beginPath(); ctx.ellipse(1, 39, 5.5, 6.5, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, 35, 2.2, 3.5, -0.5, 0, TAU); ctx.fill();
    if (holdLantern) {
      // the lantern hangs from its bail and swings a little behind the hand
      const swing = 0.22 * Math.sin(this.phase - 0.9) * (this.walkAmt || 0) + Math.sin(t * 1.3 + this.seed) * 0.03;
      ctx.save(); ctx.translate(0, 42); ctx.rotate(-(a + elbow) + swing);
      ctx.strokeStyle = '#3a3026'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 2, 6, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = '#1e1a16'; ctx.fillRect(-10, 4, 20, 24); ctx.fillRect(-6, 0, 12, 5); ctx.fillRect(-2, -3, 4, 4);
      ctx.fillStyle = '#7a6440'; ctx.fillRect(-10, 8, 20, 2); ctx.fillRect(-10, 22, 20, 2);
      ctx.fillStyle = '#2a2420'; ctx.fillRect(-12, 26, 24, 4);
      ctx.fillStyle = '#ffd795'; ctx.beginPath(); ctx.arc(10, 16, 7, -Math.PI / 2, Math.PI / 2); ctx.fill();
      ctx.fillStyle = '#fff4d8'; ctx.beginPath(); ctx.arc(11, 15, 2.5, 0, TAU); ctx.fill();
      ctx.restore();
    }
    if (front && this.cane) { ctx.save(); ctx.rotate(-(a + elbow) + 0.1); ctx.fillStyle = '#100c09'; ctx.fillRect(-2, 38, 4, 78); ctx.fillStyle = '#b9a36a'; ctx.fillRect(-3, 34, 6, 6); ctx.restore(); }
    if (front && this.notebook && !this.moving && !this.talking) { ctx.fillStyle = '#d8cfbd'; ctx.fillRect(-2, 36, 14, 10); ctx.fillStyle = '#2a2016'; ctx.fillRect(-2, 36, 14, 2); }
    ctx.restore();
  }

  head(ctx, hx, hy, t) {
    const turn = this.look;
    const longHair = this.skirt || this.hat === 'bonnet' || this.hat === 'shawl';
    // neck, a little forward of the spine
    ctx.fillStyle = shade(this.skin, 0.72);
    ctx.fillRect(hx - 5, hy + 9, 11, 13);
    // skull and jaw
    ctx.fillStyle = this.skin;
    ctx.beginPath(); ctx.ellipse(hx - 1, hy - 3, 12.5, 14.5, 0, 0, TAU); ctx.fill();
    // profile: brow ridge, nose, lips, a firm chin. Glancing back pulls the features toward the viewer.
    const fx = hx + 11 - turn * 6;
    ctx.beginPath();
    ctx.moveTo(hx + 3, hy - 15);
    ctx.quadraticCurveTo(fx + 2, hy - 13, fx + 1, hy - 6);     // forehead to brow
    ctx.lineTo(fx - 0.5, hy - 3);                              // the dip at the bridge
    ctx.lineTo(fx + 5 - turn * 3, hy + 3);                     // nose
    ctx.lineTo(fx + 1, hy + 4.5);
    ctx.lineTo(fx + 1.8, hy + 7.5);                            // lips
    ctx.lineTo(fx + 0.5, hy + 9);
    ctx.quadraticCurveTo(fx + 2, hy + 13, fx - 2, hy + 14.5);  // chin
    ctx.lineTo(hx - 3, hy + 13);                               // jawline
    ctx.lineTo(hx - 7, hy + 6);
    ctx.closePath();
    ctx.fill();
    // modelling: shadow under the cheekbone and along the jaw, a deep eye socket
    ctx.fillStyle = 'rgba(0,0,0,0.24)';
    ctx.beginPath(); ctx.ellipse(hx - 5, hy + 2, 7.5, 11, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.moveTo(fx - 6, hy + 3); ctx.quadraticCurveTo(fx - 2, hy + 6, fx - 1, hy + 12); ctx.lineTo(hx - 2, hy + 12); ctx.closePath(); ctx.fill();
    if (this.stubble) { ctx.fillStyle = this.stubble; ctx.beginPath(); ctx.moveTo(hx - 3, hy + 5); ctx.lineTo(fx - 1, hy + 9); ctx.quadraticCurveTo(fx + 1.5, hy + 13, fx - 2, hy + 14.5); ctx.lineTo(hx - 3, hy + 13); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(20,10,8,0.45)';
    ctx.beginPath(); ctx.ellipse(fx - 3.5, hy - 3.5, 3.6, 2.8, 0, 0, TAU); ctx.fill();
    // ear
    ctx.fillStyle = shade(this.skin, 0.82);
    ctx.beginPath(); ctx.ellipse(hx - 4 + turn * 3, hy, 3, 4.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(hx - 4 + turn * 3, hy - 1, 1.5, 3);
    // eye: a glint when the light catches it
    ctx.fillStyle = '#120c0a';
    if (this.blink) ctx.fillRect(fx - 5, hy - 3.5, 4, 1);
    else {
      ctx.beginPath(); ctx.ellipse(fx - 3, hy - 3.5, 1.8, 1.4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(230,220,200,0.6)'; ctx.fillRect(fx - 2.5, hy - 4.5, 1.2, 1.2);
    }
    if (turn > 0.5) { ctx.fillStyle = '#120c0a'; ctx.beginPath(); ctx.ellipse(fx - 9, hy - 3.5, 1.6, 1.3, 0, 0, TAU); ctx.fill(); }
    // brow
    ctx.fillStyle = shade(this.hair || '#1e1712', 1.1); ctx.fillRect(fx - 6, hy - 7, 6, 1.6);
    const open = this.talking ? Math.abs(Math.sin(t * 11)) * 2.2 : 0;
    ctx.fillStyle = '#2a1410'; ctx.fillRect(fx - 3.5, hy + 7.5, 4.5, 1.2 + open);
    // hair: cropped short above the collar, or longer and pinned up for the women
    ctx.fillStyle = this.hair || '#1e1712';
    if (longHair) { ctx.beginPath(); ctx.ellipse(hx - 8, hy - 6, 9, 11, -0.3, 0, TAU); ctx.fill(); }
    else {
      ctx.beginPath(); ctx.ellipse(hx - 7, hy - 8, 8, 7.5, -0.2, 0, TAU); ctx.fill();
      ctx.fillRect(hx - 12, hy - 6, 6, 9);                      // the back of the head, trimmed at the nape
    }
    if (this.sideburns) { ctx.beginPath(); ctx.moveTo(hx - 1, hy - 6); ctx.lineTo(hx + 3, hy - 6); ctx.lineTo(hx + 4, hy + 7); ctx.lineTo(hx, hy + 8); ctx.closePath(); ctx.fill(); }
    if (this.moustache) { ctx.fillStyle = this.moustache; ctx.beginPath(); ctx.ellipse(fx - 1, hy + 5.5, 4.5, 2, 0.15, 0, TAU); ctx.fill(); }
    if (this.beard) { ctx.fillStyle = this.beard; ctx.beginPath(); ctx.moveTo(hx - 4, hy + 4); ctx.quadraticCurveTo(fx + 3, hy + 6, fx, hy + 16); ctx.quadraticCurveTo(hx, hy + 22, hx - 6, hy + 10); ctx.fill(); }
    this.hatDraw(ctx, hx, hy - 1);
    if (this.hat !== 'none' && this.hat !== 'shawl' && this.hat !== 'bonnet') {
      const g = ctx.createLinearGradient(0, hy - 15, 0, hy + 1);
      g.addColorStop(0, 'rgba(0,0,0,0.62)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(hx + 2, hy - 6, 15, 10, 0, Math.PI, TAU); ctx.lineTo(fx + 6, hy + 1); ctx.lineTo(hx - 14, hy + 1); ctx.fill();
    }
  }

  hatDraw(ctx, hx, hy) {
    const c = this.hatColor;
    const hi = shade(/^#[0-9a-f]{6}$/i.test(c) ? c : '#121316', 1.9);
    ctx.fillStyle = c;
    switch (this.hat) {
      case 'top':
        ctx.beginPath(); ctx.ellipse(hx + 1, hy - 14, 21, 4, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(hx - 12, hy - 14); ctx.lineTo(hx - 13, hy - 52); ctx.lineTo(hx + 15, hy - 52); ctx.lineTo(hx + 14, hy - 14); ctx.fill();
        ctx.fillStyle = '#2a1d16'; ctx.fillRect(hx - 12, hy - 22, 26, 5);
        ctx.fillStyle = hi; ctx.fillRect(hx + 9, hy - 50, 3, 26);
        break;
      case 'bowler':
        ctx.beginPath(); ctx.ellipse(hx + 2, hy - 13, 20, 4, 0.05, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(hx + 1, hy - 18, 14, 15, 0, Math.PI, 0); ctx.fill();
        ctx.fillRect(hx - 13, hy - 19, 28, 6);
        ctx.fillStyle = '#26201a'; ctx.fillRect(hx - 13, hy - 19, 28, 3);
        ctx.fillStyle = hi; ctx.beginPath(); ctx.moveTo(hx + 6, hy - 27); ctx.arc(hx + 6, hy - 27, 4, -1.2, 0.2); ctx.closePath(); ctx.fill();
        break;
      case 'cap':
        ctx.beginPath(); ctx.ellipse(hx - 1, hy - 13, 17, 10, -0.08, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.moveTo(hx + 8, hy - 15); ctx.lineTo(hx + 25, hy - 10); ctx.lineTo(hx + 8, hy - 9); ctx.fill();
        ctx.fillStyle = hi; ctx.fillRect(hx - 6, hy - 21, 10, 2);
        break;
      case 'helmet': // Metropolitan Police custodian helmet
        ctx.beginPath(); ctx.ellipse(hx, hy - 12, 18, 4, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(hx - 14, hy - 12); ctx.quadraticCurveTo(hx - 15, hy - 52, hx, hy - 55); ctx.quadraticCurveTo(hx + 15, hy - 52, hx + 14, hy - 12); ctx.fill();
        ctx.fillRect(hx - 2, hy - 60, 4, 6);
        ctx.fillStyle = '#b9a36a'; ctx.beginPath(); ctx.moveTo(hx + 9, hy - 34); ctx.lineTo(hx + 13, hy - 28); ctx.lineTo(hx + 9, hy - 22); ctx.lineTo(hx + 5, hy - 28); ctx.fill();
        ctx.fillStyle = hi; ctx.fillRect(hx + 7, hy - 50, 3, 18);
        break;
      case 'bonnet':
        ctx.beginPath(); ctx.ellipse(hx - 3, hy - 6, 19, 21, -0.2, Math.PI * 0.75, Math.PI * 2.1); ctx.fill();
        ctx.fillStyle = '#5a1e1a'; ctx.fillRect(hx - 6, hy + 8, 3, 18);
        ctx.fillStyle = hi; ctx.beginPath(); ctx.arc(hx + 4, hy - 20, 3, 0, TAU); ctx.fill();
        break;
      case 'shawl':
        ctx.fillStyle = this.shawl || c;
        ctx.beginPath(); ctx.ellipse(hx - 2, hy - 2, 18, 22, -0.1, Math.PI * 0.55, Math.PI * 2.15); ctx.fill();
        ctx.beginPath(); ctx.moveTo(hx - 18, hy); ctx.lineTo(hx - 28, hy + 46); ctx.lineTo(hx + 4, hy + 30); ctx.fill();
        break;
      default: break;
    }
  }
}
