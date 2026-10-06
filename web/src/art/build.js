// Higher-level composition helpers shared by scenes: whole facades, warehouses, distant layers, interiors.
import * as A from './paint.js';
import { P, shade } from './palette.js';
import { rng } from './noise.js';

const TAU = Math.PI * 2;

// Two parallax layers of night: sky and landmarks far off, then a nearer band of roofs with lit windows.
export function nightBackdrop(R, width, { seed = 1, spireX = null, spireH = 360, domeX = null, gasX = null, horizon = 470, glow = 'rgba(70,110,100,0.18)', cranes = false, sky = {} } = {}) {
  const w1 = 1280 + (width - 1280) * 0.2;
  const far1 = R.paintLayer(w1, (ctx, w, h) => {
    A.sky(ctx, w, h, { glow, seed, stars: 6, ...sky });
    A.skyline(ctx, {
      w, baseY: horizon - 40, seed: seed + 1, color: '#121b20', minH: 40, maxH: 110, cranes,
      spire: spireX != null ? { x: spireX, h: spireH } : null,
      dome: domeX != null ? { x: domeX, h: 230 } : null,
      gasometer: gasX != null ? { x: gasX, w: 170, h: 120 } : null,
    });
    A.vgrad(ctx, 0, horizon - 220, w, 300, [[0, 'rgba(40,58,60,0)'], [1, 'rgba(40,58,60,0.6)']]);
  });
  const w2 = 1280 + (width - 1280) * 0.5;
  const far2 = R.paintLayer(w2, (ctx, w, h) => {
    A.skyline(ctx, { w, baseY: horizon + 30, seed: seed + 7, color: '#0b1114', minH: 90, maxH: 210 });
    const r = rng(seed + 11);
    for (let i = 0; i < w / 60; i++) {
      if (!r.chance(0.4)) continue;
      const wx = r.range(0, w), wy = r.range(horizon - 140, horizon + 10);
      ctx.fillStyle = r.chance(0.82) ? `rgba(220,150,70,${r.range(0.35, 0.7)})` : 'rgba(120,170,160,0.35)';
      ctx.fillRect(wx, wy, 6, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(wx + 2.5, wy, 1, 8);
    }
    A.vgrad(ctx, 0, horizon - 80, w, 240, [[0, 'rgba(30,44,46,0)'], [1, 'rgba(30,44,46,0.55)']]);
  });
  return [{ canvas: far1, parallax: 0.2, kind: 'far' }, { canvas: far2, parallax: 0.5, kind: 'far' }];
}

// Cornice with dentils and a shadowed soffit.
function cornice(ctx, x, y, w) {
  ctx.fillStyle = '#5a554c'; ctx.fillRect(x - 8, y - 18, w + 16, 10);
  ctx.fillStyle = '#6e685d'; ctx.fillRect(x - 10, y - 22, w + 20, 5);
  ctx.fillStyle = '#4a463f';
  for (let xx = x - 4; xx < x + w + 4; xx += 10) ctx.fillRect(xx, y - 8, 6, 6);
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x - 8, y - 2, w + 16, 5);
}

function chimney(ctx, cx, topY, seed, { pots = 3, wide = 46 } = {}) {
  A.brickWall(ctx, cx, topY - 64, wide, 68, { seed, soot: 1, salt: 0, patches: 0, holes: 0, palette: A.BRICK.stock });
  ctx.fillStyle = '#4a463f'; ctx.fillRect(cx - 3, topY - 68, wide + 6, 7);
  const r = rng(seed);
  for (let k = 0; k < pots; k++) {
    const px = cx + 4 + k * ((wide - 8) / pots), ph = r.range(14, 24);
    ctx.fillStyle = r.pick(['#5a3a2a', '#6a4a36', '#3a2a22']);
    ctx.fillRect(px, topY - 68 - ph, 9, ph); ctx.fillRect(px - 1, topY - 68 - ph, 11, 3);
  }
  return { x: cx + wide / 2, y: topY - 90 };
}

