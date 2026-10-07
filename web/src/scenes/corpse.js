// A victim lying in the street, drawn from the same figure as the living (rotated onto her back)
// so she matches everyone else in the scene. A cape or sacking over her, blood under her neck.
import { Actor } from '../engine/actor.js';
import { pixelizeInto } from '../art/pixel.js';

const cache = {}, sprites = {};

// a bull's-eye lantern set down on the stones beside her
export function groundLantern(ctx, x, y) {
  ctx.fillStyle = '#1e1a16'; ctx.fillRect(x - 10, y - 26, 20, 24); ctx.fillRect(x - 6, y - 30, 12, 5);
  ctx.strokeStyle = '#3a3026'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 30, 6, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#7a6440'; ctx.fillRect(x - 10, y - 22, 20, 2); ctx.fillRect(x - 10, y - 8, 20, 2);
  ctx.fillStyle = '#ffd795'; ctx.beginPath(); ctx.arc(x - 10, y - 15, 6, Math.PI / 2, Math.PI * 1.5); ctx.fill();
  ctx.fillStyle = '#2a2420'; ctx.fillRect(x - 12, y - 4, 24, 4);
}

// Unless quality is low, she goes through the same sprite pass as the living: painted large, rimmed
// by the lamps around her, reduced to the pixel grid and given volume. The renderer then makes the
// blood under her shine wet in the lantern light.
export function drawCorpse(ctx, t, opts) {
  if (Actor.lowFx) { paintCorpse(ctx, t, opts); return; }
  const { key, x, y, h = 150 } = opts, s = h / 200;
  const rs = ctx.getTransform().a || 0.5;
  const W = Math.ceil(460 * s + 40), Hh = Math.ceil(130 * s + 50), ox = x - W / 2, oy = y + 30 - Hh;
  const sp = (sprites[key] ||= {});
  if (!sp.hi || sp.hi.width !== W || sp.hi.height !== Hh) {
    sp.hi = document.createElement('canvas'); sp.hi.width = W; sp.hi.height = Hh; sp.lo = null;
  }
  if (!sp.lo || sp.rs !== rs) {
    sp.lo = document.createElement('canvas'); sp.lo.width = Math.max(1, Math.round(W * rs)); sp.lo.height = Math.max(1, Math.round(Hh * rs)); sp.rs = rs;
  }
  // she does not move: a fresh sprite a few times a second is enough to follow the lamps
  if (!(t - (sp.at ?? -1) < 0.3 && t >= sp.at)) {
    sp.at = t;
    const bc = sp.hi.getContext('2d', { willReadFrequently: true });
    bc.setTransform(1, 0, 0, 1, 0, 0); bc.clearRect(0, 0, W, Hh);
    bc.translate(-ox, -oy);
    paintCorpse(bc, t, opts);
    bc.setTransform(1, 0, 0, 1, 0, 0);
    const c = cache[key], keep = { x: c.x, y: c.y, _hi: c._hi };
    // rim and volume as if she were a figure lying across the middle of the sprite
    Object.assign(c, { x, y: y - 20 * s + h * 0.6, _hi: sp.hi, lantern: false, wet: false });
    c.rimLights(bc, W, Hh, Actor.lightsNow || []);
    pixelizeInto(sp.hi, sp.lo, { dither: 8, alphaCut: 100, edge: 0.5 });
    c.shadeVolume(sp.lo, c._found || []);
    Object.assign(c, keep);
  }
  ctx.drawImage(sp.lo, ox, oy, W, Hh);
}

function paintCorpse(ctx, t, { key, x, y, h = 150, look = {}, cover = '#1a1c24', blood = 1 }) {
  const s = h / 200;
  const c = (cache[key] ||= new Actor(key, { skirt: true, hat: 'bonnet', coat: '#3a2e28', ...look, x: 0, y: 0, h }));
  Object.assign(c, { x: 0, y: 0, h, pose: null, walkAmt: 0, moving: false, talking: false, look: 0, turnT: 0, coatX: 0, impact: 0, shiver: 0, phase: 0, blink: !!look.eyesClosed });
  const head = x - 95 * s, foot = x + 95 * s;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.ellipse(x, y + 6, 120 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fill();
  // blood: a pool under the neck that has run into the gaps between the stones
  if (blood) {
    ctx.fillStyle = '#2a0404';
    ctx.beginPath(); ctx.ellipse(head + 22 * s, y + 4, 60 * s * blood, 12 * s * blood, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a0808';
    ctx.beginPath(); ctx.ellipse(head + 18 * s, y + 2, 36 * s * blood, 7 * s * blood, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(220,120,100,0.35)'; ctx.fillRect(head + 4 * s, y, 18 * s, 2);
    ctx.strokeStyle = '#2a0404'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(head + (10 + i * 14) * s, y + 6); ctx.lineTo(head + (4 + i * 18) * s, y + 14 + i * 2); ctx.stroke(); }
  }
  // the body, on her back, head to the left
  ctx.save();
  ctx.translate(foot, y - 24 * s);
  ctx.rotate(-Math.PI / 2);
  c.drawFigure(ctx, t);
  ctx.restore();
  // the cape or sacking someone threw over her, sodden at the middle
  if (cover) {
    ctx.fillStyle = cover;
    ctx.beginPath();
    ctx.moveTo(head + 46 * s, y + 2);
    ctx.quadraticCurveTo(head + 60 * s, y - 40 * s, head + 100 * s, y - 38 * s);
    ctx.quadraticCurveTo(head + 150 * s, y - 34 * s, head + 168 * s, y - 8 * s);
    ctx.lineTo(head + 172 * s, y + 3);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(70,6,6,0.65)';
    ctx.beginPath(); ctx.ellipse(head + 98 * s, y - 20 * s, 28 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(head + 70 * s, y - 38 * s, 60 * s, 2);
  }
}
