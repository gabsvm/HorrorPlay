// Winthrop Street: Barber's horse-slaughter yard by the railway. Chapter 1 (investigation) and chapter 2 (the mob).
import * as A from '../art/paint.js';
import { stonePost, cattleTrough } from '../art/props.js';
import { nightBackdrop, facade } from '../art/build.js';
import { P } from '../art/palette.js';
import { drawProp, hasProp } from '../art/models.js';
import { Actor } from '../engine/actor.js';
import { Smoke, Drip, Rat, Crow, Moths, Ripples } from '../engine/life.js';
import { canFinishC1 } from '../story/progression.js';

const WIDTH = 2200, GROUND = 628;
const isMob = (G) => G.flag('mob');

// Paying Wren: she won't come near him, so the penny goes on the hitching post and he steps back.
// Started by talking to her or by offering her the penny; Thomas finds the post on his own.
async function payWren(G) {
  G.take('penique');
  G.flag('penique_given', true);
  G.flag('wren_paid', true);
  await G.walk(1660);
  G.player.facing = -1;
  G.audio.tick();
  await G.walk(1860);
  const w = G.actor('Wren');
  await w.walkTo(1610);
  w.pose = 'reach';
  await G.wait(500);
  w.pose = null;
  w.talking = true;
  await G.say('Wren', 'Estaba en la rejilla, antes de que llegara la policía. Brillaba.');
  w.talking = false;
  await w.walkTo(1474);
  w.facing = -1;
  await G.walk(1660);
  G.player.facing = -1;
  await G.game.chapterHooks.takeScalpel(G);
}

