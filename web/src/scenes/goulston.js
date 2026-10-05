// Chapter 3 — Goulston Street, 30 September, 2:55 AM. The doorway of the Wentworth Model Dwellings.
import * as A from '../art/paint.js';
import { nightBackdrop, facade } from '../art/build.js';
import { P } from '../art/palette.js';
import { Actor } from '../engine/actor.js';

const WIDTH = 1900, GROUND = 628;

export default {
  id: 'goulston',
  width: WIDTH,
  groundY: GROUND,
  reflectY: 640,
  walk: [120, 1500],
  spawn: 160,
  lantern: true,
  ambient: [0.02, 0.026, 0.038],
  fog: { density: 0.6, amount: 0.5, color: [0.32, 0.4, 0.44], speed: 9 },
  rain: 0.45,
  wet: 1.3,
  beds: { rain: 0.55, wind: 0.25, drone: 0.25 },
  music: 'dread',

  build(R) {
    const layers = nightBackdrop(R, WIDTH, { seed: 71, horizon: 420, spireX: 300, spireH: 300 });
    const lights = [];
    const near = R.paintLayer(WIDTH, (ctx) => {
      facade(ctx, { x: 0, w: 520, top: 180, base: GROUND - 12, seed: 301, floors: 3, windows: 3, roof: 'parapet', shopfront: { name: 'GOULSTON ST. BUTCHERS', color: '#2a1612' } });
      // Wentworth Model Dwellings: tall, regular, institutional
      A.brickWall(ctx, 520, 20, 900, GROUND - 32, { seed: 302, palette: ['#5a4434', '#544032', '#5e4838'], soot: 0.7 });
      for (let f = 0; f < 4; f++) for (let i = 0; i < 6; i++) {
        if (f === 3 && (i === 2 || i === 3)) continue;
        A.windowFrame(ctx, 560 + i * 145, 60 + f * 130, 56, 80, { seed: 310 + f * 6 + i, lit: f === 1 && i === 4, curtain: true });
      }
      lights.push({ x: 560 + 4 * 145 + 28, y: 60 + 130 + 40, r: 180, color: P.candle, intensity: 0.5, flicker: 0.2, halo: 30 });
      // the open stairwell doorway, Nos. 108–119
      ctx.fillStyle = '#020202'; ctx.fillRect(880, GROUND - 260, 140, 248);
      ctx.fillStyle = P.stone; ctx.fillRect(864, GROUND - 276, 172, 18); ctx.fillRect(864, GROUND - 258, 16, 246); ctx.fillRect(1020, GROUND - 258, 16, 246);
      ctx.font = '600 14px "IM Fell English SC", Georgia, serif'; ctx.fillStyle = 'rgba(200,190,160,0.6)'; ctx.textAlign = 'center';
      ctx.fillText('108 – 119', 950, GROUND - 264);
      for (let i = 0; i < 5; i++) { ctx.fillStyle = `rgba(60,58,54,${0.5 - i * 0.08})`; ctx.fillRect(900 + i * 6, GROUND - 40 - i * 30, 100 - i * 12, 8); }
      facade(ctx, { x: 1420, w: 480, top: 220, base: GROUND - 12, seed: 303, floors: 3, windows: 2, roof: 'parapet', boards: [1] });
      A.streetSign(ctx, 1460, 260, 'GOULSTON STREET');
      A.flagstones(ctx, 0, GROUND - 12, WIDTH, 18);
      A.kerb(ctx, 0, GROUND + 6, WIDTH);
      A.cobbles(ctx, 0, GROUND + 22, WIDTH, 720 - GROUND - 22, { seed: 72, rows: 9, puddles: 14 });
      const lamp = A.lampPost(ctx, 380, GROUND, 250);
      lights.push({ x: lamp.x, y: lamp.y, r: 420, color: P.gas, intensity: 0.8, flicker: 0.12, halo: 100 });
    });
    layers.push({ canvas: near, parallax: 1, kind: 'near' });
    const fg = R.paintLayer(WIDTH * 1.3, (ctx) => {
      ctx.fillStyle = '#040405';
      ctx.fillRect(700, 0, 44, 720); ctx.fillRect(2300, 0, 160, 720);
    });
    layers.push({ canvas: fg, parallax: 1.3, kind: 'fg' });
    return { layers, lights };
  },

  drawNear(ctx) {
    if (!this.G?.flag('apron_found')) {
      ctx.fillStyle = '#3a2620';
      ctx.beginPath(); ctx.moveTo(920, GROUND - 6); ctx.lineTo(966, GROUND - 14); ctx.lineTo(980, GROUND - 2); ctx.lineTo(930, GROUND + 4); ctx.fill();
    }
    if (this.G?.flag('chalk_seen')) A.chalk(ctx, 1040, GROUND - 200, 'HERE I AM', { size: 22, rot: 0.04 });
  },

  async enter(G) {
    this.G = G;
    if (G.flag('go_intro')) return;
    G.flag('go_intro', true);
    G.date(null, '2:55');
    await G.think('Goulston Street. Hay luz en algunas ventanas de los Wentworth Buildings, y el portal de la escalera está abierto.');
  },

  hotspots: [
    {
      id: 'doorway', name: 'Portal de la escalera', rect: [870, GROUND - 270, 160, 300], walk: 860, face: 1,
      act: async (G) => {
        if (G.flag('apron_found')) { await G.think('Ya no queda nada que ver aquí.'); return; }
        G.player.pose = 'kneel';
        await G.think('En el suelo del portal hay un trozo de tela blanca, empapado y oscuro. Es el delantal.');
        G.flag('apron_found', true);
        G.player.pose = 'reach';
        await G.wait(500);
        await G.think('Al acercar la linterna veo la jamba de ladrillo. Alguien ha escrito algo con tiza, con letra inclinada.');
        G.flag('chalk_seen', true);
        G.audio.sting(0.22); G.mad(0.5);
        await G.voice('Aquí estoy.');
        G.clue('aqui_estoy');
        G.sanity(-8);
        G.mad(0);
        G.player.pose = null;
        await G.game.chapterHooks.caught(G);
      },
    },
    {
      id: 'butcher', name: 'Carnicería', rect: [40, GROUND - 210, 440, 200], walk: 300,
      act: async (G) => { await G.think('Cerrada a cal y canto. En el escaparate cuelgan ganchos vacíos.'); },
    },
  ],
};
