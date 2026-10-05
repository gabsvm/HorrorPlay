// Procedural silhouette characters. Distinct silhouettes identify people at a glance in the dark:
// hats, coats, shawls, aprons and posture do the work that faces cannot.
import { P, shade } from '../art/palette.js';

const DEF = {
  h: 200, hat: 'bowler', coat: P.coat, coatLen: 0.78, flare: 1.15, build: 1, skin: P.skin,
  trousers: '#1c1d1f', skirt: false, apron: null, scarf: null, cane: false, lantern: false,
  stoop: 0, speed: 120, hair: null, cape: false, bag: false,
};

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
    this.pose = null; // 'kneel', 'reach', 'cower', 'sit'
    this._target = null;
    this._resolve = null;
  }

  walkTo(x, { speed } = {}) {
    if (this._resolve) this._resolve(false);
    this._target = x;
    this._speed = speed || this.speed;
    this.facing = x >= this.x ? 1 : -1;
    if (window.FAST) { this.x = x; this._target = null; return Promise.resolve(true); }
    return new Promise((res) => { this._resolve = res; if (Math.abs(x - this.x) < 2) this._arrive(true); });
  }

  stop() { if (this._resolve) this._arrive(false); }

  _arrive(ok) {
    this._target = null; this.moving = false;
    const r = this._resolve; this._resolve = null;
    if (r) r(ok);
  }

  update(dt) {
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
      // settle the stride smoothly
      const target = Math.round(this.phase / Math.PI) * Math.PI;
      this.phase += (target - this.phase) * Math.min(1, dt * 8);
    }
  }

  light() {
    if (!this.lantern || !this.lanternOn) return null;
    const s = this.h / 200;
    return {
      x: this.x + this.facing * 22 * s, y: this.y - 92 * s, r: 430, color: P.lantern, intensity: 0.85, flicker: 0.04,
      cone: { dir: this.facing, spread: 0.3 }, halo: 26, haloK: 0.7, reflect: false,
    };
  }

  draw(ctx, t) {
    const s = this.h / 200;
    const f = this.facing;
    const sw = Math.sin(this.phase);
    const walkAmt = this.moving ? 1 : Math.min(1, Math.abs(sw) * 1.5);
    const bob = this.moving ? Math.abs(Math.cos(this.phase)) * 3 * s : Math.sin(t * 1.6 + this.x) * 0.8 * s;
    const breathe = Math.sin(t * 1.8 + this.x * 0.01) * 0.6 * s;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    // contact shadow
    const g = ctx.createRadialGradient(this.x, this.y, 2, this.x, this.y, 44 * s * this.build);
    g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.save(); ctx.translate(this.x, this.y); ctx.scale(1, 0.18); ctx.translate(-this.x, -this.y);
    ctx.fillRect(this.x - 50 * s, this.y - 50 * s, 100 * s, 100 * s); ctx.restore();

    ctx.translate(this.x, this.y);
    ctx.scale(f * s, s);
    const kneel = this.pose === 'kneel';
    const cower = this.pose === 'cower';
    const sit = this.pose === 'sit';
    ctx.translate(0, -bob + (kneel ? 38 : 0) + (cower ? 18 : 0) + (sit ? 44 : 0));
    const skirtBottom = sit ? -48 : -2;

    const bw = 26 * this.build;      // half-width of shoulders
    const hipY = -92, shoulderY = -158 + this.stoop * 6, neckY = shoulderY - 4;
    const coatBottom = hipY + (this.coatLen - 0.5) * 140;
    const legSwing = sw * 0.42 * walkAmt;

    // back arm
    this.arm(ctx, -1, shoulderY, -legSwing * 0.9, bw, true);
    // legs
    if (sit) {
      if (!this.skirt) { this.leg(ctx, -4, hipY, -1.5, true, 1.5); this.leg(ctx, 4, hipY, -1.45, false, 1.45); }
      else { this.leg(ctx, 10, hipY + 30, -0.2, true, 0.2); this.leg(ctx, 18, hipY + 30, -0.1, false, 0.1); }
      // chair seat and back
      ctx.fillStyle = '#1a120c'; ctx.fillRect(-30, hipY + 8, 62, 8); ctx.fillRect(-32, hipY - 70, 7, 160); ctx.fillRect(24, hipY + 14, 6, 80);
    } else if (kneel) {
      this.leg(ctx, 6, hipY, 1.2, true, 1.3);
      this.leg(ctx, -6, hipY, -0.1, false, -1.2);
    } else {
      this.leg(ctx, -4, hipY, -legSwing, true);
      this.leg(ctx, 4, hipY, legSwing, false);
    }

    // torso / coat
    ctx.fillStyle = this.coat;
    ctx.beginPath();
    const lean = this.stoop * 10 + (this.moving ? 4 : 0);
    if (this.skirt) {
      ctx.moveTo(-bw * 0.8 + lean, shoulderY + 2);
      ctx.quadraticCurveTo(-bw * 0.6 + lean, hipY - 20, -bw * 0.7, hipY);
      ctx.lineTo(-bw * 1.6 - sw * 4 * walkAmt, skirtBottom);
      ctx.lineTo(bw * (sit ? 2.2 : 1.5) + sw * 4 * walkAmt, skirtBottom);
      ctx.lineTo(bw * 0.75, hipY);
      ctx.quadraticCurveTo(bw * 0.7 + lean, hipY - 20, bw * 0.85 + lean, shoulderY + 2);
    } else {
      const flareL = -bw * this.flare - (this.moving ? sw * 6 : 0) - (this.moving ? 6 : 0);
      const flareR = bw * this.flare * 0.95 + (this.moving ? -sw * 4 : 0);
      ctx.moveTo(-bw + lean, shoulderY + 4);
      ctx.lineTo(-bw * 0.86, hipY);
      ctx.lineTo(flareL, coatBottom);
      ctx.lineTo(flareR, coatBottom + 2);
      ctx.lineTo(bw * 0.86, hipY);
      ctx.lineTo(bw * 0.95 + lean, shoulderY + 4);
    }
    ctx.quadraticCurveTo(lean, shoulderY - 8, -bw + lean, shoulderY + 4);
    ctx.fill();
    // coat fold shading
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.moveTo(bw * 0.2 + lean, shoulderY + 6); ctx.lineTo(bw * 0.95 + lean, shoulderY + 4); ctx.lineTo(bw * (this.skirt ? 1.5 : 0.95), this.skirt ? skirtBottom : coatBottom); ctx.lineTo(bw * 0.25, this.skirt ? skirtBottom : coatBottom); ctx.fill();
    // lapel / shirt front line
    if (!this.skirt) {
      ctx.fillStyle = 'rgba(210,200,180,0.55)';
      ctx.beginPath(); ctx.moveTo(bw * 0.55 + lean, shoulderY + 4); ctx.lineTo(bw * 0.78 + lean, shoulderY + 4); ctx.lineTo(bw * 0.62 + lean * 0.6, shoulderY + 36); ctx.fill();
    }
    if (this.cape) {
      ctx.fillStyle = shade(this.coat, 0.85);
      ctx.beginPath(); ctx.moveTo(-bw - 4 + lean, shoulderY); ctx.lineTo(-bw * 1.35, shoulderY + 58); ctx.lineTo(bw * 1.3, shoulderY + 58); ctx.lineTo(bw + 4 + lean, shoulderY); ctx.fill();
    }
    if (this.apron) {
      ctx.fillStyle = this.apron;
      ctx.beginPath(); ctx.moveTo(bw * 0.1 + lean, shoulderY + 14); ctx.lineTo(bw * 0.95 + lean, shoulderY + 14); ctx.lineTo(bw * 1.1, coatBottom - 6); ctx.lineTo(bw * 0.05, coatBottom - 6); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(bw * 0.2, hipY + 10, bw * 0.8, 4);
    }
    if (this.scarf) {
      ctx.fillStyle = this.scarf;
      ctx.beginPath(); ctx.moveTo(-bw * 0.6 + lean, shoulderY - 2); ctx.lineTo(bw * 0.8 + lean, shoulderY - 2); ctx.lineTo(bw * 0.7 + lean, shoulderY + 12); ctx.lineTo(-bw * 0.5 + lean, shoulderY + 12); ctx.fill();
      ctx.fillRect(-bw * 0.9 + lean, shoulderY + 4, 9, 44 + sw * 3);
    }
    if (this.bag) {
      ctx.fillStyle = shade(P.wood, 0.7);
      ctx.fillRect(-bw * 1.1, hipY - 8, 18, 30);
    }

    // head
    const hx = lean + 6 + this.stoop * 8, hy = neckY - 22 + breathe + (this.talking ? Math.sin(t * 18) * 0.8 : 0);
    ctx.fillStyle = shade(this.skin, 0.85);
    ctx.fillRect(hx - 6, neckY - 8, 11, 12); // neck
    ctx.fillStyle = this.skin;
    ctx.beginPath(); ctx.ellipse(hx, hy, 14, 17, 0.08, 0, Math.PI * 2); ctx.fill();
    // nose + jaw profile on facing side
    ctx.beginPath(); ctx.moveTo(hx + 12, hy - 4); ctx.lineTo(hx + 18, hy + 4); ctx.lineTo(hx + 12, hy + 6); ctx.fill();
    // hollow eye socket & shadow under brim
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.ellipse(hx + 6, hy - 2, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(hx - 4, hy + 2, 10, 15, 0, 0, Math.PI * 2); ctx.fill();
    if (this.hair) { ctx.fillStyle = this.hair; ctx.beginPath(); ctx.ellipse(hx - 6, hy - 6, 12, 14, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(hx - 18, hy - 4, 10, 26); }
    if (this.beard) { ctx.fillStyle = this.beard; ctx.beginPath(); ctx.ellipse(hx + 6, hy + 11, 10, 8, 0, 0, Math.PI * 2); ctx.fill(); }
    this.hatDraw(ctx, hx, hy);

    // front arm (holds lantern / cane)
    this.arm(ctx, 1, shoulderY, legSwing * 0.9, bw, false, lean);

    ctx.restore();
  }

  leg(ctx, ox, hipY, ang, back, knee = 0) {
    ctx.save();
    ctx.translate(ox, hipY);
    ctx.rotate(ang);
    ctx.fillStyle = back ? shade(this.trousers, 0.7) : this.trousers;
    const len = 88;
    ctx.fillRect(-7, 0, 14, len * 0.52);
    ctx.translate(0, len * 0.5);
    ctx.rotate(knee || Math.max(0, -ang) * 0.9);
    ctx.fillRect(-6, 0, 12, len * 0.5);
    // boot
    ctx.fillStyle = back ? '#0b0b0b' : '#141312';
    ctx.beginPath(); ctx.moveTo(-7, len * 0.46); ctx.lineTo(16, len * 0.48); ctx.lineTo(16, len * 0.52 + 4); ctx.lineTo(-7, len * 0.52 + 4); ctx.fill();
    ctx.restore();
  }

  arm(ctx, side, shoulderY, ang, bw, back, lean = 0) {
    ctx.save();
    ctx.translate(side * bw * 0.55 + lean, shoulderY + 8);
    let a = ang;
    if (this.pose === 'reach' && !back) a = -1.2;
    if (this.pose === 'cower') a = back ? -2.2 : -2.5;
    if (this.lantern && this.lanternOn && !back && this.pose !== 'reach') a = -0.22 + sw * 0.08;
    ctx.rotate(a);
    ctx.fillStyle = back ? shade(this.coat, 0.6) : shade(this.coat, 1.1);
    ctx.fillRect(-7, 0, 14, 44);
    ctx.translate(0, 42);
    ctx.rotate(this.lantern && this.lanternOn && !back ? -0.55 : Math.min(0, a) * -0.4 - 0.12);
    ctx.fillRect(-6, 0, 12, 38);
    ctx.fillStyle = this.skin;
    ctx.beginPath(); ctx.ellipse(0, 42, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
    if (!back && this.lantern && this.lanternOn) {
      ctx.save(); ctx.translate(0, 46); ctx.rotate(0.77);
      ctx.fillStyle = '#2a2420'; ctx.fillRect(-10, 0, 20, 26); ctx.fillRect(-6, -5, 12, 6);
      ctx.fillStyle = '#ffcf85'; ctx.beginPath(); ctx.arc(10, 13, 6, -Math.PI / 2, Math.PI / 2); ctx.fill();
      ctx.restore();
    }
    if (!back && this.cane) { ctx.fillStyle = '#100c09'; ctx.save(); ctx.rotate(-a + 0.12); ctx.fillRect(-2, 40, 4, 74); ctx.restore(); }
    ctx.restore();
  }

  hatDraw(ctx, hx, hy) {
    ctx.fillStyle = this.hatColor || '#111214';
    switch (this.hat) {
      case 'top':
        ctx.fillRect(hx - 19, hy - 15, 40, 5);
        ctx.fillRect(hx - 12, hy - 50, 27, 37);
        ctx.fillStyle = 'rgba(80,60,50,0.5)'; ctx.fillRect(hx - 12, hy - 22, 27, 4);
        break;
      case 'bowler':
        ctx.beginPath(); ctx.ellipse(hx + 1, hy - 14, 21, 4.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(hx + 1, hy - 18, 14, 14, 0, Math.PI, 0); ctx.fill();
        ctx.fillRect(hx - 13, hy - 19, 28, 6);
        break;
      case 'cap':
        ctx.beginPath(); ctx.ellipse(hx - 1, hy - 14, 16, 9, -0.1, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.moveTo(hx + 8, hy - 15); ctx.lineTo(hx + 26, hy - 10); ctx.lineTo(hx + 8, hy - 9); ctx.fill();
        break;
      case 'helmet': // Metropolitan Police custodian helmet
        ctx.beginPath(); ctx.ellipse(hx, hy - 13, 18, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(hx - 14, hy - 13); ctx.quadraticCurveTo(hx - 14, hy - 52, hx, hy - 54); ctx.quadraticCurveTo(hx + 14, hy - 52, hx + 14, hy - 13); ctx.fill();
        ctx.fillStyle = '#8a7a50'; ctx.beginPath(); ctx.arc(hx + 9, hy - 28, 3, 0, Math.PI * 2); ctx.fill();
        break;
      case 'bonnet':
        ctx.beginPath(); ctx.ellipse(hx - 3, hy - 6, 19, 21, -0.2, Math.PI * 0.75, Math.PI * 2.1); ctx.fill();
        ctx.fillRect(hx - 6, hy + 8, 3, 18);
        break;
      case 'shawl':
        ctx.beginPath(); ctx.ellipse(hx - 2, hy - 2, 18, 22, -0.1, Math.PI * 0.55, Math.PI * 2.15); ctx.fill();
        ctx.beginPath(); ctx.moveTo(hx - 18, hy); ctx.lineTo(hx - 28, hy + 46); ctx.lineTo(hx + 4, hy + 30); ctx.fill();
        break;
      default: break;
    }
  }
}
