// Epilogue — Dorset Street, outside the arch to Miller's Court, 9 November 1888, before four in the morning.
import * as A from '../art/paint.js';
import { nightBackdrop, facade } from '../art/build.js';
import { P } from '../art/palette.js';
import { Actor } from '../engine/actor.js';

const WIDTH = 1900, GROUND = 628;

export default {
  id: 'millers',
  width: WIDTH,
  groundY: GROUND,
  reflectY: 640,
  walk: [140, 1240],
  spawn: 160,
  lantern: false,
  ambient: [0.022, 0.028, 0.04],
  fog: { density: 0.85, amount: 0.62, color: [0.3, 0.38, 0.4], speed: 6 },
  rain: 0.6,
  wet: 1.4,
  beds: { rain: 0.6, drone: 0.4, wind: 0.2 },
  music: null,
  date: '9 de noviembre de 1888',

  build(R) {
    const layers = nightBackdrop(R, WIDTH, { seed: 99, horizon: 430, spireX: 600, spireH: 420 });
    const lights = [];
    const near = R.paintLayer(WIDTH, (ctx) => {
      facade(ctx, { x: 0, w: 520, top: 150, base: GROUND - 12, seed: 501, floors: 3, windows: 2, roof: 'parapet', kind: 'plaster', door: 400, litMap: [1] }).forEach((c) => lights.push({ x: c.x, y: c.y, r: 180, color: P.candle, intensity: 0.4, flicker: 0.2, halo: 24 }));
      // McCarthy's chandler's shop with the arch beside it
      facade(ctx, { x: 520, w: 460, top: 120, base: GROUND - 12, seed: 502, floors: 3, windows: 2, roof: 'parapet', shopfront: { name: "J. McCARTHY · CHANDLER", color: '#22160f' } });
      A.brickWall(ctx, 980, 120, 180, GROUND - 132, { seed: 503 });
      ctx.fillStyle = '#010101'; ctx.fillRect(1010, GROUND - 230, 110, 218);
      ctx.fillStyle = P.stoneDark; ctx.fillRect(998, GROUND - 244, 134, 16);
      ctx.font = '600 13px "IM Fell English SC", Georgia, serif'; ctx.fillStyle = 'rgba(200,190,160,0.55)'; ctx.textAlign = 'center';
      ctx.fillText("MILLER'S COURT", 1065, GROUND - 250);
      facade(ctx, { x: 1160, w: 740, top: 170, base: GROUND - 12, seed: 504, floors: 3, windows: 4, roof: 'parapet', boards: [0, 3], broken: [6], door: 560 });
      A.streetSign(ctx, 1200, 210, 'DORSET STREET');
      A.poster(ctx, 1500, 490, 100, 70, [['LODGINGS', 14], ['4d A NIGHT', 12]], { seed: 6 });
      A.flagstones(ctx, 0, GROUND - 12, WIDTH, 18);
      A.kerb(ctx, 0, GROUND + 6, WIDTH);
      A.cobbles(ctx, 0, GROUND + 22, WIDTH, 720 - GROUND - 22, { seed: 98, rows: 9, puddles: 16 });
      const lamp = A.lampPost(ctx, 1320, GROUND, 250);
      lights.push({ x: lamp.x, y: lamp.y, r: 420, color: P.gas, intensity: 0.75, flicker: 0.14, halo: 100 });
    });
    lights.push({ id: 'court', x: 1065, y: GROUND - 120, r: 160, color: P.candle, intensity: 0.0, flicker: 0.3, halo: 20, haloK: 0 });
    layers.push({ canvas: near, parallax: 1, kind: 'near' });
    const fg = R.paintLayer(WIDTH * 1.3, (ctx) => {
      ctx.fillStyle = '#040405'; ctx.fillRect(200, 630, 40, 90); ctx.fillRect(192, 622, 56, 12); ctx.fillRect(2200, 0, 200, 720);
    });
    layers.push({ canvas: fg, parallax: 1.3, kind: 'fg' });
    return { layers, lights };
  },

  actors() {
    return [new Actor('Wren', { x: 1660, y: GROUND, h: 128, hat: 'cap', coat: '#4a4036', skirt: true, facing: -1 })];
  },

  async enter(G) {
    this.G = G;
    await G.game.chapterHooks.epilogue(G);
  },

  hotspots: [],
};
