// An interrupted confrontation with Greaves (V4-14, audit 05c15bd, P0): no resume point is written while a
// script is in flight, and a resume after the file was read goes on from the confrontation without charging
// the first reading again (the -10 of the discovery is taken once, the -15 of the cut is taken in the scene).
//   node web/tools/walk.mjs greaves_resume14
import { scenario, fixture } from './harness.js';

const KEY = 'elhuesped.save.v1.resume';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, waitScene, flag, settle }) => {
    await start('c4', await fixture('saves-v1-baseline/c4.json'));
    await settle();

    // 1. a resume point is a moment when the player has control: a save taken while a script runs is skipped
    window.FAST = false;
    localStorage.removeItem(KEY);
    game.autosave();
    need(localStorage.getItem(KEY) !== null, 'control: sin guion en curso el punto de reanudación sí se guarda');
    localStorage.removeItem(KEY);
    game.running++;
    game.autosave();
    game.running--;
    window.FAST = true;
    need(localStorage.getItem(KEY) === null, 'un guardado tomado con un guion en curso no debe escribirse');

    // 2. the confrontation was interrupted after the file was read, and before it ended: resume at the cabinet
    const sanity = 60;
    const st = JSON.parse(JSON.stringify(game.state));
    st.scene = 'greaves';
    st.sanity = sanity;
    st.flags.file_read = true;
    st.flags.cabinet_open = true;
    st.flags.drawer_open = true;
    st.flags.awake = false;
    delete st.flags.greaves_done;
    await game.resume({ state: st, x: 1100, facing: -1 });
    await settle();
    expectScene('greaves');
    await act('cabinet', null, ['acusando', 'Deténgame']);
    await waitScene('foreshore');
    expectScene('foreshore');
    need(flag('greaves_done'), 'la confrontación interrumpida debe terminar al reanudar');
    need(game.state.sanity === sanity - 15, `reanudar cobra solo el corte (esperaba ${sanity - 15}, hay ${game.state.sanity})`);
    await settle();
    return { sanity: game.state.sanity };
  }, opts);
}
