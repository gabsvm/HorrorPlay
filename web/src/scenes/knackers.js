// Winthrop Street: Barber's horse-slaughter yard by the railway. Chapter 1 (investigation) and chapter 2 (the mob).
import * as A from '../art/paint.js';
import { nightBackdrop, facade } from '../art/build.js';
import { P } from '../art/palette.js';
import { Actor } from '../engine/actor.js';

const WIDTH = 2200, GROUND = 628;
const isMob = (G) => G.flag('mob');

export default {
  id: 'knackers',
  width: WIDTH,
  groundY: GROUND,
  reflectY: 640,
  walk: [120, 2080],
  spawn: 1960,
  lantern: true,
  ambient: [0.03, 0.038, 0.05],
  fog: { density: 0.55, amount: 0.5, color: [0.38, 0.44, 0.46], speed: 8 },
  rain: 0.2,
  wet: 1,
  beds: { rain: 0.3, wind: 0.3, drone: 0.1 },
  music: 'dread',
  variant: (G) => (isMob(G) ? 'mob' : 'calm'),

  build(R, G) {
    const mob = isMob(G);
    const layers = nightBackdrop(R, WIDTH, { seed: 31, spireX: 520, spireH: 330, horizon: 440 });
    const lights = [];
    const near = R.paintLayer(WIDTH, (ctx) => {
      // railway viaduct
      A.brickWall(ctx, 0, 120, 560, GROUND - 132, { seed: 5, palette: ['#3d2a24', '#45302a', '#382620'], soot: 1 });
      ctx.fillStyle = '#030303';
      ctx.beginPath(); ctx.moveTo(90, GROUND - 12); ctx.lineTo(90, 330); ctx.arc(280, 330, 190, Math.PI, 0); ctx.lineTo(470, GROUND - 12); ctx.fill();
      ctx.fillStyle = P.iron; ctx.fillRect(0, 100, 560, 24); ctx.fillRect(0, 90, 560, 6);
      for (let x = 0; x < 560; x += 18) ctx.fillRect(x, 70, 4, 22);
      // Barber's yard wall + open gates
      A.brickWall(ctx, 560, 230, 820, GROUND - 242, { seed: 12, soot: 0.8 });
      ctx.fillStyle = P.stoneDark; ctx.fillRect(556, 222, 828, 12);
      ctx.font = '600 26px "IM Fell English SC", Georgia, serif'; ctx.fillStyle = 'rgba(210,200,170,0.5)'; ctx.textAlign = 'left';
      ctx.fillText('BARBER  ·  HORSE SLAUGHTERER', 600, 270);
      // yard interior through the gateway
      ctx.fillStyle = '#2a1712'; ctx.fillRect(820, 300, 300, GROUND - 312);
      A.vgrad(ctx, 820, 300, 300, GROUND - 312, [[0, 'rgba(0,0,0,0.6)'], [1, 'rgba(60,20,10,0.4)']]);
      ctx.fillStyle = '#0d0907';
      // hanging hides on hooks, shapes only
      for (let i = 0; i < 4; i++) {
        const hx = 850 + i * 70;
        ctx.fillRect(hx + 18, 316, 3, 30);
        ctx.beginPath(); ctx.moveTo(hx, 346); ctx.quadraticCurveTo(hx + 20, 330, hx + 40, 346); ctx.lineTo(hx + 34, 460 + (i % 2) * 30); ctx.quadraticCurveTo(hx + 20, 480, hx + 6, 460 + (i % 2) * 30); ctx.fill();
      }
      ctx.fillStyle = '#1a0f0a'; ctx.fillRect(820, 300, 300, 16);
      // gate leaves swung open
      A.gate(ctx, 760, 300, 60, GROUND - 312);
      A.gate(ctx, 1120, 300, 60, GROUND - 312);
      // brazier in the yard
      ctx.fillStyle = P.iron; ctx.fillRect(1040, GROUND - 70, 40, 46); ctx.fillRect(1046, GROUND - 24, 4, 24); ctx.fillRect(1070, GROUND - 24, 4, 24);
      ctx.fillStyle = '#ff9a4a'; ctx.fillRect(1044, GROUND - 74, 32, 8);
      // grindstone outside the gate
      ctx.fillStyle = P.woodDark; ctx.fillRect(1206, GROUND - 60, 70, 10); ctx.fillRect(1210, GROUND - 50, 8, 50); ctx.fillRect(1264, GROUND - 50, 8, 50);
      ctx.fillStyle = '#5a5650'; ctx.beginPath(); ctx.arc(1240, GROUND - 76, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a2826'; ctx.beginPath(); ctx.arc(1240, GROUND - 76, 6, 0, Math.PI * 2); ctx.fill();
      // low wall and crates where Wren perches
      A.brickWall(ctx, 1380, 430, 300, GROUND - 442, { seed: 41 });
      A.crate(ctx, 1440, GROUND - 74, 70, 62, 3);
      A.crate(ctx, 1500, GROUND - 60, 56, 48, 4);
      ctx.fillStyle = P.stone; ctx.fillRect(1600, GROUND - 56, 22, 56); ctx.fillRect(1596, GROUND - 60, 30, 8); // bollard
      // backs of terraces
      const tl = facade(ctx, { x: 1680, w: 520, top: 250, base: GROUND - 12, seed: 77, floors: 2, windows: 3, litMap: [4], roof: 'parapet', kind: 'plaster', door: 360 });
      tl.forEach((c) => lights.push({ x: c.x, y: c.y, r: 200, color: P.candle, intensity: 0.5, flicker: 0.2, halo: 30, haloK: 0.5 }));
      // water trough
      ctx.fillStyle = P.stoneDark; ctx.fillRect(1720, GROUND - 44, 140, 32); ctx.fillStyle = '#0d1416'; ctx.fillRect(1726, GROUND - 42, 128, 8);
      A.streetSign(ctx, 1720, 300, 'WINTHROP STREET');
      A.flagstones(ctx, 0, GROUND - 12, WIDTH, 18);
      A.kerb(ctx, 0, GROUND + 6, WIDTH);
      A.cobbles(ctx, 0, GROUND + 22, WIDTH, 720 - GROUND - 22, { seed: 22, rows: 9, puddles: 10 });
      // blood-dark runoff from the yard into the gutter
      ctx.fillStyle = 'rgba(40,10,8,0.55)';
      ctx.beginPath(); ctx.moveTo(900, GROUND + 6); ctx.quadraticCurveTo(980, GROUND + 30, 1100, GROUND + 26); ctx.lineTo(1300, GROUND + 30); ctx.lineTo(1300, GROUND + 36); ctx.quadraticCurveTo(1000, GROUND + 40, 880, GROUND + 12); ctx.fill();
      if (mob) A.chalk(ctx, 600, 330, 'LEATHER APRON', { size: 30, rot: -0.06 });
    });
    layers.push({ canvas: near, parallax: 1, kind: 'near' });
    lights.push({ id: 'brazier', x: 1060, y: GROUND - 80, r: 520, color: [1, 0.42, 0.18], intensity: 1.0, flicker: 0.3, halo: 90 });
    lights.push({ id: 'arch', x: 280, y: 380, r: 260, color: P.gas, intensity: 0.45, flicker: 0.1, halo: 40 });
    if (mob) {
      [1300, 1500, 1700, 1900].forEach((x, i) => lights.push({ id: `torch${i}`, x, y: GROUND - 250, r: 420, color: [1, 0.5, 0.2], intensity: 0.9, flicker: 0.45, halo: 70 }));
    }
    const fg = R.paintLayer(WIDTH * 1.3, (ctx) => {
      ctx.fillStyle = '#050505';
      // barrels and a broken cart wheel along the bottom edge
      for (const x of [520, 560]) { ctx.beginPath(); ctx.ellipse(x, 690, 22, 50, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.lineWidth = 8; ctx.strokeStyle = '#050505'; ctx.beginPath(); ctx.arc(2240, 720, 70, Math.PI, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 5; i++) { const a = Math.PI + i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(2240, 720); ctx.lineTo(2240 + Math.cos(a) * 70, 720 + Math.sin(a) * 70); ctx.lineWidth = 4; ctx.stroke(); }
    });
    layers.push({ canvas: fg, parallax: 1.3, kind: 'fg' });
    return { layers, lights };
  },

  actors(G) {
    const list = [];
    const brennan = new Actor('Brennan', { x: 1180, y: GROUND, h: 222, hat: 'cap', coat: '#3b302a', coatLen: 0.66, apron: '#3a2416', build: 1.35, facing: 1, trousers: '#2a2420' });
    list.push(brennan);
    if (!isMob(G)) {
      list.push(new Actor('Wren', { x: 1474, y: GROUND - 74, h: 128, hat: 'cap', coat: '#4a4036', skirt: true, facing: -1, z: 2 }));
    } else {
      brennan.x = 980; brennan.facing = 1; brennan.pose = 'cower';
      const coats = ['#2a2620', '#30302c', '#1f2226', '#3a3026', '#28241f', '#33302a'];
      for (let i = 0; i < 9; i++) {
        list.push(new Actor(`Vecino${i}`, { x: 1180 + i * 95 + (i % 2) * 20, y: GROUND, h: 190 + (i * 13) % 30, hat: ['cap', 'bowler', 'none', 'shawl', 'cap'][i % 5], skirt: i % 5 === 3, coat: coats[i % coats.length], facing: -1, build: 0.95 + (i % 3) * 0.08 }));
      }
      list.push(new Actor('Wren', { x: 2040, y: GROUND, h: 128, hat: 'cap', coat: '#4a4036', skirt: true, facing: -1 }));
    }
    return list;
  },

  update(G, dt) {
    this._t = (this._t || 0) + dt;
    if (!isMob(G)) {
      // Brennan works the grindstone with his left hand
      const b = G.actor('Brennan');
      if (b && !b.talking) { b.pose = 'reach'; b.facing = 1; }
    } else {
      for (const a of G.game.actors) if (a.name.startsWith('Vecino')) a.y = GROUND - Math.abs(Math.sin(this._t * 6 + a.x)) * 3;
      if (Math.random() < dt * 0.6) G.audio.whisper(0.5, 0.04);
    }
  },

  drawGlow(ctx, t) {
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
    if (G.flag('kn_intro')) return;
    G.flag('kn_intro', true);
    G.date(null, '4:31');
    await G.walk(1620);
    await G.think('Desde el desolladero llega un olor espeso a cal, a sangre de caballo y a vapor.');
    G.objective('Hablar con Brennan y con la niña de las cajas.');
  },

  hotspots: [
    {
      id: 'brennan', name: 'Silas Brennan', cursor: 'talk', when: (G) => !isMob(G), rect: [1130, GROUND - 230, 110, 230], walk: 1330, face: -1,
      act: async (G) => {
        const b = G.actor('Brennan');
        const opts = [];
        if (!G.flag('br_alibi')) opts.push(['¿Dónde estaba a las tres y media?', 'alibi']);
        if (!G.flag('br_heard') && G.flag('br_alibi')) opts.push(['¿No oyeron nada?', 'heard']);
        if (!G.hasClue('brennan_zurdo')) opts.push(['(Mirar cómo trabaja)', 'look']);
        opts.push(['Nada más.', 'bye']);
        const c = opts[await G.choice(opts.map((o) => o[0]))][1];
        if (c === 'bye') return;
        if (c === 'look') {
          await G.think('Afila un cuchillo de desollar en la muela, con la mano izquierda. Lo hace sin mirar, como quien lo ha hecho diez mil veces.');
          await G.think('Lleva un delantal de cuero hasta las rodillas.');
          G.clue('brennan_zurdo');
          return;
        }
        b.talking = true; b.pose = null; b.facing = 1;
        if (c === 'alibi') {
          G.flag('br_alibi', true);
          await G.say('Brennan', 'Aquí. Con Tomkins, con Mumford y con Britten. Ya vinieron dos de los suyos a preguntarlo, y les dijimos lo mismo.');
          await G.say('Brennan', 'Seis caballos esta noche, inspector. Un caballo no se despieza solo.');
        } else if (c === 'heard') {
          G.flag('br_heard', true);
          await G.say('Brennan', 'Aquí dentro los caballos gritan más que cualquier mujer.');
          await G.say('Brennan', 'Si quiere saber quién anda por ahí a esas horas, pregúntele a la cría. Esa no duerme nunca.');
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
          await G.say('Niña', '¡No se acerque!');
          w.talking = false;
          await G.walk(1760);
          w.talking = true;
          await G.say('Niña', 'Usted huele al Ditch, señor.');
          await G.say('Ashgrove', 'Soy policía.');
          await G.say('Niña', 'Ya. Por eso.');
          await G.say('Wren', 'Me llamo Wren. Busco cosas en el fango y las vendo. Esta noche he encontrado algo, pero las cosas cuestan.');
          w.talking = false;
          await G.think('Pide un penique. No se va a acercar a mí.');
          G.objective('Darle un penique a Wren sin acercarse demasiado.');
          return;
        }
        if (G.flag('wren_paid')) {
          await G.say('Wren', 'Ya se lo he dicho. Si el agua dice su nombre, no conteste.');
        } else {
          await G.say('Wren', 'Déjelo en el poste y apártese.');
        }
        w.talking = false;
      },
      use: async (G, item) => {
        if (item !== 'penique') return false;
        await G.think('Mejor en el poste.');
        return true;
      },
    },
    {
      id: 'bollard', name: 'Poste de piedra', rect: [1590, GROUND - 66, 46, 66], walk: 1660, face: -1,
      act: async (G) => {
        if (G.flag('wren_paid') && !G.has('bisturi') && !G.flag('bisturi_taken')) { await G.game.chapterHooks.takeScalpel(G); return; }
        await G.think('Un poste para amarrar caballos, gastado por las cuerdas.');
      },
      use: async (G, item) => {
        if (item !== 'penique' || !G.flag('wren_met')) return false;
        G.take('penique');
        G.flag('penique_given', true);
        G.flag('wren_paid', true);
        G.audio.tick();
        await G.think('Dejo el penique en el poste y me aparto.');
        await G.walk(1860);
        const w = G.actor('Wren');
        await w.walkTo(1610);
        w.pose = 'reach';
        await G.wait(500);
        w.pose = null;
        w.talking = true;
        await G.say('Wren', 'Esto estaba en la rejilla de Buck\'s Row, antes de que llegaran los suyos. Brillaba.');
        w.talking = false;
        await w.walkTo(1474);
        w.facing = -1;
        await G.think('Ha dejado algo en el poste a cambio.');
        G.objective('Recoger lo que Wren ha dejado en el poste.');
        return true;
      },
    },
    {
      id: 'yard', name: 'Patio del desolladero', when: (G) => !isMob(G), rect: [820, 300, 300, GROUND - 300], walk: 960, face: -1,
      act: async (G) => {
        await G.think('Dentro hay tres hombres desollando a la luz de un brasero. Los caballos cuelgan de los ganchos como abrigos.');
        await G.think('Aquí todo el mundo tiene un cuchillo y sangre en las manos. Por eso nadie mira dos veces.');
      },
    },
    {
      id: 'arch', name: 'Arco del ferrocarril', rect: [90, 140, 380, GROUND - 140], walk: 300,
      act: async (G) => {
        await G.think('Bajo el arco del Great Eastern duermen los que no tienen cuatro peniques para una cama.');
        if (!G.flag('arch_train')) { G.flag('arch_train', true); G.shake(14); G.audio.thud(); await G.think('Pasa un tren por encima y todo tiembla. Después vuelve el silencio, y en el silencio oigo agua corriendo bajo los adoquines.'); G.sanity(-2); }
      },
    },
    {
      id: 'trough', name: 'Abrevadero', rect: [1720, GROUND - 50, 140, 40], walk: 1790,
      act: async (G) => {
        if (!G.flag('trough_seen')) {
          G.flag('trough_seen', true);
          await G.think('Agua negra y quieta. Me asomo y no veo mi reflejo, solo la linterna, flotando sola.');
          G.audio.drip(); G.sanity(-4); G.mad(0.25); await G.wait(1500); G.mad(0);
          await G.think('Habrá sido el ángulo.');
        } else await G.think('No vuelvo a asomarme.');
      },
    },
    {
      id: 'east', name: "Volver a Buck's Row", cursor: 'exit', rect: [2080, GROUND - 420, 120, 440], walk: 2070, face: 1,
      when: (G) => !isMob(G),
      act: async (G) => G.goto('bucks_row', { x: 230, facing: 1 }),
    },
  ],

  async onDeduce(G) {
    if (!isMob(G) && G.deduced('d_brennan') && G.deduced('d_bisturi') && !G.flag('c1_done')) {
      G.flag('c1_done', true);
      await G.game.chapterHooks.endC1(G);
    }
  },
};