// A brick or plaster house front. Returns lit windows ({x, y, rect}); `.chimneys` lists stack tops.
export function facade(ctx, {
  x, w, top, base, seed = 1, kind = 'brick', floors = 2, door = null, windows = 2, litMap = [], roof = 'parapet',
  boards = [], broken = [], shopfront = null, arches = false, color, stock = false, number = null, ghost = null,
  figures = [], nets = [], area = false, pawn = null, sign = null,
}) {
  const r = rng(seed);
  const lights = [];
  const chimneys = [];
  const pal = color ? [color, shade(color, 0.9), shade(color, 1.08)] : stock ? A.BRICK.stock : P.brick;
  if (kind === 'brick') A.brickWall(ctx, x, top, w, base - top, { seed, palette: pal });
  else A.plasterWall(ctx, x, top, w, base - top, { seed, color: color || P.plaster });
  A.hgrad(ctx, x, top, 14, base - top, [[0, 'rgba(0,0,0,0.45)'], [1, 'rgba(0,0,0,0)']]);
  A.hgrad(ctx, x + w - 14, top, 14, base - top, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.45)']]);
  if (roof === 'parapet') cornice(ctx, x, top, w);
  if (roof === 'gable') {
    const peak = top - w * 0.32;
    ctx.fillStyle = '#1a1e21';
    ctx.beginPath(); ctx.moveTo(x - 14, top + 2); ctx.lineTo(x + w / 2, peak); ctx.lineTo(x + w + 14, top + 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.moveTo(x - 14, top + 2); ctx.lineTo(x + w / 2, peak); ctx.lineTo(x + w + 14, top + 2); ctx.clip();
    for (let yy = peak; yy < top; yy += 8) for (let xx = x - 14 + (Math.round((yy - peak) / 8) % 2) * 9; xx < x + w + 14; xx += 18) { ctx.fillStyle = r.pick(['#22282c', '#1c2124', '#262c31']); ctx.fillRect(xx, yy, 16, 7); }
    ctx.restore();
    ctx.strokeStyle = '#3a342c'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 14, top + 2); ctx.lineTo(x + w / 2, peak); ctx.lineTo(x + w + 14, top + 2); ctx.stroke();
  }
  if (r.chance(0.85)) {
    const cx = x + r.range(w * 0.12, w * 0.62);
    chimneys.push(chimney(ctx, cx, (roof === 'gable' ? top - w * 0.18 : top - 20), seed + 3, { pots: r.int(2, 4) }));
  }
  if (ghost) A.ghostSign(ctx, x + 24, top + 20, ghost, { seed: seed + 8 });
  const floorH = (base - top) / floors;
  for (let f = 1; f < floors; f++) { ctx.fillStyle = '#5c574d'; ctx.fillRect(x, top + f * floorH - 4, w, 6); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x, top + f * floorH + 2, w, 2); }
  for (let f = 0; f < floors; f++) {
    const fy = top + f * floorH;
    if (f === floors - 1 && shopfront) continue;
    for (let i = 0; i < windows; i++) {
      const ww = Math.min(62, (w / windows) * 0.44), wh = floorH * 0.52;
      const wx = x + (w / windows) * (i + 0.5) - ww / 2;
      if (f === floors - 1 && door != null && Math.abs(wx + ww / 2 - (x + door)) < ww) continue;
      const idx = f * windows + i;
      const lit = litMap.includes(idx);
      const wy = fy + floorH * 0.24;
      const c = A.windowFrame(ctx, wx, wy, ww, wh, { lit, seed: seed + idx, curtain: r.chance(0.55), broken: broken.includes(idx), board: boards.includes(idx), arch: arches, figure: figures.includes(idx), net: nets.includes(idx) });
      if (c) lights.push({ ...c, rect: [wx, wy, ww, wh] });
    }
  }
  if (door != null) A.door(ctx, x + door - 28, base - 118, 56, 118, { arch: arches, steps: 1, number, fanlight: !arches });
  if (area) {
    ctx.fillStyle = '#060606'; ctx.fillRect(x + 8, base - 26, w - 16, 26);
    A.railing(ctx, x + 8, base - 64, w * 0.5, 54, { gap: 11 });
  }
  if (shopfront) {
    const sy = base - floorH;
    const fascia = shopfront.fascia || '#141a16';
    for (const px of [x + 2, x + w - 16]) { ctx.fillStyle = '#3a342c'; ctx.fillRect(px, sy, 14, floorH); ctx.fillStyle = '#4a443a'; ctx.fillRect(px - 2, sy - 2, 18, 12); }
    ctx.fillStyle = fascia; ctx.fillRect(x + 16, sy + 4, w - 32, 34);
    ctx.strokeStyle = '#8a7444'; ctx.lineWidth = 2; ctx.strokeRect(x + 20, sy + 8, w - 40, 26);
    if (shopfront.name) {
      ctx.font = '600 19px "IM Fell English SC", Georgia, serif'; ctx.fillStyle = '#c9a860'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(shopfront.name, x + w / 2, sy + 22);
    }
    A.awning(ctx, x + 18, sy + 38, w - 36, { down: false, color: '#2e1c18' });
    ctx.fillStyle = shopfront.color || '#2a1d16'; ctx.fillRect(x + 16, sy + 50, w - 32, floorH - 50);
    const dw = Math.min(58, w * 0.24);
    const winW = w - 32 - dw - 20;
    const c = A.windowFrame(ctx, x + 22, sy + 58, winW, floorH - 98, { lit: !!shopfront.lit, warm: shopfront.warm || '#d9964a', panes: 0, sill: false, seed, frame: '#3a3228' });
    if (c) lights.push({ ...c, rect: [x + 22, sy + 58, winW, floorH - 98] });
    if (shopfront.goods !== false) {
      const gr = rng(seed + 50);
      for (let i = 0; i < winW / 18; i++) { ctx.fillStyle = gr.pick(['#1e1a14', '#2a2018', '#14181a']); const gh = gr.range(14, 40); ctx.fillRect(x + 28 + i * 18, sy + floorH - 44 - gh, gr.range(8, 14), gh); }
    }
    ctx.fillStyle = '#2a2420'; ctx.fillRect(x + 16, base - 40, winW + 12, 40);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 16, base - 40, winW + 12, 3);
    A.door(ctx, x + w - 16 - dw - 4, base - (floorH - 60), dw, floorH - 60, { steps: 0, fanlight: false });
  }
  if (pawn != null) A.pawnSign(ctx, x + pawn, base - floorH - 30);
  if (sign) A.hangingSign(ctx, x + sign.x, sign.y ?? base - floorH - 40, sign.text, sign);
  A.drainpipe(ctx, x + w - 12, top - 4, base - top + 4);
  lights.chimneys = chimneys;
  return lights;
}

