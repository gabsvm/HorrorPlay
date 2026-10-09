// Close-ups for the crime scenes: the victim seen from above, as Ashgrove kneels over her with the
// lantern. Painted at 1280x720 and then reduced to the pixel grid like everything else. The gore is
// there because the case is about it, but it is drawn the way a police surgeon's sketch would be:
// what was done, where, and how carefully.
import { closeupFor } from './closeups.js';
import { rng } from './noise.js';

const TAU = Math.PI * 2;
const BLOOD = '#3a0606', BLOOD2 = '#5c0b0a', BLOOD3 = '#7d1510', WET = 'rgba(255,190,170,0.35)';

function capsule(ctx, x0, y0, x1, y1, r0, r1, fill) {
  const a = Math.atan2(y1 - y0, x1 - x0), n = a + Math.PI / 2;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x0 + Math.cos(n) * r0, y0 + Math.sin(n) * r0);
  ctx.lineTo(x1 + Math.cos(n) * r1, y1 + Math.sin(n) * r1);
  ctx.arc(x1, y1, r1, n, n + Math.PI, true);
  ctx.lineTo(x0 - Math.cos(n) * r0, y0 - Math.sin(n) * r0);
  ctx.arc(x0, y0, r0, n + Math.PI, n, true);
  ctx.fill();
}

// a pool of blood that has crept into the joints of the stones, with a wet highlight
function pool(ctx, x, y, rx, ry, seed, joints = true) {
  const r = rng(seed);
  ctx.fillStyle = BLOOD;
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * TAU, k = 0.75 + r() * 0.4;
    const px = x + Math.cos(a) * rx * k, py = y + Math.sin(a) * ry * k;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.fill();
  if (joints) {
    ctx.strokeStyle = BLOOD; ctx.lineWidth = 4;
    for (let i = 0; i < 9; i++) {
      const a = r() * TAU, d = 0.8 + r() * 0.5;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * rx * 0.8, y + Math.sin(a) * ry * 0.8);
      ctx.lineTo(x + Math.cos(a) * rx * (d + 0.4), y + Math.sin(a) * ry * (d + 0.4)); ctx.stroke();
    }
  }
  const g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 2, x - rx * 0.3, y - ry * 0.3, rx * 0.6);
  g.addColorStop(0, 'rgba(110,22,18,0.35)'); g.addColorStop(1, 'rgba(90,10,8,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx * 0.8, ry * 0.8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = WET; ctx.fillRect(x - rx * 0.35, y - ry * 0.4, rx * 0.25, 3);
}

// a stain soaking outward through cloth
function soak(ctx, x, y, rx, ry, k = 1) {
  const g = ctx.createRadialGradient(x, y, 4, x, y, Math.max(rx, ry));
  g.addColorStop(0, `rgba(48,4,4,${0.95 * k})`); g.addColorStop(0.6, `rgba(70,8,6,${0.7 * k})`); g.addColorStop(1, 'rgba(70,8,6,0)');
  ctx.fillStyle = g;
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore();
}

// an open cut: dark lips, a red inside, a bead of light
function gash(ctx, pts, w) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); };
  ctx.strokeStyle = 'rgba(60,8,8,0.6)'; ctx.lineWidth = w + 10; path(); ctx.stroke();      // bruised edges
  ctx.strokeStyle = '#1a0202'; ctx.lineWidth = w + 2; path(); ctx.stroke();
  ctx.strokeStyle = '#4a0707'; ctx.lineWidth = w * 0.6; path(); ctx.stroke();
  ctx.strokeStyle = 'rgba(170,60,50,0.55)'; ctx.lineWidth = Math.max(1, w * 0.15); path(); ctx.stroke();
}

