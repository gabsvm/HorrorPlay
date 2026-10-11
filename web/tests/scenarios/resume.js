// Resuming after each major event: the place comes back without replaying its one-time entrance,
// nothing given is given twice, and decisions stay as they were. Then the epilogue's last card for
// each of Brennan's three outcomes.
//   node web/tools/walk.mjs resume
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, waitScene, settle, flag }) => {
    const resume = async () => {
      const n = window.LOG.length;
      const items = [...game.state.items], clues = [...game.state.clues];
      await game.resume({ state: JSON.parse(JSON.stringify(game.state)), x: Math.round(game.player.x), facing: 1 });
      await settle();
      const log = window.LOG.slice(n).join('\n');
      need(JSON.stringify(game.state.items) === JSON.stringify(items), `Reanudar cambió el inventario en ${game.state.scene}`);
      need(JSON.stringify(game.state.clues) === JSON.stringify(clues), `Reanudar cambió las pistas en ${game.state.scene}`);
      return log;
    };
    const checked = [];
    // chapter one: after Wren and the scalpel, in the yard
    await start('c1', await fixture('saves-v1-baseline/c1.json'));
    await act('coat'); await act('boots'); await act('lantern'); await act('door');
    await act('pike', null, ['médico']); await act('pike', null, ['trabaja de noche']);
    await act('west');
    await act('wren', null, ['Dejarle el penique', 'Por qué']);
    let log = await resume();
    expectScene('knackers');
    need(!/Lo veo al final|Hablar con Brennan y con la niña/.test(log) && !/No se acerque/.test(log), 'El desolladero no repite su entrada ni a Wren');
    need(flag('wren_paid') && game.state.items.includes('bisturi'), 'El pago y el bisturí siguen');
    checked.push('knackers');
    // Buck's Row on return: Pike's first words do not come again
    await act('east');
    log = await resume();
    expectScene('bucks_row');
    need(!/No pise junto al portón/.test(log), 'Buck\'s Row no repite a Pike');
    checked.push('bucks_row');
    // chapter two: after the comb's decision, and before the séance
    await start('c2', await fixture('saves-v1-baseline/c2.json'));
    await act('comb', null, ['Dárselo a Pike']);
    log = await resume();
    need(!/Los de la casa la llamaban Dark Annie/.test(log), 'Hanbury no repite su entrada');
    need(flag('comb_custody') === 'pike' && !game.state.items.includes('peine'), 'La custodia del peine se conserva');
    await act('greaves', null, ['corte']); await act('apron'); await act('passage');
    expectScene('seance');
    await act('chart'); await act('table');
    log = await resume();
    need(!/Ha llegado antes de lo previsto/.test(log), 'La sesión no repite el recibimiento de Wexley');
    need(flag('raps_heard') && !flag('seance_done'), 'Los golpes oídos, la sesión por hacer');
    checked.push('hanbury', 'seance');
    // chapter three: Mitre Square with the badge shown
    await start('c3', await fixture('saves-v1-baseline/c3.json'));
    await act('desk'); await act('door'); await act('bed');
    await act('watkins', 'placa', ['Aldgate']);
    log = await resume();
    need(!/¿Quién lo ha dejado entrar\?/.test(log), 'Mitre no repite a Watkins');
    need(flag('mitre_badge'), 'La placa enseñada se conserva');
    checked.push('mitre');
    // chapter four: the surgery, then the foreshore after the file
    await start('c4', await fixture('saves-v1-baseline/c4.json'));
    log = await resume();
    need(!/Vine por una respuesta|Si Greaves me miente/.test(log), 'La consulta no repite su entrada');
    await act('drawer', 'bisturi'); await act('cabinet', 'llave', ['Todavía no sé quién la escribió.', 'acusando', 'Proteja']);
    await waitScene('foreshore');
    const intent = flag('final_intent');
    log = await resume();
    expectScene('foreshore');
    need(flag('final_intent') === intent && flag('awake'), 'El acto final y el despertar se conservan al reanudar');
    checked.push('greaves', 'foreshore');
    // the epilogue's card for each of Brennan's outcomes
    for (const [outcome, card] of [['severe', /no volvió a andar sin bastón/], ['injured', /perdió su trabajo/], ['protected', /sin heridas aquella noche/]]) {
      await start('c4', await fixture('saves-v1-baseline/c4.json'));
      game.state.flags.brennan_outcome = outcome;
      const n = window.LOG.length;
      await game.goto('millers', { x: 160, facing: 1, fade: false });
      for (let i = 0; i < 400 && !game.inMenu; i++) await new Promise((r) => setTimeout(r, 20));
      need(card.test(window.LOG.slice(n).join('\n')), `El epílogo dice lo que fue de Brennan (${outcome})`);
    }
    checked.push('epilogue x3');
    return { checked };
  }, opts);
}
