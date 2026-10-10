// The window of the rounds, played in the real game (V4-02). (a) the classic route of chapter one: the
// clue ronda does not move its gate; (b) the optional route: two misses in the sheet, then the window
// gives the clue; (c) the notebook: firm, then insufficient, two revisions and the basis of the first;
// (d) a save from before the window, with the clue: the theory shows, no stance is written, and a resume
// writes nothing; (e) closing chapter one with Pike or with Brennan: the same gate.
//   node web/tools/walk.mjs beats
import { scenario, fixture } from './harness.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
const same = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`); };

export async function run(opts) {
  return scenario(async ({ game, start, act, deduce, need, expectScene, waitScene, settle, flag, clue }) => {
    const { Game } = await import('../../src/engine/game.js');
    const P = await import('../../src/story/positions.js');
    const { canFinishC1, currentGate } = await import('../../src/story/progression.js');
    // the notebook's theory page as it is now, and the presses a player makes on it (as positions.js does)
    const page = () => {
      const tl = game.ui.el.theoryList;
      tl.children.length = 0;
      game.ui.renderNotebook();
      return Array.from(tl.children, (li) => li.innerHTML).join('');
    };
    const press = (sel, dataset) => game.ui.el.theoryList._l.click({ target: { closest: (s) => (s === sel ? { dataset } : null) } });
    const open = (q) => press('button[data-toggle]', { toggle: q });
    const choose = (q, v) => press('button[data-q]', { q, v });

    // (a) the classic route: with and without the clue, the same gate for chapter one
    await start('c1', await fixture('saves-v1-baseline/c1.json'));
    const gate = () => ({ finish: canFinishC1(game.state), at: currentGate({ ...clone(game.state), scene: 'bucks_row' }) });
    const without = gate();
    need(!without.finish.ok, 'sin nada, la noche no se puede cerrar');
    game.state.clues.push('ronda');
    same(gate(), without, 'la pista ronda no mueve la puerta del capítulo I');
    game.state.clues.pop();

    // (b) the optional route, in Buck's Row: Neil gives the times, Pike offers the sheet, two misses
    await start('c1', await fixture('saves-v1-baseline/c1.json'));
    await act('coat'); await act('boots'); await act('lantern'); await act('door'); expectScene('bucks_row');
    need(!clue('ronda'), 'antes de la hoja no hay pista ronda');
    await act('neil');
    need(flag('neil_times'), 'Neil dio las horas: Pike ofrece la hoja');
    await act('pike', null, ['La hoja de rondas de esta noche.', 'Entre las 3:15 y las 3:30', 'Entre las 3:40 y las 3:45', 'Entre las 3:30 y las 3:40']);
    need(clue('ronda'), 'la ventana de 3:30 a 3:40 da la pista ronda');
    need(game.state.investigation.evaluations.beats.misses === 2, `dos errores: ${game.state.investigation.evaluations.beats.misses}`);
    need(page().includes('data-toggle="buck_window"'), 'con la pista, la ventana aparece en el cuaderno');
    need(page().includes('¿Cuándo quedó el portón fuera de vista'), 'con la pista, la teoría rondas aparece');
    const misses = game.state.investigation.evaluations.beats.misses;

    // (c) the notebook: firm, then insufficient. Two revisions; the first one keeps its basis
    await start('c2', await fixture('saves-v1-baseline/c2.json'));
    need(clue('ronda') && game.state.deductions.includes('d_ronda'), 'el c2 trae la hoja y su deducción');
    need(game.state.investigation.revisions.length === 0, 'sin revisiones antes');
    open('buck_window');
    choose('buck_window', 'firme');
    need(P.readPosition(game.state, 'buck_window') === 'firme', 'postura firme');
    choose('buck_window', 'insuficiente');
    need(P.readPosition(game.state, 'buck_window') === 'insuficiente', 'postura insuficiente');
    const revs = game.state.investigation.revisions;
    need(revs.length === 2, `dos revisiones: ${revs.length}`);
    same(revs[0], { question: 'buck_window', from: null, to: 'firme', chapter: 'c2', basis: ['for:ded:d_ronda'] }, 'primera revisión y su basis');
    same(revs[1].basis, [], 'insuficiente no se apoya en nada');
    same([revs[1].from, revs[1].to], ['firme', 'insuficiente'], 'la segunda viene de la primera');

    // (d) a save from before the window (c2 has the clue, no positions): the theory shows, nothing written
    await start('c2', await fixture('saves-v1-baseline/c2.json'));
    let html = page();
    need(html.includes('¿Cuándo quedó el portón fuera de vista'), 'la teoría rondas aparece en un guardado previo');
    need(html.includes('data-toggle="buck_window"') && html.includes('Mi postura: sin postura'), 'la ventana aparece sin postura');
    need(game.state.investigation.revisions.length === 0, 'al abrir el cuaderno no se escribe nada');
    game.save();
    window.FAST = false; game.autosave(); window.FAST = true;
    const r = Game.loadResume();
    need(r && r.state.investigation.revisions.length === 0, 'el punto de reanudación no tiene revisiones');
    await game.resume(r);
    await settle();
    need(game.state.investigation.revisions.length === 0, 'reanudar no escribe revisiones');
    need(P.readPosition(game.state, 'buck_window') === null, 'reanudar no pone postura');
    need(page().includes('Mi postura: sin postura'), 'tras reanudar, sigue sin postura');

    // (e) closing chapter one. With the window (Pike closes) and without it (Brennan closes): same gate
    await start('c1', await fixture('saves-v1-baseline/c1.json'));
    await act('coat'); await act('boots'); await act('lantern'); await act('door'); expectScene('bucks_row');
    await act('neil');
    await act('pike', null, ['La hoja de rondas de esta noche.', 'Entre las 3:30 y las 3:40']);
    await act('pike', null, ['médico']);
    await act('pike', null, ['trabaja de noche']);
    await act('west'); expectScene('knackers');
    await act('wren', null, ['Dejarle el penique', 'Por qué']);
    need(clue('bisturi'), 'Falta el bisturí');
    await deduce('bisturi', 'anatomia');
    await act('east'); expectScene('bucks_row');
    const gateWithWindow = canFinishC1(game.state);
    need(gateWithWindow.ok, `la noche se cierra con la ventana: ${JSON.stringify(gateWithWindow.missing)}`);
    await act('pike', null, ['Cerramos por esta noche', 'todavía no lo sé']);
    await waitScene('hanbury'); expectScene('hanbury');
    need(flag('c1_done') && flag('brennan_stance') === 'unsure', 'cerrada con Pike: la duda sobre Brennan');
    const pikeRoute = game.state.investigation.routes.c1;
    need(pikeRoute.conclusions.includes('d_bisturi'), 'la conclusión queda en la ruta');

    await start('c1', await fixture('saves-v1-baseline/c1.json'));
    await act('coat'); await act('boots'); await act('lantern'); await act('door'); expectScene('bucks_row');
    await act('pike', null, ['médico']);
    await act('pike', null, ['trabaja de noche']);
    await act('west'); expectScene('knackers');
    await act('wren', null, ['Dejarle el penique', 'Por qué']);
    await deduce('bisturi', 'anatomia');
    const gateWithout = canFinishC1(game.state);
    same(gateWithout, gateWithWindow, 'la misma puerta con y sin la ventana');
    await act('brennan', null, ['Esto es todo', 'todavía no lo sé']);
    await waitScene('hanbury'); expectScene('hanbury');
    need(flag('c1_done') && flag('brennan_stance') === 'unsure', 'cerrada con Brennan: la misma duda');
    need(!clue('ronda'), 'sin la hoja no hay pista ronda');
    same(game.state.investigation.routes.c1.conclusions, pikeRoute.conclusions, 'las conclusiones de la ruta son las mismas');
    return { misses, revisions: revs.length };
  }, opts);
}
