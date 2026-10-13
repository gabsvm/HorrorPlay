// Limehouse foreshore at low tide, where the culvert of the Black Ditch comes out at the Thames.
// Prologue (1866, dusk, Thomas as a boy) and climax (1888, night).
import * as A from '../art/paint.js';
import { perception, perceptionBand } from '../story/perception.js';
import { profileStairs } from '../art/props.js';
import { P, shade } from '../art/palette.js';
import { rng } from '../art/noise.js';
import { Drip, Crow, Ripples, Rat, Smoke } from '../engine/life.js';

const WIDTH = 2100, GROUND = 612, WATER_Y = 470;
const is1866 = (G) => !G.flag('fs_1888');

// A Thames sailing barge: flat hull, tan spritsail, leeboard.
function sailingBarge(ctx, x, y, s, color, sail) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 180 * s, y); ctx.lineTo(x + 166 * s, y + 18 * s); ctx.lineTo(x + 10 * s, y + 18 * s); ctx.fill();
  ctx.fillRect(x + 70 * s, y - 150 * s, 4 * s, 150 * s);
  ctx.fillStyle = sail;
  ctx.beginPath(); ctx.moveTo(x + 74 * s, y - 146 * s); ctx.lineTo(x + 150 * s, y - 120 * s); ctx.lineTo(x + 130 * s, y - 8 * s); ctx.lineTo(x + 74 * s, y - 10 * s); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 70 * s, y - 110 * s); ctx.lineTo(x + 20 * s, y - 12 * s); ctx.lineTo(x + 70 * s, y - 12 * s); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 74 * s, y - 120 * s); ctx.lineTo(x + 150 * s, y - 118 * s); ctx.stroke();
}

function farLayers(R, dusk) {
  const sky = R.paintLayer(1280 + (WIDTH - 1280) * 0.15, (ctx, w, h) => {
    if (dusk) A.sky(ctx, w, h, { top: '#0e0d10', mid: '#2a2224', low: '#6a4632', glow: 'rgba(190,110,60,0.4)', glowY: 0.6, seed: 61, rim: '#8a5a40' });
    else A.sky(ctx, w, h, { top: '#030405', mid: '#080c0f', low: '#0f1a1c', glow: 'rgba(40,120,100,0.16)', glowY: 0.66, seed: 62, moon: { x: w * 0.7, y: 120 }, stars: 10 });
    const ink = dusk ? '#1d1a1b' : '#0a1012';
    // far bank: Rotherhithe wharves with lit windows, masts, cranes, a gasholder
    A.skyline(ctx, { w, baseY: WATER_Y - 6, seed: 9, color: ink, minH: 30, maxH: 100, cranes: true, gasometer: { x: w * 0.12, w: 150, h: 110 } });
    const r = rng(4);
    for (let i = 0; i < w / 30; i++) { if (!r.chance(0.35)) continue; ctx.fillStyle = dusk ? 'rgba(230,160,80,0.55)' : 'rgba(220,150,70,0.6)'; ctx.fillRect(r.range(0, w), WATER_Y - r.range(14, 70), 4, 5); }
    ctx.strokeStyle = ink;
    for (let i = 0; i < 9; i++) {
      const x = r.range(0, w), h2 = r.range(90, 190);
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, WATER_Y - 4); ctx.lineTo(x, WATER_Y - h2); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 30, WATER_Y - h2 + 30); ctx.lineTo(x + 30, WATER_Y - h2 + 30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, WATER_Y - h2); ctx.lineTo(x + 50, WATER_Y - 20); ctx.moveTo(x, WATER_Y - h2); ctx.lineTo(x - 44, WATER_Y - 20); ctx.stroke();
    }
    A.vgrad(ctx, 0, WATER_Y - 160, w, 170, [[0, 'rgba(60,70,70,0)'], [1, dusk ? 'rgba(130,90,64,0.5)' : 'rgba(30,50,50,0.6)']]);
  });
  const river = R.paintLayer(1280 + (WIDTH - 1280) * 0.5, (ctx, w) => {
    A.vgrad(ctx, 0, WATER_Y, w, 720 - WATER_Y, dusk ? [[0, '#5a4234'], [0.2, '#2e2622'], [1, '#141212']] : [[0, '#142022'], [0.25, '#0b1314'], [1, '#050808']]);
    const r = rng(8);
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = dusk ? `rgba(220,150,90,${r.range(0.04, 0.16)})` : `rgba(120,170,160,${r.range(0.03, 0.09)})`;
      const y = WATER_Y + Math.pow(r(), 2) * 160;
      ctx.fillRect(r.range(0, w), y, r.range(20, 120), 2);
    }
    // reflections of the far windows, broken into dashes
    for (let i = 0; i < w / 40; i++) {
      if (!r.chance(0.3)) continue;
      const x = r.range(0, w);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = `rgba(230,160,80,${0.25 - k * 0.035})`; ctx.fillRect(x + r.range(-3, 3), WATER_Y + 6 + k * 9, r.range(6, 14), 2); }
    }
    const ink = dusk ? '#191416' : '#060909';
    ctx.fillStyle = ink;
    ctx.beginPath(); ctx.moveTo(w * 0.62, WATER_Y + 24); ctx.lineTo(w * 0.62 + 260, WATER_Y + 24); ctx.lineTo(w * 0.62 + 240, WATER_Y + 46); ctx.lineTo(w * 0.62 + 16, WATER_Y + 46); ctx.fill();
    ctx.fillRect(w * 0.62 + 120, WATER_Y - 40, 4, 64);
    sailingBarge(ctx, w * 0.25, WATER_Y + 10, 0.9, ink, dusk ? '#4a2a1c' : '#120c0a');
    // a steam tug
    ctx.fillRect(w * 0.82, WATER_Y + 4, 110, 16); ctx.fillRect(w * 0.82 + 40, WATER_Y - 14, 40, 20); ctx.fillRect(w * 0.82 + 56, WATER_Y - 44, 10, 32);
  });
  return [{ canvas: sky, parallax: 0.15, kind: 'far' }, { canvas: river, parallax: 0.5, kind: 'far' }];
}

