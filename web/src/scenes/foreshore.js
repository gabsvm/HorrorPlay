// Limehouse foreshore at low tide, where the Black Ditch empties into the Thames.
// Prologue (1866, dusk, Thomas as a boy) and climax (1888, night).
import * as A from '../art/paint.js';
import { P, shade } from '../art/palette.js';
import { rng } from '../art/noise.js';

const WIDTH = 2100, GROUND = 612, WATER_Y = 470;
const is1866 = (G) => !G.flag('fs_1888');

function farLayers(R, dusk) {
  const sky = R.paintLayer(1280 + (WIDTH - 1280) * 0.15, (ctx, w, h) => {
    if (dusk) A.sky(ctx, w, h, { top: '#0e0d10', mid: '#2a2224', low: '#5a3e30', glow: 'rgba(160,90,50,0.35)', glowY: 0.6, seed: 61 });
    else A.sky(ctx, w, h, { top: '#030405', mid: '#080c0f', low: '#0f1a1c', glow: 'rgba(40,120,100,0.16)', glowY: 0.66, seed: 62 });
    // far bank: Rotherhithe warehouses, masts and cranes
    A.skyline(ctx, { w, baseY: WATER_Y - 6, seed: 9, color: dusk ? '#1d1a1b' : '#0a1012', minH: 30, maxH: 90, cranes: true });
    const r = rng(4);
    ctx.strokeStyle = dusk ? '#1d1a1b' : '#0a1012';
    for (let i = 0; i < 9; i++) {
      const x = r.range(0, w), h2 = r.range(90, 190);
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, WATER_Y - 4); ctx.lineTo(x, WATER_Y - h2); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 30, WATER_Y - h2 + 30); ctx.lineTo(x + 30, WATER_Y - h2 + 30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, WATER_Y - h2); ctx.lineTo(x + 50, WATER_Y - 20); ctx.stroke();
    }
    A.vgrad(ctx, 0, WATER_Y - 160, w, 170, [[0, 'rgba(60,70,70,0)'], [1, dusk ? 'rgba(110,80,60,0.5)' : 'rgba(30,50,50,0.6)']]);
  });
  const river = R.paintLayer(1280 + (WIDTH - 1280) * 0.5, (ctx, w) => {
    // the river itself: flat, heavy, faintly reflecting the sky
    A.vgrad(ctx, 0, WATER_Y, w, 720 - WATER_Y, dusk ? [[0, '#4a3a32'], [0.2, '#2a2422'], [1, '#141212']] : [[0, '#142022'], [0.25, '#0b1314'], [1, '#050808']]);
    const r = rng(8);
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = dusk ? `rgba(200,140,90,${r.range(0.03, 0.12)})` : `rgba(120,170,160,${r.range(0.02, 0.07)})`;
      const y = WATER_Y + Math.pow(r(), 2) * 160;
      ctx.fillRect(r.range(0, w), y, r.range(20, 120), 1.5);
    }
    // a moored lighter (barge) silhouette
    ctx.fillStyle = dusk ? '#151214' : '#060909';
    ctx.beginPath(); ctx.moveTo(w * 0.62, WATER_Y + 24); ctx.lineTo(w * 0.62 + 260, WATER_Y + 24); ctx.lineTo(w * 0.62 + 240, WATER_Y + 46); ctx.lineTo(w * 0.62 + 16, WATER_Y + 46); ctx.fill();
    ctx.fillRect(w * 0.62 + 120, WATER_Y - 40, 4, 64);
  });
  return [{ canvas: sky, parallax: 0.15, kind: 'far' }, { canvas: river, parallax: 0.5, kind: 'far' }];
}

