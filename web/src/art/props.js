// Things the player handles or walks on, drawn with more care than the background: they carry the
// light, show their material and sit on the ground they stand on. Coordinates are logical pixels.
import { rng } from './noise.js';
import { shade } from './palette.js';

const TAU = Math.PI * 2;

// ------------------------------------------------------------------ stairs

// Stone steps rising to a door, seen from the front and a little above: each step shows its riser
// and the worn top of its tread, with the cheek of the flight at both ends.
export function doorSteps(ctx, cx, groundY, { count = 2, rise = 16, width = 120, grow = 22, depth = 9, stone = '#6a655a' } = {}) {
  for (let i = 0; i < count; i++) {
    const w = width + (count - 1 - i) * grow, x = cx - w / 2;
    const top = groundY - (i + 1) * rise;
    // riser
    ctx.fillStyle = shade(stone, 0.72 - i * 0.04); ctx.fillRect(x, top, w, rise);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, top + rise - 3, w, 3);
    // tread, seen from above: lighter, worn hollow in the middle where everyone steps
    ctx.fillStyle = shade(stone, 1.08); ctx.fillRect(x - 2, top - depth, w + 4, depth);
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x, top - depth + 2, w, depth - 2);
    ctx.fillStyle = 'rgba(255,240,220,0.14)'; ctx.fillRect(x - 2, top - depth, w + 4, 2);
    // joints and a chipped nosing
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    for (let j = 1; j < 3; j++) ctx.fillRect(x + (w / 3) * j, top, 2, rise);
    ctx.fillRect(x + w * 0.7, top - 2, 10, 3);
  }
  // grime and moss at the foot
  ctx.fillStyle = 'rgba(40,60,36,0.45)'; ctx.fillRect(cx - (width + (count - 1) * grow) / 2, groundY - 4, width + (count - 1) * grow, 4);
}

// A flight seen from the side climbing from (x0, y0) at the bottom to (x1, y1) at the top, against a
// retaining wall: every tread catches the light along its nosing, every riser is in shadow.
export function profileStairs(ctx, x0, y0, x1, y1, { count = 9, stone = '#5c574d', wall = '#2c2925', seed = 5, rail = true } = {}) {
  const r = rng(seed);
  const run = (x1 - x0) / count, rise = (y1 - y0) / count;      // run < 0 when climbing to the left
  // the masonry under the flight, in courses
  ctx.fillStyle = wall;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1);
  for (let i = count; i >= 0; i--) { ctx.lineTo(x0 + run * i, y0 + rise * i); }
  ctx.closePath(); ctx.fill();
  for (let yy = y1; yy < y0; yy += 18) {
    for (let xx = Math.min(x0, x1) + ((yy / 18) % 2) * 20; xx < Math.max(x0, x1); xx += 40) {
      ctx.fillStyle = r.pick(['rgba(255,240,220,0.04)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.05)']);
      ctx.fillRect(xx, yy, 38, 16);
    }
  }
  // the steps
  for (let i = 0; i < count; i++) {
    const sx = x0 + run * i, sy = y0 + rise * (i + 1);
    const w = Math.abs(run) + 4, left = Math.min(sx, sx + run) - 2;
    ctx.fillStyle = shade(stone, 0.7); ctx.fillRect(left, sy, w, -rise);                      // riser face
    ctx.fillStyle = shade(stone, 1.05); ctx.fillRect(left - 2, sy - 6, w + 4, 7);             // tread top
    ctx.fillStyle = 'rgba(255,240,220,0.18)'; ctx.fillRect(left - 2, sy - 6, w + 4, 2);       // lit nosing
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(left - 2, sy + 1, w + 4, 2);
    if (r.chance(0.4)) { ctx.fillStyle = 'rgba(30,50,30,0.6)'; ctx.fillRect(left + r.range(0, w - 10), sy - 2, r.range(6, 14), 3); }
  }
  // iron handrail on posts
  if (rail) {
    ctx.strokeStyle = '#141414'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x0 + run * 0.5, y0 - 70); ctx.lineTo(x1 - run * 0.2, y1 - 70); ctx.stroke();
    ctx.lineWidth = 3;
    for (let i = 0; i <= count; i += 3) { const px = x0 + run * (i + 0.5), py = y0 + rise * (i + 1); ctx.beginPath(); ctx.moveTo(px, py - 6); ctx.lineTo(px, py - 70); ctx.stroke(); }
  }
}

