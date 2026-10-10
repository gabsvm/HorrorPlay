// The game itself never turns on the tests' fast mode, sends nothing over the network, and keeps
// the save key and the checkpoints where old saves expect them.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { ok } from './assert.mjs';

const root = new URL('../../src/', import.meta.url);
function files(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const u = new URL(f, dir);
    if (statSync(u).isDirectory()) out.push(...files(new URL(`${f}/`, dir)));
    else if (f.endsWith('.js')) out.push(u);
  }
  return out;
}
const src = files(root).map((u) => [u.pathname.split('/src/')[1], readFileSync(u, 'utf8')]);

export const tests = [
  ['el código del juego no activa el modo rápido de las pruebas', () => {
    for (const [f, s] of src) ok(!/window\.FAST\s*=(?!=)/.test(s), `${f} asigna window.FAST`);
  }],
  ['nada se envía por la red (ni métricas ni errores)', () => {
    for (const [f, s] of src) ok(!/sendBeacon|XMLHttpRequest|fetch\(\s*['"`]https?:/.test(s), `${f} parece enviar datos fuera`);
  }],
  ['las claves de guardado siguen siendo las de siempre', () => {
    const game = src.find(([f]) => f.endsWith('engine/game.js'))[1];
    ok(game.includes("'elhuesped.save.v1'"), 'SAVE_KEY cambió');
    for (const k of ['.resume', '.ch.', '.read', '.unlocked']) ok(game.includes(k), `falta ${k}`);
  }],
];
