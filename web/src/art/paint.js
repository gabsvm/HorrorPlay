// Procedural painting toolkit. Everything here draws albedo (unlit) at full logical resolution;
// the renderer reduces it to the pixel grid, snaps it to the palette and lights it in one pass.
// Details are sized for that reduction: nothing meaningful is thinner than two logical pixels.
import { drawProp, drawPropIn } from './models.js';
import { rng, noiseCanvas } from './noise.js';
import { P, shade, mix } from './palette.js';

const TAU = Math.PI * 2;
const cache = new Map();

// While a scene is being built, things that should swing in the wind (hanging signs, the pawnbroker's
// balls) leave only their iron bracket in the painting and are collected here, to be drawn live.
export const live = { on: false, list: [] };
export function noiseTex(key, w, h, opts) {
  if (!cache.has(key)) cache.set(key, noiseCanvas(w, h, opts));
  return cache.get(key);
}

// Overlay a noise texture over a region with a blend mode (stains, damp, soot).
export function stain(ctx, x, y, w, h, { seed = 1, alpha = 0.35, mode = 'multiply', scale = 6, tint = null } = {}) {
  if (w <= 0 || h <= 0) return;
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

// A copy of an alpha texture filled with one colour (cached).
export function tinted(tex, color) {
  if (!tex._tints) tex._tints = new Map();
  if (tex._tints.has(color)) return tex._tints.get(color);
  const c = document.createElement('canvas');
  c.width = tex.width; c.height = tex.height;
  const x = c.getContext('2d');
  x.drawImage(tex, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  tex._tints.set(color, c);
  return c;
}

// Fine grit: pixel-sized flecks that survive the reduction and give surfaces texture.
export function grit(ctx, x, y, w, h, { seed = 1, density = 1, dark = 0.22, light = 0.1 } = {}) {
  const r = rng(seed * 31 + 7);
  const n = Math.round((w * h) / 140 * density);
  for (let i = 0; i < n; i++) {
    const px = x + r() * w, py = y + r() * h;
    ctx.fillStyle = r() < 0.65 ? `rgba(0,0,0,${dark * r.range(0.4, 1)})` : `rgba(255,240,220,${light * r.range(0.4, 1)})`;
    ctx.fillRect(px, py, r.chance(0.3) ? 4 : 2, 2);
  }
}

export function vgrad(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

export function hgrad(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

// ---------------------------------------------------------------- sky and distance
export function sky(ctx, w, h, { top = '#05070a', mid = '#0c1217', low = '#1a2a2e', glow = 'rgba(70,110,100,0.18)', glowY = 0.62, seed = 3, moon = null, stars = 0, rim = '#5d6e70' } = {}) {
  vgrad(ctx, 0, 0, w, h, [[0, top], [0.55, mid], [1, low]]);
  const r = rng(seed + 5);
  for (let i = 0; i < stars; i++) { ctx.fillStyle = `rgba(220,230,235,${r.range(0.25, 0.7)})`; ctx.fillRect(r.range(0, w), r.range(0, h * 0.35), 2, 2); }
  if (moon) {
    const g = ctx.createRadialGradient(moon.x, moon.y, 2, moon.x, moon.y, 160);
    g.addColorStop(0, 'rgba(210,220,215,0.5)'); g.addColorStop(0.15, 'rgba(170,190,190,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(moon.x - 160, moon.y - 160, 320, 320);
    ctx.fillStyle = '#c9d2cc'; ctx.beginPath(); ctx.arc(moon.x, moon.y, 22, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(120,130,125,0.5)'; ctx.beginPath(); ctx.arc(moon.x - 6, moon.y - 4, 6, 0, TAU); ctx.arc(moon.x + 8, moon.y + 6, 4, 0, TAU); ctx.fill();
  }
  // smog cloud banks: a dark body with a paler, moonlit edge offset above it
  const clouds = noiseTex(`clouds${seed}`, 200, 70, { scale: 6, seed, octaves: 5, alpha: true, shape: (v, nx, ny) => (v - 0.44) * 2.6 * Math.sin(Math.PI * ny) });
  const dark = tinted(clouds, mix(top, mid, 0.5)), pale = tinted(clouds, rim);
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (let x = -200; x < w; x += 1500) ctx.drawImage(pale, x, -30, 1500, h * 0.62);
  ctx.globalAlpha = 0.92;
  for (let x = -200; x < w; x += 1500) ctx.drawImage(dark, x, -22, 1500, h * 0.62);
  ctx.restore();
  const g = ctx.createRadialGradient(w * 0.5, h * glowY, 10, w * 0.5, h * glowY, w * 0.6);
  g.addColorStop(0, glow); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

// A silhouette band of roofs, chimneys, dormers, and landmarks.
export function skyline(ctx, { w, baseY, seed = 1, color = '#0e1418', minH = 60, maxH = 180, spire = null, dome = null, gasometer = null, chimneys = true, cranes = false }) {
  const r = rng(seed);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  let x = -20;
  while (x < w + 40) {
    const bw = r.range(70, 190), bh = r.range(minH, maxH);
    const top = baseY - bh;
    const kind = r();
    ctx.beginPath();
    ctx.moveTo(x, baseY + 400);
    ctx.lineTo(x, top);
    if (kind < 0.4) { ctx.lineTo(x + bw / 2, top - r.range(18, 48)); ctx.lineTo(x + bw, top); }
    else if (kind < 0.65) { ctx.lineTo(x + 10, top - 24); ctx.lineTo(x + bw - 10, top - 24); ctx.lineTo(x + bw, top); }
    else ctx.lineTo(x + bw, top);
    ctx.lineTo(x + bw, baseY + 400);
    ctx.closePath(); ctx.fill();
    if (kind >= 0.4 && kind < 0.65 && r.chance(0.6)) { // dormer
      const dx = x + r.range(16, bw - 40);
      ctx.fillRect(dx, top - 40, 22, 18);
      ctx.beginPath(); ctx.moveTo(dx - 3, top - 40); ctx.lineTo(dx + 11, top - 50); ctx.lineTo(dx + 25, top - 40); ctx.fill();
    }
    if (chimneys && r.chance(0.75)) {
      const cx = x + r.range(10, bw - 34), ch = r.range(20, 44), cw = r.range(14, 30);
      ctx.fillRect(cx, top - ch - 20, cw, ch + 24);
      ctx.fillRect(cx - 2, top - ch - 22, cw + 4, 4);
      const pots = Math.max(1, Math.floor(cw / 8));
      for (let k = 0; k < pots; k++) ctx.fillRect(cx + 2 + k * 8, top - ch - 32, 5, 11);
    }
    x += bw;
  }
  if (spire) drawSpire(ctx, spire.x, baseY, spire.h, color);
  if (dome) drawDome(ctx, dome.x, baseY, dome.h, color);
  if (gasometer) drawGasometer(ctx, gasometer.x, baseY, gasometer.w || 180, gasometer.h || 130, color);
  if (cranes) {
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const cx = r.range(0, w), ch = r.range(160, 260), jib = r.range(80, 140);
      ctx.beginPath(); ctx.moveTo(cx, baseY); ctx.lineTo(cx, baseY - ch); ctx.lineTo(cx + jib, baseY - ch + 30); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, baseY - ch); ctx.lineTo(cx + jib * 0.6, baseY - ch + 60); ctx.moveTo(cx + jib - 10, baseY - ch + 26); ctx.lineTo(cx + jib - 10, baseY - ch + 96); ctx.stroke(); ctx.lineWidth = 3;
      ctx.fillRect(cx + jib - 16, baseY - ch + 94, 12, 8);
    }
  }
}

// Christ Church Spitalfields: the landmark visible from everywhere in the East End.
export function drawSpire(ctx, x, baseY, h, color) {
  ctx.fillStyle = color;
  const w = 74;
  ctx.fillRect(x - w / 2, baseY - h * 0.45, w, h * 0.45 + 40);
  ctx.fillRect(x - w * 0.42, baseY - h * 0.6, w * 0.84, h * 0.17);
  ctx.fillRect(x - w * 0.3, baseY - h * 0.73, w * 0.6, h * 0.14);
  for (const s of [-1, 1]) { ctx.fillRect(x + s * w * 0.42 - 3, baseY - h * 0.66, 6, 14); ctx.fillRect(x + s * w * 0.3 - 3, baseY - h * 0.78, 6, 12); }
  ctx.beginPath(); ctx.moveTo(x - w * 0.24, baseY - h * 0.73); ctx.lineTo(x, baseY - h); ctx.lineTo(x + w * 0.24, baseY - h * 0.73); ctx.fill();
  ctx.fillRect(x - 1.5, baseY - h - 16, 3, 18);
  // louvres and clock face
  ctx.fillStyle = shade(color, 0.55);
  for (let i = 0; i < 3; i++) ctx.fillRect(x - 12 + i * 10, baseY - h * 0.68, 5, 16);
  ctx.fillStyle = shade(color, 1.6);
  ctx.beginPath(); ctx.arc(x, baseY - h * 0.53, 10, 0, TAU); ctx.fill();
  ctx.fillStyle = shade(color, 0.6); ctx.fillRect(x - 1, baseY - h * 0.53 - 7, 2, 7); ctx.fillRect(x, baseY - h * 0.53 - 1, 6, 2);
}

// St Paul's, far to the west, rising out of the smoke.
export function drawDome(ctx, x, baseY, h, color) {
  ctx.fillStyle = color;
  const w = h * 0.62;
  ctx.fillRect(x - w * 0.6, baseY - h * 0.3, w * 1.2, h * 0.3 + 30);
  ctx.fillRect(x - w * 0.42, baseY - h * 0.48, w * 0.84, h * 0.2);
  ctx.beginPath(); ctx.ellipse(x, baseY - h * 0.48, w * 0.4, h * 0.3, 0, Math.PI, 0); ctx.fill();
  ctx.fillRect(x - 6, baseY - h * 0.86, 12, h * 0.1);
  ctx.beginPath(); ctx.arc(x, baseY - h * 0.87, 6, 0, TAU); ctx.fill();
  ctx.fillRect(x - 1.5, baseY - h * 0.97, 3, h * 0.1); ctx.fillRect(x - 5, baseY - h * 0.94, 10, 2);
  ctx.fillStyle = shade(color, 0.6);
  for (let i = -3; i <= 3; i++) ctx.fillRect(x + i * w * 0.11 - 2, baseY - h * 0.46, 4, h * 0.15);
}

// Victorian gasholder: an iron lattice guide frame around a drum.
export function drawGasometer(ctx, x, baseY, w, h, color) {
  ctx.fillStyle = shade(color, 0.85);
  ctx.fillRect(x + 8, baseY - h * 0.7, w - 16, h * 0.7 + 20);
  ctx.beginPath(); ctx.ellipse(x + w / 2, baseY - h * 0.7, (w - 16) / 2, 8, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  for (let i = 0; i <= 6; i++) { const cx = x + (w / 6) * i; ctx.beginPath(); ctx.moveTo(cx, baseY); ctx.lineTo(cx, baseY - h); ctx.stroke(); }
  ctx.lineWidth = 2;
  for (const yy of [0.33, 0.66, 1]) { ctx.beginPath(); ctx.moveTo(x, baseY - h * yy); ctx.lineTo(x + w, baseY - h * yy); ctx.stroke(); }
  for (let i = 0; i < 6; i++) { const cx = x + (w / 6) * i; ctx.beginPath(); ctx.moveTo(cx, baseY - h * 0.33); ctx.lineTo(cx + w / 6, baseY - h * 0.66); ctx.moveTo(cx + w / 6, baseY - h * 0.33); ctx.lineTo(cx, baseY - h * 0.66); ctx.stroke(); }
}

// ---------------------------------------------------------------- walls
const STOCK = ['#4a4236', '#3f382e', '#554a3a', '#38322a', '#5a4c3a', '#2e2a24'];  // London stock, soot-blackened
export const BRICK = { red: P.brick, stock: STOCK };

export function brickWall(ctx, x, y, w, h, { seed = 1, bw = 26, bh = 9, palette = P.brick, mortar = P.mortar, soot = 0.5, damp = 0.5, salt = 0.4, patches = 2, holes = 3 } = {}) {
  if (w <= 0 || h <= 0) return;
  const r = rng(seed);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = shade(mortar, 0.8);
  ctx.fillRect(x, y, w, h);
  // Flemish bond: stretchers and darker burnt headers alternate along each course
  for (let row = 0, yy = y; yy < y + h; row++, yy += bh) {
    let xx = x - (row % 2 ? bw * 0.75 : 0);
    let header = row % 2 === 0;
    while (xx < x + w) {
      const len = header ? bw / 2 : bw;
      const base = header ? shade(r.pick(palette), 0.72) : r.pick(palette);
      ctx.fillStyle = shade(base, r.range(0.84, 1.12));
      ctx.fillRect(xx + 1, yy + 1, len - 2, bh - 2);
      // top-edge catchlight and a worn corner now and then
      ctx.fillStyle = 'rgba(255,230,200,0.07)'; ctx.fillRect(xx + 1, yy + 1, len - 2, 1.5);
      if (r.chance(0.08)) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(xx + len - 6, yy + bh - 4, 4, 3); }
      xx += len; header = !header;
    }
  }
  // repointed patches and missing bricks
  for (let i = 0; i < patches; i++) {
    const px = x + r.range(0, w - 60), py = y + r.range(0, h - 40);
    ctx.fillStyle = 'rgba(120,110,95,0.22)'; ctx.fillRect(px, py, r.range(30, 70), r.range(18, 40));
  }
  for (let i = 0; i < holes; i++) {
    const px = x + Math.floor(r.range(0, w) / bw) * bw, py = y + Math.floor(r.range(h * 0.3, h) / bh) * bh;
    ctx.fillStyle = '#0b0908'; ctx.fillRect(px + 1, py + 1, bw - 2, bh - 2);
  }
  stain(ctx, x, y, w, h, { seed: seed + 3, alpha: 0.5, scale: 5 });
  vgrad(ctx, x, y, w, h * 0.5, [[0, `rgba(8,8,10,${0.6 * soot})`], [1, 'rgba(8,8,10,0)']]);
  vgrad(ctx, x, y + h * 0.72, w, h * 0.28, [[0, 'rgba(20,26,16,0)'], [1, `rgba(20,26,16,${0.75 * damp})`]]);
  // saltpetre blooms near the damp line
  if (salt > 0) {
    for (let i = 0; i < w / 120 * salt * 3; i++) {
      const sx = x + r.range(0, w), sy = y + h * r.range(0.62, 0.86);
      const g = ctx.createRadialGradient(sx, sy, 1, sx, sy, r.range(14, 30));
      g.addColorStop(0, 'rgba(210,205,190,0.28)'); g.addColorStop(1, 'rgba(210,205,190,0)');
      ctx.fillStyle = g; ctx.fillRect(sx - 30, sy - 30, 60, 60);
    }
  }
  // moss at the foot of the wall
  ctx.fillStyle = 'rgba(40,58,30,0.55)';
  for (let i = 0; i < w / 18; i++) { const mx = x + r.range(0, w); ctx.fillRect(mx, y + h - r.range(2, 12), r.range(4, 14), 12); }
  streaks(ctx, x, y, w, h, seed + 9, 0.2);
  grit(ctx, x, y, w, h, { seed, density: 0.6 });
  ctx.restore();
}

export function plasterWall(ctx, x, y, w, h, { seed = 2, color = P.plaster, peel = 0.4, cracks = 3 } = {}) {
  if (w <= 0 || h <= 0) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
  stain(ctx, x, y, w, h, { seed, alpha: 0.7, scale: 4 });
  stain(ctx, x, y, w, h, { seed: seed + 1, alpha: 0.35, scale: 14 });
  const r = rng(seed + 5);
  for (let i = 0; i < Math.round(peel * w / 60); i++) {
    const px = x + r.range(0, w), py = y + r.range(h * 0.2, h), pw = r.range(20, 70), ph = r.range(10, 34);
    ctx.save();
    ctx.beginPath(); ctx.ellipse(px, py, pw / 2, ph / 2, r.range(-0.3, 0.3), 0, TAU); ctx.clip();
    brickWall(ctx, px - pw, py - ph, pw * 2, ph * 2, { seed: seed + i, soot: 0.2, salt: 0, patches: 0, holes: 0 });
    ctx.restore();
    ctx.strokeStyle = 'rgba(230,220,200,0.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(px, py, pw / 2, ph / 2, 0, -2.6, -0.4); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(10,8,6,0.55)'; ctx.lineWidth = 2;
  for (let i = 0; i < cracks; i++) {
    let cx = x + r.range(0, w), cy = y + r.range(0, h * 0.5);
    ctx.beginPath(); ctx.moveTo(cx, cy);
    for (let k = 0; k < 7; k++) { cx += r.range(-14, 14); cy += r.range(8, 22); ctx.lineTo(cx, cy); }
    ctx.stroke();
  }
  vgrad(ctx, x, y + h * 0.6, w, h * 0.4, [[0, 'rgba(20,22,18,0)'], [1, 'rgba(20,22,18,0.55)']]);
  streaks(ctx, x, y, w, h, seed + 2, 0.24);
  grit(ctx, x, y, w, h, { seed: seed + 9, density: 0.8 });
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

// Old advertising painted straight onto the brick, half washed away.
export function ghostSign(ctx, x, y, lines, { seed = 3, alpha = 0.32, color = '#d8ccb0' } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  let yy = y;
  for (const [text, size] of lines) { ctx.font = `600 ${size}px "IM Fell English SC", Georgia, serif`; ctx.fillText(text, x, yy); yy += size * 1.12; }
  ctx.restore();
  stain(ctx, x - 10, y - 6, 420, yy - y + 12, { seed, alpha: 0.5 });
}

// ---------------------------------------------------------------- openings
export function roundTopRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (r > 0) { ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.arc(x + w / 2, y + r, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath(); }
  else ctx.rect(x, y, w, h);
}

// Sash window with stone dressings. Returns its centre when lit so the scene can add a light.
export function windowFrame(ctx, x, y, w, h, { lit = false, warm = '#e0a33c', broken = false, curtain = false, arch = false, bars = false, panes = 2, seed = 4, sill = true, board = false, figure = false, net = false, frame = '#b5aa92' } = {}) {
  const r = rng(seed);
  const rad = arch ? w / 2 : 0;
  // stone reveal, recess shadow
  ctx.fillStyle = '#2a2724'; roundTopRect(ctx, x - 7, y - 7, w + 14, h + 14, arch ? (w + 14) / 2 : 0); ctx.fill();
  ctx.fillStyle = '#0f0e0d'; roundTopRect(ctx, x - 3, y - 3, w + 6, h + 6, arch ? (w + 6) / 2 : 0); ctx.fill();
  // glass
  ctx.save();
  roundTopRect(ctx, x, y, w, h, rad); ctx.clip();
  if (lit) {
    vgrad(ctx, x, y, w, h, [[0, shade(warm, 0.75)], [0.6, warm], [1, shade(warm, 0.85)]]);
    if (net) { ctx.fillStyle = 'rgba(255,240,210,0.25)'; for (let yy = y; yy < y + h; yy += 4) ctx.fillRect(x, yy, w, 1.5); }
    if (figure) {
      ctx.fillStyle = 'rgba(40,18,8,0.7)';
      const fx = x + w * r.range(0.35, 0.65);
      ctx.beginPath(); ctx.ellipse(fx, y + h * 0.42, w * 0.12, h * 0.13, 0, 0, TAU); ctx.fill();
      ctx.fillRect(fx - w * 0.22, y + h * 0.52, w * 0.44, h * 0.5);
    }
  } else {
    vgrad(ctx, x, y, w, h, [[0, '#2c383d'], [0.45, P.glassDark], [1, '#0a0e10']]);
    // a diagonal sky reflection and grime in the corners
    ctx.fillStyle = 'rgba(150,175,180,0.14)';
    ctx.beginPath(); ctx.moveTo(x + w * 0.1, y); ctx.lineTo(x + w * 0.45, y); ctx.lineTo(x + w * 0.05, y + h * 0.6); ctx.lineTo(x, y + h * 0.4); ctx.fill();
  }
  if (curtain) {
    ctx.fillStyle = lit ? 'rgba(110,34,18,0.7)' : 'rgba(36,26,24,0.92)';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * 0.34, y); ctx.quadraticCurveTo(x + w * 0.2, y + h * 0.6, x + w * 0.1, y + h); ctx.lineTo(x, y + h); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w * 0.68, y); ctx.quadraticCurveTo(x + w * 0.8, y + h * 0.6, x + w * 0.9, y + h); ctx.lineTo(x + w, y + h); ctx.fill();
  }
  stain(ctx, x, y + h * 0.5, w, h * 0.5, { seed: seed + 2, alpha: 0.35 });
  ctx.restore();
  // sash bars: painted, dirty
  ctx.fillStyle = shade(frame, lit ? 0.7 : 0.45);
  ctx.fillRect(x - 2, y + h / 2 - 3, w + 4, 6);           // meeting rail
  ctx.fillRect(x + w / 3 - 1.5, y, 3, h); ctx.fillRect(x + (2 * w) / 3 - 1.5, y, 3, h);
  for (let i = 1; i <= panes; i++) { const yy = y + (h / (panes + 1)) * i; if (Math.abs(yy - (y + h / 2)) > 6) ctx.fillRect(x, yy - 1.5, w, 3); }
  ctx.strokeStyle = shade(frame, lit ? 0.75 : 0.5); ctx.lineWidth = 3;
  roundTopRect(ctx, x, y, w, h, rad); ctx.stroke();
  if (broken) {
    ctx.strokeStyle = 'rgba(200,210,210,0.4)'; ctx.lineWidth = 1.5;
    const cx = x + r.range(w * 0.2, w * 0.8), cy = y + r.range(h * 0.2, h * 0.6);
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r.range(-w, w) * 0.5, cy + r.range(-h, h) * 0.5); ctx.stroke(); }
    ctx.fillStyle = '#050505';
    ctx.beginPath(); ctx.moveTo(cx - 9, cy - 7); ctx.lineTo(cx + 10, cy - 2); ctx.lineTo(cx + 2, cy + 13); ctx.closePath(); ctx.fill();
  }
  if (board) {
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.translate(x + w / 2, y + h * (0.22 + i * 0.28)); ctx.rotate(r.range(-0.2, 0.2));
      ctx.fillStyle = shade(P.wood, r.range(0.6, 0.9)); ctx.fillRect(-w * 0.64, -7, w * 1.28, 14);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-w * 0.64, 4, w * 1.28, 3);
      ctx.fillStyle = '#8a8070'; ctx.fillRect(-w * 0.55, -2, 3, 3); ctx.fillRect(w * 0.5, -2, 3, 3);
      ctx.restore();
    }
  }
  if (bars) { ctx.fillStyle = P.iron; for (let i = 1; i < 5; i++) ctx.fillRect(x + (w / 5) * i - 2, y - 4, 4, h + 8); }
  // stone head: flat arch with keystone, or rubbed brick arch
  if (!arch) {
    ctx.fillStyle = '#6d675c'; ctx.fillRect(x - 10, y - 16, w + 20, 11);
    ctx.fillStyle = '#857e70'; ctx.beginPath(); ctx.moveTo(x + w / 2 - 8, y - 18); ctx.lineTo(x + w / 2 + 8, y - 18); ctx.lineTo(x + w / 2 + 5, y - 3); ctx.lineTo(x + w / 2 - 5, y - 3); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - 10, y - 6, w + 20, 2);
  } else {
    ctx.strokeStyle = '#7a4a34'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(x + w / 2, y + rad, w / 2 + 9, Math.PI, 0); ctx.stroke();
  }
  if (sill) {
    ctx.fillStyle = '#7a7367'; ctx.fillRect(x - 10, y + h + 4, w + 20, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x - 10, y + h + 11, w + 20, 3);
    vgrad(ctx, x - 6, y + h + 14, w + 12, 40, [[0, 'rgba(10,10,8,0.35)'], [1, 'rgba(10,10,8,0)']]); // drip stain
    if (r.chance(0.25) && !board) { ctx.fillStyle = '#4a2e20'; ctx.fillRect(x + w * 0.3, y + h - 10, 18, 14); ctx.fillStyle = '#2e3a22'; ctx.beginPath(); ctx.ellipse(x + w * 0.3 + 9, y + h - 12, 12, 7, 0, 0, TAU); ctx.fill(); }
  }
  return lit ? { x: x + w / 2, y: y + h / 2 } : null;
}

