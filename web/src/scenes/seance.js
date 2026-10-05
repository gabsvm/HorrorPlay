// Chapter 2 — Madame Wexley's parlour, Fournier Street, the night of 8 September.
import * as A from '../art/paint.js';
import { wallpaper, wainscot, floorboards, rug, chair } from '../art/build.js';
import { P, shade } from '../art/palette.js';
import { Actor } from '../engine/actor.js';

const WIDTH = 1400, GROUND = 664;
const TABLE_X = 760;

export default {
  id: 'seance',
  width: WIDTH,
  groundY: GROUND,
  walk: [200, 1260],
  spawn: 240,
  playerH: 252,
  surface: 'wood',
  indoor: true,
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
      floorboards(ctx, 0, GROUND - 6, WIDTH, 720 - GROUND + 6, { color: '#2e1f16' });
      rug(ctx, TABLE_X - 300, GROUND + 6, 600, 50);
      // heavy drapes
      for (const x of [0, 1240]) {
        ctx.fillStyle = '#2a0d0c';
        ctx.fillRect(x, 20, 160, GROUND - 20);
        for (let k = 0; k < 6; k++) { ctx.fillStyle = `rgba(0,0,0,${0.15 + (k % 2) * 0.2})`; ctx.fillRect(x + k * 27, 20, 12, GROUND - 20); }
      }
      // door
      A.door(ctx, 190, GROUND - 270, 116, 270, { color: '#2a1a12', steps: 0 });
      // the mirror: gilt frame, black glass. It reflects the room but never the inspector.
      ctx.fillStyle = '#5a4520'; ctx.fillRect(TABLE_X - 130, 110, 260, 300);
      ctx.fillStyle = '#3a2c14'; ctx.fillRect(TABLE_X - 118, 122, 236, 276);
      A.vgrad(ctx, TABLE_X - 110, 130, 220, 260, [[0, '#14181a'], [1, '#0b0d0e']]);
      // reflected room: table edge, candles, two seated clients
      ctx.fillStyle = '#060707'; ctx.fillRect(TABLE_X - 110, 330, 220, 60);
      ctx.fillStyle = '#0a0b0b';
      ctx.beginPath(); ctx.ellipse(TABLE_X - 60, 300, 16, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(TABLE_X - 80, 316, 40, 30);
      ctx.beginPath(); ctx.ellipse(TABLE_X + 50, 304, 15, 19, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(TABLE_X + 32, 318, 38, 30);
      ctx.fillStyle = '#c99858'; for (const dx of [-20, 4, 28]) ctx.fillRect(TABLE_X + dx, 318, 3, 8);
      ctx.fillStyle = '#5a4520'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(TABLE_X - 130 + i * 65, 108, 9, Math.PI, 0); ctx.fill(); }
      // spirit cabinet and side table with trumpet
      ctx.fillStyle = '#1a0f0b'; ctx.fillRect(1060, GROUND - 330, 150, 330);
      ctx.fillStyle = '#2c0f0e'; ctx.fillRect(1070, GROUND - 320, 130, 310);
      ctx.fillStyle = '#20150e'; ctx.fillRect(360, GROUND - 100, 100, 10); ctx.fillRect(400, GROUND - 90, 12, 90);
      ctx.fillStyle = '#8a7a4a'; ctx.beginPath(); ctx.moveTo(380, GROUND - 104); ctx.lineTo(450, GROUND - 120); ctx.lineTo(450, GROUND - 100); ctx.closePath(); ctx.fill();
      // framed photographs of "spirits"
      for (let i = 0; i < 3; i++) { ctx.fillStyle = '#2a2014'; ctx.fillRect(380 + i * 70, 200 + (i % 2) * 20, 50, 66); ctx.fillStyle = '#6a6660'; ctx.fillRect(386 + i * 70, 206 + (i % 2) * 20, 38, 54); A.stain(ctx, 386 + i * 70, 206 + (i % 2) * 20, 38, 54, { seed: i, alpha: 0.7 }); }
    });
    lights.push({ id: 'c1', x: TABLE_X - 30, y: GROUND - 150, r: 420, color: P.candle, intensity: 0.9, flicker: 0.25, halo: 60 });
    lights.push({ id: 'c2', x: TABLE_X + 10, y: GROUND - 156, r: 420, color: P.candle, intensity: 0.9, flicker: 0.25, halo: 60 });
    lights.push({ id: 'c3', x: TABLE_X + 50, y: GROUND - 150, r: 420, color: P.candle, intensity: 0.9, flicker: 0.25, halo: 60 });
    const fg = R.paintLayer(WIDTH * 1.2, (ctx) => {
      ctx.fillStyle = '#050303';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(160, 200, 90, 720); ctx.lineTo(0, 720); ctx.fill();
      ctx.beginPath(); ctx.moveTo(1680, 0); ctx.quadraticCurveTo(1540, 300, 1600, 720); ctx.lineTo(1680, 720); ctx.fill();
    });
    return { layers: [{ canvas: near, parallax: 1, kind: 'near' }, { canvas: fg, parallax: 1.2, kind: 'fg' }], lights };
  },

  actors() {
    return [
      new Actor('Wexley', { x: TABLE_X + 170, y: GROUND, h: 200, hat: 'shawl', skirt: true, coat: '#2a1c22', facing: -1, pose: 'sit', z: 1 }),
      new Actor('Viuda', { x: TABLE_X - 160, y: GROUND, h: 190, hat: 'bonnet', skirt: true, coat: '#121112', facing: 1, pose: 'sit', z: 1 }),
      new Actor('Joven', { x: TABLE_X + 40, y: GROUND, h: 200, hat: 'none', hair: '#2a1e14', coat: '#2a2a30', facing: -1, pose: 'sit', z: -1 }),
    ];
  },

  drawNearOver(ctx, t) {
    // round table with cloth, three candles (drawn over the seated figures)
    ctx.fillStyle = '#1a0c0a'; ctx.fillRect(TABLE_X - 12, GROUND - 120, 24, 120);
    ctx.fillStyle = '#3a1814';
    ctx.beginPath(); ctx.ellipse(TABLE_X, GROUND - 124, 150, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(TABLE_X - 150, GROUND - 124); ctx.lineTo(TABLE_X - 160, GROUND - 60); ctx.lineTo(TABLE_X + 160, GROUND - 60); ctx.lineTo(TABLE_X + 150, GROUND - 124); ctx.fill();
    const out = this.G?.flag('candles_out');
    for (const dx of [-30, 10, 50]) {
      ctx.fillStyle = '#e0d4b4'; ctx.fillRect(TABLE_X + dx - 3, GROUND - 160 + (dx === 10 ? -6 : 0), 7, 34);
      if (!out) { ctx.fillStyle = '#ffd38a'; ctx.beginPath(); ctx.ellipse(TABLE_X + dx + 0.5, GROUND - 166 + (dx === 10 ? -6 : 0) + Math.sin(t * 8 + dx) * 0.8, 2.5, 6, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    if (this.G?.flag('comb_on_table')) { ctx.fillStyle = '#6a5038'; ctx.fillRect(TABLE_X - 14, GROUND - 130, 28, 5); }
    if (this.G?.flag('mirror_cracked')) {
      ctx.strokeStyle = 'rgba(220,230,230,0.5)'; ctx.lineWidth = 1.2;
      const cx = TABLE_X + 20, cy = 230;
      for (let i = 0; i < 10; i++) { const a = i * 0.63; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 140, cy + Math.sin(a) * 130); ctx.stroke(); }
    }
  },

  async enter(G) {
    this.G = G;
    if (G.flag('se_intro')) return;
    G.flag('se_intro', true);
    G.date('8 de septiembre de 1888', '23:04');
    await G.walk(420);
    const w = G.actor('Wexley'); w.talking = true;
    await G.say('Madame Wexley', 'Inspector Ashgrove. Le estaban esperando.');
    w.talking = false;
    const c = await G.choice(['¿Quién me esperaba?', 'Usted me mandó una nota. Quiero saber quién se la dictó.']);
    w.talking = true;
    if (c === 0) await G.say('Madame Wexley', 'Los que están al otro lado. No suelen pedir a nadie por su nombre, y esta semana han pedido el suyo.');
    else await G.say('Madame Wexley', 'Nadie me dicta nada, inspector. Yo escucho y luego escribo lo que oigo.');
    await G.say('Madame Wexley', 'Siéntese. Y ponga sobre la mesa lo que lleva en el bolsillo. Lo de ella.');
    w.talking = false;
    await G.think('El peine. No se lo he enseñado a nadie.');
    G.objective('Poner el peine de Annie sobre la mesa.');
    G.sanity(-3);
  },

  hotspots: [
    {
      id: 'table', name: 'Mesa de la sesión', rect: [TABLE_X - 160, GROUND - 180, 320, 120], walk: TABLE_X - 230, face: 1,
      act: async (G) => {
        if (G.flag('seance_done')) { await G.think('La cera de las velas sigue blanda.'); return; }
        await G.think('Tres velas, un mantel de terciopelo gastado y huellas de dedos en la madera. Wexley espera a que deje algo encima.');
      },
      use: async (G, item) => {
        if (item !== 'peine' || G.flag('seance_done')) return false;
        await G.game.chapterHooks.seance(G);
        return true;
      },
    },
    {
      id: 'wexley', name: 'Madame Orla Wexley', cursor: 'talk', rect: [TABLE_X + 130, GROUND - 200, 90, 200], walk: TABLE_X - 230, face: 1,
      act: async (G) => {
        const w = G.actor('Wexley'); w.talking = true;
        if (G.flag('seance_done')) {
          await G.say('Madame Wexley', 'Váyase, por favor. Y llévese eso con usted.');
          w.talking = false;
          const c = await G.choice(['¿El qué?', '(Salir sin decir nada)']);
          if (c === 0) { w.talking = true; await G.say('Madame Wexley', 'Lo que lleva puesto, inspector. No hablo del abrigo.'); w.talking = false; G.sanity(-3); }
          return;
        }
        if (!G.flag('wex_q1')) {
          G.flag('wex_q1', true);
          await G.say('Madame Wexley', 'No cobro a la policía. Usted no ha venido por voluntad propia.');
          await G.say('Madame Wexley', 'En esta calle casi todos tapamos los espejos cuando hay un muerto, para que no se quede atrapado dentro. Yo dejo el mío destapado, para que puedan mirar.');
        } else {
          await G.say('Madame Wexley', 'El peine, inspector. Encima de la mesa.');
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
          await G.think('Se ve la mesa, las velas, la viuda y el joven. Hay tan poca luz que no consigo encontrarme.');
          G.audio.whisper(1.2, 0.08); G.sanity(-3);
        } else await G.think('No.');
      },
    },
    {
      id: 'widow', name: 'Viuda', cursor: 'talk', rect: [TABLE_X - 200, GROUND - 190, 80, 190], walk: TABLE_X - 260,
      act: async (G) => {
        if (G.flag('seance_done')) { await G.think('Se ha ido sin despedirse. Su silla sigue caliente.'); return; }
        await G.say('Viuda', 'Mi marido se ahogó en el muelle de la Reina Victoria. Vengo todos los sábados.');
        await G.say('Viuda', 'Nunca habla él. Siempre habla otro que se hace pasar por él.');
      },
    },
    {
      id: 'young', name: 'Joven', cursor: 'talk', rect: [TABLE_X + 10, GROUND - 210, 70, 120], walk: TABLE_X - 230,
      act: async (G) => {
        if (G.flag('seance_done')) { await G.think('Ha salido corriendo. Ni ha cogido el sombrero.'); return; }
        await G.say('Joven', 'Soy periodista, del Star. No crea que me lo trago.');
        await G.say('Joven', 'Aunque si esta noche pasa algo, mañana venderemos cien mil ejemplares.');
      },
    },
    {
      id: 'trumpet', name: 'Trompeta de espiritismo', rect: [360, GROUND - 130, 110, 40], walk: 470,
      act: async (G) => { await G.think('Una trompeta de latón para que "los espíritus" hablen por ella. Un truco de feria.'); },
    },
    {
      id: 'photos', name: 'Fotografías de espíritus', rect: [370, 190, 220, 110], walk: 470,
      act: async (G) => { await G.think('Fotografías de difuntos, con "espíritus" añadidos con doble exposición. Una de ellas tiene la cara borrada por la humedad, o eso parece.'); },
    },
    {
      id: 'door', name: 'Salir a Fournier Street', cursor: 'exit', rect: [180, GROUND - 280, 140, 280], walk: 250, face: -1,
      act: async (G) => {
        if (!G.flag('seance_done')) { await G.think('He venido a saber quién le habló de mí. No me voy sin saberlo.'); return; }
        await G.game.chapterHooks.leaveSeance(G);
      },
    },
  ],
};
