// Chapter 2 — backyard of 29 Hanbury Street, 8 September 1888, just after six in the morning.
import * as A from '../art/paint.js';
import { doorSteps, leatherApron } from '../art/props.js';
import { facade } from '../art/build.js';
import { P, shade } from '../art/palette.js';
import { Actor } from '../engine/actor.js';
import { canLeaveHanbury } from '../story/progression.js';

// what the yard still asks before the passage, in the order it is natural to get it
function hanburyObjective(G) {
  const gate = canLeaveHanbury(G.state);
  G.objective(gate.ok ? 'Salir por el pasillo a Hanbury Street.' : `${gate.missing.join('; ').replace(/^./, (m) => m.toUpperCase())}. Luego salir por el pasillo.`);
}
import { rng } from '../art/noise.js';
import { Smoke, Drip, Crow, Cat } from '../engine/life.js';
import { drawCorpse } from './corpse.js';

const WIDTH = 2000, GROUND = 630;

export default {
  id: 'hanbury',
  width: WIDTH,
  groundY: GROUND,
  space: 'yard',
  walk: [180, 1860],
  spawn: 260,
  lantern: false,
  ambient: [0.11, 0.125, 0.15],
  fog: { density: 0.5, amount: 0.45, color: [0.55, 0.6, 0.64], speed: 6, ground: 0.6 },
  rain: 0.08,
  beds: { rain: 0.15, wind: 0.3, crowd: 0.25 },
  music: 'dread',
  date: '8 de septiembre de 1888',

  build(R) {
    const lights = [];
    const chimneys = [];
    const sky = R.paintLayer(1280 + (WIDTH - 1280) * 0.2, (ctx, w, h) => {
      A.sky(ctx, w, h, { top: '#232b31', mid: '#46525a', low: '#8a8e88', glow: 'rgba(220,200,170,0.3)', glowY: 0.42, seed: 81, rim: '#9aa2a0' });
      A.skyline(ctx, { w, baseY: 300, seed: 82, color: '#2a3034', minH: 60, maxH: 160, spire: { x: 700, h: 360 } });
      A.vgrad(ctx, 0, 100, w, 260, [[0, 'rgba(130,140,140,0)'], [1, 'rgba(130,140,140,0.5)']]);
    });
    const near = R.paintLayer(WIDTH, (ctx) => {
      // back of No. 29: three storeys of soot-black stock brick, back door with two stone steps
      const back = facade(ctx, { x: 0, w: 760, top: -130, base: GROUND - 10, seed: 101, floors: 3, windows: 3, roof: 'parapet', broken: [1], litMap: [5], nets: [5], stock: true });
      back.forEach((c) => lights.push({ x: c.x, y: c.y, r: 220, color: P.candle, intensity: 0.4, flicker: 0.15, halo: 30 }));
      chimneys.push(...back.chimneys);
      // the back door stands two steps up from the yard, half open on the dark passage
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(560, GROUND - 246, 96, 210);
      A.door(ctx, 566, GROUND - 240, 84, 204, { color: '#3a2c20', open: 0.35, steps: 0, fanlight: false, knocker: false, scraper: false });
      ctx.fillStyle = '#4a443a'; ctx.fillRect(556, GROUND - 40, 104, 6);                     // the sill
      doorSteps(ctx, 608, GROUND - 2, { count: 2, rise: 17, width: 112, grow: 28, stone: '#6a655a' });
      // the passage through the house to the street
      ctx.fillStyle = '#060606'; ctx.fillRect(40, GROUND - 240, 110, 230);
      ctx.fillStyle = '#2a2018'; ctx.fillRect(32, GROUND - 248, 126, 10);
      // packing cases from the cellar workshop, stacked against the house
      A.crate(ctx, 190, GROUND - 74, 80, 64, 21, { stencil: 'RICHARDSON' });
      A.crate(ctx, 200, GROUND - 130, 64, 56, 22);
      A.crate(ctx, 280, GROUND - 58, 60, 48, 23);
      // dolly tub, washboard and a mangle by the back wall
      A.barrel(ctx, 380, GROUND - 52, 46, 42);
      ctx.fillStyle = '#6a6458'; ctx.fillRect(398, GROUND - 74, 14, 26);
      ctx.fillStyle = P.iron; ctx.fillRect(452, GROUND - 120, 6, 110); ctx.fillRect(500, GROUND - 120, 6, 110); ctx.fillRect(452, GROUND - 120, 54, 6);
      ctx.fillStyle = P.wood; ctx.fillRect(458, GROUND - 104, 42, 10); ctx.fillRect(458, GROUND - 92, 42, 10);
      ctx.strokeStyle = P.iron; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(530, GROUND - 98, 18, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = P.iron; ctx.fillRect(546, GROUND - 100, 14, 4);
      // neighbouring houses, their ground floor hidden by the fence
      const mid = facade(ctx, { x: 760, w: 520, top: 118, base: GROUND - 10, seed: 102, floors: 2, windows: 3, roof: 'parapet', kind: 'plaster', litMap: [1], nets: [1] });
      mid.forEach((c) => lights.push({ x: c.x, y: c.y, r: 180, color: P.candle, intensity: 0.35, flicker: 0.15, halo: 24 }));
      chimneys.push(...mid.chimneys);
      // the fence, about five feet high, between this yard and No. 27
      ctx.fillStyle = '#121110'; ctx.fillRect(690, GROUND - 160, 870, 160);
      const r = rng(9);
      for (let x = 690; x < 1560; x += 22) {
        ctx.fillStyle = shade(P.wood, r.range(0.62, 0.88));
        const top = GROUND - 150 - r.range(0, 8);
        ctx.fillRect(x, top, 20, GROUND - top);
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + 10, top - 8); ctx.lineTo(x + 20, top); ctx.fill();
        ctx.fillStyle = 'rgba(255,230,200,0.06)'; ctx.fillRect(x + 2, top, 2, GROUND - top);
        if (r.chance(0.2)) { ctx.fillStyle = '#0a0a0a'; ctx.fillRect(x + r.range(4, 14), GROUND - r.range(30, 120), 3, 6); }
      }
      ctx.fillStyle = P.woodDark; ctx.fillRect(690, GROUND - 120, 870, 9); ctx.fillRect(690, GROUND - 40, 870, 9);
      A.stain(ctx, 690, GROUND - 160, 870, 160, { seed: 5, alpha: 0.55 });
      const right = facade(ctx, { x: 1280, w: 720, top: -130, base: GROUND - 10, seed: 103, floors: 3, windows: 4, roof: 'parapet', broken: [2, 7], boards: [5], stock: true });
      chimneys.push(...right.chimneys);
      // the tap over a stone sink against the wall
      ctx.fillStyle = '#5e5a52'; ctx.fillRect(1600, GROUND - 60, 120, 50); ctx.fillStyle = '#121a1c'; ctx.fillRect(1606, GROUND - 58, 108, 8);
      ctx.fillStyle = P.iron; ctx.fillRect(1650, GROUND - 150, 10, 90); ctx.fillRect(1650, GROUND - 150, 34, 8); ctx.fillRect(1678, GROUND - 146, 6, 18);
      ctx.fillStyle = '#9a8350'; ctx.fillRect(1672, GROUND - 160, 18, 6);
      // privy with a heart cut in the door
      A.crate(ctx, 1760, GROUND - 70, 80, 60, 7);
      ctx.fillStyle = shade(P.wood, 0.6); ctx.fillRect(1860, GROUND - 230, 120, 220);
      for (let x = 1862; x < 1980; x += 14) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, GROUND - 230, 2, 220); }
      ctx.fillStyle = '#16120e'; ctx.beginPath(); ctx.moveTo(1850, GROUND - 230); ctx.lineTo(1990, GROUND - 230); ctx.lineTo(1980, GROUND - 252); ctx.lineTo(1860, GROUND - 252); ctx.fill();
      ctx.fillStyle = '#0c0c0c'; ctx.fillRect(1880, GROUND - 200, 70, 190);
      ctx.fillStyle = shade(P.wood, 0.75); ctx.fillRect(1882, GROUND - 198, 66, 186);
      ctx.fillStyle = '#060606'; ctx.beginPath(); ctx.arc(1909, GROUND - 170, 5, 0, Math.PI * 2); ctx.arc(1921, GROUND - 170, 5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(1904, GROUND - 168); ctx.lineTo(1915, GROUND - 156); ctx.lineTo(1926, GROUND - 168); ctx.fill();
      // yard: beaten earth, broken flagstones, a drain
      A.vgrad(ctx, 0, GROUND - 10, WIDTH, 720 - GROUND + 10, [[0, '#3a3530'], [1, '#262320']]);
      for (let i = 0; i < 48; i++) { ctx.fillStyle = shade(P.stone, r.range(0.5, 0.8)); const fx = r.range(0, WIDTH), fy = r.range(GROUND, 710); ctx.fillRect(fx, fy, r.range(40, 110), r.range(4, 10)); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(fx, fy + 6, 60, 2); }
      A.stain(ctx, 0, GROUND - 10, WIDTH, 100, { seed: 31, alpha: 0.6 });
      A.grit(ctx, 0, GROUND - 10, WIDTH, 100, { seed: 4, density: 1.5 });
      ctx.fillStyle = '#0b0b0b'; ctx.fillRect(1640, GROUND + 12, 40, 10);
      // sawdust strewn over the place between the steps and the fence
      ctx.fillStyle = 'rgba(190,160,110,0.4)'; for (let i = 0; i < 70; i++) ctx.fillRect(560 + r.range(0, 170), GROUND - 4 + r.range(0, 30), 3, 2);
      // laundry line across the yard
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(300, 220); ctx.quadraticCurveTo(1000, 290, 1700, 210); ctx.stroke();
      for (const [lx, lw, lh, c] of [[820, 46, 70, '#8a857a'], [900, 30, 44, '#5a3a32'], [1220, 60, 50, '#6a6458'], [1300, 26, 60, '#7a7462']]) {
        const ly = 262 + Math.round((lx - 820) * 0.0);
        ctx.fillStyle = c; ctx.fillRect(lx, ly, lw, lh); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(lx, ly + lh - 6, lw, 6);
        ctx.fillStyle = '#3a2a1e'; ctx.fillRect(lx + 4, ly - 4, 3, 7); ctx.fillRect(lx + lw - 7, ly - 4, 3, 7);
      }
    });
    lights.push({ x: 1000, y: -200, r: 2200, color: [0.42, 0.46, 0.5], intensity: 0.6, halo: 0, reflect: false });
    const fg = R.paintLayer(WIDTH * 1.25, (ctx) => {
      ctx.fillStyle = '#0a0b0c';
      ctx.fillRect(0, 0, 120, 720); ctx.fillRect(110, 0, 18, 720);
      ctx.fillRect(1500, 520, 30, 200); ctx.fillRect(1460, 600, 120, 8);
      ctx.fillRect(2380, 0, 120, 720);
    });
    return { layers: [{ canvas: sky, parallax: 0.2, kind: 'far' }, { canvas: near, parallax: 1, kind: 'near' }, { canvas: fg, parallax: 1.25, kind: 'fg' }], lights, chimneys };
  },

  makeLife() {
    const b = this.built || {};
    return [
      ...(b.chimneys || []).map((c, i) => new Smoke({ x: c.x, y: c.y, rate: 0.7 + i * 0.1, drift: 30 })),
      new Drip({ x: 1679, y: GROUND - 130, ground: GROUND - 56, period: 1.4 }),
      new Crow({ x: 1300, y: GROUND - 160, facing: -1, seed: 3 }),
      new Cat({ x: 1100, y: GROUND - 156, facing: -1 }),
    ];
  },

  actors() {
    return [
      new Actor('Pike', { x: 900, y: GROUND, h: 200, hat: 'bowler', coat: '#2c2a26', coatLen: 0.9, cape: true, facing: -1, build: 1.05, moustache: '#3a2a1e', buttons: 'double', notebook: true, hair: '#3a2a1e' }),
      new Actor('Greaves', { x: 1150, y: GROUND, h: 214, hat: 'top', coat: '#1d1b1c', coatLen: 0.95, cane: true, beard: '#7a7a74', hair: '#8a8a84', facing: -1, flare: 1.05, tails: true, chain: true, waistcoat: '#3a2a20', buttons: 'double' }),
      new Actor('Amelia', { speaker: 'Sra. Richardson', x: 470, y: GROUND, h: 176, hat: 'bonnet', hatColor: '#1e1a18', skirt: true, coat: '#3a3432', shawl: '#2e2826', facing: 1, stoop: 1, hair: '#6a6660' }),
    ];
  },

  drawNear(ctx, t) {
    // Annie Chapman between the steps and the fence, under the sacking Phillips threw over her
    if (this.G && !this.G.flag('annie_taken') && !this.G.game.inMenu) drawCorpse(ctx, t, { key: 'annie', x: 770, y: GROUND + 14, h: 150, cover: '#5a4a36', look: { hat: 'none', coat: '#2a2420', hair: '#3a2a20', eyesClosed: true } });
    // neighbours leaning out of the windows next door (they charge a penny for the view)
    for (const [x, y, k] of [[1370, 262, 0], [1730, 262, 1], [1550, 506, 2]]) {
      ctx.fillStyle = '#16120f';
      ctx.beginPath(); ctx.ellipse(x + Math.sin(t * 0.7 + k) * 2, y, 11, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - 22, y + 12, 44, 30);
      ctx.fillStyle = '#4a3a30'; ctx.fillRect(x - 6 + Math.sin(t * 0.7 + k) * 2, y - 2, 12, 10);
      if (k === 0) { ctx.fillStyle = '#16120f'; ctx.beginPath(); ctx.ellipse(x, y - 4, 16, 18, 0, Math.PI, 0); ctx.fill(); }
    }
    if (!this.G?.has('peine') && !this.G?.flag('peine_taken')) {
      // a pocket comb of horn, two teeth broken, lying apart from her other things
      ctx.fillStyle = '#7a5e3a'; ctx.fillRect(988, GROUND + 8, 28, 6);
      ctx.fillStyle = '#a07a4a'; ctx.fillRect(988, GROUND + 8, 28, 2);
      ctx.fillStyle = '#3a2a1a'; for (let i = 0; i < 9; i++) if (i !== 3 && i !== 4) ctx.fillRect(989 + i * 3, GROUND + 14, 2, 4);
      const k = ((this.G?.game.r.time || 0) % 2.8) / 2.8;
      if (k < 0.25) { ctx.fillStyle = `rgba(255,236,200,${Math.sin((k / 0.25) * Math.PI) * 0.9})`; ctx.fillRect(1001, GROUND + 2, 2, 12); ctx.fillRect(996, GROUND + 7, 12, 2); }
    }
    // the leather apron by the tap
    leatherApron(ctx, 1612, GROUND + 2);
  },

  async enter(G) {
    this.G = G;
    if (G.flag('hb_intro')) return;
    G.flag('hb_intro', true);
    G.date('8 de septiembre de 1888', '6:20');
    await G.walk(560);
    const pike = G.actor('Pike'); pike.facing = -1;
    await G.say('Pike', 'Dicen en la casa que es Annie, de Dorset Street. Hay que confirmarlo.');
    await G.say('Pike', 'Dicen que hacía ganchillo y vendía flores, cuando la salud la dejaba.');
    await G.say('Pike', 'La encontró Davis, antes de las seis. Phillips espera que la vea antes de moverla.');
    G.objective('Examinar el cuerpo y el patio. Hablar con Pike, con el médico y con la casera.');
  },

  hotspots: [
    {
      id: 'pike', name: 'Sargento Pike', cursor: 'talk', rect: [860, GROUND - 181, 80, 181], walk: 800, face: 1,
      act: async (G) => {
        const pike = G.actor('Pike'); pike.facing = -1; pike.talking = true;
        if (!G.hasClue('ordenados')) {
          await G.say('Pike', 'Phillips calcula entre las cuatro y media y las cinco y media.');
          pike.talking = false;
          await G.say('Ashgrove', '¿Y por qué no han recogido sus cosas?');
          pike.talking = true;
          await G.say('Pike', 'Porque alguien las colocó en fila. Quería que las viéramos así.');
          G.clue('ordenados');
          pike.talking = false;
        } else if (!G.flag('pike_hb2')) {
          G.flag('pike_hb2', true);
          await G.say('Pike', 'Inspector, ¿dónde pasó la noche?');
          pike.talking = false;
          const c = await G.choice(['En mi cuarto. Durmiendo.', '¿Por qué lo pregunta?']);
          pike.talking = true;
          if (c === 0) await G.say('Pike', 'Entendido.');
          else await G.say('Pike', 'No lo haría si no necesitara una respuesta.');
          pike.talking = false;
        } else {
          await G.say('Pike', 'Ya han decidido que fue «Leather Apron». Los diarios. No los testigos.');
        }
        pike.talking = false;
      },
    },
    {
      id: 'greaves', name: 'Dr. Lionel Greaves', cursor: 'talk', rect: [1100, GROUND - 198, 90, 198], walk: 1040, face: 1,
      act: async (G) => {
        const g = G.actor('Greaves'); g.facing = -1; g.talking = true;
        if (!G.flag('greaves_met')) {
          G.flag('greaves_met', true);
          await G.say('Greaves', 'Sigues mirando las manos primero, Thomas.');
          g.talking = false;
          await G.say('Ashgrove', '¿Ha venido por Phillips o por mí?');
          g.talking = true;
          await G.say('Greaves', 'Phillips me pidió que viniera. Lo otro es una pregunta difícil.');
          g.talking = false;
          const c = await G.choice(['¿Qué opina del corte?', 'Me alegro de verle, doctor.']);
          g.talking = true;
          if (c === 0) {
            await G.say('Greaves', 'Parece trabajo de alguien acostumbrado a la disección.');
            await G.say('Greaves', 'Tú tenías buena mano. No era un elogio que hiciera a menudo.');
          } else {
            await G.say('Greaves', 'Habría preferido verte descansado.');
          }
          await G.say('Greaves', '¿Sigues tomando láudano? Si es así, no lo mezcles con ginebra.');
          G.clue('greaves_sabe');
          hanburyObjective(G);
          g.talking = false;
          await G.think('Nunca le he contado a nadie lo del láudano. ¿Cómo lo sabe?');
          G.sanity(-3);
        } else {
          await G.say('Greaves', 'Sabes dónde encontrarme. Y aún conservo tu vieja ficha.');
          g.talking = false;
        }
      },
    },
    {
      id: 'amelia', name: 'Sra. Richardson, la casera', cursor: 'talk', rect: [430, GROUND - 163, 80, 163], walk: 540, face: -1,
      act: async (G) => {
        const a = G.actor('Amelia'); a.talking = true; a.facing = 1;
        if (!G.flag('amelia1')) {
          G.flag('amelia1', true);
          await G.say('Sra. Richardson', 'Diecisiete personas bajo este techo. Dígame cómo nadie oyó nada.');
          await G.say('Sra. Richardson', 'Ese delantal lo lavé yo. Es de mi hijo John. ¿Va a escribirlo o va a preguntar otra vez?');
          a.talking = false;
          await G.think('Del hijo de la casera. Pero estaba a dos pasos del cuerpo.');
        } else {
          await G.say('Sra. Richardson', 'Los de la ventana cobran por mirar. Yo vivo aquí y nadie me deja cerrar la puerta.');
        }
        a.talking = false;
      },
    },
    {
      id: 'apron', name: 'Delantal de cuero', rect: [1590, GROUND - 40, 130, 50], walk: 1560, face: 1,
      act: async (G) => {
        G.player.pose = 'kneel';
        G.clue('delantal');
        hanburyObjective(G);
        G.player.pose = null;
      },
    },
    {
      id: 'comb', name: 'Algo junto a la valla', verb: 'Recoger', when: (G) => !G.flag('peine_taken'), rect: [970, GROUND - 2, 70, 30], walk: 1060, face: -1,
      act: async (G) => {
        G.player.pose = 'kneel';
        await G.think('Dos púas rotas. Alguien dejó el peine fuera del montón.');
        G.player.pose = null;
        // what Thomas decides is what happens: Pike gets it, or it goes in his pocket
        const c = await G.choice(['Dárselo a Pike.', 'Guardármelo.']);
        G.flag('peine_taken', true);
        if (c === 0) {
          G.state.flags.comb_custody = 'pike';
          await G.walk(820);
          const pike = G.actor('Pike'); pike.facing = -1; pike.talking = true;
          await G.say('Pike', 'Lo apunto: un peine de bolsillo, dos púas rotas, junto a la valla. Se queda con las pruebas.');
          pike.talking = false;
        } else {
          G.state.flags.comb_custody = 'thomas';
          G.give('peine');
          await G.think('Me lo guardo. Más tarde se lo daré a Pike.');
        }
        hanburyObjective(G);
      },
    },
    {
      id: 'window', name: 'Ventana trasera', rect: [334, 414, 92, 150], walk: 300, face: 1,
      act: async (G) => {
        if (G.hasClue('reflejo')) { G.audio.whisper(0.6, 0.04); return; }   // only the yard in the glass now
        G.red(0.4); G.audio.sting(0.18); G.shake(6);
        G.face(1);
        await G.wait(600);
        await G.think('No había nadie.');
        G.clue('reflejo');
        G.sanity(-6);
      },
    },
    {
      id: 'steps', name: 'Escalones', rect: [540, GROUND - 48, 140, 50], walk: 700, face: -1,
      act: async (G) => {
        await G.think('La tierra removida, y serrín encima. Alguien ya ha empezado a limpiar.');
      },
    },
    {
      id: 'annie', name: 'El cuerpo de la mujer del patio', verb: 'Examinar', when: (G) => !G.flag('annie_taken'), rect: [690, GROUND - 30, 170, 60], walk: 640, face: 1, gesture: false,
      act: async (G) => {
        // the points sit on the painted close-up (assets/closeups/chapman.jpg)
        await G.inspect('annie', {
          title: 'La mujer del patio de Hanbury Street', body: 'chapman',
          points: [
            { id: 'cara', x: 360, y: 283, r: 60, name: 'La cara', act: async (G) => {
              await G.think('La estrangularon antes de usar el cuchillo.');
              await G.think('Nadie habría oído el segundo ataque.');
            } },
            { id: 'cuello', x: 440, y: 302, r: 42, name: 'El cuello', act: async (G) => {
              await G.think('La incisión es demasiado firme para un primer intento.');
            } },
            { id: 'hombro', x: 398, y: 398, r: 60, name: 'Sobre el hombro', act: async (G) => {
              G.red(0.5); G.audio.sting(0.2); G.shake(4);
              await G.think('Han colocado lo que extrajeron. Con precisión deliberada.');
              G.sanityOnce('hanbury_hombro', -3);
              await G.think('Lo vi en la sala de disección. No quiero volver a verlo.');
            } },
            { id: 'saco', key: true, x: 1034, y: 322, r: 100, name: 'Bajo el saco', act: async (G) => {
              await G.think('Extrajo un órgano entero. Sabía cómo separarlo.');
              G.clue('falta');
            } },
            { id: 'mano', key: true, x: 819, y: 536, r: 50, name: 'La mano', act: async (G) => {
              await G.think('Quedan marcas de dos anillos arrancados.');
              await G.think('Latón barato. No se los llevó por dinero.');
              G.clue('anillos');
            } },
            { id: 'cosas', x: 1090, y: 588, r: 110, name: 'Sus cosas', act: async (G) => {
              G.clue('ordenados');
            } },
          ],
        });
      },
    },
    {
      id: 'passage', name: 'Pasillo a Hanbury Street', cursor: 'exit', rect: [30, GROUND - 250, 130, 250], walk: 190, face: -1,
      act: async (G) => {
        // what the yard still asks, in the order it is natural to get it (story/progression.js)
        const gate = canLeaveHanbury(G.state);
        if (!gate.ok) {
          await G.think(`Antes de irme: ${gate.missing[0]}.`);
          G.objective(`${gate.missing.join('; ').replace(/^./, (m) => m.toUpperCase())}. Luego salir por el pasillo.`);
          return;
        }
        G.flag('annie_taken', true);
        await G.game.chapterHooks.leaveHanbury(G);
      },
    },
  ],
};
