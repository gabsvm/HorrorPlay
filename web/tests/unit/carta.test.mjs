// The letter as the newspaper gives it (V4-07): the Daily News no longer asks for the hand of a
// stranger, the doubt that it is an invention is Thomas's and only on the first reading, and the
// comparison is with a copy, not with the original. Thomas is the one who wrote it, in the text
// and in the truths; nothing in the story says Greaves, Brennan or the press wrote it as a fact.
import { readFileSync } from 'node:fs';
import { CLUES, DEDUCTIONS } from '../../src/story/data.js';
import { normalizeState } from '../../src/story/progression.js';
import { ok, eq } from './assert.mjs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const CH = read('../../src/story/chapters.js');
const DATA = read('../../src/story/data.js');
// the source of one function of chapters.js, from its header up to the marker that follows it
const body = (start, end) => {
  const i = CH.indexOf(start);
  const j = CH.indexOf(end, i + start.length);
  ok(i >= 0 && j > i, `no encuentro el bloque «${start.trim()}»`);
  return CH.slice(i, j);
};
const writeC3a = body('    async writeC3a(G) {', '    async sleepC3a(G) {');
const readPaper = body('    async readPaper(G) {', '    // what the room still asks');
const compareHands = body('    async compareHands(G) {', '    async leaveRoomC3b(G) {');
const SUSPICION = 'Puede que la haya inventado un periodista. Una carta así vende periódicos.';

export const tests = [
  ['writeC3a: la fecha 25 y las horas 23:41 a 3:15 siguen en el fuente', () => {
    ok(writeC3a.includes("'23:41', '3:15'"), 'faltan las horas 23:41 a 3:15');
    ok(writeC3a.includes("date: '25 de septiembre de 1888'"), 'falta la fecha 25 de septiembre');
  }],
  ['carta.truth2 y d_rojo.truth afirman que Thomas escribió la carta', () => {
    ok(/La escribí/.test(CLUES.carta.truth2), 'carta.truth2 no dice que la escribí');
    const rojo = DEDUCTIONS.find((d) => d.id === 'd_rojo');
    ok(rojo && /Escribí esa carta/.test(rojo.truth), 'd_rojo.truth no dice que la escribí');
  }],
  ['ninguna línea de chapters.js ni data.js atribuye la autoría a Greaves, Brennan o la prensa como hecho', () => {
    const AUTORIA = /(la escribió (Greaves|Brennan)|escrita por (Greaves|Brennan|la prensa)|escribió (Greaves|Brennan) la carta|escrita por el periódico)/i;
    ok(!AUTORIA.test(CH), `chapters.js: ${CH.match(AUTORIA)?.[0]}`);
    ok(!AUTORIA.test(DATA), `data.js: ${DATA.match(AUTORIA)?.[0]}`);
  }],
  ['carta (data.js): la tinta roja se atribuye a la prensa, «Según el periódico»', () => {
    ok(CLUES.carta.text.includes('Según el periódico, está escrita con tinta roja.'), 'falta «Según el periódico»');
    ok(!/Está escrita con tinta roja/.test(CLUES.carta.text), 'queda la frase sin atribución');
    eq(CLUES.carta.text, 'Una carta fechada el 25 y recibida por la Central News el 27 circula bajo la firma «Jack the Ripper». Según el periódico, está escrita con tinta roja.', 'texto de la pista carta');
  }],
  ['readPaper: el llamamiento a reconocer la letra ya no está', () => {
    ok(!CH.includes('Se ruega a quien reconozca la letra'), 'queda «Se ruega a quien reconozca la letra»');
    ok(!readPaper.includes('Scotland Yard'), 'el documento aún nombra Scotland Yard');
  }],
  ['readPaper: la sospecha de engaño existe una vez, solo en la primera lectura, y en su sitio', () => {
    eq(CH.split(SUSPICION).length - 1, 1, 'número de apariciones de la sospecha en chapters.js');
    ok(readPaper.includes(`if (!G.second()) await G.think('${SUSPICION}');`), 'la sospecha no está dentro de !G.second()');
    const at = (s) => readPaper.indexOf(s);
    ok(at('Fechada el 25.') > 0 && at('Fechada el 25.') < at(SUSPICION), 'la sospecha no va después de «Fechada el 25»');
    ok(at(SUSPICION) < at('G.audio.whisper(2, 0.14)'), 'la sospecha va después del susurro');
    ok(at(SUSPICION) < at('Una firma. Ya la imprimieron.'), 'la sospecha va antes de «Una firma. Ya la imprimieron.»');
    ok(!readPaper.includes('Esa letra la he visto antes'), 'el periódico no muestra ninguna letra: no puede decir «esa letra la he visto antes»');
  }],
  ['compareHands: la comparación es con una copia, no con el periódico', () => {
    ok(!compareHands.includes('tal como la reproduce el Daily News'), 'queda «tal como la reproduce el Daily News»');
    ok(compareHands.includes('<h3>Copia de la carta que circula entre los inspectores y las escrituras de mi mesa</h3>'), 'falta la cabecera de la copia');
    ok(compareHands.includes('La copia de la carta, sin la letra del original:'), 'falta la línea de la copia');
    ok(compareHands.includes('Dear Boss... Yours truly, Jack the Ripper'), 'se ha tocado la cita de la carta');
    ok(compareHands.includes("await G.think('Una copia y las letras de mi mesa. Con esto no se acusa a nadie.');"), 'falta el pensamiento de inconclusive');
  }],
  ['compareHands: los cuatro valores de handwriting_assessment siguen en el código', () => {
    for (const v of ['greaves_like', 'inconclusive', 'self_recognition', 'self_suspicion']) ok(compareHands.includes(`assessment = '${v}'`), `falta ${v}`);
    ok(compareHands.includes('G.state.flags.handwriting_assessment = assessment;'), 'no se guarda handwriting_assessment');
    ok(!CH.includes('handwriting_category'), 'no debe existir handwriting_category');
  }],
  ['V5-02: ninguna opción compara trazos con la copia, y «Pude escribirla yo» está en la primera lectura', () => {
    ok(compareHands.includes('no guarda el trazo'), 'el documento debe decir que la copia no guarda el trazo');
    ok(!/Esa J. Esas t. Las conozco/.test(compareHands), 'sigue la frase que compara trazos con una copia');
    ok(!/se parece a la suya/.test(compareHands), 'sigue «se parece a la suya»');
    const names = compareHands.slice(compareHands.indexOf('const names'), compareHands.indexOf('let assessment'));
    ok(names.includes("'Pude escribirla yo.'"), 'falta la opción «Pude escribirla yo.»');
    ok(!/G.second() ? [[^]]*Pude escribirla yo/.test(names), '«Pude escribirla yo.» no puede depender de la segunda lectura');
    ok(compareHands.includes('También podría ser mi mano. Eso no basta para demostrarlo.'), 'falta la salvedad: sospecha, no demostración');
  }],
  ['un guardado con handwriting_assessment se carga sin cambio de estado (los cuatro valores)', () => {
    for (const v of ['greaves_like', 'inconclusive', 'self_recognition', 'self_suspicion']) {
      const raw = { chapter: 'c3', scene: 'room', flags: { handwriting_assessment: v, room_phase: 'c3b', paper_read: true }, items: [], clues: ['carta', 'letra'], deductions: [], profile: [], sanity: 100 };
      const once = normalizeState(JSON.parse(JSON.stringify(raw)));
      eq(once.flags.handwriting_assessment, v, `${v} se pierde al cargar`);
      eq(normalizeState(JSON.parse(JSON.stringify(once))), once, `${v} no es idempotente`);
    }
  }],
];
