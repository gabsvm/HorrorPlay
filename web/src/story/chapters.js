// Chapter flow and every scripted sequence that spans scenes.
import { Actor } from '../engine/actor.js';

const LOOKS = {
  child: { hat: 'cap', coat: '#3a342c', coatLen: 0.62, flare: 1.05, build: 0.9, speed: 120, lantern: false, collarUp: false, patches: true, scarf: '#5a2a22', sideburns: false, hair: '#2a1e16', gloves: null, stubble: null },
  adult: { hat: 'bowler', coat: '#23262b', coatLen: 0.88, flare: 1.2, build: 1, speed: 150, lantern: true, collarUp: true, patches: false, scarf: null, sideburns: true, hair: '#1a1410', trousers: '#1a1b1e', gloves: '#2a221c', scarf: '#4a1612', stubble: 'rgba(30,22,18,0.35)' },
};
function look(G, k) { Object.assign(G.player, LOOKS[k]); }

const finals = (G) => G.state.deductions.filter((d) => d.startsWith('f_')).length;

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

export function makeChapters() {
  const chapters = {
    async prologue(G) {
      G.hud(false);
      G.flag('fs_1888', false);
      look(G, 'child');
      G.game.r.fx.fade = 1;
      await G.card('', 'Limehouse', 'Octubre de 1866', 3600);
      await G.goto('foreshore', { x: 480, facing: 1, fade: false });
      await G.fade(0, 2500);
      await G.narrate('Hacía tres semanas que el río se había llevado a Nat.');
      await G.narrate('Desde entonces bajaba cada tarde con la marea baja a buscarlo. Mamá decía que ya no iba a volver, pero yo bajaba igual.');
      await G.narrate('Nat se pasaba las tardes junto al embarcadero, con el barquito que papá le hizo con una caja de puros.');
      await G.think('Hoy encontraré algo suyo. Lo sé.');
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
      await G.think('Estoy en camisa y tengo los pantalones mojados hasta las rodillas. Me he dormido vestido otra vez.');
      G.objective('Coger el abrigo, las botas y la linterna, y salir hacia Buck\'s Row.');
    },

    async c2(G) {
      look(G, 'adult');
      G.sanity(+20);
      G.hud(true);
      G.game.r.fx.fade = 1;
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
      await G.card('Capítulo III', 'Tinta roja', 'Thrawl Street, 27 de septiembre de 1888', 4200);
      G.date('27 de septiembre de 1888', '23:40');
      await G.goto('room', { x: 1000, facing: 1, fade: false });
      await G.fade(0, 1500);
      await G.think('Tengo informes atrasados de tres semanas. Esta noche no salgo: escribo y me acuesto.');
      G.objective('Terminar los informes en el escritorio.');
    },

    async c4(G) {
      look(G, 'adult');
      G.sanity(+10);
      G.hud(true);
      G.game.r.fx.fade = 1;
      await G.card('', 'Octubre', 'No hay crímenes en todo el mes.', 3400);
      await G.card('', '', 'Duermo de día. De noche camino. Pike ya no me saluda.', 3400);
      await G.card('Capítulo IV', 'Huésped', 'London Hospital, 8 de noviembre de 1888', 4200);
      G.objective('Encontrar lo que Greaves sabe de mí: el cajón, la vitrina.');
      await G.goto('greaves', { x: 230, facing: 1, fade: false });
      await G.fade(0, 1500);
    },
  };

  const hooks = {
    // ------------------------------------------------------------ prologue
    async prologueBoat(G) {
      G.player.pose = 'kneel';
      await G.think('El barco de Nat, el que papá le hizo con una caja de puros. Tiene la vela rota.');
      G.player.pose = null;
      G.flag('boat', true);
      G.flag('water_light', true);
      G.objective('Acercarse al río.');
      G.audio.sting(0.1);
      await G.think('Allí, en el río, brilla algo verde, como un farol hundido.');
    },

    async prologueWater(G) {
      if (!G.flag('boat')) { await G.think('El agua está quieta. Demasiado quieta para ser el Támesis.'); await G.think('Primero el barquito. Tiene que estar en el barro, entre los pilotes del embarcadero.'); return; }
      G.cinema(true);
      G.audio.setBeds({ river: 0.4, drone: 0.4 }, 3);
      G.mad(0.3);
      await G.voice('Thomas.');
      await G.think('...¿Nat?');
      await G.voice('Tommy. Estoy aquí abajo. Tengo frío.');
      const c = await G.choice(['Responder.', 'No responder.']);
      if (c === 1) {
        await G.think('Mamá dice que los ahogados no hablan. Que si alguna vez el agua me llama, no conteste.');
        await G.voice('Tommy, por favor. Solo dime que estás ahí.');
        await G.choice(['No responder.', 'No responder.']);
      }
      G.mad(0.6);
      await G.say('Thomas', 'Aquí estoy.');
      await G.voice('Ya lo sé.');
      G.flash(1); G.audio.sting(0.35); G.shake(12);
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
      await G.think('Es un bisturí con mango de ébano, y en la virola pone LONDON HOSPITAL.');
      await G.think('Wren lo sacó de la rejilla de Buck\'s Row, a dos pasos de donde estaba Polly.');
      const w = G.actor('Wren');
      w.talking = true;
      await G.say('Wren', '¿Sabe lo que dicen en el río, señor? Si el agua dice su nombre, no conteste.');
      w.talking = false;
      const c = await G.choice(['¿Por qué me dices eso?', 'Son cuentos de ribereños.']);
      w.talking = true;
      if (c === 0) await G.say('Wren', 'Porque a usted ya le ha hablado. Se le nota.');
      else await G.say('Wren', 'Usted sabrá. Pero no conteste.');
      w.talking = false;
      G.clue('regla');
      G.sanity(-5);
      hooks.c1Objective(G);
      await G.think('Brennan es zurdo. El bisturí es del hospital. En el cuaderno tengo que relacionarlo con lo que dijo Llewellyn.');
    },

    // what the player still needs to close chapter one
    c1Objective(G) {
      if (!G.hasClue('brennan_zurdo')) G.objective('Fijarse en cómo trabaja Brennan. Luego, en el cuaderno, relacionarlo con lo que dijo el forense.');
      else if (!G.deduced('d_brennan') || !G.deduced('d_bisturi')) G.objective('En el cuaderno: relacionar a Brennan y el bisturí con lo que dijo el forense.');
    },

    async endC1(G) {
      const b = G.actor('Brennan');
      b.pose = null; b.facing = 1;
      await G.walk(1360);
      b.talking = true;
      await G.say('Brennan', '¿Qué mira, inspector?');
      b.talking = false;
      await G.think('Un zurdo con cuchillo, a cien yardas de Buck\'s Row. O alguien del hospital que perdió su bisturí. Uno de los dos.');
      const w = G.actor('Wren');
      w.talking = true;
      await G.say('Wren', 'No fue él, señor.');
      w.talking = false;
      await G.say('Ashgrove', '¿Cómo lo sabes?');
      w.talking = true;
      await G.say('Wren', 'Porque él no huele al Ditch.');
      w.talking = false;
      w.y = 628; w.walkTo(-100, { speed: 220 });
      G.sanity(-5);
      await G.wait(1200);
      await lostTime(G, '4:58', '9:15');
      await G.narrate('Me despierto en mi cuarto, vestido y con la linterna todavía caliente en la mano.');
      await G.chapter('c2');
    },

    // ------------------------------------------------------------ chapter 2
    async leaveHanbury(G) {
      await G.walk(200);
      await G.narrate('En el pasaje, un chico me pone un sobre en la mano y sale corriendo.');
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
      G.take('peine');
      G.flag('comb_on_table', true);
      G.cinema(true);
      await G.walk(560);
      G.face(1);
      G.player.pose = 'sit';
      const w = G.actor('Wexley');
      w.talking = true;
      await G.say('Madame Wexley', 'Las manos sobre la mesa, todos. Pase lo que pase, no suelten a nadie.');
      w.talking = false;
      G.audio.setBeds({ room: 0.3, drone: 0.4 }, 4);
      s.lights.forEach((l) => { l.flicker = 0.6; });
      await G.wait(1800);
      w.talking = true;
      await G.say('Madame Wexley', 'Hay alguien... Hay una mujer. No. Se aparta. Hay otro que la aparta.');
      w.talking = false;
      G.mad(0.35);
      await G.voice('Tommy.', { name: 'Madame Wexley' });
      await G.think('Nadie me llama así desde 1866.');
      await G.voice('El agua estaba fría, Tommy. Me buscaste tres semanas. Luego te llamé y contestaste.', { name: 'Madame Wexley' });
      await G.voice('Dijiste: aquí estoy. ¿Te acuerdas?', { name: 'Madame Wexley' });
      G.clue('nat_voz');
      G.actor('Joven').talking = true;
      await G.say('Joven', '¿Quién demonios es Tommy?');
      G.actor('Joven').talking = false;
      await G.voice('Ya no tienes que buscarme. Te encontré yo a ti.', { name: 'Madame Wexley' });
      G.mad(0.7);
      G.audio.sting(0.4);
      await G.say('Madame Wexley', '¡HAY ALGUIEN DETRÁS DE USTED!');
      G.red(0.9); G.shake(16);
      G.flag('candles_out', true); G.flag('mirror_cracked', true);
      s.lights.forEach((l) => { l.off = true; });
      G.audio.thud();
      await G.fade(1, 200);
      await G.wait(2200);
      G.removeActor('Viuda'); G.removeActor('Joven');
      G.player.pose = null;
      G.player.x = 520;
      G.flag('candles_out', false);
      s.lights.forEach((l) => { l.off = false; l.flicker = 0.25; l.intensity = 0.6; });
      G.mad(0);
      await G.fade(0, 1500);
      await G.narrate('Alguien ha vuelto a encender una vela. Los clientes se han ido, y el espejo está partido en estrella.');
      w.talking = true;
      await G.say('Madame Wexley', 'Hay alguien detrás de usted, inspector. Siempre ha estado ahí. Desde que era niño.');
      w.talking = false;
      G.clue('alguien_detras');
      G.sanity(-10);
      G.flag('seance_done', true);
      G.cinema(false);
      await G.think('Un truco. Alguien le habló de Nat. ¿Quién sabía lo de Nat?');
      G.objective('Salir a Fournier Street.');
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
      await G.say('Vecinos', '¡Leather Apron! ¡Es el matarife! ¡Es él!');
      const b = G.actor('Brennan');
      b.talking = true;
      await G.say('Brennan', '¡Yo no he hecho nada! ¡Estaba trabajando! ¡Pregunten a Tomkins!');
      b.talking = false;
      await G.say('Un hombre', '¡Eh, usted es policía! ¡Díganos si es él!');
      const accuse = G.deduced('d_delantal');
      const opts = accuse ? ['"Es él. Leather Apron."', '"¡Atrás! ¡Este hombre está bajo custodia!"'] : ['(Callar)', '"¡Atrás! ¡Este hombre está bajo custodia!"'];
      const c = await G.choice(opts);
      if (c === 0 && accuse) {
        G.flag('accused', true);
        await G.say('Ashgrove', 'Es él.');
        await G.narrate('La multitud ruge como si llevara días esperando esa frase.');
      } else if (c === 0) {
        await G.narrate('Me quedo callado. La multitud no necesita que diga nada.');
      } else {
        await G.say('Ashgrove', '¡Atrás! ¡Policía!');
        await G.narrate('Nadie me escucha. Por encima de los gritos alguien se ríe, y tardo un momento en darme cuenta de que soy yo.');
        G.sanity(-4);
      }
      G.audio.sting(0.2);
      for (const a of G.game.actors) if (a.name.startsWith('Vecino')) a.walkTo(a.x - 700, { speed: 200 });
      for (let i = 0; i < 6; i++) { G.shake(10); G.audio.thud(); await G.wait(380); }
      await G.fade(1, 600);
      for (const a of [...G.game.actors]) if (a.name.startsWith('Vecino')) G.removeActor(a.name);
      G.scene.lights.forEach((l) => { if (l.id && l.id.startsWith('torch')) l.off = true; });
      G.audio.setBeds({ wind: 0.3, rain: 0.2, drone: 0.15 }, 2);
      await G.wait(1200);
      await G.fade(0, 1500);
      await G.narrate('Cuando la policía llega a dispersarlos, Brennan está en el suelo, contra el portón, y no se mueve. Respira.');
      const w = G.actor('Wren');
      await w.walkTo(1640);
      w.talking = true;
      await G.say('Wren', 'Usted sabía que no era él.');
      w.talking = false;
      const c2 = await G.choice(['No lo sabía.', '(No decir nada)']);
      if (c2 === 0) { w.talking = true; await G.say('Wren', 'Sí lo sabía. Usted siempre lo sabe todo antes que nadie.'); w.talking = false; }
      w.walkTo(2300, { speed: 200 });
      await G.wait(1000);
      await G.fade(1, 1200);
      await G.card('', '', 'Al día siguiente detuvieron a John Pizer, a quien el barrio llamaba "Leather Apron". Tenía coartada y lo soltaron.', 4600);
      await G.card('', '', 'Brennan no volvió al desolladero.', 3200);
      G.cinema(false);
      await G.chapter('c3');
    },

    // ------------------------------------------------------------ chapter 3
    async writeC3a(G) {
      G.player.x = 1180; G.face(1);
      G.player.pose = 'sit';
      await G.think('Informe sobre la vigilancia de Hanbury Street. Agentes asignados: cuatro. Incidencias: ninguna.');
      G.audio.pen();
      await G.wait(900);
      G.audio.pen();
      await G.think('Las once y cuarenta. Las once y cuarenta y uno.');
      G.mad(0.4);
      await G.voice('Escribe, Tommy. Con la otra tinta.');
      G.audio.pen();
      await lostTime(G, '23:41', '3:15');
      G.flag('tinta_vacia', true);
      G.flag('woke_c3', true);
      G.mad(0);
      G.audio.setBeds({ rain: 0.2, room: 0.4 }, 2);
      await G.fade(0, 1500);
      await G.think('Me he quedado dormido sobre el escritorio.');
      await G.think('Tengo los dedos de la mano izquierda manchados de rojo hasta los nudillos.');
      G.clue('dedos');
      await G.think('El tintero rojo está casi vacío y el plumín, doblado. Faltan tres pliegos de papel de cartas.');
      G.sanity(-8);
      G.player.pose = null;
      await G.think('Tengo que acostarme.');
      G.objective('Acostarse.');
    },

    async sleepC3a(G) {
      G.player.pose = null;
      await G.fade(1, 1500);
      await G.card('', '', 'Los días siguientes apenas duermo.', 2600);
      await G.card('', '30 de septiembre', '1:46 de la madrugada', 3200);
      await G.narrate('No recuerdo haber salido. Estoy en Aldgate, delante de la iglesia de St. Botolph, y oigo a alguien correr hacia Mitre Square.');
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
      await G.narrate('Tengo el trozo de delantal en la mano. No recuerdo haberlo cogido.');
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
      await G.think('Bajo los escalones hasta que el agua me llega a los tobillos. Huele al Ditch. Aquí abajo no van a bajar.');
      await G.voice('Bien, Tommy.');
      G.player.speed = 150;
      await lostTime(G, '3:20', '8:05', { date: '1 de octubre de 1888' });
      G.flag('room_phase', 'c3b');
      await G.goto('room', { x: 700, facing: -1, fade: false });
      await G.fade(0, 1500);
      await G.think('Me despierto en mi cama. No sé cuánto he dormido. Quizá un día entero.');
      G.objective('Leer el periódico. Mirar debajo de la cama.');
    },

    async readPaper(G) {
      G.player.pose = 'kneel';
      await G.wait(300);
      G.player.pose = null;
      await G.doc(`<h3>THE DAILY NEWS — 1 de octubre de 1888</h3>
        <p class="small">LOS CRÍMENES DEL EAST END. UNA CARTA DEL ASESINO.</p>
        <p>La Central News Agency ha hecho pública una carta recibida el jueves 27, escrita con <b>tinta roja</b>, cuyo autor afirma ser responsable de los crímenes:</p>
        <p class="red">"I keep on hearing the police have caught me but they wont fix me just yet... That joke about Leather Apron gave me real fits... Red ink is fit enough I hope ha. ha."</p>
        <p class="red" style="text-align:right">Yours truly<br>Jack the Ripper</p>
        <p class="red" style="text-align:right">Dont mind me giving the trade name</p>
        <p class="small">Se ruega a quien reconozca la letra que se presente en Scotland Yard.</p>`);
      G.flag('paper_read', true);
      G.clue('carta');
      G.objective(G.hasClue('estuche') ? 'Salir.' : 'Mirar debajo de la cama.');
      await G.think('El jueves 27. Fue la noche que me dormí sobre el escritorio.');
      await G.think('"Jack the Ripper". Mañana lo dirán en todas las tabernas de Londres.');
      G.audio.whisper(2, 0.14);
      await G.voice('Jack.');
      G.sanity(-6);
      if (G.flag('accused')) await G.think('"Lo de Leather Apron me hizo mucha gracia." Brennan sigue sin poder levantarse de la cama.');
    },

    async leaveRoomC3b(G) {
      if (!G.hasClue('estuche')) { await G.think('Antes... hay algo debajo de la cama que no quiero mirar. Tengo que mirarlo.'); return; }
      await G.fade(1, 1200);
      await G.chapter('c4');
    },

    // ------------------------------------------------------------ chapter 4
    async readFile(G) {
      await G.doc(`<h3>LONDON HOSPITAL — EXPEDIENTE CLÍNICO</h3>
        <p class="small">Paciente: T. A., estudiante de cuarto año. Fecha: 14 de marzo de 1879. Médico: L. Greaves.</p>
        <p class="hand">Hallado a las 4 a. m. en la sala de disección, con un bisturí en la mano izquierda. No recuerda cómo entró ni cuánto tiempo estuvo allí. El cadáver de la mesa 3 presenta incisiones que no constan en el programa de prácticas.</p>
        <p class="hand">Interrogado, el paciente afirma que "el agua le llamó por su nombre", como cuando tenía nueve años, y que él "contestó otra vez".</p>
        <p class="hand">Diagnóstico provisional: fuga disociativa (cf. Tissié, 1887). Pérdidas de memoria recurrentes. Posible relación con el ahogamiento de un hermano menor (Limehouse, 1866).</p>
        <p class="hand">El paciente abandona los estudios por voluntad propia. Recomiendo vigilancia discreta.</p>
        <p class="small" style="text-align:right">Nota añadida, 1 sep. 1888: <i>El sargento Pike vino a preguntar si un hombre puede hacer cosas y no recordarlas. Le he dicho que sí.</i></p>`);
      G.flag('file_read', true);
      G.clue('expediente');
      G.sanity(-10);
      await G.think('T. A.');
      await G.think('Cualquiera. Hay cientos de...');
      G.audio.door();
      G.cinema(true);
      const gr = G.addActor(new Actor('Greaves', { x: 120, y: G.scene.groundY, h: 214, hat: 'top', coat: '#1d1b1c', coatLen: 0.95, cane: true, beard: '#7a7a74', hair: '#8a8a84', facing: 1, flare: 1.05, tails: true, chain: true, waistcoat: '#3a2a20', buttons: 'double' }));
      G.face(-1);
      await gr.walkTo(G.player.x - 260);
      gr.talking = true;
      await G.say('Greaves', 'Así que lo has encontrado.');
      await G.say('Greaves', 'Aquella noche te encontré yo, Thomas. Tenías un bisturí en la mano y me preguntaste qué hora era. No te acordabas de nada.');
      await G.say('Greaves', 'Pike vino a verme después de Buck\'s Row. Lleva desde agosto apuntando a qué hora llegas y de dónde vienes.');
      gr.talking = false;
      const c = await G.choice(['Me está acusando a mí.', '¿Y si tiene razón?', 'Usted le habló de Nat a Wexley.']);
      gr.talking = true;
      if (c === 0) await G.say('Greaves', 'Te estoy pidiendo que te entregues, antes de que vuelva a pasar.');
      else if (c === 1) await G.say('Greaves', 'Entonces aún estás a tiempo, Thomas. Dame el bisturí.');
      else await G.say('Greaves', 'No conozco a ninguna Wexley. Nunca le he contado lo de tu hermano a nadie.');
      await G.say('Greaves', 'Dame el bisturí, Thomas. Despacio.');
      gr.talking = false;
      await gr.walkTo(G.player.x - 110);
      gr.pose = 'reach';
      G.audio.sting(0.45);
      G.red(1); G.shake(18);
      await G.fade(1, 120);
      G.audio.thud();
      await G.wait(1600);
      gr.pose = 'cower'; gr.x = G.player.x - 300; gr.facing = 1;
      G.player.pose = 'reach';
      await G.fade(0, 700);
      gr.talking = true;
      await G.say('Greaves', '¡Thomas...! No...');
      gr.talking = false;
      await G.think('Tengo el bisturí en la mano izquierda y hay sangre en la hoja.');
      await G.think('Greaves se sujeta la mano, que sangra. Está vivo. Está vivo.');
      G.player.pose = null;
      G.audio.whistle(0.14, true);
      gr.talking = true;
      await G.say('Greaves', 'Vete. Corre, antes de que llegue Pike. Y que Dios se apiade de los dos.');
      gr.talking = false;
      G.sanity(-15);
      await G.fade(1, 1000);
      await G.card('', '9 de noviembre', 'Limehouse, 2:30 de la madrugada', 3400);
      G.flag('fs_1888', true);
      G.date('9 de noviembre de 1888', '2:30');
      G.cinema(false);
      await G.goto('foreshore', { x: 440, facing: 1, fade: false });
      await G.fade(0, 2000);
      await hooks.finaleIntro(G);
    },

    async finaleIntro(G) {
      await G.think('Los silbatos se oyen arriba, en Narrow Street. Aquí abajo solo está el agua.');
      await G.think('Aquí se ahogó Nat. Aquí contesté.');
      await G.think('Tengo que pensar con orden, como en cualquier caso.');
      G.flag('awake', true);
      G.shake(4);
      G.clue('ficha');
      await G.think('En el cuaderno hay una página nueva, escrita con mi letra: mi propia ficha. Tengo que contrastarla con el perfil.');
      G.objective('En el cuaderno: relacionar mi ficha con las pistas del asesino (al menos tres).');
    },

    async outfall1888(G) {
      G.flag('ditch_glow', true);
      await G.think('El desagüe brilla por dentro con una luz verde y lenta, como si respirara.');
      if (finals(G) < 3) { await G.think('Todavía no. Antes tengo que estar seguro. El cuaderno.'); return; }
      G.zoom(1.22, G.player.x, G.scene.groundY - G.player.h * 0.7, 0.35);
      await G.voice('Ven al agua, Tommy.');
    },

    async finaleWater(G) {
      if (finals(G) < 3) { await G.think('El agua me llama, pero todavía no. Primero el cuaderno: tengo que saberlo con certeza.'); return; }
      G.flag('ditch_glow', true); G.flag('water_light', true);
      G.cinema(true);
      G.audio.setBeds({ river: 0.5, drone: 0.7, heart: 0.5 }, 4);
      G.mad(0.45);
      await G.think('Ya lo sé. Lo sé desde Buck\'s Row.');
      await G.voice('Thomas.');
      await G.choice(['Responder.', 'No responder.']);
      await G.voice('Tommy. Mírame.');
      await G.choice(['No responder.', 'No responder.', 'No responder.']);
      G.mad(0.7);
      await G.say('Ashgrove', 'Aquí estoy.');
      G.player.pose = 'kneel';
      G.scene.reflection = true;
      G.audio.sting(0.3);
      await G.think('En el agua hay un hombre. Lleva mi abrigo, pero no se ha arrodillado conmigo.');
      await G.voice('Ya no hace falta que contestes, Tommy. Ahora contestan por ti. Escucha.');
      G.audio.setBeds({ river: 0.4, drone: 0.7, crowd: 0.5 }, 3);
      for (const line of [
        '"¡Jack the Ripper!", grita un vendedor de periódicos en Commercial Street.',
        '"Jack", dice una mujer en una taberna de Dorset Street, y se santigua.',
        '"Jack", escribe Pike en su informe al comisario.',
        '"Jack", rezan en Spitalfields las madres a sus hijos para que no salgan de noche.',
      ]) { G.audio.whisper(1.6, 0.14); await G.say('', line, { style: 'thought', auto: 2600 }); }
      await G.voice('Todo Londres dice mi nombre. Ya tengo una dirección, Tommy. Ya puedo quedarme.');
      await G.choice(['"Me llamo Thomas Ashgrove."', '"Me llamo Thomas Ashgrove."']);
      await G.say('Ashgrove', 'Me llamo Thomas...');
      await G.voice('¿Seguro?');
      await G.say('Ashgrove', 'Me llamo...');
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
      await G.say('Wren', '¡Señor!');
      G.face(1);
      const w = G.actor('Wren');
      await w.walkTo(1240);
      w.talking = true;
      await G.say('Wren', 'Le buscan todos: Pike, los de la City y los vecinos con palos.');
      await G.say('Wren', 'Ya sabía yo que vendría por aquí. Huele usted al Ditch más que nunca.');
      await G.say('Wren', '¿Cómo se llama usted, señor? Su nombre de verdad.');
      w.talking = false;
      G.game.ui.hideDialogue();
      G.zoom(1.2, (G.player.x + w.x) / 2, G.scene.groundY - G.player.h * 0.65, 0.3);
      await G.nameEntry('¿Cómo se llama usted?', 'Jack');
      G.audio.sting(0.3);
      w.talking = true;
      await G.say('Wren', 'No... No, señor. Usted antes se llamaba de otra manera.');
      w.talking = false;
      w.walkTo(2100, { speed: 240 });
      G.zoom(1);
      await G.wait(1200);
      G.face(1);
      const court = G.light('court');
      if (court) { court.intensity = 0.55; court.haloK = 0.5; }
      await G.narrate('Desde el fondo del patio llega una voz de mujer que canta muy bajo una canción sobre una violeta cogida de la tumba de una madre.');
      await G.walk(1065, { speed: 80 });
      for (let i = 0; i < 30; i++) { G.player.alpha = 1 - i / 30; await G.wait(60); }
      G.player.visible = false; G.player.alpha = 1;
      await G.wait(1500);
      await G.fade(1, 3000);
      G.audio.setBeds({}, 3);
      await G.wait(1200);
      G.desat(0); G.mad(0);
      await G.card('', 'Yours truly, Jack the Ripper', "Don't mind me giving the trade name.", 6000);
      await G.card('', '', 'El 9 de noviembre de 1888, Mary Jane Kelly fue asesinada en su habitación del número 13 de Miller\'s Court. Tenía unos veinticinco años. Esa noche la oyeron cantar.', 7000);
      await G.card('', '', 'Fue la última de las cinco víctimas canónicas. El asesino nunca fue identificado.', 5200);
      await G.card('', '', 'Nadie volvió a ver al inspector Thomas Ashgrove.', 4600);
      await G.card('', '', 'El Black Ditch sigue corriendo bajo el East End.', 4600);
      await G.card('', 'El Huésped', 'Fin', 5200);
      G.cinema(false);
      G.game.finish();
    },
  };

  return { chapters, hooks };
}
