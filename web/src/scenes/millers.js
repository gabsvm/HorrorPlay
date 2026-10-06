// Epilogue — Dorset Street, outside the arch to Miller's Court, 9 November 1888, before four in the morning.
import * as A from '../art/paint.js';
import { nightBackdrop, facade } from '../art/build.js';
import { P } from '../art/palette.js';
import { Actor } from '../engine/actor.js';
import { Smoke, Drip, Cat, Moths, Ripples } from '../engine/life.js';

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
    const chimneys = [];
    const near = R.paintLayer(WIDTH, (ctx) => {
      // Crossingham's common lodging house
      const lodge = facade(ctx, { x: 0, w: 520, top: 150, base: GROUND - 12, seed: 501, floors: 3, windows: 2, roof: 'parapet', kind: 'plaster', door: 400, number: '35', litMap: [1], figures: [1], ghost: [['LODGINGS FOR MEN', 22], ['FOURPENCE A NIGHT', 16]] });
      lodge.forEach((c) => lights.push({ x: c.x, y: c.y, r: 180, color: P.candle, intensity: 0.4, flicker: 0.2, halo: 24 }));
      chimneys.push(...lodge.chimneys);
      // McCarthy's chandler's shop, and beside it the arch to Miller's Court
      const shop = facade(ctx, { x: 520, w: 460, top: 120, base: GROUND - 12, seed: 502, floors: 3, windows: 2, roof: 'parapet', stock: true, shopfront: { name: 'J. McCARTHY · CHANDLER', color: '#22160f', fascia: '#10140f' } });
      chimneys.push(...shop.chimneys);
      A.brickWall(ctx, 980, 120, 180, GROUND - 132, { seed: 503, palette: A.BRICK.stock });
      // the passage: three feet wide, and at its far end the court, one lamp, one window
      ctx.fillStyle = '#010101'; ctx.fillRect(1030, GROUND - 230, 70, 218);
      A.vgrad(ctx, 1036, GROUND - 200, 58, 190, [[0, 'rgba(20,24,24,0)'], [1, 'rgba(30,34,32,0.8)']]);
      ctx.fillStyle = '#1a1612'; ctx.fillRect(1044, GROUND - 120, 42, 54);
      ctx.fillStyle = '#5c574d'; ctx.fillRect(1020, GROUND - 244, 90, 16); ctx.fillRect(1020, GROUND - 230, 10, 218); ctx.fillRect(1100, GROUND - 230, 10, 218);
      ctx.font = '600 15px "IM Fell English SC", Georgia, serif'; ctx.fillStyle = 'rgba(200,190,160,0.6)'; ctx.textAlign = 'center';
      ctx.fillText("MILLER'S COURT", 1065, GROUND - 252);
      A.poster(ctx, 1118, 380, 34, 80, [['', 4]], { seed: 44, color: '#8f8466', under: false });
      const right = facade(ctx, { x: 1160, w: 740, top: 170, base: GROUND - 12, seed: 504, floors: 3, windows: 4, roof: 'parapet', boards: [0, 3], broken: [6], door: 560, stock: true, sign: { x: 640, text: 'BRITANNIA', w: 110, h: 40, y: 360 } });
      chimneys.push(...right.chimneys);
      A.streetSign(ctx, 1190, 206, 'DORSET STREET');
      A.poster(ctx, 1500, 486, 104, 76, [['VIGILANCE', 14], ['COMMITTEE', 14], ['MILE END', 10]], { seed: 6, tilt: -0.02 });
      A.poster(ctx, 1630, 492, 90, 66, [['£100', 18], ['REWARD', 12]], { seed: 7, tilt: 0.03, color: '#c4b892' });
      A.wires(ctx, 520, 130, 1180, 190, { count: 2, sag: 50 });
      A.flagstones(ctx, 0, GROUND - 12, WIDTH, 18);
      A.kerb(ctx, 0, GROUND + 6, WIDTH);
      A.cobbles(ctx, 0, GROUND + 22, WIDTH, 720 - GROUND - 22, { seed: 98, rows: 9, puddles: 16, litter: 2 });
      A.bollard(ctx, 1210, GROUND - 4);
      const lamp = A.lampPost(ctx, 1320, GROUND, 250);
      lights.push({ x: lamp.x, y: lamp.y, r: 420, color: P.gas, intensity: 0.75, flicker: 0.14, halo: 100, shaft: true });
    });
    lights.push({ id: 'court', x: 1065, y: GROUND - 96, r: 160, color: P.candle, intensity: 0.0, flicker: 0.3, halo: 20, haloK: 0 });
    layers.push({ canvas: near, parallax: 1, kind: 'near' });
    const fg = R.paintLayer(WIDTH * 1.3, (ctx) => {
      ctx.fillStyle = '#040405'; ctx.fillRect(200, 630, 40, 90); ctx.fillRect(192, 622, 56, 12); ctx.fillRect(2200, 0, 200, 720);
    });
    layers.push({ canvas: fg, parallax: 1.3, kind: 'fg' });
    return { layers, lights, chimneys };
  },

  makeLife() {
    const b = this.built || {};
    return [
      ...(b.chimneys || []).map((c) => new Smoke({ x: c.x, y: c.y, rate: 0.7 })),
      new Drip({ x: 1034, y: GROUND - 230, ground: GROUND - 6, period: 1.8 }),
      new Drip({ x: 1096, y: GROUND - 230, ground: GROUND - 6, period: 2.5 }),
      new Cat({ x: 1160, y: 166, facing: -1 }),
      new Moths({ x: 1320, y: GROUND - 230 }),
      new Ripples({ x: 800, y: GROUND + 60, w: 260 }),
      new Ripples({ x: 1400, y: GROUND + 80, w: 220, n: 4 }),
    ];
  },

  actors() {
    return [new Actor('Wren', { x: 1660, y: GROUND, h: 128, hat: 'cap', hatColor: '#2e2a26', coat: '#4a4036', skirt: true, patches: true, shawl: '#3a3a44', hair: '#5a3a22', boots: '#1a1612', facing: -1 })];
  },

  async enter(G) {
    this.G = G;
    await G.game.chapterHooks.epilogue(G);
  },

  hotspots: [],
};