export function door(ctx, x, y, w, h, { color = P.woodDark, arch = false, open = 0, knocker = true, steps = 1, fanlight = true, number = null, scraper = true } = {}) {
  // surround
  ctx.fillStyle = '#26221f'; roundTopRect(ctx, x - 9, y - (fanlight && !arch ? 34 : 9), w + 18, h + (fanlight && !arch ? 34 : 9), arch ? (w + 18) / 2 : 0); ctx.fill();
  if (fanlight && !arch) {
    ctx.fillStyle = '#121618'; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.arc(x + w / 2, y - 4, w / 2, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8f8775'; ctx.lineWidth = 2;
    for (let i = 0; i <= 6; i++) { const a = Math.PI + (Math.PI / 6) * i; ctx.beginPath(); ctx.moveTo(x + w / 2, y - 4); ctx.lineTo(x + w / 2 + Math.cos(a) * w / 2, y - 4 + Math.sin(a) * w / 2); ctx.stroke(); }
    ctx.fillStyle = '#6d675c'; ctx.fillRect(x - 4, y - 6, w + 8, 6);
  }
  ctx.fillStyle = color;
  roundTopRect(ctx, x, y, w, h, arch ? w / 2 : 0); ctx.fill();
  const top = y + (arch ? w / 2 : 8);
  const ph = (h - (top - y)) * 0.42;
  for (const [px, py] of [[x + 7, top + 4], [x + w / 2 + 4, top + 4], [x + 7, top + ph + 12], [x + w / 2 + 4, top + ph + 12]]) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px, py, w / 2 - 11, ph);
    ctx.fillStyle = 'rgba(255,230,200,0.08)'; ctx.fillRect(px, py, w / 2 - 11, 2); ctx.fillRect(px, py, 2, ph);
  }
  if (open > 0) { ctx.fillStyle = '#030303'; ctx.fillRect(x, top - 8, w * open, h - (top - y) + 8); }
  ctx.fillStyle = '#9a8350';
  if (knocker) { ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.42, 4, 0, TAU); ctx.fill(); ctx.strokeStyle = '#9a8350'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.42 + 6, 5, 0, Math.PI); ctx.stroke(); }
  ctx.fillRect(x + w * 0.25, y + h * 0.6, w * 0.5, 4); // letter plate
  ctx.beginPath(); ctx.arc(x + w - 10, y + h * 0.55, 3, 0, TAU); ctx.fill();
  if (number) { ctx.font = '600 13px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#c9b98a'; ctx.fillText(number, x + w / 2, top + 16); }
  for (let s = 0; s < steps; s++) {
    ctx.fillStyle = shade(P.stone, 0.95 - s * 0.12); ctx.fillRect(x - 12 - s * 7, y + h + s * 9, w + 24 + s * 14, 9);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - 12 - s * 7, y + h + s * 9 + 7, w + 24 + s * 14, 2);
  }
  if (scraper && steps) { ctx.fillStyle = P.iron; ctx.fillRect(x - 26, y + h - 2, 12, 3); ctx.fillRect(x - 25, y + h - 6, 2, 8); ctx.fillRect(x - 17, y + h - 6, 2, 8); }
}

