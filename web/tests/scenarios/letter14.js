// Thomas's reading of the letter, before Greaves shows the file (V4-14): offered once, in the first reading,
// before he wakes; it writes a posture (positions.js), never a flag, a clue or a gate. Once awake it is not
// offered at all, and the file still opens as before.
//   node web/tools/walk.mjs letter14
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, waitScene, flag, settle }) => {
    // first reading: the letter is in the notebook, so the posture is offered and written
    const s = await fixture('saves-v1-baseline/c4.json');
    s.clues = [...new Set([...s.clues, 'carta'])];
    s.flags.awake = false;
    await start('c4', s);
    expectScene('greaves');
    await act('drawer', 'bisturi');
    await act('cabinet', 'llave', ['La carta pudo escribirla Greaves.', 'acusando', 'Deténgame']);
    await waitScene('foreshore');
    need(game.state.investigation.positions.letter_author === 'greaves', 'la postura sobre la carta no se guardó');
    need(game.state.investigation.revisions.length === 1, 'la postura debe quedar en una sola revisión');
    need(flag('final_intent') === 'surrender', 'la intención final no cambia por la postura');

    // awake: not offered; the file goes straight on with the same picks it always had
    const t = await fixture('saves-v1-baseline/c4.json');
    t.clues = [...new Set([...t.clues, 'carta'])];
    t.flags.awake = true;
    await start('c4', t);
    expectScene('greaves');
    await act('drawer', 'bisturi');
    await act('cabinet', 'llave', ['acusando', 'Deténgame']);
    await waitScene('foreshore');
    need(game.state.investigation.positions.letter_author === undefined, 'despierto no se ofrece la postura');
    await settle();
    return { revisions: game.state.investigation.revisions.length };
  }, opts);
}