// Bonded warehouse: stacked loading doors, hoist and jib, tie-plates, a painted name.
export function warehouse(ctx, { x, w, top, base, seed = 1, name = null, hoist = true }) {
  A.brickWall(ctx, x, top, w, base - top, { seed, palette: A.BRICK.stock, soot: 0.9, salt: 0.6 });
  for (let px = x; px <= x + w; px += w / 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(px - 9, top, 18, base - top);
    ctx.fillStyle = 'rgba(255,240,220,0.05)'; ctx.fillRect(px - 9, top, 3, base - top);
  }
  cornice(ctx, x, top, w);
  ctx.fillStyle = P.iron;
  for (let yy = top + 140; yy < base - 100; yy += 160) for (let px = x + w / 8; px < x + w; px += w / 4) { ctx.beginPath(); ctx.arc(px, yy, 7, 0, TAU); ctx.fill(); ctx.fillRect(px - 9, yy - 1.5, 18, 3); }
  const dx = x + w / 2 - 40;
  for (let y = top + 40; y < base - 180; y += 130) {
    ctx.fillStyle = '#0d0d0d'; ctx.fillRect(dx - 8, y - 8, 96, 110);
    ctx.fillStyle = '#5c574d'; ctx.fillRect(dx - 12, y + 98, 104, 8);
    A.gate(ctx, dx, y, 80, 94);
  }
  if (hoist) {
    ctx.fillStyle = P.woodDark; ctx.fillRect(dx + 20, top + 2, 40, 14); ctx.fillRect(dx + 36, top - 30, 8, 46);
    ctx.save(); ctx.translate(dx + 40, top - 26); ctx.rotate(0.2); ctx.fillRect(0, 0, 70, 8); ctx.restore();
    ctx.fillStyle = P.iron; ctx.beginPath(); ctx.arc(dx + 104, top - 6, 7, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#141414'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(dx + 104, top - 6); ctx.lineTo(dx + 104, base - 240); ctx.stroke();
    ctx.fillStyle = P.iron; ctx.beginPath(); ctx.arc(dx + 104, base - 232, 8, 0, Math.PI); ctx.fill(); ctx.fillRect(dx + 101, base - 244, 6, 12);
  }
  for (let i = 0; i < 4; i++) {
    const wx = x + 30 + i * (w - 60) / 3.3;
    if (Math.abs(wx - dx) < 110) continue;
    for (let y = top + 50; y < base - 120; y += 120) A.windowFrame(ctx, wx, y, 38, 54, { arch: true, seed: seed + i * 7 + y, bars: i % 2 === 0, broken: (i + y) % 5 === 0, sill: true, frame: '#4a463e' });
  }
  if (name) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + w * 0.1, top + 6, w * 0.8, 36);
    ctx.font = '600 32px "IM Fell English SC", Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(215,205,180,0.62)';
    ctx.fillText(name, x + w / 2, top + 25);
    A.stain(ctx, x + w * 0.1, top + 6, w * 0.8, 36, { seed: seed + 2, alpha: 0.5 });
  }
  A.gate(ctx, x + 30, base - 150, 120, 150);
  ctx.fillStyle = '#5c574d'; ctx.fillRect(x + 22, base - 160, 136, 10);
}

