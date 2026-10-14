// The Daily News of 1 October (V4-07): the doubt that the letter is an invention of a journalist is
// Thomas's, said on the first reading only, and leaves nothing behind (no flag, no clue); the second
// reading does not say it. The paper is read after the chase, the way chapter three does it.
//   node web/tools/walk.mjs carta
import { scenario, fixture } from './harness.js';

const CHASE = [0, 1, 1];   // the clean run through Wentworth Street

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, waitScene }) => {
    // the room on the morning of the 1st, with the paper unread; returns what the reading said and left
    const readPaper = async (second) => {
      const snap = await fixture(second ? 'saves-v1-baseline-second/c3.json' : 'saves-v1-baseline/c3.json');
      await start('c3', snap, { second });
      await act('desk'); await act('door'); await act('bed');
      expectScene('mitre');
      await act('watkins', 'placa', ['Aldgate']);
      await act('watkins', null, ['vio algo']);
      await act('watkins', null, ['encontrado']);
      await act('corner');
      await act('east'); expectScene('goulston');
      await act('doorway', null, ['Correr', ...CHASE]);
      await waitScene('room');
      const n = window.LOG.length;
      await act('paper');
      return {
        log: window.LOG.slice(n).join('\n'),
        clues: [...game.state.clues].sort(),
        flags: Object.keys(game.state.flags).sort(),
        paperRead: !!game.state.flags.paper_read,
      };
    };

    // first reading: the doubt is said, after the date and before «Una firma. Ya la imprimieron.»
    const first = await readPaper(false);
    need(first.paperRead, 'La primera lectura marca el periódico como leído');
    const fechada = first.log.indexOf('Fechada el 25');
    const duda = first.log.indexOf('Puede que la haya inventado un periodista');
    const letra = first.log.indexOf('Una firma. Ya la imprimieron.');
    need(fechada >= 0 && duda > fechada && letra > duda, `Primera lectura: la duda va entre la fecha y la letra (${fechada}, ${duda}, ${letra})`);

    // second reading: the doubt is not said, and the reading leaves the same clues and no new flag
    const second = await readPaper(true);
    need(second.paperRead, 'La segunda lectura marca el periódico como leído');
    need(!/Puede que la haya inventado un periodista/.test(second.log), 'Segunda lectura: no aparece la duda');
    need(JSON.stringify(first.clues) === JSON.stringify(second.clues), `Las pistas no cambian entre lecturas: ${first.clues} / ${second.clues}`);
    const extra = first.flags.filter((k) => !second.flags.includes(k));
    need(extra.length === 0, `La duda no guarda flags (solo difiere 'second'): ${extra}`);
    need(!first.flags.some((k) => /periodista|inventad|duda|prensa/i.test(k)), 'Ningún flag de duda en la primera lectura');
    return { first: { duda: duda >= 0 }, second: { duda: false } };
  }, opts);
}
