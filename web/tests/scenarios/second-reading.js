// The second reading adds something to do in every chapter, not only other words: the man in the
// water (prologue), Pike's notebook (I), Wexley naming who the knocks are for (II), the draft under
// the blotter (III), the night of 1879 at the skeleton (IV). The shortcuts through solved puzzles
// appear only for someone who has finished the game; without that mark they never show.
//   node web/tools/walk.mjs second-reading
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, waitScene, flag }) => {
    const said = async (fn) => { const n = window.LOG.length; await fn(); return window.LOG.slice(n).join('\n'); };
    const READ = 'elhuesped.save.v1.read';
    // ---- without having finished: no shortcuts
    localStorage.removeItem(READ);
    await start('c1', await fixture('saves-v1-baseline-second/c1.json'), { second: true });
    await act('coat'); await act('boots'); await act('lantern'); await act('door');
    await act('neil');
    await act('pike', null, ['quién era']); await act('pike', null, ['libreta']);
    let log = await said(() => act('pike', null, ['hoja de rondas', 'Entre las 3:30 y las 3:40']));
    need(!/Ya lo sé: de 3:30/.test(log), 'Sin haber terminado el juego no hay atajo');
    // ---- having finished: the shortcuts, and every chapter's new moment
    localStorage.setItem(READ, '1');
    log = await said(async () => {
      await start('prologue', null, { second: true });
      await act('boat');
    });
    need(/hombre con bombín/.test(log), 'Prólogo: el hombre en el agua');
    await start('c1', await fixture('saves-v1-baseline-second/c1.json'), { second: true });
    await act('coat'); await act('boots'); await act('lantern'); await act('door');
    await act('neil');
    await act('pike', null, ['quién era']); await act('pike', null, ['libreta']);
    log = await said(() => act('pike', null, ['Déjeme ver su libreta']));
    need(/Libreta del sargento|documento/.test(log) && flag('pike_book_read'), 'I: la libreta de Pike');
    log = await said(() => act('pike', null, ['hoja de rondas', 'Ya lo sé']));
    need(game.state.clues.includes('ronda'), 'I: el atajo de las rondas da la pista');
    // II
    await start('c2', await fixture('saves-v1-baseline-second/c2.json'), { second: true });
    await act('greaves', null, ['corte']); await act('apron'); await act('comb', null, ['Guardármelo']);
    await act('passage'); expectScene('seance');
    await act('chart'); await act('table');
    log = await said(() => act('table', null, ['Ya sé lo que dicen']));
    need(game.state.clues.includes('hospes') && /Le hablan a usted/.test(log), 'II: atajo de los golpes y Wexley sabe a quién hablan');
    // III
    await start('c3', await fixture('saves-v1-baseline-second/c3.json'), { second: true });
    await act('desk');
    log = await said(() => act('desk'));
    need(flag('s2_draft') && /Lo practiqué antes de escribirlo/.test(log), 'III: el borrador bajo el secante');
    // IV
    await start('c4', await fixture('saves-v1-baseline-second/c4.json'), { second: true });
    log = await said(() => act('skeleton'));
    need(flag('s2_1879') && /Marzo de 1879/.test(log), 'IV: la noche de 1879');
    localStorage.removeItem(READ);
    return { beats: 5 };
  }, opts);
}
