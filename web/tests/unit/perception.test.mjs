// The sanity bands and what each one gives and costs.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { perceptionBand, perception } from '../../src/story/perception.js';
import { ok, eq } from './assert.mjs';

// every source file under src/, as one text
const sourceText = (dir = new URL('../../src/', import.meta.url)) => readdirSync(dir).map((f) => {
  const u = new URL(f + (statSync(new URL(f, dir)).isDirectory() ? '/' : ''), dir);
  if (statSync(u).isDirectory()) return sourceText(u);
  return u.pathname.endsWith('.js') ? readFileSync(u, 'utf8') : '';
}).join('\n');

export const tests = [
  ['umbrales: 10, 35, 36, 64, 65, 100', () => {
    eq([10, 35, 36, 64, 65, 100].map(perceptionBand), ['frayed', 'frayed', 'strained', 'strained', 'steady', 'steady']);
  }],
  ['sin valor cuenta como entero', () => eq(perceptionBand(undefined), 'steady')],
  ['cada banda tiene algo a favor', () => {
    ok(perception.forensicMarks(90) && perception.beatsHelpAfter(90) === 1, 'firme: marcas forenses y ayuda antes en las rondas');
    ok(perception.knockHelpStart(20) === 1 && perception.waterGlow(20), 'desgastado: el método de los golpes y la luz del agua');
  }],
  ['y algo en contra, nunca un bloqueo', () => {
    eq(perception.whisperChance(90), 0);
    ok(perception.whisperChance(50) > 0 && perception.whisperChance(20) > perception.whisperChance(50));
    ok(perception.doubtTheories(20) && !perception.doubtTheories(50));
    ok(perception.othersNotice(20) && !perception.othersNotice(70));
  }],
  ['los extremos caen en su banda: 0 desgastado, 100 firme', () => {
    eq([0, 100].map(perceptionBand), ['frayed', 'steady']);
    eq(perception.whisperChance(0), 0.35);
    eq(perception.whisperChance(100), 0);
  }],
  ['ninguna banda termina la partida: no hay cierre por cordura en el código', () => {
    const text = sourceText();
    ok(!/game ?over|gameover|finPorCordura/i.test(text), 'hay una pantalla de fin por cordura');
    ok(!/sanity\s*(<=?|===?)\s*0\s*\)\s*\{/.test(text), 'hay una comprobación que cierra el juego con cordura 0');
  }],
];