export default {
  id: 'knackers',
  width: WIDTH,
  groundY: GROUND,
  space: 'yard',
  // the brazier, Brennan's grindstone while he works it, and the mob's torches
  sounds: [
    { kind: 'fire', x: 1060, vol: 0.9, reach: 1100 },
    { kind: 'grind', x: 1240, vol: 0.8, reach: 900, when: (G) => !!G.actor('Brennan')?.grind },
    ...[1300, 1500, 1700, 1900].map((x) => ({ kind: 'fire', x, vol: 0.45, reach: 700, when: (G) => isMob(G) })),
  ],
  reflectY: 640,
  walk: [120, 2080],
  spawn: 1960,
  lantern: true,
  ambient: [0.03, 0.038, 0.05],
  fog: { density: 0.55, amount: 0.5, color: [0.38, 0.44, 0.46], speed: 8 },
  rain: 0.2,
  wet: 1,
  beds: (G) => (isMob(G) ? { rain: 0.2, wind: 0.2, crowd: 0.75, drone: 0.25 } : { rain: 0.3, wind: 0.3, drone: 0.1 }),
  music: 'dread',
  variant: (G) => (isMob(G) ? 'mob' : 'calm'),
  canSave: (G) => !isMob(G),

  build(R, G) {
    const mob = isMob(G);
    const layers = nightBackdrop(R, WIDTH, { seed: 31, spireX: 520, spireH: 330, gasX: 1500, horizon: 440 });
    const lights = [];
    const chimneys = [];
    const near = R.paintLayer(WIDTH, (ctx) => {
      // railway viaduct: brick piers, a rubbed-brick arch ring, iron girder deck with rivets
      A.brickWall(ctx, 0, 120, 560, GROUND - 132, { seed: 5, palette: A.BRICK.stock, soot: 1, salt: 0.8 });
      ctx.fillStyle = '#030303';
      ctx.beginPath(); ctx.moveTo(90, GROUND - 12); ctx.lineTo(90, 330); ctx.arc(280, 330, 190, Math.PI, 0); ctx.lineTo(470, GROUND - 12); ctx.fill();
      ctx.strokeStyle = '#4a3226'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(280, 330, 198, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
      for (let i = 0; i <= 24; i++) { const a = Math.PI + (Math.PI / 24) * i; ctx.beginPath(); ctx.moveTo(280 + Math.cos(a) * 191, 330 + Math.sin(a) * 191); ctx.lineTo(280 + Math.cos(a) * 205, 330 + Math.sin(a) * 205); ctx.stroke(); }
      // under the arch: sleepers rolled in sacking, a bracket lamp
      for (const [sx, sw] of [[130, 70], [214, 54], [330, 80]]) { ctx.fillStyle = '#16120e'; ctx.beginPath(); ctx.ellipse(sx + sw / 2, GROUND - 22, sw / 2, 16, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(sx, GROUND - 22, sw, 10); }
      A.lampPost(ctx, 290, 420 + 160, 160, { bracket: true });
      ctx.fillStyle = P.iron; ctx.fillRect(0, 98, 560, 26); ctx.fillRect(0, 88, 560, 8);
      ctx.fillStyle = '#2a2d30'; for (let x = 6; x < 560; x += 14) { ctx.fillRect(x, 104, 3, 3); ctx.fillRect(x, 116, 3, 3); }
      for (let x = 0; x < 560; x += 18) ctx.fillRect(x, 66, 4, 24);
      ctx.fillRect(0, 62, 560, 5);
      A.poster(ctx, 476, 380, 74, 96, [['GREAT', 12], ['EASTERN', 12], ['RAILWAY', 12], ['TO SOUTHEND', 9]], { seed: 13, color: '#9c8a6a' });
      // Barber's yard wall and open gates
      A.brickWall(ctx, 560, 230, 820, GROUND - 242, { seed: 12, soot: 0.8 });
      ctx.fillStyle = '#5c574d'; ctx.fillRect(556, 220, 828, 13); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(556, 233, 828, 4);
      ctx.fillStyle = '#d8cdb0'; ctx.globalAlpha = 0.45;
      ctx.font = '600 28px "IM Fell English SC", Georgia, serif'; ctx.textAlign = 'left';
      ctx.fillText('BARBER  ·  HORSE SLAUGHTERER', 600, 272);
      ctx.font = '600 15px "IM Fell English SC", Georgia, serif'; ctx.fillText('ESTABLISHED 1841 · CATS MEAT SUPPLIED', 640, 296);
      ctx.globalAlpha = 1;
      // yard interior: a rail of hooks with hides, lime sacks, a cart wheel against the far wall
      ctx.fillStyle = '#2a1712'; ctx.fillRect(820, 300, 300, GROUND - 312);
      A.brickWall(ctx, 820, 300, 300, GROUND - 312, { seed: 15, palette: ['#3a1e16', '#2e1812', '#44241a'], soot: 1, salt: 0, holes: 0 });
      A.vgrad(ctx, 820, 300, 300, GROUND - 312, [[0, 'rgba(0,0,0,0.7)'], [1, 'rgba(60,20,10,0.35)']]);
      if (!drawProp(ctx, 'hides', 830, 318)) {
      ctx.fillStyle = P.iron; ctx.fillRect(830, 318, 280, 5);
      for (let i = 0; i < 4; i++) {
        const hx = 846 + i * 66;
        ctx.fillStyle = P.iron; ctx.fillRect(hx + 18, 322, 3, 22);
        ctx.fillStyle = i % 2 ? '#3a1c12' : '#2a1610';
        ctx.beginPath(); ctx.moveTo(hx, 346); ctx.quadraticCurveTo(hx + 20, 334, hx + 40, 346); ctx.lineTo(hx + 34, 460 + (i % 2) * 30); ctx.quadraticCurveTo(hx + 20, 480, hx + 6, 460 + (i % 2) * 30); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(hx + 22, 350, 6, 100);
      }
      }
      A.sack(ctx, 880, GROUND - 14, 7); A.sack(ctx, 920, GROUND - 14, 8);
      if (!drawProp(ctx, 'cart_wheel', 1000, GROUND - 70)) { ctx.strokeStyle = '#20150e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(1000, GROUND - 70, 44, 0, Math.PI * 2); ctx.stroke(); }
      A.gate(ctx, 760, 300, 60, GROUND - 312);
      A.gate(ctx, 1120, 300, 60, GROUND - 312);
      // brazier
      if (!drawProp(ctx, 'brazier', 1040, GROUND)) {
        ctx.fillStyle = P.iron; ctx.fillRect(1040, GROUND - 70, 40, 46); ctx.fillRect(1046, GROUND - 24, 4, 24); ctx.fillRect(1070, GROUND - 24, 4, 24);
        for (let i = 0; i < 5; i++) { ctx.fillStyle = '#0a0a0a'; ctx.fillRect(1042 + i * 8, GROUND - 68, 3, 40); }
      }
      ctx.fillStyle = '#ff9a4a'; ctx.fillRect(1044, GROUND - 74, 32, 8); ctx.fillStyle = '#ffd27a'; ctx.fillRect(1052, GROUND - 76, 12, 4);
      // grindstone on its wooden frame with a treadle and a drip-can
      // (the modelled wheel is drawn live, turning, in drawNear)
      if (!drawProp(ctx, 'grindstone', 1200, GROUND)) {
      ctx.fillStyle = P.woodDark;
      ctx.fillRect(1200, GROUND - 62, 84, 10); ctx.fillRect(1204, GROUND - 52, 8, 52); ctx.fillRect(1272, GROUND - 52, 8, 52);
      ctx.save(); ctx.translate(1212, GROUND - 6); ctx.rotate(-0.2); ctx.fillRect(0, 0, 70, 6); ctx.restore();
      ctx.fillStyle = '#625d55'; ctx.beginPath(); ctx.arc(1240, GROUND - 80, 32, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4a4640'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(1240, GROUND - 80, 26, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#2a2826'; ctx.beginPath(); ctx.arc(1240, GROUND - 80, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a3a3c'; ctx.fillRect(1214, GROUND - 130, 16, 20); ctx.fillRect(1220, GROUND - 112, 3, 14);
      }
      // low wall, crates, bollard where Wren perches
      A.brickWall(ctx, 1380, 430, 300, GROUND - 442, { seed: 41, palette: A.BRICK.stock });
      ctx.fillStyle = '#5c574d'; ctx.fillRect(1376, 424, 308, 10);
      A.crate(ctx, 1440, GROUND - 74, 70, 62, 3, { stencil: 'BARBER' });
      A.crate(ctx, 1500, GROUND - 60, 56, 48, 4);
      stonePost(ctx, 1611, GROUND);
      // backs of terraces
      const tl = facade(ctx, { x: 1680, w: 520, top: 116, base: GROUND - 12, seed: 77, floors: 2, windows: 3, litMap: [4], figures: [4], roof: 'parapet', kind: 'plaster', door: 360 });
      tl.forEach((c) => lights.push({ x: c.x, y: c.y, r: 200, color: P.candle, intensity: 0.5, flicker: 0.2, halo: 30, haloK: 0.5 }));
      chimneys.push(...tl.chimneys);
      ctx.strokeStyle = '#141414'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(1690, 330); ctx.quadraticCurveTo(1940, 370, 2190, 324); ctx.stroke();
      ctx.fillStyle = '#7a756a'; ctx.fillRect(1760, 348, 40, 56); ctx.fillStyle = '#5a564c'; ctx.fillRect(1840, 356, 30, 40); ctx.fillStyle = '#6a5a4a'; ctx.fillRect(2010, 352, 46, 30);
      // granite cattle trough of the Drinking Fountain Association
      cattleTrough(ctx, 1716, GROUND - 6, 150);
      A.streetSign(ctx, 1720, 296, 'WINTHROP STREET');
      A.wires(ctx, 560, 210, 1700, 260, { count: 3, sag: 60 });
      A.flagstones(ctx, 0, GROUND - 12, WIDTH, 18);
      A.kerb(ctx, 0, GROUND + 6, WIDTH);
      A.cobbles(ctx, 0, GROUND + 22, WIDTH, 720 - GROUND - 22, { seed: 22, rows: 9, puddles: 10, litter: 2 });
      // blood-dark runoff from the yard into the gutter
      ctx.fillStyle = 'rgba(48,10,8,0.6)';
      ctx.beginPath(); ctx.moveTo(900, GROUND + 6); ctx.quadraticCurveTo(980, GROUND + 30, 1100, GROUND + 26); ctx.lineTo(1300, GROUND + 30); ctx.lineTo(1300, GROUND + 36); ctx.quadraticCurveTo(1000, GROUND + 40, 880, GROUND + 12); ctx.fill();
      if (mob) {
        A.chalk(ctx, 600, 330, 'LEATHER APRON', { size: 34, rot: -0.06 });
        A.chalk(ctx, 1400, 446, 'HANG HIM', { size: 22, rot: 0.04 });
      }
    });
    layers.push({ canvas: near, parallax: 1, kind: 'near' });
    lights.push({ id: 'brazier', x: 1060, y: GROUND - 80, r: 520, color: [1, 0.42, 0.18], intensity: 1.0, flicker: 0.3, halo: 90, sparks: 18 });
    lights.push({ id: 'arch', x: 230, y: 420 + 160 - 140, r: 300, color: P.gas, intensity: 0.5, flicker: 0.1, halo: 50, shaft: true, shaftW: 90 });
    if (mob) {
      [1300, 1500, 1700, 1900].forEach((x, i) => lights.push({ id: `torch${i}`, x, y: GROUND - 250, r: 420, color: [1, 0.5, 0.2], intensity: 0.9, flicker: 0.45, halo: 70, sparks: 7 }));
    }
    const fg = R.paintLayer(WIDTH * 1.3, (ctx) => {
      ctx.fillStyle = '#050505';
      for (const x of [520, 560]) { ctx.beginPath(); ctx.ellipse(x, 690, 22, 50, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.lineWidth = 8; ctx.strokeStyle = '#050505'; ctx.beginPath(); ctx.arc(2240, 720, 70, Math.PI, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 5; i++) { const a = Math.PI + i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(2240, 720); ctx.lineTo(2240 + Math.cos(a) * 70, 720 + Math.sin(a) * 70); ctx.lineWidth = 4; ctx.stroke(); }
    });
    layers.push({ canvas: fg, parallax: 1.3, kind: 'fg' });
    return { layers, lights, chimneys };
  },

  makeLife(G) {
    const b = this.built || {};
    const list = [
      ...(b.chimneys || []).map((c) => new Smoke({ x: c.x, y: c.y, rate: 0.9, size: 0.8 })),
      new Drip({ x: 120, y: 128, ground: GROUND - 6 }),
      new Drip({ x: 460, y: 128, ground: GROUND - 6, period: 3.4 }),
      new Rat({ x0: 840, x1: 1360, y: GROUND + 18, seed: 5 }),
      new Crow({ x: 1420, y: 424, facing: -1, seed: 9 }),
      new Moths({ x: 230, y: 440 }),
      new Ripples({ x: 1100, y: GROUND + 70, w: 220 }),
    ];
    return list;
  },

  actors(G) {
    const list = [];
    const brennan = new Actor('Brennan', { x: 1180, y: GROUND, h: 222, hat: 'cap', hatColor: '#2a241e', coat: '#4a3e34', coatLen: 0.66, apron: '#3a2416', build: 1.35, facing: 1, trousers: '#2a2420', rolled: true, beard: '#2e2216', hair: '#2e2216' });
    list.push(brennan);
    const wren = { h: 150, hat: 'cap', hatColor: '#2e2a26', coat: '#4a4036', skirt: true, patches: true, shawl: '#3a3a44', hair: '#5a3a22', boots: '#1a1612' };
    if (!isMob(G)) {
      list.push(new Actor('Wren', { ...wren, x: 1474, y: GROUND - 74, facing: -1, z: 2 }));
    } else {
      brennan.x = 980; brennan.facing = 1; brennan.pose = 'cower';
      const coats = ['#2a2620', '#30302c', '#1f2226', '#3a3026', '#28241f', '#33302a'];
      const extras = [
        { hat: 'cap', moustache: '#3a2a1e' }, { hat: 'bowler', beard: '#2a2018' }, { hat: 'none', hair: '#3a2a1a', rolled: true },
        { hat: 'shawl', skirt: true, shawl: '#2e2a30' }, { hat: 'cap', apron: '#4a4438' }, { hat: 'bowler', moustache: '#5a4a3a', stoop: 1 },
        { hat: 'cap', scarf: '#4a2a22' }, { hat: 'bonnet', skirt: true }, { hat: 'cap', beard: '#3a3026', build: 1.2 },
      ];
      for (let i = 0; i < 9; i++) {
        list.push(new Actor(`Vecino${i}`, { x: 1180 + i * 95 + (i % 2) * 20, y: GROUND, h: 190 + (i * 13) % 30, coat: coats[i % coats.length], facing: -1, build: 0.95 + (i % 3) * 0.08, ...extras[i] }));
      }
      list.push(new Actor('Wren', { ...wren, x: 2040, y: GROUND, facing: -1 }));
    }
    return list;
  },

  update(G, dt) {
    this._t = (this._t || 0) + dt;
    if (!isMob(G)) {
      // Brennan works the grindstone with his left hand
      const b = G.actor('Brennan');
      if (b) b.grind = !b.talking;
      if (b && !b.talking) { b.pose = 'reach'; b.facing = 1; }
    } else {
      for (const a of G.game.actors) if (a.name.startsWith('Vecino')) a.y = GROUND - Math.abs(Math.sin(this._t * 6 + a.x)) * 3;
      if (Math.random() < dt * 0.6) G.audio.whisper(0.5, 0.04);
    }
  },

  drawNear(ctx, t) {
    const G = this.G;
    // the grindstone turns while Brennan works it, and stays where it stopped when he doesn't
    if (hasProp('grind_wheel') && hasProp('grindstone')) {
      const b = G && !isMob(G) ? G.actor('Brennan') : null;
      if (b?.grind) this._wheelA = t * 7;
      drawProp(ctx, 'grind_wheel', 1240, GROUND - 80, { rot: this._wheelA || 0 });
    }
    if (!G || isMob(G) || !G.flag('wren_paid') || G.flag('bisturi_taken')) return;
    // the scalpel Wren left on top of the post
    ctx.fillStyle = '#1a120c'; ctx.fillRect(1598, GROUND - 72, 16, 3);
    ctx.fillStyle = '#c8c8c0'; ctx.beginPath(); ctx.moveTo(1614, GROUND - 73); ctx.lineTo(1628, GROUND - 72); ctx.lineTo(1614, GROUND - 70); ctx.fill();
  },

  drawGlow(ctx, t) {
    if (this.G && !isMob(this.G) && this.G.flag('wren_paid') && !this.G.flag('bisturi_taken')) {
      const k = (t % 2.4) / 2.4;
      if (k < 0.35) { const a = Math.sin((k / 0.35) * Math.PI) * 0.9; ctx.fillStyle = `rgba(255,240,210,${a})`; ctx.fillRect(1619, GROUND - 80, 2, 16); ctx.fillRect(1612, GROUND - 73, 16, 2); }
    }
    if (!this.G || isMob(this.G)) return;
    // sparks off the grindstone
    const b = this.G.actor('Brennan');
    if (!b || b.talking) return;
    for (let i = 0; i < 6; i++) {
      const k = (t * 3 + i / 6) % 1;
      const x = 1220 + k * 40 + Math.sin(i * 9) * 12, y = GROUND - 90 + k * k * 90 - k * 30;
      ctx.fillStyle = `rgba(255,${150 + i * 10},60,${1 - k})`;
      ctx.fillRect(x, y, 3, 3);
    }
  },

  drawFog(ctx, t) {
    // steam rising out of the yard
    for (let i = 0; i < 5; i++) {
      const k = (t * 0.08 + i / 5) % 1;
      const g = ctx.createRadialGradient(970 + Math.sin(i + t * 0.3) * 40, 520 - k * 320, 4, 970, 520 - k * 320, 80 + k * 90);
      g.addColorStop(0, `rgba(255,255,255,${0.35 * (1 - k)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(800, 100, 360, 520);
    }
  },

  async enter(G) {
    this.G = G;
    if (isMob(G)) { await G.game.chapterHooks.mobScene(G); return; }
    if (G.flag('kn_intro')) { G.game.chapterHooks.c1Objective(G); return; }
    G.flag('kn_intro', true);
    G.date(null, '4:31');
    await G.walk(1620);
    G.objective('Hablar con Brennan y con la niña de las cajas.');
  },

  hotspots: [
    {
      id: 'brennan', name: 'Silas Brennan', cursor: 'talk', when: (G) => !isMob(G), rect: [1130, GROUND - 198, 110, 198], walk: 1330, face: -1,
      act: async (G) => {
        const b = G.actor('Brennan');
        const opts = [];
        if (!G.flag('br_alibi')) opts.push(['¿Dónde estaba a las tres y media?', 'alibi']);
        if (!G.flag('br_heard') && G.flag('br_alibi')) opts.push(['¿No oyeron nada?', 'heard']);
        if (!G.hasClue('brennan_zurdo')) opts.push(['(Mirar cómo trabaja)', 'look']);
        if (canFinishC1(G.state).ok && !G.flag('c1_done')) opts.push(['Esto es todo por esta noche.', 'close']);
        opts.push(['Nada más.', 'bye']);
        const c = opts[await G.choice(opts.map((o) => o[0]))][1];
        if (c === 'bye') return;
        if (c === 'close') { await G.game.chapterHooks.closeC1(G, 'brennan'); return; }
        if (c === 'look') {
          G.clue('brennan_zurdo');
          G.game.chapterHooks.c1Objective(G);
          return;
        }
        b.talking = true; b.pose = null; b.facing = 1;
        if (c === 'alibi') {
          G.flag('br_alibi', true);
          await G.say('Brennan', 'Aquí. Con tres hombres. Puede preguntarles. Ya lo hicieron sus agentes.');
          await G.say('Brennan', 'Seis caballos, inspector. Un caballo no se despieza solo.');
        } else if (c === 'heard') {
          G.flag('br_heard', true);
          await G.say('Brennan', 'Aquí dentro ni los gritos de los caballos dejan oír la calle.');
          await G.say('Brennan', 'Pregúntele a la cría de las cajas. Ella ve lo que ustedes pasan por alto.');
        }
        b.talking = false;
      },
    },
    {
      id: 'wren', name: 'Niña sobre las cajas', cursor: 'talk', when: (G) => !isMob(G), rect: [1440, GROUND - 210, 80, 140], walk: 1720, face: -1,
      act: async (G) => {
        const w = G.actor('Wren');
        w.talking = true;
        if (!G.flag('wren_met')) {
          G.flag('wren_met', true);
          await G.walk(1640);
          // the first meeting: a middle framing on the girl on the boxes, in silence (F11, «Primer encuentro con Wren»)
          G.zoom(1.25, 1560, G.scene.groundY - 150, 0.8);
          G.audio.setBeds({}, 0.5);
          G.audio.playMusic(null, 0.5);
          await G.say('Niña', 'No se acerque.');
          w.talking = false;
          await G.walk(1760);
          w.talking = true;
          await G.say('Niña', 'Usted huele al Ditch, señor.');
          await G.say('Ashgrove', 'Soy policía.');
          await G.say('Niña', 'Ya. Por eso.');
          await G.say('Wren', 'Wren. Lo que encuentro en el fango se paga.');
          w.talking = false;
          G.zoom(1);
          { const beds = G.scene.beds; G.audio.setBeds((typeof beds === 'function' ? beds(G) : beds) || {}, 1.5); }
          G.audio.playMusic(G.scene.music || null);
          if (G.has('penique')) {
            const c = await G.choice(['Dejarle el penique en el poste.', 'Ahora no.']);
            if (c === 0) { await payWren(G); return; }
          }
          G.objective('Darle un penique a Wren.');
          return;
        }
        if (G.flag('wren_paid')) {
          await G.say('Wren', 'Se lo he dicho: si el agua pronuncia su nombre, no conteste.');
          if (G.flag('c1_done') && !G.flag('wren_return_visit')) {
            G.flag('wren_return_visit', true);
            await G.say('Wren', 'Encontraron a otra mujer. Usted guarda cosas de los muertos, inspector. Yo también. La diferencia es que yo las vendo.');
          }
          w.talking = false;
          return;
        }
        w.talking = false;
        if (G.has('penique')) { await payWren(G); return; }
        await G.say('Wren', 'Un penique, señor. Las cosas cuestan.');
        await G.think('Dejé el penique sobre los informes.');
      },
      use: async (G, item) => {
        if (item !== 'penique' || G.flag('wren_paid')) return false;
        await payWren(G);
        return true;
      },
    },
    {
      id: 'bollard', name: 'Poste de piedra', rect: [1590, GROUND - 66, 46, 66], walk: 1660, face: -1,
      act: async (G) => {
        if (G.flag('wren_paid') && !G.has('bisturi') && !G.flag('bisturi_taken')) { await G.game.chapterHooks.takeScalpel(G); return; }
        G.audio.tick();   // a hitching post worn by the ropes: Wren's counter, nothing more
      },
      use: async (G, item) => {
        if (item !== 'penique' || !G.flag('wren_met') || G.flag('wren_paid')) return false;
        await payWren(G);
        return true;
      },
    },
    {
      id: 'trough', name: 'Abrevadero', rect: [1720, GROUND - 50, 140, 40], walk: 1790,
      act: async (G) => {
        if (!G.flag('trough_seen')) {
          G.flag('trough_seen', true);
          G.audio.drip(); G.sanity(-4); G.mad(0.25); await G.wait(1500); G.mad(0);
          await G.think('Me habré colocado mal.');
        } else await G.think('No vuelvo a asomarme.');
      },
    },
    {
      id: 'east', name: "Volver a Buck's Row", cursor: 'exit', rect: [2080, GROUND - 420, 120, 440], walk: 2070, face: 1,
      when: (G) => !isMob(G),
      act: async (G) => G.goto('bucks_row', { x: 230, facing: 1 }),
    },
  ],

  // a deduction never ends the night by itself: the objective says the night can be closed
  async onDeduce(G) {
    if (!isMob(G)) G.game.chapterHooks.c1Objective(G);
  },
};