export function drainpipe(ctx, x, y, h) {
  ctx.fillStyle = '#1b1d1f'; ctx.fillRect(x - 6, y, 19, 16); // hopper head
  ctx.fillStyle = '#26292c'; ctx.fillRect(x - 6, y, 19, 4);
  ctx.fillStyle = '#1b1d1f'; ctx.fillRect(x, y + 14, 7, h - 14);
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(x + 1, y + 14, 2, h - 14);
  for (let yy = y + 50; yy < y + h; yy += 80) { ctx.fillStyle = '#121314'; ctx.fillRect(x - 3, yy, 13, 6); }
  vgrad(ctx, x - 6, y + 16, 19, h * 0.5, [[0, 'rgba(90,40,20,0.3)'], [1, 'rgba(90,40,20,0)']]); // rust run
  ctx.fillStyle = '#1b1d1f'; ctx.fillRect(x - 4, y + h - 10, 18, 10);
}

// Enamel street name plate.
export function streetSign(ctx, x, y, text, { w = null } = {}) {
  ctx.font = '600 18px "IM Fell English SC", Georgia, serif';
  const tw = w || ctx.measureText(text).width + 30;
  ctx.fillStyle = '#0e1013'; ctx.fillRect(x - 3, y - 3, tw + 6, 34);
  ctx.fillStyle = '#e2ddd0'; ctx.fillRect(x, y, tw, 28);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.strokeRect(x + 3, y + 3, tw - 6, 22);
  ctx.fillStyle = '#141414'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x + tw / 2, y + 15);
  ctx.fillStyle = '#555'; ctx.fillRect(x + 6, y + 12, 3, 3); ctx.fillRect(x + tw - 9, y + 12, 3, 3);
  stain(ctx, x, y, tw, 28, { seed: 31, alpha: 0.45 });
  ctx.fillStyle = 'rgba(70,30,15,0.35)'; ctx.fillRect(x + tw - 18, y + 20, 10, 8); // chipped enamel
}

