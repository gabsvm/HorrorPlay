// Procedural painting toolkit. Everything here draws albedo (unlit) in logical coordinates;
// the renderer multiplies it by the lightmap so every surface shares the same light.
import { rng, noiseCanvas } from './noise.js';
import { P, shade, mix } from './palette.js';

const cache = new Map();
export function noiseTex(key, w, h, opts) {
  if (!cache.has(key)) cache.set(key, noiseCanvas(w, h, opts));
  return cache.get(key);
}

// Overlay a noise texture over a region with a blend mode (used for stains, damp, plaster).
export function stain(ctx, x, y, w, h, { seed = 1, alpha = 0.35, mode = 'multiply', scale = 6, tint = null } = {}) {
  const tex = noiseTex(`stain${seed}_${scale}`, 96, 96, { scale, seed, octaves: 5 });
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = mode;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(tex, x, y, w, h);
  if (tint) { ctx.globalCompositeOperation = 'color'; ctx.fillStyle = tint; ctx.fillRect(x, y, w, h); }
  ctx.restore();
}

export function vgrad(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

// ---------------------------------------------------------------- far layers
export function sky(ctx, w, h, { top = '#05070a', mid = '#0c1217', low = '#1a2a2e', glow = 'rgba(70,110,100,0.18)', glowY = 0.62, seed = 3 } = {}) {
  vgrad(ctx, 0, 0, w, h, [[0, top], [0.55, mid], [1, low]]);
  // smog clouds
  const clouds = noiseTex(`clouds${seed}`, 160, 60, { scale: 5, seed, octaves: 5, alpha: true, shape: (v, nx, ny) => (v - 0.46) * 2.4 * Math.sin(Math.PI * ny) });
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.globalCompositeOperation = 'screen';
  ctx.filter = 'blur(2px)';
  for (let x = 0; x < w; x += 1600) ctx.drawImage(clouds, x, -40, 1600, h * 0.7);
  ctx.restore();
  const g = ctx.createRadialGradient(w * 0.5, h * glowY, 10, w * 0.5, h * glowY, w * 0.6);
  g.addColorStop(0, glow); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

// A silhouette band of roofs, chimneys and the occasional spire.
export function skyline(ctx, { w, baseY, seed = 1, color = '#0e1418', minH = 60, maxH = 180, spire = null, chimneys = true, cranes = false }) {
  const r = rng(seed);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, baseY + 400);
  let x = -20;
  while (x < w + 40) {
    const bw = r.range(70, 190), bh = r.range(minH, maxH);
    const top = baseY - bh;
    const kind = r();
    ctx.lineTo(x, top);
    if (kind < 0.45) { // gable
      ctx.lineTo(x + bw / 2, top - r.range(18, 45)); ctx.lineTo(x + bw, top);
    } else if (kind < 0.7) { // mansard
      ctx.lineTo(x + 10, top - 22); ctx.lineTo(x + bw - 10, top - 22); ctx.lineTo(x + bw, top);
    } else { ctx.lineTo(x + bw, top); }
    if (chimneys && r.chance(0.7)) {
      const cx = x + r.range(10, bw - 30), ch = r.range(18, 40);
      ctx.lineTo(x + bw, top);
      ctx.moveTo(x + bw, top);
      ctx.fillRect(cx, top - ch - 20, r.range(10, 22), ch + 24);
      for (let k = 0; k < r.int(1, 3); k++) ctx.fillRect(cx + 2 + k * 6, top - ch - 28, 4, 10);
    }
    x += bw;
  }
  ctx.lineTo(w + 40, baseY + 400);
  ctx.closePath();
  ctx.fill();
  if (spire) drawSpire(ctx, spire.x, baseY, spire.h, color);
  if (cranes) {
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const cx = r.range(0, w), ch = r.range(160, 260);
      ctx.beginPath(); ctx.moveTo(cx, baseY); ctx.lineTo(cx, baseY - ch); ctx.lineTo(cx + r.range(80, 140), baseY - ch + 30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 110, baseY - ch + 22); ctx.lineTo(cx + 110, baseY - ch + 90); ctx.lineWidth = 1; ctx.stroke(); ctx.lineWidth = 3;
    }
  }
}

