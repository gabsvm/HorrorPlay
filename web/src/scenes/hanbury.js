// Chapter 2 — backyard of 29 Hanbury Street, 8 September 1888, just after six in the morning.
import * as A from '../art/paint.js';
import { facade } from '../art/build.js';
import { P, shade } from '../art/palette.js';
import { Actor } from '../engine/actor.js';
import { rng } from '../art/noise.js';

const WIDTH = 2000, GROUND = 630;

export default {
  id: 'hanbury',
  width: WIDTH,
  groundY: GROUND,
  walk: [180, 1860],
  spawn: 260,
  lantern: false,
  ambient: [0.15, 0.17, 0.2],
  fog: { density: 0.5, amount: 0.45, color: [0.55, 0.6, 0.64], speed: 6, ground: 0.6 },
  rain: 0.08,
  beds: { rain: 0.15, wind: 0.3, crowd: 0.25 },
  music: 'dread',
  date: '8 de septiembre de 1888',

  build(R) {
    const lights = [];
    const sky = R.paintLayer(1280 + (WIDTH - 1280) * 0.2, (ctx, w, h) => {
      A.sky(ctx, w, h, { top: '#2a3238', mid: '#4a5458', low: '#7a8180', glow: 'rgba(200,190,170,0.25)', glowY: 0.4, seed: 81 });
      A.skyline(ctx, { w, baseY: 300, seed: 82, color: '#2a3034', minH: 60, maxH: 160, spire: { x: 700, h: 360 } });
      A.vgrad(ctx, 0, 100, w, 260, [[0, 'rgba(120,130,130,0)'], [1, 'rgba(120,130,130,0.45)']]);
    });
    const near = R.paintLayer(WIDTH, (ctx) => {
      // back of No. 29: three storeys of soot-black brick, back door with two stone steps
      facade(ctx, { x: 0, w: 760, top: 40, base: GROUND - 10, seed: 101, floors: 3, windows: 3, roof: 'parapet', broken: [1], litMap: [] });
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(560, GROUND - 210, 96, 200);
      A.door(ctx, 566, GROUND - 204, 84, 194, { color: '#3a2c20', open: 0.35, steps: 0 });
      ctx.fillStyle = shade(P.stone, 0.85); ctx.fillRect(546, GROUND - 22, 126, 12); ctx.fillStyle = shade(P.stone, 0.75); ctx.fillRect(536, GROUND - 10, 146, 12);
      // the passage to the street on the far left
      ctx.fillStyle = '#060606'; ctx.fillRect(40, GROUND - 240, 110, 230);
      // the fence, about five feet high, between this yard and No. 27
      for (let x = 690; x < 1560; x += 22) {
        ctx.fillStyle = shade(P.wood, 0.7 + ((x / 22) % 4) * 0.06);
        ctx.fillRect(x, GROUND - 150 - (x % 3) * 3, 20, 150 + (x % 3) * 3);
      }
      ctx.fillStyle = P.woodDark; ctx.fillRect(690, GROUND - 120, 870, 8); ctx.fillRect(690, GROUND - 40, 870, 8);
      A.stain(ctx, 690, GROUND - 160, 870, 160, { seed: 5, alpha: 0.55 });
      // neighbouring houses behind the fence
      facade(ctx, { x: 760, w: 520, top: 120, base: GROUND - 150, seed: 102, floors: 2, windows: 3, roof: 'parapet', kind: 'plaster' });
      facade(ctx, { x: 1280, w: 720, top: 70, base: GROUND - 10, seed: 103, floors: 3, windows: 4, roof: 'parapet', broken: [2, 7], boards: [5] });
      // the tap and a stone trough against the wall
      ctx.fillStyle = P.stoneDark; ctx.fillRect(1600, GROUND - 60, 120, 50);
      ctx.fillStyle = P.iron; ctx.fillRect(1650, GROUND - 150, 10, 90); ctx.fillRect(1650, GROUND - 150, 34, 8); ctx.fillRect(1678, GROUND - 146, 6, 18);
      // privy and a packing case
      A.crate(ctx, 1760, GROUND - 70, 80, 60, 7);
      ctx.fillStyle = shade(P.wood, 0.6); ctx.fillRect(1860, GROUND - 230, 120, 220); ctx.fillStyle = '#0c0c0c'; ctx.fillRect(1880, GROUND - 200, 70, 190);
      // yard: beaten earth and broken flagstones
      A.vgrad(ctx, 0, GROUND - 10, WIDTH, 720 - GROUND + 10, [[0, '#3a3530'], [1, '#2a2622']]);
      const r = rng(9);
      for (let i = 0; i < 40; i++) { ctx.fillStyle = shade(P.stone, r.range(0.5, 0.8)); ctx.fillRect(r.range(0, WIDTH), r.range(GROUND, 710), r.range(40, 110), r.range(4, 10)); }
      A.stain(ctx, 0, GROUND - 10, WIDTH, 100, { seed: 31, alpha: 0.6 });
      // laundry line across the yard
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(300, 220); ctx.quadraticCurveTo(1000, 290, 1700, 210); ctx.stroke();
      ctx.fillStyle = '#8a857a'; ctx.fillRect(820, 262, 46, 70); ctx.fillStyle = '#6a6458'; ctx.fillRect(1220, 262, 60, 50);
    });
    lights.push({ x: 1000, y: -200, r: 2200, color: [0.42, 0.46, 0.5], intensity: 0.6, halo: 0, reflect: false });
    const fg = R.paintLayer(WIDTH * 1.25, (ctx) => {
      ctx.fillStyle = '#0a0b0c';
      ctx.fillRect(0, 0, 120, 720);
      ctx.fillRect(1500, 520, 30, 200); ctx.fillRect(1460, 600, 120, 8);
      ctx.fillRect(2380, 0, 120, 720);
    });
    return { layers: [{ canvas: sky, parallax: 0.2, kind: 'far' }, { canvas: near, parallax: 1, kind: 'near' }, { canvas: fg, parallax: 1.25, kind: 'fg' }], lights };
  },

  actors() {
    return [
      new Actor('Pike', { x: 900, y: GROUND, h: 200, hat: 'bowler', coat: '#2c2a26', coatLen: 0.9, cape: true, facing: -1, build: 1.05 }),
      new Actor('Greaves', { x: 1150, y: GROUND, h: 214, hat: 'top', coat: '#1d1b1c', coatLen: 0.95, cane: true, beard: '#6a6a66', facing: -1, flare: 1.05 }),
      new Actor('Amelia', { x: 470, y: GROUND, h: 176, hat: 'bonnet', skirt: true, coat: '#3a3432', facing: 1, stoop: 1 }),
    ];
  },

  drawNear(ctx, t) {
    // neighbours leaning out of the windows next door (they charge a penny for the view)
    for (const [x, y, k] of [[1550, 160, 0], [1370, 342, 1], [1730, 342, 2]]) {
      ctx.fillStyle = '#16120f';
      ctx.beginPath(); ctx.ellipse(x + Math.sin(t * 0.7 + k) * 2, y, 11, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - 22, y + 12, 44, 30);
      if (k === 0) { ctx.beginPath(); ctx.ellipse(x, y - 4, 16, 18, 0, Math.PI, 0); ctx.fill(); }
    }
    // Annie's belongings, already removed; only the outline of where they lay, and the comb half-hidden by the fence
    if (!this.G?.has('peine') && !this.G?.flag('peine_taken')) { ctx.fillStyle = '#5a4630'; ctx.fillRect(760, GROUND + 6, 22, 5); }
    // the leather apron by the tap
    ctx.fillStyle = '#4a2e1c';
    ctx.beginPath(); ctx.moveTo(1610, GROUND - 4); ctx.quadraticCurveTo(1640, GROUND - 30, 1700, GROUND - 8); ctx.lineTo(1706, GROUND + 6); ctx.lineTo(1604, GROUND + 6); ctx.fill();
  },

  async enter(G) {
    this.G = G;
    if (G.flag('hb_intro')) return;
    G.flag('hb_intro', true);
    G.date('8 de septiembre de 1888', '6:20');
    await G.walk(620);
    await G.think('En la calle hay vecinos cobrando un penique por asomarse a la ventana a mirar el patio.');
    const pike = G.actor('Pike'); pike.facing = -1;
    await G.say('Pike', 'Annie Chapman. Cuarenta y siete años. Vendía flores y ganchillo cuando estaba sana. Ya no lo estaba.');
    await G.say('Pike', 'La encontró un vecino a las seis menos cuarto, entre los escalones y la valla. Ya se la han llevado.');
    await G.narrate('Pike escribe la hora en la libreta.');
  },

  hotspots: [
    {
      id: 'pike', name: 'Sargento Pike', cursor: 'talk', rect: [860, GROUND - 210, 80, 210], walk: 800, face: 1,
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
      id: 'greaves', name: 'Dr. Lionel Greaves', cursor: 'talk', rect: [1100, GROUND - 230, 90, 230], walk: 1040, face: 1,
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
      id: 'amelia', name: 'Sra. Richardson, la casera', cursor: 'talk', rect: [430, GROUND - 190, 80, 190], walk: 540, face: -1,
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
        G.player.pose = null;
        await G.think('Los periódicos llevan una semana hablando de un tal "Leather Apron". Ahora tendrán su delantal.');
      },
    },
    {
      id: 'comb', name: 'Algo junto a la valla', when: (G) => !G.flag('peine_taken'), rect: [740, GROUND - 6, 70, 30], walk: 720, face: 1,
      act: async (G) => {
        G.player.pose = 'kneel';
        await G.think('Un peine de bolsillo con dos púas rotas. Se les habrá pasado al recoger sus cosas.');
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
      id: 'window', name: 'Ventana trasera', rect: [336, 456, 90, 120], walk: 300, face: 1,
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
      id: 'neighbours', name: 'Vecinos en las ventanas', rect: [1380, 120, 300, 340], walk: 1500,
      act: async (G) => { await G.think('Los de la casa de al lado cobran un penique por asomarse a mirar el patio. Ya hay cola en la calle.'); },
    },
    {
      id: 'passage', name: 'Pasillo a Hanbury Street', cursor: 'exit', rect: [30, GROUND - 250, 130, 250], walk: 190, face: -1,
      act: async (G) => {
        if (!G.hasClue('delantal') || !G.flag('greaves_met')) { await G.think('Todavía no he terminado aquí.'); return; }
        await G.game.chapterHooks.leaveHanbury(G);
      },
    },
  ],
};
