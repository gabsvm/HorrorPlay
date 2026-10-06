// Chapter 2 — backyard of 29 Hanbury Street, 8 September 1888, just after six in the morning.
import * as A from '../art/paint.js';
import { facade } from '../art/build.js';
import { P, shade } from '../art/palette.js';
import { Actor } from '../engine/actor.js';
import { rng } from '../art/noise.js';
import { Smoke, Drip, Crow, Cat } from '../engine/life.js';
import { drawCorpse } from './corpse.js';

const WIDTH = 2000, GROUND = 630;

export default {
  id: 'hanbury',
  width: WIDTH,
  groundY: GROUND,
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
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(560, GROUND - 210, 96, 200);
      A.door(ctx, 566, GROUND - 204, 84, 194, { color: '#3a2c20', open: 0.35, steps: 0, fanlight: false, knocker: false, scraper: false });
      ctx.fillStyle = shade(P.stone, 0.85); ctx.fillRect(546, GROUND - 22, 126, 12); ctx.fillStyle = shade(P.stone, 0.75); ctx.fillRect(536, GROUND - 10, 146, 12);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(546, GROUND - 12, 126, 2);
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
      new Actor('Amelia', { x: 470, y: GROUND, h: 176, hat: 'bonnet', hatColor: '#1e1a18', skirt: true, coat: '#3a3432', shawl: '#2e2826', facing: 1, stoop: 1, hair: '#6a6660' }),
    ];
  },

  drawNear(ctx, t) {
    // Annie Chapman between the steps and the fence, under the sacking Phillips threw over her
    if (this.G && !this.G.flag('annie_taken')) drawCorpse(ctx, t, { key: 'annie', x: 650, y: GROUND + 14, h: 150, cover: '#5a4a36', look: { hat: 'none', coat: '#2a2420', hair: '#3a2a20', eyesClosed: true } });
    // neighbours leaning out of the windows next door (they charge a penny for the view)
    for (const [x, y, k] of [[1370, 262, 0], [1730, 262, 1], [1550, 506, 2]]) {
      ctx.fillStyle = '#16120f';
      ctx.beginPath(); ctx.ellipse(x + Math.sin(t * 0.7 + k) * 2, y, 11, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - 22, y + 12, 44, 30);
      ctx.fillStyle = '#4a3a30'; ctx.fillRect(x - 6 + Math.sin(t * 0.7 + k) * 2, y - 2, 12, 10);
      if (k === 0) { ctx.fillStyle = '#16120f'; ctx.beginPath(); ctx.ellipse(x, y - 4, 16, 18, 0, Math.PI, 0); ctx.fill(); }
    }
    if (!this.G?.has('peine') && !this.G?.flag('peine_taken')) { ctx.fillStyle = '#5a4630'; ctx.fillRect(760, GROUND + 6, 22, 5); ctx.fillStyle = '#2a1e14'; for (let i = 0; i < 6; i++) ctx.fillRect(761 + i * 3.5, GROUND + 10, 2, 3); }
    // the leather apron by the tap
    ctx.fillStyle = '#4a2e1c';
    ctx.beginPath(); ctx.moveTo(1610, GROUND - 4); ctx.quadraticCurveTo(1640, GROUND - 30, 1700, GROUND - 8); ctx.lineTo(1706, GROUND + 6); ctx.lineTo(1604, GROUND + 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,230,200,0.12)'; ctx.fillRect(1626, GROUND - 16, 40, 3);
  },

  async enter(G) {
    this.G = G;
    if (G.flag('hb_intro')) return;
    G.flag('hb_intro', true);
    G.date('8 de septiembre de 1888', '6:20');
    await G.walk(800);
    await G.think('En la calle hay vecinos cobrando un penique por asomarse a la ventana a mirar el patio.');
    const pike = G.actor('Pike'); pike.facing = -1;
    await G.say('Pike', 'Annie Chapman. Cuarenta y siete años. Vendía flores y ganchillo cuando estaba sana. Ya no lo estaba.');
    await G.say('Pike', 'La encontró un vecino a las seis menos cuarto, entre los escalones y la valla. Phillips no ha querido que la muevan hasta que usted la viera.');
    await G.narrate('Pike escribe la hora en la libreta.');
    G.objective('Examinar el cuerpo y el patio. Hablar con Pike, con el médico y con la casera.');
  },

  hotspots: [
    {
      id: 'pike', name: 'Sargento Pike', cursor: 'talk', rect: [860, GROUND - 181, 80, 181], walk: 800, face: 1,
      act: async (G) => {
        const pike = G.actor('Pike'); pike.facing = -1; pike.talking = true;
        if (!G.hasClue('ordenados')) {
          await G.say('Pike', 'El doctor Phillips dice que la mataron entre las cuatro y media y las cinco y media. Y otra cosa más.');
          await G.say('Pike', 'Sus pertenencias estaban a sus pies: un trozo de muselina, un peine, un sobre roto. En fila, colocadas con cuidado.');
          G.clue('ordenados');
          pike.talking = false;
          await G.think('Ordenadas como el instrumental antes de una operación.');
        } else if (!G.flag('pike_hb2')) {
          G.flag('pike_hb2', true);
          await G.say('Pike', '¿Dónde estuvo anoche, inspector?');
          pike.talking = false;
          const c = await G.choice(['En mi cuarto. Durmiendo.', '¿Por qué lo pregunta?']);
          pike.talking = true;
          if (c === 0) await G.say('Pike', 'Bien.');
          else await G.say('Pike', 'Por la libreta, señor. Se lo pregunto a todos.');
          pike.talking = false;
          await G.narrate('Escribe algo. Esta vez tarda más.');
        } else {
          await G.say('Pike', 'La gente ya está diciendo "Leather Apron". Los periódicos se lo han puesto fácil.');
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
          await G.say('Greaves', 'Thomas. Cuánto tiempo.');
          await G.say('Greaves', 'Ayudo a Phillips con la autopsia. Me alegra ver que te ha ido bien, después de... la facultad.');
          g.talking = false;
          const c = await G.choice(['¿Qué opina del corte?', 'Me alegro de verle, doctor.']);
          g.talking = true;
          if (c === 0) {
            await G.say('Greaves', 'Que quien lo hizo ha pasado tiempo en una sala de disección. Mucho tiempo.');
            await G.say('Greaves', 'Tú lo sabrías mejor que yo. Eras el mejor de tu promoción con el bisturí.');
          } else {
            await G.say('Greaves', 'Y yo de verte a ti. Aunque tienes cara de no dormir.');
          }
          await G.say('Greaves', '¿Has vuelto al láudano? No se te ocurra mezclarlo con ginebra.');
          G.clue('greaves_sabe');
          if (G.hasClue('delantal')) G.objective('Salir por el pasillo a Hanbury Street.');
          g.talking = false;
          await G.think('Nunca le he contado a nadie lo del láudano. ¿Cómo lo sabe?');
          G.sanity(-3);
        } else {
          await G.say('Greaves', 'Ven a verme al hospital si necesitas algo para dormir, Thomas. Lo digo en serio.');
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
          await G.say('Sra. Richardson', 'Diecisiete personas duermen en esta casa, inspector. Diecisiete. Y nadie oyó nada.');
          await G.say('Sra. Richardson', 'El delantal que hay junto al grifo es de mi hijo John. Lo lavé yo misma el jueves y lo dejé ahí para que se secara. Ya se lo he dicho a sus hombres.');
          a.talking = false;
          await G.think('Eso dice. Pero el delantal también estaba en la escena.');
        } else {
          await G.say('Sra. Richardson', 'Esos de la ventana están cobrando por mirar. A mí ni me han preguntado.');
        }
        a.talking = false;
      },
    },
    {
      id: 'apron', name: 'Delantal de cuero', rect: [1590, GROUND - 40, 130, 50], walk: 1560, face: 1,
      act: async (G) => {
        G.player.pose = 'kneel';
        await G.think('Un delantal de cuero, empapado, tirado junto al grifo.');
        G.clue('delantal');
        if (G.flag('greaves_met')) G.objective('Salir por el pasillo a Hanbury Street.');
        G.player.pose = null;
        await G.think('Los periódicos llevan una semana hablando de un tal "Leather Apron". Ahora tendrán su delantal.');
      },
    },
    {
      id: 'comb', name: 'Algo junto a la valla', when: (G) => !G.flag('peine_taken'), rect: [740, GROUND - 6, 70, 30], walk: 720, face: 1,
      act: async (G) => {
        G.player.pose = 'kneel';
        await G.think('Un peine de bolsillo con dos púas rotas, apartado de las otras cosas. Se les ha pasado.');
        G.player.pose = null;
        const c = await G.choice(['Dárselo a Pike.', 'Guardármelo.']);
        if (c === 0) {
          await G.think('Me acerco a Pike con el peine en la mano...');
          await G.think('...y cuando llego, ya no lo tengo en la mano. Lo tengo en el bolsillo del abrigo, y no recuerdo haberlo metido ahí.');
          G.sanity(-4);
        } else {
          await G.think('Me lo guardo. Más tarde se lo daré a Pike.');
        }
        G.flag('peine_taken', true);
        G.give('peine');
      },
    },
    {
      id: 'window', name: 'Ventana trasera', rect: [334, 414, 92, 150], walk: 300, face: 1,
      act: async (G) => {
        if (G.hasClue('reflejo')) { await G.think('Ahora solo se ve la cocina de la señora Richardson.'); return; }
        await G.think('En el cristal sucio se refleja el patio, la valla y yo. Y alguien detrás de mí, muy cerca.');
        G.red(0.4); G.audio.sting(0.18); G.shake(6);
        G.face(1);
        await G.wait(600);
        await G.think('No hay nadie.');
        G.clue('reflejo');
        G.sanity(-6);
      },
    },
    {
      id: 'steps', name: 'Escalones', rect: [530, GROUND - 30, 160, 40], walk: 700, face: -1,
      act: async (G) => {
        await G.think('Aquí, entre los escalones y la valla. La tierra está removida y alguien ha echado serrín.');
        await G.think('En esta casa duermen diecisiete personas, y hubo luz de sobra para verlo todo. Nadie vio nada.');
      },
    },
    {
      id: 'annie', name: 'El cuerpo de Annie Chapman', verb: 'Examinar', when: (G) => !G.flag('annie_taken'), rect: [560, GROUND - 30, 180, 60], walk: 790, face: -1, gesture: false,
      act: async (G) => {
        await G.think('Aparto el saco.');
        await G.inspect('annie', {
          title: 'Annie Chapman', body: 'chapman',
          points: [
            { id: 'cara', x: 300, y: 350, r: 60, name: 'La cara', act: async (G) => {
              await G.think('La cara hinchada, la lengua entre los dientes. La estrangularon primero, hasta dejarla sin sentido.');
              await G.think('Por eso nadie oyó nada. Cuando empezó a cortar, ella ya no podía gritar.');
            } },
            { id: 'cuello', x: 412, y: 350, r: 50, name: 'El cuello', act: async (G) => {
              await G.think('El corte da toda la vuelta. Casi le separa la cabeza. Hay que tener mucha fuerza en la mano, o mucha costumbre.');
            } },
            { id: 'hombro', x: 560, y: 175, r: 70, name: 'Sobre el hombro', act: async (G) => {
              G.red(0.5); G.audio.sting(0.2); G.shake(4);
              await G.think('Sobre el hombro derecho, lo que le sacaron del vientre. No está tirado: está colocado.');
              G.sanity(-5);
              await G.think('He visto esto antes. En una mesa de mármol, en el London Hospital, con un profesor señalando con el puntero.');
            } },
            { id: 'saco', x: 950, y: 360, r: 90, name: 'Bajo el saco', act: async (G) => {
              await G.think('Phillips dejó el saco sobre el vientre. No hace falta levantarlo: me lo contó Greaves.');
              await G.think('Falta algo de dentro. Lo sacó entero, con cortes limpios. Sabía dónde estaba y cómo se suelta.');
              G.clue('falta');
            } },
            { id: 'mano', x: 900, y: 540, r: 55, name: 'La mano', act: async (G) => {
              await G.think('En el dedo, dos marcas claras y la piel levantada. Le arrancaron los anillos.');
              await G.think('Anillos de latón; no valían nada. No los cogió para venderlos.');
              G.clue('anillos');
            } },
            { id: 'cosas', x: 1140, y: 556, r: 80, name: 'Sus cosas', act: async (G) => {
              await G.think('Un trozo de muselina, un sobre roto con el sello de un regimiento, dos peniques. En fila, a sus pies.');
              G.clue('ordenados');
              await G.think('Como el instrumental antes de una operación.');
            } },
          ],
        });
        await G.think('Vuelvo a taparla. Ahora me miran todos los de las ventanas.');
      },
    },
    {
      id: 'neighbours', name: 'Vecinos en las ventanas', rect: [1300, 150, 600, 190], walk: 1500,
      act: async (G) => { await G.think('Los de la casa de al lado cobran un penique por asomarse a mirar el patio. Ya hay cola en la calle.'); },
    },
    {
      id: 'passage', name: 'Pasillo a Hanbury Street', cursor: 'exit', rect: [30, GROUND - 250, 130, 250], walk: 190, face: -1,
      act: async (G) => {
        if (!G.hasClue('delantal') || !G.flag('greaves_met')) { await G.think('Todavía no he terminado aquí.'); return; }
        G.flag('annie_taken', true);
        await G.game.chapterHooks.leaveHanbury(G);
      },
    },
  ],
};
