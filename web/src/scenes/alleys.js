// Chapter 3 — the chase. Thomas runs "after the killer" through Whitechapel's courts while the whistles close in on him.
import * as A from '../art/paint.js';
import { stairsDown } from '../art/props.js';
import { facade } from '../art/build.js';
import { P } from '../art/palette.js';
import { Actor } from '../engine/actor.js';
import { rng } from '../art/noise.js';
import { Smoke, Rat, Paper, Drip, Cat } from '../engine/life.js';
import { prefs } from '../engine/prefs.js';
import { drawProp } from '../art/models.js';

const WIDTH = 4200, GROUND = 630;

// Torn, textless bill patches pasted over each other: layered weathered
// paper with a peeling corner. No lettering on purpose: words would be
// illegible at 640x360 and set dressing must not add readable text.
function bills(ctx, x, y, seed, r) {
  const n = r.int(2, 4);
  for (let i = 0; i < n; i++) {
    const bw = r.range(36, 72), bh = r.range(48, 96);
    const bx = x + r.range(-24, 24), by = y + r.range(-16, 16);
    ctx.fillStyle = r.pick(['#8f8466', '#a39478', '#7c7058', '#9a8e72']);
    ctx.fillRect(bx, by, bw, bh);
    A.stain(ctx, bx, by, bw, bh, { seed: seed + i, alpha: 0.55 });
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.moveTo(bx + bw, by + bh); ctx.lineTo(bx + bw - 16, by + bh); ctx.lineTo(bx + bw - 3, by + bh - 20); ctx.fill();
  }
  A.grit(ctx, x - 24, y - 16, 130, 120, { seed, density: 0.5 });
}

