// Hanbury Street giving the comb to Pike: he keeps it (Thomas never has it), the yard is done in
// another order (the landlady, the comb, then the doctor, the apron last), a resume in between
// duplicates nothing, and the séance begins without the comb: Wexley knows anyway.
//   node web/tools/walk.mjs comb-pike
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, has, flag, settle }) => {
    await start('c2', await fixture('saves-v1-baseline/c2.json'));
    expectScene('hanbury');
    await act('amelia');
    await act('comb', null, ['Dárselo a Pike']);
    need(!has('peine') && flag('comb_custody') === 'pike' && flag('peine_taken'), 'El peine debería quedarse con Pike');
    // a resume right after the decision: still no comb, and it cannot be picked up again
    await game.resume({ state: JSON.parse(JSON.stringify(game.state)), x: 900, facing: 1 });
    await settle();
    need(!has('peine'), 'Reanudar no debe devolver el peine');
    need(!game.activeHotspots().some((h) => h.id === 'comb'), 'El peine no debe volver a estar junto a la valla');
    // leaving too early says what is missing
    await act('passage');
    expectScene('hanbury');
    await act('greaves', null, ['corte']);
    await act('pike');
    await act('apron');
    await act('passage');
    expectScene('seance');
    need(/Sentarse/.test(game.state.objective || ''), `El objetivo de la sesión no debería pedir el peine: ${game.state.objective}`);
    await act('wexley');
    await act('table');
    need(flag('seance_done'), 'La sesión debería empezar sin el peine');
    need(!flag('comb_on_table'), 'No hay peine sobre la mesa');
    need(!has('peine'), 'Nunca tuvo el peine');
    return { custody: flag('comb_custody') };
  }, opts);
}
