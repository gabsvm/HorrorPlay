// V5: the chain of the name (chain.js), the suspicion of one's own hand (positions/theories), the gate of the water
// (canEnterWater), the save rescue, and the timeline of the name «Jack» (nobody says it before the paper of the 1st).
import { readFileSync, readdirSync } from 'node:fs';
import { CHAIN_LINKS, CHAIN_QUESTIONS, CHAIN_FLAG, chainView, chainDone } from '../../src/story/chain.js';
import { normalizeState, canEnterFinale, canEnterWater, currentGate, gateDeductions } from '../../src/story/progression.js';
import { QUESTIONS, setPosition, basisFor, sanitizePositions, readPosition } from '../../src/story/positions.js';
import { evaluate } from '../../src/story/theories.js';
import { CLUES, DEDUCTIONS } from '../../src/story/data.js';
import { ok, eq } from './assert.mjs';

const st = (o = {}) => normalizeState({ chapter: 'c3', scene: 'room', flags: {}, items: [], clues: [], deductions: [], profile: [], sanity: 100, ...o, flags: { ...(o.flags || {}) } });
const READY = ['f_zurdo', 'f_anat', 'f_testigo'];
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

export const tests = [
  ['la cadena: tres eslabones y tres preguntas con una sola respuesta cada una', () => {
    eq(CHAIN_LINKS.map((l) => l.id), ['mano', 'firma', 'eco'], 'eslabones');
    eq(CHAIN_QUESTIONS.length, 3, 'preguntas');
    for (const q of CHAIN_QUESTIONS) {
      ok(q.right >= 0 && q.right < q.options.length, 'la respuesta correcta existe');
      eq(q.miss.length, q.options.length, 'una respuesta a cada error');
      q.miss.forEach((m, i) => ok(i === q.right ? m === null : typeof m === 'string' && m.length > 10, `respuesta al error ${i}`));
      ok(q.help && q.help.length > 10, 'ayuda tras dos fallos');
    }
    // la respuesta correcta no está siempre en el mismo sitio
    ok(new Set(CHAIN_QUESTIONS.map((q) => q.right)).size >= 2, 'la respuesta correcta siempre en la misma posición');
  }],
  ['la cadena: la copia y el recorte cuentan como una sola fuente, y nada se dice de contagio', () => {
    const txt = JSON.stringify([CHAIN_LINKS, CHAIN_QUESTIONS]);
    ok(/descienden|desciende/.test(txt) && /misma carta/.test(txt), 'copia y recorte descienden de la misma carta (una sola fuente)');
    // las opciones de una pregunta no se distinguen por la longitud
    for (const q of CHAIN_QUESTIONS) { const L = q.options.map((o) => o.length); ok(Math.max(...L) - Math.min(...L) <= 25, 'longitudes parecidas: ' + L); }
    eq(CHAIN_QUESTIONS.map((q) => q.right), [1, 1, 0], 'posiciones');
    ok(!/pose[ií]d|contag|infect|poder del nombre|se alimenta/i.test(txt), 'ni posesión ni contagio por leer el nombre');
    ok(!/Daily News ?[:.]? *«?Jack/.test(txt), 'sin citas inventadas del periódico');
  }],
  ['chainView: abierta con la calle oída o ya despierto; hecha solo con el flag', () => {
    eq(chainView(st()).open, false, 'sin calle ni despertar');
    eq(chainView(st({ clues: ['eco'] })).open, true, 'con eco');
    eq(chainView(st({ flags: { awake: true } })).open, true, 'despierto');
    eq(chainDone(st()), false);
    eq(chainDone(st({ flags: { [CHAIN_FLAG]: 'reasoned' } })), true);
    eq(chainDone(st({ flags: { [CHAIN_FLAG]: 'unknown' } })), false, 'unknown no es hecha');
    eq(chainView(st({ clues: ['dedos'] })).links.find((l) => l.id === 'mano').held, true, 'la mano está anotada');
  }],
  ['canEnterWater: tres fuentes no bastan sin la cadena; con ambas, sí', () => {
    const s = st({ chapter: 'c4', scene: 'foreshore', flags: { awake: true }, deductions: READY });
    ok(canEnterFinale(s).ok, 'las fuentes bastan para el reconocimiento');
    const w = canEnterWater(s);
    ok(!w.ok && w.missing.some((m) => /cadena del nombre/.test(m)), 'falta la cadena');
    s.flags[CHAIN_FLAG] = 'reasoned';
    ok(canEnterWater(s).ok, 'con la cadena abre');
    ok(!canEnterWater(st({ chapter: 'c4', scene: 'foreshore', flags: { awake: true, [CHAIN_FLAG]: 'reasoned' }, deductions: ['f_zurdo'] })).ok, 'la cadena sola no abre');
  }],
  ['la puerta del agua (currentGate) pide primero las fuentes y después la cadena; la ayuda no ofrece una pareja cuando solo falta la cadena', () => {
    const none = st({ chapter: 'c4', scene: 'foreshore', flags: { awake: true } });
    ok(/independiente/.test(currentGate(none).missing[0]), 'primero las fuentes');
    ok(gateDeductions(none).length > 0, 'todavía hay parejas que ofrecer');
    const src = st({ chapter: 'c4', scene: 'foreshore', flags: { awake: true }, deductions: READY });
    ok(/cadena del nombre/.test(currentGate(src).missing[0]), 'después la cadena');
    eq(gateDeductions(src), [], 'con las fuentes ya no se ofrece otra pareja');
  }],
  ['guardado antiguo: en el capítulo IV con la carta leída se rescata «eco» una vez; sin la carta no se inventa nada', () => {
    const old = st({ chapter: 'c4', scene: 'greaves', clues: ['carta', 'dedos'] });
    eq(old.clues.filter((c) => c === 'eco').length, 1, 'eco rescatado');
    eq(normalizeState(JSON.parse(JSON.stringify(old))).clues.filter((c) => c === 'eco').length, 1, 'idempotente');
    ok(!st({ chapter: 'c4', scene: 'greaves', clues: ['dedos'] }).clues.includes('eco'), 'sin la carta no hay eco');
    ok(!st({ chapter: 'c3', scene: 'room', clues: ['carta'] }).clues.includes('eco'), 'antes del capítulo IV se oye de verdad');
    ok(!st({ chapter: 'c4', scene: 'greaves', clues: ['carta'] }).flags[CHAIN_FLAG], 'el rescate no resuelve la cadena');
  }],
  ['«Pude escribirla yo»: es una postura posible con los pliegos y la tinta, y no sin ellos', () => {
    ok(QUESTIONS.letter_author.options.some(([o]) => o === 'yo'), 'la opción existe');
    const sin = st({ clues: ['carta'] });
    eq(setPosition(sin, 'letter_author', 'yo'), false, 'sin «dedos» no se ofrece');
    const con = st({ clues: ['carta', 'dedos'] });
    eq(setPosition(con, 'letter_author', 'yo'), true, 'con «dedos» sí');
    eq(readPosition(con, 'letter_author'), 'yo');
    eq(setPosition(con, 'letter_author', 'yo'), false, 'repetir no añade revisión');
    eq(con.investigation.revisions.length, 1, 'una sola revisión');
    ok(basisFor(con, 'letter_author', 'yo').includes('for:clue:dedos'), 'la base cita los pliegos');
    eq(sanitizePositions({ letter_author: 'yo' }).letter_author, 'yo', 'un guardado con «yo» se conserva');
    // elegir «yo» no elige a Greaves ni mueve nada más
    eq(Object.keys(con.investigation.positions), ['letter_author'], 'solo escribe esa postura');
    ok(!con.flags.sospecha_greaves, 'no fuerza una sospecha ajena');
  }],
  ['teoría de la carta: «yo» es plausible con dos pruebas y no cierra nada antes de despertar', () => {
    const t = (s) => evaluate(s).find((x) => x.id === 'carta').hyps.find((h) => h.id === 'yo');
    eq(t(st({ clues: ['carta'] })).status, 'sin evaluar', 'una prueba no basta');
    eq(t(st({ clues: ['carta', 'dedos'] })).status, 'plausible', 'dos pruebas');
    eq(t(st({ clues: ['carta', 'dedos'], flags: { awake: true } })).status, 'sostenida', 'despierto');
  }],
  ['la pista «letra» ya no afirma un parecido de trazos con una copia', () => {
    ok(!/remate de la J|unión de las t/.test(CLUES.letra.text), 'la pista habla de trazos que no se ven');
    ok(/no conserva la letra del original/.test(CLUES.letra.text), 'dice que la copia no la conserva');
    const dl = DEDUCTIONS.find((d) => d.id === 'd_letra');
    ok(dl && /no separa su mano de la mía/.test(dl.text), 'd_letra mantiene la salvedad');
    ok(CLUES.eco && /Ninguno me conoce/.test(CLUES.eco.text), 'la pista eco existe');
  }],
  ['«Jack» no se dice antes del periódico del 1 de octubre', () => {
    const dir = new URL('../../src/scenes/', import.meta.url);
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.js'))) {
      ok(!/\bJack\b/.test(read(`../../src/scenes/${f}`)), `${f} nombra a Jack`);
    }
    ok(!/\bJack\b/.test(read('../../src/story/intro.js')), 'la introducción nombra a Jack');
    const ch = read('../../src/story/chapters.js');
    const paper = ch.indexOf('    async readPaper(G) {');
    ok(paper > 0 && !/\bJack\b/.test(ch.slice(0, paper)), 'chapters.js nombra a Jack antes de readPaper');
    const heard = ch.indexOf('    async heardName(G');
    ok(heard > paper, 'la calle se oye después del periódico');
  }],
  ['la calle: nadie en 1888 cita obras posteriores, ni «Jack» se presenta como nombre de Thomas', () => {
    const ch = read('../../src/story/chapters.js');
    ok(!/King in Yellow|Rey de Amarillo|Chambers/i.test(ch), 'anacronismo: The King in Yellow es de 1895');
    const heard = ch.slice(ch.indexOf('    async heardName(G'), ch.indexOf('    async leaveRoomC3b(G)'));
    ok(!/Thomas|Ashgrove/.test(heard.replace(/G\.think\([^)]*\)/g, '')), 'los desconocidos de la calle no conocen a Thomas');
  }],
  ['el final sigue protegido: la firma termina en JACK para cualquier nombre, y la cadena no cambia las víctimas', () => {
    const ch = read('../../src/story/chapters.js');
    ok(ch.includes("await G.nameEntry('¿Cómo se llama usted?', 'Jack'"), 'la firma final se completa a Jack');
    for (const n of ['Polly', 'Annie', 'Elizabeth', 'Catherine', 'Mary Jane']) ok(ch.includes(n), `falta ${n} en el epílogo`);
  }],
];
