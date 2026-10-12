// Sanity before Greaves (V4-12, option A): the three chase outcomes arrive at the cabinet with sanity between 25 and
// 45 (the main route is near 34), a look at the same thing again costs nothing, and an old save keeps its own value.
// The file's −10 and the cut's −15 are checked in expediente14.js and greaves_resume14.js.
//   node web/tools/walk.mjs sanity14
import { scenario, fixture } from './harness.js';

const RUNS = [
  [[0, 1, 1], 'clean'],
  [[0, 0, 1], 'one mistake (spotted)'],
  [[1, 0, 0], 'three mistakes (injured)'],
];
const LOW = 25, HIGH = 45;

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, waitScene, settle }) => {
    const snap = await fixture('saves-v1-baseline/c3.json');
    const arrivals = {};
    for (const [junctions, label] of RUNS) {
      await start('c3', snap);
      await act('desk'); await act('door'); await act('bed');
      await act('watkins', 'placa', ['Aldgate']);
      await act('watkins', null, ['vio algo']);
      await act('watkins', null, ['encontrado']);
      await act('corner');
      await act('east'); expectScene('goulston');
      await act('doorway', null, ['Correr', ...junctions]);
      await waitScene('room');
      await act('paper');
      await act('desk', null, ['La muestra no basta']);
      await act('bed');
      await act('door');
      await waitScene('greaves');
      const a = game.state.sanity;
      arrivals[label] = a;
      need(a >= LOW && a <= HIGH, `llegada a Greaves con cordura ${a} (${label}), fuera de ${LOW}–${HIGH}`);
    }
    // exploration: a second look at the jars costs nothing (the cost is paid once)
    const f = await fixture('saves-v1-baseline/c4.json');
    f.sanity = 30;
    await start('c4', f);
    await settle();
    const s0 = game.state.sanity;
    await act('jars');
    const s1 = game.state.sanity;
    need(s0 - s1 === 4, `el primer vistazo a los frascos cuesta 4 (cuesta ${s0 - s1})`);
    await act('jars');
    need(game.state.sanity === s1, 'un segundo vistazo a los frascos no debe costar');
    // an old save keeps its own sanity: loading it does not re-cost anything (the chapter's entry is the same as before)
    const old = await fixture('saves-v1-baseline/c4.json');
    old.sanity = 33;
    await start('c4', old);
    need(game.state.sanity === 40, `un guardado antiguo con 33 debe cargar con 40 (la entrada al capítulo, como antes): hay ${game.state.sanity}`);
    return { arrivals };
  }, opts);
}
