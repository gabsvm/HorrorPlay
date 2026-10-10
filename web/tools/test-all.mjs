// Every automated check, one after another, with a summary at the end.
//   node web/tools/test-all.mjs [--quick]     (--quick skips the long playthroughs)
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const web = fileURLToPath(new URL('..', import.meta.url));
const quick = process.argv.includes('--quick');
const runs = [
  ['unit', ['tools/unit.mjs']],
  ['smoke', ['tools/smoke.mjs']],
  ['audio', ['tools/audio-smoke.mjs']],
  ['integrity', ['tools/walk.mjs', 'integrity']],
  ['compat', ['tools/walk.mjs', 'compat']],
  ...(quick ? [] : [
    ['walk', ['tools/walk.mjs']],
    ['walk second', ['tools/walk.mjs', 'second']],
    ['walk alt', ['tools/walk.mjs', 'alt']],
    ...(process.env.SCENARIOS || '').split(',').filter(Boolean).map((s) => [`walk ${s}`, ['tools/walk.mjs', s]]),
  ]),
];
const results = [];
for (const [name, args] of runs) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, args, { cwd: web, encoding: 'utf8' });
  const ok = r.status === 0;
  results.push([name, ok, ((Date.now() - t0) / 1000).toFixed(1)]);
  if (!ok) console.log(`\n--- ${name} ---\n${(r.stdout || '').slice(-2500)}${(r.stderr || '').split('\n').filter((l) => !/ExperimentalWarning|trace-warnings/.test(l)).join('\n').slice(-1500)}`);
}
console.log('');
for (const [name, ok, s] of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(28)} ${s}s`);
process.exit(results.every((r) => r[1]) ? 0 : 1);