// ---------------------------------------------------------------- interiors
export function wallpaper(ctx, x, y, w, h, { seed = 1, base = '#4a4636', stripe = '#3d3a2c', damp = 0.6 } = {}) {
  ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
  for (let xx = x; xx < x + w; xx += 36) { ctx.fillStyle = stripe; ctx.fillRect(xx, y, 12, h); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(xx + 12, y, 2, h); }
  ctx.fillStyle = 'rgba(170,150,105,0.16)';
  for (let yy = y + 22; yy < y + h; yy += 52) for (let xx = x + 18 + ((Math.round((yy - y) / 52)) % 2) * 18; xx < x + w; xx += 72) {
    ctx.beginPath(); ctx.ellipse(xx, yy, 6, 11, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(xx - 8, yy + 6, 5, 3, -0.6, 0, TAU); ctx.ellipse(xx + 8, yy + 6, 5, 3, 0.6, 0, TAU); ctx.fill();
    ctx.fillRect(xx - 1, yy + 10, 2, 8);
  }
  A.stain(ctx, x, y, w, h, { seed, alpha: 0.65, scale: 5 });
  A.stain(ctx, x, y, w, h, { seed: seed + 4, alpha: 0.4, scale: 16 });
  A.vgrad(ctx, x, y + h * 0.65, w, h * 0.35, [[0, 'rgba(25,28,20,0)'], [1, `rgba(25,28,20,${damp})`]]);
  A.vgrad(ctx, x, y, w, h * 0.25, [[0, 'rgba(10,10,8,0.6)'], [1, 'rgba(10,10,8,0)']]);
  const r = rng(seed + 9);
  for (let i = 0; i < 5; i++) {
    const px = x + r.range(0, w), py = y + r.range(h * 0.1, h * 0.5);
    ctx.fillStyle = 'rgba(30,26,20,0.6)';
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + r.range(20, 50), py + r.range(-4, 6)); ctx.lineTo(px + r.range(10, 40), py + r.range(30, 70)); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(200,185,150,0.18)'; ctx.fillRect(px, py, 3, 26);
  }
  const sx = x + r.range(w * 0.1, w * 0.8);
  ctx.fillStyle = 'rgba(200,185,150,0.08)'; ctx.fillRect(sx, y + h * 0.2, 70, 90);
  ctx.fillStyle = '#2a2016'; ctx.fillRect(sx + 33, y + h * 0.2 - 6, 4, 4);
  A.grit(ctx, x, y, w, h, { seed, density: 0.5 });
}

export function wainscot(ctx, x, y, w, h) {
  ctx.fillStyle = P.woodDark; ctx.fillRect(x, y, w, h);
  for (let xx = x; xx < x + w; xx += 90) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(xx + 8, y + 12, 74, h - 24);
    ctx.fillStyle = 'rgba(255,230,200,0.07)'; ctx.fillRect(xx + 8, y + 12, 74, 2); ctx.fillRect(xx + 8, y + 12, 2, h - 24);
  }
  ctx.fillStyle = '#3a2a1e'; ctx.fillRect(x, y - 8, w, 9);
  ctx.fillStyle = 'rgba(255,230,200,0.1)'; ctx.fillRect(x, y - 8, w, 2);
  ctx.fillStyle = '#1a120c'; ctx.fillRect(x, y + h - 12, w, 12);
  A.stain(ctx, x, y, w, h, { seed: 5, alpha: 0.4 });
}

