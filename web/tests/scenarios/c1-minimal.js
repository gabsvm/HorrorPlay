// Chapter one with only what it needs: no tracks, no body, no beat sheet, no Neil, no boy, and no
// suspicion of Brennan. Going back and forth between the two streets never closes the night by
// itself; it closes when Thomas says so, and the next chapter starts once.
//   node web/tools/walk.mjs c1-minimal
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, deduce, need, expectScene, waitScene, flag }) => {
    await start('c1', await fixture('saves-v1-baseline/c1.json'));
    await act('coat'); await act('boots'); await act('lantern');
    await act('door'); expectScene('bucks_row');
    await act('pike', null, ['médico']);
    await act('pike', null, ['trabaja de noche']);
    await act('west'); expectScene('knackers');
    await act('wren', null, ['Dejarle el penique', 'Por qué']);
    need(game.state.clues.includes('bisturi'), 'Falta el bisturí');
    // the scalpel is in hand and nothing is concluded yet: the night cannot be closed
    need(!flag('c1_done'), 'No debería poder cerrarse sin una conclusión');
    await deduce('bisturi', 'anatomia');
    need(game.state.scene === 'knackers' && !flag('c1_done'), 'La deducción no debe cerrar la noche sola');
    // back and forth: no transition on entering either street
    await act('east'); expectScene('bucks_row');
    await act('west'); expectScene('knackers');
    need(!flag('c1_done') && game.state.chapter === 'c1', 'Volver al desolladero no debe cerrar la noche');
    // closed with Brennan, unsure
    const chapters = window.LOG.filter((l) => /Capítulo II/.test(l)).length;
    await act('brennan', null, ['Esto es todo', 'todavía no lo sé']);
    await waitScene('hanbury');
    expectScene('hanbury');
    need(flag('brennan_stance') === 'unsure', 'Debería constar la duda sobre Brennan');
    need(window.LOG.filter((l) => /Capítulo II/.test(l)).length === chapters + 1, 'El capítulo II debe empezar una sola vez');
    need(!game.state.deductions.includes('d_brennan'), 'No se sospechó de Brennan en ningún momento');
    return { route: game.state.investigation.routes.c1 };
  }, opts);
}
