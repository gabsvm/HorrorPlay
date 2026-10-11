// Where the chase went wrong first (V4-14, audit 05c15bd): the street the city names is the one of the first
// wrong turn (alleys.js). One run per junction: a face seen at Wentworth, at Flower and Dean, at Thrawl. Pike,
// at the end, names the same street, and the notebook tags the blood (data.js chaseStreet) with it.
//   node web/tools/walk.mjs chase14
import { scenario, fixture } from './harness.js';

const RUNS = [
  // [junction picks, chase_seen_at, the street Pike names]
  [[1, 1, 1], 'wentworth', /te vio la cara en Wentworth Street/],
  [[0, 0, 1], 'flower_dean', /te vio la cara en Flower and Dean Street/],
  [[0, 1, 0], 'thrawl', /te vio la cara en Thrawl Street/],
];

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, waitScene, flag, settle }) => {
    const snap = await fixture('saves-v1-baseline/c3.json');
    for (const [junctions, at, pikeSays] of RUNS) {
      await start('c3', snap);
      await act('desk'); await act('door'); await act('bed');
      await act('watkins', 'placa', ['Aldgate']);
      await act('watkins', null, ['vio algo']);
      await act('watkins', null, ['encontrado']);
      await act('corner');
      await act('east'); expectScene('goulston');
      await act('doorway', null, ['Correr', ...junctions]);
      await waitScene('room');
      need(flag('chase_outcome') === 'spotted', `Un error o dos: se ve la cara (${junctions}) y no ${flag('chase_outcome')}`);
      need(flag('chase_seen_at') === at, `El primer error queda en ${at}, no en ${flag('chase_seen_at')} (${junctions})`);
      // the notebook's tag for the blood names the same street, whatever the first wrong turn was
      need(game.clues.chase_blood.tag(game.state) === { wentworth: 'Wentworth Street', flower_dean: 'Flower and Dean Street', thrawl: 'Thrawl Street' }[at], `La etiqueta de la sangre no sigue la calle (${at})`);
      await act('paper');
      await act('desk', null, ['La muestra no basta']);
      await act('bed');
      await act('door');
      await waitScene('greaves');
      expectScene('greaves');
      await act('drawer', 'bisturi');
      const n = window.LOG.length;
      await act('cabinet', 'llave', ['Todavía no sé quién la escribió.', 'acusando', 'Deténgame']);
      await waitScene('foreshore');
      expectScene('foreshore');
      const log = window.LOG.slice(n).join('\n');
      need(pikeSays.test(log), `Pike no nombra la calle del primer error (${at})`);
    }
    await settle();
    return { runs: RUNS.length };
  }, opts);
}