export function floorboards(ctx, x, y, w, h, { seed = 2, color = '#3b2a1f' } = {}) {
  const r = rng(seed);
  A.vgrad(ctx, x, y, w, h, [[0, A.mix(color, '#000000', 0.5)], [1, color]]);
  const vx = x + w / 2, vy = y - 900;
  for (let xx = x - w; xx < x + w * 2; xx += 46) {
    const x0 = vx + (xx - vx) * ((y - vy) / (y + h - vy));
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(xx, y + h); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,200,0.05)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0 + 3, y); ctx.lineTo(xx + 4, y + h); ctx.stroke();
    ctx.fillStyle = 'rgba(160,150,130,0.35)'; ctx.fillRect(xx + 10, y + h * 0.7, 2, 2);
  }
  for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(0,0,0,${r.range(0.05, 0.2)})`; ctx.fillRect(x + r.range(0, w), y + r.range(0, h), r.range(30, 120), 2); }
  A.stain(ctx, x, y, w, h, { seed, alpha: 0.4, scale: 7 });
}

export function rug(ctx, x, y, w, h) {
  ctx.fillStyle = '#4a1e18';
  ctx.beginPath(); ctx.moveTo(x + 40, y); ctx.lineTo(x + w - 40, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.fill();
  ctx.strokeStyle = 'rgba(190,150,90,0.35)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + 56, y + 8); ctx.lineTo(x + w - 56, y + 8); ctx.lineTo(x + w - 20, y + h - 8); ctx.lineTo(x + 20, y + h - 8); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = 'rgba(30,60,60,0.45)';
  for (let i = 0; i < 6; i++) { const cx = x + w * (0.2 + i * 0.12); ctx.beginPath(); ctx.moveTo(cx, y + h / 2 - 7); ctx.lineTo(cx + 9, y + h / 2); ctx.lineTo(cx, y + h / 2 + 7); ctx.lineTo(cx - 9, y + h / 2); ctx.fill(); }
  ctx.fillStyle = '#8a7a5a'; for (let xx = x + 4; xx < x + w; xx += 8) ctx.fillRect(xx, y + h, 3, 6);
  A.stain(ctx, x, y, w, h, { seed: 12, alpha: 0.6 });
}

// A window seen from inside, looking out onto a wet night street. Returns its centre.
export function interiorWindow(ctx, x, y, w, h, { seed = 3 } = {}) {
  ctx.fillStyle = '#0a0d10'; ctx.fillRect(x - 16, y - 16, w + 32, h + 32);
  A.vgrad(ctx, x, y, w, h, [[0, '#0b1116'], [0.6, '#16222a'], [1, '#1e2d33']]);
  ctx.fillStyle = '#080b0d'; ctx.fillRect(x, y + h * 0.18, w, h * 0.82);
  ctx.fillStyle = '#0c1012'; for (let i = 0; i < 3; i++) ctx.fillRect(x + i * w * 0.36, y + h * 0.1, w * 0.3, 10);
  ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x + w * 0.6, y + h * 0.36, w * 0.14, h * 0.16);
  ctx.fillStyle = '#d2a35c'; ctx.beginPath(); ctx.arc(x + w * 0.22, y + h * 0.44, 5, 0, TAU); ctx.fill();
  const r = rng(seed);
  for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(160,180,185,${r.range(0.1, 0.3)})`; ctx.fillRect(x + r.range(0, w), y + r.range(0, h), 2, r.chance(0.3) ? 6 : 2); }
  ctx.fillStyle = '#2a2018';
  ctx.fillRect(x, y + h / 2 - 5, w, 10);
  ctx.fillRect(x + w / 2 - 3, y, 6, h);
  ctx.fillRect(x + w / 4 - 2, y, 4, h); ctx.fillRect(x + (3 * w) / 4 - 2, y, 4, h);
  ctx.fillRect(x - 16, y + h + 6, w + 32, 14);
  ctx.fillStyle = 'rgba(255,230,200,0.08)'; ctx.fillRect(x - 16, y + h + 6, w + 32, 2);
  for (const s of [-1, 1]) {
    const ex = s < 0 ? x : x + w;
    ctx.fillStyle = '#3c2320';
    ctx.beginPath(); ctx.moveTo(ex - s * 30, y - 30); ctx.quadraticCurveTo(ex + s * 12, y + h * 0.5, ex + s * 10, y + h + 40); ctx.lineTo(ex - s * 40, y + h + 40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (let k = 0; k < 3; k++) ctx.fillRect(ex - s * (12 + k * 9), y - 20, 3, h + 56);
  }
  ctx.fillStyle = '#1a1410'; ctx.fillRect(x - 50, y - 36, w + 100, 8);
  ctx.fillStyle = '#6a5a3a'; ctx.beginPath(); ctx.arc(x - 50, y - 32, 6, 0, TAU); ctx.arc(x + w + 50, y - 32, 6, 0, TAU); ctx.fill();
  return { x: x + w / 2, y: y + h / 2 };
}

