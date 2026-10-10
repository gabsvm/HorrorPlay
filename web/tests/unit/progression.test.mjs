// The story's gates, asked of plain states.
import { normalizeState, canFinishC1, canLeaveHanbury, canStartSeance, canLeaveMitre, canLeaveRoomC3b, canEnterFinale, finalSources, currentGate, gateDeductions } from '../../src/story/progression.js';
import { evaluate, statuses } from '../../src/story/theories.js';
import { ok, eq } from './assert.mjs';
import { readFileSync } from 'node:fs';

const st = (o = {}) => normalizeState({ chapter: 'c1', scene: 'knackers', flags: {}, items: [], clues: [], deductions: [], profile: [], sanity: 100, ...o });
const fixture = (p) => JSON.parse(readFileSync(new URL(`../fixtures/${p}`, import.meta.url), 'utf8'));

export const tests = [
  // ------------------------------------------------------------ saves
  ['normalizeState rellena lo que falta sin tocar lo que hay', () => {
    const s = normalizeState({ flags: { answered1866: false, peine_taken: true }, clues: ['zurdo', 'zurdo'] });
    eq(s.clues, ['zurdo']);
    eq(s.items, []);
    eq(s.flags.entry_year, 1879);
    eq(s.flags.comb_custody, 'thomas');
    ok(s.investigation && s.investigation.hypotheses, 'falta investigation');
    eq(s.sanity, 100);
  }],
  ['normalizeState es idempotente', () => {
    const a = normalizeState(fixture('legacy-c3-pre-v3.json'));
    const b = normalizeState(JSON.parse(JSON.stringify(a)));
    eq(a, b);
  }],
  ['un guardado anterior a la V3 conserva pistas, deducciones y flags', () => {
    const raw = fixture('legacy-c3-pre-v3.json');
    const s = normalizeState(JSON.parse(JSON.stringify(raw)));
    eq(s.clues, raw.clues); eq(s.deductions, raw.deductions);
    for (const k of Object.keys(raw.flags)) eq(s.flags[k], raw.flags[k], k);
    eq(s.flags.entry_year, raw.flags.answered1866 ? 1866 : 1879);
  }],
  ['entry_year no se reescribe si ya existe', () => {
    eq(normalizeState({ flags: { answered1866: false, entry_year: 1879 } }).flags.entry_year, 1879);
    eq(normalizeState({ flags: { answered1866: true, entry_year: 1866 } }).flags.entry_year, 1866);
  }],
  // ------------------------------------------------------------ chapter I
  ['C1 prudente: bisturí y una conclusión, sin sospechar de Brennan', () => {
    const s = st({ clues: ['zurdo', 'anatomia', 'bisturi'], deductions: ['d_bisturi'], flags: { wren_met: true } });
    ok(canFinishC1(s).ok, JSON.stringify(canFinishC1(s).missing));
  }],
  ['C1 tradicional: d_brennan y d_bisturi', () => {
    const s = st({ clues: ['zurdo', 'anatomia', 'bisturi', 'brennan_zurdo'], deductions: ['d_brennan', 'd_bisturi'], flags: { wren_met: true } });
    ok(canFinishC1(s).ok);
  }],
  ['C1: cualquier conclusión con pruebas sirve (ronda, confianza, zurdo)', () => {
    for (const d of ['d_ronda', 'd_confianza', 'd_zurdo']) ok(canFinishC1(st({ clues: ['zurdo', 'bisturi'], deductions: [d], flags: { wren_met: true } })).ok, d);
  }],
  ['C1: sin bisturí, sin Wren o sin conclusión no se cierra, y dice qué falta', () => {
    const noScalpel = canFinishC1(st({ clues: ['zurdo'], deductions: ['d_zurdo'], flags: { wren_met: true } }));
    ok(!noScalpel.ok && /Wren encontró/.test(noScalpel.missing[0]), noScalpel.missing.join('|'));
    const noWren = canFinishC1(st({ clues: ['zurdo'], deductions: ['d_zurdo'] }));
    ok(!noWren.ok && /niña/.test(noWren.missing[0]));
    const noDed = canFinishC1(st({ clues: ['zurdo', 'bisturi'], flags: { wren_met: true } }));
    ok(!noDed.ok && /conclusión/.test(noDed.missing[0]));
    ok(!canFinishC1(st({ clues: ['bisturi'], deductions: ['d_bisturi'], flags: { wren_met: true } })).ok, 'sin el forense no');
  }],
  ['C1: la hipótesis del barro no es una conclusión', () => {
    ok(!canFinishC1(st({ clues: ['zurdo', 'bisturi'], deductions: ['d_barro'], flags: { wren_met: true } })).ok);
  }],
  // ------------------------------------------------------------ chapters II-III
  ['Hanbury: delantal, médico y una decisión sobre el peine, sea cual sea', () => {
    ok(!canLeaveHanbury(st({ clues: ['delantal'], flags: { greaves_met: true } })).ok);
    ok(canLeaveHanbury(st({ clues: ['delantal'], flags: { greaves_met: true, peine_taken: true, comb_custody: 'pike' } })).ok);
    ok(canLeaveHanbury(st({ clues: ['delantal'], flags: { greaves_met: true, peine_taken: true, comb_custody: 'thomas' } })).ok);
  }],
  ['Sesión: los golpes se leen antes', () => {
    ok(!canStartSeance(st({ flags: { peine_taken: true } })).ok);
    ok(canStartSeance(st({ clues: ['hospes'], flags: { peine_taken: true } })).ok);
  }],
  ['Mitre y el cuarto de la carta piden lo que dicen', () => {
    eq(canLeaveMitre(st({ flags: { mitre_badge: true }, clues: ['trozo'] })).missing.length, 1);
    ok(canLeaveMitre(st({ flags: { mitre_badge: true }, clues: ['trozo', 'testigo'] })).ok);
    ok(canLeaveRoomC3b(st({ flags: { paper_read: true }, clues: ['letra', 'estuche'] })).ok);
  }],
  // ------------------------------------------------------------ chapter IV
  ['el final cuenta fuentes independientes, y el barro no cuenta', () => {
    eq(finalSources(st({ deductions: ['f_zurdo', 'f_barro'] })), ['forense']);
    ok(!canEnterFinale(st({ deductions: ['f_zurdo', 'f_anat', 'f_barro'] })).ok);
    ok(canEnterFinale(st({ deductions: ['f_zurdo', 'f_anat', 'f_exp'] })).ok);
  }],
  ['currentGate según el lugar', () => {
    ok(currentGate(st({ scene: 'hanbury' })).missing.length === 3);
    eq(currentGate(st({ scene: 'greaves', chapter: 'c4' })), null);
  }],
  // ------------------------------------------------------------ theories
  ['las teorías aparecen con su primera prueba, no antes', () => {
    eq(evaluate(st()), []);
    const t = evaluate(st({ clues: ['ventana'] }));
    eq(t.map((x) => x.id), ['intruso']);
    eq(t[0].hyps.find((h) => h.id === 'intruso').status, 'plausible');
  }],
  ['Brennan deja de estar demostrado con su coartada y el delantal de John Richardson', () => {
    const s = st({ clues: ['brennan_zurdo', 'delantal'], deductions: ['d_brennan'], flags: { br_alibi: true, amelia1: true } });
    eq(statuses(s)['brennan.brennan'], 'no demostrada');
    eq(statuses(s)['brennan.prensa'], 'plausible');
  }],
  ['nada declara a Thomas culpable antes de despertar', () => {
    const s = st({ clues: ['botas', 'huellas', 'dedos', 'expediente', 'regla', 'nat_voz', 'hospes'], deductions: ['d_rojo'] });
    const v = statuses(s);
    ok(!Object.values(v).includes('sostenida'), JSON.stringify(v));
    s.flags.awake = true;
    eq(statuses(s)['intruso.yo'], 'sostenida');
  }],
  // ------------------------------------------------------------ what the hint may offer
  ['gateDeductions: en C1, las conclusiones que cierran la noche, Brennan la última', () => {
    const s = st({ clues: ['zurdo'], flags: { wren_met: true } });
    eq(gateDeductions(s), ['d_bisturi', 'd_zurdo', 'd_ronda', 'd_confianza', 'd_brennan']);
    eq(gateDeductions(st({ deductions: ['d_ronda'] })), []);
    eq(gateDeductions(st({ scene: 'hanbury', chapter: 'c2' })), []);
  }],
  ['gateDeductions: en el final, solo fuentes nuevas y nunca el barro', () => {
    const s = st({ chapter: 'c4', scene: 'foreshore', flags: { awake: true }, deductions: ['f_zurdo', 'f_anat'] });
    eq(gateDeductions(s), ['f_testigo', 'f_ronda', 'f_exp']);
  }],
];