// A stair going straight up and away inside an open doorway: one-point perspective, each tread
// narrower and darker than the last, the walls of the stairwell closing in.
export function stairwellUp(ctx, x, y, w, h, { steps = 9, stone = '#5e5a52', lamp = true } = {}) {
  ctx.fillStyle = '#030303'; ctx.fillRect(x, y, w, h);
  const vx = x + w / 2, vy = y + h * 0.18;                  // vanishing point, high in the dark
  // side walls
  ctx.fillStyle = '#0d0c0b';
  ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(vx - w * 0.16, vy); ctx.lineTo(x, y); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + w, y + h); ctx.lineTo(vx + w * 0.16, vy); ctx.lineTo(x + w, y); ctx.fill();
  for (let i = 0; i < steps; i++) {
    const k0 = i / steps, k1 = (i + 1) / steps;
    const e = (k) => 1 - Math.pow(1 - k, 1.6);
    const yb = y + h - (h - (vy - y) - 20) * e(k0), yt = y + h - (h - (vy - y) - 20) * e(k1);
    const half = (w / 2) * (1 - e(k0) * 0.68), halfT = (w / 2) * (1 - e(k1) * 0.68);
    const fade = 1 - k0 * 0.85;
    ctx.fillStyle = `rgba(${parseInt(stone.slice(1, 3), 16) * 0.6 | 0},${parseInt(stone.slice(3, 5), 16) * 0.6 | 0},${parseInt(stone.slice(5, 7), 16) * 0.6 | 0},${fade})`;
    ctx.fillRect(vx - half, yt + (yb - yt) * 0.35, half * 2, (yb - yt) * 0.65);           // riser
    ctx.fillStyle = `rgba(${parseInt(stone.slice(1, 3), 16)},${parseInt(stone.slice(3, 5), 16)},${parseInt(stone.slice(5, 7), 16)},${fade})`;
    ctx.beginPath(); ctx.moveTo(vx - halfT, yt); ctx.lineTo(vx + halfT, yt); ctx.lineTo(vx + half, yt + (yb - yt) * 0.35); ctx.lineTo(vx - half, yt + (yb - yt) * 0.35); ctx.fill();   // tread
    ctx.fillStyle = `rgba(255,240,220,${0.12 * fade})`; ctx.fillRect(vx - half, yt + (yb - yt) * 0.35 - 1, half * 2, 2);
  }
  // a gas jet on the first landing, far up
  if (lamp) {
    const g = ctx.createRadialGradient(vx + w * 0.1, vy + 10, 1, vx + w * 0.1, vy + 10, 40);
    g.addColorStop(0, 'rgba(255,210,140,0.5)'); g.addColorStop(1, 'rgba(255,210,140,0)');
    ctx.fillStyle = g; ctx.fillRect(vx - 40, vy - 30, 100, 80);
    ctx.fillStyle = '#ffd795'; ctx.fillRect(vx + w * 0.1 - 1, vy + 8, 3, 4);
  }
  // the handrail running up the right wall
  ctx.strokeStyle = 'rgba(70,60,50,0.9)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + w - 6, y + h - 70); ctx.lineTo(vx + w * 0.12, vy + 30); ctx.stroke();
}

