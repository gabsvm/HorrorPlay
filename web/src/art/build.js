// Higher-level composition helpers shared by scenes: whole facades, terraces, distant layers.
import * as A from './paint.js';
import { P, shade } from './palette.js';
import { rng } from './noise.js';

// Paint a standard two-parallax night background (sky + far roofs + nearer roofs).
export function nightBackdrop(R, width, { seed = 1, spireX = null, spireH = 360, horizon = 470, glow = 'rgba(70,110,100,0.18)', cranes = false, sky = {} } = {}) {
  const w1 = 1280 + (width - 1280) * 0.2;
  const far1 = R.paintLayer(w1, (ctx, w, h) => {
    A.sky(ctx, w, h, { glow, seed, ...sky });
    A.skyline(ctx, { w, baseY: horizon - 40, seed: seed + 1, color: '#0f171b', minH: 40, maxH: 110, spire: spireX != null ? { x: spireX, h: spireH } : null, cranes });
    // atmospheric perspective: fog over the far band
    A.vgrad(ctx, 0, horizon - 220, w, 300, [[0, 'rgba(40,58,60,0)'], [1, 'rgba(40,58,60,0.55)']]);
  });
  const w2 = 1280 + (width - 1280) * 0.5;
  const far2 = R.paintLayer(w2, (ctx, w, h) => {
    A.skyline(ctx, { w, baseY: horizon + 30, seed: seed + 7, color: '#0a0f12', minH: 90, maxH: 210 });
    // tiny lit windows in the far roofs
    const r = rng(seed + 11);
    for (let i = 0; i < w / 90; i++) {
      if (!r.chance(0.35)) continue;
      ctx.fillStyle = r.chance(0.8) ? 'rgba(210,150,80,0.5)' : 'rgba(120,170,160,0.35)';
      ctx.fillRect(r.range(0, w), r.range(horizon - 120, horizon + 10), 4, 6);
    }
    A.vgrad(ctx, 0, horizon - 80, w, 240, [[0, 'rgba(30,44,46,0)'], [1, 'rgba(30,44,46,0.5)']]);
  });
  return [{ canvas: far1, parallax: 0.2, kind: 'far' }, { canvas: far2, parallax: 0.5, kind: 'far' }];
}