// Christ Church Spitalfields-like spire: the one landmark visible from everywhere.
export function drawSpire(ctx, x, baseY, h, color) {
  ctx.fillStyle = color;
  const w = 70;
  ctx.fillRect(x - w / 2, baseY - h * 0.45, w, h * 0.45 + 40);
  ctx.fillRect(x - w * 0.38, baseY - h * 0.62, w * 0.76, h * 0.2);
  ctx.fillRect(x - w * 0.28, baseY - h * 0.74, w * 0.56, h * 0.14);
  ctx.beginPath();
  ctx.moveTo(x - w * 0.24, baseY - h * 0.74);
  ctx.lineTo(x, baseY - h);
  ctx.lineTo(x + w * 0.24, baseY - h * 0.74);
  ctx.fill();
  // clock face (lit later as a faint light)
  ctx.fillStyle = shade('#1a2026', 1.3);
  ctx.beginPath(); ctx.arc(x, baseY - h * 0.53, 9, 0, Math.PI * 2); ctx.fill();
}

// ---------------------------------------------------------------- walls
export function brickWall(ctx, x, y, w, h, { seed = 1, bw = 26, bh = 9, palette = P.brick, mortar = P.mortar, soot = 0.5, damp = 0.5 } = {}) {
  const r = rng(seed);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = mortar;
  ctx.fillRect(x, y, w, h);
  for (let row = 0, yy = y; yy < y + h; row++, yy += bh) {
    const off = row % 2 ? -bw / 2 : 0;
    for (let xx = x + off; xx < x + w; xx += bw) {
      const base = r.pick(palette);
      ctx.fillStyle = shade(base, r.range(0.82, 1.12));
      ctx.fillRect(xx + 1, yy + 1, bw - 2, bh - 1.6);
      if (r.chance(0.05)) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(xx + 1, yy + 1, bw - 2, bh - 1.6); }
    }
  }
  stain(ctx, x, y, w, h, { seed: seed + 3, alpha: 0.55, scale: 5 });
  // soot heavier near the top, damp near the bottom
  vgrad(ctx, x, y, w, h * 0.45, [[0, `rgba(10,10,12,${0.55 * soot})`], [1, 'rgba(10,10,12,0)']]);
  vgrad(ctx, x, y + h * 0.7, w, h * 0.3, [[0, 'rgba(15,18,16,0)'], [1, `rgba(15,18,16,${0.7 * damp})`]]);
  streaks(ctx, x, y, w, h, seed + 9, 0.18);
  ctx.restore();
}

export function plasterWall(ctx, x, y, w, h, { seed = 2, color = P.plaster, peel = 0.4 } = {}) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
  stain(ctx, x, y, w, h, { seed, alpha: 0.7, scale: 4 });
  stain(ctx, x, y, w, h, { seed: seed + 1, alpha: 0.35, scale: 14 });
  // peeled patches show brick beneath
  const r = rng(seed + 5);
  for (let i = 0; i < Math.round(peel * w / 60); i++) {
    const px = x + r.range(0, w), py = y + r.range(h * 0.2, h), pw = r.range(20, 70), ph = r.range(10, 34);
    ctx.save();
    ctx.beginPath(); ctx.ellipse(px, py, pw / 2, ph / 2, r.range(-0.3, 0.3), 0, Math.PI * 2); ctx.clip();
    brickWall(ctx, px - pw, py - ph, pw * 2, ph * 2, { seed: seed + i, soot: 0.2 });
    ctx.restore();
  }
  vgrad(ctx, x, y + h * 0.6, w, h * 0.4, [[0, 'rgba(20,22,18,0)'], [1, 'rgba(20,22,18,0.55)']]);
  streaks(ctx, x, y, w, h, seed + 2, 0.22);
  ctx.restore();
}

