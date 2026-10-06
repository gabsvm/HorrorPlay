// A victim lying in the street, drawn from the same figure as the living (rotated onto her back)
// so she matches everyone else in the scene. A cape or sacking over her, blood under her neck.
import { Actor } from '../engine/actor.js';

const cache = {};

// a bull's-eye lantern set down on the stones beside her
export function groundLantern(ctx, x, y) {
  ctx.fillStyle = '#1e1a16'; ctx.fillRect(x - 10, y - 26, 20, 24); ctx.fillRect(x - 6, y - 30, 12, 5);
  ctx.strokeStyle = '#3a3026'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 30, 6, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#7a6440'; ctx.fillRect(x - 10, y - 22, 20, 2); ctx.fillRect(x - 10, y - 8, 20, 2);
  ctx.fillStyle = '#ffd795'; ctx.beginPath(); ctx.arc(x - 10, y - 15, 6, Math.PI / 2, Math.PI * 1.5); ctx.fill();
  ctx.fillStyle = '#2a2420'; ctx.fillRect(x - 12, y - 4, 24, 4);
}

export function drawCorpse(ctx, t, { key, x, y, h = 150, look = {}, cover = '#1a1c24', blood = 1 }) {
  const s = h / 200;
  const c = (cache[key] ||= new Actor(key, { skirt: true, hat: 'bonnet', coat: '#3a2e28', ...look, x: 0, y: 0, h }));
  Object.assign(c, { x: 0, y: 0, h, pose: null, walkAmt: 0, moving: false, talking: false, look: 0, turnT: 0, coatX: 0, impact: 0, shiver: 0, phase: 0, blink: !!look.eyesClosed });
  const head = x - 95 * s, foot = x + 95 * s;
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