// A brick or plaster house front. Returns lit window centres.
export function facade(ctx, { x, w, top, base, seed = 1, kind = 'brick', floors = 2, door = null, windows = 2, litMap = [], roof = 'parapet', boards = [], broken = [], shopfront = null, arches = false, color }) {
  const r = rng(seed);
  const lights = [];
  if (kind === 'brick') A.brickWall(ctx, x, top, w, base - top, { seed, palette: color ? [color, shade(color, 0.9), shade(color, 1.08)] : P.brick });
  else A.plasterWall(ctx, x, top, w, base - top, { seed, color: color || P.plaster });
  // string course & parapet
  ctx.fillStyle = P.stoneDark;
  if (roof === 'parapet') { ctx.fillRect(x - 4, top - 10, w + 8, 14); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - 4, top + 4, w + 8, 4); }
  if (roof === 'gable') {
    ctx.fillStyle = '#16191b';
    ctx.beginPath(); ctx.moveTo(x - 14, top + 2); ctx.lineTo(x + w / 2, top - w * 0.32); ctx.lineTo(x + w + 14, top + 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 8; i++) { ctx.fillRect(x + w * 0.1 + i * w * 0.1, top - w * 0.05 - (i < 4 ? i : 7 - i) * w * 0.05, w * 0.06, 2); }
  }
  // chimney stack
  if (r.chance(0.8)) {
    const cx = x + r.range(w * 0.15, w * 0.7);
    A.brickWall(ctx, cx, top - 60 - (roof === 'gable' ? w * 0.2 : 0), 46, 64, { seed: seed + 3, soot: 1 });
    ctx.fillStyle = '#2a2420';
    for (let k = 0; k < 3; k++) ctx.fillRect(cx + 5 + k * 13, top - 76 - (roof === 'gable' ? w * 0.2 : 0), 9, 18);
  }
  const floorH = (base - top) / floors;
  for (let f = 0; f < floors; f++) {
    const fy = top + f * floorH;
    if (f === floors - 1 && shopfront) continue;
    for (let i = 0; i < windows; i++) {
      const ww = Math.min(58, (w / windows) * 0.42), wh = floorH * 0.5;
      const wx = x + (w / windows) * (i + 0.5) - ww / 2;
      if (f === floors - 1 && door != null && Math.abs(wx + ww / 2 - (x + door)) < ww) continue;
      const idx = f * windows + i;
      const lit = litMap.includes(idx);
      const c = A.windowFrame(ctx, wx, fy + floorH * 0.22, ww, wh, { lit, seed: seed + idx, curtain: r.chance(0.5), broken: broken.includes(idx), board: boards.includes(idx), arch: arches });
      if (c) lights.push(c);
    }
  }
  if (door != null) A.door(ctx, x + door - 28, base - 118, 56, 118, { arch: r.chance(0.4), steps: 1 });
  if (shopfront) {
    const sy = base - floorH;
    ctx.fillStyle = shopfront.color || '#2a1d16';
    ctx.fillRect(x + 6, sy + 8, w - 12, floorH - 8);
    ctx.fillStyle = '#121010'; ctx.fillRect(x + 6, sy + 8, w - 12, 30);
    if (shopfront.name) {
      ctx.font = '600 18px "IM Fell English SC", Georgia, serif'; ctx.fillStyle = '#bfa774'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(shopfront.name, x + w / 2, sy + 24);
    }
    const c = A.windowFrame(ctx, x + 22, sy + 50, w * 0.5, floorH - 66, { lit: !!shopfront.lit, warm: shopfront.warm || '#d9964a', panes: 3, sill: false, seed });
    if (c) lights.push(c);
    A.door(ctx, x + w * 0.62 + 6, base - (floorH - 46), Math.min(56, w * 0.26), floorH - 46, { steps: 0 });
  }
  A.drainpipe(ctx, x + w - 12, top - 4, base - top + 4);
  return lights;
}

export function warehouse(ctx, { x, w, top, base, seed = 1, name = null, hoist = true }) {
  A.brickWall(ctx, x, top, w, base - top, { seed, palette: ['#4a3229', '#3f2b25', '#523830', '#3a2823'], soot: 0.8 });
  // pilasters
  for (let px = x; px <= x + w; px += w / 4) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(px - 8, top, 16, base - top); }
  // loading doors stack
  const dx = x + w / 2 - 40;
  for (let y = top + 40; y < base - 180; y += 130) {
    ctx.fillStyle = '#0d0d0d'; ctx.fillRect(dx - 6, y - 6, 92, 106);
    A.gate(ctx, dx, y, 80, 94);
  }
  if (hoist) {
    ctx.fillStyle = P.iron; ctx.fillRect(dx + 30, top + 10, 20, 12); ctx.fillRect(dx + 38, top + 20, 4, 60);
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(dx + 40, top + 80); ctx.lineTo(dx + 40, base - 260); ctx.stroke();
    ctx.fillStyle = P.iron; ctx.beginPath(); ctx.arc(dx + 40, base - 254, 7, 0, Math.PI); ctx.fill();
  }
  // small high windows
  for (let i = 0; i < 4; i++) {
    const wx = x + 30 + i * (w - 60) / 3.3;
    if (Math.abs(wx - dx) < 110) continue;
    for (let y = top + 50; y < base - 120; y += 120) A.windowFrame(ctx, wx, y, 36, 52, { arch: true, seed: seed + i * 7 + y, bars: i % 2 === 0, broken: (i + y) % 5 === 0, sill: true });
  }
  if (name) {
    ctx.font = '600 30px "IM Fell English SC", Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(205,195,170,0.55)';
    ctx.fillText(name, x + w / 2, top + 22);
  }
  A.gate(ctx, x + 30, base - 150, 120, 150);
}

