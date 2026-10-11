// Chapter three three times from its checkpoint: a clean chase, a chase where a constable sees his
// face, a chase that ends against a wall. Each leaves its outcome; the letter can be judged
// «not enough» and still lead on; Greaves and Pike, in chapter four, speak to both.
//   node web/tools/walk.mjs chapter3
import { scenario, fixture } from './harness.js';

const RUNS = [
  // [junction picks, expected outcome, the handwriting answer, what Greaves then says, what Pike says]
  [[0, 1, 1], 'clean', 'La muestra no basta', /No acusaste a nadie por una letra/, /Nadie te vio esta noche/],
  [[1, 1, 1], 'spotted', 'Greaves: se parece', /Pensaste que la carta era mía/, /te vio la cara/],
  [[1, 0, 0], 'injured', 'La muestra no basta', /esa mano/, /mano cosida/],
];

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, waitScene, flag }) => {
    const snap = await fixture('saves-v1-baseline/c3.json');
    const seen = {};
    for (const [junctions, outcome, hand, greavesSays, pikeSays] of RUNS) {
      await start('c3', snap);
      await act('desk'); await act('door'); await act('bed');
      expectScene('mitre');
      await act('watkins', 'placa', ['Aldgate']);
      await act('watkins', null, ['vio algo']);
      await act('watkins', null, ['encontrado']);
      await act('corner');
      await act('east'); expectScene('goulston');
      await act('doorway', null, ['Correr', ...junctions]);
      await waitScene('room');
      need(flag('chase_outcome') === outcome && flag('chase_mistakes') === junctions.filter((c, i) => c !== [0, 1, 1][i]).length, `Persecución ${outcome}: quedó ${flag('chase_outcome')} (${flag('chase_mistakes')})`);
      await act('paper');
      await act('desk', null, [hand]);
      need(game.state.clues.includes('letra'), 'La comparación da la pista de la letra sea cual sea la respuesta');
      need(flag('handwriting_assessment') === (hand.startsWith('La muestra') ? 'inconclusive' : 'greaves_like'), 'Se guarda la valoración de la letra');
      await act('bed');
      await act('door');
      await waitScene('greaves');
      expectScene('greaves');
      await act('drawer', 'bisturi');
      const n = window.LOG.length;
      await act('cabinet', 'llave', ['Todavía no sé quién la escribió.', 'acusando', 'Deténgame']);
      const log = window.LOG.slice(n).join('\n');
      need(greavesSays.test(log), `Greaves debería aludir a la letra / la mano (${outcome})`);
      need(pikeSays.test(log), `Pike debería saber cómo fue la persecución (${outcome})`);
      seen[outcome] = flag('handwriting_assessment');
    }
    return { seen };
  }, opts);
}
