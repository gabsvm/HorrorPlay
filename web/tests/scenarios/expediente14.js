// The clinic file is a one-time sequence (V4-14): the first reading runs Greaves's scene and the cost; a
// second look from the cabinet only shows the page, and changes neither sanity nor the state.
//   node web/tools/walk.mjs expediente14
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, need, settle }) => {
    await start('c4', await fixture('saves-v1-baseline/c4.json'));
    await settle();
    game.state.flags.file_read = true;
    game.state.flags.greaves_done = true;   // the confrontation is finished: a second look is the page only
    const before = JSON.stringify({ sanity: game.state.sanity, flags: game.state.flags, clues: game.state.clues });
    await game.chapterHooks.readFile(game.G);
    await settle();
    const after = JSON.stringify({ sanity: game.state.sanity, flags: game.state.flags, clues: game.state.clues });
    need(before === after, 'releer el expediente cambia el estado (cordura, flags o pistas)');
    return {};
  }, opts);
}