export default {
  id: 'alleys',
  width: WIDTH,
  groundY: GROUND,
  space: 'alley',
  city: null,     // the chase: nothing but the whistles and the running
  noSave: true,
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
    const chimneys = [];
    const sky = R.paintLayer(1280 + (WIDTH - 1280) * 0.1, (ctx, w, h) => {
      A.sky(ctx, w, h, { seed: 91, glow: 'rgba(60,90,90,0.1)', stars: 4 });
    });
    const near = R.paintLayer(WIDTH, (ctx) => {
      const r = rng(17);
      let x = 0, k = 0;
      let prevKind = null, runLen = 0;
      const signs = ['BEDS 4d.', 'MANGLING DONE', 'GOOD BEDS', 'COFFEE 1d.'];
      const plasters = [null, null, '#8a7f6c', '#a39a86', '#6e6656'];
      while (x < WIDTH) {
        const w = r.range(260, 480);
        // never more than two same-material fronts in a row: long runs read as one wall
        let kind = r.chance(0.4) ? 'plaster' : 'brick';
        if (kind === prevKind && runLen >= 2) kind = prevKind === 'brick' ? 'plaster' : 'brick';
        runLen = kind === prevKind ? runLen + 1 : 1;
        prevKind = kind;
        const short = r.chance(0.22);   // a lower court block breaks the cornice line
        const floors = short ? 2 : r.int(2, 3);
        const wins = r.int(1, 3);
        const ls = facade(ctx, {
          x, w, top: short ? r.range(-110, -70) : r.range(-170, -100), base: GROUND - 12, seed: 400 + k,
          floors, windows: wins, roof: !short && r.chance(0.16) ? 'gable' : 'parapet',
          kind, color: kind === 'plaster' ? r.pick(plasters) || undefined : undefined,
          stock: r.chance(0.6), boards: [r.int(0, 8)], broken: [r.int(0, 8)],
          litMap: r.chance(0.45) ? [r.int(0, wins * floors - 1)] : [], figures: [r.int(0, 5)],
          sign: r.chance(0.35) ? { x: r.range(8, 30), text: signs[k % signs.length], w: r.range(100, 140), h: 40 } : null,
        });
        ls.forEach((c) => lights.push({ x: c.x, y: c.y, r: 190, color: P.candle, intensity: 0.4, flicker: 0.25, halo: 24 }));
        chimneys.push(...ls.chimneys);
        if (r.chance(0.5)) {
          const dw = r.range(60, 100), dx = x + w * r.range(0.3, 0.5);
          ctx.fillStyle = '#020202'; ctx.fillRect(dx, GROUND - 218, dw, 206);
          ctx.fillStyle = '#5c574d'; ctx.fillRect(dx - 6, GROUND - 226, dw + 12, 8);
        }
        // weathered bill patches at hand height: no lettering, just paper and peel
        if (r.chance(0.55)) bills(ctx, x + r.range(14, Math.max(15, w - 120)), GROUND - r.range(150, 220), 700 + k, r);
        x += w; k++;
      }
      // laundry lines strung across the court: varied sag, garment counts,
      // sizes and cloth tones so the twelve lines stop reading as one stamp
      const cloth = ['#6a665c', '#4a4440', '#7a7468', '#5a3a32', '#8a857a', '#3d4148', '#71624a', '#54423a'];
      for (let i = 0; i < 12; i++) {
        const lx = i * 360 + 80 + r.range(-30, 30);
        const ly = r.range(185, 235), sag = r.range(28, 58);
        ctx.strokeStyle = '#121212'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(lx + 150, ly + sag, lx + 300, ly + r.range(-8, 8)); ctx.stroke();
        const n = r.chance(0.1) ? 0 : r.int(1, 4);   // an empty line now and then
        let ox = r.range(30, 90);
        for (let g = 0; g < n && ox < 280; g++) {
          const gw = g === 0 && r.chance(0.3) ? r.range(64, 92) : r.range(18, 46);   // now and then a sheet
          const gh = r.range(26, 68);
          const gx = lx + ox, gy = ly + sag * 0.55 + r.range(-4, 6);
          ctx.fillStyle = r.pick(cloth); ctx.fillRect(gx, gy, gw, gh);
          if (r.chance(0.25)) { ctx.fillStyle = 'rgba(200,190,170,0.25)'; ctx.fillRect(gx, gy + gh * 0.3, gw, 3); ctx.fillRect(gx, gy + gh * 0.55, gw, 3); }
          else { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(gx, gy + gh - 6, gw, 6); }
          ctx.fillStyle = '#0c0c0c'; ctx.fillRect(gx + 2, gy - 4, 3, 6); ctx.fillRect(gx + gw - 5, gy - 4, 3, 6);
          ox += gw + r.range(14, 60);
        }
      }
      A.vgrad(ctx, 0, GROUND - 12, WIDTH, 720 - GROUND + 12, [[0, '#2a2622'], [1, '#141210']]);
      A.cobbles(ctx, 0, GROUND + 4, WIDTH, 720 - GROUND - 4, { seed: 93, rows: 8, puddles: 30, litter: 3 });
      ctx.fillStyle = 'rgba(10,14,14,0.85)'; ctx.fillRect(0, GROUND + 40, WIDTH, 10);
      ctx.fillStyle = 'rgba(130,150,150,0.15)'; ctx.fillRect(0, GROUND + 42, WIDTH, 2);
      // barrels, crates and sacks along the walls: jittered spacing and sizes
      for (let i = 0; i < 10; i++) {
        const bx = 300 + i * 390 + r.range(-60, 60);
        const s = r.range(0.85, 1.15);
        if (r.chance(0.5)) A.barrel(ctx, bx, GROUND - 52 * s, 40 * s, 46 * s);
        else A.crate(ctx, bx, GROUND - 56 * s, 60 * s, 48 * s, 500 + i);
        if (r.chance(0.3)) A.sack(ctx, bx + r.range(50, 90), GROUND, 600 + i);
      }
      // side courts: same x as the timed choices, varied widths, signs untouched
      for (const [jx, name, jw] of [[1100, 'WENTWORTH ST', 120], [2200, 'FLOWER & DEAN', 132], [3300, 'THRAWL ST', 108]]) {
        ctx.fillStyle = '#010101'; ctx.fillRect(jx - jw / 2, 160, jw, GROUND - 172);
        // faint cold spill on one jamb so the opening reads as depth, not paint
        ctx.fillStyle = 'rgba(150,170,180,0.07)'; ctx.fillRect(jx - jw / 2, 160, 5, GROUND - 172);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(jx + jw / 2 - 8, 160, 8, GROUND - 172);
        A.streetSign(ctx, jx - 74, 126, name);
      }
      // narrow blind passages between fronts: depth rhythm without a sign,
      // kept clear of junctions and lamps so they never mimic a choice
      for (let g = 0; g < 4; g++) {
        const gx = 500 + r.range(0, WIDTH - 700);
        if ([1100, 2200, 3300].some((jx) => Math.abs(gx - jx) < 190)) continue;
        if ([700, 1800, 2900, 3800].some((lx) => Math.abs(gx - lx) < 110)) continue;
        const gw = r.range(24, 44);
        ctx.fillStyle = '#050505'; ctx.fillRect(gx, 250, gw, GROUND - 262);
        ctx.fillStyle = 'rgba(150,170,180,0.06)'; ctx.fillRect(gx, 250, 3, GROUND - 262);
        ctx.fillStyle = '#3a352c'; ctx.fillRect(gx - 5, 242, gw + 10, 8);
      }
      // bracket lamps, few and far between
      for (const lx of [700, 1800, 2900, 3800]) { const l = A.lampPost(ctx, lx, GROUND, 330, { bracket: true }); lights.push({ x: l.x, y: l.y, r: 360, color: P.gas, intensity: 0.7, flicker: 0.15, halo: 70, shaft: true, shaftW: 90 }); }
      // Scenario 3D: purely scenic sprites (no lights, doors or interaction hotspots).
      // Sprites are loaded only when imported; absent assets leave the original scene intact.
      drawProp(ctx, 'scenario_lantern', 565, GROUND);
      drawProp(ctx, 'scenario_gargoyle', 2525, 300);
      // end: steps down to the culvert
      ctx.fillStyle = '#030404'; ctx.beginPath(); ctx.moveTo(4000, GROUND); ctx.lineTo(4000, GROUND - 120); ctx.arc(4100, GROUND - 120, 100, Math.PI, 0); ctx.lineTo(4200, GROUND); ctx.fill();
      ctx.strokeStyle = '#4a463e'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(4100, GROUND - 120, 106, Math.PI, 0); ctx.stroke();
      stairsDown(ctx, 4010, GROUND + 2, 180, { steps: 7, depth: 80 });
      A.railing(ctx, 3976, GROUND - 70, 34, 60); A.railing(ctx, 4190, GROUND - 70, 34, 60);   // railings either side of the steps
    });
    const fg = R.paintLayer(WIDTH * 1.35, (ctx) => {
      ctx.fillStyle = '#030303';
      const fr = rng(71);   // jittered posts so the foreground stops ticking like a metronome
      for (let x = 700 + fr.range(-60, 60); x < WIDTH * 1.35; x += fr.range(1100, 1500)) {
        ctx.fillRect(x, 0, fr.chance(0.3) ? 26 : 18, 720);
        ctx.fillRect(x - 30, 300 + fr.range(-24, 24), 78, 8);
      }
    });
    return { layers: [{ canvas: sky, parallax: 0.1, kind: 'far' }, { canvas: near, parallax: 1, kind: 'near' }, { canvas: fg, parallax: 1.35, kind: 'fg' }], lights, chimneys };
  },

  makeLife() {
    const b = this.built || {};
    return [
      ...(b.chimneys || []).slice(0, 8).map((c) => new Smoke({ x: c.x, y: c.y, rate: 1, drift: 30 })),
      new Rat({ x0: 600, x1: 2000, y: GROUND + 30, seed: 31 }),
      new Rat({ x0: 2400, x1: 3800, y: GROUND + 30, seed: 32 }),
      new Paper({ x0: 200, x1: 4000, y: GROUND + 70, seed: 33 }),
      new Drip({ x: 1050, y: 170, ground: GROUND + 10, period: 1.6 }),
      new Drip({ x: 2250, y: 170, ground: GROUND + 10, period: 2.2 }),
      new Cat({ x: 1520, y: 196, facing: 1 }),
    ];
  },

  actors() {
    const cops = [];
    for (let i = 0; i < 3; i++) cops.push(new Actor(`Poli${i}`, { x: -200 - i * 120, y: GROUND, h: 210, hat: 'helmet', coat: '#161c30', trousers: '#12151f', coatLen: 0.8, flare: 1.02, belt: true, number: true, facing: 1, lantern: true, lanternOn: true, speed: 240, moustache: i === 1 ? '#3a2a1e' : null }));
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
      { x: 1100, at: 'wentworth', q: '¿Por dónde? En Wentworth Street se mueve una linterna de policía.', opts: ['Seguir recto, hacia las farolas.', 'Meterse por Wentworth Street.'], good: 0 },
      { x: 2200, at: 'flower_dean', q: 'Un silbato delante. Me están cortando el paso. Si me paro, me alcanzan.', opts: ['Agacharse detrás de los barriles.', 'Seguir corriendo.'], good: 1 },
      { x: 3300, at: 'thrawl', q: 'Thrawl Street. Mi casa está ahí. Si entro, sabrán dónde vivo.', opts: ['Ir a casa.', 'Seguir hacia el río.'], good: 1 },
    ];
    G.objective('Alcanzar al abrigo oscuro.');
    // every wrong turn is kept: 0 clean, 1-2 spotted (a constable saw his face), 3 injured (a wall)
    let mistakes = 0;
    const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    for (const j of junctions) {
      await G.walk(j.x - 80, { speed: 300 });
      G.audio.whistle(0.12);
      // the question is shown, and the clock leaves time to read it (more with slower text): the base is the shot table's 4.6 s (5.6 s on touch)
      const time = Math.round(((touch ? 5600 : 4600) + 45 * (j.q.length + j.opts.join('').length)) * Math.max(1, prefs.text));
      const c = await G.choice(j.opts, { timeout: time, def: 1 - j.good, prompt: j.q });
      if (c !== j.good) {
        mistakes++;
        if (!G.state.flags.chase_seen_at) G.state.flags.chase_seen_at = j.at;   // where the first error happened
        this.gap -= 140;
        G.shake(8); G.sanity(-3);
        G.audio.whistle(0.16);   // a dead end, a lantern, a constable at the door: the whistles close in
        G.player.x -= 60;
      }
    }
    G.state.flags.chase_mistakes = mistakes;
    G.state.flags.chase_outcome = mistakes === 0 ? 'clean' : mistakes < 3 ? 'spotted' : 'injured';
    await G.walk(4030, { speed: 300 });
    this.chasing = false;
    // down the steps into the culvert, into the dark
    G.player.speed = 120;
    const down = G.stairs(4110, GROUND + 74, { steps: 6, speed: 60 });
    for (let i = 0; i < 24; i++) { G.player.alpha = 1 - i / 30; await G.wait(70); }
    await down;
    await G.game.chapterHooks.endChase(G);
  },

  leave() { this.chasing = false; },
};
