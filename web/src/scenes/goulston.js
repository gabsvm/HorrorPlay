// Chapter 3 — Goulston Street, 30 September, 2:55 AM. The doorway of the Wentworth Model Dwellings.
import * as A from '../art/paint.js';
import { stairwellUp, doorSteps, apronPiece } from '../art/props.js';
import { nightBackdrop, facade } from '../art/build.js';
import { P } from '../art/palette.js';
import { Actor } from '../engine/actor.js';
import { Smoke, Drip, Rat, Cat, Moths, Ripples } from '../engine/life.js';

const WIDTH = 1900, GROUND = 628;

export default {
  id: 'goulston',
  width: WIDTH,
  groundY: GROUND,
  space: 'alley',
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
    const chimneys = [];
    const near = R.paintLayer(WIDTH, (ctx) => {
      const left = facade(ctx, { x: 0, w: 520, top: -120, base: GROUND - 12, seed: 301, floors: 3, windows: 3, roof: 'parapet', stock: true, shopfront: { name: 'J. LEVY · FAMILY BUTCHER', color: '#2a1612', fascia: '#1a0e0c' } });
      chimneys.push(...left.chimneys);
      // empty meat hooks in the butcher's window
      ctx.fillStyle = P.iron; ctx.fillRect(30, GROUND - 156, 220, 3);
      for (let i = 0; i < 9; i++) { ctx.fillRect(40 + i * 24, GROUND - 153, 2, 10); ctx.beginPath(); ctx.arc(41 + i * 24, GROUND - 140, 4, 0, Math.PI); ctx.lineWidth = 2; ctx.strokeStyle = P.iron; ctx.stroke(); }
      // Wentworth Model Dwellings: tall, regular, institutional, with a dated plaque
      A.brickWall(ctx, 520, -120, 900, GROUND + 108, { seed: 302, palette: ['#5a4434', '#544032', '#5e4838'], soot: 0.7 });
      for (let f = 0; f < 3; f++) { const y = GROUND - 12 - (f + 1) * 232; ctx.fillStyle = '#6a655a'; ctx.fillRect(520, y, 900, 7); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(520, y + 7, 900, 3); }
      for (let f = 0; f < 4; f++) for (let i = 0; i < 6; i++) {
        if (f === 3 && (i === 2 || i === 3)) continue;
        const c = A.windowFrame(ctx, 548 + i * 145, GROUND - 12 - (3 - f) * 232 - 196 + (f === 3 ? 20 : 0), 72, 150, { seed: 310 + f * 6 + i, lit: (f === 1 && i === 4) || (f === 0 && i === 1), figure: f === 1 && i === 4, curtain: true, net: true });
        if (c) lights.push({ x: c.x, y: c.y, r: 180, color: P.candle, intensity: 0.5, flicker: 0.2, halo: 30 });
      }
      ctx.fillStyle = '#7a7466'; ctx.fillRect(900, 346, 100, 30); ctx.fillStyle = '#2a2620'; ctx.font = '600 12px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('WENTWORTH', 950, 359); ctx.fillText('DWELLINGS 1886', 950, 372);
      // the open stairwell doorway, Nos. 108–119
      stairwellUp(ctx, 880, GROUND - 260, 140, 236, { steps: 10 });
      doorSteps(ctx, 950, GROUND - 10, { count: 1, rise: 12, width: 140, grow: 0, depth: 6, stone: '#5e5a52' });
      ctx.fillStyle = '#6a655a'; ctx.fillRect(864, GROUND - 276, 172, 18); ctx.fillRect(864, GROUND - 258, 16, 246); ctx.fillRect(1020, GROUND - 258, 16, 246);
      ctx.fillStyle = 'rgba(255,240,220,0.08)'; ctx.fillRect(864, GROUND - 276, 172, 2); ctx.fillRect(864, GROUND - 258, 2, 246);
      ctx.font = '600 16px "IM Fell English SC", Georgia, serif'; ctx.fillStyle = 'rgba(200,190,160,0.7)'; ctx.textAlign = 'center';
      ctx.fillText('108 – 119', 950, GROUND - 262);

      const right = facade(ctx, { x: 1420, w: 480, top: -90, base: GROUND - 12, seed: 303, floors: 3, windows: 2, roof: 'parapet', boards: [1], pawn: 380, stock: true });
      chimneys.push(...right.chimneys);
      A.streetSign(ctx, 1456, 252, 'GOULSTON STREET');
      A.poster(ctx, 1204, 470, 64, 84, [['LOST', 13], ['TERRIER', 9], ['REWARD', 9]], { seed: 77, tilt: 0.03, color: '#c4b892' });
      A.wires(ctx, 520, 30, 1430, 230, { count: 2, sag: 70 });
      A.flagstones(ctx, 0, GROUND - 12, WIDTH, 18);
      A.kerb(ctx, 0, GROUND + 6, WIDTH);
      A.cobbles(ctx, 0, GROUND + 22, WIDTH, 720 - GROUND - 22, { seed: 72, rows: 9, puddles: 14, litter: 2 });
      A.bollard(ctx, 1100, GROUND - 4);
      // the gas jet on the first landing of the stairwell throws a little light down to the doorway
      lights.push({ id: 'stairgas', x: 965, y: GROUND - 210, r: 240, color: P.gas, intensity: 0.55, flicker: 0.1, halo: 16, haloK: 0.5, reflect: false });
      const lamp = A.lampPost(ctx, 380, GROUND, 320);
      lights.push({ x: lamp.x, y: lamp.y, r: 420, color: P.gas, intensity: 0.8, flicker: 0.12, halo: 100, shaft: true });
    });
    layers.push({ canvas: near, parallax: 1, kind: 'near' });
    const fg = R.paintLayer(WIDTH * 1.3, (ctx) => {
      ctx.fillStyle = '#040405';
      ctx.fillRect(700, 650, 40, 70); ctx.fillRect(692, 642, 56, 12); ctx.fillRect(2300, 0, 160, 720);
    });
    layers.push({ canvas: fg, parallax: 1.3, kind: 'fg' });
    return { layers, lights, chimneys };
  },

  makeLife() {
    const b = this.built || {};
    return [
      ...(b.chimneys || []).map((c) => new Smoke({ x: c.x, y: c.y, rate: 0.9 })),
      new Drip({ x: 900, y: GROUND - 272, ground: GROUND - 8, period: 1.9 }),
      new Drip({ x: 1006, y: GROUND - 272, ground: GROUND - 8, period: 2.7 }),
      new Rat({ x0: 400, x1: 1400, y: GROUND + 16, seed: 21 }),
      new Cat({ x: 1460, y: 210, facing: -1 }),
      new Moths({ x: 380, y: GROUND - 300 }),
      new Ripples({ x: 600, y: GROUND + 60, w: 220 }),
      new Ripples({ x: 1250, y: GROUND + 80, w: 180, n: 4 }),
    ];
  },

  drawNear(ctx) {
    if (!this.G?.flag('apron_found')) {
      apronPiece(ctx, 920, GROUND - 20);
    }
    if (this.G?.flag('chalk_seen')) A.chalk(ctx, 1040, GROUND - 210, 'HERE I AM', { size: 30, rot: 0.05 });
  },

  drawGlow(ctx, t) {
    // the chalk catches the lantern light and seems to hold it
    if (!this.G?.flag('chalk_seen')) return;
    ctx.save();
    ctx.globalAlpha = 0.22 + Math.sin(t * 1.4) * 0.06;
    A.chalk(ctx, 1040, GROUND - 210, 'HERE I AM', { size: 30, rot: 0.05 });
    ctx.restore();
  },

  async enter(G) {
    this.G = G;
    if (G.flag('go_intro')) return;
    G.flag('go_intro', true);
    G.date(null, '2:55');
    G.objective('Examinar el portal de los Wentworth Buildings.');
  },

  hotspots: [
    {
      id: 'doorway', name: 'Portal de la escalera', rect: [870, GROUND - 270, 160, 300], walk: 860, face: 1,
      act: async (G) => {
        if (G.flag('apron_found')) {  return; }
        G.player.pose = 'kneel';
        G.flag('apron_found', true);
        G.player.pose = 'reach';
        await G.wait(500);
        await G.think(G.two('Tiza en la jamba: HERE I AM.', 'Tiza, letra inclinada. Reconozco la A antes de leer la frase.'));
        G.flag('chalk_seen', true);
        G.audio.sting(0.22); G.mad(0.5);
        if (G.second()) await G.voice('Aquí estoy.');
        else await G.think(G.flag('answered1866') ? 'Lo dije yo. Hace veintidós años.' : 'Yo no respondí entonces. ¿Quién escribió esto?');
        G.clue('aqui_estoy');
        G.sanity(-8);
        G.mad(0);
        G.player.pose = null;
        await G.game.chapterHooks.caught(G);
      },
    },
  ],
};