// Bill posters pasted over each other and torn.
export function poster(ctx, x, y, w, h, lines, { seed = 7, tilt = 0, color = '#b9aa86', under = true, ink = '#231c14' } = {}) {
  const r = rng(seed);
  if (under) {
    for (let i = 0; i < 2; i++) {
      ctx.save(); ctx.translate(x + w / 2 + r.range(-14, 14), y + h / 2 + r.range(-10, 10)); ctx.rotate(tilt + r.range(-0.06, 0.06));
      ctx.fillStyle = r.pick(['#8f8466', '#a39478', '#7c7058']); ctx.fillRect(-w / 2 - 6, -h / 2 - 4, w + 12, h + 8);
      ctx.restore();
    }
  }
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2); ctx.rotate(tilt);
  ctx.fillStyle = color; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  let yy = -h / 2 + 6;
  for (const [txt, size] of lines) { ctx.font = `600 ${size}px "IM Fell English SC", Georgia, serif`; ctx.fillText(txt, 0, yy); yy += size + 3; }
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-w / 2, -h / 2 + h * 0.62, w, 2); // paste wrinkle
  stain(ctx, -w / 2, -h / 2, w, h, { seed, alpha: 0.55 });
  // torn corner peeling away
  ctx.fillStyle = shade(color, 0.6);
  ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.lineTo(w / 2 - 20, h / 2); ctx.lineTo(w / 2 - 4, h / 2 - 24); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.moveTo(w / 2 - 20, h / 2); ctx.lineTo(w / 2 - 4, h / 2 - 24); ctx.lineTo(w / 2 - 8, h / 2 + 3); ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- ground
