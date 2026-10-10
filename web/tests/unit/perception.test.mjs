// The sanity bands and what each one gives and costs.
import { perceptionBand, perception } from '../../src/story/perception.js';
import { ok, eq } from './assert.mjs';

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
];
