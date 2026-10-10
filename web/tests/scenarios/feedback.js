// Nothing the player can click stays mute: blocked exits say what is missing, a second look is
// short, an item offered where it does nothing answers with something other than the last answer,
// and the dead exit of Buck's Row is gone.
//   node web/tools/walk.mjs feedback
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene }) => {
    const said = async (fn) => { const n = window.LOG.length; await fn(); return window.LOG.slice(n).filter((l) => !l.startsWith('###')); };

    // chapter one: Buck's Row
    await start('c1', await fixture('saves-v1-baseline/c1.json'));
    await act('coat'); await act('boots'); await act('lantern');
    // the desk a second time: no item twice, but something answers (a sound; nothing to read)
    await act('desk'); await act('desk');
    need(game.state.items.filter((i) => i === 'penique').length <= 1, 'El penique no debe duplicarse');
    await act('door'); expectScene('bucks_row');
    need(!game.activeHotspots().some((h) => h.id === 'east'), 'La salida muda hacia Baker\'s Row debería haberse quitado');
    const first = await said(() => act('tracks'));
    const second = await said(() => act('tracks'));
    need(first.length >= 2 && second.length === 1, `El rastro, la segunda vez, en una línea (${first.length} → ${second.length})`);
    // an item where it does nothing: two different answers in a row
    const w1 = await said(() => act('window', 'placa'));
    const w2 = await said(() => act('window', 'placa'));
    need(w1.length && w2.length && w1[0] !== w2[0], `Respuestas a un objeto mal usado: ${w1[0]} / ${w2[0]}`);
    // leaving west before Pike's lead: a reason
    const blocked = await said(() => act('west'));
    need(blocked.length && game.state.scene === 'bucks_row', 'La salida bloqueada debe explicar por qué');

    // chapter three: Mitre Square before the badge, and the way east before the witness
    await start('c3', await fixture('saves-v1-baseline/c3.json'));
    await act('desk'); await act('door'); await act('bed');
    expectScene('mitre');
    const noBadge = await said(() => act('morris'));
    need(noBadge.some((l) => /placa/.test(l)), 'Sin placa, Morris debería decir por qué no');
    await act('watkins', 'placa', [0]);
    const notYet = await said(() => act('east'));
    need(notYet.some((l) => /Me falta/.test(l)) && game.state.scene === 'mitre', `La salida de Mitre explica lo que falta: ${notYet.join(' | ')}`);
    // the room on the morning of the letter: the door names the paper
    return { checked: 7 };
  }, opts);
}
