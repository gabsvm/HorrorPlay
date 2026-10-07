// Chapter 1 — Buck's Row, 31 August 1888, before dawn. Polly Nichols has already been taken to the mortuary.
import * as A from '../art/paint.js';
import { nightBackdrop, facade, warehouse } from '../art/build.js';
import { P } from '../art/palette.js';
import { Actor } from '../engine/actor.js';
import { Smoke, Drip, Rat, Cat, Crow, Moths, Paper, Ripples } from '../engine/life.js';
import { drawCorpse, groundLantern } from './corpse.js';

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
    const layers = nightBackdrop(R, WIDTH, { seed: 12, spireX: 980, spireH: 380, domeX: 300, horizon: 450 });
    const lights = [];
    const chimneys = [];
    const near = R.paintLayer(WIDTH, (ctx) => {
      warehouse(ctx, { x: 0, w: 640, top: 70, base: GROUND - 12, seed: 3, name: 'ESSEX WHARF' });
      // Brown's stable yard: high wall with coping
      A.brickWall(ctx, 640, 250, 300, GROUND - 262, { seed: 8, palette: A.BRICK.stock });
      ctx.fillStyle = '#5c574d'; ctx.fillRect(636, 238, 308, 14); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(636, 252, 308, 4);
      A.gate(ctx, 690, GROUND - 230, 200, 218);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(690, GROUND - 236, 200, 8);
      A.chalk(ctx, 704, GROUND - 204, "BROWN'S\nSTABLE YARD", { size: 17 });
      A.poster(ctx, 900, 300, 70, 96, [['POLICE', 13], ['NOTICE', 13], ['', 6], ['MURDER', 11]], { seed: 21, tilt: 0.03, color: '#c4b892' });
      // New Cottages, stock brick, doors straight onto the pavement
      for (let i = 0; i < 5; i++) {
        const x = 940 + i * 170;
        const ls = facade(ctx, { x, w: 170, top: GROUND - 512, base: GROUND - 12, seed: 40 + i, floors: 2, windows: 1, door: 120, number: String(i + 1), stock: true, litMap: i === 1 ? [0] : i === 4 ? [1] : [], figures: i === 4 ? [1] : [], nets: [0], roof: 'parapet', boards: i === 3 ? [0] : [] });
        ls.forEach((c) => lights.push({ x: c.x, y: c.y, r: 200, color: P.candle, intensity: 0.55, flicker: 0.15, halo: 34, haloK: 0.6 }));
        chimneys.push(...ls.chimneys);
      }
      // Board school: tall gothic block with a bell turret
      A.brickWall(ctx, 1790, 40, 560, GROUND - 52, { seed: 66, palette: ['#4b352d', '#56392f', '#44302a'] });
      ctx.fillStyle = '#1a1e21';
      ctx.beginPath(); ctx.moveTo(1770, 46); ctx.lineTo(2070, -120); ctx.lineTo(2370, 46); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.moveTo(1770, 46); ctx.lineTo(2070, -120); ctx.lineTo(2370, 46); ctx.clip();
      for (let yy = -120; yy < 46; yy += 8) for (let xx = 1770 + (Math.abs(Math.round(yy / 8)) % 2) * 9; xx < 2370; xx += 18) { ctx.fillStyle = (xx + yy) % 3 ? '#22282c' : '#1c2124'; ctx.fillRect(xx, yy, 16, 7); }
      ctx.restore();
      ctx.fillStyle = '#16191b'; ctx.fillRect(2050, -60, 40, 50); ctx.beginPath(); ctx.moveTo(2044, -60); ctx.lineTo(2070, -110); ctx.lineTo(2096, -60); ctx.fill();
      ctx.fillStyle = '#0a0b0c'; ctx.fillRect(2060, -48, 20, 26);
      for (let i = 0; i < 4; i++) {
        A.windowFrame(ctx, 1840 + i * 128, 110, 62, 150, { arch: true, seed: 70 + i, panes: 4, frame: '#8a8270' });
        A.windowFrame(ctx, 1840 + i * 128, 330, 62, 130, { arch: true, seed: 80 + i, panes: 3, broken: i === 2, frame: '#8a8270' });
      }
      ctx.font = '600 22px "IM Fell English SC", Georgia, serif'; ctx.fillStyle = 'rgba(210,200,175,0.5)'; ctx.textAlign = 'center';
      ctx.fillText('LONDON SCHOOL BOARD', 2070, 300);
      A.poster(ctx, 1900, 500, 120, 76, [['£100 REWARD', 18], ['INFORMATION', 11], ['WHITECHAPEL', 11]], { seed: 3, tilt: -0.03 });
      A.poster(ctx, 2160, 506, 96, 66, [['THE PAVILION', 13], ['THEATRE', 13], ['TO-NIGHT', 10]], { seed: 5, tilt: 0.04, color: '#b48a62' });
      A.railing(ctx, 1790, GROUND - 70, 560, 58);
      // the mouth of an alley, then a blind wall
      ctx.fillStyle = '#040505'; ctx.fillRect(2350, 120, 120, GROUND - 120);
      A.brickWall(ctx, 2470, 150, 130, GROUND - 162, { seed: 90, palette: A.BRICK.stock });
      A.poster(ctx, 2490, 380, 90, 110, [['LODGINGS', 14], ['4d.', 18], ['DOUBLE 8d.', 11]], { seed: 9, tilt: -0.05 });
      A.streetSign(ctx, 1000, 258, "BUCK'S ROW  E.");
      A.wires(ctx, 600, 120, 1180, 210, { count: 2, sag: 40 });
      A.wires(ctx, 1600, 230, 2060, 120, { count: 2, sag: 30 });
      // pavement and street
      A.flagstones(ctx, 0, GROUND - 12, WIDTH, 18);
      A.kerb(ctx, 0, GROUND + 6, WIDTH);
      A.cobbles(ctx, 0, GROUND + 22, WIDTH, 720 - GROUND - 22, { seed: 14, rows: 9, puddles: 12 });
      // the gutter grate where Wren will later say she found the scalpel
      ctx.fillStyle = '#0b0b0b'; ctx.fillRect(560, GROUND + 14, 54, 10);
      ctx.fillStyle = '#2a2a2a'; for (let i = 0; i < 6; i++) ctx.fillRect(563 + i * 9, GROUND + 15, 4, 8);
      // the boy's bucket and the patch he is scrubbing; footprints of black mud heading west
      A.barrel(ctx, 700, GROUND - 24, 22, 24);
      ctx.fillStyle = 'rgba(30,22,20,0.65)'; ctx.beginPath(); ctx.ellipse(800, GROUND + 26, 70, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(140,150,140,0.25)'; ctx.beginPath(); ctx.ellipse(790, GROUND + 24, 40, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(8,8,6,0.8)';
      for (let i = 0; i < 12; i++) { const x = 640 - i * 40, y = GROUND + 30 + (i % 2) * 10; ctx.beginPath(); ctx.ellipse(x, y, 9, 3.2, 0, 0, Math.PI * 2); ctx.ellipse(x + 8, y, 4, 2.6, 0, 0, Math.PI * 2); ctx.fill(); }
      A.bollard(ctx, 1550, GROUND - 6);
      A.sack(ctx, 260, GROUND - 8, 4); A.sack(ctx, 300, GROUND - 6, 5);
      A.crate(ctx, 160, GROUND - 70, 66, 58, 9, { stencil: 'E.W.' });
      const lamp = A.lampPost(ctx, 1640, GROUND, 320);
      lights.push({ id: 'bodylamp', x: 880, y: GROUND + 4, r: 300, color: P.lantern, intensity: 0.85, flicker: 0.06, halo: 26, haloK: 0.6 });
      lights.push({ id: 'lamp', x: lamp.x, y: lamp.y, r: 520, color: P.gas, intensity: 1.15, flicker: 0.08, halo: 130, shaft: true, shaftW: 130 });
    });
    layers.push({ canvas: near, parallax: 1, kind: 'near' });
    const fg = R.paintLayer(WIDTH * 1.3, (ctx) => {
      ctx.fillStyle = '#060708';
      ctx.fillRect(120, 610, 34, 110); ctx.fillRect(112, 600, 50, 14);
      A.hangingSign(ctx, 0, 70, 'COFFEE ROOMS', { w: 150, h: 46, fg: true });
      A.cart(ctx, 2600, 760);
      ctx.fillStyle = '#060708'; ctx.fillRect(3100, 0, 70, 720);
    });
    layers.push({ canvas: fg, parallax: 1.3, kind: 'fg' });
    return { layers, lights, chimneys };
  },

  makeLife() {
    const b = this.built || {};
    return [
      ...(b.chimneys || []).map((c, i) => new Smoke({ x: c.x, y: c.y, rate: 0.8 + i * 0.13, size: 0.8 })),
      new Drip({ x: 312, y: GROUND - 160, ground: GROUND - 8 }),
      new Drip({ x: 1180, y: GROUND - 518, ground: GROUND - 10, period: 3.1 }),
      new Drip({ x: 2345, y: 130, ground: GROUND - 6, period: 2.6 }),
      new Rat({ x0: 160, x1: 900, y: GROUND + 16, seed: 2 }),
      new Cat({ x: 690, y: 238, facing: 1 }),
      new Crow({ x: 2070, y: -112, facing: -1, seed: 4 }),
      new Moths({ x: 1640, y: GROUND - 300 }),
      new Paper({ x0: 1200, x1: 2500, y: GROUND + 60, seed: 7 }),
      new Ripples({ x: 1640, y: GROUND + 60, w: 200 }),
      new Ripples({ x: 520, y: GROUND + 76, w: 160, n: 4 }),
    ];
  },

  drawNear(ctx, t) {
    // Polly Nichols where the carter found her, Neil's cape over her, waiting for the mortuary barrow
    const gone = !this.G || this.G.flag('polly_taken') || this.G.game.inMenu;
    const L = this.lights && this.lights.find((l) => l.id === 'bodylamp');
    if (L) L.off = gone;
    if (!gone) groundLantern(ctx, 892, GROUND + 22);
    if (!gone) drawCorpse(ctx, t, { key: 'polly', x: 800, y: GROUND + 20, h: 150, cover: '#161c30', look: { hat: 'none', coat: '#4a3a2c', hair: '#4a3a2a' } });
    if (!gone) { ctx.fillStyle = '#0e0d0d'; ctx.beginPath(); ctx.ellipse(712, GROUND + 26, 14, 6, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2a2622'; ctx.fillRect(700, GROUND + 22, 22, 2); }
  },

  actors() {
    return [
      new Actor('Pike', { x: 980, y: GROUND, h: 200, hat: 'bowler', coat: '#2c2a26', coatLen: 0.9, cape: true, facing: 1, build: 1.05, moustache: '#3a2a1e', buttons: 'double', notebook: true, hair: '#3a2a1e' }),
      new Actor('Neil', { x: 1500, y: GROUND, h: 212, hat: 'helmet', coat: '#161c30', trousers: '#12151f', coatLen: 0.8, flare: 1.02, facing: -1, lantern: true, lanternOn: true, belt: true, number: true, moustache: '#4a3424' }),
      new Actor('Chico', { x: 610, y: GROUND, h: 156, hat: 'cap', coat: '#4a3a2a', coatLen: 0.58, facing: -1, stoop: 1, pose: 'kneel', patches: true, hair: '#4a3020' }),
    ];
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
    await G.say('Pike', 'Mary Ann Nichols. La llamaban Polly. Cuarenta y tres años. Sigue ahí, delante del portón: la carretilla del depósito no ha llegado.');
    await G.say('Pike', 'Si quiere verla, ahora es el momento, señor.');
    await G.say('Pike', 'La encontró un carretero a las tres cuarenta, justo delante del portón del establo. Neil llegó un minuto después, haciendo la ronda.');
    await G.think('Tengo que hablar con todos antes de que se despierte la calle, que luego la gente habla de más.');
    G.objective('Examinar el cuerpo. Hablar con Pike, con Neil y con el chico.');
  },

  async onDeduce(G) {
    if (G.deduced('d_brennan') && G.deduced('d_bisturi') && !G.flag('c1_done')) {
      G.objective('Volver al desolladero de Winthrop Street.');
      await G.think('Brennan, o alguien del hospital. Tengo que volver al desolladero.');
    }
  },

  hotspots: [
    {
      id: 'pike', name: 'Sargento Pike', cursor: 'talk', rect: (G) => { const a = G.actor('Pike'); return [a.x - 40, GROUND - 181, 80, 181]; }, walk: (G) => G.actor('Pike').x + 90, face: -1,
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
      id: 'neil', name: 'Agente Neil', cursor: 'talk', rect: [1460, GROUND - 189, 80, 189], walk: 1400, face: 1,
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
      id: 'boy', name: 'Chico con un cubo', cursor: 'talk', rect: [570, GROUND - 95, 90, 95], walk: 700, face: -1,
      act: async (G) => {
        const b = G.actor('Chico'); b.talking = true;
        if (!G.hasClue('silencio')) {
          await G.say('Chico', 'Mi madre dice que en cuanto se la lleven hay que fregarlo, antes de que la gente se despierte y venga a mirar.');
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
      id: 'polly', name: 'El cuerpo de Polly Nichols', verb: 'Examinar', when: (G) => !G.flag('polly_taken'), rect: [690, GROUND - 30, 200, 70], walk: 930, face: -1, gesture: false,
      act: async (G) => {
        const first = !G.flag('polly_seen');
        G.flag('polly_seen', true);
        if (first) {
          const neil = G.actor('Neil'); neil.talking = true;
          await G.say('Neil', 'Le eché la capa por encima, señor. No me parecía bien dejarla así, con la cara al aire.');
          neil.talking = false;
        }
        await G.think('Levanto la capa de Neil.');
        await G.inspect('polly', {
          title: 'Mary Ann "Polly" Nichols', body: 'nichols',
          points: [
            { id: 'cara', x: 300, y: 350, r: 60, name: 'La cara', act: async (G) => {
              await G.think('Tiene los ojos abiertos. Miran algo que ya no está ahí.');
              await G.think('Un moratón en la mandíbula, a la derecha: alguien le sujetó la cara con la mano derecha, desde atrás.');
            } },
            { id: 'cuello', x: 412, y: 350, r: 50, name: 'El cuello', act: async (G) => {
              await G.think('Dos cortes. De un lado a otro, hasta el hueso. El primero para callarla, el segundo para asegurarse.');
              await G.think('Ni un rasguño en las manos. No se defendió.');
              G.clue('cuello');
            } },
            { id: 'vientre', x: 925, y: 370, r: 80, name: 'La falda', act: async (G) => {
              await G.think('La falda está empapada. La levanto un palmo con la punta del lápiz.');
              G.red(0.35); G.audio.sting(0.12);
              await G.think('Cortes en el vientre, largos, hechos después. Por eso apenas había sangre en el suelo: la ropa se la bebió toda.');
              G.sanity(-3);
            } },
            { id: 'manos', x: 900, y: 540, r: 55, name: 'Las manos', act: async (G) => {
              await G.think('Las manos abiertas, las palmas hacia arriba. Ni tierra en las uñas. No arañó a nadie.');
            } },
            { id: 'sombrero', x: 150, y: 500, r: 60, name: 'El sombrero', act: async (G) => {
              await G.think('El sombrero negro nuevo. Le dijo a la casera que con ese sombrero pronto tendría para la cama.');
              await G.think('Lo recojo y lo dejo junto a su cabeza. No sé por qué lo hago.');
            } },
          ],
        });
        await G.think('Vuelvo a taparla con la capa.');
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
      id: 'lamp', name: 'Farola', rect: [1600, GROUND - 350, 80, 350], walk: 1580,
      act: async (G) => { await G.think('La farola más cercana al portón está a treinta yardas. Allí estaba tan oscuro como en el fondo de un pozo.'); },
    },
    {
      id: 'window', name: 'Ventana de la señora Green', rect: [1150, 160, 95, 160], walk: 1190,
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
        G.flag('polly_taken', true);
        await G.goto('knackers', { x: 1960, facing: -1 });
      },
    },
    {
      id: 'east', name: 'Hacia Baker\'s Row', cursor: 'exit', rect: [2470, GROUND - 420, 130, 440], walk: 2460, face: 1,
      act: async (G) => { await G.think('Mi casa queda por allí. Todavía no.'); },
    },
  ],
};
