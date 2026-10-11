// Sanity costs paid once (V4-12): looking at the same thing again shows it but takes nothing more. The
// helper G.sanityOnce keeps the mark in the flags (cost_<key>), so it is saved and survives a resume.
//   node web/tools/walk.mjs cost14
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, settle }) => {
    // the helper itself: the first call costs, the second does not
    const f = await fixture('saves-v1-baseline/c4.json');
    f.sanity = 60;
    await start('c4', f);
    await settle();
    const G = game.G;
    const s0 = game.state.sanity;
    need(G.sanityOnce('probe', -5) === true && game.state.sanity === s0 - 5, 'la primera vez la cuenta sí cobra');
    need(G.sanityOnce('probe', -5) === false && game.state.sanity === s0 - 5, 'la segunda vez no vuelve a cobrar');
    need(game.state.flags.cost_probe === true, 'la marca queda en las banderas, para guardar y reanudar');

    // a real look twice: the jars in the study
    const s1 = game.state.sanity;
    await act('jars');
    const afterFirst = game.state.sanity;
    need(afterFirst === s1 - 4, `el primer vistazo a los frascos cobra 4 (hay ${s1 - afterFirst})`);
    await act('jars');
    need(game.state.sanity === afterFirst, 'el segundo vistazo a los frascos no cobra');

    // and in the room of chapter three: the photograph, once
    await start('c3', await fixture('saves-v1-baseline/c3.json'));
    await settle();
    expectScene('room');
    game.state.sanity = 60;
    const p0 = game.state.sanity;
    await act('photo');
    const p1 = game.state.sanity;
    need(p0 - p1 === 4, `la fotografía cobra 4 la primera vez (hay ${p0 - p1})`);
    await act('photo');
    need(game.state.sanity === p1, 'la fotografía no cobra la segunda vez');
    return { jars: afterFirst, photo: [p0, p1] };
  }, opts);
}
