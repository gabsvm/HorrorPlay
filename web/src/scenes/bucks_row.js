// Chapter 1 — Buck's Row, 31 August 1888, before dawn. Polly Nichols has already been taken to the mortuary.
import * as A from '../art/paint.js';
import { nightBackdrop, facade, warehouse } from '../art/build.js';
import { P } from '../art/palette.js';
import { Actor } from '../engine/actor.js';

const WIDTH = 2600, GROUND = 628;

export default {
  id: 'bucks_row',
  width: WIDTH,
  groundY: GROUND,
  reflectY: 640,
  walk: [150, 2470],
  spawn: 2420,
  lantern: true,
  ambient: [0.03, 0.04, 0.056],
  fog: { density: 0.6, amount: 0.5, color: [0.36, 0.45, 0.48], speed: 10 },
  rain: 0.35,
  wet: 1.2,
  beds: { rain: 0.5, wind: 0.3, drone: 0.1 },
  music: 'dread',
  date: '31 de agosto de 1888',

  build(R) {
    const layers = nightBackdrop(R, WIDTH, { seed: 12, spireX: 980, spireH: 380, horizon: 450 });
    const lights = [];
    const near = R.paintLayer(WIDTH, (ctx) => {
      warehouse(ctx, { x: 0, w: 640, top: 70, base: GROUND - 12, seed: 3, name: 'ESSEX WHARF' });
      // Brown's stable yard gateway
      A.brickWall(ctx, 640, 250, 300, GROUND - 262, { seed: 8 });
      ctx.fillStyle = P.stoneDark; ctx.fillRect(636, 240, 308, 14);
      A.gate(ctx, 690, GROUND - 230, 200, 218);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(690, GROUND - 236, 200, 8);
      A.chalk(ctx, 704, GROUND - 204, "BROWN'S\nSTABLE YARD", { size: 15 });
      // New Cottages
      const cottageLights = [];
      for (let i = 0; i < 5; i++) {
        const x = 940 + i * 170;
        cottageLights.push(...facade(ctx, { x, w: 170, top: GROUND - 300, base: GROUND - 12, seed: 40 + i, floors: 2, windows: 1, door: 120, litMap: i === 1 ? [0] : i === 4 ? [1] : [], roof: 'parapet', boards: i === 3 ? [0] : [] }));
      }
      cottageLights.forEach((c) => lights.push({ x: c.x, y: c.y, r: 190, color: P.candle, intensity: 0.55, flicker: 0.15, halo: 34, haloK: 0.6 }));
      // Board school
      A.brickWall(ctx, 1790, 40, 560, GROUND - 52, { seed: 66, palette: ['#4b352d', '#56392f', '#44302a'] });
      ctx.fillStyle = '#121518';
      ctx.beginPath(); ctx.moveTo(1770, 46); ctx.lineTo(2070, -120); ctx.lineTo(2370, 46); ctx.fill();
      for (let i = 0; i < 4; i++) {
        A.windowFrame(ctx, 1840 + i * 128, 110, 62, 150, { arch: true, seed: 70 + i, panes: 4 });
        A.windowFrame(ctx, 1840 + i * 128, 330, 62, 130, { arch: true, seed: 80 + i, panes: 3, broken: i === 2 });
      }
      A.poster(ctx, 1900, 500, 120, 76, [['£100 REWARD', 18], ['INFORMATION', 11], ['WHITECHAPEL', 11]], { seed: 3, tilt: -0.03 });
      A.railing(ctx, 1790, GROUND - 70, 560, 58);
      ctx.fillStyle = '#050607'; ctx.fillRect(2350, 120, 250, GROUND - 120);
      A.brickWall(ctx, 2470, 150, 130, GROUND - 162, { seed: 90 });
      A.streetSign(ctx, 1000, 258, "BUCK'S ROW  E.");
      A.flagstones(ctx, 0, GROUND - 12, WIDTH, 18);
      A.kerb(ctx, 0, GROUND + 6, WIDTH);
      A.cobbles(ctx, 0, GROUND + 22, WIDTH, 720 - GROUND - 22, { seed: 14, rows: 9, puddles: 12 });
      // the gutter grate where Wren will later say she found the scalpel
      ctx.fillStyle = '#0b0b0b'; ctx.fillRect(560, GROUND + 14, 54, 10);
      ctx.fillStyle = '#2a2a2a'; for (let i = 0; i < 6; i++) ctx.fillRect(563 + i * 9, GROUND + 15, 4, 8);
      const lamp = A.lampPost(ctx, 1640, GROUND, 270);
      lights.push({ id: 'lamp', x: lamp.x, y: lamp.y, r: 520, color: P.gas, intensity: 1.15, flicker: 0.08, halo: 130 });
    });
    layers.push({ canvas: near, parallax: 1, kind: 'near' });
    const fg = R.paintLayer(WIDTH * 1.3, (ctx) => {
      ctx.fillStyle = '#060708';
      // a bollard and hanging sign bracket at the left edge, a cart on the right
      ctx.fillRect(120, 610, 34, 110); ctx.fillRect(112, 600, 50, 14);
      ctx.fillRect(0, 70, 150, 8); ctx.fillRect(140, 70, 6, 60); ctx.fillRect(110, 128, 70, 46);
      A.cart(ctx, 2600, 760);
      ctx.fillRect(3100, 0, 70, 720);
    });
    layers.push({ canvas: fg, parallax: 1.3, kind: 'fg' });
    return { layers, lights };
  },

  actors() {
    return [
      new Actor('Pike', { x: 980, y: GROUND, h: 200, hat: 'bowler', coat: '#2c2a26', coatLen: 0.9, cape: true, facing: 1, build: 1.05 }),
      new Actor('Neil', { x: 1500, y: GROUND, h: 212, hat: 'helmet', coat: '#1b2030', coatLen: 0.82, facing: -1, lantern: true, lanternOn: true }),
      new Actor('Chico', { x: 760, y: GROUND, h: 140, hat: 'cap', coat: '#3a3229', coatLen: 0.6, facing: -1, stoop: 1, pose: 'kneel' }),
    ];
  },

  drawNear(ctx) {
    // the boy's bucket and the wet patch he is scrubbing
    A.barrel(ctx, 700, GROUND - 24, 22, 24);
    ctx.fillStyle = 'rgba(30,22,20,0.65)'; ctx.beginPath(); ctx.ellipse(800, GROUND + 26, 70, 9, 0, 0, Math.PI * 2); ctx.fill();
    // footprints of black mud heading west, only legible in lantern light
    ctx.fillStyle = 'rgba(8,8,6,0.75)';
    for (let i = 0; i < 12; i++) { const x = 640 - i * 40, y = GROUND + 30 + (i % 2) * 10; ctx.beginPath(); ctx.ellipse(x, y, 9, 3.2, 0, 0, Math.PI * 2); ctx.fill(); }
  },

  async enter(G) {
    if (G.flag('br_intro')) return;
    G.flag('br_intro', true);
    G.date('31 de agosto de 1888', '4:12');
    await G.walk(1180);
    const pike = G.actor('Pike');
    pike.facing = 1;
    await G.say('Pike', 'Inspector.');
    await G.narrate('Pike abre la libreta y escribe algo, como siempre que llego.');
    await G.say('Pike', 'Mary Ann Nichols. La llamaban Polly. Cuarenta y tres años. Ya se la han llevado al depósito de Old Montague Street.');
    await G.say('Pike', 'La encontró un carretero a las tres cuarenta, justo delante del portón del establo. Neil llegó un minuto después, haciendo la ronda.');
    await G.think('Tengo que hablar con todos antes de que se despierte la calle, que luego la gente habla de más.');
    G.objective('Hablar con Pike, con Neil y con el chico. Examinar la calle.');
  },

  hotspots: [
    {
      id: 'pike', name: 'Sargento Pike', cursor: 'talk', rect: (G) => { const a = G.actor('Pike'); return [a.x - 40, GROUND - 210, 80, 210]; }, walk: (G) => G.actor('Pike').x + 90, face: -1,
      act: async (G) => {
        const pike = G.actor('Pike'); pike.facing = 1;
        const opts = [];
        if (!G.hasClue('zurdo')) opts.push(['¿Qué dijo el médico?', 'doc']);
        if (!G.flag('pike_polly')) opts.push(['¿Quién era ella?', 'polly']);
        if (!G.flag('pike_notes') && G.flag('pike_polly')) opts.push(['¿Qué apunta en esa libreta, Pike?', 'notes']);
        if (G.hasClue('zurdo') && !G.flag('knackers_lead')) opts.push(['¿Quién trabaja de noche por aquí?', 'lead']);
        opts.push(['Nada más.', 'bye']);
        const c = opts[await G.choice(opts.map((o) => o[0]))][1];
        pike.talking = true;
        if (c === 'doc') {
          await G.say('Pike', 'El doctor Llewellyn dice que los cortes van de izquierda a derecha. Que el que lo hizo seguramente es zurdo.');
          G.clue('zurdo');
          await G.say('Pike', 'Y que tenía "cierta noción de anatomía". Sabía dónde cortar y no tuvo que buscarlo.');
          G.clue('anatomia');
          pike.talking = false;
          await G.think('Zurdo, y sabía dónde cortar. En el cuaderno (N) puedo relacionar las pistas que encajan entre sí.');
        } else if (c === 'polly') {
          G.flag('pike_polly', true);
          await G.say('Pike', 'Tenía cinco hijos. El marido la dejó hace años. Dormía en Flower and Dean Street cuando le llegaba para pagar la cama.');
          await G.say('Pike', 'Anoche no le llegaba. Le dijo a la casera que le guardara el sitio, que enseguida volvía con el dinero.');
          await G.say('Pike', 'Llevaba un sombrero negro nuevo. Estaba contenta con ese sombrero.');
          pike.talking = false;
          await G.think('Un sombrero nuevo. Es lo único que sabemos de cómo se sentía anoche.');
        } else if (c === 'notes') {
          G.flag('pike_notes', true);
          await G.say('Pike', 'Horas, señor. Quién llega y a qué hora.');
          await G.say('Pike', 'Usted ha llegado a las cuatro y doce. Le mandé llamar a las cuatro.');
          pike.talking = false;
          await G.think('Doce minutos desde Thrawl Street. Debí de venir corriendo.');
        } else if (c === 'lead') {
          G.flag('knackers_lead', true);
          G.objective('Ir al desolladero de Winthrop Street, hacia el oeste.');
          await G.say('Pike', 'El desolladero de Barber, en Winthrop Street, ahí detrás. Matan caballos toda la noche.');
          await G.say('Pike', 'Hombres con cuchillos y delantal de cuero, a cien yardas de aquí. Neil dice que no vieron nada.');
          pike.talking = false;
          await G.think('Hacia el oeste, siguiendo la pared de Essex Wharf.');
        }
        pike.talking = false;
      },
    },
    {
      id: 'neil', name: 'Agente Neil', cursor: 'talk', rect: [1460, GROUND - 220, 80, 220], walk: 1400, face: 1,
      act: async (G) => {
        const neil = G.actor('Neil'); neil.facing = -1; neil.talking = true;
        if (!G.hasClue('ronda')) {
          await G.say('Neil', 'Pasé por aquí a las tres y cuarto, señor, igual que todas las noches. No había nadie, y la calle estaba vacía de punta a punta.');
          await G.say('Neil', 'A las tres cuarenta y cinco vi al carretero haciéndome señas. Media hora, nada más. En media hora.');
          G.clue('ronda');
          neil.talking = false;
          await G.think('Quien lo hizo sabía cuánto tarda Neil en hacer la ronda.');
        } else {
          await G.say('Neil', 'Llevo seis años en esta ronda, señor. Nunca había tenido tanto miedo de volver a pasar por la misma esquina.');
        }
        neil.talking = false;
      },
    },
    {
      id: 'boy', name: 'Chico con un cubo', cursor: 'talk', rect: [720, GROUND - 110, 90, 110], walk: 860, face: -1,
      act: async (G) => {
        const b = G.actor('Chico'); b.talking = true;
        if (!G.hasClue('silencio')) {
          await G.say('Chico', 'Mi madre dice que hay que fregarlo antes de que la gente se despierte y venga a mirar.');
          await G.say('Chico', 'Ella duerme ahí mismo, detrás de esa ventana. Lo oye todo: los gatos, los borrachos, los trenes. Y esta noche no oyó nada, señor. Nada.');
          G.clue('silencio');
          b.talking = false;
          await G.think('A tres metros de una mujer con el sueño ligero, y nadie oyó nada.');
        } else {
          await G.say('Chico', 'Usted tiene barro en las botas, señor. Del negro, del que hay junto al río.');
          b.talking = false;
          await G.think('Como medio Whitechapel.');
        }
        b.talking = false;
      },
    },
    {
      id: 'gate', name: 'Portón del establo', rect: [690, GROUND - 236, 200, 220], walk: 790, face: -1,
      act: async (G) => {
        await G.think('Aquí, delante del portón. El carretero creyó que era una lona tirada en el suelo.');
        await G.think('Apenas había sangre bajo ella. Llewellyn dice que la mayor parte se quedó dentro de la ropa.');
      },
    },
    {
      id: 'tracks', name: 'Rastro en los adoquines', rect: [150, GROUND + 14, 520, 40], walk: 560, face: -1,
      act: async (G) => {
        G.player.pose = 'kneel';
        await G.think('Bajo la linterna se ven unas huellas de barro negro, barro de río, que se alejan hacia Winthrop Street.');
        G.clue('huellas');
        G.player.pose = null;
        await G.think('Son de bota de hombre, de un número parecido al mío.');
      },
    },
    {
      id: 'grate', name: 'Alcantarilla', rect: [550, GROUND + 6, 70, 26], walk: 620, face: -1,
      act: async (G) => { await G.think('Una rejilla de alcantarilla. Desde aquí abajo sube el olor del Ditch.'); },
    },
    {
      id: 'lamp', name: 'Farola', rect: [1610, GROUND - 300, 60, 300], walk: 1580,
      act: async (G) => { await G.think('La farola más cercana al portón está a treinta yardas. Allí estaba tan oscuro como en el fondo de un pozo.'); },
    },
    {
      id: 'window', name: 'Ventana de la señora Green', rect: [1110, GROUND - 270, 90, 110], walk: 1150,
      act: async (G) => { await G.think('Una vela encendida detrás de la cortina. Alguien nos está mirando.'); G.audio.whisper(0.8, 0.05); },
    },
    {
      id: 'poster', name: 'Cartel', rect: [1895, 495, 130, 86], walk: 1960,
      act: async (G) => { await G.think('"Cien libras de recompensa por información." Lo puso un comité de comerciantes, porque la policía no ofrece recompensas.'); },
    },
    {
      id: 'west', name: 'Hacia Winthrop Street', cursor: 'exit', rect: [0, GROUND - 420, 150, 440], walk: 160, face: -1,
      act: async (G) => {
        if (!G.flag('knackers_lead')) { await G.think('Antes tengo que oír lo que dijo el médico.'); return; }
        await G.goto('knackers', { x: 1960, facing: -1 });
      },
    },
    {
      id: 'east', name: 'Hacia Baker\'s Row', cursor: 'exit', rect: [2470, GROUND - 420, 130, 440], walk: 2460, face: 1,
      act: async (G) => { await G.think('Mi casa queda por allí. Todavía no.'); },
    },
  ],
};