export function bed(ctx, x, y, w) {
  ctx.fillStyle = '#1b1c1e';
  ctx.fillRect(x, y - 120, 7, 120); ctx.fillRect(x + 36, y - 112, 5, 60);
  ctx.fillRect(x, y - 120, 44, 5); ctx.fillRect(x, y - 92, 44, 4);
  for (let i = 0; i < 4; i++) ctx.fillRect(x + 8 + i * 8, y - 116, 3, 26);
  ctx.fillRect(x + w - 7, y - 84, 7, 84); ctx.fillRect(x + w - 40, y - 84, 40, 4);
  ctx.fillStyle = '#9a8350'; ctx.beginPath(); ctx.arc(x + 3, y - 124, 5, 0, TAU); ctx.arc(x + w - 3, y - 88, 5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a2018'; ctx.fillRect(x, y - 66, w, 24);
  ctx.fillStyle = '#8c8470'; ctx.fillRect(x + 10, y - 82, w - 20, 22);
  const r = rng(8);
  ctx.save();
  ctx.beginPath(); ctx.moveTo(x + 90, y - 84); ctx.quadraticCurveTo(x + w * 0.6, y - 102, x + w - 10, y - 80); ctx.lineTo(x + w - 10, y - 38); ctx.lineTo(x + 70, y - 38); ctx.closePath(); ctx.clip();
  for (let yy = y - 104; yy < y - 36; yy += 14) for (let xx = x + 70; xx < x + w; xx += 18) { ctx.fillStyle = r.pick(['#4a3e34', '#3a3430', '#5a3428', '#34403a', '#56504a']); ctx.fillRect(xx, yy, 18, 14); }
  ctx.restore();
  ctx.fillStyle = '#a49c86'; ctx.beginPath(); ctx.ellipse(x + 50, y - 86, 34, 12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x + 56, y - 84, 14, 5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x + 6, y - 40, w - 12, 40);
  A.stain(ctx, x, y - 120, w, 120, { seed: 8, alpha: 0.35 });
}

export function desk(ctx, x, y, w) {
  ctx.fillStyle = '#2b1f16'; ctx.fillRect(x - 4, y - 98, w + 8, 14);
  ctx.fillStyle = '#1e3a2a'; ctx.fillRect(x + 20, y - 98, w - 40, 4);
  ctx.fillStyle = 'rgba(255,230,200,0.08)'; ctx.fillRect(x - 4, y - 98, w + 8, 2);
  ctx.fillStyle = '#20170f'; ctx.fillRect(x + 6, y - 84, 70, 84); ctx.fillRect(x + w - 76, y - 84, 70, 84);
  for (let i = 0; i < 3; i++) for (const dx of [x + 12, x + w - 70]) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(dx, y - 78 + i * 26, 58, 22);
    ctx.fillStyle = 'rgba(255,230,200,0.06)'; ctx.fillRect(dx, y - 78 + i * 26, 58, 2);
    ctx.fillStyle = '#9a8350'; ctx.fillRect(dx + 26, y - 68 + i * 26, 7, 3);
  }
}