// Granite setts in courses, receding slightly; wet sheen; puddles; a gutter channel at the kerb.
export function cobbles(ctx, x, y, w, h, { seed = 5, color = P.cobble, rows = 14, puddles = 6, wet = 0.6, litter = 1 } = {}) {
  const r = rng(seed);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  vgrad(ctx, x, y, w, h, [[0, shade(P.cobbleDark, 0.55)], [1, shade(P.cobbleDark, 0.85)]]);
  let yy = y;
  for (let row = 0; row < rows && yy < y + h; row++) {
    const t = row / Math.max(1, rows - 1);
    const rh = 5 + t * t * 16;
    const sw = rh * 2.1;
    for (let xx = x - (row % 2) * sw * 0.5 - r.range(0, 6); xx < x + w; xx += sw) {
      const k = r.range(0.72, 1.15) * (0.7 + t * 0.4);
      ctx.fillStyle = shade(color, k);
      ctx.beginPath();
      ctx.moveTo(xx + 2, yy + 1.5); ctx.lineTo(xx + sw - 2, yy + 1); ctx.lineTo(xx + sw - 1, yy + rh - 1.5); ctx.lineTo(xx + 1.5, yy + rh - 1); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `rgba(200,215,220,${0.05 + wet * 0.09 * r()})`;
      ctx.fillRect(xx + 3, yy + 2, sw * 0.6, Math.max(1.5, rh * 0.18));
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(xx + 2, yy + rh - 3, sw - 3, 2);
    }
    yy += rh;
  }
  stain(ctx, x, y, w, h, { seed: seed + 2, alpha: 0.42, scale: 9 });
  // gutter channel close to the kerb
  ctx.fillStyle = 'rgba(8,12,12,0.6)'; ctx.fillRect(x, y + 2, w, 7);
  ctx.fillStyle = 'rgba(150,170,175,0.12)'; ctx.fillRect(x, y + 3, w, 2);
  for (let i = 0; i < puddles; i++) {
    const px = x + r.range(0, w), py = y + r.range(h * 0.25, h * 0.9), pw = r.range(60, 190), ph = r.range(6, 16);
    const g = ctx.createRadialGradient(px, py, 2, px, py, pw / 2);
    g.addColorStop(0, 'rgba(10,15,17,0.9)'); g.addColorStop(0.8, 'rgba(10,15,17,0.7)'); g.addColorStop(1, 'rgba(10,15,17,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(px, py, pw / 2, ph, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(160,180,185,0.12)'; ctx.fillRect(px - pw * 0.3, py - ph * 0.4, pw * 0.4, 2);
  }
  for (let i = 0; i < Math.round(w / 220 * litter); i++) litterBit(ctx, x + r.range(0, w), y + r.range(h * 0.15, h * 0.95), r);
  grit(ctx, x, y, w, h, { seed: seed + 4, density: 0.5 });
  ctx.restore();
}

// straw, dung, a scrap of newspaper, broken glass, an oyster shell
export function litterBit(ctx, x, y, r) {
  const k = r();
  if (k < 0.3) { ctx.strokeStyle = '#8a7340'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + r.range(-8, 8), y); ctx.lineTo(x + r.range(-14, 14), y + r.range(-3, 3)); ctx.stroke(); } }
  else if (k < 0.5) { ctx.fillStyle = '#2e2216'; ctx.beginPath(); ctx.ellipse(x, y, 8, 4, 0, 0, TAU); ctx.ellipse(x + 7, y - 2, 6, 3, 0, 0, TAU); ctx.fill(); }
  else if (k < 0.72) { ctx.save(); ctx.translate(x, y); ctx.rotate(r.range(-0.5, 0.5)); ctx.fillStyle = '#9a8e72'; ctx.fillRect(-12, -4, 24, 9); ctx.fillStyle = 'rgba(40,30,20,0.5)'; ctx.fillRect(-9, -2, 16, 1.5); ctx.fillRect(-9, 1, 12, 1.5); ctx.restore(); }
  else if (k < 0.86) { ctx.fillStyle = '#4a6050'; ctx.fillRect(x, y, 4, 2); ctx.fillRect(x + 6, y + 2, 3, 2); ctx.fillStyle = 'rgba(200,230,220,0.4)'; ctx.fillRect(x + 1, y, 2, 1); }
  else { ctx.fillStyle = '#b8b0a0'; ctx.beginPath(); ctx.ellipse(x, y, 5, 3, 0.4, 0, TAU); ctx.fill(); }
}

