// The three first victims after V4-09: Buck's Row and Hanbury Street name no one until a body is
// identified, the notebook gives no name, and the press clippings carry what the press knew, one
// September clipping at the start of chapter two and the October line about the hop-picking in Kent.
// Comments in the code do not count as visible text.
import { readFileSync } from 'node:fs';
import { ok, eq } from './assert.mjs';

const read = (f) => readFileSync(new URL(`../../src/${f}`, import.meta.url), 'utf8');
// the visible text of a file: every line except the full-line comments
const visible = (s) => s.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
const count = (s, t) => s.split(t).length - 1;
// the text from one marker up to the next one after it (-1 when a marker is missing)
const block = (s, from, to) => {
  const a = s.indexOf(from), b = s.indexOf(to, a + from.length);
  if (a < 0 || b < 0) throw new Error(`no encuentro el bloque «${from}» … «${to}»`);
  return s.slice(a, b);
};

const bucks = read('scenes/bucks_row.js');
const hanbury = read('scenes/hanbury.js');
const chapters = read('story/chapters.js');

const SEPT = '<h3>RECORTE DE PRENSA — SEPTIEMBRE DE 1888</h3>';
const OCT = '<h3>RECORTE DE PRENSA — OCTUBRE DE 1888</h3>';
const HAT = 'Tiene al lado un sombrero de paja negro; parece nuevo. Alguien lo eligió con cuidado.';

export const tests = [
  ['bucks_row.js no dice en texto visible el nombre ni los datos de vida de la mujer', () => {
    const v = visible(bucks);
    const MEMORY = 'Recuerdo el sombrero junto a su cuerpo. Recuerdo mejor el sombrero que su rostro. La llamaban Polly.';
    ok(bucks.includes(MEMORY) && bucks.includes("if (G.second() && !G.flag('s2_polly')) {"), 'el recuerdo de Thomas debe ir detrás de la segunda lectura');
    const rest = v.split(MEMORY).join('');
    for (const t of ['Nichols', 'Polly', 'cinco hijos', 'peniques', 'encargada']) ok(!rest.includes(t), `aparece «${t}»`);
  }],
  ['la opción «¿Quién era ella?» dice una sola línea de Pike y deja el flag pike_polly', () => {
    const opt = block(bucks, "} else if (c === 'polly') {", "} else if (c === 'notes') {");
    eq(count(opt, 'G.say('), 1, 'líneas de Pike en la opción');
    ok(opt.includes(`G.say('Pike', '${HAT}')`), 'la línea del sombrero');
    ok(opt.includes("G.flag('pike_polly', true);"), 'falta el flag pike_polly');
    ok(!/cinco|peniques|encargada/.test(opt), 'queda un dato de vida en la opción');
  }],
  ['la opción de la libreta sigue exigiendo pike_polly', () => {
    ok(bucks.includes("if (!G.flag('pike_notes') && G.flag('pike_polly')) opts.push(['¿Qué apunta en esa libreta, Pike?', 'notes']);"), 'la condición de la libreta cambió');
  }],
  ['el hotspot y el inspect de la mujer de Buck\'s Row llevan el nombre nuevo, con ids intactos', () => {
    ok(bucks.includes("id: 'polly', name: 'El cuerpo de la mujer de Buck\\'s Row'"), 'nombre del hotspot');
    ok(bucks.includes("title: 'La mujer de Buck\\'s Row', body: 'nichols'"), 'título del inspect');
    ok(bucks.includes("G.inspect('polly', {"), 'id del inspect');
  }],
  ['pikeBook: la anotación de Nichols va sin nombre y exacta, y la de Tabram se queda', () => {
    const pb = block(chapters, 'async pikeBook(G) {', 'async leaveSeance(G) {');
    ok(pb.includes('<p class="hand">31 ago. — Buck\'s Row. Avisado a las 4:00. Llega a las 4:12. Botas mojadas. Barro negro.</p>'), 'anotación de Nichols');
    ok(pb.includes('<p class="hand">7 ago. — Tabram, George Yard.'), 'falta la línea de Tabram');
    ok(!/Nichols|Polly/.test(pb), 'queda un nombre en pikeBook');
  }],
  ['hanbury.js no dice en texto visible «Dark Annie» ni «Annie Chapman»', () => {
    const v = visible(hanbury);
    ok(!v.includes('Dark Annie') && !v.includes('Annie Chapman'), 'queda un nombre de Chapman en texto visible');
  }],
  ['las dos líneas de Pike en Hanbury son las aprobadas, una vez cada una', () => {
    eq(count(hanbury, "await G.say('Pike', 'Dicen en la casa que es Annie, de Dorset Street. Hay que confirmarlo.');"), 1, 'línea de la casa');
    eq(count(hanbury, "await G.say('Pike', 'Dicen que hacía ganchillo y vendía flores, cuando la salud la dejaba.');"), 1, 'línea del oficio');
  }],
  ['el hotspot y el inspect de la mujer del patio llevan el nombre nuevo, con ids intactos', () => {
    ok(hanbury.includes("id: 'annie', name: 'El cuerpo de la mujer del patio'"), 'nombre del hotspot');
    ok(hanbury.includes("title: 'La mujer del patio de Hanbury Street', body: 'chapman'"), 'título del inspect');
    ok(hanbury.includes("G.inspect('annie', {"), 'id del inspect');
  }],
  ['ningún texto de hanbury.js da una hora de identificación de Chapman', () => {
    for (const l of visible(hanbury).split('\n').filter((x) => /identific/i.test(x))) {
      ok(!/\d{1,2}[:.]\d{2}/.test(l), `hora junto a «identific»: ${l.trim()}`);
    }
  }],
  ['el recorte de septiembre es un solo documento al inicio del capítulo II, antes de su tarjeta', () => {
    eq(count(chapters, SEPT), 1, 'cabeceras del recorte de septiembre');
    const c2 = block(chapters, 'async c2(G) {', 'async c3(G) {');
    ok(c2.includes(SEPT), 'el recorte no está en c2');
    const doc = c2.indexOf(SEPT), card = c2.indexOf("G.card('Capítulo II'");
    ok(doc > 0 && card > doc, 'el recorte no va antes de la tarjeta del capítulo II');
    ok(!/flag/.test(c2.slice(0, card)), 'el recorte no lleva flag ni condición');
    ok(c2.includes("El 31 de agosto, una compañera del asilo de Lambeth reconoció a la mujer de Buck's Row: Mary Ann Nichols, a quien llamaban «Polly». Tenía cinco hijos. La noche del crimen el encargado del alojamiento le negó la cama: no tenía los cuatro peniques. Ella dijo que conseguiría el dinero, y mencionó su sombrero nuevo.</p>"), 'el texto del recorte cambió');
    ok(c2.includes('Emily Holland, con quien se cruzó en Osborne Street, declaró que la víctima le dijo que no tardaría en regresar.'), 'falta la declaración de Holland, separada');
  }],
  ['el recorte de octubre lleva la línea del lúpulo una vez, en el párrafo de Mitre Square', () => {
    eq(count(chapters, 'recogida del lúpulo'), 1, 'línea del lúpulo');
    const c4 = block(chapters, 'async c4(G) {', 'const hooks = {');
    ok(c4.includes('Catherine Eddowes. Había vuelto días antes de la recogida del lúpulo en Kent. Esa noche,'), 'la línea no va tras la frase de Kelly');
    eq(count(chapters, OCT), 1, 'cabeceras del recorte de octubre');
  }],
];