function ground(ctx, W, H, kind, seed) {
  const r = rng(seed);
  if (kind === 'earth') {
    ctx.fillStyle = '#2e2924'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) { ctx.fillStyle = r.pick(['#38322b', '#262119', '#3f382f', '#2a251f']); ctx.fillRect(r() * W, r() * H, r.range(4, 14), r.range(3, 8)); }
    ctx.fillStyle = 'rgba(200,170,120,0.35)';                       // sawdust
    for (let i = 0; i < 260; i++) ctx.fillRect(r.range(W * 0.5, W), r() * H, 4, 3);
    ctx.fillStyle = '#4a453c'; ctx.fillRect(0, 0, 180, H); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(176, 0, 8, H);   // the stone step
    return;
  }
  // cobbles or flagstones, wet
  ctx.fillStyle = '#14130f'; ctx.fillRect(0, 0, W, H);
  const flag = kind === 'flags';
  const cw = flag ? 190 : 62, ch = flag ? 120 : 44;
  for (let y = -10, row = 0; y < H; y += ch, row++) {
    for (let x = -((row % 2) * cw) / 2 - 10; x < W; x += cw) {
      const c = r.pick(flag ? ['#3a3833', '#34322d', '#403d36'] : ['#3a3630', '#332f2a', '#423d35', '#2e2b26']);
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x + 4, y + 4, cw - 8, ch - 8, flag ? 4 : 14) : ctx.rect(x + 4, y + 4, cw - 8, ch - 8); ctx.fill();
      ctx.fillStyle = 'rgba(255,240,220,0.06)'; ctx.fillRect(x + 10, y + 8, cw * 0.5, 3);
    }
  }
}

// fine texture over cloth so it reads as wool, not as a flat colour
function weave(ctx, seed, clip, x, y, w, h, dark = 0.18) {
  const r = rng(seed);
  ctx.save(); clip(); ctx.clip();
  for (let i = 0; i < (w * h) / 260; i++) {
    ctx.fillStyle = r.chance(0.5) ? `rgba(0,0,0,${dark})` : 'rgba(255,240,220,0.05)';
    ctx.fillRect(x + r() * w, y + r() * h, r.range(4, 12), 2);
  }
  ctx.restore();
}