export function kerb(ctx, x, y, w) {
  const r = rng(Math.round(x) + 3);
  for (let xx = x; xx < x + w; xx += 64) {
    ctx.fillStyle = shade(P.stone, r.range(0.85, 1.05)); ctx.fillRect(xx, y, 64, 8);
    ctx.fillStyle = shade(P.stoneDark, r.range(0.7, 0.9)); ctx.fillRect(xx, y + 8, 64, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(xx, y, 2, 14);
    ctx.fillStyle = 'rgba(255,240,220,0.1)'; ctx.fillRect(xx + 2, y, 60, 2);
    if (r.chance(0.2)) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(xx + r.range(10, 50), y, 8, 4); }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(x, y + 14, w, 5);
}

export function flagstones(ctx, x, y, w, h, { seed = 9 } = {}) {
  const r = rng(seed);
  ctx.fillStyle = P.stoneDark; ctx.fillRect(x, y, w, h);
  for (let xx = x; xx < x + w;) {
    const fw = r.range(50, 86);
    ctx.fillStyle = shade(P.stone, r.range(0.68, 0.95));
    ctx.fillRect(xx + 1, y + 1, fw - 2, h - 2);
    if (r.chance(0.18)) { ctx.fillStyle = '#1a1b1c'; ctx.beginPath(); ctx.ellipse(xx + fw / 2, y + h / 2, 10, h * 0.32, 0, 0, TAU); ctx.fill(); } // coal-hole plate
    if (r.chance(0.3)) { ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xx + fw * 0.3, y); ctx.lineTo(xx + fw * 0.5, y + h); ctx.stroke(); }
    xx += fw;
  }
  stain(ctx, x, y, w, h, { seed, alpha: 0.5 });
}

// ---------------------------------------------------------------- street furniture
// Cast-iron gas lamp. Returns the world position of the flame so the scene can register the light.
export function lampPost(ctx, x, groundY, h = 250, { bracket = false } = {}) {
  ctx.fillStyle = P.iron;
  if (!bracket) {
    ctx.fillRect(x - 13, groundY - 14, 26, 14);           // plinth
    ctx.fillRect(x - 10, groundY - 34, 20, 22);
    ctx.fillRect(x - 12, groundY - 38, 24, 5);
    ctx.fillRect(x - 6, groundY - 60, 12, 24);
    ctx.fillRect(x - 4, groundY - h + 34, 8, h - 92);     // fluted shaft
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x - 2, groundY - h + 40, 2, h - 104);
    ctx.fillStyle = P.iron;
    ctx.fillRect(x - 7, groundY - h + 50, 14, 6);           // collar
    ctx.fillRect(x - 26, groundY - h + 44, 52, 4);          // ladder bar
    ctx.beginPath(); ctx.arc(x - 26, groundY - h + 46, 4, 0, TAU); ctx.arc(x + 26, groundY - h + 46, 4, 0, TAU); ctx.fill();
  } else {
    ctx.fillRect(x - 60, groundY - h + 30, 64, 5);
    ctx.beginPath(); ctx.moveTo(x - 60, groundY - h + 34); ctx.quadraticCurveTo(x - 30, groundY - h + 70, x - 4, groundY - h + 34); ctx.lineWidth = 3; ctx.strokeStyle = P.iron; ctx.stroke();
  }
  const ly = groundY - h;
  // lantern: four tapered glass panes, crown, ventilator, finial
  ctx.beginPath();
  ctx.moveTo(x - 15, ly + 4); ctx.lineTo(x + 15, ly + 4); ctx.lineTo(x + 9, ly + 36); ctx.lineTo(x - 9, ly + 36); ctx.closePath();
  ctx.fillStyle = '#f1c56e'; ctx.fill();
  ctx.fillStyle = '#ffeab0'; ctx.fillRect(x - 3, ly + 14, 6, 10);
  ctx.strokeStyle = P.iron; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, ly + 4); ctx.lineTo(x, ly + 36); ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = P.iron;
  ctx.beginPath(); ctx.moveTo(x - 19, ly + 6); ctx.lineTo(x, ly - 10); ctx.lineTo(x + 19, ly + 6); ctx.fill();
  ctx.fillRect(x - 6, ly - 14, 12, 5);
  ctx.fillRect(x - 2, ly - 22, 4, 9);
  ctx.beginPath(); ctx.arc(x, ly - 23, 3, 0, TAU); ctx.fill();
  ctx.fillRect(x - 11, ly + 35, 22, 5);
  return { x, y: ly + 20 };
}

