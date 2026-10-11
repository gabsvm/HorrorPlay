// Chapter 2 — Madame Wexley's parlour, Fournier Street, the night of 8 September.
import * as A from '../art/paint.js';
import { wallpaper, wainscot, floorboards, rug, fireplace, frame } from '../art/build.js';
import { Smoke, Moths } from '../engine/life.js';
import { P, shade } from '../art/palette.js';
import { Actor } from '../engine/actor.js';
import { seanceTrumpet } from '../art/props.js';
import { drawProp } from '../art/models.js';

const WIDTH = 1400, GROUND = 664;
const TABLE_X = 760;

export default {
  id: 'seance',
  width: WIDTH,
  groundY: GROUND,
  walk: [200, 1260],
  spawn: 240,
  surface: 'wood',
  space: 'parlour',
  // (the mantel clock stopped at a quarter past three: no ticking here)
  indoor: true,
  reflectY: GROUND + 6,
  wet: 0.35,
  lantern: false,
  ambient: [0.025, 0.02, 0.022],
  fog: { density: 0.25, amount: 0.35, color: [0.4, 0.34, 0.3], speed: 2, ground: 0.1 },
  rain: 0,
  beds: { room: 0.5, rain: 0.08 },
  music: null,
  date: '8 de septiembre de 1888',

  build(R) {
    const lights = [];
    const near = R.paintLayer(WIDTH, (ctx) => {
      ctx.fillStyle = '#0a0606'; ctx.fillRect(0, 0, WIDTH, 720);
      wallpaper(ctx, 0, 30, WIDTH, GROUND - 150, { seed: 51, base: '#4a1e1c', stripe: '#3a1614', damp: 0.4 });
      wainscot(ctx, 0, GROUND - 120, WIDTH, 120);
      ctx.fillStyle = '#140a08'; ctx.fillRect(0, 0, WIDTH, 34); ctx.fillStyle = '#5a4520'; ctx.fillRect(0, 30, WIDTH, 5);
      floorboards(ctx, 0, GROUND - 6, WIDTH, 720 - GROUND + 6, { color: '#2e1f16' });
      rug(ctx, TABLE_X - 300, GROUND + 6, 600, 50);
      // heavy velvet drapes with tasselled tie-backs
      for (const x of [0, 1240]) {
        ctx.fillStyle = '#2e0e0d'; ctx.fillRect(x, 20, 160, GROUND - 20);
        for (let k = 0; k < 7; k++) { ctx.fillStyle = `rgba(0,0,0,${0.12 + (k % 2) * 0.22})`; ctx.fillRect(x + k * 23, 20, 11, GROUND - 20); ctx.fillStyle = 'rgba(255,200,170,0.06)'; ctx.fillRect(x + k * 23 + 11, 20, 2, GROUND - 20); }
        ctx.fillStyle = '#8a6a2a'; ctx.fillRect(x + 20, GROUND - 330, 120, 8); ctx.beginPath(); ctx.arc(x + 80, GROUND - 312, 9, 0, Math.PI * 2); ctx.fill();
        for (let k = 0; k < 6; k++) ctx.fillRect(x + 74 + k * 2.5, GROUND - 304, 1.5, 22);
        ctx.fillStyle = '#5a4520'; ctx.fillRect(x - 10, 14, 180, 10);
      }
      // door
      A.door(ctx, 190, GROUND - 270, 116, 270, { color: '#2a1a12', steps: 0, fanlight: false, scraper: false });
      // cold fireplace with dried flowers and a clock stopped at a quarter past three
      fireplace(ctx, 340, GROUND, { lit: false, w: 160 });
      ctx.fillStyle = '#4a3a2a'; ctx.fillRect(360, GROUND - 184, 18, 24); ctx.fillStyle = '#5a3a3a'; for (let i = 0; i < 5; i++) ctx.fillRect(362 + i * 3, GROUND - 204 + (i % 2) * 5, 2, 22);
      ctx.fillStyle = '#20150e'; ctx.fillRect(440, GROUND - 200, 40, 40); ctx.fillStyle = '#c9bc98'; ctx.beginPath(); ctx.arc(460, GROUND - 182, 12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#141210'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(460, GROUND - 182); ctx.lineTo(467, GROUND - 182); ctx.moveTo(460, GROUND - 182); ctx.lineTo(462, GROUND - 191); ctx.stroke();
      // the mirror: an ornate gilt frame, black glass. It reflects the room but never the inspector.
      ctx.fillStyle = '#6a5224'; ctx.fillRect(TABLE_X - 134, 104, 268, 310);
      ctx.fillStyle = '#8a6a2a';
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(TABLE_X - 134 + i * 53.6, 104, 11, Math.PI, 0); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(TABLE_X - 40, 104); ctx.quadraticCurveTo(TABLE_X, 60, TABLE_X + 40, 104); ctx.fill();
      ctx.fillStyle = '#3a2c14'; ctx.fillRect(TABLE_X - 120, 118, 240, 282);
      ctx.fillStyle = 'rgba(255,220,150,0.12)'; ctx.fillRect(TABLE_X - 134, 104, 268, 3); ctx.fillRect(TABLE_X - 134, 104, 3, 310);
      A.vgrad(ctx, TABLE_X - 110, 128, 220, 262, [[0, '#14181a'], [1, '#0b0d0e']]);
      ctx.fillStyle = '#060707'; ctx.fillRect(TABLE_X - 110, 330, 220, 60);
      ctx.fillStyle = '#0a0b0b';
      ctx.beginPath(); ctx.ellipse(TABLE_X - 60, 300, 16, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(TABLE_X - 80, 316, 40, 30);
      ctx.beginPath(); ctx.ellipse(TABLE_X + 50, 304, 15, 19, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(TABLE_X + 32, 318, 38, 30);
      ctx.fillStyle = '#c99858'; for (const dx of [-20, 4, 28]) ctx.fillRect(TABLE_X + dx, 318, 3, 8);
      ctx.fillStyle = 'rgba(160,190,200,0.08)'; ctx.beginPath(); ctx.moveTo(TABLE_X - 100, 130); ctx.lineTo(TABLE_X - 30, 130); ctx.lineTo(TABLE_X - 100, 260); ctx.fill();
      // spirit cabinet: black curtains embroidered with stars
      ctx.fillStyle = '#1a0f0b'; ctx.fillRect(1060, GROUND - 340, 150, 340);
      ctx.fillStyle = '#5a4520'; ctx.fillRect(1052, GROUND - 350, 166, 12);
      ctx.fillStyle = '#120a0a'; ctx.fillRect(1070, GROUND - 330, 64, 320); ctx.fillRect(1136, GROUND - 330, 64, 320);
      ctx.fillStyle = 'rgba(200,170,90,0.5)';
      for (const [sx, sy] of [[1090, 220], [1110, 300], [1160, 260], [1180, 380], [1100, 420], [1170, 470]]) { ctx.fillRect(sx - 4, sy, 8, 2); ctx.fillRect(sx - 1, sy - 3, 2, 8); }
      // side table: trumpet, tambourine, a bell, and a stuffed raven under a glass dome
      if (!drawProp(ctx, 'side_table', 614, GROUND)) {
        ctx.fillStyle = '#20150e'; ctx.fillRect(560, GROUND - 100, 110, 10); ctx.fillRect(608, GROUND - 90, 12, 90); ctx.fillRect(588, GROUND - 6, 52, 6);
        ctx.fillStyle = '#5a4630'; ctx.beginPath(); ctx.ellipse(654, GROUND - 106, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
      }
      // a little oil lamp with a red glass shade on the mantel: Wexley's sanctuary light
      ctx.fillStyle = '#5a4520'; ctx.fillRect(402, GROUND - 168, 16, 8); ctx.fillRect(406, GROUND - 176, 8, 8);
      ctx.fillStyle = '#7a1612'; ctx.beginPath(); ctx.ellipse(410, GROUND - 186, 11, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,140,110,0.5)'; ctx.fillRect(405, GROUND - 192, 3, 8);
      if (!drawProp(ctx, 'raven_dome', 1000, GROUND)) {
      ctx.fillStyle = '#20150e'; ctx.fillRect(1000, GROUND - 150, 50, 150);
      ctx.fillStyle = '#0c0b0c'; ctx.beginPath(); ctx.ellipse(1025, GROUND - 176, 12, 18, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(1034, GROUND - 188); ctx.lineTo(1046, GROUND - 184); ctx.lineTo(1034, GROUND - 180); ctx.fill();
      ctx.strokeStyle = 'rgba(190,210,215,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(1004, GROUND - 152); ctx.lineTo(1004, GROUND - 196); ctx.arc(1025, GROUND - 196, 21, Math.PI, 0); ctx.lineTo(1046, GROUND - 152); ctx.stroke();
      }
      // the sitters' balloon-back chairs (Wexley's faces left, the widow's right); the young man's
      // is hidden behind the table
      drawProp(ctx, 'balloon_chair', TABLE_X + 178, GROUND, { flip: true });
      drawProp(ctx, 'balloon_chair', TABLE_X - 168, GROUND);
      // framed "spirit" photographs and an astrological chart
      for (let i = 0; i < 3; i++) frame(ctx, 380 + i * 70 - 140, 200 + (i % 2) * 20, 46, 60, { seed: 70 + i });
      ctx.fillStyle = '#b4a47e'; ctx.fillRect(930, 150, 96, 96); ctx.strokeStyle = 'rgba(60,40,20,0.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(978, 198, 38, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(978, 198, 24, 0, Math.PI * 2); ctx.stroke();
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(978 + Math.cos(a) * 24, 198 + Math.sin(a) * 24); ctx.lineTo(978 + Math.cos(a) * 38, 198 + Math.sin(a) * 38); ctx.stroke(); }
      A.stain(ctx, 930, 150, 96, 96, { seed: 8, alpha: 0.5 });
    });
    lights.push({ id: 'redlamp', x: 410, y: GROUND - 186, r: 380, color: [0.85, 0.28, 0.2], intensity: 0.55, flicker: 0.08, halo: 34, haloK: 0.6 });
    lights.push({ id: 'c1', x: TABLE_X - 30, y: GROUND - 150, r: 420, color: P.candle, intensity: 0.9, flicker: 0.25, halo: 60 });
    lights.push({ id: 'c2', x: TABLE_X + 10, y: GROUND - 156, r: 420, color: P.candle, intensity: 0.9, flicker: 0.25, halo: 60 });
    lights.push({ id: 'c3', x: TABLE_X + 50, y: GROUND - 150, r: 420, color: P.candle, intensity: 0.9, flicker: 0.25, halo: 60 });
    const fg = R.paintLayer(WIDTH * 1.2, (ctx) => {
      ctx.fillStyle = '#050303';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(160, 200, 90, 720); ctx.lineTo(0, 720); ctx.fill();
      ctx.beginPath(); ctx.moveTo(1680, 0); ctx.quadraticCurveTo(1540, 300, 1600, 720); ctx.lineTo(1680, 720); ctx.fill();
      ctx.fillRect(0, 0, 1680, 24);
    });
    return { layers: [{ canvas: near, parallax: 1, kind: 'near' }, { canvas: fg, parallax: 1.2, kind: 'fg' }], lights };
  },

  makeLife() {
    // incense curling up from a dish on the mantel, dust turning in the candlelight
    return [new Smoke({ x: 368, y: GROUND - 200, rate: 0.5, drift: 6, size: 0.4 }), new Moths({ x: TABLE_X + 10, y: GROUND - 200, n: 5 })];
  },

  actors() {
    return [
      new Actor('Wexley', { x: TABLE_X + 170, y: GROUND, h: 200, hat: 'shawl', shawl: '#3a1a2a', skirt: true, bustle: true, coat: '#2a1c22', facing: -1, pose: 'sit', z: 1, hair: '#1a1210' }),
      new Actor('Viuda', { x: TABLE_X - 160, y: GROUND, h: 190, hat: 'bonnet', hatColor: '#0a0a0b', skirt: true, coat: '#121112', shawl: '#0e0d0e', facing: 1, pose: 'sit', z: 1 }),
      new Actor('Joven', { x: TABLE_X + 40, y: GROUND, h: 200, hat: 'none', hair: '#2a1e14', coat: '#2a2a30', facing: -1, pose: 'sit', z: -1, moustache: '#2a1e14', scarf: '#4a3a2a' }),
    ];
  },

  drawNear(ctx, t) {
    seanceTrumpet(ctx, 572, GROUND - 101, t);
  },

  drawNearOver(ctx, t) {
    // round table with a fringed velvet cloth and three candles (drawn over the seated figures):
    // the model, with the flames drawn live on its candles, or else painted here
    const out = this.G?.flag('candles_out');
    if (drawProp(ctx, 'seance_table', TABLE_X, GROUND)) {
      if (!out) {
        for (const dx of [-30, 10, 50]) {
          const top = GROUND - 162 + (dx === 10 ? -6 : 0);
          ctx.fillStyle = '#ffd38a'; ctx.beginPath(); ctx.ellipse(TABLE_X + dx, top - 6 + Math.sin(t * 8 + dx) * 0.8, 2.8, 6.5, Math.sin(t * 4 + dx) * 0.1, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else {
    ctx.fillStyle = '#1a0c0a'; ctx.fillRect(TABLE_X - 12, GROUND - 120, 24, 120);
    ctx.fillStyle = '#3a1814';
    ctx.beginPath(); ctx.ellipse(TABLE_X, GROUND - 124, 150, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(TABLE_X - 150, GROUND - 124); ctx.lineTo(TABLE_X - 160, GROUND - 60); ctx.lineTo(TABLE_X + 160, GROUND - 60); ctx.lineTo(TABLE_X + 150, GROUND - 124); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let x = TABLE_X - 140; x < TABLE_X + 150; x += 34) ctx.fillRect(x, GROUND - 112, 6, 52);
    ctx.fillStyle = '#8a6a2a'; for (let x = TABLE_X - 158; x < TABLE_X + 160; x += 7) ctx.fillRect(x, GROUND - 60, 3, 9);
    for (const dx of [-30, 10, 50]) {
      const top = GROUND - 160 + (dx === 10 ? -6 : 0);
      ctx.fillStyle = '#5a4520'; ctx.fillRect(TABLE_X + dx - 7, GROUND - 128, 15, 4);
      ctx.fillStyle = '#e0d4b4'; ctx.fillRect(TABLE_X + dx - 3, top, 7, 34); ctx.fillRect(TABLE_X + dx + 3, top + 6, 3, 12);
      if (!out) { ctx.fillStyle = '#ffd38a'; ctx.beginPath(); ctx.ellipse(TABLE_X + dx + 0.5, top - 6 + Math.sin(t * 8 + dx) * 0.8, 2.8, 6.5, Math.sin(t * 4 + dx) * 0.1, 0, Math.PI * 2); ctx.fill(); }
    }
    }
    if (this.G?.flag('comb_on_table')) { ctx.fillStyle = '#6a5038'; ctx.fillRect(TABLE_X - 14, GROUND - 130, 28, 5); }
    if (this.G?.flag('mirror_cracked')) {
      ctx.strokeStyle = 'rgba(220,230,230,0.55)'; ctx.lineWidth = 2;
      const cx = TABLE_X + 20, cy = 230;
      for (let i = 0; i < 10; i++) { const a = i * 0.63; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 70, cy + Math.sin(a) * 60); ctx.lineTo(cx + Math.cos(a + 0.1) * 140, cy + Math.sin(a + 0.1) * 130); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.stroke();
    }
  },

  hint: (G) => {
    if (G.hasClue('hospes')) return null;
    if (!G.flag('raps_heard')) return 'La mesa: antes de que Wexley empiece, conviene acercarse a ella y escuchar.';
    return G.flag('knock_board') ? 'Cada letra son dos grupos de golpes: el primero es la fila de la tabla, el segundo la columna. Dos golpes y tres golpes: fila 2, columna 3.' : 'En la pared, bajo la carta astral, hay una tabla de letras. Sin ella los golpes no se pueden leer.';
  },

  async enter(G) {
    this.G = G;
    if (G.flag('se_intro')) return;
    G.flag('se_intro', true);
    G.date('8 de septiembre de 1888', '23:04');
    await G.walk(420);
    const w = G.actor('Wexley'); w.talking = true;
    await G.say('Madame Wexley', 'Inspector Ashgrove. Ha llegado antes de lo previsto.');
    w.talking = false;
    const c = await G.choice(['¿Quién me esperaba?', 'Usted me mandó una nota. Quiero saber quién se la dictó.']);
    w.talking = true;
    if (c === 0) await G.say('Madame Wexley', 'Una voz preguntó por usted. No le dije que viniera, pero está aquí.');
    else await G.say('Madame Wexley', 'Si me la dictaran, cobraría más.');
    if (G.state.flags.comb_custody === 'pike') {
      // the comb is with Pike's evidence: she knows it anyway
      await G.say('Madame Wexley', 'Siéntese. Esta mañana ha tenido algo de ella en las manos. Todavía lo lleva encima, aunque ya no lo tenga.');
      w.talking = false;
      await G.think('El peine. Se lo di a Pike. No se lo he contado a nadie.');
      G.objective('Sentarse a la mesa de la sesión.');
    } else {
      await G.say('Madame Wexley', 'Siéntese. Lo que guarda en el bolsillo: póngalo sobre la mesa.');
      w.talking = false;
      await G.think('El peine. No se lo he mostrado.');
      G.objective('Poner el peine de Annie sobre la mesa.');
    }
    G.sanity(-3);
  },

  hotspots: [
    {
      id: 'table', name: 'Mesa de la sesión', rect: [TABLE_X - 160, GROUND - 180, 320, 120], walk: TABLE_X - 230, face: 1,
      act: async (G) => {
        // first the table speaks by itself; then its knocks can be read; then the séance
        if (!G.flag('raps_heard') && !G.flag('seance_done')) { await G.game.chapterHooks.tableKnocks(G); return; }
        if (!G.hasClue('hospes')) { await G.game.chapterHooks.raps(G); return; }
        if (G.flag('seance_done')) { G.audio.tick(); return; }
        // Pike has the comb: sitting down is enough, Annie is described aloud instead
        if (G.state.flags.comb_custody === 'pike') { await G.game.chapterHooks.seance(G); return; }
        G.audio.tick();   // the empty place at the table, waiting for the comb: no words
      },
      use: async (G, item) => {
        if (item !== 'peine' || G.flag('seance_done')) return false;
        if (!G.hasClue('hospes')) {
          const w = G.actor('Wexley'); w.talking = true;
          await G.say('Madame Wexley', 'Todavía no. La mesa ya está diciendo algo; escúchela primero.');
          w.talking = false;
          return true;
        }
        await G.game.chapterHooks.seance(G);
        return true;
      },
    },
    {
      id: 'wexley', name: 'Madame Orla Wexley', cursor: 'talk', rect: [TABLE_X + 130, GROUND - 200, 90, 200], walk: TABLE_X - 230, face: 1,
      act: async (G) => {
        const w = G.actor('Wexley'); w.talking = true;
        if (G.flag('seance_done')) {
          await G.say('Madame Wexley', 'Fuera, inspector. Ahora.');
          w.talking = false;
          const c = await G.choice(['¿El qué?', '(Salir sin decir nada)']);
          if (c === 0) { w.talking = true; await G.say('Madame Wexley', 'No es el abrigo lo que debe quitarse.'); w.talking = false; G.sanityOnce('wexley_done', -3); }
          return;
        }
        if (!G.flag('wex_q1')) {
          G.flag('wex_q1', true);
          await G.say('Madame Wexley', 'A un policía le cobraría el doble. A usted no le cobraré nada.');
          await G.say('Madame Wexley', 'Aquí tapamos los espejos cuando alguien muere. Yo no lo hice. Creí que era más valiente.');
        } else {
          await G.say('Madame Wexley', G.state.flags.comb_custody === 'pike' ? 'Siéntese cuando quiera. Ella ya está aquí.' : 'El peine. No estoy fingiendo que no lo veo.');
        }
        w.talking = false;
      },
    },
    {
      id: 'mirror', name: 'Espejo', rect: [TABLE_X - 130, 110, 260, 300], walk: TABLE_X - 230, face: 1,
      act: async (G) => {
        const n = (G.state.flags.wex_mirror || 0) + 1; G.state.flags.wex_mirror = n;
        if (n === 1) await G.think('Prefiero no mirar.');
        else if (n === 2) {
          G.audio.whisper(1.2, 0.08); G.sanity(-3);
        } else await G.think('No.');
      },
    },
    {
      id: 'widow', name: 'Viuda', cursor: 'talk', rect: [TABLE_X - 200, GROUND - 190, 80, 190], walk: TABLE_X - 260,
      act: async (G) => {
        if (G.flag('seance_done')) {  return; }
        await G.say('Viuda', 'Mi marido se ahogó hace dos inviernos. Vengo cuando me alcanza para la entrada.');
        await G.say('Viuda', 'Nunca es su voz. La señora dice que es él. Yo conozco la voz de mi marido.');
      },
    },
    {
      id: 'young', name: 'Joven', cursor: 'talk', rect: [TABLE_X + 10, GROUND - 210, 70, 120], walk: TABLE_X - 230,
      act: async (G) => {
        if (G.flag('seance_done')) {  return; }
        await G.say('Joven', 'Del Star. No, no me creo lo que dice.');
        await G.say('Joven', 'Pero tampoco me iré sin escucharla terminar.');
      },
    },
    {
      id: 'clock', name: 'Reloj de la repisa', rect: [430, GROUND - 210, 60, 56], walk: 460,
      act: async (G) => {
        await G.think('Tres y cuarto. La primera ronda de Neil.');
        G.audio.tick(); G.sanityOnce('clock', -2);
      },
    },
    {
      id: 'chart', name: 'Carta astral', rect: [930, 150, 96, 96], walk: 980,
      act: async (G) => {
        await G.think('«T. A.» y mi fecha. ¿Quién le contó eso?');
        if (!G.flag('knock_board')) {
          G.flag('knock_board', true);
          if (G.flag('raps_heard') && !G.hasClue('hospes')) G.objective('Leer los golpes con la tabla de letras de la pared (en la mesa).');
          await G.think('Dos grupos de golpes. Fila y columna. Como en las cárceles del zar.');
        }
        G.sanityOnce('chart', -3);
      },
    },
    {
      id: 'door', name: 'Salir a Fournier Street', cursor: 'exit', rect: [180, GROUND - 280, 140, 280], walk: 250, face: -1,
      act: async (G) => {
        if (!G.flag('seance_done')) { await G.think('Todavía no sé quién conoce a Nat.'); return; }
        await G.game.chapterHooks.leaveSeance(G);
      },
    },
  ],
};
