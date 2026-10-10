// The player's positions on the open questions: written only when they change, capped, offered only
// once their evidence is in, refused while awake, and never able to move the story or the theories.
import { QUESTIONS, readPosition, setPosition, basisFor, sanitizePositions } from '../../src/story/positions.js';
import { normalizeState } from '../../src/story/progression.js';
import { evaluate, statuses } from '../../src/story/theories.js';
import { ok, eq } from './assert.mjs';
import { readFileSync, readdirSync } from 'node:fs';

const st = (o = {}) => normalizeState({ chapter: 'c1', scene: 'knackers', flags: {}, items: [], clues: [], deductions: [], profile: [], sanity: 100, ...o });
const clone = (x) => JSON.parse(JSON.stringify(x));
const read = (p) => JSON.parse(readFileSync(new URL(`../fixtures/${p}`, import.meta.url), 'utf8'));
// every saved state the tests keep: the baseline and second-reading saves, and the pre-V3 save
const FIXTURES = [
  ...['saves-v1-baseline', 'saves-v1-baseline-second'].flatMap((d) => readdirSync(new URL(`../fixtures/${d}/`, import.meta.url))
    .filter((f) => f.endsWith('.json')).sort().map((f) => [`${d}/${f}`, read(`${d}/${f}`)])),
  ['legacy-c3-pre-v3.json', read('legacy-c3-pre-v3.json')],
];