export function streaks(ctx, x, y, w, h, seed, alpha) {
  const r = rng(seed);
  for (let i = 0; i < w / 14; i++) {
    const sx = x + r.range(0, w), sw = r.range(2, 9), sh = r.range(h * 0.1, h * 0.6), sy = y + r.range(0, h * 0.5);
    const g = ctx.createLinearGradient(0, sy, 0, sy + sh);
    g.addColorStop(0, `rgba(8,8,8,${alpha * r.range(0.4, 1)})`);
    g.addColorStop(1, 'rgba(8,8,8,0)');
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, sw, sh);
  }
}

// ---------------------------------------------------------------- openings
// Returns {x, y} centre for lit windows so the scene can register a light.
export function windowFrame(ctx, x, y, w, h, { lit = false, warm = '#e0a35a', broken = false, curtain = false, arch = false, bars = false, panes = 2, seed = 4, sill = true, board = false } = {}) {
  const r = rng(seed);
  // reveal / shadowed recess
  ctx.fillStyle = '#141414';
  roundTopRect(ctx, x - 5, y - 5, w + 10, h + 10, arch ? (w + 10) / 2 : 0); ctx.fill();
  // glass
  if (lit) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, shade(warm.replace('#', '#'), 0.9)); g.addColorStop(1, warm);
    ctx.fillStyle = g;
  } else {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#2a353a'); g.addColorStop(0.5, P.glassDark); g.addColorStop(1, '#0e1316');
    ctx.fillStyle = g;
  }
  roundTopRect(ctx, x, y, w, h, arch ? w / 2 : 0); ctx.fill();
  if (curtain) {
    ctx.fillStyle = lit ? 'rgba(120,40,20,0.55)' : 'rgba(40,30,28,0.9)';
    ctx.fillRect(x, y, w * 0.32, h); ctx.fillRect(x + w * 0.7, y, w * 0.3, h);
  }
  if (board) {
    ctx.fillStyle = P.woodDark;
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.translate(x + w / 2, y + h * (0.25 + i * 0.27)); ctx.rotate(r.range(-0.18, 0.18));
      ctx.fillRect(-w * 0.62, -6, w * 1.24, 12); ctx.restore();
    }
  }
  // mullions
  ctx.fillStyle = '#1c1916';
  ctx.fillRect(x + w / 2 - 2, y, 4, h);
  for (let i = 1; i < panes + 1; i++) ctx.fillRect(x, y + (h / (panes + 1)) * i - 1.5, w, 3);
  if (broken) {
    ctx.strokeStyle = 'rgba(200,210,210,0.35)'; ctx.lineWidth = 1;
    const cx = x + r.range(w * 0.2, w * 0.8), cy = y + r.range(h * 0.2, h * 0.6);
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r.range(-w, w) * 0.5, cy + r.range(-h, h) * 0.5); ctx.stroke(); }
    ctx.fillStyle = '#060606';
    ctx.beginPath(); ctx.moveTo(cx - 8, cy - 6); ctx.lineTo(cx + 10, cy - 2); ctx.lineTo(cx + 2, cy + 12); ctx.closePath(); ctx.fill();
  }
  if (bars) {
    ctx.fillStyle = P.iron;
    for (let i = 1; i < 5; i++) ctx.fillRect(x + (w / 5) * i - 1.5, y - 4, 3, h + 8);
  }
  if (sill) {
    ctx.fillStyle = P.stone; ctx.fillRect(x - 9, y + h + 4, w + 18, 7);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x - 9, y + h + 10, w + 18, 4);
  }
  // lintel
  if (!arch) { ctx.fillStyle = P.stoneDark; ctx.fillRect(x - 8, y - 14, w + 16, 9); }
  return lit ? { x: x + w / 2, y: y + h / 2 } : null;
}