export default {
  id: 'foreshore',
  width: WIDTH,
  groundY: GROUND,
  walk: [380, 1760],
  spawn: 520,
  surface: 'mud',
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
      // river wall on the left, with the Black Ditch outfall
      A.brickWall(ctx, 0, 140, 420, GROUND - 140, { seed: 18, palette: ['#3c3430', '#35302c', '#433832'], soot: 0.4, damp: 1 });
      ctx.fillStyle = P.stoneDark; ctx.fillRect(0, 128, 430, 16);
      A.railing(ctx, 0, 100, 420, 30);
      // culvert arch
      ctx.fillStyle = '#060707';
      ctx.beginPath(); ctx.moveTo(150, GROUND - 4); ctx.lineTo(150, 440); ctx.arc(250, 440, 100, Math.PI, 0); ctx.lineTo(350, GROUND - 4); ctx.fill();
      ctx.strokeStyle = shade(P.stone, 0.7); ctx.lineWidth = 14;
      ctx.beginPath(); ctx.arc(250, 440, 107, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = '#1a1d1c';
      for (let x = 160; x < 345; x += 14) ctx.fillRect(x, 430, 5, GROUND - 434); // grating, bent
      ctx.fillStyle = '#060707'; ctx.fillRect(228, 470, 40, GROUND - 474);
      A.stain(ctx, 140, 330, 220, GROUND - 330, { seed: 7, alpha: 0.6, tint: 'rgba(40,60,40,0.4)' });
      // the ditch water running out over the mud
      ctx.fillStyle = dusk ? '#1e1a16' : '#0b1210';
      ctx.beginPath(); ctx.moveTo(200, GROUND); ctx.quadraticCurveTo(420, GROUND + 40, 900, GROUND + 70); ctx.lineTo(900, GROUND + 92); ctx.quadraticCurveTo(400, GROUND + 70, 160, GROUND + 6); ctx.fill();
      // mud flat
      const mudTop = GROUND - 8;
      A.vgrad(ctx, 0, mudTop, WIDTH, 720 - mudTop, [[0, '#2a241e'], [0.4, '#1d1915'], [1, '#110f0c']]);
      A.stain(ctx, 0, mudTop, WIDTH, 720 - mudTop, { seed: 5, alpha: 0.6, scale: 12 });
      const r = rng(23);
      for (let i = 0; i < 80; i++) { // stones, bones, bottles, clay pipes
        const x = r.range(0, WIDTH), y = r.range(mudTop + 10, 720), s = r.range(2, 8);
        ctx.fillStyle = r.pick(['#4a4640', '#3a3632', '#6a6656', '#2a3a34', '#7a7266']);
        ctx.beginPath(); ctx.ellipse(x, y, s * 1.4, s * 0.6, r.range(-0.4, 0.4), 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < 30; i++) { ctx.fillStyle = 'rgba(160,170,160,0.08)'; ctx.fillRect(r.range(0, WIDTH), r.range(mudTop + 6, 700), r.range(20, 70), 1.5); }
      // rotten jetty piles
      for (let i = 0; i < 6; i++) {
        const x = 900 + i * 120;
        ctx.fillStyle = shade(P.woodDark, 0.8 + (i % 2) * 0.15);
        ctx.fillRect(x, WATER_Y - 60 + (i % 3) * 10, 22, GROUND - WATER_Y + 70);
        ctx.fillStyle = 'rgba(30,50,40,0.6)'; ctx.fillRect(x, GROUND - 60, 22, 60);
      }
      ctx.fillStyle = P.woodDark; ctx.fillRect(880, WATER_Y - 66, 740, 14);
      // the water's edge on the right: mud slopes into the river
      ctx.fillStyle = dusk ? '#3a2e28' : '#0b1415';
      ctx.beginPath(); ctx.moveTo(1780, GROUND - 6); ctx.quadraticCurveTo(1900, GROUND + 20, WIDTH, GROUND + 10); ctx.lineTo(WIDTH, 720); ctx.lineTo(1700, 720); ctx.fill();
      // stairs up to Narrow Street at far left
      for (let i = 0; i < 8; i++) { ctx.fillStyle = shade(P.stone, 0.6 + i * 0.04); ctx.fillRect(20 + i * 14, GROUND - 20 - i * 34, 120, 14); }
    });
    layers.push({ canvas: near, parallax: 1, kind: 'near' });
    if (dusk) lights.push({ x: 1400, y: 300, r: 1400, color: [0.5, 0.32, 0.2], intensity: 0.5, halo: 0, reflect: false });
    else {
      lights.push({ id: 'ditch', x: 250, y: 520, r: 520, color: P.reef, intensity: 0.0, flicker: 0.1, halo: 90, haloK: 0.0, reflect: false });
      lights.push({ x: 300, y: 80, r: 260, color: P.gas, intensity: 0.5, flicker: 0.05, halo: 60 });
    }
    const fg = R.paintLayer(WIDTH * 1.25, (ctx) => {
      ctx.fillStyle = '#040404';
      ctx.beginPath(); ctx.moveTo(0, 720); ctx.lineTo(0, 640); ctx.quadraticCurveTo(200, 610, 360, 720); ctx.fill();
      ctx.fillRect(2200, 380, 28, 340); ctx.fillRect(2160, 400, 110, 10);
    });
    layers.push({ canvas: fg, parallax: 1.25, kind: 'fg' });
    return { layers, lights };
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
    if (G && G.flag('water_light')) {
      const x = 1500 + Math.sin(t * 0.2) * 200;
      const g = ctx.createRadialGradient(x, 560, 4, x, 560, 260);
      const k = 0.5 + Math.sin(t * 1.7) * 0.15;
      g.addColorStop(0, `rgba(60,230,170,${0.35 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.save(); ctx.translate(0, 560); ctx.scale(1, 0.25); ctx.translate(0, -560); ctx.fillRect(x - 260, 300, 520, 520); ctx.restore();
    }
  },

  drawNearOver(ctx, t) {
    // the reflection that does not kneel with him
    if (!this.reflection || !this.G) return;
    const p = this.G.player;
    if (!this._ghost) this._ghost = new this.G.Actor('Reflejo', { h: 206, hat: 'top', coat: '#0c0d0e', coatLen: 0.95, flare: 1.25 });
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

  hotspots: [
    {
      id: 'boat', name: 'Algo en el barro', when: (G) => is1866(G) && !G.flag('boat'), rect: [1090, GROUND + 10, 80, 40], walk: 1060, face: 1,
      act: async (G) => G.game.chapterHooks.prologueBoat(G),
    },
    {
      id: 'outfall', name: 'Desagüe del Black Ditch', rect: [140, 330, 220, GROUND - 330], walk: 400, face: -1,
      act: async (G) => {
        if (is1866(G)) {
          await G.think('El agua que sale de ahí es negra y está tibia, aunque sea octubre. Mamá dice que no me acerque.');
          await G.think('Nat decía que ahí dentro vive alguien.');
        } else await G.game.chapterHooks.outfall1888(G);
      },
    },
    {
      id: 'water', name: 'El río', rect: [1700, WATER_Y, 400, 720 - WATER_Y], walk: 1740, face: 1,
      act: async (G) => (is1866(G) ? G.game.chapterHooks.prologueWater(G) : G.game.chapterHooks.finaleWater(G)),
    },
    {
      id: 'stairs', name: 'Escaleras a Narrow Street', cursor: 'exit', rect: [10, 330, 150, 290], walk: 400, face: -1,
      act: async (G) => {
        if (is1866(G)) await G.think('Todavía no. Hoy no me voy sin él.');
        else await G.think('Arriba están los silbatos. No hay a dónde volver.');
      },
    },
  ],
};
