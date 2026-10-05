// Chapter 3 — the chase. Thomas runs "after the killer" through Whitechapel's courts while the whistles close in on him.
import * as A from '../art/paint.js';
import { facade } from '../art/build.js';
import { P } from '../art/palette.js';
import { Actor } from '../engine/actor.js';
import { rng } from '../art/noise.js';

const WIDTH = 4200, GROUND = 630;

export default {
  id: 'alleys',
  width: WIDTH,
  groundY: GROUND,
  walk: [100, 4100],
  spawn: 160,
  lantern: true,
  ambient: [0.016, 0.02, 0.03],
  fog: { density: 0.75, amount: 0.6, color: [0.3, 0.36, 0.4], speed: 18 },
  rain: 0.5,
  wet: 1.2,
  beds: { rain: 0.5, drone: 0.3, heart: 0.8 },
  music: 'chase',

  build(R) {
    const lights = [];
    const sky = R.paintLayer(1280 + (WIDTH - 1280) * 0.1, (ctx, w, h) => {
      A.sky(ctx, w, h, { seed: 91, glow: 'rgba(60,90,90,0.1)' });
    });
    const near = R.paintLayer(WIDTH, (ctx) => {
      const r = rng(17);
      let x = 0, k = 0;
      while (x < WIDTH) {
        const w = r.range(260, 480);
        facade(ctx, { x, w, top: r.range(30, 140), base: GROUND - 12, seed: 400 + k, floors: 3, windows: r.int(1, 3), roof: 'parapet', kind: r.chance(0.4) ? 'plaster' : 'brick', boards: [r.int(0, 6)], broken: [r.int(0, 6)] });
        if (r.chance(0.5)) { ctx.fillStyle = '#020202'; ctx.fillRect(x + w * 0.4, GROUND - 200, 70, 188); }
        x += w; k++;
      }
      // laundry lines strung across the court
      ctx.strokeStyle = '#121212'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) {
        const lx = i * 360 + 80;
        ctx.beginPath(); ctx.moveTo(lx, 200); ctx.quadraticCurveTo(lx + 150, 250, lx + 300, 196); ctx.stroke();
        ctx.fillStyle = ['#6a665c', '#4a4440', '#7a7468'][i % 3]; ctx.fillRect(lx + 90, 228, 40, 60); ctx.fillRect(lx + 180, 232, 30, 44);
      }
      A.vgrad(ctx, 0, GROUND - 12, WIDTH, 720 - GROUND + 12, [[0, '#2a2622'], [1, '#141210']]);
      A.cobbles(ctx, 0, GROUND + 4, WIDTH, 720 - GROUND - 4, { seed: 93, rows: 8, puddles: 30 });
      // central gutter
      ctx.fillStyle = 'rgba(10,14,14,0.8)'; ctx.fillRect(0, GROUND + 40, WIDTH, 10);
      // three junction mouths
      for (const jx of [1100, 2200, 3300]) { ctx.fillStyle = '#010101'; ctx.fillRect(jx - 60, 160, 120, GROUND - 172); A.streetSign(ctx, jx - 70, 130, ['WENTWORTH ST', 'FLOWER & DEAN', 'THRAWL ST'][[1100, 2200, 3300].indexOf(jx)]); }
      // end: steps down to the culvert
      ctx.fillStyle = '#010202'; ctx.fillRect(4000, GROUND - 160, 200, 200);
      for (let i = 0; i < 5; i++) { ctx.fillStyle = `rgba(70,70,64,${0.6 - i * 0.1})`; ctx.fillRect(4010 + i * 14, GROUND - 10 + i * 12, 140, 8); }
    });
    for (let i = 0; i < 6; i++) lights.push({ x: 500 + i * 700, y: 300 + (i % 2) * 60, r: 220, color: P.candle, intensity: 0.35, flicker: 0.3, halo: 26, haloK: 0.4 });
    const fg = R.paintLayer(WIDTH * 1.35, (ctx) => {
      ctx.fillStyle = '#030303';
      for (let x = 400; x < WIDTH * 1.35; x += 900) ctx.fillRect(x, 0, 40 + (x % 3) * 20, 720);
    });
    return { layers: [{ canvas: sky, parallax: 0.1, kind: 'far' }, { canvas: near, parallax: 1, kind: 'near' }, { canvas: fg, parallax: 1.35, kind: 'fg' }], lights };
  },

  actors() {
    const cops = [];
    for (let i = 0; i < 3; i++) cops.push(new Actor(`Poli${i}`, { x: -200 - i * 120, y: GROUND, h: 210, hat: 'helmet', coat: '#1a1d26', coatLen: 0.82, facing: 1, lantern: true, lanternOn: true, speed: 240 }));
    return cops;
  },

  update(G, dt) {
    if (!this.chasing) return;
    // pursuers hold a gap that shrinks with every wrong turn
    this.gap = Math.max(140, this.gap);
    G.game.actors.forEach((a, i) => {
      if (!a.name.startsWith('Poli')) return;
      const target = G.player.x - this.gap - i * 90;
      if (a.x < target - 4) { a.walkTo(target); } else a.stop();
    });
    this.t = (this.t || 0) + dt;
    if (this.t > 1.6) { this.t = 0; G.audio.whistle(0.06 + Math.max(0, (500 - this.gap) / 500) * 0.12, this.gap > 400); }
  },

  async enter(G) {
    this.G = G;
    this.chasing = true;
    this.gap = 520;
    G.player.speed = 260;
    const junctions = [
      { x: 1100, q: '¿Por dónde?', opts: ['Seguir recto, hacia la luz.', 'Meterse por Wentworth Street.'], good: 0, bad: 'Un patio cerrado, con una pared de diez pies. Vuelvo atrás.' },
      { x: 2200, q: 'Un silbato delante. Me están cortando el paso.', opts: ['Agacharse detrás de los barriles.', 'Seguir corriendo.'], good: 1, bad: 'Me agacho y un farol pasa a dos pasos de mí. Cuando se aleja, se han acercado los otros.' },
      { x: 3300, q: 'Thrawl Street. Mi casa está ahí.', opts: ['Ir a casa.', 'Seguir hacia el río.'], good: 1, bad: 'En mi puerta hay un agente. Doy media vuelta antes de que me vea.' },
    ];
    await G.think('Lo veo al final de la calle: un abrigo oscuro corriendo, igual que yo. Tengo que alcanzarlo.');
    for (const j of junctions) {
      await G.walk(j.x - 80, { speed: 300 });
      G.audio.whistle(0.12);
      const c = await G.choice(j.opts, { timeout: 4200, def: 1 - j.good });
      if (c !== j.good) {
        this.gap -= 140;
        G.shake(8); G.sanity(-3);
        await G.say('Ashgrove', j.bad, { style: 'thought', auto: 1600 });
        G.player.x -= 60;
      }
    }
    await G.walk(4040, { speed: 300 });
    this.chasing = false;
    await G.game.chapterHooks.endChase(G);
  },

  leave() { this.chasing = false; },
};