// ---------------------------------------------------------------- interiors
export function wallpaper(ctx, x, y, w, h, { seed = 1, base = '#4a4636', stripe = '#3d3a2c', damp = 0.6 } = {}) {
  ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
  for (let xx = x; xx < x + w; xx += 34) { ctx.fillStyle = stripe; ctx.fillRect(xx, y, 12, h); }
  // faded damask dots
  ctx.fillStyle = 'rgba(160,140,100,0.12)';
  for (let yy = y + 20; yy < y + h; yy += 48) for (let xx = x + 17 + ((yy / 48) % 2) * 17; xx < x + w; xx += 68) { ctx.beginPath(); ctx.ellipse(xx, yy, 7, 11, 0, 0, Math.PI * 2); ctx.fill(); }
  A.stain(ctx, x, y, w, h, { seed, alpha: 0.65, scale: 5 });
  A.stain(ctx, x, y, w, h, { seed: seed + 4, alpha: 0.4, scale: 16 });
  // damp creeping from the floor and a ceiling water mark
  A.vgrad(ctx, x, y + h * 0.65, w, h * 0.35, [[0, 'rgba(25,28,20,0)'], [1, `rgba(25,28,20,${damp})`]]);
  A.vgrad(ctx, x, y, w, h * 0.25, [[0, 'rgba(10,10,8,0.6)'], [1, 'rgba(10,10,8,0)']]);
  const r = rng(seed + 9);
  for (let i = 0; i < 4; i++) {
    const px = x + r.range(0, w), py = y + r.range(h * 0.1, h * 0.5);
    ctx.fillStyle = '#6a604c';
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + r.range(20, 50), py + r.range(-4, 6)); ctx.lineTo(px + r.range(10, 40), py + r.range(30, 70)); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px, py, 2, 30);
  }
}

export function wainscot(ctx, x, y, w, h) {
  ctx.fillStyle = P.woodDark; ctx.fillRect(x, y, w, h);
  for (let xx = x; xx < x + w; xx += 90) { ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(xx + 8, y + 10, 74, h - 20); }
  ctx.fillStyle = '#3a2a1e'; ctx.fillRect(x, y - 6, w, 8);
  A.stain(ctx, x, y, w, h, { seed: 5, alpha: 0.4 });
}

