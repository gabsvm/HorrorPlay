// The window of the rounds: the theory «rondas» (theories.js) and the notebook's question buck_window
// (positions.js). It appears with the clue ronda, is never «sostenida», does not read how many times
// Thomas missed the window, and a position on it is refused while awake or in the second reading.
import { QUESTIONS, readPosition, setPosition } from '../../src/story/positions.js';
import { normalizeState } from '../../src/story/progression.js';
import { THEORIES, evaluate, statuses } from '../../src/story/theories.js';
import { ok, eq } from './assert.mjs';

const st = (o = {}) => normalizeState({ chapter: 'c1', scene: 'bucks_row', flags: {}, items: [], clues: [], deductions: [], profile: [], sanity: 100, ...o });
const clone = (x) => JSON.parse(JSON.stringify(x));
const rondas = (s) => evaluate(s).find((t) => t.id === 'rondas');
const status = (s, h) => statuses(s)[`rondas.${h}`];

export const tests = [
  // ------------------------------------------------------------ the theory
  ['sin la pista ronda, la teoría rondas no aparece en evaluate()', () => {
    eq(rondas(st()), undefined);
    eq(rondas(st({ clues: ['dedos', 'carta', 'botas'] })), undefined);
  }],
  ['con la pista ronda, aparece y compatible es plausible; firme, sin evaluar sin d_ronda', () => {
    const s = st({ clues: ['ronda'] });
    ok(rondas(s), 'la teoría aparece con la pista');
    eq(status(s, 'compatible'), 'plausible');
    eq(status(s, 'firme'), 'sin evaluar');
    eq(rondas(s).hyps.find((h) => h.id === 'compatible').for, ['la hoja da la ventana con margen']);
  }],
  ['con d_ronda, firme es plausible y su evidencia es la deducción', () => {
    const s = st({ clues: ['ronda', 'silencio'], deductions: ['d_ronda'] });
    eq(status(s, 'firme'), 'plausible');
    eq(rondas(s).hyps.find((h) => h.id === 'firme').for, ['el hueco que dejan las horas declaradas']);
  }],
  ['nunca sostenida: ni despierto, ni en la segunda lectura, ni con toda la evidencia', () => {
    for (const flags of [{}, { awake: true }, { second: true }, { awake: true, second: true }]) {
      const s = st({ clues: ['ronda', 'silencio'], deductions: ['d_ronda'], flags });
      for (const h of ['firme', 'compatible']) ok(status(s, h) !== 'sostenida', `${JSON.stringify(flags)} ${h}`);
      eq(status(s, 'firme'), 'plausible', JSON.stringify(flags));
      eq(status(s, 'compatible'), 'plausible', JSON.stringify(flags));
    }
  }],
  ['el número de errores no cambia la teoría: la regla no lee misses ni beats', () => {
    const ref = evaluate(st({ clues: ['ronda'], deductions: ['d_ronda'] }));
    for (const misses of [0, 1, 2, 5]) {
      const s = st({ clues: ['ronda'], deductions: ['d_ronda'] });
      s.investigation.evaluations.beats = { misses };
      eq(evaluate(s), ref, `misses ${misses}`);
    }
    const T = THEORIES.find((t) => t.id === 'rondas');
    for (const h of T.hyps) ok(!/misses|evaluations|beats/.test(h.rule.toString()), `${h.id}: la regla no lee los errores`);
  }],
  ['evaluate() no cambia el estado', () => {
    const s = st({ clues: ['ronda', 'silencio'], deductions: ['d_ronda'] });
    const before = clone(s);
    evaluate(s);
    eq(s, before);
  }],
  // ------------------------------------------------------------ the question buck_window
  ['buck_window: visible con la pista ronda, no sin ella', () => {
    eq(QUESTIONS.buck_window.visible(st({ clues: ['dedos'] })), false);
    eq(QUESTIONS.buck_window.visible(st({ clues: ['ronda'] })), true);
  }],
  ['setPosition firme sin d_ronda escribe con basis vacía', () => {
    const s = st({ clues: ['ronda'] });
    eq(setPosition(s, 'buck_window', 'firme'), true);
    eq(s.investigation.revisions[0].basis, []);
  }],
  ['setPosition firme con d_ronda escribe la revisión con basis for:ded:d_ronda', () => {
    const s = st({ clues: ['ronda', 'silencio'], deductions: ['d_ronda'] });
    eq(setPosition(s, 'buck_window', 'firme'), true);
    eq(readPosition(s, 'buck_window'), 'firme');
    const r = s.investigation.revisions;
    eq(r.length, 1);
    eq(r[0].question, 'buck_window');
    eq(r[0].from, null);
    eq(r[0].to, 'firme');
    eq(r[0].basis, ['for:ded:d_ronda']);
  }],
  ['setPosition compatible escribe con basis for:clue:ronda', () => {
    const s = st({ clues: ['ronda'] });
    eq(setPosition(s, 'buck_window', 'compatible'), true);
    eq(s.investigation.revisions[0].basis, ['for:clue:ronda']);
  }],
  ['insuficiente escribe con basis []', () => {
    const s = st({ clues: ['ronda', 'silencio'], deductions: ['d_ronda'] });
    eq(setPosition(s, 'buck_window', 'insuficiente'), true);
    eq(readPosition(s, 'buck_window'), 'insuficiente');
    eq(s.investigation.revisions[0].basis, []);
  }],
  ['buck_window no se escribe despierto ni en la segunda lectura', () => {
    const a = st({ clues: ['ronda'], flags: { awake: true } });
    eq(setPosition(a, 'buck_window', 'compatible'), false, 'despierto');
    eq(a.investigation.revisions, [], 'despierto: sin revisión');
    const b = st({ clues: ['ronda'], flags: { second: true } });
    eq(setPosition(b, 'buck_window', 'compatible'), false, 'segunda lectura');
    eq(b.investigation.revisions, [], 'segunda lectura: sin revisión');
  }],
];
