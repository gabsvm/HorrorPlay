// Chapter flow and every scripted sequence that spans scenes.
// The first reading is told as Thomas believes it: someone comes in by his window and uses his boots,
// his ink, his scalpel, and he hunts that man (Pike, Greaves). The second reading (G.two, G.second)
// tells the same nights as they were. A boy who keeps quiet at the river in 1866 keeps quiet; in the
// second reading he never could.
import { Actor } from '../engine/actor.js';
import { playIntro } from './intro.js';
import { canFinishC1, canEnterFinale } from './progression.js';
import { perception, perceptionBand } from './perception.js';

const LOOKS = {
  child: { hat: 'cap', coat: '#3a342c', coatLen: 0.62, flare: 1.05, build: 0.9, speed: 120, lantern: false, collarUp: false, patches: true, scarf: '#5a2a22', sideburns: false, hair: '#2a1e16', gloves: null, stubble: null },
  adult: { hat: 'bowler', coat: '#23262b', coatLen: 0.88, flare: 1.2, build: 1, speed: 150, lantern: true, collarUp: true, patches: false, sideburns: true, hair: '#1a1410', trousers: '#1a1b1e', gloves: '#2a221c', scarf: '#4a1612', stubble: 'rgba(30,22,18,0.35)' },
};
function look(G, k) { Object.assign(G.player, LOOKS[k]); }

// the séance raps, as [row, column] knocks on the board under the star chart: H O S P E S
const RAPS = [[2, 3], [3, 4], [4, 3], [3, 5], [1, 5], [4, 3]];


// The clock jumps. Nothing happens on screen; that is the point.
async function lostTime(G, from, to, { date = null } = {}) {
  await G.fade(1, 900);
  G.audio.setBeds({ drone: 0.25 }, 1);
  G.game.ui.hideDialogue();
  await G.card('', from, '', 1600);
  for (let i = 0; i < 6; i++) { G.audio.tick(); await G.wait(140 - i * 15); }
  G.audio.whisper(1.8, 0.12);
  G.red(0.25);
  await G.card('', to, '', 1800);
  G.date(date, to);
}

// Only a player who has finished the game once, reading it the second time, gets the shortcuts
// through puzzles they have already solved (never a new player, never by accident).
// where the chase went wrong first (alleys.js): the street the city names
const chaseStreet = (flags) => ({ flower_dean: 'Flower and Dean Street', thrawl: 'Thrawl Street' })[flags.chase_seen_at] || 'Wentworth Street';
const knowsPuzzles = (G) => G.second() && !!(G.game.constructor.read && G.game.constructor.read());