export function door(ctx, x, y, w, h, { color = P.woodDark, arch = false, open = 0, knocker = true, steps = 1 } = {}) {
  ctx.fillStyle = '#0d0d0d';
  roundTopRect(ctx, x - 6, y - 6, w + 12, h + 6, arch ? (w + 12) / 2 : 0); ctx.fill();
  ctx.fillStyle = color;
  roundTopRect(ctx, x, y, w, h, arch ? w / 2 : 0); ctx.fill();
  if (open > 0) { ctx.fillStyle = '#030303'; ctx.fillRect(x, y + (arch ? w / 2 : 0), w * open, h - (arch ? w / 2 : 0)); }
  // panels
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
  const top = y + (arch ? w / 2 : 8);
  ctx.strokeRect(x + 7, top + 4, w / 2 - 11, (h - (top - y)) * 0.42);
  ctx.strokeRect(x + w / 2 + 4, top + 4, w / 2 - 11, (h - (top - y)) * 0.42);
  ctx.strokeRect(x + 7, top + (h - (top - y)) * 0.5, w / 2 - 11, (h - (top - y)) * 0.42);
  ctx.strokeRect(x + w / 2 + 4, top + (h - (top - y)) * 0.5, w / 2 - 11, (h - (top - y)) * 0.42);
  if (knocker) { ctx.fillStyle = '#5a4a2a'; ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.45, 4, 0, Math.PI * 2); ctx.fill(); }
  for (let s = 0; s < steps; s++) { ctx.fillStyle = shade(P.stone, 0.9 - s * 0.1); ctx.fillRect(x - 10 - s * 6, y + h + s * 8, w + 20 + s * 12, 8); }
}

export function roundTopRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (r > 0) {
    ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.arc(x + w / 2, y + r, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath();
  } else ctx.rect(x, y, w, h);
}

export function drainpipe(ctx, x, y, h) {
  ctx.fillStyle = '#1b1d1f'; ctx.fillRect(x, y, 7, h);
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x + 1, y, 2, h);
  for (let yy = y + 40; yy < y + h; yy += 80) { ctx.fillStyle = '#121314'; ctx.fillRect(x - 2, yy, 11, 5); }
  ctx.fillStyle = '#1b1d1f'; ctx.fillRect(x - 4, y + h - 10, 16, 10);
}

export function streetSign(ctx, x, y, text, { w = null } = {}) {
  ctx.font = '600 15px "IM Fell English SC", Georgia, serif';
  const tw = w || ctx.measureText(text).width + 26;
  ctx.fillStyle = '#121418'; ctx.fillRect(x - 2, y - 2, tw + 4, 28);
  ctx.fillStyle = '#d8d2c0'; ctx.fillRect(x, y, tw, 24);
  ctx.fillStyle = '#1a1a1a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x + tw / 2, y + 13);
  stain(ctx, x, y, tw, 24, { seed: 31, alpha: 0.5 });
}