export const tests = [
  // ------------------------------------------------------------ setPosition
  ['setPosition escribe la postura y devuelve true', () => {
    const s = st({ clues: ['brennan_zurdo'] });
    eq(setPosition(s, 'br_suspect', 'brennan'), true);
    eq(readPosition(s, 'br_suspect'), 'brennan');
  }],
  ['repetir la misma opción no escribe ni añade revisión', () => {
    const s = st({ clues: ['brennan_zurdo'] });
    setPosition(s, 'br_suspect', 'brennan');
    const before = clone(s);
    eq(setPosition(s, 'br_suspect', 'brennan'), false);
    eq(s, before);
    eq(s.investigation.revisions.length, 1);
  }],
  ['la primera postura viene de null; un cambio viene de la anterior', () => {
    const s = st({ chapter: 'c1', clues: ['brennan_zurdo'] });
    eq(setPosition(s, 'br_suspect', 'brennan'), true);
    eq(setPosition(s, 'br_suspect', 'prensa'), true);
    const r = s.investigation.revisions;
    eq(r.length, 2);
    eq(r[0].from, null, 'primera revisión');
    eq(r[0].to, 'brennan');
    eq(r[0].chapter, 'c1');
    eq(r[0].question, 'br_suspect');
    eq(r[1].from, 'brennan', 'segunda revisión');
    eq(r[1].to, 'prensa');
  }],
  ['21 cambios: quedan 20 revisiones y sale la más antigua', () => {
    const s = st({ clues: ['brennan_zurdo'] });
    const seq = Array.from({ length: 21 }, (_, i) => (i % 2 ? 'prensa' : 'brennan'));
    seq.forEach((v, i) => eq(setPosition(s, 'br_suspect', v), true, `cambio ${i}`));
    const r = s.investigation.revisions;
    eq(r.length, 20);
    eq(r[0].from, seq[0], 'la revisión 2 viene de la 1');
    eq(r[0].to, seq[1]);
    eq(r[19].to, seq[20]);
    ok(r.every((x) => x.from !== null), 'la primera revisión (from null) ya no está');
  }],
  ['segunda lectura: setPosition devuelve false y no escribe nada', () => {
    const s = st({ clues: ['brennan_zurdo', 'carta'], flags: { second: true } });
    eq(setPosition(s, 'br_suspect', 'brennan'), false);
    eq(setPosition(s, 'letter_author', 'greaves'), false);
    eq(s.investigation.positions, {});
    eq(s.investigation.revisions, []);
  }],
  ['awake: no se escribe nada y devuelve false', () => {
    const s = st({ clues: ['brennan_zurdo'], flags: { awake: true } });
    eq(setPosition(s, 'br_suspect', 'brennan'), false);
    eq(readPosition(s, 'br_suspect'), null);
    eq(s.investigation.revisions, []);
  }],
  ['una pregunta no visible no se escribe: buck_window sin la pista ronda; carta sin la carta', () => {
    const s = st({ clues: ['dedos'] });
    eq(QUESTIONS.buck_window.visible(s), false);
    eq(setPosition(s, 'buck_window', 'firme'), false);
    eq(setPosition(s, 'letter_author', 'greaves'), false, 'dedos no basta para la carta');
    eq(readPosition(s, 'letter_author'), null);
    s.clues.push('carta');
    eq(setPosition(s, 'letter_author', 'greaves'), true, 'con la carta sí');
  }],
  ['opciones y preguntas que no existen: false y nada escrito', () => {
    const s = st({ clues: ['brennan_zurdo'] });
    eq(setPosition(s, 'br_suspect', 'greaves'), false);
    eq(setPosition(s, 'nope', 'brennan'), false);
    eq(setPosition(s, 'constructor', 'x'), false);
    eq(s.investigation.revisions, []);
    eq(s.investigation.positions, {});
  }],
  // ------------------------------------------------------------ basis
  ['basis de insuficiente es []', () => {
    eq(basisFor(st({ clues: ['brennan_zurdo'] }), 'br_suspect', 'insuficiente'), []);
  }],
  ['basis de una hipótesis: solo lo que se cumple, con su tipo', () => {
    const s = st({ clues: ['brennan_zurdo', 'delantal'], deductions: ['d_brennan'], flags: { br_alibi: true } });
    eq(basisFor(s, 'br_suspect', 'brennan'), ['for:clue:brennan_zurdo', 'for:ded:d_brennan', 'for:clue:delantal', 'against:flag:br_alibi']);
  }],
  ['basis nunca undefined: sin hipótesis o sin pruebas, []', () => {
    eq(basisFor(st(), 'buck_window', 'firme'), []);
    eq(basisFor(st(), 'letter_author', 'cercano'), []);
    eq(basisFor(st(), 'nope', 'x'), []);
    const all = st({ clues: ['brennan_zurdo', 'delantal', 'carta', 'dedos', 'llave_pike'], deductions: ['d_brennan', 'd_rojo'], flags: { br_alibi: true, amelia1: true, c1_done: true, hand_inconclusive: true } });
    for (const [q, Q] of Object.entries(QUESTIONS)) for (const [o] of Q.options) {
      const b = basisFor(all, q, o);
      ok(Array.isArray(b) && b.every((x) => typeof x === 'string' && /^(for|against):(clue|ded|flag):/.test(x)), `${q}.${o}: ${JSON.stringify(b)}`);
    }
  }],
  // ------------------------------------------------------------ normalizeState
  ['normalizeState: positions y revisions por defecto; lo desconocido se conserva', () => {
    eq(normalizeState({}).investigation.positions, {});
    eq(normalizeState({}).investigation.revisions, []);
    for (const bad of [[], null, 'x', 3]) eq(normalizeState({ investigation: { positions: bad } }).investigation.positions, {}, JSON.stringify(bad));
    const s = normalizeState({ investigation: { positions: { br_suspect: 'brennan', futura_pregunta: 'x' }, revisions: 'no' } });
    eq(s.investigation.positions, { br_suspect: 'brennan', futura_pregunta: 'x' });
    eq(s.investigation.revisions, []);
  }],
  ['normalizeState recorta las revisiones a las últimas 20', () => {
    const revisions = Array.from({ length: 25 }, (_, i) => ({ question: 'br_suspect', from: null, to: 'brennan', chapter: 'c1', basis: [], n: i }));
    const s = normalizeState({ investigation: { revisions } });
    eq(s.investigation.revisions.length, 20);
    eq(s.investigation.revisions[0].n, 5);
  }],
  ['normalizeState quita un valor que no es opción de una pregunta conocida', () => {
    const s = normalizeState({ investigation: { positions: { br_suspect: 'nope', letter_author: 'greaves', buck_window: 'nope' } } });
    eq(s.investigation.positions, { letter_author: 'greaves' });
  }],
  ['normalizeState conserva una clave desconocida tal cual', () => {
    const s = normalizeState({ investigation: { positions: { futura_pregunta: { algo: 1 }, br_suspect: 3 } } });
    eq(s.investigation.positions, { futura_pregunta: { algo: 1 } });
  }],
  ['sanitizePositions no cambia su argumento y devuelve un objeto nuevo', () => {
    const raw = { br_suspect: 'nope', futura: 'x' };
    const out = sanitizePositions(raw);
    eq(raw, { br_suspect: 'nope', futura: 'x' });
    eq(out, { futura: 'x' });
    ok(out !== raw);
  }],
  ['normalizeState: las posturas guardadas con valores rotos son idempotentes en todos los fixtures', () => {
    for (const [name, raw] of FIXTURES) {
      const dirty = clone(raw);
      dirty.investigation = { positions: { br_suspect: 'nope', letter_author: 'greaves', futura: 'x' }, revisions: [] };
      const once = normalizeState(clone(dirty));
      const twice = normalizeState(clone(once));
      eq(twice, once, name);
      eq(once.investigation.positions, { letter_author: 'greaves', futura: 'x' }, name);
    }
  }],
  ['normalizeState no toca hypotheses, routes ni evaluations', () => {
    const inv = { hypotheses: { 'intruso.yo': 'plausible' }, routes: { c1: { stance: 'clear' } }, evaluations: { x: 1 } };
    const s = normalizeState({ investigation: clone(inv) });
    eq(s.investigation.hypotheses, inv.hypotheses);
    eq(s.investigation.routes, inv.routes);
    eq(s.investigation.evaluations, inv.evaluations);
  }],
  ['normalizeState es idempotente en todos los guardados de prueba', () => {
    for (const [name, raw] of FIXTURES) {
      const once = normalizeState(clone(raw));
      const twice = normalizeState(clone(once));
      eq(twice, once, name);
      eq(once.investigation.positions, {}, `${name} positions`);
      eq(once.investigation.revisions, [], `${name} revisions`);
      for (const k of ['hypotheses', 'routes', 'evaluations']) if (raw.investigation?.[k] !== undefined) eq(once.investigation[k], raw.investigation[k], `${name} ${k}`);
    }
  }],
  // ------------------------------------------------------------ the story and the theories do not move
  ['las teorías no cambian con o sin posturas', () => {
    const base = st({ clues: ['brennan_zurdo', 'carta', 'dedos', 'delantal'], deductions: ['d_brennan'], flags: { br_alibi: true, brennan_stance: 'clear' } });
    const with_ = clone(base);
    eq(setPosition(with_, 'br_suspect', 'prensa'), true);
    eq(setPosition(with_, 'letter_author', 'cercano'), true);
    eq(evaluate(with_), evaluate(base));
    eq(statuses(with_), statuses(base));
  }],
  ['escribir una postura no toca la parada, las rutas ni las hipótesis', () => {
    const s = st({ clues: ['brennan_zurdo', 'carta'], flags: { brennan_stance: 'suspect' } });
    s.investigation.routes = { c1: { closedAt: 'knackers', stance: 'suspect', conclusions: [] } };
    s.investigation.hypotheses = { 'brennan.brennan': 'plausible' };
    const keep = () => clone({ flags: s.flags, routes: s.investigation.routes, hypotheses: s.investigation.hypotheses });
    const before = keep();
    eq(setPosition(s, 'br_suspect', 'brennan'), true);
    eq(setPosition(s, 'letter_author', 'greaves'), true);
    eq(keep(), before);
    eq(s.flags.brennan_stance, 'suspect');
  }],
];