// Light skating on the river surface.
class Glints {
  constructor(dusk) { this.dusk = dusk; }
  drawGlow(ctx, t) {
    for (let i = 0; i < 26; i++) {
      const k = (t * 0.25 + i * 0.137) % 1;
      const x = ((i * 211.7) % WIDTH) + Math.sin(t * 0.4 + i) * 30, y = WATER_Y + 8 + ((i * 37) % 120) * (0.4 + k * 0.6);
      const a = Math.sin(k * Math.PI) * (this.dusk ? 0.35 : 0.22);
      ctx.fillStyle = this.dusk ? `rgba(240,170,100,${a})` : `rgba(140,200,180,${a})`;
      ctx.fillRect(x, y, 10 + (i % 4) * 6, 2);
    }
  }
}

// Gulls wheeling over the river at dusk.
class Gulls {
  draw(ctx, t) {
    ctx.strokeStyle = '#1a1614'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) {
      const x = ((t * (30 + i * 9) + i * 400) % (WIDTH + 400)) - 200, y = 180 + i * 40 + Math.sin(t * 0.8 + i) * 20;
      const f = Math.sin(t * 7 + i * 2) * 6;
      ctx.beginPath(); ctx.moveTo(x - 14, y - f); ctx.quadraticCurveTo(x - 6, y - 6, x, y); ctx.quadraticCurveTo(x + 6, y - 6, x + 14, y - f); ctx.stroke();
    }
  }
}