export function railing(ctx, x, y, w, h, { gap = 12 } = {}) {
  ctx.fillStyle = shade(P.stone, 0.7); ctx.fillRect(x - 4, y + h - 4, w + 8, 10); // coping
  ctx.fillStyle = P.iron;
  ctx.fillRect(x, y, w, 4); ctx.fillRect(x, y + h - 14, w, 4);
  for (let xx = x; xx < x + w; xx += gap) {
    ctx.fillRect(xx, y - 8, 3, h + 2);
    ctx.beginPath(); ctx.moveTo(xx - 3, y - 8); ctx.lineTo(xx + 1.5, y - 20); ctx.lineTo(xx + 6, y - 8); ctx.fill();
    if ((xx - x) % (gap * 6) < gap) { ctx.fillRect(xx - 3, y - 4, 9, 6); ctx.beginPath(); ctx.arc(xx + 1.5, y - 24, 4, 0, TAU); ctx.fill(); }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x, y, w, 1.5);
}

export function crate(ctx, x, y, w, h, seed = 1, { stencil = null } = {}) {
  const r = rng(seed);
  ctx.fillStyle = shade(P.wood, r.range(0.8, 1.1)); ctx.fillRect(x, y, w, h);
  for (let yy = y; yy < y + h; yy += h / 4) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x, yy, w, 2); ctx.fillStyle = 'rgba(255,230,200,0.08)'; ctx.fillRect(x, yy + 2, w, 1.5); }
  ctx.fillStyle = shade(P.wood, 0.7);
  ctx.fillRect(x, y, 6, h); ctx.fillRect(x + w - 6, y, 6, h);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = shade(P.wood, 0.7); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#7a7060'; for (const [nx, ny] of [[x + 3, y + 4], [x + w - 4, y + 4], [x + 3, y + h - 6], [x + w - 4, y + h - 6]]) ctx.fillRect(nx - 1, ny, 2, 2);
  if (stencil) { ctx.font = '600 12px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(20,14,10,0.6)'; ctx.fillText(stencil, x + w / 2, y + h / 2 + 4); }
  stain(ctx, x, y, w, h, { seed, alpha: 0.45 });
}

export function barrel(ctx, x, y, w, h) {
  if (drawPropIn(ctx, 'barrel', x, y, w, h)) return;
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, shade(P.wood, 0.5)); g.addColorStop(0.4, shade(P.wood, 1.15)); g.addColorStop(1, shade(P.wood, 0.45));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x + w * 0.1, y); ctx.quadraticCurveTo(x - w * 0.05, y + h / 2, x + w * 0.1, y + h); ctx.lineTo(x + w * 0.9, y + h); ctx.quadraticCurveTo(x + w * 1.05, y + h / 2, x + w * 0.9, y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5;
  for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x + (w / 5) * i, y + 2); ctx.lineTo(x + (w / 5) * i, y + h - 2); ctx.stroke(); }
  ctx.fillStyle = P.iron;
  for (const k of [0.15, 0.82]) { ctx.fillRect(x, y + h * k, w, 4); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x + w * 0.3, y + h * k, w * 0.2, 1.5); ctx.fillStyle = P.iron; }
  ctx.fillStyle = shade(P.wood, 0.4); ctx.beginPath(); ctx.ellipse(x + w / 2, y + 1, w * 0.42, 3, 0, 0, TAU); ctx.fill();
}

export function cart(ctx, x, groundY, { flip = false } = {}) {
  if (drawProp(ctx, 'cart', flip ? x + 220 : x, groundY, { flip })) return;
  ctx.save();
  if (flip) { ctx.translate(x * 2 + 220, 0); ctx.scale(-1, 1); }
  ctx.fillStyle = P.woodDark;
  ctx.fillRect(x, groundY - 92, 200, 30);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(255,230,200,0.06)'; ctx.fillRect(x + 4 + i * 40, groundY - 92, 2, 30); }
  ctx.fillStyle = P.woodDark;
  ctx.fillRect(x - 4, groundY - 118, 6, 30); ctx.fillRect(x + 196, groundY - 118, 6, 30);
  ctx.fillRect(x - 4, groundY - 118, 210, 4);
  ctx.save(); ctx.translate(x + 196, groundY - 84); ctx.rotate(0.38); ctx.fillRect(0, 0, 130, 6); ctx.restore();
  ctx.strokeStyle = P.woodDark; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(x + 70, groundY - 46, 44, 0, TAU); ctx.stroke();
  ctx.strokeStyle = P.iron; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 70, groundY - 46, 47, 0, TAU); ctx.stroke();
  ctx.strokeStyle = P.woodDark; ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.2; ctx.beginPath(); ctx.moveTo(x + 70, groundY - 46); ctx.lineTo(x + 70 + Math.cos(a) * 44, groundY - 46 + Math.sin(a) * 44); ctx.stroke(); }
  ctx.fillStyle = '#1a140f'; ctx.beginPath(); ctx.arc(x + 70, groundY - 46, 9, 0, TAU); ctx.fill();
  ctx.restore();
}

export function gate(ctx, x, y, w, h, { open = false } = {}) {
  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(x, y, w, h);
  if (open) return;
  const r = rng(Math.round(x));
  for (let xx = x; xx < x + w; xx += 16) {
    ctx.fillStyle = shade(P.woodDark, r.range(0.78, 1.05)); ctx.fillRect(xx + 1, y, 14, h);
    ctx.fillStyle = 'rgba(255,230,200,0.06)'; ctx.fillRect(xx + 2, y, 2, h);
  }
  ctx.fillStyle = shade(P.woodDark, 0.7);
  ctx.fillRect(x, y + h * 0.16, w, 10); ctx.fillRect(x, y + h * 0.78, w, 10);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = shade(P.woodDark, 0.7); ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(x, y + h * 0.78); ctx.lineTo(x + w / 2, y + h * 0.18); ctx.moveTo(x + w / 2, y + h * 0.78); ctx.lineTo(x + w, y + h * 0.18); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = P.iron;
  for (const yy of [y + h * 0.16, y + h * 0.78]) { ctx.fillRect(x, yy + 2, 30, 6); ctx.fillRect(x + w - 30, yy + 2, 30, 6); }
  ctx.fillRect(x + w / 2 - 1.5, y, 3, h);
  ctx.fillRect(x + w / 2 + 4, y + h * 0.5, 12, 4);
  stain(ctx, x, y, w, h, { seed: 41, alpha: 0.5 });
  vgrad(ctx, x, y + h * 0.7, w, h * 0.3, [[0, 'rgba(10,14,10,0)'], [1, 'rgba(10,14,10,0.6)']]);
}

