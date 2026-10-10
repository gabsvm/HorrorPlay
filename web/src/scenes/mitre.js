// Chapter 3 — Mitre Square, City of London, 30 September 1888, 1:48 AM. The "double event".
import * as A from '../art/paint.js';
import { nightBackdrop, facade, warehouse } from '../art/build.js';
import { P } from '../art/palette.js';
import { Actor } from '../engine/actor.js';
import { canLeaveMitre } from '../story/progression.js';
import { perception } from '../story/perception.js';
import { Smoke, Drip, Rat, Crow, Moths, Paper, Ripples } from '../engine/life.js';
import { drawCorpse, groundLantern } from './corpse.js';

const WIDTH = 2300, GROUND = 628;

// once Watkins has told what he found and what was seen, the trail leads east
function mitreObjective(G) {
  if (G.hasClue('trozo') && G.hasClue('testigo')) G.objective('Seguir el rastro del delantal hacia el este, por Goulston Street.');
}

export default {
  id: 'mitre',
  width: WIDTH,
  groundY: GROUND,
  space: 'street',
  reflectY: 640,
  get walk() { return this.G && this.G.flag('mitre_badge') ? [140, 2160] : [140, 560]; },
  spawn: 200,
  lantern: true,
  ambient: [0.026, 0.034, 0.05],
  fog: { density: 0.7, amount: 0.55, color: [0.34, 0.42, 0.46], speed: 7 },
  rain: 0.15,
  wet: 1,
  beds: { rain: 0.2, wind: 0.35, drone: 0.18 },
  music: 'dread',
  date: '30 de septiembre de 1888',

  build(R) {
    const layers = nightBackdrop(R, WIDTH, { seed: 44, horizon: 430, domeX: 900 });
    const lights = [];
    const chimneys = [];
    const near = R.paintLayer(WIDTH, (ctx) => {
      // Church Passage, narrow and pitch black, on the left, toward the club side
      A.brickWall(ctx, 0, 100, 230, GROUND - 112, { seed: 2, soot: 1, palette: A.BRICK.stock });
      ctx.fillStyle = '#020202'; ctx.fillRect(70, GROUND - 260, 110, 248);
      ctx.fillStyle = '#5c574d'; ctx.fillRect(62, GROUND - 270, 126, 12);
      A.streetSign(ctx, 34, 136, 'CHURCH PASSAGE');
      A.poster(ctx, 190, 380, 36, 90, [['', 4]], { seed: 31, color: '#8f8466', under: false });
      // the empty houses; in No. 3 a City constable slept through it all
      lights.push({ id: 'bodylamp', x: 940, y: GROUND, r: 300, color: P.lantern, intensity: 0.85, flicker: 0.06, halo: 26, haloK: 0.6 });
      const houses = facade(ctx, { x: 230, w: 420, top: -110, base: GROUND - 12, seed: 201, floors: 3, windows: 2, boards: [0, 1, 2], litMap: [3], nets: [3], roof: 'parapet', kind: 'plaster', door: 300, number: '3' });
      houses.forEach((c) => lights.push({ x: c.x, y: c.y, r: 180, color: P.candle, intensity: 0.35, flicker: 0.12, halo: 22 }));
      chimneys.push(...houses.chimneys);
      // Kearley & Tonge warehouses, a loading bay with a handcart and stacked chests of tea
      warehouse(ctx, { x: 650, w: 900, top: 60, base: GROUND - 12, seed: 202, name: 'KEARLEY & TONGE' });
      A.crate(ctx, 1290, GROUND - 74, 76, 62, 31, { stencil: 'K & T' });
      A.crate(ctx, 1300, GROUND - 130, 60, 56, 32, { stencil: 'CEYLON' });
      A.crate(ctx, 1370, GROUND - 58, 56, 46, 33);
      A.cart(ctx, 1500, GROUND, { flip: true });
      // the watchman's door, left ajar on his lamp
      ctx.fillStyle = '#100a06'; ctx.fillRect(1180, GROUND - 200, 80, 188);
      ctx.fillStyle = '#d9964a'; ctx.fillRect(1180, GROUND - 200, 12, 188);
      ctx.fillStyle = '#5c574d'; ctx.fillRect(1172, GROUND - 210, 96, 10);
      const right = facade(ctx, { x: 1550, w: 750, top: -130, base: GROUND - 12, seed: 203, floors: 3, windows: 4, litMap: [9], figures: [9], roof: 'parapet', door: 600, stock: true, number: '9' });
      right.forEach((c) => lights.push({ x: c.x, y: c.y, r: 200, color: P.candle, intensity: 0.45, flicker: 0.15, halo: 30 }));
      chimneys.push(...right.chimneys);
      A.streetSign(ctx, 1600, 176, 'MITRE SQUARE  E.C.');
      A.poster(ctx, 1690, 470, 96, 70, [['CITY POLICE', 14], ['NOTICE', 12]], { seed: 9, tilt: 0.02 });
      A.poster(ctx, 1882, 476, 84, 64, [['LOST', 13], ['SPANIEL', 11], ['REWARD', 11]], { seed: 10, tilt: -0.04, color: '#c4b892' });
      A.wires(ctx, 640, 180, 1560, 240, { count: 2, sag: 50 });
      A.flagstones(ctx, 0, GROUND - 12, WIDTH, 18);
      A.kerb(ctx, 0, GROUND + 6, WIDTH);
      A.cobbles(ctx, 0, GROUND + 22, WIDTH, 720 - GROUND - 22, { seed: 61, rows: 9, puddles: 8 });
      // the darkest corner, far from the lamp: the chalk outline the City police left
      ctx.strokeStyle = 'rgba(225,225,215,0.55)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(820, GROUND + 34, 90, 12, 0, 0, Math.PI * 2); ctx.stroke();
      const lamp = A.lampPost(ctx, 1460, GROUND, 320);
      lights.push({ x: lamp.x, y: lamp.y, r: 460, color: P.gas, intensity: 0.85, flicker: 0.1, halo: 110, shaft: true, shaftW: 110 });
    });
    lights.push({ id: 'watch', x: 1190, y: GROUND - 110, r: 260, color: P.candle, intensity: 0.6, flicker: 0.2, halo: 30 });
    layers.push({ canvas: near, parallax: 1, kind: 'near' });
    const fg = R.paintLayer(WIDTH * 1.3, (ctx) => {
      ctx.fillStyle = '#050506';
      ctx.fillRect(880, 640, 36, 80); ctx.fillRect(872, 632, 52, 12);
      ctx.fillRect(2600, 0, 120, 720);
      A.railing(ctx, 1700, 640, 400, 80, { gap: 14 });
    });
    layers.push({ canvas: fg, parallax: 1.3, kind: 'fg' });
    return { layers, lights, chimneys };
  },

  makeLife() {
    const b = this.built || {};
    return [
      ...(b.chimneys || []).map((c) => new Smoke({ x: c.x, y: c.y, rate: 0.8 })),
      new Drip({ x: 1250, y: GROUND - 212, ground: GROUND - 6, period: 2.8 }),
      new Rat({ x0: 600, x1: 1200, y: GROUND + 18, seed: 11 }),
      new Crow({ x: 1110, y: 54, facing: -1, seed: 12 }),
      new Moths({ x: 1460, y: GROUND - 300 }),
      new Paper({ x0: 200, x1: 2200, y: GROUND + 70, seed: 13 }),
      new Ripples({ x: 1460, y: GROUND + 50, w: 180 }),
    ];
  },

  drawNear(ctx, t) {
    // Catherine Eddowes in the darkest corner, four minutes dead, nobody has covered her yet
    groundLantern(ctx, 950, GROUND + 18);
    drawCorpse(ctx, t, { key: 'kate', x: 830, y: GROUND + 16, h: 150, cover: null, blood: 1.3, look: { hat: 'bonnet', hatColor: '#1a1414', coat: '#24262a', apron: '#a8a292', hair: '#2a2420', eyesClosed: true } });
  },

  actors() {
    const city = { hat: 'helmet', hatColor: '#0e1018', coat: '#14182a', trousers: '#10121c', coatLen: 0.8, flare: 1.02, belt: true, number: true };
    return [
      new Actor('Watkins', { ...city, x: 640, y: GROUND, h: 212, facing: -1, lantern: true, lanternOn: true, moustache: '#3a2a1e' }),
      new Actor('Morris', { x: 1240, y: GROUND, h: 190, hat: 'cap', coat: '#2e2a24', coatLen: 0.7, facing: -1, stoop: 1, beard: '#7a7670', hair: '#8a8680', scarf: '#3a3028' }),
      new Actor('Agente', { ...city, x: 1000, y: GROUND, h: 210, facing: 1, sideburns: true }),
    ];
  },

  async enter(G) {
    this.G = G;
    if (G.flag('mi_intro')) return;
    G.flag('mi_intro', true);
    G.date('30 de septiembre de 1888', '1:52');
    await G.walk(420);
    const w = G.actor('Watkins'); w.talking = true;
    await G.say('Agente Watkins', '¡Quieto! ¿Quién lo ha dejado entrar?');
    w.talking = false;
    G.objective('Enseñar la placa al agente de la City (inventario).');
  },

  hotspots: [
    {
      id: 'watkins', name: 'Agente Watkins (Policía de la City)', cursor: 'talk', rect: (G) => { const a = G.actor('Watkins'); return [a.x - 40, GROUND - 189, 80, 189]; }, walk: (G) => G.actor('Watkins').x - 90, face: 1,
      act: async (G) => {
        const w = G.actor('Watkins'); w.facing = -1; w.talking = true;
        if (!G.flag('mitre_badge')) { await G.say('Agente Watkins', 'Sin placa, ni un paso más. Esto no es Whitechapel.'); w.talking = false; return; }
        w.talking = false;
        // the order matters: tests/walkthrough.js picks by index (found, witness, name); the new ones come after
        const opts = [];
        if (!G.hasClue('trozo')) opts.push(['¿Qué ha encontrado?', 'found']);
        if (!G.hasClue('testigo')) opts.push(['¿Alguien vio algo?', 'witness']);
        if (!G.flag('watkins_name')) opts.push(['¿Sabemos quién era?', 'name']);
        if (G.hasClue('trozo') && !G.hasClue('berner_aviso')) opts.push(['¿Hay novedades de otras calles?', 'berner']);
        if (!G.flag('mitre_city')) opts.push(['¿Quién lleva el caso?', 'city']);
        opts.push(['Nada más.', 'bye']);
        const c = opts[await G.choice(opts.map((o) => o[0]))][1];
        w.talking = true;
        if (c === 'found') {
          await G.say('Agente Watkins', 'Paso aquí cada cuarto de hora. A la una y media, nada. A la una y cuarenta y cuatro, la vi.');
          await G.say('Agente Watkins', 'Falta una pieza del delantal. Se la llevó quien lo hizo.');
          G.clue('trozo');
          mitreObjective(G);
        } else if (c === 'witness') {
          await G.say('Agente Watkins', 'Un vecino de Church Passage dice que, hacia la una y media, vio a una pareja a la entrada del pasaje. Él, abrigo oscuro y bombín. Y una linterna, dice. No está seguro.');
          G.clue('testigo');
          mitreObjective(G);
          w.talking = false;
          await G.think(G.two('Así viste Pike. Así vestimos todos.', 'Así visto yo.'));
        } else if (c === 'name') {
          G.flag('watkins_name', true);
          await G.say('Agente Watkins', 'No. Aquí nadie la conoce.');
          w.talking = false;
          G.sanity(-2);
        } else if (c === 'berner') {
          await G.say('Agente Watkins', 'Aviso de la Metropolitana: Berner Street, hacia la una. Una mujer en el patio de un club, con la garganta cortada. Sin nombre todavía.');
          G.clue('berner_aviso');
          mitreObjective(G);
        } else if (c === 'city') {
          G.flag('mitre_city', true);
          await G.say('Agente Watkins', 'Aquí manda la City, inspector. Lo de Berner Street es de ustedes. Usted está aquí de favor.');
        }
        w.talking = false;
      },
      use: async (G, item) => {
        if (item !== 'placa') return false;
        if (G.flag('mitre_badge')) { await G.think('Ya la ha visto.'); return true; }
        G.flag('mitre_badge', true);
        const w = G.actor('Watkins'); w.talking = true;
        await G.say('Agente Watkins', 'División H. Adelante. Y tenga las manos donde pueda verlas.');
        if (perception.othersNotice(G.state.sanity)) await G.say('Agente Watkins', '¿Se encuentra bien, inspector? Le tiemblan.');
        await G.say('Agente Watkins', '¿Cómo llegó antes que mi aviso?');
        w.talking = false;
        G.clue('rapido');
        G.objective('Averiguar qué encontró Watkins y si alguien vio algo.');
        const c = await G.choice(['Estaba cerca, en Aldgate.', 'Oí los silbatos.']);
        if (c === 0) await G.think(G.two('Pike me mandó a Aldgate... creo.', '¿Por qué fui a Aldgate?'));
        else await G.think('Mentira. No hubo silbatos.');
        G.sanity(-5);
        w.x = 600; w.facing = 1;
        return true;
      },
    },
    {
      id: 'corner', name: 'El cuerpo, en la esquina más oscura', verb: 'Examinar', rect: [700, GROUND - 30, 260, 90], walk: 690, face: 1, gesture: false,
      act: async (G) => {
        if (!G.flag('mitre_badge')) { G.toast('Watkins no me deja acercarme sin ver la placa.'); return; }
        await G.think('Aquí nadie podía verlo trabajar.');
        // the points sit on the painted close-up (assets/closeups/eddowes.jpg)
        await G.inspect('kate', {
          title: 'La mujer de Mitre Square', body: 'eddowes',
          points: [
            { id: 'cara', key: true, x: 253, y: 306, r: 60, name: 'La cara', act: async (G) => {
              G.red(0.4); G.audio.sting(0.18);
              await G.think('Las marcas no la mataron. Las hizo después.');
              await G.think('Tenía menos de quince minutos para hacerlas.');
              G.clue('marcas');
              G.sanity(-4);
            } },
            { id: 'cuello', x: 360, y: 337, r: 45, name: 'El cuello', act: async (G) => {
              await G.think('Otra vez de izquierda a derecha.');
            } },
            { id: 'vientre', x: 766, y: 398, r: 85, name: 'El vientre', act: async (G) => {
              G.red(0.5); G.shake(4);
              await G.think('Repite el orden de Hanbury.');
              await G.think('Falta un riñón... ¿Por qué ya lo sabía?');
              G.sanity(-5);
            } },
            { id: 'delantal', x: 1110, y: 536, r: 70, name: 'El delantal', act: async (G) => {
              await G.think('Falta una esquina; el corte es limpio.');
              G.clue('trozo');
          mitreObjective(G);
            } },
            { id: 'pulso', key: true, x: 903, y: 100, r: 55, name: 'La muñeca', act: async (G) => {
              G.audio.play('leather', { vol: 0.5, rate: 0.8 });   // the glove coming away from her skin
              if (G.second()) {
                await G.vision('hands');
                G.red(0.6);
              } else {
                G.red(0.4);
              }
              G.clue('guantes');
              G.sanity(-6);
            } },
          ],
        });
        const seen = G.state.seen['insp:kate'] || {};
        if (seen.pulso && !G.flag('watkins_touch')) {
          G.flag('watkins_touch', true);
          const w = G.actor('Watkins'); w.facing = 1; w.talking = true;
          await G.say('Agente Watkins', 'Le he dicho que no la toque. ¿Me ha oído?');
          w.talking = false;
          const c = await G.choice(['Buscarle el pulso.', '(Esconder las manos en los bolsillos)']);
          if (c === 0) { w.talking = true; await G.say('Agente Watkins', '¿El pulso? Inspector, mírela.'); w.talking = false; }
          else {  G.sanity(-2); }
        }
      },
    },
    {
      id: 'morris', name: 'Morris, el vigilante', cursor: 'talk', rect: [1200, GROUND - 172, 80, 172], walk: 1140, face: 1,
      act: async (G) => {
        if (!G.flag('mitre_badge')) { G.toast('Watkins no me deja acercarme sin ver la placa.'); return; }
        const m = G.actor('Morris'); m.talking = true;
        await G.say('Morris', 'Tenía la puerta entornada. No oí ni una palabra.');
        await G.say('Morris', 'Fui agente veinte años. No me acostumbro a esto.');
        m.talking = false;
      },
    },
    {
      id: 'east', name: 'Hacia Goulston Street', cursor: 'exit', rect: [2160, GROUND - 420, 140, 440], walk: 2150, face: 1,
      act: async (G) => {
        const gate = canLeaveMitre(G.state);
        if (!gate.ok) { await G.think(`Todavía no. Me falta ${gate.missing[0]}.`); return; }
        await G.think('Hacia el este. El trozo de delantal no habrá llegado muy lejos.');
        await G.game.chapterHooks.toGoulston(G);
      },
    },
  ],
};