// Steps going down into the dark from street level, seen from the front.
export function stairsDown(ctx, x, groundY, w, { steps = 7, stone = '#5e5a52', depth = 150 } = {}) {
  ctx.fillStyle = '#020303'; ctx.fillRect(x, groundY - 4, w, depth + 40);
  for (let i = 0; i < steps; i++) {
    const k = i / steps, y = groundY + i * (depth / steps), inset = i * 4;
    const a = 1 - k * 0.9;
    ctx.fillStyle = `rgba(110,105,96,${a})`; ctx.fillRect(x + 8 + inset, y, w - 16 - inset * 2, 6);              // tread edge in the light
    ctx.fillStyle = `rgba(60,58,52,${a})`; ctx.fillRect(x + 8 + inset, y + 6, w - 16 - inset * 2, depth / steps - 6);   // riser below it
    ctx.fillStyle = `rgba(255,240,220,${0.15 * a})`; ctx.fillRect(x + 8 + inset, y, w - 16 - inset * 2, 1.5);
  }
  // the side walls of the cutting and the kerb at the top
  ctx.fillStyle = '#1c1b18'; ctx.fillRect(x - 10, groundY - 10, 14, depth + 30); ctx.fillRect(x + w - 4, groundY - 10, 14, depth + 30);
  ctx.fillStyle = shade(stone, 1.1); ctx.fillRect(x - 12, groundY - 12, w + 24, 6);
}

// ------------------------------------------------------------------ the inspector's things

export function coatOnPeg(ctx, x, y, color = '#23262b') {
  const lit = shade(color, 1.35), dark = shade(color, 0.6);
  ctx.fillStyle = color;
  // hung by the loop: shoulders slumping from the peg, body falling to the hem
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 30, y + 6, x - 34, y + 30);
  ctx.lineTo(x - 40, y + 150); ctx.quadraticCurveTo(x, y + 160, x + 38, y + 152);
  ctx.lineTo(x + 32, y + 30); ctx.quadraticCurveTo(x + 28, y + 6, x, y);
  ctx.fill();
  // sleeves hanging along the sides
  ctx.fillStyle = shade(color, 0.85);
  ctx.beginPath(); ctx.moveTo(x - 32, y + 24); ctx.lineTo(x - 44, y + 120); ctx.lineTo(x - 30, y + 122); ctx.lineTo(x - 24, y + 34); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 30, y + 24); ctx.lineTo(x + 40, y + 118); ctx.lineTo(x + 28, y + 120); ctx.lineTo(x + 22, y + 34); ctx.fill();
  // turned-up collar, front edge with buttons, folds
  ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(x - 14, y + 2); ctx.lineTo(x - 18, y + 22); ctx.lineTo(x + 18, y + 22); ctx.lineTo(x + 14, y + 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 4, y + 24, 2, 126);
  ctx.fillStyle = '#0c0c0e'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x + 10, y + 40 + i * 24, 2.4, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
  for (const fx of [-22, -10, 20]) { ctx.beginPath(); ctx.moveTo(x + fx * 0.6, y + 40); ctx.quadraticCurveTo(x + fx, y + 100, x + fx * 1.1, y + 150); ctx.stroke(); }
  ctx.strokeStyle = lit; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 30, y + 28); ctx.lineTo(x + 36, y + 150); ctx.stroke();
  // the peg
  ctx.fillStyle = '#6b5a3a'; ctx.fillRect(x - 3, y - 8, 6, 10);
}

export function bowlerOnPeg(ctx, x, y) {
  ctx.fillStyle = '#6b5a3a'; ctx.fillRect(x - 3, y - 14, 6, 12);
  ctx.fillStyle = '#121316';
  ctx.beginPath(); ctx.ellipse(x, y + 4, 24, 6, 0, 0, TAU); ctx.fill();                  // brim
  ctx.beginPath(); ctx.ellipse(x, y - 2, 16, 16, 0, Math.PI, 0); ctx.fill();             // crown
  ctx.fillRect(x - 16, y - 3, 32, 6);
  ctx.fillStyle = '#26201a'; ctx.fillRect(x - 16, y - 2, 32, 4);                          // band
  ctx.fillStyle = 'rgba(200,210,230,0.22)'; ctx.beginPath(); ctx.arc(x - 5, y - 10, 6, Math.PI * 1.1, Math.PI * 1.6); ctx.lineTo(x - 5, y - 10); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x - 22, y + 2, 20, 1.5);
}

