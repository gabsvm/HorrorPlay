// Brennan after the night is closed (V4-04). Wren's «No fue él» is a piece of evidence against Brennan
// only when Thomas closed the night with him (flag v4_wren_not_him, set in endC1 and migrated from
// routes.c1.closedAt). The mob's lines do not call him guilty, the line about Tomkins is gone, and the
// apron deduction says only what Thomas can see.
import { normalizeState } from '../../src/story/progression.js';
import { evaluate, statuses } from '../../src/story/theories.js';
import { QUESTIONS, readPosition, setPosition } from '../../src/story/positions.js';
import { DEDUCTIONS } from '../../src/story/data.js';
import { ok, eq } from './assert.mjs';
import { readFileSync, readdirSync } from 'node:fs';

const st = (o = {}) => normalizeState({ chapter: 'c1', scene: 'knackers', flags: {}, items: [], clues: [], deductions: [], profile: [], sanity: 100, ...o });
const clone = (x) => JSON.parse(JSON.stringify(x));
const read = (p) => JSON.parse(readFileSync(new URL(`../fixtures/${p}`, import.meta.url), 'utf8'));
const WREN = 'Wren: «No fue él»';
const brennanHyp = (s) => evaluate(s).find((t) => t.id === 'brennan').hyps.find((h) => h.id === 'brennan');
// every saved state the tests keep: the baseline and second-reading saves, and the pre-V3 save
const FIXTURES = [
  ...['saves-v1-baseline', 'saves-v1-baseline-second'].flatMap((d) => readdirSync(new URL(`../fixtures/${d}/`, import.meta.url))
    .filter((f) => f.endsWith('.json')).sort().map((f) => [`${d}/${f}`, read(`${d}/${f}`)])),
  ['legacy-c3-pre-v3.json', read('legacy-c3-pre-v3.json')],
];
// every file under web/src, as text
const SRC_FILES = (function list(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = new URL(`${e.name}${e.isDirectory() ? '/' : ''}`, dir);
    return e.isDirectory() ? list(p) : e.name.endsWith('.js') ? [p] : [];
  });
})(new URL('../../src/', import.meta.url));

export const tests = [
  // ------------------------------------------------------------ the proof of Wren
  ['cerrada con Pike (closedAt bucks_row), la prueba «No fue él» no está en la hipótesis brennan', () => {
    const s = st({ investigation: { routes: { c1: { closedAt: 'bucks_row', stance: 'unsure', conclusions: [] } } },
      flags: { c1_done: true, brennan_stance: 'unsure' }, clues: ['brennan_zurdo'], deductions: ['d_brennan'] });
    ok(!s.flags.v4_wren_not_him, 'la migración no activa la prueba con Pike');
    ok(!brennanHyp(s).against.includes(WREN), 'con Pike no se cita a Wren');
  }],
  ['cerrada con Brennan (closedAt knackers), la prueba «No fue él» sí está', () => {
    const s = st({ investigation: { routes: { c1: { closedAt: 'knackers', stance: 'unsure', conclusions: [] } } },
      flags: { c1_done: true, brennan_stance: 'unsure' }, clues: ['brennan_zurdo'], deductions: ['d_brennan'] });
    ok(s.flags.v4_wren_not_him === true, 'la migración activa la prueba con Brennan');
    ok(brennanHyp(s).against.includes(WREN), 'con Brennan se cita a Wren');
  }],
  ['la prueba cuenta contra Brennan: con ella y su coartada, no demostrada; sin ella, plausible', () => {
    const base = { clues: ['brennan_zurdo', 'delantal'], deductions: ['d_brennan'], flags: { br_alibi: true } };
    eq(statuses(st(clone(base)))['brennan.brennan'], 'plausible', 'sin la prueba de Wren');
    eq(statuses(st({ ...clone(base), flags: { br_alibi: true, v4_wren_not_him: true } }))['brennan.brennan'], 'no demostrada', 'con la prueba de Wren');
  }],
  // ------------------------------------------------------------ migration
  ['normalizeState dos veces da el mismo resultado, en todos los fixtures', () => {
    for (const [name, f] of FIXTURES) {
      const once = normalizeState(clone(f));
      const twice = normalizeState(clone(once));
      eq(twice, once, name);
    }
    const closed = st({ investigation: { routes: { c1: { closedAt: 'knackers' } } } });
    eq(normalizeState(clone(closed)), closed, 'con Brennan, idempotente');
  }],
  ['un guardado sin routes.c1 no recibe la prueba de Wren (todos los fixtures)', () => {
    for (const [name, f] of FIXTURES) {
      ok(!f.investigation?.routes?.c1, `${name} no trae routes.c1`);
      ok(!normalizeState(clone(f)).flags.v4_wren_not_him, `${name} no debe tener v4_wren_not_him`);
    }
  }],
  ['la migración solo activa el flag: un flag ya puesto no se borra con otra ruta', () => {
    const s = st({ flags: { v4_wren_not_him: true }, investigation: { routes: { c1: { closedAt: 'bucks_row' } } } });
    eq(s.flags.v4_wren_not_him, true);
  }],
  // ------------------------------------------------------------ text
  ['el texto del juego (web/src) no contiene «Tomkins»', () => {
    for (const f of SRC_FILES) ok(!readFileSync(f, 'utf8').includes('Tomkins'), `${f.pathname} nombra a Tomkins`);
  }],
  ['la línea de Brennan en la turba es «¡Pregúntenle a los del turno! ¡He trabajado toda la noche!»', () => {
    const src = readFileSync(new URL('../../src/story/chapters.js', import.meta.url), 'utf8');
    ok(src.includes("'¡Pregúntenle a los del turno! ¡He trabajado toda la noche!'"), 'falta la línea nueva');
  }],
  ['d_delantal tiene el texto acordado, sin nombrar a la casera ni a su hijo', () => {
    const d = DEDUCTIONS.find((x) => x.id === 'd_delantal');
    eq(d.text, 'El delantal del patio se parece al de Brennan. No sé de quién es; un parecido no es un vínculo.');
    ok(!/casera|hijo/i.test(d.text), 'el texto de d_delantal nombra a la casera o a su hijo');
    eq(d.flag, 'acusar_brennan', 'mismo flag');
    eq(d.denialLate, true, 'mismo denialLate');
  }],
  // ------------------------------------------------------------ the notebook's position
  ['pulsar «Pudo ser Brennan» (br_suspect) no cambia brennan_stance ni brennan_outcome', () => {
    ok(QUESTIONS.br_suspect, 'existe la pregunta br_suspect');
    const s = st({ clues: ['brennan_zurdo'], flags: { brennan_stance: 'unsure', brennan_outcome: 'protected' } });
    const flagsBefore = clone(s.flags);
    eq(setPosition(s, 'br_suspect', 'brennan'), true, 'la postura se guarda');
    eq(readPosition(s, 'br_suspect'), 'brennan');
    eq(s.flags, flagsBefore, 'ninguna bandera cambia');
    eq(s.flags.brennan_stance, 'unsure');
    eq(s.flags.brennan_outcome, 'protected');
  }],
];