export default {
  id: 'foreshore',
  width: WIDTH,
  groundY: GROUND,
  walk: [380, 1760],
  spawn: 520,
  surface: 'mud',
  space: 'river',
  city: { ship: 1, bell: 0.6 },
  noFgDressing: true,
  variant: (G) => (is1866(G) ? '1866' : '1888'),
  get playerH() { return this.G && is1866(this.G) ? 138 : 206; },
  get lantern() { return !(this.G && is1866(this.G)); },
  get ambient() { return this.G && is1866(this.G) ? [0.16, 0.13, 0.12] : [0.025, 0.035, 0.04]; },
  get fog() { return this.G && is1866(this.G) ? { density: 0.8, amount: 0.55, color: [0.55, 0.45, 0.4], speed: 6 } : { density: 0.9, amount: 0.6, color: [0.3, 0.42, 0.42], speed: 5 }; },
  rain: 0,
  get beds() { return this.G && is1866(this.G) ? { river: 0.6, wind: 0.25 } : { river: 0.7, wind: 0.2, drone: 0.35 }; },
  get music() { return this.G && is1866(this.G) ? 'memory' : 'dread'; },

  build(R, G) {
    const dusk = is1866(G);
    const layers = farLayers(R, dusk);
    const lights = [];
    const near = R.paintLayer(WIDTH, (ctx) => {
      // backs of Narrow Street above the river wall, with The Grapes' wooden balcony
      A.brickWall(ctx, 0, -40, 470, 180, { seed: 44, palette: A.BRICK.stock, soot: 1 });
      for (let i = 0; i < 3; i++) A.windowFrame(ctx, 40 + i * 150, 10, 46, 70, { seed: 140 + i, lit: i === 1, curtain: true, figure: i === 1 });
      ctx.fillStyle = '#2a1e14'; ctx.fillRect(150, 92, 200, 8); for (let x = 154; x < 350; x += 12) ctx.fillRect(x, 66, 4, 28); ctx.fillRect(150, 62, 200, 6);
      // river wall: stock brick, granite coping, mooring rings, an iron ladder
      A.brickWall(ctx, 0, 140, 420, GROUND - 140, { seed: 18, palette: A.BRICK.stock, soot: 0.4, damp: 1, salt: 1 });
      ctx.fillStyle = '#6a655a'; ctx.fillRect(0, 126, 432, 18); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 144, 432, 4);
      A.railing(ctx, 0, 96, 420, 30);
      ctx.strokeStyle = P.iron; ctx.lineWidth = 4;
      for (const ry of [260, 380]) { ctx.beginPath(); ctx.arc(400, ry, 9, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = P.iron; ctx.fillRect(372, 150, 4, GROUND - 150); ctx.fillRect(396, 150, 4, GROUND - 150);
      for (let y = 170; y < GROUND; y += 26) ctx.fillRect(372, y, 28, 4);
      // green weed line where the tide reaches
      A.vgrad(ctx, 0, GROUND - 170, 420, 170, [[0, 'rgba(30,60,40,0)'], [0.4, 'rgba(30,60,40,0.55)'], [1, 'rgba(20,40,28,0.8)']]);
      // culvert arch: stone voussoirs and keystone, a bent grating, slime running out
      ctx.fillStyle = '#060707';
      ctx.beginPath(); ctx.moveTo(150, GROUND - 4); ctx.lineTo(150, 440); ctx.arc(250, 440, 100, Math.PI, 0); ctx.lineTo(350, GROUND - 4); ctx.fill();
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI + (Math.PI / 12) * i;
        ctx.save(); ctx.translate(250 + Math.cos(a) * 108, 440 + Math.sin(a) * 108); ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = i === 6 ? '#8a8476' : (i % 2 ? '#6e695e' : '#625d53'); ctx.fillRect(-11, -9, 22, i === 6 ? 24 : 18);
        ctx.restore();
      }
      ctx.font = '600 10px Georgia, serif'; ctx.fillStyle = 'rgba(30,28,24,0.8)'; ctx.textAlign = 'center'; ctx.fillText('MDCCCXXX', 250, 326);
      ctx.fillStyle = '#1a1d1c';
      for (let x = 160; x < 345; x += 14) { ctx.save(); ctx.translate(x, 430); ctx.rotate(x > 230 && x < 290 ? 0.25 : 0); ctx.fillRect(0, 0, 5, GROUND - 434); ctx.restore(); }
      ctx.fillStyle = '#060707'; ctx.fillRect(226, 470, 44, GROUND - 474);
      A.stain(ctx, 140, 330, 220, GROUND - 330, { seed: 7, alpha: 0.6, tint: 'rgba(40,60,40,0.4)' });
      for (let i = 0; i < 9; i++) { ctx.fillStyle = 'rgba(40,70,46,0.7)'; ctx.fillRect(160 + i * 20, 430 + (i % 3) * 6, 5, 40 + (i % 4) * 18); }
      // mud flat
      const mudTop = GROUND - 8;
      A.vgrad(ctx, 0, mudTop, WIDTH, 720 - mudTop, [[0, '#2e271f'], [0.4, '#1f1a15'], [1, '#110f0c']]);
      A.stain(ctx, 0, mudTop, WIDTH, 720 - mudTop, { seed: 5, alpha: 0.6, scale: 12 });
      // the ditch water is painted over the mud (V4-11): it comes out of the culvert mouth, a pool under the arch that thins into a tongue
      ctx.fillStyle = dusk ? '#221d18' : '#0b1210';
      // its back edge runs along the foot of the arch, where the drips from the vault fall (Drip, below)
      ctx.beginPath(); ctx.moveTo(150, GROUND - 2); ctx.lineTo(350, GROUND - 2);
      ctx.quadraticCurveTo(410, GROUND + 14, 480, GROUND + 30); ctx.quadraticCurveTo(410, GROUND + 36, 330, GROUND + 36);
      ctx.quadraticCurveTo(230, GROUND + 42, 150, GROUND + 8); ctx.fill();
      ctx.fillStyle = dusk ? 'rgba(220,150,100,0.15)' : 'rgba(80,140,120,0.15)'; ctx.fillRect(190, GROUND + 16, 110, 2); ctx.fillRect(300, GROUND + 28, 90, 2);
      const r = rng(23);
      for (let i = 0; i < 110; i++) { // stones, bones, bottle glass, clay pipe stems
        const x = r.range(0, WIDTH), y = r.range(mudTop + 10, 720), s = r.range(2, 8);
        ctx.fillStyle = r.pick(['#4a4640', '#3a3632', '#6a6656', '#2a3a34', '#7a7266', '#b8b0a0']);
        ctx.beginPath(); ctx.ellipse(x, y, s * 1.4, s * 0.6, r.range(-0.4, 0.4), 0, Math.PI * 2); ctx.fill();
        if (r.chance(0.15)) { ctx.fillStyle = '#c9c0ae'; ctx.fillRect(x + 6, y - 1, 12, 2); }
      }
      for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(170,180,170,0.1)'; ctx.fillRect(r.range(0, WIDTH), r.range(mudTop + 6, 700), r.range(20, 70), 2); }
      // a coil of rope, a length of chain, a rusted anchor
      ctx.strokeStyle = '#4a3e2a'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(620, GROUND + 40, 26 - k * 6, 8 - k * 2, 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 3; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.ellipse(1300 + k * 10, GROUND + 64 + Math.sin(k) * 3, 6, 3, 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#2a1e18'; ctx.fillRect(1500, GROUND + 18, 6, 50); ctx.beginPath(); ctx.arc(1503, GROUND + 66, 22, 0, Math.PI); ctx.lineWidth = 6; ctx.strokeStyle = '#2a1e18'; ctx.stroke(); ctx.fillRect(1488, GROUND + 24, 30, 5);
      // the rotting ribs of a wherry, half sunk in the mud
      ctx.strokeStyle = '#2a1e16'; ctx.lineWidth = 7;
      for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(760 + k * 26, GROUND + 70, 40 - Math.abs(k - 2.5) * 6, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(720, GROUND + 52); ctx.quadraticCurveTo(830, GROUND + 30, 920, GROUND + 56); ctx.stroke();
      // rotten jetty with cross-braces and a ladder
      for (let i = 0; i < 6; i++) {
        const x = 900 + i * 120;
        ctx.fillStyle = shade(P.woodDark, 0.8 + (i % 2) * 0.15);
        ctx.fillRect(x, WATER_Y - 60 + (i % 3) * 10, 22, GROUND - WATER_Y + 70);
        ctx.fillStyle = 'rgba(30,60,40,0.65)'; ctx.fillRect(x, GROUND - 70, 22, 70);
        ctx.fillStyle = 'rgba(255,230,200,0.06)'; ctx.fillRect(x + 2, WATER_Y - 50, 3, 110);
        if (i < 5) { ctx.strokeStyle = shade(P.woodDark, 0.7); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + 22, WATER_Y - 40); ctx.lineTo(x + 120, GROUND - 90); ctx.stroke(); }
      }
      ctx.fillStyle = P.woodDark; ctx.fillRect(880, WATER_Y - 70, 740, 16);
      for (let x = 884; x < 1620; x += 20) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x, WATER_Y - 70, 2, 16); }
      ctx.fillStyle = shade(P.woodDark, 1.2); for (let y = WATER_Y - 50; y < GROUND - 20; y += 22) ctx.fillRect(1590, y, 26, 4);
      ctx.fillRect(1588, WATER_Y - 54, 4, GROUND - WATER_Y + 30); ctx.fillRect(1614, WATER_Y - 54, 4, GROUND - WATER_Y + 30);
      // the water's edge on the right: mud slopes into the river
      ctx.fillStyle = dusk ? '#3a2e28' : '#0b1415';
      ctx.beginPath(); ctx.moveTo(1780, GROUND - 6); ctx.quadraticCurveTo(1900, GROUND + 20, WIDTH, GROUND + 10); ctx.lineTo(WIDTH, 720); ctx.lineTo(1700, 720); ctx.fill();
      ctx.fillStyle = dusk ? 'rgba(230,160,100,0.2)' : 'rgba(90,160,140,0.15)'; ctx.fillRect(1800, GROUND + 4, 260, 2); ctx.fillRect(1840, GROUND + 30, 200, 2);
      // stone stair up to Narrow Street, with a side wall and iron handrail
      profileStairs(ctx, 168, GROUND, 4, GROUND - 290, { count: 10, stone: '#6a655a', wall: '#2a2724', seed: 31 });
    });
    layers.push({ canvas: near, parallax: 1, kind: 'near' });
    if (dusk) lights.push({ x: 1400, y: 300, r: 1400, color: [0.5, 0.32, 0.2], intensity: 0.5, halo: 0, reflect: false });
    else {
      lights.push({ id: 'ditch', x: 250, y: 520, r: 520, color: P.reef, intensity: 0.0, flicker: 0.1, halo: 90, haloK: 0.0, reflect: false });
      lights.push({ x: 300, y: 80, r: 260, color: P.gas, intensity: 0.5, flicker: 0.05, halo: 60, shaft: true, shaftW: 60 });
    }
    lights.push({ x: 197, y: 45, r: 160, color: P.candle, intensity: 0.35, flicker: 0.2, halo: 30 });
    const fg = R.paintLayer(WIDTH * 1.25, (ctx) => {
      ctx.fillStyle = '#040404';
      ctx.beginPath(); ctx.moveTo(0, 720); ctx.lineTo(0, 640); ctx.quadraticCurveTo(200, 610, 360, 720); ctx.fill();
      ctx.fillRect(2200, 380, 28, 340); ctx.fillRect(2160, 400, 110, 10);
      ctx.strokeStyle = '#040404'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(2214, 400); ctx.quadraticCurveTo(2300, 560, 2400, 520); ctx.stroke();
    });
    layers.push({ canvas: fg, parallax: 1.25, kind: 'fg' });
    return { layers, lights };
  },

  makeLife(G) {
    const dusk = is1866(G);
    const list = [
      new Glints(dusk),
      new Drip({ x: 230, y: 470, ground: GROUND - 2, period: 1.7 }),
      new Drip({ x: 270, y: 470, ground: GROUND - 2, period: 2.3 }),
      new Crow({ x: 1150, y: WATER_Y - 70, facing: -1, seed: 6 }),
      new Ripples({ x: 1900, y: GROUND + 20, w: 200, n: 3 }),
    ];
    if (dusk) list.push(new Gulls());
    else list.push(new Rat({ x0: 300, x1: 900, y: GROUND + 30, seed: 9 }), new Smoke({ x: 120, y: -60, rate: 0.7 }));
    return list;
  },

  update(G, dt) {
    this._t = (this._t || 0) + dt;
    if (Math.random() < dt * 0.3) G.audio.drip();
    const d = G.light('ditch');
    if (d) {
      const target = G.flag('ditch_glow') || 0;
      d.intensity += ((target ? 0.9 + Math.sin(this._t * 1.3) * 0.25 : 0) - d.intensity) * Math.min(1, dt * 0.8);
      d.haloK = d.intensity;
    }
  },

  drawGlow(ctx, t) {
    // slow ripples on the river and, when the Host is near, a green light under the surface
    const G = this.G;
    if (G && is1866(G) && !G.flag('boat')) {
      // the wet sail catches the last of the light every few seconds
      const k = (t % 3.2) / 3.2;
      if (k < 0.3) {
        const a = Math.sin((k / 0.3) * Math.PI) * 0.8;
        ctx.fillStyle = `rgba(255,236,200,${a})`;
        ctx.fillRect(1130 + 16, GROUND + 30 - 62, 4, 22); ctx.fillRect(1130 + 7, GROUND + 30 - 53, 22, 4);
      }
    }
    // frayed, the Ditch's green shows in the river even when nothing calls (a signal, not evidence)
    if (G && (G.flag('water_light') || (G.flag('fs_1888') && perception.waterGlow(G.state.sanity)))) {
      const x = 1500 + Math.sin(t * 0.2) * 200;
      const g = ctx.createRadialGradient(x, 560, 4, x, 560, 260);
      const k = 0.5 + Math.sin(t * 1.7) * 0.15;
      g.addColorStop(0, `rgba(60,230,170,${0.35 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.save(); ctx.translate(0, 560); ctx.scale(1, 0.25); ctx.translate(0, -560); ctx.fillRect(x - 260, 300, 520, 520); ctx.restore();
    }
  },

  drawNear(ctx, t) {
    // Nat's toy boat, half sunk in the mud by the jetty piles: a cigar-box hull and a torn sail
    if (!this.G || !is1866(this.G) || this.G.flag('boat')) return;
    const x = 1130, y = GROUND + 30;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(-0.18); ctx.scale(1.35, 1.35);
    ctx.fillStyle = '#6a4428';
    ctx.beginPath(); ctx.moveTo(-26, -6); ctx.lineTo(24, -6); ctx.lineTo(16, 6); ctx.lineTo(-20, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a5232'; ctx.fillRect(-24, -8, 46, 3);
    ctx.fillStyle = '#c9a860'; ctx.fillRect(-8, -4, 12, 3);           // the cigar-box label
    ctx.fillStyle = '#3a2a1c'; ctx.fillRect(-2, -44, 3, 38);          // mast
    ctx.fillStyle = '#ece4cc';
    ctx.beginPath(); ctx.moveTo(1, -42); ctx.lineTo(20, -12); ctx.lineTo(10, -14); ctx.lineTo(8, -20); ctx.lineTo(1, -10); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#221d18';                                         // mud lapping over the hull
    ctx.beginPath(); ctx.ellipse(x + 2, y + 12, 56, 8, 0, 0, Math.PI * 2); ctx.fill();
  },

  drawNearOver(ctx, t) {
    // the reflection that does not kneel with him
    if (!this.reflection || !this.G) return;
    const p = this.G.player;
    if (!this._ghost) this._ghost = new this.G.Actor('Reflejo', { h: Math.round(206 * (this.G.game.sceneScale ?? 1)), hat: 'top', coat: '#0c0d0e', coatLen: 0.95, flare: 1.25 });
    const g = this._ghost;
    g.x = p.x + 60; g.y = GROUND + 4; g.facing = -1;
    ctx.save();
    ctx.beginPath(); ctx.rect(p.x - 300, GROUND + 4, 600, 200); ctx.clip();
    ctx.translate(0, 2 * (GROUND + 4)); ctx.scale(1, -1);
    g.alpha = 0.55 + Math.sin(t * 2) * 0.1;
    g.draw(ctx, t);
    ctx.restore();
    ctx.fillStyle = `rgba(80,230,170,${0.08 + Math.sin(t * 1.3) * 0.04})`;
    ctx.fillRect(p.x - 300, GROUND + 4, 600, 3);
  },

  async enter(G) { this.G = G; },

  // the moment the evidence is enough: no speech, he looks at his left hand and the lantern gutters
  async onDeduce(G) {
    if (!G.flag('fs_1888') || G.flag('recognized') || !G.game.chapterHooks.finaleReady(G)) return;
    G.flag('recognized', true);
    G.player.pose = 'inspect';
    G.audio.drip(); await G.wait(900);
    G.player.lanternOn = false; await G.wait(500); G.player.lanternOn = true;
    G.audio.whisper(1, 0.05);
    await G.wait(700);
    G.player.pose = null;
    G.objective('Ir al agua.');
  },

  hotspots: [
    {
      id: 'boat', name: 'Algo en el barro', verb: 'Recoger', when: (G) => is1866(G) && !G.flag('boat'), rect: [1070, GROUND - 60, 130, 110], walk: 1040, face: 1,
      act: async (G) => G.game.chapterHooks.prologueBoat(G),
    },
    {
      id: 'outfall', name: 'Desagüe del Black Ditch', rect: [140, 330, 220, GROUND - 330], walk: 400, face: -1,
      act: async (G) => {
        if (is1866(G)) {
          await G.think('El agua está tibia. Nat decía que aquí vivía alguien.');
        } else {
          // the first look in 1888 only, by the engine's own seen mark (no flag of its own): the brick, and
          // when his hearing is already strained, the sound falls away for a moment. Never again after that.
          if (!G.state.seen?.['foreshore:outfall:1888']) {
            await G.think('Ladrillo viejo. El agua sale a borbotones de debajo de la calle.');
            (G.state.seen ||= {})['foreshore:outfall:1888'] = true;
            if (perceptionBand(G.state.sanity) !== 'steady') {
              const bed = G.audio.wantBeds || {};
              const said = G.think('El ruido se calla al acercarme.');
              G.audio.setBeds({}, 0.3);
              G.audio.playMusic(null, 0.3);   // the track falls silent too (F11, «Orilla»)
              await G.wait(1200);
              G.audio.setBeds(bed, 1.5);
              G.audio.playMusic(G.scene.music || null);
              await said;
            }
          }
          await G.game.chapterHooks.outfall1888(G);
        }
      },
    },
    {
      id: 'jetty', name: 'El embarcadero', rect: [900, 400, 640, 120], walk: 1300,
      act: async (G) => {
        if (is1866(G)) await G.think('Nadie supo decir dónde se cayó Nat.');
        else G.audio.drip();   // the same piles, twenty-two years more rotten: nothing to say about them
      },
    },
    {
      id: 'water', name: 'El río', rect: [1700, WATER_Y, 400, 720 - WATER_Y], walk: 1740, face: 1,
      act: async (G) => (is1866(G) ? G.game.chapterHooks.prologueWater(G) : G.game.chapterHooks.finaleWater(G)),
    },
    {
      id: 'stairs', name: 'Escaleras a Narrow Street', cursor: 'exit', rect: [10, 330, 150, 290], walk: 400, face: -1,
      act: async (G) => {
        if (is1866(G)) await G.think('Primero el barco. Nat no lo habría dejado aquí por nada.');
        else G.audio.whistle(0.07, true);   // the whistles up on Narrow Street: nowhere to go back to
      },
    },
  ],
};