export function floorboards(ctx, x, y, w, h, { seed = 2, color = '#3b2a1f' } = {}) {
  const r = rng(seed);
  A.vgrad(ctx, x, y, w, h, [[0, A.mix(color, '#000000', 0.45)], [1, color]]);
  // boards run toward the viewer: lines converge to a vanishing point above the room
  const vx = x + w / 2, vy = y - 900;
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1.5;
  for (let xx = x - w; xx < x + w * 2; xx += 46) {
    ctx.beginPath(); ctx.moveTo(vx + (xx - vx) * ((y - vy) / (y + h - vy)), y); ctx.lineTo(xx, y + h); ctx.stroke();
  }
  for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(0,0,0,${r.range(0.05, 0.2)})`; ctx.fillRect(x + r.range(0, w), y + r.range(0, h), r.range(30, 120), 2); }
  A.stain(ctx, x, y, w, h, { seed, alpha: 0.4, scale: 7 });
}

export function rug(ctx, x, y, w, h) {
  ctx.fillStyle = '#4a1e18';
  ctx.beginPath(); ctx.moveTo(x + 40, y); ctx.lineTo(x + w - 40, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.fill();
  ctx.strokeStyle = 'rgba(190,150,90,0.25)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + 56, y + 8); ctx.lineTo(x + w - 56, y + 8); ctx.lineTo(x + w - 20, y + h - 8); ctx.lineTo(x + 20, y + h - 8); ctx.closePath(); ctx.stroke();
  A.stain(ctx, x, y, w, h, { seed: 12, alpha: 0.6 });
}

// A window seen from inside, looking out onto a wet night street. Returns its centre.
export function interiorWindow(ctx, x, y, w, h, { seed = 3 } = {}) {
  ctx.fillStyle = '#0a0d10'; ctx.fillRect(x - 14, y - 14, w + 28, h + 28);
  A.vgrad(ctx, x, y, w, h, [[0, '#0b1116'], [0.6, '#16222a'], [1, '#1e2d33']]);
  // opposite house silhouette and a lit window
  ctx.fillStyle = '#080b0d'; ctx.fillRect(x, y + h * 0.18, w, h * 0.82);
  ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x + w * 0.6, y + h * 0.36, w * 0.14, h * 0.16);
  ctx.fillStyle = '#d2a35c'; ctx.beginPath(); ctx.arc(x + w * 0.22, y + h * 0.44, 5, 0, Math.PI * 2); ctx.fill();
  // frame and sash
  ctx.fillStyle = '#2a2018';
  ctx.fillRect(x, y + h / 2 - 5, w, 10);
  ctx.fillRect(x + w / 2 - 3, y, 6, h);
  ctx.fillRect(x - 14, y + h + 6, w + 28, 12);
  // curtains
  ctx.fillStyle = '#3c2320';
  ctx.beginPath(); ctx.moveTo(x - 30, y - 30); ctx.quadraticCurveTo(x + 10, y + h * 0.5, x - 10, y + h + 40); ctx.lineTo(x - 40, y + h + 40); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + w + 30, y - 30); ctx.quadraticCurveTo(x + w - 14, y + h * 0.5, x + w + 6, y + h + 40); ctx.lineTo(x + w + 40, y + h + 40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1a1410'; ctx.fillRect(x - 50, y - 36, w + 100, 8);
  return { x: x + w / 2, y: y + h / 2 };
}

export function bed(ctx, x, y, w) {
  ctx.fillStyle = '#1b1612'; ctx.fillRect(x, y - 110, 12, 110); ctx.fillRect(x + w - 12, y - 70, 12, 70);
  ctx.fillStyle = '#2a2018'; ctx.fillRect(x, y - 66, w, 26);
  ctx.fillStyle = '#8c8470'; ctx.fillRect(x + 10, y - 82, w - 20, 22); // sheet
  ctx.fillStyle = '#5b5446';
  ctx.beginPath(); ctx.moveTo(x + 90, y - 84); ctx.quadraticCurveTo(x + w * 0.6, y - 100, x + w - 10, y - 80); ctx.lineTo(x + w - 10, y - 40); ctx.lineTo(x + 70, y - 40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#a49c86'; ctx.beginPath(); ctx.ellipse(x + 50, y - 86, 34, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x + 6, y - 40, w - 12, 40);
  A.stain(ctx, x, y - 110, w, 110, { seed: 8, alpha: 0.35 });
}

export function desk(ctx, x, y, w) {
  ctx.fillStyle = '#2b1f16'; ctx.fillRect(x, y - 96, w, 14);
  ctx.fillStyle = '#20170f'; ctx.fillRect(x + 6, y - 82, 70, 82); ctx.fillRect(x + w - 76, y - 82, 70, 82);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { ctx.strokeRect(x + 12, y - 76 + i * 26, 58, 22); ctx.strokeRect(x + w - 70, y - 76 + i * 26, 58, 22); }
  ctx.fillStyle = '#7d6b48';
  for (let i = 0; i < 3; i++) { ctx.fillRect(x + 38, y - 66 + i * 26, 6, 3); ctx.fillRect(x + w - 44, y - 66 + i * 26, 6, 3); }
}

export function chair(ctx, x, y, flip = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(flip, 1);
  ctx.fillStyle = '#21180f';
  ctx.fillRect(0, -62, 52, 8); ctx.fillRect(2, -54, 6, 54); ctx.fillRect(44, -54, 6, 54);
  ctx.fillRect(40, -140, 8, 86); ctx.fillRect(4, -140, 8, 0);
  ctx.fillRect(40, -140, 8, 4); for (let i = 0; i < 3; i++) ctx.fillRect(42, -128 + i * 22, 4, 14);
  ctx.restore();
}
