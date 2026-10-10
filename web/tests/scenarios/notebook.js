// The notebook's gesture, whatever the order: two clues in either order make the same deduction,
// a repeat is noticed and changes nothing, an unrelated pair fails, the theories' statuses are kept
// in the save, and a resume in the middle of the investigation keeps all of it.
//   node web/tools/walk.mjs notebook
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, settle, need }) => {
    await start('c1', await fixture('saves-v1-baseline/c1.json'));
    const st = game.state;
    for (const c of ['zurdo', 'anatomia', 'cuello', 'silencio', 'botas', 'ventana']) if (!st.clues.includes(c)) st.clues.push(c);
    // reversed order
    need(game.tryDeduce('anatomia', 'zurdo')?.id === 'd_zurdo', 'anatomia + zurdo debería dar d_zurdo');
    await game.onNotebookClosed(); await settle();
    // a repeat
    const again = game.tryDeduce('zurdo', 'anatomia');
    need(again && again.text === 'Ya lo había anotado.', 'Repetir debería avisar');
    need(st.deductions.filter((d) => d === 'd_zurdo').length === 1, 'La deducción no debe duplicarse');
    // a pair that does not fit
    need(game.tryDeduce('botas', 'zurdo') === null, 'botas + zurdo no encaja');
    // a hypothesis is stored as such
    need(game.tryDeduce('ventana', 'botas')?.kind === 'hipotesis', 'd_barro es una hipótesis');
    await game.onNotebookClosed(); await settle();
    need(st.investigation.hypotheses['intruso.intruso'] === 'plausible', `estado de la teoría guardado: ${JSON.stringify(st.investigation.hypotheses)}`);
    // the profile gains a trait once, never twice
    const prof = st.profile.length;
    game.tryDeduce('zurdo', 'anatomia');
    need(st.profile.length === prof, 'El perfil no debe repetirse');
    // resume mid-investigation (in the room, chapter one): everything is still there
    const saved = JSON.parse(JSON.stringify(st));
    await game.resume({ state: saved, x: 760, facing: 1 });
    await settle();
    need(game.state.deductions.includes('d_zurdo') && game.state.deductions.includes('d_barro'), 'Reanudar perdió deducciones');
    need(game.state.investigation.hypotheses['intruso.intruso'] === 'plausible', 'Reanudar perdió el estado de las teorías');
    return { deductions: game.state.deductions.length };
  }, opts);
}