export function makeChapters() {
  const chapters = {
    async prologue(G) {
      G.hud(false);
      // a new game opens on the notebook found in the Ditch; replaying the chapter does not
      if (G.game.introNext) { G.game.introNext = false; await playIntro(G); }
      if (!G.state.flags.signature) {
        // the notebook's first page, signed: the same page and the same hand come back at the end
        G.state.flags.signature = (await G.nameEntry('Firma del propietario del cuaderno', null, 'Thomas Ashgrove')).trim() || 'Thomas Ashgrove';
        G.state.flags.intro_signature_confirmed = true;
      }
      G.flag('fs_1888', false);
      look(G, 'child');
      G.game.r.fx.fade = 1;
      await G.card('', 'Limehouse', 'Octubre de 1866', 3000);
      await G.goto('foreshore', { x: 480, facing: 1, fade: false });
      await G.fade(0, 1800);
      await G.narrate('Nat no llegó a cumplir diez años.');
      await G.think('Si el río puede devolver un barco, puede devolver algo más.');
      G.objective('Buscar el barquito de Nat en el barro, junto al embarcadero.');
      G.tipOnce('controls', {
        mouse: 'Haz <b>clic</b> para caminar. Pasa el cursor por la escena: lo que se puede examinar se enmarca. <kbd>Espacio</kbd> revela todo lo interactuable.',
        touch: '<b>Toca</b> para caminar. Toca algo una vez para ver qué es y otra vez para examinarlo. <b>Revelar</b> muestra todo lo interactuable.',
      }, 9000);
    },

    async c1(G) {
      look(G, 'adult');
      G.hud(true);
      G.flag('room_phase', 'c1');
      G.game.r.fx.fade = 1;
      await G.card('Capítulo I', "Buck's Row", 'Whitechapel, 31 de agosto de 1888', 4200);
      G.date('31 de agosto de 1888', '3:58');
      await G.goto('room', { x: 760, facing: -1, fade: false });
      await G.fade(0, 1500);
      G.audio.knock();
      await G.wait(900);
      await G.say('Voz al otro lado de la puerta', '¡Inspector Ashgrove! El sargento Pike le manda llamar. Han encontrado a una mujer en Buck\'s Row.');
      await G.say('Ashgrove', 'Voy.');
      G.objective('Coger el abrigo, las botas y la linterna, y salir hacia Buck\'s Row.');
    },

    async c2(G) {
      look(G, 'adult');
      G.sanity(+20);
      G.hud(true);
      G.game.r.fx.fade = 1;
      await G.doc(`<h3>RECORTE DE PRENSA — SEPTIEMBRE DE 1888</h3>
        <p>El 31 de agosto, una compañera del asilo de Lambeth reconoció a la mujer de Buck's Row: Mary Ann Nichols, a quien llamaban «Polly». Tenía cinco hijos. La noche del crimen no reunió los cuatro peniques de la cama; dijo a la encargada que volvería pronto con el dinero, y que se fijaran en su sombrero nuevo.</p>`);
      await G.card('Capítulo II', 'El delantal de cuero', '29 Hanbury Street, 8 de septiembre de 1888', 4200);
      await G.goto('hanbury', { x: 240, facing: 1, fade: false });
      await G.fade(0, 1500);
    },

    async c3(G) {
      look(G, 'adult');
      G.sanity(+15);
      G.hud(true);
      G.flag('room_phase', 'c3a');
      G.game.r.fx.fade = 1;
      await G.card('Capítulo III', 'Tinta roja', 'Thrawl Street, noche del 24 de septiembre de 1888', 4200);
      G.date('24 de septiembre de 1888', '23:40');
      await G.goto('room', { x: 1000, facing: 1, fade: false });
      await G.fade(0, 1500);
      await G.think('No quiero otra mañana como aquella.');
      G.objective('Terminar los informes en el escritorio.');
    },

    async c4(G) {
      look(G, 'adult');
      G.sanity(+10);
      G.hud(true);
      G.game.r.fx.fade = 1;
      await G.card('', 'Octubre', 'Ningún nuevo crimen con la misma firma. Los rumores, en cambio, no descansan.', 3400);
      await G.card('', '', 'Duermo de día. De noche camino. Pike ya no me saluda.', 3400);
      await G.doc(`<h3>RECORTE DE PRENSA — OCTUBRE DE 1888</h3>
        <p>En la investigación de Berner Street, una compañera de pensión reconoció a la víctima: Elizabeth Stride, a quien llamaban «Long Liz», nacida cerca de Gotemburgo. Antes, otra mujer había jurado que era su hermana; se demostró que se equivocaba.</p>
        <p>En el caso de Mitre Square, John Kelly reconoció a su compañera, Catherine Eddowes. Había vuelto días antes de la recogida del lúpulo en Kent. Esa noche, al salir de la comisaría de Bishopsgate, ella había dado el nombre de Mary Ann Kelly.</p>`);
      await G.card('Capítulo IV', 'Huésped', 'London Hospital, 8 de noviembre de 1888', 4200);
      G.objective(G.two('Encontrar pruebas contra Greaves en su consulta: el cajón, la vitrina.', 'Encontrar lo que Greaves sabe de mí: el cajón, la vitrina.'));
      await G.goto('greaves', { x: 230, facing: 1, fade: false });
      await G.fade(0, 1500);
    },
  };

  const hooks = {
    // after loading a resume point: the boy in the prologue, the inspector after it
    restoreLook(G) { look(G, G.state.chapter === 'prologue' ? 'child' : 'adult'); },

    // ------------------------------------------------------------ prologue
    async prologueBoat(G) {
      G.player.pose = 'kneel';
      G.player.pose = null;
      G.flag('boat', true);
      G.flag('water_light', true);
      G.objective('Acercarse al río.');
      G.audio.sting(0.1);
      if (G.second() && !G.flag('s2_prologue')) {
        // the second reading: for a moment the water holds a grown man in a bowler, who does not kneel
        G.flag('s2_prologue', true);
        G.scene.reflection = true;
        await G.wait(1400);
        await G.think('En el agua hay un hombre con bombín. No se agacha conmigo.');
        G.scene.reflection = false;
      }
    },

    async prologueWater(G) {
      if (!G.flag('boat')) {  await G.think('No. Primero el barco.'); return; }
      G.cinema(true);
      G.audio.setBeds({ river: 0.4, drone: 0.4 }, 3);
      G.mad(0.3);
      await G.voice('Thomas.');
      await G.think('¿Nat?');
      await G.voice('Tommy. Estoy aquí abajo. Tengo frío.');
      // Both answers stand, in both readings. Answering lets it in tonight; keeping quiet only puts
      // it off: thirteen years later, in the dissecting room, Thomas answers anyway (1879).
      let answered = (await G.choice(['«Aquí estoy».', 'Guardar silencio.'])) === 0;
      if (!answered) {
        G.mad(0.45); G.audio.drip();
        await G.wait(900);
        await G.voice('Solo tienes que decirlo.');
        answered = (await G.choice(['«Aquí estoy».', 'Seguir callado.'])) === 0;
      }
      G.flag('answered1866', answered);
      G.state.flags.entry_year = answered ? 1866 : 1879;
      if (answered) {
        G.mad(0.6);
        await G.say('Thomas', 'Aquí estoy.');
        await G.voice('Ya lo sé.');
        G.flash(1); G.audio.sting(0.35); G.shake(12);
      } else {
        // the green glow draws back until it goes out; the boy keeps looking
        G.mad(0.2);
        await G.wait(2200);
        G.flag('water_light', false);
        G.audio.sting(0.12);
        await G.wait(1200);
      }
      await G.fade(1, 400);
      G.mad(0);
      G.audio.setBeds({}, 2);
      G.audio.playMusic(null);
      await G.wait(1500);
      await G.card('', 'El Huésped', 'Hospes (lat.): el que recibe y el que es recibido.', 5200);
      G.cinema(false);
      await G.chapter('c1');
    },

    // ------------------------------------------------------------ chapter 1
    async leaveRoomC1(G) {
      G.audio.door();
      await G.goto('bucks_row', { x: 2420, facing: -1 });
    },

    async takeScalpel(G) {
      G.flag('bisturi_taken', true);
      G.give('bisturi');
      G.clue('bisturi');
      await G.think('Mango de ébano. Marca del London Hospital.');
      const w = G.actor('Wren');
      w.talking = true;
      await G.say('Wren', 'No lo oiga dos veces, señor. Si el agua dice su nombre, déjela hablando sola.');
      w.talking = false;
      const c = await G.choice(['¿Por qué me dices eso?', 'Son cuentos de ribereños.']);
      w.talking = true;
      if (c === 0) await G.say('Wren', G.two('Porque anoche la oí hablar desde la rejilla. No era agua corriente.', 'Porque usted ya le contestó una vez.'));
      else await G.say('Wren', 'Si prefiere no creerme, tampoco voy a cobrarle por eso.');
      w.talking = false;
      G.clue('regla');
      G.sanity(-5);
      hooks.c1Objective(G);
      await G.think('Un bisturí del London Hospital, a dos pasos de ella.');
    },

    // what the player still needs to close chapter one
    c1Objective(G) {
      if (G.flag('c1_done')) return;
      const gate = canFinishC1(G.state);
      if (!gate.ok) { G.objective(`${gate.missing[0].replace(/^./, (m) => m.toUpperCase())}.`); return; }
      G.objective('Cuando quiera: cerrar la noche con Pike en Buck\'s Row, o con Brennan en el desolladero.');
    },

    // Enough for tonight: said to whoever is at hand. First, what Thomas makes of Brennan; it is
    // written down and the mob remembers it. Suspecting him is one answer among three.
    async closeC1(G, who) {
      const opts = [];
      if (G.hasClue('brennan_zurdo')) opts.push(['Brennan: hay que vigilarlo.', 'suspect']);
      opts.push(['Brennan: no hay nada contra él.', 'clear'], ['Brennan: todavía no lo sé.', 'unsure']);
      const stance = opts[await G.choice(opts.map((o) => o[0]))][1];
      G.state.flags.brennan_stance = stance;
      (G.state.investigation ??= {}).routes ??= {};
      G.state.investigation.routes.c1 = { closedAt: G.scene.id, stance, conclusions: G.state.deductions.filter((d) => /^d_(bisturi|zurdo|ronda|confianza|brennan)$/.test(d)) };
      if (who === 'pike') {
        const pike = G.actor('Pike'); pike.talking = true;
        await G.say('Pike', { suspect: 'Lo vigilaremos. Con cuidado: aquí se cuelga a la gente por menos.',
          clear: 'Lo apunto así. Será el único que lo escriba esta semana.',
          unsure: 'Prudente. El barrio no lo será.' }[stance]);
        pike.talking = false;
      }
      G.flag('c1_done', true);
      await hooks.endC1(G, who);
    },

    // Buck's Row: the night's beats, and the only ten minutes when no one could see the gateway
    async beats(G) {
      const sheet = () => G.doc(`<h3>DIVISIÓN J (BETHNAL GREEN) — RONDAS · copia a la H</h3>
        <p class="small">Noche del 30 al 31 de agosto de 1888</p>
        <p class="small">Remitida a Whitechapel: la H pide las rondas de la noche por lo de George Yard.</p>
        <p><b>PC 97J Neil.</b> Buck's Row, Brady Street, Baker's Row. Vuelta de media hora: pasa ante el portón del establo a las y cuarto y a menos cuarto.</p>
        <p><b>PC 96J Thain.</b> Brady Street. A las y media se detiene en la esquina de Buck's Row y alumbra la calle con la linterna.</p>
        <p><b>PC 55H Mizen.</b> Baker's Row y Hanbury Street. Desde su punto no se ve Buck's Row.</p>
        <p class="hand">Declaraciones: Thain alumbró Buck's Row a las 3:30; no había nada en el suelo. Charles Cross, carretero, entró en la calle hacia las 3:40 y la encontró delante del portón.</p>
        <p class="small" style="text-align:right">${G.two('Firmado: el inspector de guardia', 'Firmado: T. Ashgrove, inspector de guardia')}</p>`);
      if (knowsPuzzles(G)) {
        const k = await G.choice(['Ya lo sé: de 3:30 a 3:40.', 'Leer la hoja otra vez.']);
        if (k === 0) { G.clue('ronda'); await G.think('Yo firmé estas rondas.'); return; }
      }
      await sheet();
      await G.think('¿En qué intervalo quedó el portón fuera de vista?');
      let misses = 0;
      for (;;) {
        const c = await G.choice(['Entre las 3:15 y las 3:45: entre dos pasadas de Neil.', 'Entre las 3:15 y las 3:30.', 'Entre las 3:30 y las 3:40.', 'Entre las 3:40 y las 3:45.', 'Mirar otra vez la hoja.']);
        if (c === 2) break;
        if (c === 4) { await sheet(); continue; }
        misses++;
        await G.think(['No. A las 3:30 Thain alumbró la calle desde Brady Street, y no había nadie en el suelo.',
          'Entonces Thain la habría visto al alumbrar a las 3:30. No había nada.', '',
          'A las 3:40 ya estaba muerta: Cross la encontró.'][c]);
        // two misses: no more guessing, the two statements that close the window, side by side
        if (misses === perception.beatsHelpAfter(G.state.sanity)) await G.think('Lo que importa son dos horas: cuándo alumbró Thain la calle vacía, y cuándo llegó Cross y la encontró.');
      }
      (G.state.investigation ??= {}).evaluations ??= {};
      G.state.investigation.evaluations.beats = { misses };
      G.clue('ronda');
      await G.think('De 3:30 a 3:40, si las horas son buenas.');
      if (G.second()) await G.think('Yo firmé estas rondas.');
    },

    async endC1(G, who = 'brennan') {
      if (who === 'brennan' && G.actor('Brennan')) {
        const b = G.actor('Brennan');
        b.pose = null; b.facing = 1;
        await G.walk(1360);
        b.talking = true;
        await G.say('Brennan', G.state.flags.brennan_stance === 'suspect' ? 'Si va a decir algo, inspector, dígalo mirándome.' : 'Váyase a dormir, inspector. Tiene cara de no haberlo hecho.');
        b.talking = false;
        await G.think('Un matarife a cien yardas. Un bisturí de mi viejo hospital. Faltan hechos.');
        const w = G.actor('Wren');
        w.talking = true;
        G.flag('v4_wren_not_him', true);
        await G.say('Wren', 'No fue él.');
        w.talking = false;
        await G.say('Ashgrove', '¿Cómo lo sabes?');
        w.talking = true;
        await G.say('Wren', G.two('Anoche seguía aquí. Yo estaba junto al río.', 'Él no huele al Ditch.'));
        w.talking = false;
        w.y = 628; w.walkTo(-100, { speed: 220 });
      } else {
        // closed in Buck's Row: the barrow comes for her, and Pike writes the hour
        G.flag('polly_taken', true);
        const pike = G.actor('Pike');
        if (pike) { pike.facing = -1; pike.talking = true; await G.say('Pike', 'Las cuatro y cincuenta y ocho. Ya está, señor.'); pike.talking = false; }
        await G.think('Un bisturí de mi viejo hospital. Faltan hechos.');
      }
      G.sanity(-5);
      await G.wait(1200);
      await lostTime(G, '4:58', '9:15');
      await G.chapter('c2');
    },

    // ------------------------------------------------------------ chapter 2
    async leaveHanbury(G) {
      await G.walk(200);
      await G.doc(`<h3>27 Fournier Street</h3>
        <p class="hand">Inspector Ashgrove:</p>
        <p class="hand">Los muertos piden hablar con usted. No suelen pedir a nadie por su nombre.</p>
        <p class="hand">Esta noche, a las once. Traiga lo que lleva en el bolsillo.</p>
        <p class="hand" style="text-align:right">— O. Wexley</p>`);
      await G.card('', 'Esa misma noche', 'Fournier Street, Spitalfields', 3000);
      G.objective('Averiguar qué quiere Madame Wexley.');
      await G.goto('seance', { x: 240, facing: 1 });
    },

    async seance(G) {
      const s = G.scene;
      const onTable = G.has('peine');
      if (onTable) { G.take('peine'); G.flag('comb_on_table', true); }
      G.cinema(true);
      await G.walk(560);
      G.face(1);
      G.player.pose = 'sit';
      const w = G.actor('Wexley');
      if (!onTable) {
        // no comb on the cloth: Wexley asks for her, and Thomas gives what Pike wrote down
        w.talking = true;
        await G.say('Madame Wexley', 'No hace falta tocarlo. Descríbamelo.');
        w.talking = false;
        await G.say('Ashgrove', 'Un peine de bolsillo. Dos púas rotas. Estaba apartado de sus otras cosas.');
      }
      w.talking = true;
      await G.say('Madame Wexley', 'Pongan las manos en la mesa. No suelten a nadie.');
      w.talking = false;
      G.audio.setBeds({ room: 0.3, drone: 0.4 }, 4);
      s.lights.forEach((l) => { l.flicker = 0.6; });
      await G.wait(1800);
      w.talking = true;
      await G.say('Madame Wexley', 'Hay una mujer... No. Alguien se ha puesto delante.');
      w.talking = false;
      G.mad(0.35);
      await G.voice('Tommy.', { name: 'Madame Wexley' });
      await G.think('Nat me llamaba Tommy. Nadie más.');
      await G.voice('Dejaste de buscarme, Tommy.', { name: 'Madame Wexley' });
      await G.voice('¿Te acuerdas de lo que dijiste?', { name: 'Madame Wexley' });
      G.clue('nat_voz');
      if (!G.flag('answered1866')) await G.think('Yo no contesté en Limehouse. ¿A qué noche se refiere?');
      G.actor('Joven').talking = true;
      await G.say('Joven', '¿Quién demonios es Tommy?');
      G.actor('Joven').talking = false;
      await G.voice('No hace falta que me busques. Ya te encontré.', { name: 'Madame Wexley' });
      G.mad(0.7);
      G.audio.sting(0.4);
      await G.say('Madame Wexley', '¡No! ¡No me mire a mí! ¡Mire detrás de usted!');
      G.red(0.9); G.shake(16);
      await G.vision('nichols');
      G.flag('candles_out', true); G.flag('mirror_cracked', true);
      s.lights.forEach((l) => { l.off = true; });
      G.audio.thud();
      await G.fade(1, 200);
      // in the dark the table knocks again, the same six groups, louder: this time he knows the word
      for (const [r, c] of RAPS) {
        for (let i = 0; i < r; i++) { G.audio.rap(); await G.wait(window.FAST ? 0 : 140); }
        await G.wait(window.FAST ? 0 : 300);
        for (let i = 0; i < c; i++) { G.audio.rap(); await G.wait(window.FAST ? 0 : 140); }
        await G.wait(window.FAST ? 0 : 600);
      }
      if (G.hasClue('hospes')) await G.think('HOSPES. El que entra en una casa. Y el que lo recibe.');
      await G.wait(1200);
      G.removeActor('Viuda'); G.removeActor('Joven');
      G.player.pose = null;
      G.player.x = 520;
      G.flag('candles_out', false);
      s.lights.forEach((l) => { l.off = false; l.flicker = 0.25; l.intensity = 0.6; });
      G.mad(0);
      await G.fade(0, 1500);
      w.talking = true;
      await G.say('Madame Wexley', 'No voy a volver a abrir la boca con usted aquí.');
      w.talking = false;
      G.clue('alguien_detras');
      G.sanity(-10);
      G.flag('seance_done', true);
      G.cinema(false);
      await G.think('Había alguien detrás de mí. O lo vio Wexley. O quiso que yo lo creyera.');
      G.objective(G.hasClue('hospes') ? 'Salir a Fournier Street.' : 'Leer los golpes de la mesa. En la pared había una tabla de letras.');
    },

    // Before anything begins, the table knocks by itself: Wexley has not started, and does not like it.
    // Thomas writes the knocks down. Reading them is the way into the séance, not a chore after it.
    async tableKnocks(G) {
      G.flag('raps_heard', true);
      const w = G.actor('Wexley');
      G.audio.setBeds({ room: 0.3, drone: 0.25 }, 2);
      for (const [r, c] of RAPS) {
        for (let i = 0; i < r; i++) { G.audio.rap(); await G.wait(170); }
        await G.wait(380);
        for (let i = 0; i < c; i++) { G.audio.rap(); await G.wait(170); }
        await G.wait(700);
      }
      if (w) { w.talking = true; await G.say('Madame Wexley', 'Yo no he empezado. ¿Lo ha oído usted también?'); w.talking = false; }
      await G.think('Seis grupos de golpes, dos a dos. Los apunto.');
      G.objective(G.flag('knock_board') ? 'Leer los golpes con la tabla de letras de la pared (en la mesa).' : 'Leer los golpes. En la pared, bajo la carta astral, hay algo con letras.');
    },

    // the raps, read against the board on the wall: row, then column. Misses make the page say
    // more; after three, Wexley can read the first letters aloud.
    async raps(G) {
      const ev = ((G.state.investigation ??= {}).evaluations ??= {});
      const help = Math.max((ev.raps && ev.raps.misses) || 0, perception.knockHelpStart(G.state.sanity));
      const helper = async () => {
        const w = G.actor('Wexley');
        if (w) { w.talking = true; await G.say('Madame Wexley', 'Fila y columna. Me lo enseñó un preso de Odesa. Hache. O. Ese. Lo demás, léalo usted.'); w.talking = false; }
        ev.raps = { ...(ev.raps || {}), helped: true };
        return 'HOS';
      };
      if (knowsPuzzles(G) && G.flag('knock_board')) {
        const k = await G.choice(['Ya sé lo que dicen: HOSPES.', 'Leerlos otra vez.']);
        if (k === 0) { G.clue('hospes'); G.flag('hospes_decoded', true); G.flag('seance_prepared', true); await hooks.afterRaps(G); return; }
      }
      const res = await G.knocks({ raps: RAPS, answer: 'HOSPES', board: G.flag('knock_board'), rows: ['ABCDE', 'FGHIJ', 'LMNOP', 'QRSTU', 'VWXYZ'], help, helper });
      ev.raps = { ...(ev.raps || {}), misses: help + (res.misses || 0) };
      if (!res.ok) { await G.think(G.flag('knock_board') ? 'Más tarde. Fila y columna; tiene que salir algo.' : 'Sin la tabla de la pared no hay manera de leerlos.'); return; }
      G.clue('hospes');
      G.flag('hospes_decoded', true);
      G.flag('seance_prepared', true);
      G.mad(0.2); G.audio.whisper(1.2, 0.08);
      await G.think('HOSPES. Latín. El huésped.');
      G.mad(0);
      await hooks.afterRaps(G);
    },

    async afterRaps(G) {
      if (G.second()) {
        // the second reading: Wexley understands who the knocks are addressed to
        const w = G.actor('Wexley');
        if (w) { w.talking = true; await G.say('Madame Wexley', 'No le hablan a un muerto, inspector. Le hablan a usted.'); w.talking = false; }
      }
      if (!G.flag('seance_done')) G.objective(G.state.flags.comb_custody === 'pike' ? 'Sentarse a la mesa de la sesión.' : 'Poner el peine de Annie sobre la mesa.');
      else G.objective('Salir a Fournier Street.');
    },

    // chapter one, second reading: Pike's notebook, the nights Thomas arrived and how
    async pikeBook(G) {
      G.flag('pike_book_read', true);
      await G.doc(`<h3>Libreta del sargento A. Pike</h3>
        <p class="hand">7 ago. — Tabram, George Yard. Avisado el inspector a las 3:10. Llega a las 3:20. Botas mojadas.</p>
        <p class="hand">31 ago. — Buck's Row. Avisado a las 4:00. Llega a las 4:12. Botas mojadas. Barro negro.</p>
        <p class="hand">Llega siempre antes de lo que tarda en venir desde Thrawl Street.</p>`);
      await G.think('Doce minutos. Diez. No venía de mi cuarto.');
    },

    async leaveSeance(G) {
      G.audio.door();
      await G.card('', '10 de septiembre', 'Winthrop Street, de noche', 3000);
      G.flag('mob', true);
      await G.goto('knackers', { x: 2000, facing: -1 });
    },

    async mobScene(G) {
      G.date('10 de septiembre de 1888', '21:30');
      G.cinema(true);
      G.audio.setBeds({ crowd: 0.9, wind: 0.2, drone: 0.2 }, 1);
      await G.walk(1900);
      await G.say('Vecinos', '¡Leather Apron! ¡Que salga el matarife!');
      const b = G.actor('Brennan');
      b.talking = true;
      await G.say('Brennan', '¡Pregúntenle a los del turno! ¡He trabajado toda la noche!');
      b.talking = false;
      await G.say('Un hombre', '¡Usted lo ha investigado! ¿Es él o no?');
      // what Thomas does here decides what becomes of Brennan (brennan_outcome), and nothing else:
      // accusing him needs the apron joined to him in the notebook
      const opts = [['Pedir que se disperse la multitud.', 'injured'], ['Ordenar que lo escolten a salvo.', 'protected']];
      if (G.deduced('d_delantal') || G.state.flags.brennan_stance === 'suspect') opts.unshift(['Acusar a Brennan.', 'severe']);
      const outcome = opts[await G.choice(opts.map((o) => o[0]))][1];
      G.state.flags.brennan_outcome = outcome;
      if (outcome === 'severe') {
        G.flag('accused', true);
        await G.say('Ashgrove', 'Queda detenido, Brennan. ¡Retírense!');
        // he knew whose apron it was; the accusation does not become true for that
        if (G.flag('amelia1')) await G.think('El delantal lo lavó la señora Richardson. Era de su hijo. Lo sabía.');
        // the order is lost under the shouting: the crowd gets there first
      } else if (outcome === 'injured') {
        await G.say('Ashgrove', '¡Basta! ¡Nadie aquí puede demostrar nada!');
        G.audio.thud(); G.audio.door(); await G.wait(900);   // a bottle against the stones, a second of silence
      } else {
        await G.say('Ashgrove', '¡Pike! Sáquelo por detrás. Yo los entretengo.');
        await G.say('Pike', 'Vamos, Silas. No se detenga.');
        b.walkTo(b.x - 600, { speed: 170 });
      }
      G.audio.sting(0.2);
      for (const a of G.game.actors) if (a.name.startsWith('Vecino')) a.walkTo(a.x - 700, { speed: 200 });
      for (let i = 0; i < (outcome === 'protected' ? 3 : 6); i++) { G.shake(outcome === 'protected' ? 6 : 10); G.audio.thud(); await G.wait(380); }
      await G.fade(1, 600);
      for (const a of [...G.game.actors]) if (a.name.startsWith('Vecino')) G.removeActor(a.name);
      if (outcome === 'protected') G.removeActor('Brennan');
      else b.pose = outcome === 'severe' ? 'cower' : 'sit';   // on the ground, not getting up / against the wall, an arm hanging
      G.scene.lights.forEach((l) => { if (l.id && l.id.startsWith('torch')) l.off = true; });
      G.audio.setBeds({ wind: 0.3, rain: 0.2, drone: 0.15 }, 2);
      await G.wait(1200);
      await G.fade(0, 1500);
      await G.wait(outcome === 'protected' ? 400 : 1600);
      const w = G.actor('Wren');
      await w.walkTo(1640);
      w.talking = true;
      if (outcome === 'protected') {
        await G.say('Wren', 'Lo ha sacado de ahí. No pensé que un policía lo haría.');
        w.talking = false;
        const r = await G.choice(['Era lo que había que hacer.', '(No decir nada)']);
        G.state.flags.wren_mob_reply = r === 0 ? 'duty' : 'silent';
      } else {
        await G.say('Wren', outcome === 'severe' ? 'Usted sabía que no tenía nada contra él.' : 'Lo dijo tarde. Ya le habían dado.');
        w.talking = false;
        const r = await G.choice([outcome === 'severe' ? 'Lo sospechaba.' : 'No me dejaron.', '(No decir nada)']);
        G.state.flags.wren_mob_reply = r === 0 ? 'excuse' : 'silent';
        if (r === 0) { w.talking = true; await G.say('Wren', outcome === 'severe' ? 'Sospechar no es saber, señor.' : 'Ya.'); w.talking = false; }
      }
      w.walkTo(2300, { speed: 200 });
      await G.wait(1000);
      await G.fade(1, 1200);
      await G.card('', '', 'Esos días detuvieron a John Pizer, a quien el barrio llamaba «Leather Apron». Tenía coartada y lo soltaron.', 4600);
      await G.card('', '', outcome === 'protected' ? 'Brennan regresó a su trabajo. Nunca volvió a hablar con la policía.' : 'Brennan no volvió al desolladero.', 3200);
      G.cinema(false);
      await G.chapter('c3');
    },

    // ------------------------------------------------------------ chapter 3
    async writeC3a(G) {
      G.player.x = 1180; G.face(1);
      G.player.pose = 'sit';
      G.audio.pen();
      await G.wait(900);
      G.audio.pen();
      G.mad(0.4);
      if (G.second()) await G.voice('Escribe, Tommy. Con la otra tinta.');
      else { G.audio.whisper(0.8, 0.05); G.shake(2); }   // the candle flame lies down toward the window: no one explains the draught
      G.audio.pen();
      await lostTime(G, '23:41', '3:15', { date: '25 de septiembre de 1888' });
      G.flag('tinta_vacia', true);
      G.flag('woke_c3', true);
      G.mad(0);
      G.audio.setBeds({ rain: 0.2, room: 0.4 }, 2);
      await G.fade(0, 1500);
      G.clue('dedos');
      await G.think(G.two('Faltan tres pliegos de papel.', 'Faltan tres pliegos. Los usé yo.'));
      G.sanity(-8);
      G.player.pose = null;
      G.objective('Acostarse.');
    },

    async sleepC3a(G) {
      G.player.pose = null;
      await G.fade(1, 1500);
      await G.card('', '', 'Los días siguientes apenas duermo.', 2600);
      await G.card('', '30 de septiembre', '1:46 de la madrugada', 3200);
      G.objective('Entrar en Mitre Square.');
      await G.goto('mitre', { x: 200, facing: 1 });
    },

    async toGoulston(G) {
      await G.fade(1, 700);
      G.date(null, '2:55');
      G.objective('Buscar el trozo de delantal.');
      await G.goto('goulston', { x: 160, facing: 1 });
    },

    async caught(G) {
      const long = G.addActor(new Actor('Long', { x: G.player.x - 520, y: G.scene.groundY, h: 212, hat: 'helmet', coat: '#161c30', trousers: '#12151f', coatLen: 0.8, flare: 1.02, belt: true, number: true, facing: 1, lantern: true, lanternOn: true, moustache: '#3a2a1e' }));
      await long.walkTo(G.player.x - 260);
      G.face(-1);
      long.talking = true;
      await G.say('Agente Long', '¡Eh! ¡Usted! ¡Quieto ahí!');
      long.talking = false;
      G.player.pose = 'reach';
      const c = await G.choice(['"¡Soy inspector de la División H!"', '(Correr)']);
      if (c === 0) {
        await G.say('Ashgrove', '¡Soy inspector de la Div...!');
        long.talking = true;
        await G.say('Agente Long', 'Abrigo oscuro, bombín y linterna de policía... ¡Es él! ¡ES ÉL!');
        long.talking = false;
      }
      G.player.pose = null;
      G.audio.whistle(0.2);
      G.shake(8);
      G.face(1);
      await G.walk(1500, { speed: 280 });
      await G.goto('alleys', { x: 160, facing: 1, fade: true });
    },

    async endChase(G) {
      await G.voice('Bien, Tommy.');
      // what the run cost: nothing, a face seen, or a hand opened on a wall (chase_outcome)
      const outcome = G.state.flags.chase_outcome || 'clean';
      if (outcome === 'injured') { G.red(0.7); G.audio.thud(); G.clue('chase_blood'); await G.think('Me he abierto la mano en la tapia de Wentworth Street. No sé cuándo.'); }
      else if (outcome === 'spotted') { G.audio.whistle(0.12, true); await G.think('El agente de la linterna me vio la cara. Un momento. Bastó.'); }
      else await G.think('Nadie me vio. Aún.');
      G.player.speed = 150;
      await lostTime(G, '3:20', '8:05', { date: '1 de octubre de 1888' });
      G.flag('room_phase', 'c3b');
      await G.goto('room', { x: 700, facing: -1, fade: false });
      await G.fade(0, 1500);
      G.objective('Leer el periódico. Mirar debajo de la cama.');
    },

    async readPaper(G) {
      G.player.pose = 'kneel';
      await G.wait(300);
      G.player.pose = null;
      await G.doc(`<h3>THE DAILY NEWS — 1 de octubre de 1888</h3>
        <p class="small">LOS CRÍMENES DEL EAST END. LA CARTA FIRMADA «JACK THE RIPPER».</p>
        <p>Una carta fechada el 25 de septiembre, matasellada y recibida por la Central News Agency el 27, circula ahora entre los investigadores y la prensa. Escrita con <b>tinta roja</b>, menciona al «Leather Apron» y reivindica los crímenes:</p>
        <p class="red">"I keep on hearing the police have caught me but they wont fix me just yet... That joke about Leather Apron gave me real fits..."</p>
        <p class="red" style="text-align:right">Yours truly<br>Jack the Ripper</p>
        ${{ spotted: '<p class="small">Un agente persiguió de madrugada a un hombre de abrigo oscuro por ' + chaseStreet(G.state.flags) + '. Asegura que podría reconocerlo.</p>',
          injured: '<p class="small">Un agente persiguió de madrugada a un hombre de abrigo oscuro por ' + chaseStreet(G.state.flags) + '. El fugitivo dejó sangre en una tapia; el agente asegura que podría reconocerlo.</p>' }[G.state.flags.chase_outcome] || ''}`);
      G.flag('paper_read', true);
      G.clue('carta');
      hooks.c3bObjective(G);
      await G.think(G.two('Fechada el 25. La noche que perdí.', 'Fechada el 25. Faltaban tres pliegos en mi mesa.'));
      if (!G.second()) await G.think('Puede que la haya inventado un periodista. Una carta así vende periódicos.');
      G.audio.whisper(2, 0.14);
      if (G.second()) await G.voice('Jack.');
      await G.think('Esa letra la he visto antes. En el escritorio tengo letras de todos.');
      G.sanity(-6);
      const bo = G.state.flags.brennan_outcome;
      if (bo === 'severe') await G.think('Brennan sigue sin poder trabajar. No he rectificado la acusación.');
      else if (bo === 'injured') await G.think('Brennan perdió su trabajo. Nadie lo ha rectificado. Yo tampoco.');
    },

    // what the room still asks before Thomas goes out on the 1st of October
    c3bObjective(G) {
      const left = [!G.hasClue('letra') && 'comparar la letra de la carta con las del escritorio', !G.hasClue('estuche') && 'mirar debajo de la cama'].filter(Boolean);
      G.objective(left.length ? `${left.join('; ')}.`.replace(/^./, (m) => m.toUpperCase()) : 'Salir.');
    },

    // the letter's hand against every hand on the desk: the tail of the J and the short cross of the t.
    // A likeness, not an identification: the file at Greaves's surgery is what settles it.
    async compareHands(G) {
      const hands = () => G.doc(`<h3>Copia de la carta que circula entre los inspectores y cuatro escrituras</h3>
        <p class="small">La copia de la carta, sin la letra del original:</p>
        <p class="red">"Dear Boss... Yours truly, Jack the Ripper"</p>
        <p class="small">La nota de Madame Wexley:</p><p class="hand">Mano redondeada y espaciada. "Los muertos piden hablar con usted..."</p>
        <p class="small">Un informe del sargento Pike, con mis correcciones en rojo:</p><p class="hand">Letra cerrada y recta. "Ronda sin novedad. Las farolas de Buck's Row siguen sin gas..."</p>
        <p class="small">La receta del láudano, del doctor Greaves:</p><p class="hand">Letras unidas, la J con una cola larga, el remate de las t muy corto. "Tinctura opii. Veinte gotas al acostarse. — L. G."</p>
        <p class="small">El recibo del desolladero de Barber, de Silas Brennan:</p><p class="hand">"X — su marca"</p>
        ${G.two('', '<p class="small">Mis apuntes de anatomía, cuarto curso, 1878:</p><p class="hand">La misma J, las mismas t. "Carótida: corre junto a la tráquea..."</p>')}`);
      await hands();
      await G.think('Esa J. Esas t. Las conozco.');
      // a likeness is not an identification: saying so is an answer too, and it is enough to go on
      const names = ['Madame Wexley.', 'Pike.', 'Greaves: se parece a la suya.', 'Brennan.', ...(G.second() ? ['La mía.'] : []), 'La muestra no basta. Necesito más pruebas.', 'Revisar las muestras.'];
      let assessment;
      for (;;) {
        const pick = names[await G.choice(names)];
        if (pick === 'Revisar las muestras.') { await hands(); continue; }
        if (pick.startsWith('Greaves')) { await G.think('Es una escritura parecida. No es una identificación.'); assessment = 'greaves_like'; break; }
        if (pick === 'La mía.') { await G.think('Es mi propia letra. Copié a Greaves años atrás.'); assessment = 'self_recognition'; break; }
        if (pick.startsWith('La muestra')) { await G.think('Una copia y cuatro letras de mi mesa. Con esto no se acusa a nadie.'); assessment = 'inconclusive'; break; }
        await G.think({ 'Madame Wexley.': 'No coincide con Wexley.',
          'Pike.': 'No coincide con Pike. Sus notas sí llevan mis correcciones.',
          'Brennan.': 'Brennan firmó con una cruz. No hay muestra suficiente.' }[pick]);
      }
      G.state.flags.handwriting_assessment = assessment;
      if (assessment === 'inconclusive') G.flag('hand_inconclusive', true);
      G.clue('letra');
      hooks.c3bObjective(G);
    },

    async leaveRoomC3b(G) {
      if (!G.hasClue('letra')) { await G.think('Necesito comparar la carta antes de salir.'); return; }
      if (!G.hasClue('estuche')) { await G.think('El estuche bajo la cama. Falta una pieza.'); return; }
      await G.fade(1, 1200);
      await G.chapter('c4');
    },

    // ------------------------------------------------------------ chapter 4
    async readFile(G) {
      await G.doc(`<h3>LONDON HOSPITAL — EXPEDIENTE CLÍNICO</h3>
        <p class="small">Paciente: T. A., estudiante de cuarto año. 14 de marzo de 1879. Dr. L. Greaves.</p>
        <p class="hand">Hallado a las cuatro de la mañana en la sala de disección, con un bisturí en la mano izquierda. Ausencia de recuerdos sobre su llegada. El cadáver de la mesa 3 presenta incisiones ajenas al programa de prácticas.</p>
        <p class="hand">La enfermera M. Bell declaró que, esa noche, junto al lavadero, oyó al estudiante responder claramente: <b>«Aquí estoy»</b>. El paciente recuerda haber oído agua y niega haber hablado con nadie.</p>
        <p class="hand">Su hermano menor falleció en Limehouse en 1866; el paciente tenía doce años. Impresión clínica: episodios de amnesia y desorientación; vigilar recurrencias.</p>
        <p class="small" style="text-align:right">Anotación agregada, 1888: <i>El cuadro se asemeja a las descripciones posteriores de fuga disociativa (Tissié, 1887). El 1 de septiembre, el sargento Pike preguntó si era posible actuar durante una laguna de memoria. Respondí que sí.</i></p>`);
      G.flag('file_read', true);
      G.clue('expediente');
      G.clue('respuesta1879');
      G.sanity(-10);
      await G.think('«T. A.» No puedo seguir llamándolo una coincidencia.');
      await G.think(G.flag('answered1866') ? 'En 1866 ya me oyó el agua. Esto volvió a ocurrir.' : 'En 1866 callé. En el hospital no.');
      G.audio.door();
      G.cinema(true);
      const gr = G.addActor(new Actor('Greaves', { x: 120, y: G.scene.groundY, h: 214, hat: 'top', coat: '#1d1b1c', coatLen: 0.95, cane: true, beard: '#7a7a74', hair: '#8a8a84', facing: 1, flare: 1.05, tails: true, chain: true, waistcoat: '#3a2a20', buttons: 'double' }));
      G.face(-1);
      await gr.walkTo(G.player.x - 260);
      gr.talking = true;
      await G.say('Greaves', 'La encontraste.');
      const hand = G.state.flags.handwriting_assessment;
      if (hand === 'greaves_like') await G.say('Greaves', 'Pensaste que la carta era mía. Te enseñé a escribir así; no a firmar eso.');
      else if (hand === 'inconclusive') await G.say('Greaves', 'No acusaste a nadie por una letra. Siempre fuiste prudente con las pruebas. Con las tuyas también.');
      else if (hand === 'self_recognition') await G.say('Greaves', 'Reconociste tu letra. Yo la reconocí en marzo de 1879.');
      if (G.state.flags.chase_outcome === 'injured') await G.say('Greaves', 'Y esa mano. ¿Quién te la ha cosido?');
      if (perception.othersNotice(G.state.sanity)) await G.say('Greaves', 'No duermes. Se te ve en los ojos, Thomas.');
      await G.say('Greaves', 'Aquel día te hallé en la sala. No sé lo que ocurrió antes.');
      await G.say('Greaves', 'Pike vino a preguntarme si alguien puede actuar sin recordarlo. Le respondí que sí.');
      gr.talking = false;
      const c = await G.choice(['Me está acusando a mí.', '¿Y si tiene razón?', '¿Le habló usted de Nat a Wexley?']);
      gr.talking = true;
      if (c === 0) await G.say('Greaves', 'No estoy acusándote. Te estoy pidiendo que te entregues.');
      else if (c === 1) await G.say('Greaves', 'Entonces dame el bisturí.');
      else await G.say('Greaves', 'No la conozco. Siempre has hablado dormido, Thomas.');
      await G.say('Greaves', 'Deja el bisturí sobre la mesa. Lentamente.');
      gr.talking = false;
      await gr.walkTo(G.player.x - 110);
      gr.pose = 'reach';
      G.audio.sting(0.45);
      G.red(1); G.shake(18);
      // the cut happens in the lost seconds: we see him holding the blade, Greaves holding it by the edge
      await G.vision('hands');
      await G.fade(1, 120);
      G.audio.thud();
      await G.wait(1600);
      gr.pose = 'cower'; gr.x = G.player.x - 300; gr.facing = 1;
      G.player.pose = 'reach';
      await G.fade(0, 700);
      gr.talking = true;
      await G.say('Greaves', 'Thomas... mírame. Por favor.');
      gr.talking = false;
      G.player.pose = null;
      G.sanity(-15);
      // Pike, at the door: a human voice, breathing on the other side. He confronts Thomas; he does
      // not solve it for him. The last thing Thomas does here changes one line of the epilogue.
      G.audio.whistle(0.1, true);
      await G.wait(900);
      await G.say('Pike', 'Thomas. Soy Pike. No voy a entrar sin avisarte.');
      await G.wait(700);
      await G.say('Pike', { clean: 'Nadie te vio esta noche. Eso es lo que más me asusta.',
        spotted: 'El agente Long dice que te vio la cara en ' + chaseStreet(G.state.flags) + '. No le he contestado.',
        injured: 'Long encontró sangre en una tapia de ' + chaseStreet(G.state.flags) + '. Y tú llevas la mano cosida.' }[G.state.flags.chase_outcome || 'clean']);
      await G.say('Pike', 'Traigo tus rondas. Tu firma. No sé aún cuánto hiciste, pero no puedo dejarte marchar.');
      const last = await G.choice(['«Deténgame, Pike».', '«Proteja a Wren. La niña del río».', '(Romper el folio del expediente que me señala)']);
      if (last === 0) {
        // he lets Pike in, and the arrest begins: one cuff closes before the gap
        G.state.flags.final_intent = 'surrender';
        await G.say('Ashgrove', 'Póngame las esposas antes de que cambie de opinión.');
        await G.say('Pike', 'De acuerdo. Déjame pasar.');
        G.audio.door();
        const pike = G.addActor(new Actor('Pike', { x: 110, y: G.scene.groundY, h: 200, hat: 'bowler', coat: '#2c2a26', coatLen: 0.9, cape: true, facing: 1, build: 1.05, moustache: '#3a2a1e', buttons: 'double', hair: '#3a2a1e' }));
        await pike.walkTo(G.player.x - 120);
        pike.talking = true; await G.say('Pike', 'Las manos, Thomas.'); pike.talking = false;
        G.player.pose = 'reach';
        await G.wait(500);
        G.audio.latch();   // the first cuff closes
        G.state.flags.pike_cuff = true;
        await G.wait(900);
      } else if (last === 1) {
        // a concrete place, and Pike repeats it back: the warning is received
        G.state.flags.final_intent = 'warn_wren';
        await G.say('Ashgrove', 'Hay una niña. Wren. Duerme en las cajas del desolladero de Barber. Que no vuelva al Ditch.');
        await G.say('Pike', 'Barber, Winthrop Street. Esta noche. Tienes mi palabra.');
        G.state.flags.wren_warned = true;
      } else {
        // the folio that names T. A. is torn in two; each half keeps part of the same signature
        G.state.flags.final_intent = 'destroy_page';
        G.audio.paper(); await G.wait(250); G.audio.paper();
        G.state.flags.file_torn = true;
        await G.say('Pike', 'Romperlo no cambia lo que sabemos. La enfermera Bell sigue viva, Thomas.');
      }
      // whatever he chose, the time goes: the clock jumps, and he comes to by the water
      await lostTime(G, '22:51', '2:30', { date: '9 de noviembre de 1888' });
      await G.card('', '9 de noviembre', 'Limehouse, 2:30 de la madrugada', 3400);
      G.flag('fs_1888', true);
      G.cinema(false);
      // he comes down the stone stair from Narrow Street onto the foreshore
      await G.goto('foreshore', { x: 30, facing: 1, fade: false });
      G.player.y = G.scene.groundY - 282;
      G.game.camFocus = 400;
      G.fade(0, 2000);
      await G.stairs(176, G.scene.groundY, { steps: 10, speed: 80 });
      G.game.camFocus = null;
      await G.walk(440);
      await hooks.finaleIntro(G);
    },

    async finaleIntro(G) {
      G.audio.whistle(0.06, true);   // whistles behind the tide; he stops where he left the boat
      await G.wait(900);
      const tried = { surrender: 'Llevo una esposa cerrada en la muñeca derecha. La otra cuelga abierta.',
        warn_wren: 'Se lo dije a Pike: Barber, las cajas. Eso lo recuerdo.',
        destroy_page: 'Tengo entre los dedos un trozo de papel con la mitad de una firma.' }[G.state.flags.final_intent];
      if (tried) await G.think(tried);
      await G.think(G.flag('answered1866') ? 'Yo abrí la puerta.' : 'Callé aquella noche. No la siguiente.');
      await G.think('Greaves, Pike, el bisturí, la carta. Un mismo hombre.');
      G.flag('awake', true);
      G.shake(4);
      G.clue('ficha');
      await G.think('Es mi ficha. Encaja demasiado bien.');
      G.objective('En el cuaderno: comparar mi ficha con al menos tres pruebas independientes. Una hipótesis sin prueba no cuenta.');
    },

    finaleReady(G) { return canEnterFinale(G.state).ok; },

    async outfall1888(G) {
      G.flag('ditch_glow', true);
      if (!canEnterFinale(G.state).ok) { await G.think('Todavía no. Antes tengo que estar seguro. El cuaderno.'); return; }
      G.zoom(1.22, G.player.x, G.scene.groundY - G.player.h * 0.7, 0.35);
      await G.voice('Ven al agua, Tommy.');
    },

    async finaleWater(G) {
      if (!canEnterFinale(G.state).ok) { await G.think('Primero comprobaré lo que sé. No voy a contestar a ciegas.'); return; }
      G.flag('ditch_glow', true); G.flag('water_light', true);
      G.cinema(true);
      G.audio.setBeds({ river: 0.5, drone: 0.7, heart: 0.5 }, 4);
      G.mad(0.45);
      if (!G.flag('water_before')) {
        G.flag('water_before', true);
        if (G.flag('sospecha_pike') || G.flag('sospecha_greaves') || G.flag('accused')) await G.think('Brennan, Greaves, Pike. A todos los puse delante de mí.');
        await G.think('Mi letra. Mis rondas. Mi bisturí.');
      }
      await G.voice('Thomas.');
      // whatever he does, it is already inside (since 1866, or since 1879): no choice here lets it
      // in, and none keeps it out. What changes is how he meets it.
      const att = ['answer', 'silent', 'hand', 'unsure'][await G.choice(['Responder.', 'Callar.', 'Taparme la boca.', 'Todavía no estoy seguro.'])];
      G.state.flags.water_reply_intent = att;
      if (att === 'unsure') {
        // he steps back from the edge: the notebook is still open to him
        G.player.pose = null; G.mad(0.2);
        G.audio.setBeds({ river: 0.4, drone: 0.4 }, 2);
        G.cinema(false);
        await G.think('No. Otra vez el cuaderno. Quiero estar seguro.');
        return;
      }
      G.state.flags.water_resistance = att !== 'answer';
      if (att === 'answer') {
        // tired, kneeling first: he says it himself
        G.player.pose = 'kneel';
        await G.wait(1200);
        if (G.flag('answered1866')) await G.think('Ya lo dije una vez.');
        await G.say('Ashgrove', 'Aquí estoy.');
        G.audio.sting(0.2);
      } else if (att === 'silent') {
        // he really does keep quiet, for long seconds; then his mouth says it without him
        G.player.pose = 'clutch';
        for (let i = 0; i < 3; i++) { G.audio.heartbeat(1); await G.wait(1100); }
        G.mad(0.75); G.flash(0.6);
        await G.say('Ashgrove', 'Aquí estoy.');
        await G.think('No lo he dicho yo.');
      } else {
        // the hand over the mouth; the words come out between the fingers
        G.player.pose = 'clutch';
        G.audio.heartbeat(1.2); G.shake(5);
        await G.wait(1800);
        G.mad(0.75);
        await G.say('Ashgrove', '(Entre los dedos) Aquí estoy.');
        await G.think('La mano no baja. No es mía.');
      }
      G.player.pose = 'kneel';
      G.scene.reflection = true;       // he kneels; the man in the water stays standing
      G.audio.sting(0.3);
      await G.wait(1400);
      await G.voice('Escucha.');
      // "Jack": a newsboy, a quarrel far off, Pike dictating a report. The thing makes no speech
      G.audio.setBeds({ river: 0.4, drone: 0.7, crowd: 0.5 }, 3);
      for (let i = 0; i < 4; i++) { G.audio.whisper(1.6, 0.1 + i * 0.03); await G.wait(1300); }
      await G.think('El mío ya no viene cuando lo llamo.');
      await G.vision('hands');
      await G.voice('¿Cómo te llamabas?');
      G.player.lanternOn = false; G.audio.thud();
      G.player.pose = 'clutch';
      await G.wait(700);
      await G.think('Thomas...');
      G.red(1); G.audio.sting(0.5);
      await G.fade(1, 1600);
      G.zoom(1);
      G.scene.reflection = false;
      G.player.pose = null;
      G.mad(0);
      G.audio.setBeds({}, 2);
      await G.wait(1600);
      G.date('9 de noviembre de 1888', '3:48');
      await G.goto('millers', { x: 160, facing: 1, fade: false });
    },

    async epilogue(G) {
      G.hud(false);
      G.desat(0.35);
      G.mad(0.35);
      await G.fade(0, 2500);
      await G.walk(820, { speed: 90 });
      const w = G.actor('Wren');
      const intent = G.state.flags.final_intent;
      // warned by Pike, she keeps her distance and holds his whistle
      await w.walkTo(intent === 'warn_wren' ? 1520 : 1240);
      G.face(1);
      w.talking = true;
      await G.say('Wren', '¡Señor! Lo busca la policía. Y los hombres que no son policía.');
      if (intent === 'warn_wren') await G.say('Wren', 'Pike vino a las cajas a buscarme. Me dio su silbato. Dijo que lo tocara si usted se acercaba.');
      else if (intent === 'surrender') await G.say('Wren', 'Lleva una esposa puesta. Pike va por ahí con la otra, abierta, colgando del cinturón.');
      else if (intent === 'destroy_page') await G.say('Wren', 'Lleva un papel roto en la manga. Pike tiene la otra mitad.');
      if (G.flag('wren_paid')) await G.say('Wren', 'Su penique. Se ha puesto frío. No lo quiero.');
      await G.say('Wren', 'Dígame su nombre, señor. El que le puso su madre.');
      w.talking = false;
      G.game.ui.hideDialogue();
      G.zoom(1.2, (G.player.x + w.x) / 2, G.scene.groundY - G.player.h * 0.65, 0.3);
      // the signature page from the start of the game: he writes what the player writes, and the hand
      // finishes the strokes into four letters
      await G.nameEntry('¿Cómo se llama usted?', 'Jack', G.state.flags.signature || 'Thomas Ashgrove');
      G.audio.sting(0.3);
      w.talking = true;
      // her last line answers what he did, and how much of him is left to hear it
      const lead = perceptionBand(G.state.sanity) === 'frayed' ? 'No era este. Antes tenía otro.' : 'Era Thomas.';
      const what = { surrender: 'Usted quiso que lo detuvieran. Acuérdese de eso.',
        warn_wren: 'Usted le dijo a Pike dónde dormía yo. Por eso no me acerco.',
        destroy_page: 'Romper papeles no cambia los nombres, señor.' }[intent] || 'Puede acordarse.';
      const last = `${lead} ${what}`;
      await G.say('Wren', last);
      w.talking = false;
      w.walkTo(2100, { speed: 240 });
      G.zoom(1);
      await G.wait(1200);
      G.face(1);
      const court = G.light('court');
      if (court) { court.intensity = 0.55; court.haloK = 0.5; }
      G.audio.whisper(2.4, 0.05);      // far off, a woman singing in Miller's Court
      await G.wait(1800);
      await G.walk(1065, { speed: 80 });
      for (let i = 0; i < 30; i++) { G.player.alpha = 1 - i / 30; await G.wait(60); }
      G.player.visible = false; G.player.alpha = 1;
      await G.wait(1500);
      await G.fade(1, 3000);
      G.audio.setBeds({}, 3);
      await G.wait(1200);
      G.desat(0); G.mad(0);
      await G.card('', 'Yours truly, Jack the Ripper', "Don't mind me giving the trade name.", 6000);
      await G.card('', '', 'El 9 de noviembre de 1888, Mary Jane Kelly fue asesinada en Miller\'s Court. Tenía unos veinticinco años. Esa noche, una vecina la oyó cantar. Fue la última de las cinco víctimas canónicas; la identidad del asesino no quedó establecida.', 7000);
      const brennan = G.state.flags.brennan_outcome || (G.flag('accused') ? 'severe' : 'injured');
      await G.card('', '', {
        severe: 'Silas Brennan no volvió a andar sin bastón. Nadie le pidió perdón.',
        injured: 'Brennan sobrevivió a la turba, pero perdió su trabajo. Nadie rectificó la acusación.',
        protected: 'Brennan sobrevivió sin heridas aquella noche. No volvió a hablar con Thomas.',
      }[brennan], 4600);
      if (intent === 'destroy_page') await G.card('', '', 'El expediente de 1879 se archivó con un folio roto. La enfermera Bell volvió a declarar.', 4600);
      else if (intent === 'surrender') await G.card('', '', 'El sargento Pike guardó la esposa abierta en un cajón de la comisaría de Commercial Street.', 4600);
      else if (intent === 'warn_wren') await G.card('', '', 'Wren no volvió a dormir junto al Ditch.', 4600);
      await G.card('', '', 'Nadie volvió a ver al inspector Thomas Ashgrove. El Black Ditch sigue corriendo bajo el East End.', 5200);
      await G.card('', 'El Huésped', 'Fin', 5200);
      G.cinema(false);
      G.game.finish();
    },
  };

  return { chapters, hooks };
}