export function bullseyeLantern(ctx, x, y, { lit = false } = {}) {
  // ring handle on the peg, tin body with ribs, the domed chimney, a fat glass lens on the front
  ctx.strokeStyle = '#3a3026'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y - 4, 7, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#3a342c'; ctx.fillRect(x - 12, y, 24, 30);
  ctx.fillStyle = '#4e463a'; ctx.fillRect(x - 12, y, 6, 30);
  ctx.fillStyle = 'rgba(255,240,210,0.18)'; ctx.fillRect(x - 9, y + 2, 2, 26);
  ctx.fillStyle = '#2a241e'; for (const ry of [y + 6, y + 22]) ctx.fillRect(x - 13, ry, 26, 2);
  ctx.fillStyle = '#2e2822'; ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x - 5, y - 8); ctx.lineTo(x + 5, y - 8); ctx.lineTo(x + 9, y); ctx.fill();
  ctx.fillRect(x - 3, y - 12, 6, 5);
  // the lens
  ctx.fillStyle = '#1e1a16'; ctx.beginPath(); ctx.arc(x + 12, y + 15, 10, 0, TAU); ctx.fill();
  ctx.fillStyle = lit ? '#ffd795' : '#5a5040'; ctx.beginPath(); ctx.arc(x + 13, y + 15, 7.5, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(x + 11, y + 12, 2.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a2420'; ctx.fillRect(x - 13, y + 29, 26, 4);
}

export function bootsPair(ctx, x, y, { wet = true } = {}) {
  if (wet) {
    ctx.fillStyle = 'rgba(16,20,16,0.85)'; ctx.beginPath(); ctx.ellipse(x + 30, y + 5, 60, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(140,160,150,0.18)'; ctx.fillRect(x + 4, y + 3, 40, 1.5);
  }
  for (const [bx, lean] of [[x, -0.04], [x + 34, 0.06]]) {
    ctx.save(); ctx.translate(bx, y); ctx.rotate(lean);
    ctx.fillStyle = '#0f0e0d';
    ctx.beginPath(); ctx.moveTo(2, -40); ctx.lineTo(20, -40); ctx.lineTo(22, -14); ctx.quadraticCurveTo(36, -12, 40, -4); ctx.lineTo(40, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();   // shaft and vamp
    ctx.fillStyle = '#050505'; ctx.fillRect(-1, -3, 42, 4); ctx.fillRect(-1, -6, 10, 6);                                   // sole and heel
    ctx.fillStyle = '#1c1a17'; ctx.beginPath(); ctx.moveTo(14, -40); ctx.lineTo(20, -40); ctx.lineTo(21, -16); ctx.lineTo(15, -18); ctx.fill();   // tongue
    ctx.fillStyle = '#8a7a5a'; for (let k = 0; k < 5; k++) ctx.fillRect(13, -36 + k * 5, 2, 2);                              // eyelets
    ctx.strokeStyle = '#3a3026'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(13, -35 + k * 5); ctx.lineTo(19, -33 + k * 5); ctx.stroke(); }
    ctx.fillStyle = 'rgba(160,170,160,0.28)'; ctx.fillRect(4, -36, 2, 20); ctx.fillRect(26, -11, 10, 1.5);                   // wet shine
    ctx.fillStyle = 'rgba(30,26,18,0.9)'; ctx.beginPath(); ctx.ellipse(18, -4, 18, 5, 0, 0, TAU); ctx.fill();                 // river mud caked on
    ctx.restore();
  }
}

export function newspaper(ctx, x, y, rot = -0.1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(3, 3, 84, 22);
  ctx.fillStyle = '#c2b694'; ctx.fillRect(0, 0, 84, 22);
  ctx.fillStyle = '#d2c7a6'; ctx.fillRect(0, 0, 42, 22);                     // the fold catching the light
  ctx.fillStyle = '#1c1812'; ctx.fillRect(4, 3, 34, 3.5);                    // masthead
  ctx.fillStyle = 'rgba(30,24,16,0.6)';
  for (let c = 0; c < 4; c++) for (let l = 0; l < 4; l++) ctx.fillRect(4 + c * 20, 9 + l * 3, 16, 1.2);
  ctx.fillStyle = '#7a1a14'; ctx.fillRect(46, 3, 30, 3);                     // a headline in red ink
  ctx.restore();
}

export function bottle(ctx, x, y, { glass = '#3a2010', label = '#c9bc98' } = {}) {
  ctx.fillStyle = glass;
  ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x - 7, y - 20); ctx.quadraticCurveTo(x - 7, y - 26, x - 3, y - 28); ctx.lineTo(x - 3, y - 34); ctx.lineTo(x + 3, y - 34); ctx.lineTo(x + 3, y - 28); ctx.quadraticCurveTo(x + 7, y - 26, x + 7, y - 20); ctx.lineTo(x + 7, y); ctx.fill();
  ctx.fillStyle = '#8a6a44'; ctx.fillRect(x - 3, y - 38, 6, 5);             // cork
  ctx.fillStyle = label; ctx.fillRect(x - 7, y - 17, 14, 10);
  ctx.fillStyle = 'rgba(40,20,10,0.7)'; ctx.fillRect(x - 5, y - 15, 10, 1.5); ctx.fillRect(x - 5, y - 12, 7, 1); ctx.fillStyle = '#7a1a14'; ctx.fillRect(x - 5, y - 10, 4, 1.5);
  ctx.fillStyle = 'rgba(255,230,190,0.35)'; ctx.fillRect(x - 5, y - 24, 2, 20);
  ctx.fillStyle = 'rgba(40,10,0,0.6)'; ctx.fillRect(x - 6, y - 4, 12, 3);    // a finger of liquid left
}

export function dissectionCase(ctx, x, y) {
  ctx.fillStyle = '#2a1a12'; ctx.fillRect(x, y - 22, 86, 22);
  ctx.fillStyle = '#3a2618'; ctx.fillRect(x, y - 22, 86, 5);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x, y - 3, 86, 3);
  ctx.fillStyle = '#b08a4e';
  for (const cx of [x, x + 80]) { ctx.fillRect(cx, y - 22, 6, 6); ctx.fillRect(cx, y - 6, 6, 6); }        // brass corners
  ctx.fillRect(x + 38, y - 16, 10, 7); ctx.fillStyle = '#5a4020'; ctx.fillRect(x + 41, y - 14, 4, 3);       // clasp
  ctx.strokeStyle = '#1a100a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 43, y - 22, 9, Math.PI, 0); ctx.stroke();   // handle
  ctx.fillStyle = 'rgba(255,240,220,0.08)'; ctx.fillRect(x + 4, y - 20, 30, 1.5);
}