// The head seen from above: forehead toward -x, chin toward +x.
function face(ctx, x, y, rot, { eyes = 'open', bruise = false, skin = '#b9ab95', hair = '#2a1e16', cuts = false, mouth = 0.4, tongue = false }) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1.3, 1.3);
  // hair spread on the stones, in strands
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.ellipse(-30, 0, 96, 92, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * 0.6 + (i / 8) * Math.PI * 0.8;
    ctx.fillStyle = i % 2 ? hair : 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(-30 + Math.cos(a) * 88, Math.sin(a) * 82, 34, 18, a, 0, TAU); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) { const a = Math.PI * 0.6 + (i / 11) * Math.PI * 0.8; ctx.beginPath(); ctx.moveTo(-30 + Math.cos(a) * 50, Math.sin(a) * 50); ctx.quadraticCurveTo(-30 + Math.cos(a + 0.15) * 80, Math.sin(a + 0.15) * 80, -30 + Math.cos(a + 0.05) * 108, Math.sin(a + 0.05) * 104); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,230,200,0.08)'; ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.arc(-30, 0, 70 + i * 3, Math.PI * 0.7, Math.PI * 1.3); ctx.stroke(); }
  // ears
  ctx.fillStyle = '#8a7c68';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(-4, s * 64, 16, 9, 0, 0, TAU); ctx.fill(); }
  // skull and face: a wide forehead narrowing to the jaw and chin
  const g = ctx.createRadialGradient(-20, -14, 8, 0, 0, 92);
  g.addColorStop(0, skin); g.addColorStop(0.7, '#968a76'); g.addColorStop(1, '#6e6454');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-64, 0);
  ctx.bezierCurveTo(-66, -52, -20, -64, 8, -60);
  ctx.bezierCurveTo(40, -56, 62, -34, 74, -10);
  ctx.quadraticCurveTo(80, 0, 74, 10);
  ctx.bezierCurveTo(62, 34, 40, 56, 8, 60);
  ctx.bezierCurveTo(-20, 64, -66, 52, -64, 0);
  ctx.fill();
  // the hairline over the forehead
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.moveTo(-66, -40); ctx.quadraticCurveTo(-46, 0, -66, 40); ctx.lineTo(-80, 40); ctx.lineTo(-80, -40); ctx.fill();
  // modelling: temples, cheek hollows, under the jaw
  ctx.fillStyle = 'rgba(40,34,30,0.28)';
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(28, s * 40, 22, 12, s * 0.3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-34, s * 46, 16, 10, 0, 0, TAU); ctx.fill();
  }
  // eye sockets, eyes, lids
  for (const s of [-1, 1]) {
    ctx.fillStyle = 'rgba(60,44,40,0.38)'; ctx.beginPath(); ctx.ellipse(-12, s * 25, 16, 12, 0, 0, TAU); ctx.fill();
    if (eyes === 'open') {
      ctx.fillStyle = '#a49c8c'; ctx.beginPath(); ctx.ellipse(-12, s * 25, 8, 4.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#4a4640'; ctx.beginPath(); ctx.arc(-11, s * 25, 3.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#141210'; ctx.beginPath(); ctx.arc(-11, s * 25, 1.8, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-13, s * 25 - 3, 2, 2);
      ctx.strokeStyle = 'rgba(60,40,36,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(-12, s * 25, 11, 7.5, 0, Math.PI * 0.95, Math.PI * 2.05); ctx.stroke();
    } else {
      ctx.strokeStyle = '#3a2a24'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-22, s * 25); ctx.quadraticCurveTo(-12, s * 25 + s * 4, -2, s * 25); ctx.stroke();
      ctx.strokeStyle = 'rgba(30,20,18,0.5)'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-18 + k * 5, s * 27); ctx.lineTo(-19 + k * 5, s * 31); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(40,28,24,0.7)'; ctx.beginPath(); ctx.ellipse(-30, s * 26, 5, 14, 0, 0, TAU); ctx.fill();   // brow
  }
  // nose seen from above: the bridge catching light, the nostrils dark
  ctx.fillStyle = 'rgba(255,240,220,0.3)'; ctx.fillRect(-2, -3, 30, 6);
  ctx.fillStyle = 'rgba(40,30,26,0.35)'; ctx.fillRect(0, 3, 30, 4);
  ctx.fillStyle = '#2a1c18'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(32, s * 6, 4, 3, 0, 0, TAU); ctx.fill(); }
  // mouth: grey lips, slack
  ctx.fillStyle = '#7a6460'; ctx.beginPath(); ctx.ellipse(50, 0, 8 + mouth * 4, 20, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1e0e0c'; ctx.beginPath(); ctx.ellipse(50, 0, 3 + mouth * 6, 15, 0, 0, TAU); ctx.fill();
  if (tongue) { ctx.fillStyle = '#6a3a40'; ctx.beginPath(); ctx.ellipse(54, 2, 6, 9, 0, 0, TAU); ctx.fill(); }
  if (bruise) {
    ctx.fillStyle = 'rgba(70,50,80,0.5)'; ctx.beginPath(); ctx.ellipse(52, 34, 18, 13, 0.4, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(90,60,90,0.35)'; ctx.beginPath(); ctx.ellipse(46, -36, 10, 8, 0, 0, TAU); ctx.fill();
  }
  if (cuts) {
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      gash(ctx, [[-14, s * 14], [-10, s * 34]], 2.5);                         // through the lower lid
      gash(ctx, [[14, s * 34], [32, s * 50], [44, s * 32]], 3);                // the inverted V on the cheek
    }
    gash(ctx, [[16, -4], [36, 6]], 4);                                          // across the bridge of the nose
    ctx.fillStyle = 'rgba(90,10,10,0.5)'; ctx.beginPath(); ctx.ellipse(36, 22, 26, 20, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function hand(ctx, x, y, rot, skin = '#a89a86', marks = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const dark = 'rgba(40,30,26,0.35)';
  // palm up, fingers slightly curled
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.moveTo(-26, -18); ctx.quadraticCurveTo(-30, 0, -24, 20); ctx.lineTo(16, 22); ctx.quadraticCurveTo(24, 0, 18, -20); ctx.closePath(); ctx.fill();
  const fingers = [[-17, 13, 38], [-6, 15, 44], [5, 15, 42], [15, 13, 34]];
  for (const [fy, w, len] of fingers) {
    capsule(ctx, 16, fy * 1.05, 16 + len * 0.55, fy * 1.15, w * 0.42, w * 0.38, skin);
    capsule(ctx, 16 + len * 0.55, fy * 1.15, 16 + len * 0.95, fy * 1.1 + 3, w * 0.38, w * 0.33, skin);
    ctx.fillStyle = dark; ctx.fillRect(16 + len * 0.52, fy * 1.15 - 4, 2, 8);
    ctx.fillStyle = 'rgba(220,200,190,0.5)'; ctx.fillRect(16 + len * 0.86, fy * 1.1, 4, 3);    // nail
  }
  capsule(ctx, -14, -18, 8, -36, 7, 6, skin);                                                   // thumb
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.moveTo(-18, 6); ctx.quadraticCurveTo(0, 14, 14, 4); ctx.lineTo(14, 7); ctx.quadraticCurveTo(0, 17, -18, 9); ctx.fill();   // palm crease
  if (marks) { ctx.fillStyle = 'rgba(110,60,50,0.9)'; ctx.fillRect(22, -4, 5, 10); ctx.fillRect(30, -4, 5, 10); ctx.fillStyle = 'rgba(200,170,160,0.6)'; ctx.fillRect(23, -2, 2, 6); }
  ctx.restore();
}

// Body lying with the head to the left. kind: 'nichols' | 'chapman' | 'eddowes'
export function paintBody(ctx, W, H, kind) {
  const pic = closeupFor(kind);
  if (pic) { ctx.drawImage(pic, 0, 0, W, H); return; }
  const r = rng(kind.length * 31);
  ground(ctx, W, H, kind === 'chapman' ? 'earth' : kind === 'eddowes' ? 'flags' : 'cobbles', kind.length * 7);
  const hx = 300, hy = 350;
  const dress = kind === 'nichols' ? '#5a4632' : kind === 'chapman' ? '#2e2824' : '#2a2c30';
  const skin = kind === 'eddowes' ? '#b3a690' : '#b9ab95';
  const handSkin = '#a89a86';

  // blood first, under everything
  if (kind === 'nichols') { pool(ctx, hx + 90, hy + 140, 130, 70, 3); pool(ctx, hx + 60, hy - 130, 70, 40, 4); }
  if (kind === 'chapman') { pool(ctx, hx + 90, hy - 140, 160, 80, 5); pool(ctx, hx + 100, hy + 150, 120, 70, 6); }
  if (kind === 'eddowes') { pool(ctx, hx + 80, hy + 150, 170, 90, 7); pool(ctx, hx + 520, hy + 170, 150, 80, 8); }

  // ---- the dress: shoulders, bodice to the waist, then the skirt running off the right edge
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(hx + 150, hy - 70);
    ctx.bezierCurveTo(hx + 190, hy - 160, hx + 260, hy - 165, hx + 330, hy - 150);   // shoulder
    ctx.bezierCurveTo(hx + 420, hy - 132, hx + 470, hy - 110, hx + 520, hy - 108);   // ribs to waist
    ctx.bezierCurveTo(hx + 600, hy - 120, hx + 700, hy - 175, W + 20, hy - 200);     // skirt flaring
    ctx.lineTo(W + 20, hy + 230);
    ctx.bezierCurveTo(hx + 700, hy + 190, hx + 600, hy + 130, hx + 520, hy + 112);
    ctx.bezierCurveTo(hx + 470, hy + 114, hx + 420, hy + 136, hx + 330, hy + 152);
    ctx.bezierCurveTo(hx + 260, hy + 168, hx + 190, hy + 162, hx + 150, hy + 70);
    ctx.closePath();
  };
  ctx.fillStyle = dress; body(); ctx.fill();
  weave(ctx, 3, body, hx + 140, hy - 210, W, 450);
  // folds of the skirt and the shadow along its far side
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(hx + 560 + i * 70, hy - 110 - i * 12); ctx.bezierCurveTo(hx + 600 + i * 70, hy - 30, hx + 560 + i * 74, hy + 60, hx + 600 + i * 70, hy + 130 + i * 14); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,240,220,0.07)'; ctx.lineWidth = 3;
  for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(hx + 575 + i * 70, hy - 110 - i * 12); ctx.bezierCurveTo(hx + 615 + i * 70, hy - 30, hx + 575 + i * 74, hy + 60, hx + 615 + i * 70, hy + 130 + i * 14); ctx.stroke(); }
  const shade = ctx.createLinearGradient(0, hy - 200, 0, hy + 230);
  shade.addColorStop(0, 'rgba(255,240,220,0.06)'); shade.addColorStop(0.5, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = shade; body(); ctx.fill();
  // buttons down the bodice, a waistband
  ctx.fillStyle = 'rgba(20,16,14,0.9)';
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(hx + 230 + i * 48, hy + (i % 2), 4.5, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(hx + 505, hy - 108, 18, 220);
  // ---- shawl over the shoulders with a fringe
  const shawlC = kind === 'eddowes' ? '#3a342e' : kind === 'chapman' ? '#46362e' : '#6a5238';
  const shawl = () => { ctx.beginPath(); ctx.moveTo(hx + 140, hy - 90); ctx.bezierCurveTo(hx + 200, hy - 180, hx + 300, hy - 175, hx + 380, hy - 150); ctx.lineTo(hx + 300, hy); ctx.lineTo(hx + 380, hy + 150); ctx.bezierCurveTo(hx + 300, hy + 175, hx + 200, hy + 180, hx + 140, hy + 90); ctx.closePath(); };
  ctx.fillStyle = shawlC; shawl(); ctx.fill();
  weave(ctx, 9, shawl, hx + 130, hy - 190, 260, 380, 0.25);
  ctx.strokeStyle = shade_(shawlC); ctx.lineWidth = 2;
  for (let i = 0; i < 14; i++) { const k = i / 13; const px = hx + 380 - Math.abs(k - 0.5) * 160, py = hy - 150 + k * 300; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 14, py + 2); ctx.stroke(); }
  // white collar at the throat
  ctx.fillStyle = '#6e6a60'; ctx.beginPath(); ctx.ellipse(hx + 152, hy, 12, 50, 0, 0, TAU); ctx.fill();
  // ---- the arms down her sides, sleeves creased at the elbow
  for (const s of [-1, 1]) {
    capsule(ctx, hx + 230, hy + s * 150, hx + 400, hy + s * 178, 30, 26, dress);
    capsule(ctx, hx + 400, hy + s * 178, hx + 560, hy + s * 190, 26, 22, dress);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(hx + 390 + k * 8, hy + s * 158); ctx.lineTo(hx + 398 + k * 8, hy + s * 196); ctx.stroke(); }
    ctx.fillStyle = 'rgba(160,150,135,0.8)'; ctx.fillRect(hx + 556, hy + s * 190 - 20, 10, 40);   // cuff
  }
  // ---- neck
  capsule(ctx, hx + 70, hy, hx + 160, hy, 40, 46, '#8e8270');
  const ng = ctx.createLinearGradient(0, hy - 46, 0, hy + 46);
  ng.addColorStop(0, 'rgba(0,0,0,0.35)'); ng.addColorStop(0.4, 'rgba(255,240,220,0.06)'); ng.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = ng; ctx.fillRect(hx + 30, hy - 50, 170, 100);
  ctx.strokeStyle = BLOOD; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) { ctx.lineWidth = 6 - (i % 3); const yy = i % 2 ? 1 : -1; ctx.beginPath(); ctx.moveTo(hx + 96 + i * 8, hy + yy * 30); ctx.quadraticCurveTo(hx + 90 + i * 10, hy + yy * 60, hx + 84 + i * 14, hy + yy * (90 + i * 8)); ctx.stroke(); }

  if (kind === 'nichols') {
    gash(ctx, [[hx + 96, hy - 40], [hx + 108, hy - 6], [hx + 100, hy + 34]], 9);       // two cuts, left to right
    gash(ctx, [[hx + 124, hy - 42], [hx + 134, hy], [hx + 126, hy + 40]], 7);
    soak(ctx, hx + 210, hy + 50, 140, 110, 0.75);
    // the skirt pushed up over the belly, sodden underneath; a gash showing through the torn cloth
    soak(ctx, hx + 620, hy + 10, 170, 120, 1);
    soak(ctx, hx + 640, hy + 20, 90, 60, 1);   // where it is wettest, the cloth is black
    ctx.fillStyle = '#121010'; ctx.beginPath(); ctx.ellipse(hx - 150, hy + 150, 80, 50, 0.3, 0, TAU); ctx.fill();   // the new black bonnet
    ctx.fillStyle = '#2a2622'; ctx.beginPath(); ctx.ellipse(hx - 150, hy + 150, 50, 30, 0.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a1414'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx - 100, hy + 170); ctx.quadraticCurveTo(hx - 60, hy + 210, hx - 30, hy + 200); ctx.stroke();
    ctx.fillStyle = 'rgba(160,140,120,0.5)'; ctx.fillRect(hx - 190, hy + 124, 70, 4);
    hand(ctx, hx + 600, hy + 192, 0.1, handSkin);
    hand(ctx, hx + 600, hy - 192, -0.1, handSkin);
    face(ctx, hx, hy, 0, { eyes: 'open', bruise: true, skin, hair: '#4a3a2a', mouth: 0.3 });
  } else if (kind === 'chapman') {
    gash(ctx, [[hx + 84, hy - 48], [hx + 112, hy - 12], [hx + 116, hy + 22], [hx + 90, hy + 48]], 16);   // nearly through
    soak(ctx, hx + 210, hy - 40, 150, 120, 0.9);
    // what was taken out of her laid over the right shoulder, the sacking over the rest
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = i % 2 ? '#6e2624' : '#8a3430'; ctx.lineWidth = 20 - i * 2;
      ctx.beginPath(); ctx.moveTo(hx + 420 + i * 10, hy - 40); ctx.bezierCurveTo(hx + 330, hy - 200 - i * 8, hx + 200 + i * 16, hy - 210, hx + 150 + i * 22, hy - 150 + i * 6); ctx.stroke();
      ctx.strokeStyle = 'rgba(230,160,150,0.4)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(hx + 410 + i * 10, hy - 50); ctx.bezierCurveTo(hx + 326, hy - 204 - i * 8, hx + 206 + i * 16, hy - 214, hx + 156 + i * 22, hy - 156 + i * 6); ctx.stroke();
    }
    const sack = () => { ctx.beginPath(); ctx.moveTo(hx + 450, hy - 160); ctx.lineTo(hx + 860, hy - 170); ctx.lineTo(hx + 880, hy + 170); ctx.lineTo(hx + 440, hy + 180); ctx.quadraticCurveTo(hx + 480, hy + 20, hx + 420, hy - 60); ctx.closePath(); };
    ctx.fillStyle = '#5e4c36'; sack(); ctx.fill();
    weave(ctx, 21, sack, hx + 420, hy - 170, 470, 360, 0.3);
    for (let i = 0; i < 22; i++) { ctx.strokeStyle = 'rgba(30,24,16,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx + 450, hy - 150 + i * 15); ctx.lineTo(hx + 870, hy - 160 + i * 15); ctx.stroke(); }
    soak(ctx, hx + 640, hy + 10, 210, 150, 1);
    hand(ctx, hx + 600, hy + 192, 0.25, '#a69884', true);
    hand(ctx, hx + 600, hy - 192, -0.2, '#a69884');
    // her things, in a row at her feet
    const fx = W - 190;
    ctx.fillStyle = '#c9c0ae'; ctx.fillRect(fx - 70, hy + 190, 56, 32); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(fx - 70, hy + 214, 56, 8);
    ctx.fillStyle = '#6a5a40'; ctx.fillRect(fx, hy + 200, 44, 10); ctx.fillStyle = '#3a2e20'; for (let k = 0; k < 9; k++) ctx.fillRect(fx + 2 + k * 5, hy + 210, 2, 6);
    ctx.fillStyle = '#d8d0bc'; ctx.fillRect(fx + 60, hy + 190, 50, 32); ctx.fillStyle = '#8a2a20'; ctx.beginPath(); ctx.arc(fx + 85, hy + 206, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#9a7a40'; for (const k of [0, 1]) { ctx.beginPath(); ctx.arc(fx + 130 + k * 22, hy + 206, 8, 0, TAU); ctx.fill(); }
    face(ctx, hx, hy, -0.22, { eyes: 'closed', skin, hair: '#3a2a20', mouth: 0.7, tongue: true });
  } else {
    gash(ctx, [[hx + 88, hy - 44], [hx + 114, hy], [hx + 94, hy + 44]], 13);
    soak(ctx, hx + 210, hy + 30, 150, 120, 0.9);
    // the abdomen laid open, intestines drawn over the right shoulder
    ctx.lineCap = 'round';
    gash(ctx, [[hx + 470, hy - 10], [hx + 600, hy + 6], [hx + 720, hy - 4]], 22);
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = i % 2 ? '#6e2624' : '#8a3430'; ctx.lineWidth = 20 - i * 2;
      ctx.beginPath(); ctx.moveTo(hx + 500, hy + 10 + i * 8); ctx.bezierCurveTo(hx + 400, hy + 170, hx + 260 + i * 12, hy + 220, hx + 180 + i * 20, hy + 150 + i * 4); ctx.stroke();
      ctx.strokeStyle = 'rgba(230,160,150,0.4)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(hx + 494, hy + 4 + i * 8); ctx.bezierCurveTo(hx + 396, hy + 164, hx + 256 + i * 12, hy + 214, hx + 176 + i * 20, hy + 144 + i * 4); ctx.stroke();
    }
    soak(ctx, hx + 600, hy + 20, 200, 140, 1);
    // the white apron, with a piece cut away along a clean edge
    const apron = () => { ctx.beginPath(); ctx.moveTo(hx + 760, hy - 130); ctx.lineTo(hx + 960, hy - 140); ctx.lineTo(hx + 960, hy + 30); ctx.lineTo(hx + 870, hy + 30); ctx.lineTo(hx + 850, hy + 130); ctx.lineTo(hx + 760, hy + 130); ctx.closePath(); };
    ctx.fillStyle = '#b8b2a2'; apron(); ctx.fill();
    weave(ctx, 33, apron, hx + 750, hy - 150, 220, 290, 0.12);
    soak(ctx, hx + 790, hy - 10, 90, 120, 0.85);
    ctx.strokeStyle = '#2a0404'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx + 960, hy + 30); ctx.lineTo(hx + 870, hy + 30); ctx.lineTo(hx + 850, hy + 130); ctx.stroke();
    hand(ctx, hx + 600, hy - 192, -0.15, '#a69884');
    hand(ctx, hx + 600, hy + 192, 0.15, '#a69884');
    face(ctx, hx, hy, 0.08, { eyes: 'closed', skin, hair: '#2a2420', cuts: true, mouth: 0.2 });
  }
  // a cold shadow at the edges, as the lantern only reaches so far
  const v = ctx.createRadialGradient(W * 0.42, H * 0.5, H * 0.2, W * 0.42, H * 0.5, W * 0.7);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.75)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

