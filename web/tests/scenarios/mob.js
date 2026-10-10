// The mob at Barber's yard, three times from the same night: accusing Brennan, asking the crowd to
// break up, getting him out. Each leaves its own outcome; Wren never blames Thomas for a beating he
// prevented; her question's answer is kept; and accusing is only offered with a reason Thomas holds.
//   node web/tools/walk.mjs mob
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, deduce, need, expectScene, waitScene, flag }) => {
    // Hanbury and the séance, the shortest way, keeping the comb
    await start('c2', await fixture('saves-v1-baseline/c2.json'));
    await act('greaves', null, ['corte']); await act('apron'); await act('amelia');
    await act('comb', null, ['Guardármelo']);
    await act('passage'); expectScene('seance');
    await act('chart'); await act('table'); await act('table');   // the knocks, then their reading
    await act('table', 'peine');
    need(flag('seance_done') && game.state.clues.includes('hospes'), 'Sesión y golpes hechos');
    const before = JSON.parse(JSON.stringify(game.state));
    const seen = {};
    for (const [label, outcome, reply] of [['Pedir que se disperse', 'injured', 'No me dejaron'], ['escolten', 'protected', 'Era lo que había'], ['Acusar', 'severe', 'Lo sospechaba']]) {
      game.state = JSON.parse(JSON.stringify(before));
      if (outcome === 'severe') {
        // accusing needs a reason: the apron joined to him (or having said in chapter one he should be watched)
        if (!game.state.deductions.includes('d_delantal')) { game.state.clues.push('brennan_zurdo'); await deduce('delantal', 'brennan_zurdo'); }
      } else {
        game.state.deductions = game.state.deductions.filter((d) => d !== 'd_delantal');
        game.state.flags.brennan_stance = 'unsure';
      }
      await game.goto('seance', { x: 240, noEnter: true });
      const n = window.LOG.length;
      await act('door', null, [label, reply]);
      await waitScene('room');
      const log = window.LOG.slice(n).join('\n');
      need(game.state.flags.brennan_outcome === outcome, `${label}: esperaba ${outcome}, quedó ${game.state.flags.brennan_outcome}`);
      need(!!game.state.flags.wren_mob_reply, `${label}: la respuesta a Wren debe guardarse`);
      if (outcome === 'protected') need(!/no tenía nada contra él|Lo dijo tarde/.test(log), 'Wren no puede culpar a quien lo protegió');
      if (outcome !== 'severe') need(!/Acusar a Brennan/.test(log), 'Sin razón no se ofrece acusar');
      seen[outcome] = game.state.flags.wren_mob_reply;
    }
    return { seen };
  }, opts);
}