// ------------------------------------------------------------------ in the streets

export function stonePost(ctx, x, groundY) {
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(x, groundY + 2, 22, 5, 0, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(x - 16, 0, x + 16, 0);
  g.addColorStop(0, '#4a463e'); g.addColorStop(0.45, '#7a7466'); g.addColorStop(1, '#3a362f');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x - 16, groundY); ctx.lineTo(x - 13, groundY - 56); ctx.quadraticCurveTo(x, groundY - 70, x + 13, groundY - 56); ctx.lineTo(x + 16, groundY); ctx.fill();
  ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x - 15, groundY - 44, 30, 5);                         // iron band
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x - 6, groundY - 62, 4, 50);
  ctx.fillStyle = 'rgba(40,60,36,0.5)'; ctx.fillRect(x - 16, groundY - 8, 32, 8);               // moss at the foot
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 2, groundY - 30, 6, 2); ctx.fillRect(x - 8, groundY - 22, 4, 2);   // chips
}

export function cattleTrough(ctx, x, groundY, w = 150, { dusk = false } = {}) {
  const top = groundY - 52;
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x - 4, groundY - 2, w + 8, 6);
  const g = ctx.createLinearGradient(0, top, 0, groundY);
  g.addColorStop(0, '#7a766c'); g.addColorStop(1, '#4a4740');
  ctx.fillStyle = g; ctx.fillRect(x, top + 6, w, groundY - top - 6);
  ctx.fillStyle = '#8a857a'; ctx.fillRect(x - 6, top, w + 12, 8);                                // rim
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x - 6, top, w + 12, 2);
  ctx.fillStyle = '#0d1416'; ctx.fillRect(x + 4, top + 1, w - 8, 4);                              // water
  ctx.fillStyle = dusk ? 'rgba(230,170,110,0.4)' : 'rgba(150,190,200,0.35)'; ctx.fillRect(x + 20, top + 2, 40, 1.5);
  // carved panel with the Association's name
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + 12, top + 14, w - 24, 28);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 12, top + 14, w - 24, 28);
  ctx.font = '600 8px Georgia, serif'; ctx.fillStyle = 'rgba(20,18,14,0.85)'; ctx.textAlign = 'center';
  ctx.fillText('METROPOLITAN DRINKING', x + w / 2, top + 25); ctx.fillText('FOUNTAIN & CATTLE TROUGH', x + w / 2, top + 35);
  // stains where the water slops over
  ctx.fillStyle = 'rgba(20,30,28,0.35)'; ctx.fillRect(x + 30, top + 6, 8, groundY - top - 10); ctx.fillRect(x + w - 50, top + 6, 6, groundY - top - 12);
}

