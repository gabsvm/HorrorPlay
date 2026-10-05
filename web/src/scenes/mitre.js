// Chapter 3 — Mitre Square, City of London, 30 September 1888, 1:48 AM. The "double event".
import * as A from '../art/paint.js';
import { nightBackdrop, facade, warehouse } from '../art/build.js';
import { P } from '../art/palette.js';
import { Actor } from '../engine/actor.js';

const WIDTH = 2300, GROUND = 628;

export default {
  id: 'mitre',
  width: WIDTH,
  groundY: GROUND,
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
    const layers = nightBackdrop(R, WIDTH, { seed: 44, horizon: 430 });
    const lights = [];
    const near = R.paintLayer(WIDTH, (ctx) => {
      // Church Passage, narrow and pitch black, on the left
      A.brickWall(ctx, 0, 100, 230, GROUND - 112, { seed: 2, soot: 1 });
      ctx.fillStyle = '#020202'; ctx.fillRect(70, GROUND - 260, 110, 248);
      A.streetSign(ctx, 40, 140, 'CHURCH PASSAGE');
      // empty houses, then Kearley & Tonge warehouses
      facade(ctx, { x: 230, w: 420, top: 160, base: GROUND - 12, seed: 201, floors: 3, windows: 2, boards: [0, 1, 2, 3], roof: 'parapet', kind: 'plaster' });
      warehouse(ctx, { x: 650, w: 900, top: 60, base: GROUND - 12, seed: 202, name: 'KEARLEY & TONGE' });
      ctx.fillStyle = '#100a06'; ctx.fillRect(1180, GROUND - 200, 80, 188); // watchman's door, ajar
      ctx.fillStyle = '#d9964a'; ctx.fillRect(1180, GROUND - 200, 12, 188);
      facade(ctx, { x: 1550, w: 750, top: 140, base: GROUND - 12, seed: 203, floors: 3, windows: 4, litMap: [9], roof: 'parapet', door: 600 });
      A.streetSign(ctx, 1600, 180, 'MITRE SQUARE  E.C.');
      A.poster(ctx, 1800, 470, 110, 70, [['CITY POLICE', 14], ['NOTICE', 12]], { seed: 9, tilt: 0.02 });
      A.flagstones(ctx, 0, GROUND - 12, WIDTH, 18);
      A.kerb(ctx, 0, GROUND + 6, WIDTH);
      A.cobbles(ctx, 0, GROUND + 22, WIDTH, 720 - GROUND - 22, { seed: 61, rows: 9, puddles: 8 });
      const lamp = A.lampPost(ctx, 1460, GROUND, 230, { bracket: false });
      lights.push({ x: lamp.x, y: lamp.y, r: 460, color: P.gas, intensity: 0.85, flicker: 0.1, halo: 110 });
    });
    lights.push({ id: 'watch', x: 1190, y: GROUND - 110, r: 260, color: P.candle, intensity: 0.6, flicker: 0.2, halo: 30 });
    layers.push({ canvas: near, parallax: 1, kind: 'near' });
    const fg = R.paintLayer(WIDTH * 1.3, (ctx) => {
      ctx.fillStyle = '#050506';
      ctx.fillRect(900, 0, 50, 720);
      ctx.fillRect(2600, 0, 120, 720);
      A.railing(ctx, 1700, 640, 400, 80, { gap: 14 });
    });
    layers.push({ canvas: fg, parallax: 1.3, kind: 'fg' });
    return { layers, lights };
  },

  actors() {
    return [
      new Actor('Watkins', { x: 640, y: GROUND, h: 212, hat: 'helmet', coat: '#1a1d26', coatLen: 0.82, facing: -1, lantern: true, lanternOn: true }),
      new Actor('Morris', { x: 1240, y: GROUND, h: 190, hat: 'cap', coat: '#2e2a24', coatLen: 0.7, facing: -1, stoop: 1, beard: '#5a5550' }),
      new Actor('Agente', { x: 1000, y: GROUND, h: 210, hat: 'helmet', coat: '#1a1d26', coatLen: 0.82, facing: 1 }),
    ];
  },

  drawNear(ctx) {
    // the darkest corner: chalk outline left by the City police
    ctx.strokeStyle = 'rgba(210,210,200,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(820, GROUND + 34, 90, 12, 0, 0, Math.PI * 2); ctx.stroke();
  },

  async enter(G) {
    this.G = G;
    if (G.flag('mi_intro')) return;
    G.flag('mi_intro', true);
    G.date('30 de septiembre de 1888', '1:52');
    await G.walk(420);
    const w = G.actor('Watkins'); w.talking = true;
    await G.say('Agente Watkins', '¡Alto ahí! Esto es la City. ¿Quién es usted?');
    w.talking = false;
    await G.think('La City de Londres tiene su propia policía. Aquí no soy nadie, salvo que les enseñe la placa.');
  },

  hotspots: [
    {
      id: 'watkins', name: 'Agente Watkins (Policía de la City)', cursor: 'talk', rect: (G) => { const a = G.actor('Watkins'); return [a.x - 40, GROUND - 220, 80, 220]; }, walk: (G) => G.actor('Watkins').x - 90, face: 1,
      act: async (G) => {
        const w = G.actor('Watkins'); w.facing = -1; w.talking = true;
        if (!G.flag('mitre_badge')) { await G.say('Agente Watkins', 'Sin identificación no pasa nadie. Ni la reina.'); w.talking = false; return; }
        w.talking = false;
        const opts = [];
        if (!G.hasClue('trozo')) opts.push(['¿Qué ha encontrado?', 'found']);
        if (!G.hasClue('testigo')) opts.push(['¿Alguien vio algo?', 'witness']);
        if (!G.flag('watkins_name')) opts.push(['¿Sabemos quién era?', 'name']);
        opts.push(['Nada más.', 'bye']);
        const c = opts[await G.choice(opts.map((o) => o[0]))][1];
        w.talking = true;
        if (c === 'found') {
          await G.say('Agente Watkins', 'Hago esta ronda cada quince minutos. A la una y media no había nada. A la una y cuarenta y cuatro estaba ahí, en la esquina.');
          await G.say('Agente Watkins', 'Le falta un trozo del delantal, cortado a cuchillo. Se lo llevó.');
          G.clue('trozo');
          await G.say('Agente Watkins', 'Y dicen que hace una hora han encontrado a otra en Berner Street, en el patio de un club. Dos en una noche, inspector.');
        } else if (c === 'witness') {
          await G.say('Agente Watkins', 'Tres hombres salían de un club de Duke\'s Place a la una y media. Uno vio a una mujer hablando con un hombre a la entrada de Church Passage.');
          await G.say('Agente Watkins', 'Abrigo oscuro y bombín. Dice que el hombre llevaba una linterna como las nuestras, de policía. Por eso no le dio importancia.');
          G.clue('testigo');
          w.talking = false;
          await G.think('Una linterna de policía. Puede ser uno de los nuestros.');
        } else if (c === 'name') {
          G.flag('watkins_name', true);
          await G.say('Agente Watkins', 'La soltaron de la comisaría de Bishopsgate a la una, cuando se le pasó la borrachera. Dio un nombre: Mary Ann Kelly.');
          await G.say('Agente Watkins', 'Pero en la casa de huéspedes la conocían como Kate. Catherine Eddowes. Volvía de Kent, de recoger lúpulo, con su hombre.');
          w.talking = false;
          await G.think('Mary Ann Kelly. Ese nombre me da frío, y no sé por qué.');
          G.sanity(-2);
        }
        w.talking = false;
      },
      use: async (G, item) => {
        if (item !== 'placa') return false;
        if (G.flag('mitre_badge')) { await G.think('Ya la ha visto.'); return true; }
        G.flag('mitre_badge', true);
        const w = G.actor('Watkins'); w.talking = true;
        await G.say('Agente Watkins', 'División H. Está bien, inspector, pero no toque nada. Esto es asunto de la City.');
        await G.say('Agente Watkins', '...¿Cómo ha llegado tan rápido? La encontré hace cuatro minutos. Todavía no hemos avisado a nadie de la Metropolitana.');
        w.talking = false;
        G.clue('rapido');
        const c = await G.choice(['Estaba cerca, en Aldgate.', 'Oí los silbatos.']);
        if (c === 0) await G.think('Estaba en Aldgate. Eso creo. ¿Qué hacía yo en Aldgate a las dos menos cuarto?');
        else await G.think('No ha sonado ningún silbato. Watkins no ha llegado a tocar el suyo.');
        G.sanity(-5);
        w.x = 760; w.facing = -1;
        return true;
      },
    },
    {
      id: 'corner', name: 'La esquina más oscura', rect: [700, GROUND - 10, 260, 70], walk: 820,
      act: async (G) => {
        if (!G.flag('mitre_badge')) return;
        await G.think('El rincón donde no llega la farola. Desde aquí no se ve ninguna ventana con luz.');
        await G.think('Él conocía este rincón. Sabía que estaba a oscuras.');
      },
    },
    {
      id: 'morris', name: 'Morris, el vigilante', cursor: 'talk', rect: [1200, GROUND - 200, 80, 200], walk: 1140, face: 1,
      act: async (G) => {
        const m = G.actor('Morris'); m.talking = true;
        await G.say('Morris', 'Estaba barriendo ahí dentro, con la puerta entornada. No oí nada, señor. Nada de nada.');
        await G.say('Morris', 'Fui policía, ¿sabe? Pensé que ya había visto de todo.');
        m.talking = false;
      },
    },
    {
      id: 'passage', name: 'Church Passage', cursor: 'exit', rect: [60, GROUND - 270, 130, 270], walk: 160, face: -1,
      act: async (G) => { await G.think('Por ahí he venido. No recuerdo haber cruzado el pasaje.'); },
    },
    {
      id: 'east', name: 'Hacia Goulston Street', cursor: 'exit', rect: [2160, GROUND - 420, 140, 440], walk: 2150, face: 1,
      act: async (G) => {
        if (!G.hasClue('trozo') || !G.hasClue('testigo')) { await G.think('Antes tengo que oír lo que sabe Watkins.'); return; }
        await G.think('Se llevó un trozo del delantal. Lo tirará en algún sitio de camino a casa. Hacia el este, de vuelta a Whitechapel.');
        await G.game.chapterHooks.toGoulston(G);
      },
    },
  ],
};