function shade_(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * 0.6)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

// A flash of what he does not remember: gloved hands, a blade, the wet street.
export function paintVision(ctx, W, H, kind) {
  ctx.fillStyle = '#0a0202'; ctx.fillRect(0, 0, W, H);
  const pic = kind === 'hands' && closeupFor('hands');
  if (pic) ctx.drawImage(pic, 0, 0, W, H);   // the painting (CLOSEUPS.md), under the same red vignette
  else if (kind === 'hands') {
    pool(ctx, W / 2, H * 0.72, 380, 120, 9, false);
    for (const [x, y, rot] of [[W * 0.36, H * 0.48, 0.3], [W * 0.62, H * 0.5, Math.PI - 0.3]]) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      capsule(ctx, -260, 0, -40, 0, 46, 40, '#16120e');                         // coat sleeve
      ctx.fillStyle = '#2a221c'; ctx.beginPath(); ctx.ellipse(0, 0, 60, 48, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 4; i++) capsule(ctx, 40, -30 + i * 20, 110, -34 + i * 22, 12, 10, '#2a221c');
      soak(ctx, 30, 0, 90, 60, 1);
      ctx.restore();
    }
    // the scalpel in the left hand
    ctx.save(); ctx.translate(W * 0.36 + 60, H * 0.48 + 30); ctx.rotate(-0.5);
    ctx.fillStyle = '#9a9a96'; ctx.fillRect(0, -6, 150, 12); ctx.fillStyle = '#d8d8d0';
    ctx.beginPath(); ctx.moveTo(150, -6); ctx.lineTo(230, -2); ctx.lineTo(150, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = BLOOD3; ctx.fillRect(160, -2, 60, 6);
    ctx.restore();
    for (let i = 0; i < 14; i++) { ctx.fillStyle = BLOOD2; ctx.beginPath(); ctx.ellipse(W * 0.5 + (i - 7) * 50, H * 0.85 + (i % 3) * 14, 10, 5, 0, 0, TAU); ctx.fill(); }
  } else {
    paintBody(ctx, W, H, kind);
  }
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, W * 0.6);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,0,0,0.85)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