export function leatherApron(ctx, x, y) {
  ctx.fillStyle = '#3e2616';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 30, y - 30, x + 80, y - 12); ctx.quadraticCurveTo(x + 100, y - 4, x + 104, y + 8); ctx.lineTo(x - 6, y + 10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.moveTo(x + 10, y - 2); ctx.quadraticCurveTo(x + 34, y - 24, x + 70, y - 12); ctx.lineTo(x + 66, y - 6); ctx.quadraticCurveTo(x + 34, y - 16, x + 14, y + 2); ctx.fill();   // a fold catching the light
  ctx.fillStyle = 'rgba(255,230,200,0.18)'; ctx.fillRect(x + 30, y - 18, 30, 2);                  // wet sheen
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + 4, y + 2); ctx.quadraticCurveTo(x - 20, y - 6, x - 30, y + 8); ctx.stroke();       // strap
  ctx.beginPath(); ctx.moveTo(x + 96, y + 2); ctx.quadraticCurveTo(x + 120, y - 8, x + 128, y + 8); ctx.stroke();
  ctx.fillStyle = '#9a8a5a'; ctx.fillRect(x - 32, y + 5, 6, 5);                                   // buckle
  ctx.fillStyle = 'rgba(20,30,30,0.6)'; ctx.beginPath(); ctx.ellipse(x + 50, y + 10, 64, 5, 0, 0, TAU); ctx.fill();   // the puddle it lies in
}

// the piece of Kate Eddowes's apron in the stairwell doorway
export function apronPiece(ctx, x, y) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x + 26, y + 6, 36, 6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c8bca4';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 34, y - 12); ctx.lineTo(x + 58, y - 4); ctx.lineTo(x + 52, y + 6); ctx.lineTo(x + 6, y + 8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#a89c84'; ctx.beginPath(); ctx.moveTo(x + 12, y - 2); ctx.lineTo(x + 34, y - 10); ctx.lineTo(x + 40, y - 2); ctx.fill();   // fold
  ctx.fillStyle = '#4a0c08'; ctx.beginPath(); ctx.ellipse(x + 30, y - 1, 14, 6, 0.2, 0, TAU); ctx.fill();          // where he wiped the blade
  ctx.fillStyle = '#6a1410'; ctx.beginPath(); ctx.ellipse(x + 40, y + 2, 8, 3, 0.2, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#3a0806'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 22, y - 4); ctx.lineTo(x + 48, y - 2); ctx.stroke();
  ctx.fillStyle = 'rgba(80,60,40,0.8)'; ctx.fillRect(x + 54, y - 4, 2, 9);                         // the straight knife cut
}

export function seanceTrumpet(ctx, x, y, t = 0) {
  // a long tin cone lying on its side, with a band of luminous paint round the bell
  const g = ctx.createLinearGradient(0, y - 22, 0, y);
  g.addColorStop(0, '#b8b4a8'); g.addColorStop(0.5, '#7a766c'); g.addColorStop(1, '#4a4740');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 60, y - 22); ctx.quadraticCurveTo(x + 66, y - 11, x + 60, y); ctx.lineTo(x, y - 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2a2622'; ctx.beginPath(); ctx.ellipse(x + 61, y - 11, 5, 11, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = `rgba(150,230,190,${0.55 + Math.sin(t * 1.3) * 0.15})`; ctx.fillRect(x + 50, y - 20, 4, 19);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x + 6, y - 9, 46, 1.5);
}
