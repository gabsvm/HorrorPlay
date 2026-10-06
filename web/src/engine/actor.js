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
  waistcoat: null, chain: false, number: null, bustle: false, lapel: '#d8cfbd', notebook: false,
};

const TAU = Math.PI * 2;

// a limb segment as a tapered capsule, drawn from (0,0) downward along +y after rotation
function segment(ctx, len, w0, w1) {
  ctx.beginPath();
  ctx.moveTo(-w0 / 2, 0);
  ctx.lineTo(-w1 / 2, len);
  ctx.arc(0, len, w1 / 2, Math.PI, 0, true);
  ctx.lineTo(w0 / 2, 0);
  ctx.arc(0, 0, w0 / 2, 0, Math.PI, true);
  ctx.fill();
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
    if (this._target != null) {
      const d = this._target - this.x;
      const step = this._speed * dt;
      if (Math.abs(d) <= step) { this.x = this._target; this._arrive(true); }
      else {
        this.x += Math.sign(d) * step; this.moving = true; this.facing = Math.sign(d);
        const prev = this.phase;
        this.phase += (step / (this.h * 0.42)) * Math.PI;
        if (this.onStep && Math.floor(prev / Math.PI) !== Math.floor(this.phase / Math.PI)) this.onStep(this);
      }
    } else {
      this.moving = false;
      const target = Math.round(this.phase / Math.PI) * Math.PI;
      this.phase += (target - this.phase) * Math.min(1, dt * 8);
    }
    // an idle glance over the shoulder every few seconds (never while talking or walking)
    const want = !this.moving && !this.talking && !this.pose && (this.idleT % 9) > 7.6 ? 1 : 0;
    this.look += (want - this.look) * Math.min(1, dt * 4);
  }

  light() {
    if (!this.lantern || !this.lanternOn) {
      // the protagonist always keeps a faint fill so he never vanishes in the dark
      return this.isPlayer ? { x: this.x, y: this.y - this.h * 0.55, r: this.h * 1.3, color: [0.55, 0.6, 0.7], intensity: 0.24, halo: 0, reflect: false } : null;
    }
    const s = this.h / 200;
    return {
      x: this.x + this.facing * 22 * s, y: this.y - 92 * s, r: 430, color: P.lantern, intensity: 0.85, flicker: 0.04,
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
    const key = `${this.moving}|${this.talking}|${this.pose}|${this.facing}|${this.lanternOn}|${Math.round(this.look * 4)}|${Math.round(this.x)}`;
    const stale = this.moving || this.talking || key !== this._key || t - (this._drawnAt ?? -1) > 0.12 || t < (this._drawnAt ?? 0);
    if (!stale) { this.blit(ctx, rs, ox, oy, W, Hh); return; }
    this._key = key; this._drawnAt = t;
    const b = this._hi, bc = b.getContext('2d', { willReadFrequently: true });
    bc.setTransform(1, 0, 0, 1, 0, 0);
    bc.clearRect(0, 0, W, Hh);
    bc.translate(ox - this.x, oy - this.y);
    this.drawFigure(bc, t);
    bc.setTransform(1, 0, 0, 1, 0, 0);
    bc.globalCompositeOperation = 'source-atop';
    // rim light from the strongest nearby light
    let best = null, bestK = 0;
    for (const L of lights) {
      if (L.off || L.cone) continue;
      const dx = L.x - this.x, dy = L.y - (this.y - this.h * 0.6);
      const d = Math.hypot(dx, dy);
      const k = (L.intensity ?? 1) * Math.max(0, 1 - d / (L.r * 1.1));
      if (k > bestK) { bestK = k; best = { dx, c: L.color }; }
    }
    if (best && bestK > 0.04) {
      const side = Math.sign(best.dx) || 1;
      const g = bc.createLinearGradient(ox + side * W * 0.16, 0, ox - side * W * 0.01, 0);
      const c = best.c;
      g.addColorStop(0, `rgba(${c[0] * 255 | 0},${c[1] * 255 | 0},${c[2] * 255 | 0},${Math.min(0.6, bestK)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      bc.fillStyle = g;
      bc.fillRect(0, 0, W, Hh);
    }
    const g2 = bc.createLinearGradient(0, oy - this.h, 0, oy);
    g2.addColorStop(0, 'rgba(150,170,190,0.10)'); g2.addColorStop(0.6, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,0.4)');
    bc.fillStyle = g2; bc.fillRect(0, 0, W, Hh);
    bc.globalCompositeOperation = 'source-over';
    pixelizeInto(b, this._lo, { dither: 8, alphaCut: 100, edge: 0.62 });
    this.blit(ctx, rs, ox, oy, W, Hh);
  }

  blit(ctx, rs, ox, oy, W, Hh) {
    this.drawShadow(ctx);
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.imageSmoothingEnabled = false;
    const px = Math.round((this.x - ox) * rs) / rs, py = Math.round((this.y - oy) * rs) / rs;
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

  // ------------------------------------------------------------ figure
  drawFigure(ctx, t) {
    const s = this.h / 200;
    const f = this.facing;
    const sw = Math.sin(this.phase);
    const walk = this.moving ? 1 : Math.min(1, Math.abs(sw) * 1.5);
    const bob = this.moving ? Math.abs(Math.cos(this.phase)) * 3 : 0;
    const breathe = Math.sin(t * 1.7 + this.seed) * 0.8;
    const kneel = this.pose === 'kneel', cower = this.pose === 'cower', sit = this.pose === 'sit', reach = this.pose === 'reach';

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(f * s, s);
    ctx.translate(0, -bob + (kneel ? 38 : 0) + (cower ? 22 : 0) + (sit ? 44 : 0));

    const bw = 24 * this.build;                           // half shoulder width
    const lean = this.stoop * 9 + (this.moving ? 4 : 0) + (cower ? 14 : 0);
    const hipY = -94, shoulderY = -156 + this.stoop * 6 + breathe * 0.4 + (cower ? 10 : 0);
    const hemY = this.skirt ? (sit ? -48 : -2) : hipY + (this.coatLen - 0.5) * 140;
    const back = shade(this.coat, 0.62), coatLit = shade(this.coat, 1.18);

    // ---- back arm and back leg
    this.arm(ctx, -1, shoulderY, lean, bw, -sw * 0.5 * walk, back, t);
    if (sit) this.leg(ctx, -3, hipY, -1.5, 1.5, true);
    else if (kneel) this.leg(ctx, -6, hipY, -0.15, 1.65, true);
    else this.leg(ctx, -3, hipY, -sw * 0.48 * walk, Math.max(0, Math.sin(this.phase + Math.PI + 0.9)) * 0.9 * walk + 0.05, true);

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
    if (sit) this.leg(ctx, 4, hipY, -1.45, 1.45, false);
    else if (kneel) this.leg(ctx, 8, hipY, -1.35, 1.35, false);
    else this.leg(ctx, 4, hipY, sw * 0.48 * walk, Math.max(0, Math.sin(this.phase + 0.9)) * 0.9 * walk + 0.05, false);

    // ---- body
    const sway = this.moving ? -sw * 5 : Math.sin(t * 0.9 + this.seed) * 1.2; // hem lags behind the stride
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
      ctx.moveTo(-bw + lean, shoulderY + 4);
      ctx.lineTo(-bw * 0.84, hipY);
      ctx.lineTo(-bw * fl + sway - (this.moving ? 5 : 0), hemY);
      ctx.quadraticCurveTo(sway, hemY + 4, bw * fl * 0.92 + sway * 0.6, hemY + 1);
      ctx.lineTo(bw * 0.84, hipY);
      ctx.lineTo(bw * 0.95 + lean, shoulderY + 4);
    }
    ctx.quadraticCurveTo(lean, shoulderY - 9, -bw + lean, shoulderY + 4);
    ctx.fill();

    // shadow side, folds and the lit front edge
    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    ctx.beginPath();
    ctx.moveTo(-bw + lean, shoulderY + 6); ctx.lineTo(-bw * 0.2 + lean, shoulderY + 6);
    ctx.lineTo(-bw * 0.1 + sway, hemY); ctx.lineTo(-bw * (this.skirt ? 1.6 : this.flare) + sway, hemY); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
    for (const k of [0.25, 0.55]) { ctx.beginPath(); ctx.moveTo(bw * k * 0.6 + lean * 0.5, hipY + 6); ctx.lineTo(bw * k + sway * 0.8, hemY - 4); ctx.stroke(); }
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
      ctx.fillRect(-bw * 0.9 + lean, shoulderY + 4, 8, 40 + sw * 3);
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
    let fa = sw * 0.5 * walk;
    if (reach) fa = -1.25;
    if (this.lantern && this.lanternOn && !reach) fa = -0.2 + Math.sin(this.phase) * 0.06;
    this.arm(ctx, 1, shoulderY, lean, bw, fa, this.rolled ? this.coat : shade(this.coat, 1.06), t, true);

    ctx.restore();
  }

  leg(ctx, ox, hipY, thigh, knee, back) {
    ctx.save();
    ctx.translate(ox, hipY);
    ctx.rotate(thigh);
    ctx.fillStyle = back ? shade(this.trousers, 0.65) : this.trousers;
    segment(ctx, 44, 15, 12);
    ctx.translate(0, 44);
    ctx.rotate(knee);
    segment(ctx, 42, 12, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(2, 2, 2, 36); // crease
    // boot with heel and toe cap
    ctx.translate(0, 42);
    ctx.rotate(-(thigh + knee) * 0.6);
    ctx.fillStyle = back ? shade(this.boots, 0.6) : this.boots;
    ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(6, -6); ctx.quadraticCurveTo(18, -4, 19, 3); ctx.lineTo(-7, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#050505'; ctx.fillRect(-7, 3, 26, 2.5);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(8, -5, 7, 2);
    ctx.restore();
  }

  arm(ctx, side, shoulderY, lean, bw, ang, color, t, front = false) {
    ctx.save();
    ctx.translate(side * bw * 0.55 + lean, shoulderY + 8);
    let a = ang;
    if (this.pose === 'cower') a = front ? -2.4 : -2.1;
    if (this.pose === 'sit') a = -0.7;
    ctx.rotate(a);
    ctx.fillStyle = color;
    segment(ctx, 40, 14, 12);
    ctx.translate(0, 40);
    let elbow = Math.min(0, a) * -0.35 - 0.18;
    const holdLantern = front && this.lantern && this.lanternOn && this.pose !== 'reach';
    if (holdLantern) elbow = -0.6;
    if (this.pose === 'sit') elbow = -0.9;
    if (front && this.notebook && !this.moving && !this.talking) elbow = -1.5 + Math.sin(t * 2 + this.seed) * 0.05;
    ctx.rotate(elbow);
    if (this.rolled && front) ctx.fillStyle = shade(this.coat, 1.1);
    segment(ctx, 34, 12, 10);
    ctx.fillStyle = this.rolled ? this.skin : shade(color, 0.7); ctx.fillRect(-6, 28, 12, 5); // cuff
    ctx.fillStyle = this.skin;
    ctx.beginPath(); ctx.ellipse(1, 39, 5.5, 6.5, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, 35, 2.2, 3.5, -0.5, 0, TAU); ctx.fill(); // thumb
    if (holdLantern) {
      ctx.save(); ctx.translate(0, 44); ctx.rotate(-(a + elbow));
      ctx.fillStyle = '#1e1a16'; ctx.fillRect(-9, 0, 18, 24); ctx.fillRect(-5, -5, 10, 6); ctx.fillRect(-2, -9, 4, 5);
      ctx.fillStyle = '#4a3e30'; ctx.fillRect(-9, 4, 18, 2); ctx.fillRect(-9, 18, 18, 2);
      ctx.fillStyle = '#ffcf85'; ctx.beginPath(); ctx.arc(9, 12, 6, -Math.PI / 2, Math.PI / 2); ctx.fill();
      ctx.restore();
    }
    if (front && this.cane) { ctx.save(); ctx.rotate(-(a + elbow) + 0.1); ctx.fillStyle = '#100c09'; ctx.fillRect(-2, 38, 4, 78); ctx.fillStyle = '#b9a36a'; ctx.fillRect(-3, 34, 6, 6); ctx.restore(); }
    if (front && this.notebook && !this.moving && !this.talking) { ctx.fillStyle = '#d8cfbd'; ctx.fillRect(-2, 36, 14, 10); ctx.fillStyle = '#2a2016'; ctx.fillRect(-2, 36, 14, 2); }
    ctx.restore();
  }

  head(ctx, hx, hy, t) {
    const turn = this.look;
    ctx.fillStyle = shade(this.skin, 0.78);
    ctx.fillRect(hx - 6, hy + 10, 11, 12); // neck
    ctx.fillStyle = this.skin;
    ctx.beginPath(); ctx.ellipse(hx - 1, hy - 3, 13, 15, 0, 0, TAU); ctx.fill();
    // profile: brow, nose, lips, chin. Glancing back pulls the features toward the viewer.
    const fx = hx + 11 - turn * 6;
    ctx.beginPath();
    ctx.moveTo(hx + 4, hy - 14);
    ctx.quadraticCurveTo(fx + 1, hy - 12, fx, hy - 4);
    ctx.lineTo(fx + 5 - turn * 3, hy + 3);
    ctx.lineTo(fx + 1, hy + 5);
    ctx.lineTo(fx + 1.5, hy + 8);
    ctx.quadraticCurveTo(fx, hy + 13, hx + 2, hy + 14);
    ctx.lineTo(hx - 6, hy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(hx - 5, hy + 1, 8, 12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = shade(this.skin, 0.8);
    ctx.beginPath(); ctx.ellipse(hx - 4 + turn * 3, hy, 3, 4.5, 0, 0, TAU); ctx.fill(); // ear
    ctx.fillStyle = '#16100c';
    ctx.beginPath(); ctx.ellipse(fx - 3, hy - 4, 1.8, 1.5, 0, 0, TAU); ctx.fill();
    if (turn > 0.5) { ctx.beginPath(); ctx.ellipse(fx - 9, hy - 4, 1.6, 1.4, 0, 0, TAU); ctx.fill(); }
    const open = this.talking ? Math.abs(Math.sin(t * 11)) * 2.2 : 0;
    ctx.fillStyle = '#2a1410'; ctx.fillRect(fx - 4, hy + 7, 5, 1.2 + open);
    ctx.fillStyle = this.hair || '#1e1712';
    ctx.beginPath(); ctx.ellipse(hx - 8, hy - 6, 9, 11, -0.3, 0, TAU); ctx.fill();
    if (this.sideburns) ctx.fillRect(hx - 1, hy - 4, 4, 12);
    if (this.moustache) { ctx.fillStyle = this.moustache; ctx.beginPath(); ctx.ellipse(fx - 1, hy + 5.5, 4.5, 2, 0.15, 0, TAU); ctx.fill(); }
    if (this.beard) { ctx.fillStyle = this.beard; ctx.beginPath(); ctx.moveTo(hx - 4, hy + 4); ctx.quadraticCurveTo(fx + 3, hy + 6, fx, hy + 16); ctx.quadraticCurveTo(hx, hy + 22, hx - 6, hy + 10); ctx.fill(); }
    this.hatDraw(ctx, hx, hy - 1);
    if (this.hat !== 'none' && this.hat !== 'shawl' && this.hat !== 'bonnet') {
      const g = ctx.createLinearGradient(0, hy - 15, 0, hy + 2);
      g.addColorStop(0, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(hx + 2, hy - 6, 15, 10, 0, Math.PI, TAU); ctx.lineTo(fx + 6, hy + 2); ctx.lineTo(hx - 14, hy + 2); ctx.fill();
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