export function chair(ctx, x, y, flip = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(flip, 1);
  ctx.fillStyle = '#21180f';
  ctx.fillRect(0, -62, 54, 9); ctx.fillRect(3, -54, 6, 54); ctx.fillRect(45, -54, 6, 54);
  ctx.fillRect(41, -146, 8, 92); ctx.fillRect(1, -36, 52, 4);
  ctx.fillRect(38, -148, 14, 6);
  for (let i = 0; i < 3; i++) ctx.fillRect(43, -132 + i * 22, 4, 14);
  ctx.fillStyle = 'rgba(255,230,200,0.08)'; ctx.fillRect(0, -62, 54, 2);
  ctx.restore();
}

// Cast-iron grate under a painted mantel. Returns the ember position when lit.
export function fireplace(ctx, x, base, { lit = false, w = 170 } = {}) {
  ctx.fillStyle = '#2a2420'; ctx.fillRect(x, base - 150, w, 150);
  ctx.fillStyle = '#3a332c'; ctx.fillRect(x - 12, base - 160, w + 24, 14);
  ctx.fillStyle = 'rgba(255,240,220,0.1)'; ctx.fillRect(x - 12, base - 160, w + 24, 2);
  ctx.fillStyle = '#0d0c0b'; ctx.beginPath(); ctx.moveTo(x + 24, base); ctx.lineTo(x + 24, base - 96); ctx.arc(x + w / 2, base - 96, w / 2 - 24, Math.PI, 0); ctx.lineTo(x + w - 24, base); ctx.fill();
  ctx.fillStyle = P.iron; ctx.fillRect(x + 40, base - 46, w - 80, 34);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = '#0a0a0a'; ctx.fillRect(x + 46 + i * ((w - 92) / 5), base - 46, 3, 34); }
  if (lit) { ctx.fillStyle = '#c8501a'; ctx.fillRect(x + 50, base - 40, w - 100, 10); ctx.fillStyle = '#f2a040'; ctx.fillRect(x + 64, base - 38, 18, 5); ctx.fillRect(x + w - 90, base - 36, 14, 4); }
  ctx.fillStyle = '#5a4a2a'; ctx.fillRect(x + 20, base - 6, w - 40, 6);
  return lit ? { x: x + w / 2, y: base - 36 } : null;
}

export function bookcase(ctx, x, y, w, h, seed = 4) {
  const r = rng(seed);
  ctx.fillStyle = '#1e150e'; ctx.fillRect(x, y, w, h);
  const shelves = Math.max(2, Math.round(h / 70));
  for (let s = 0; s < shelves; s++) {
    const sy = y + (h / shelves) * (s + 1) - 6;
    ctx.fillStyle = '#2a1e14'; ctx.fillRect(x, sy, w, 6);
    let bx = x + 6;
    while (bx < x + w - 14) {
      const bw = r.range(7, 14), bh = r.range(h / shelves * 0.55, h / shelves * 0.85);
      ctx.fillStyle = r.pick(['#3a1a14', '#22301e', '#2a2430', '#4a3a20', '#30261c', '#1a2632']);
      if (r.chance(0.1)) { ctx.save(); ctx.translate(bx, sy); ctx.rotate(-0.25); ctx.fillRect(0, -bh, bw, bh); ctx.restore(); bx += bw + 8; continue; }
      ctx.fillRect(bx, sy - bh, bw, bh);
      ctx.fillStyle = 'rgba(200,170,100,0.25)'; ctx.fillRect(bx + 1, sy - bh + 6, bw - 2, 2);
      bx += bw + 1;
    }
  }
  ctx.fillStyle = 'rgba(255,230,200,0.06)'; ctx.fillRect(x, y, 3, h);
}

export function frame(ctx, x, y, w, h, { seed = 2, kind = 'portrait' } = {}) {
  ctx.fillStyle = '#4a3a1e'; ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  ctx.fillStyle = '#6a5428'; ctx.fillRect(x - 6, y - 6, w + 12, 3);
  A.vgrad(ctx, x, y, w, h, [[0, '#3a3a34'], [1, '#1a1a18']]);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  if (kind === 'portrait') { ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 0.4, w * 0.18, h * 0.16, 0, 0, TAU); ctx.fill(); ctx.fillRect(x + w * 0.25, y + h * 0.58, w * 0.5, h * 0.42); }
  else { ctx.fillRect(x, y + h * 0.65, w, h * 0.35); ctx.fillStyle = 'rgba(160,150,120,0.25)'; ctx.fillRect(x, y + h * 0.3, w, 4); }
  A.stain(ctx, x, y, w, h, { seed, alpha: 0.6 });
}