export function poster(ctx, x, y, w, h, lines, { seed = 7, tilt = 0, color = '#b9aa86' } = {}) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2); ctx.rotate(tilt);
  ctx.fillStyle = color; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = '#231c14'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  let yy = -h / 2 + 8;
  for (const [txt, size] of lines) { ctx.font = `${size}px "IM Fell English SC", Georgia, serif`; ctx.fillText(txt, 0, yy); yy += size + 3; }
  stain(ctx, -w / 2, -h / 2, w, h, { seed, alpha: 0.6 });
  // torn corner
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.lineTo(w / 2 - 18, h / 2); ctx.lineTo(w / 2, h / 2 - 22); ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- ground
export function cobbles(ctx, x, y, w, h, { seed = 5, color = P.cobble, rows = 14, puddles = 6, wet = 0.6 } = {}) {
  const r = rng(seed);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  vgrad(ctx, x, y, w, h, [[0, shade(P.cobbleDark, 0.7)], [1, shade(P.cobbleDark, 1.0)]]);
  let yy = y;
  for (let row = 0; row < rows; row++) {
    const t = row / (rows - 1);
    const rh = 4 + t * t * 18;
    const sw = rh * 1.7;
    for (let xx = x - (row % 2) * sw / 2; xx < x + w; xx += sw) {
      ctx.fillStyle = shade(color, r.range(0.7, 1.15) * (0.75 + t * 0.35));
      ctx.beginPath();
      ctx.ellipse(xx + sw / 2, yy + rh / 2, sw / 2 - 1, rh / 2 - 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      // wet highlight on top of each stone
      ctx.fillStyle = `rgba(190,210,215,${0.05 + wet * 0.07 * r()})`;
      ctx.beginPath(); ctx.ellipse(xx + sw / 2, yy + rh * 0.32, sw * 0.3, rh * 0.15, 0, 0, Math.PI * 2); ctx.fill();
    }
    yy += rh;
    if (yy > y + h) break;
  }
  stain(ctx, x, y, w, h, { seed: seed + 2, alpha: 0.45, scale: 9 });
  // puddles: dark mirror patches (lights reflect into them in the glow pass)
  for (let i = 0; i < puddles; i++) {
    const px = x + r.range(0, w), py = y + r.range(h * 0.25, h * 0.9), pw = r.range(60, 180), ph = r.range(6, 16);
    const g = ctx.createRadialGradient(px, py, 2, px, py, pw / 2);
    g.addColorStop(0, 'rgba(12,18,20,0.85)'); g.addColorStop(1, 'rgba(12,18,20,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(px, py, pw / 2, ph, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function kerb(ctx, x, y, w) {
  ctx.fillStyle = P.stone; ctx.fillRect(x, y, w, 7);
  ctx.fillStyle = shade(P.stoneDark, 0.8); ctx.fillRect(x, y + 7, w, 6);
  for (let xx = x; xx < x + w; xx += 64) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(xx, y, 2, 13); }
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y + 13, w, 5);
}

export function flagstones(ctx, x, y, w, h, { seed = 9 } = {}) {
  const r = rng(seed);
  ctx.fillStyle = P.stoneDark; ctx.fillRect(x, y, w, h);
  for (let xx = x; xx < x + w; xx += r.range(50, 80)) {
    ctx.fillStyle = shade(P.stone, r.range(0.7, 0.95));
    ctx.fillRect(xx + 1, y + 1, 60, h - 2);
  }
  stain(ctx, x, y, w, h, { seed, alpha: 0.5 });
}

// ---------------------------------------------------------------- props
// Returns the world position of the flame so the scene can register the gas light.
export function lampPost(ctx, x, groundY, h = 250, { bracket = false } = {}) {
  ctx.fillStyle = P.iron;
  if (!bracket) {
    ctx.fillRect(x - 9, groundY - 26, 18, 26);
    ctx.fillRect(x - 6, groundY - 40, 12, 14);
    ctx.fillRect(x - 3.5, groundY - h + 30, 7, h - 66);
    ctx.fillRect(x - 6, groundY - h + 54, 12, 6);
    // ladder bar
    ctx.fillRect(x - 22, groundY - h + 46, 44, 3);
  }
  const ly = groundY - h;
  // lantern cage
  ctx.beginPath();
  ctx.moveTo(x - 14, ly + 6); ctx.lineTo(x + 14, ly + 6); ctx.lineTo(x + 9, ly + 34); ctx.lineTo(x - 9, ly + 34); ctx.closePath();
  ctx.fillStyle = '#e7b56a'; ctx.fill();
  ctx.strokeStyle = P.iron; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, ly + 6); ctx.lineTo(x, ly + 34); ctx.stroke();
  ctx.fillStyle = P.iron;
  ctx.beginPath(); ctx.moveTo(x - 18, ly + 7); ctx.lineTo(x, ly - 8); ctx.lineTo(x + 18, ly + 7); ctx.fill();
  ctx.fillRect(x - 2, ly - 16, 4, 9);
  ctx.fillRect(x - 10, ly + 33, 20, 4);
  return { x, y: ly + 20 };
}

