// What a run makes the player read: lines said or thought (and their characters), choices, cards.
// Reads a log written by `WALK_LOG=file node tools/walk.mjs ...`.
//   node web/tools/read-count.mjs run.log [other.log ...]
import { readFileSync } from 'node:fs';

for (const f of process.argv.slice(2)) {
  const L = readFileSync(f, 'utf8').split('\n');
  const said = L.filter((l) => /^[^#[ >].{0,40}?: /.test(l));
  const chars = said.reduce((n, l) => n + l.split(': ').slice(1).join(': ').length, 0);
  const choices = L.filter((l) => l.startsWith('  >')).length;
  const cards = L.filter((l) => l.startsWith('[') && !/^\[(aviso|documento|golpes|firma)/.test(l)).length;
  const docs = L.filter((l) => l.startsWith('[documento')).length;
  console.log(`${f}: ${said.length} líneas dichas o pensadas (${chars} caracteres), ${choices} elecciones, ${cards} rótulos, ${docs} documentos`);
}