export function chalk(ctx, x, y, text, { size = 18, rot = -0.03 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.font = `italic ${size}px "IM Fell English", Georgia, serif`;
  ctx.fillStyle = 'rgba(225,225,215,0.82)'; ctx.textBaseline = 'top';
  text.split('\n').forEach((line, i) => ctx.fillText(line, 0, i * (size + 4)));
  ctx.restore();
}

// Three golden balls of the pawnbroker on a wrought bracket.
export function pawnSign(ctx, x, y) {
  ctx.fillStyle = P.iron;
  ctx.fillRect(x, y, 60, 4);
  ctx.fillRect(x, y - 16, 4, 24);
  ctx.beginPath(); ctx.moveTo(x + 4, y - 14); ctx.quadraticCurveTo(x + 30, y - 12, x + 50, y + 2); ctx.lineWidth = 2; ctx.strokeStyle = P.iron; ctx.stroke();
  // the three balls hang from the end of the bar
  const px = x + 52, py = y + 4;
  const balls = (c) => {
    for (const [bx, by] of [[-8, 18], [8, 18], [0, 32]]) {
      c.fillStyle = P.iron; c.fillRect(bx - 1, 0, 2, by - 8);
      const g = c.createRadialGradient(bx - 3, by - 3, 1, bx, by, 9);
      g.addColorStop(0, '#f3d27a'); g.addColorStop(1, '#7a5418');
      c.fillStyle = g; c.beginPath(); c.arc(bx, by, 8, 0, TAU); c.fill();
    }
  };
  if (live.on) live.list.push({ x: px, y: py, paint: balls, mass: 0.7 });
  else { ctx.save(); ctx.translate(px, py); balls(ctx); ctx.restore(); }
}

// A painted board hanging from an iron bracket.
export function hangingSign(ctx, x, y, text, { w = 110, h = 44, color = '#2a1c14', ink = '#c9a860', still = false, fg = false } = {}) {
  ctx.fillStyle = P.iron;
  ctx.fillRect(x, y, w + 24, 4);
  ctx.fillRect(x, y - 10, 4, 22);
  // the board on its two rods, drawn about the middle of the bar it hangs from
  const px = x + 14 + w / 2, py = y + 4;
  const board = (c) => {
    c.fillStyle = P.iron; c.fillRect(6 - w / 2, 0, 2, 10); c.fillRect(w / 2 - 2, 0, 2, 10);
    c.fillStyle = color; c.fillRect(-w / 2, 10, w, h);
    c.strokeStyle = ink; c.lineWidth = 2; c.strokeRect(4 - w / 2, 14, w - 8, h - 8);
    c.font = '600 15px "IM Fell English SC", Georgia, serif'; c.fillStyle = ink; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, 0, 10 + h / 2 + 1);
    stain(c, -w / 2, 10, w, h, { seed: text.length, alpha: 0.5 });
  };
  if (live.on && !still) live.list.push({ x: px, y: py, paint: board, mass: 1, fg });
  else { ctx.save(); ctx.translate(px, py); board(ctx); ctx.restore(); }
}

// Telegraph / bell wires sagging between two points.
export function wires(ctx, x0, y0, x1, y1, { count = 2, sag = 30, color = '#0b0c0d' } = {}) {
  ctx.strokeStyle = color; ctx.lineWidth = 1.6;
  for (let i = 0; i < count; i++) {
    ctx.beginPath(); ctx.moveTo(x0, y0 + i * 6); ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + sag + i * 4, x1, y1 + i * 6); ctx.stroke();
  }
  ctx.fillStyle = color; ctx.fillRect(x0 - 3, y0 - 3, 8, 6 * count); ctx.fillRect(x1 - 3, y1 - 3, 8, 6 * count);
}

export function bollard(ctx, x, groundY) {
  ctx.fillStyle = P.iron;
  ctx.fillRect(x - 9, groundY - 50, 18, 50);
  ctx.beginPath(); ctx.ellipse(x, groundY - 50, 10, 5, 0, 0, TAU); ctx.fill();
  ctx.fillRect(x - 11, groundY - 40, 22, 4); ctx.fillRect(x - 11, groundY - 6, 22, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x - 5, groundY - 46, 2, 40);
}

// Cast-iron street pump with its handle and trough.
export function pump(ctx, x, groundY) {
  ctx.fillStyle = P.iron;
  ctx.fillRect(x - 12, groundY - 130, 24, 130);
  ctx.fillRect(x - 16, groundY - 136, 32, 8); ctx.beginPath(); ctx.arc(x, groundY - 140, 10, Math.PI, 0); ctx.fill();
  ctx.fillRect(x - 15, groundY - 14, 30, 14);
  ctx.fillRect(x + 12, groundY - 76, 22, 7); ctx.fillRect(x + 28, groundY - 72, 5, 12);
  ctx.save(); ctx.translate(x - 8, groundY - 112); ctx.rotate(0.5); ctx.fillRect(-70, -3, 74, 6); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x - 6, groundY - 126, 2, 110);
}

export function sack(ctx, x, groundY, seed = 1) {
  if (drawProp(ctx, 'sack', x, groundY, { flip: seed % 2 === 1, sx: 0.9 + (seed % 3) * 0.1 })) return;
  const r = rng(seed);
  ctx.fillStyle = r.pick(['#5a4c34', '#4a3e2a', '#665538']);
  ctx.beginPath(); ctx.moveTo(x - 20, groundY); ctx.quadraticCurveTo(x - 26, groundY - 30, x - 10, groundY - 44); ctx.lineTo(x + 8, groundY - 46); ctx.quadraticCurveTo(x + 26, groundY - 28, x + 20, groundY); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - 12, groundY - 40, 22, 3);
  grit(ctx, x - 22, groundY - 46, 44, 46, { seed, density: 3 });
}

// Canvas shop awning, rolled or lowered.
export function awning(ctx, x, y, w, { color = '#3c2422', stripe = '#6a4a30', down = true } = {}) {
  if (!down) { ctx.fillStyle = color; ctx.fillRect(x, y, w, 12); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x, y + 10, w, 3); return; }
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w + 14, y + 46); ctx.lineTo(x - 14, y + 46); ctx.fill();
  ctx.fillStyle = stripe;
  for (let xx = x; xx < x + w; xx += 28) { ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx + 14, y); ctx.lineTo(xx + 18, y + 46); ctx.lineTo(xx + 2, y + 46); ctx.fill(); }
  for (let xx = x - 14; xx < x + w + 14; xx += 14) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(xx, y + 46); ctx.lineTo(xx + 14, y + 46); ctx.lineTo(xx + 7, y + 54); ctx.fill(); }
  stain(ctx, x - 14, y, w + 28, 54, { seed: 4, alpha: 0.5 });
}

export { mix };
