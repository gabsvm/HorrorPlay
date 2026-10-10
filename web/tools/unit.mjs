// Pure-logic tests: no DOM, no canvas. Each file in tests/unit/ exports `tests`, a list of
// [name, fn]; fn throws on failure.
//   node web/tools/unit.mjs
import { readdirSync } from 'node:fs';

const dir = new URL('../tests/unit/', import.meta.url);
let pass = 0, fail = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith('.test.mjs')).sort()) {
  const { tests } = await import(new URL(f, dir));
  for (const [name, fn] of tests) {
    try { await fn(); pass++; } catch (e) { fail++; console.log(`FALLO ${f} › ${name}\n  ${e.message}`); }
  }
}
console.log(`${pass} pruebas bien, ${fail} mal`);
process.exit(fail ? 1 : 0);
