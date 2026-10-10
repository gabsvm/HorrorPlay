// The story data and the scenes agree with each other: every deduction joins two clues that exist,
// ids are unique, every G.clue / G.give / G.goto in the source names something real, and no
// scene has two hotspots with the same id.
//   node web/tools/walk.mjs integrity
import { scenario } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, need }) => {
    const { readFileSync, readdirSync } = await import('node:fs');
    const clues = game.clues, items = game.itemDefs, deds = game.deductions;
    const seen = new Set();
    for (const d of deds) {
      need(!seen.has(d.id), `Deducción duplicada: ${d.id}`); seen.add(d.id);
      need(clues[d.a] && clues[d.b], `La deducción ${d.id} une pistas que no existen: ${d.a} + ${d.b}`);
    }
    const pairs = new Set();
    for (const d of deds) { const k = [d.a, d.b].sort().join('+'); need(!pairs.has(k), `Dos deducciones con la misma pareja: ${k}`); pairs.add(k); }
    for (const [id, sc] of Object.entries(game.scenes)) {
      const ids = new Set();
      for (const h of sc.hotspots || []) { need(!ids.has(h.id), `Hotspot repetido en ${id}: ${h.id}`); ids.add(h.id); }
    }
    // every literal id handed to the script API exists
    const root = new URL('../../src/', import.meta.url);
    const files = [...readdirSync(new URL('scenes/', root)).map((f) => new URL(`scenes/${f}`, root)), new URL('story/chapters.js', root)];
    let refs = 0;
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/G\.clue\('([a-z0-9_]+)'\)/g)) { refs++; need(clues[m[1]], `${f.pathname.split('/').pop()}: G.clue('${m[1]}') no existe`); }
      for (const m of src.matchAll(/G\.(?:give|take|has)\('([a-z0-9_]+)'\)/g)) { refs++; need(items[m[1]], `${f.pathname.split('/').pop()}: objeto '${m[1]}' no existe`); }
      for (const m of src.matchAll(/G\.goto\('([a-z_]+)'/g)) { refs++; need(game.scenes[m[1]], `${f.pathname.split('/').pop()}: escena '${m[1]}' no existe`); }
      for (const m of src.matchAll(/G\.deduced\('([a-z0-9_]+)'\)/g)) { refs++; need(seen.has(m[1]), `${f.pathname.split('/').pop()}: deducción '${m[1]}' no existe`); }
    }
    return { clues: Object.keys(clues).length, deductions: deds.length, refs };
  }, opts);
}