export function railing(ctx, x, y, w, h, { gap = 12 } = {}) {
  ctx.fillStyle = P.iron;
  ctx.fillRect(x, y, w, 4); ctx.fillRect(x, y + h - 6, w, 4);
  for (let xx = x; xx < x + w; xx += gap) {
    ctx.fillRect(xx, y - 8, 3, h + 8);
    ctx.beginPath(); ctx.moveTo(xx - 3, y - 8); ctx.lineTo(xx + 1.5, y - 18); ctx.lineTo(xx + 6, y - 8); ctx.fill();
  }
}

export function crate(ctx, x, y, w, h, seed = 1) {
  const r = rng(seed);
  ctx.fillStyle = shade(P.wood, r.range(0.8, 1.1)); ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
  for (let yy = y + h / 4; yy < y + h; yy += h / 4) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); }
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.stroke();
  stain(ctx, x, y, w, h, { seed, alpha: 0.4 });
}

export function barrel(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, shade(P.wood, 0.55)); g.addColorStop(0.45, shade(P.wood, 1.1)); g.addColorStop(1, shade(P.wood, 0.5));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.rect(x + 2, y + 6, w - 4, h - 12); ctx.fill();
  ctx.fillStyle = P.iron;
  ctx.fillRect(x + 1, y + h * 0.18, w - 2, 4); ctx.fillRect(x + 1, y + h * 0.78, w - 2, 4);
}

export function cart(ctx, x, groundY, { flip = false } = {}) {
  ctx.save();
  if (flip) { ctx.translate(x * 2 + 220, 0); ctx.scale(-1, 1); }
  ctx.fillStyle = P.woodDark;
  ctx.fillRect(x, groundY - 92, 200, 34);
  ctx.fillRect(x + 196, groundY - 86, 110, 6); // shafts tilted to ground
  ctx.save(); ctx.translate(x + 196, groundY - 84); ctx.rotate(0.38); ctx.fillRect(0, 0, 130, 6); ctx.restore();
  ctx.strokeStyle = P.woodDark; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(x + 70, groundY - 46, 44, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 4;
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.2; ctx.beginPath(); ctx.moveTo(x + 70, groundY - 46); ctx.lineTo(x + 70 + Math.cos(a) * 44, groundY - 46 + Math.sin(a) * 44); ctx.stroke(); }
  ctx.fillStyle = '#1a140f'; ctx.beginPath(); ctx.arc(x + 70, groundY - 46, 8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function gate(ctx, x, y, w, h, { open = false } = {}) {
  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(x, y, w, h);
  if (!open) {
    for (let xx = x; xx < x + w; xx += 16) { ctx.fillStyle = shade(P.woodDark, 0.8 + ((xx / 16) % 3) * 0.1); ctx.fillRect(xx + 1, y, 14, h); }
    ctx.fillStyle = P.iron; ctx.fillRect(x, y + h * 0.2, w, 6); ctx.fillRect(x, y + h * 0.75, w, 6);
    ctx.fillRect(x + w / 2 - 1, y, 2, h);
    stain(ctx, x, y, w, h, { seed: 41, alpha: 0.5 });
  }
}

export function chalk(ctx, x, y, text, { size = 18, rot = -0.03 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.font = `italic ${size}px "IM Fell English", Georgia, serif`;
  ctx.fillStyle = 'rgba(220,220,210,0.78)'; ctx.textBaseline = 'top';
  text.split('\n').forEach((line, i) => ctx.fillText(line, 0, i * (size + 4)));
  ctx.restore();
}

export { mix };
