// The séance: the table knocks before anything begins, the reading can fail and fail again without
// sticking (the help grows, Wexley can read the first letters), the séance runs once only, the way
// out opens right after it, and an old save with the séance done but the raps unread still works.
//   node web/tools/walk.mjs seance
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, flag, settle }) => {
    await start('c2', await fixture('saves-v1-baseline/c2.json'));
    await act('greaves', null, ['corte']); await act('apron'); await act('comb', null, ['Guardármelo']);
    await act('passage'); expectScene('seance');
    // the comb before the knocks: Wexley says to listen first, nothing starts
    await act('table', 'peine');
    need(!flag('seance_done') && game.state.items.includes('peine'), 'Sin los golpes no hay sesión, y el peine sigue en el bolsillo');
    await act('table');
    need(flag('raps_heard'), 'La mesa golpea sola');
    // without the board: no way to read them, and it says so
    window.KNOCK_FAIL = false;
    await act('table');
    need(!game.state.clues.includes('hospes'), 'Sin la tabla no se leen');
    // with the board, three misses: the help grows each time, never stuck
    await act('chart');
    window.KNOCK_FAIL = true;
    for (let i = 0; i < 3; i++) await act('table');
    window.KNOCK_FAIL = false;
    const ev = game.state.investigation.evaluations.raps;
    need(ev && ev.misses === 3, `Los fallos se cuentan: ${JSON.stringify(ev)}`);
    need(/fila/.test(game.scene.hint(game.G) || ''), 'La ayuda de la escena explica fila y columna');
    await act('table');
    need(game.state.clues.includes('hospes') && flag('hospes_decoded'), 'Al cuarto intento se lee HOSPES');
    // the séance, once
    await act('table', 'peine');
    need(flag('seance_done'), 'La sesión empieza tras leer los golpes');
    const sessions = window.LOG.filter((l) => /Pongan las manos en la mesa/.test(l)).length;
    await act('table'); await act('table');
    need(window.LOG.filter((l) => /Pongan las manos en la mesa/.test(l)).length === sessions, 'No debe haber una segunda sesión');
    need(game.state.clues.filter((c) => c === 'hospes').length === 1, 'HOSPES una sola vez');
    // the way out, at once: no second puzzle after the scare
    await act('door', null, ['escolten', 'Era lo que había']);
    for (let i = 0; i < 300 && game.state.scene !== 'room'; i++) await new Promise((r) => setTimeout(r, 15));
    await settle();
    expectScene('room');
    // an old save: séance done, raps never read. The table still reads them; the door still opens.
    const old = await fixture('saves-v1-baseline/c2.json');
    await start('c2', old);
    Object.assign(game.state.flags, { seance_done: true, knock_board: true, se_intro: true, peine_taken: true, comb_on_table: true });
    game.state.clues = game.state.clues.filter((c) => c !== 'hospes');
    await game.goto('seance', { x: 300, noEnter: true });
    await act('table');
    need(game.state.clues.includes('hospes'), 'En un guardado viejo la mesa todavía lee los golpes');
    return { misses: ev.misses };
  }, opts);
}
