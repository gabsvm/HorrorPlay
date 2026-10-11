// Chapter 1 — Buck's Row, 31 August 1888, before dawn. Polly Nichols has already been taken to the mortuary.
import * as A from '../art/paint.js';
import { nightBackdrop, facade, warehouse } from '../art/build.js';
import { P } from '../art/palette.js';
import { Actor } from '../engine/actor.js';
import { canFinishC1 } from '../story/progression.js';
import { Smoke, Drip, Rat, Cat, Crow, Moths, Paper, Ripples } from '../engine/life.js';
import { drawCorpse, groundLantern } from './corpse.js';

const WIDTH = 2600, GROUND = 628;

export default {
  id: 'bucks_row',
  width: WIDTH,
  groundY: GROUND,
  space: 'street',
  // the gas lamp hisses over the doorway; a cab now and then in Whitechapel Road, Christ Church striking
  sounds: [{ kind: 'gas', x: 1640, vol: 0.7, reach: 520 }],
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
    await G.say('Pike', 'Inspector. No pise junto al portón.');
    await G.say('Pike', 'No lleva papeles. Hasta que el forense la vea, no hay nombre.');
    await G.say('Ashgrove', '¿Quién la vio primero?');
    await G.say('Pike', 'Dos carreteros, sobre las tres cuarenta. Neil llegó detrás. Aún discuten cuál la encontró.');
    G.objective('Examinar el cuerpo. Hablar con Pike, con Neil y con el chico.');
  },

  // a deduction never ends the night by itself; once the night can be closed, the objective says so
  async onDeduce(G) {
    if (!G.flag('c1_done')) G.game.chapterHooks.c1Objective(G);
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
        if (G.flag('neil_times') && !G.hasClue('ronda')) opts.push(['La hoja de rondas de esta noche.', 'beats']);
        if (G.second() && G.flag('pike_notes') && !G.flag('pike_book_read')) opts.push(['Déjeme ver su libreta, Pike.', 'book']);
        if (canFinishC1(G.state).ok && !G.flag('c1_done')) opts.push(['Cerramos por esta noche, Pike.', 'close']);
        opts.push(['Nada más.', 'bye']);
        const c = opts[await G.choice(opts.map((o) => o[0]))][1];
        if (c === 'close') { await G.game.chapterHooks.closeC1(G, 'pike'); return; }
        if (c === 'book') { pike.talking = true; await G.say('Pike', '...Tome. No tengo nada que esconderle.'); pike.talking = false; await G.game.chapterHooks.pikeBook(G); return; }
        pike.talking = true;
        if (c === 'doc') {
          await G.say('Pike', 'Llewellyn cree que los cortes podrían ser de un zurdo.');
          G.clue('zurdo');
          await G.say('Pike', 'Dice que conocía el cuerpo. No es una afirmación que haga a la ligera.');
          G.clue('anatomia');
          pike.talking = false;
        } else if (c === 'polly') {
          G.flag('pike_polly', true);
          await G.say('Pike', 'Lleva un sombrero de paja negro; parece nuevo. Alguien lo eligió con cuidado.');
          pike.talking = false;
        } else if (c === 'notes') {
          G.flag('pike_notes', true);
          await G.say('Pike', 'Quién entra. Quién sale. A qué hora.');
          pike.talking = false;
          await G.say('Ashgrove', '¿También apunta cuándo llego yo?');
          pike.talking = true;
          await G.say('Pike', 'Cuatro y doce. Lo mandé llamar a las cuatro.');
        } else if (c === 'beats') {
          await G.say('Pike', 'Aquí la tiene, señor. Las horas de todos, y lo que declaran.');
          pike.talking = false;
          await G.game.chapterHooks.beats(G);
        } else if (c === 'lead') {
          G.flag('knackers_lead', true);
          G.objective('Ir al desolladero de Winthrop Street, hacia el oeste.');
          await G.say('Pike', 'Barber tiene un desolladero en Winthrop Street. No cierra de noche.');
          pike.talking = false;
          await G.say('Ashgrove', '¿Armas?');
          pike.talking = true;
          await G.say('Pike', 'Allí hasta el aprendiz lleva cuchillo.');
        }
        pike.talking = false;
      },
    },
    {
      id: 'neil', name: 'Agente Neil', cursor: 'talk', rect: [1460, GROUND - 189, 80, 189], walk: 1400, face: 1,
      act: async (G) => {
        const neil = G.actor('Neil'); neil.facing = -1; neil.talking = true;
        if (!G.hasClue('ronda')) {
          await G.say('Neil', 'Pasé a las tres y cuarto. La calle estaba despejada.');
          neil.talking = false;
          await G.say('Ashgrove', '¿Y después?');
          neil.talking = true;
          await G.say('Neil', 'A las tres cuarenta y cinco la encontré yo. Le hice señas a Thain con la linterna. Está todo en la hoja.');
          neil.talking = false;
          if (!G.flag('neil_times')) {
            G.flag('neil_times', true);
          }
        } else {
          await G.say('Neil', 'Es mi ronda desde hace seis años. Anoche me costó entrar en esa calle.');
        }
        neil.talking = false;
      },
    },
    {
      id: 'boy', name: 'Chico con un cubo', cursor: 'talk', rect: [570, GROUND - 95, 90, 95], walk: 700, face: -1,
      act: async (G) => {
        const b = G.actor('Chico'); b.talking = true;
        if (!G.hasClue('silencio')) {
          await G.say('Chico', 'Mi madre quiere que lo limpien antes de que vengan los curiosos.');
          b.talking = false;
          await G.say('Ashgrove', '¿Vio a alguien?');
          b.talking = true;
          await G.say('Chico', 'Duerme con la ventana abierta. No oyó ni un grito. Y ella oye hasta cuando los gatos pisan el tejado.');
          G.clue('silencio');
          b.talking = false;
        } else {
          await G.say('Chico', 'Ese barro de sus botas... aquí no hay de ese color.');
          b.talking = false;
        }
        b.talking = false;
      },
    },
    {
      id: 'polly', name: 'El cuerpo de la mujer de Buck\'s Row', verb: 'Examinar', when: (G) => !G.flag('polly_taken'), rect: [690, GROUND - 30, 200, 70], walk: 930, face: -1, gesture: false,
      act: async (G) => {
        const first = !G.flag('polly_seen');
        G.flag('polly_seen', true);
        if (first) {
          const neil = G.actor('Neil'); neil.talking = true;
          await G.say('Neil', 'La tapé yo. No tenían por qué verla todos.');
          neil.talking = false;
        }
        // the points sit on the painted close-up (assets/closeups/nichols.jpg)
        await G.inspect('polly', {
          title: 'La mujer de Buck\'s Row', body: 'nichols',
          points: [
            { id: 'cara', x: 375, y: 279, r: 60, name: 'La cara', act: async (G) => {
              await G.think('Le sujetaron la mandíbula con la derecha.');
            } },
            { id: 'cuello', key: true, x: 474, y: 280, r: 42, name: 'El cuello', act: async (G) => {
              await G.think('Dos cortes. El primero para acallarla.');
              await G.think('Sin señales de defensa.');
              G.clue('cuello');
            } },
            { id: 'vientre', x: 950, y: 290, r: 90, name: 'La falda', act: async (G) => {
              G.red(0.35); G.audio.sting(0.12);
              await G.think('Heridas posteriores. La ropa absorbió casi toda la sangre.');
              G.sanity(-3);
            } },
          ],
        });
      },
    },
    {
      id: 'tracks', name: 'Rastro en los adoquines', rect: [150, GROUND + 14, 520, 40], walk: 560, face: -1,
      act: async (G) => {
        G.player.pose = 'kneel';
        await G.think('Barro del río. La huella se aleja hacia Winthrop Street.');
        G.clue('huellas');
        G.player.pose = null;
        await G.think('Mi talla. Eso no significa nada.');
      },
      again: 'Barro de río, hacia Winthrop Street.',
    },
    {
      id: 'window', name: 'Ventana de la señora Green', rect: [1150, 160, 95, 160], walk: 1190,
      act: async (G) => {  G.audio.whisper(0.8, 0.05); },
    },
    {
      id: 'west', name: 'Hacia Winthrop Street', cursor: 'exit', rect: [0, GROUND - 420, 150, 440], walk: 160, face: -1,
      act: async (G) => {
        if (!G.flag('knackers_lead')) { await G.think('Necesito la opinión de Llewellyn antes de irme.'); return; }
        G.flag('polly_taken', true);
        await G.goto('knackers', { x: 1960, facing: -1 });
      },
    },
  ],
};
