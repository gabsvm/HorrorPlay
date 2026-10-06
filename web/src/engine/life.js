// Ambient life: small things that move so the streets feel inhabited and watched.
// Each element may implement update(dt, G), draw(ctx, t) (albedo, pixel-snapped with the props),
// drawGlow(ctx, t) (additive light) and drawFog(ctx, t) (lit like fog). All coordinates are world space.
import { rng } from '../art/noise.js';

const TAU = Math.PI * 2;

export class Smoke {
  constructor({ x, y, rate = 1, drift = 18, size = 1 }) { Object.assign(this, { x, y, rate, drift, size }); }
  drawFog(ctx, t) {
    for (let i = 0; i < 6; i++) {
      const k = ((t * 0.07 * this.rate + i / 6) % 1);
      const px = this.x + k * this.drift * 6 + Math.sin(t * 0.5 + i) * 6, py = this.y - k * 160;
      const r = (10 + k * 46) * this.size;
      const g = ctx.createRadialGradient(px, py, 1, px, py, r);
      g.addColorStop(0, `rgba(255,255,255,${0.32 * (1 - k)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(px - r, py - r, r * 2, r * 2);
    }
  }
}

// A drop forms under an eave or gutter, falls and splashes.
export class Drip {
  constructor({ x, y, ground, period = 2.2 }) { Object.assign(this, { x, y, ground, period }); this.off = Math.random() * period; }
  draw(ctx, t) {
    const k = ((t + this.off) % this.period) / this.period;
    if (k < 0.55) { const s = 1.5 + k * 3; ctx.fillStyle = '#9fb3b4'; ctx.fillRect(this.x - s / 2, this.y, s, s * 1.4); return; }
    const f = (k - 0.55) / 0.25;
    if (f < 1) { ctx.fillStyle = '#9fb3b4'; ctx.fillRect(this.x - 1.5, this.y + f * f * (this.ground - this.y), 3, 6); return; }
    const sp = (k - 0.8) / 0.2;
    ctx.fillStyle = `rgba(170,190,190,${1 - sp})`;
    ctx.fillRect(this.x - 6 - sp * 8, this.ground - sp * 6, 3, 3); ctx.fillRect(this.x + 4 + sp * 8, this.ground - sp * 6, 3, 3);
  }
}

// Rats keep to the gutter and bolt when someone comes close.
export class Rat {
  constructor({ x0, x1, y, seed = 1 }) { Object.assign(this, { x0, x1, y }); this.r = rng(seed); this.x = x0; this.dir = 1; this.state = 'hide'; this.timer = 2 + this.r() * 6; this.speed = 0; }
  update(dt, G) {
    this.timer -= dt;
    const p = G.player;
    if (this.state === 'hide' && this.timer <= 0) {
      this.state = 'run'; this.dir = this.r() < 0.5 ? 1 : -1; this.x = this.dir > 0 ? this.x0 : this.x1; this.speed = 140 + this.r() * 90; this.pause = 0.6 + this.r();
    }
    if (this.state === 'run') {
      if (this.pause > 0 && Math.abs(this.x - (this.x0 + this.x1) / 2) < 30) { this.pause -= dt; return; }
      if (p && Math.abs(p.x - this.x) < 160) this.speed = 320;
      this.x += this.dir * this.speed * dt;
      if (this.x < this.x0 - 40 || this.x > this.x1 + 40) { this.state = 'hide'; this.timer = 5 + this.r() * 10; }
    }
  }
  draw(ctx, t) {
    if (this.state !== 'run') return;
    const d = this.dir, x = this.x, y = this.y;
    const hop = Math.abs(Math.sin(t * 30)) * 2;
    ctx.fillStyle = '#1d1814';
    ctx.beginPath(); ctx.ellipse(x, y - 6 - hop, 13, 6, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + d * 10, y - 9 - hop); ctx.lineTo(x + d * 22, y - 5 - hop); ctx.lineTo(x + d * 10, y - 2 - hop); ctx.fill();
    ctx.fillRect(x + d * 8, y - 13 - hop, 3, 4);
    ctx.strokeStyle = '#2a201a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - d * 12, y - 6 - hop); ctx.quadraticCurveTo(x - d * 24, y - 2, x - d * 34, y - 8 + Math.sin(t * 20) * 3); ctx.stroke();
  }
}

// A cat on a wall: its tail swings, its eyes catch the light and blink.
export class Cat {
  constructor({ x, y, facing = -1 }) { Object.assign(this, { x, y, facing }); this.seed = x % 7; }
  draw(ctx, t) {
    const f = this.facing, x = this.x, y = this.y;
    ctx.fillStyle = '#0c0b0b';
    ctx.beginPath(); ctx.ellipse(x, y - 14, 12, 15, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + f * 6, y - 32, 8, 7, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + f * 1, y - 36); ctx.lineTo(x + f * 3, y - 46); ctx.lineTo(x + f * 6, y - 38); ctx.moveTo(x + f * 7, y - 38); ctx.lineTo(x + f * 11, y - 46); ctx.lineTo(x + f * 12, y - 35); ctx.fill();
    ctx.strokeStyle = '#0c0b0b'; ctx.lineWidth = 3;
    const sw = Math.sin(t * 1.3 + this.seed) * 10;
    ctx.beginPath(); ctx.moveTo(x - f * 8, y - 4); ctx.quadraticCurveTo(x - f * 20, y + 6, x - f * 18 + sw * 0.3, y + 22 + sw * 0.2); ctx.stroke();
  }
  drawGlow(ctx, t) {
    const blink = (t + this.seed) % 5 < 0.15;
    if (blink) return;
    const f = this.facing;
    ctx.fillStyle = 'rgba(160,200,90,0.9)';
    ctx.fillRect(this.x + f * 5 - 1, this.y - 34, 2.5, 2); ctx.fillRect(this.x + f * 10 - 1, this.y - 34, 2.5, 2);
  }
}

// A crow perched on a ridge or railing. Now and then it shifts or opens its wings.
export class Crow {
  constructor({ x, y, facing = 1, seed = 1 }) { Object.assign(this, { x, y, facing }); this.r = rng(seed); this.flap = 0; this.next = 3 + this.r() * 8; this.t = 0; }
  update(dt) { this.t += dt; if (this.t > this.next) { this.flap = 0.6; this.next = this.t + 4 + this.r() * 10; if (this.r() < 0.4) this.facing *= -1; } this.flap = Math.max(0, this.flap - dt); }
  draw(ctx, t) {
    const f = this.facing, x = this.x, y = this.y;
    ctx.fillStyle = '#0a0a0c';
    ctx.beginPath(); ctx.ellipse(x, y - 10, 11, 7, -0.2 * f, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + f * 9, y - 17, 5, 5, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + f * 13, y - 18); ctx.lineTo(x + f * 21, y - 16); ctx.lineTo(x + f * 13, y - 14); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - f * 9, y - 9); ctx.lineTo(x - f * 22, y - 4); ctx.lineTo(x - f * 10, y - 4); ctx.fill();
    ctx.fillRect(x - 1, y - 4, 2, 5); ctx.fillRect(x + 3, y - 4, 2, 5);
    if (this.flap > 0) {
      const a = Math.sin(this.flap * 30) * 0.8;
      ctx.save(); ctx.translate(x, y - 12); ctx.rotate(-1.2 * f + a * f);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(f * 24, -4); ctx.lineTo(f * 18, 6); ctx.fill();
      ctx.restore();
    }
  }
}

// Someone crosses the room behind a lit window. Nobody ever comes to the door.
export class WindowFigure {
  constructor({ x, y, w, h, period = 11, offset = 0 }) { Object.assign(this, { x, y, w, h, period, offset }); }
  draw(ctx, t) {
    const k = ((t + this.offset) % this.period) / this.period;
    if (k > 0.3) return;
    const p = k / 0.3;
    const cx = this.x - 14 + p * (this.w + 28);
    ctx.save();
    ctx.beginPath(); ctx.rect(this.x, this.y, this.w, this.h); ctx.clip();
    ctx.fillStyle = 'rgba(35,14,6,0.82)';
    ctx.beginPath(); ctx.ellipse(cx, this.y + this.h * 0.38, this.w * 0.13, this.h * 0.14, 0, 0, TAU); ctx.fill();
    ctx.fillRect(cx - this.w * 0.22, this.y + this.h * 0.5, this.w * 0.44, this.h * 0.6);
    ctx.restore();
  }
}

// Moths circling a lamp, drawn as tiny sparks.
export class Moths {
  constructor({ x, y, n = 4 }) { Object.assign(this, { x, y, n }); }
  drawGlow(ctx, t) {
    for (let i = 0; i < this.n; i++) {
      const a = t * (1.6 + i * 0.37) + i * 2.1, rr = 16 + (i % 3) * 9;
      const px = this.x + Math.cos(a) * rr + Math.sin(t * 7 + i) * 3, py = this.y + Math.sin(a * 1.3) * rr * 0.6;
      ctx.fillStyle = 'rgba(255,230,170,0.85)'; ctx.fillRect(px, py, 2, 2);
    }
  }
}

// A sheet of newspaper tumbling along the street in the wind.
export class Paper {
  constructor({ x0, x1, y, seed = 3 }) { Object.assign(this, { x0, x1, y }); this.r = rng(seed); this.x = x0; this.active = false; this.wait = 4 + this.r() * 8; }
  update(dt) {
    if (!this.active) { this.wait -= dt; if (this.wait <= 0) { this.active = true; this.x = this.x0; this.v = 60 + this.r() * 60; } return; }
    this.x += this.v * dt;
    if (this.x > this.x1) { this.active = false; this.wait = 10 + this.r() * 14; }
  }
  draw(ctx, t) {
    if (!this.active) return;
    const lift = Math.abs(Math.sin(t * 2.3)) * 26, rot = Math.sin(t * 3.1) * 0.9;
    ctx.save(); ctx.translate(this.x, this.y - 6 - lift); ctx.rotate(rot);
    ctx.fillStyle = '#a79a7c'; ctx.fillRect(-14, -9, 28, 18);
    ctx.fillStyle = 'rgba(40,30,20,0.55)'; for (let i = 0; i < 4; i++) ctx.fillRect(-11, -6 + i * 4, i === 0 ? 22 : 16, 1.5);
    ctx.restore();
  }
}

// Rain rings spreading in a puddle.
export class Ripples {
  constructor({ x, y, w, n = 5 }) { Object.assign(this, { x, y, w, n }); }
  drawGlow(ctx, t) {
    ctx.lineWidth = 1.5;
    for (let i = 0; i < this.n; i++) {
      const k = (t * 0.9 + i / this.n) % 1;
      const px = this.x + ((i * 97.13) % 1) * this.w - this.w / 2 + Math.sin(i * 12.9) * this.w * 0.3;
      ctx.strokeStyle = `rgba(140,165,170,${0.35 * (1 - k)})`;
      ctx.beginPath(); ctx.ellipse(px, this.y, 3 + k * 14, 1 + k * 3, 0, 0, TAU); ctx.stroke();
    }
  }
}

// A sign whose gas jet gutters and nearly goes out.
export class Flicker {
  constructor({ light, rate = 1 }) { this.light = light; this.rate = rate; this.base = null; }
  update(dt, G) {
    const L = G.light(this.light);
    if (!L) return;
    if (this.base == null) this.base = L.intensity;
    const t = performance.now() / 1000 * this.rate;
    const out = Math.sin(t * 0.7) > 0.93 ? 0.15 : 1;
    L.intensity = this.base * out * (0.85 + Math.random() * 0.15);
  }
}
