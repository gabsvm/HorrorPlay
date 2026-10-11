// The final gate (V4-14): three independent sources. Perceptions, the historical clue and conclusions
// built on the same forensic reading never count as sources of their own.
import { FINAL_SOURCES, finalSources, canEnterFinale } from '../../src/story/progression.js';
import { ok, eq } from './assert.mjs';

const st = (deductions, clues = []) => ({ deductions, clues, flags: {} });

export const tests = [
  ['la percepción de Goulston y la pista histórica no son fuentes finales', () => {
    const ids = Object.keys(FINAL_SOURCES);
    for (const id of ['aqui_estoy', 'd_aqui', 'goulston_historic', 'chase_blood']) ok(!ids.includes(id), `${id} es fuente final`);
  }],
  ['las conclusiones de zurdera (d_zurdo, d_bisturi) no cuentan como fuentes finales', () => {
    eq(finalSources(st(['d_zurdo', 'd_bisturi'])), []);
  }],
  ['zurdera y anatomía del forense cuentan como una sola fuente de forense', () => {
    eq(finalSources(st(['f_zurdo', 'f_anat'])).length, 2);   // forense y objeto: dos fuentes distintas
    eq(finalSources(st(['f_zurdo'])), ['forense']);
  }],
  ['el barro y dos fuentes no abren el final', () => {
    ok(!canEnterFinale(st(['f_zurdo', 'f_anat', 'f_barro'])).ok, 'el barro hizo de tercera fuente');
    ok(!canEnterFinale(st(['f_zurdo', 'f_testigo'])).ok, 'dos fuentes abren el final');
  }],
  ['tres fuentes distintas, con o sin el forense, abren el final', () => {
    ok(canEnterFinale(st(['f_zurdo', 'f_anat', 'f_testigo'])).ok, 'forense, objeto y testigo');
    ok(canEnterFinale(st(['f_anat', 'f_testigo', 'f_exp'])).ok, 'sin forense');
  }],
];
