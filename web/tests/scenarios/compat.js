// Saves from before this work still load: each chapter checkpoint of the baseline (both readings)
// and a save from before the V3 pass, missing the flags it added. The chapter starts in the right
// place, and a resume point taken right after does not replay the scene's one-time entrance.
//   node web/tools/walk.mjs compat
import { scenario, fixture } from './harness.js';

const START = { prologue: 'foreshore', c1: 'room', c2: 'hanbury', c3: 'room', c4: 'greaves' };

export async function run(opts) {
  return scenario(async ({ game, start, settle, need, expectScene }) => {
    const checked = [];
    for (const dir of ['saves-v1-baseline', 'saves-v1-baseline-second']) {
      for (const ch of Object.keys(START)) {
        const snap = await fixture(`${dir}/${ch}.json`);
        await start(ch, snap);
        expectScene(START[ch]);
        need(Array.isArray(game.state.clues) && Array.isArray(game.state.deductions), `${dir}/${ch}: estado sin listas`);
        for (const id of snap.clues) need(game.state.clues.includes(id), `${dir}/${ch}: se perdió la pista ${id}`);
        for (const id of snap.items) need(game.state.items.includes(id) || ch === 'c4', `${dir}/${ch}: se perdió el objeto ${id}`);
        checked.push(`${dir}/${ch}`);
      }
    }
    // a pre-V3 save at chapter three, without signature, year of entry or Brennan's outcome
    const legacy = await fixture('legacy-c3-pre-v3.json');
    await start('c3', legacy);
    expectScene('room');
    checked.push('legacy-c3-pre-v3');
    // a resume point taken in Hanbury Street: the entrance (Pike's first lines) does not run again
    await start('c2', await fixture('saves-v1-baseline/c2.json'));
    const before = window.LOG.length;
    await game.resume({ state: JSON.parse(JSON.stringify(game.state)), x: Math.round(game.player.x), facing: 1 });
    await settle();
    expectScene('hanbury');
    need(!window.LOG.slice(before).some((l) => /Annie Chapman\. Los de la casa/.test(l)), 'Reanudar repitió la entrada de Hanbury');
    checked.push('resume-hanbury');
    return { checked: checked.length };
  }, opts);
}
