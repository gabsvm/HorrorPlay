// An interrupted confrontation with Greaves (V4-14, audit 05c15bd, P0): no resume point is written while a
// script is in flight (also when the app is minimised, __appPause), a resume after the file was read goes on
// from the confrontation without charging the first reading again, and the first reading still charges the
// discovery (−10, two clues, two thoughts) and the cut (−15).
//   node web/tools/walk.mjs greaves_resume14
import { scenario, fixture } from './harness.js';

const KEY = 'elhuesped.save.v1.resume';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, waitScene, flag, settle }) => {
    // 0. the first reading: the discovery and the cut, once each
    const f = await fixture('saves-v1-baseline/c4.json');
    f.clues = [...new Set([...f.clues, 'carta'])];
    f.sanity = 60;   // high enough that no cost is cut short by the floor at zero
    f.flags.file_read = false;
    f.flags.awake = false;
    delete f.flags.greaves_done;
    await start('c4', f);
    expectScene('greaves');
    await act('drawer', 'bisturi');
    const s0 = game.state.sanity;
    const n0 = window.LOG.length;
    await act('cabinet', 'llave', ['Todavía no sé quién la escribió.', 'acusando', 'Deténgame']);
    await waitScene('foreshore');
    const first = window.LOG.slice(n0).join('\n');
    need(game.state.clues.includes('expediente') && game.state.clues.includes('respuesta1879'), 'la primera lectura da sus dos pistas');
    need(/No puedo seguir llamándolo una coincidencia/.test(first), 'la primera lectura dice su primer pensamiento');
    need(game.state.sanity - s0 === -25, `la primera lectura cobra el descubrimiento (−10) y el corte (−15), hay ${game.state.sanity - s0}`);

    // 1. a resume point is a moment when the player has control: a save taken while a script runs is skipped
    await start('c4', await fixture('saves-v1-baseline/c4.json'));
    await settle();
    window.FAST = false;
    localStorage.removeItem(KEY);
    game.autosave();
    need(localStorage.getItem(KEY) !== null, 'control: sin guion en curso el punto de reanudación sí se guarda');
    localStorage.removeItem(KEY);
    game.running++;
    game.autosave();
    need(localStorage.getItem(KEY) === null, 'un guardado tomado con un guion en curso no debe escribirse');
    window.__appPause();   // the app is minimised in the middle of a script
    game.running--;
    window.FAST = true;
    need(localStorage.getItem(KEY) === null, 'minimizar la app a mitad de un guion no debe escribir el punto de reanudación');

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
