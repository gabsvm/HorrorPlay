// The notebook's positions, played in the real game: each question folds to one line and opens on a
// press (one at a time, page state only); a stance is written only when it changes, with one render per
// press; it survives a save and a resume without a repeated revision; letter_author appears only once
// «carta» is in; buck_window never appears; Brennan's line from chapter one is read but never written;
// nothing is offered while Thomas is awake, nor in the second reading.
//   node web/tools/walk.mjs positions
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, settle, need }) => {
    const { Game } = await import('../../src/engine/game.js');
    const P = await import('../../src/story/positions.js');
    await start('c1', await fixture('saves-v1-baseline/c1.json'));
    const add = (...ids) => { for (const c of ids) if (!game.state.clues.includes(c)) game.state.clues.push(c); };
    // what the notebook's theory page shows now: each theory is an item. The stub DOM of walk.mjs keeps
    // the items of earlier renders unless they are cleared here (a real DOM clears them with innerHTML).
    const page = () => {
      const tl = game.ui.el.theoryList;
      tl.children.length = 0;
      game.ui.renderNotebook();
      return Array.from(tl.children, (li) => li.innerHTML).join('');
    };
    // a press on a question's line (the list's listener, as a real click reaches it)
    const press = (sel, dataset) => game.ui.el.theoryList._l.click({ target: { closest: (s) => (s === sel ? { dataset } : null) } });
    const open = (q) => press('button[data-toggle]', { toggle: q });
    const choose = (q, v) => press('button[data-q]', { q, v });

    // letter_author: not with only «dedos», yes with «carta», folded at first; buck_window never
    add('dedos');
    need(!page().includes('data-toggle="letter_author"'), 'sin «carta» no hay línea de la carta');
    add('carta');
    let html = page();
    need(html.includes('aria-expanded="false" data-toggle="letter_author"'), 'la carta aparece plegada');
    need(!html.includes('data-q="letter_author"') && !html.includes('Estado de pruebas'), 'plegada: sin botones ni subtítulo');
    need(!P.QUESTIONS.buck_window.visible(game.state) && !html.includes('buck_window'), 'buck_window nunca se ve');
    need(game.setPosition('buck_window', 'firme') === false, 'buck_window no se escribe');

    // Brennan: the chapter-one stance is read when open, and writing a position leaves it alone
    add('brennan_zurdo');
    game.state.flags.brennan_stance = 'clear';
    open('br_suspect');
    html = page();
    need(html.includes('aria-expanded="true" data-toggle="br_suspect"'), 'al pulsar se despliega la de Brennan');
    need(html.includes('aria-expanded="false" data-toggle="letter_author"'), 'la carta sigue plegada: una a la vez');
    need(html.includes('En el cap. I dije: No hay nada contra él'), 'la parada del capítulo I se lee');
    need(!html.includes('data-q="letter_author"'), 'una sola pregunta desplegada');

    // one render per press, whether or not the press writes
    let renders = 0;
    const render = game.ui.renderNotebook;
    game.ui.renderNotebook = function counted() { renders++; return render.call(this); };
    try {
      choose('br_suspect', 'brennan');
      need(renders === 1, `escribir: un solo render (${renders})`);
      need(P.readPosition(game.state, 'br_suspect') === 'brennan', 'postura escrita');
      need(game.state.flags.brennan_stance === 'clear', 'br_suspect no toca brennan_stance');
      renders = 0;
      choose('br_suspect', 'brennan');
      need(renders === 1, `repetir: un solo render (${renders})`);
    } finally {
      game.ui.renderNotebook = render;
    }
    html = page();
    need(html.includes('data-q="br_suspect" data-v="brennan" aria-pressed="true"'), 'el botón elegido queda marcado');
    need(game.setPosition('br_suspect', 'brennan') === false, 'repetir la misma postura no escribe');
    choose('br_suspect', 'prensa');
    need(P.readPosition(game.state, 'br_suspect') === 'prensa', 'cambio de postura sobre Brennan');

    // folding: the same press closes it; opening another closes the first
    open('br_suspect');
    need(!page().includes('data-q="br_suspect"'), 'pulsar la abierta la cierra');
    open('br_suspect');
    open('letter_author');
    html = page();
    need(!html.includes('data-q="br_suspect"') && html.includes('data-q="letter_author"'), 'solo una abierta');
    need(!JSON.stringify(game.state).includes('openPosture') && !JSON.stringify(game.state).includes('_openPosture'), 'el despliegue no está en el estado');
    choose('letter_author', 'greaves');
    need(P.readPosition(game.state, 'letter_author') === 'greaves', 'postura sobre la carta');
    need(game.state.investigation.revisions.length === 3, `tres revisiones: ${game.state.investigation.revisions.length}`);

    // the save and the resume point both hold the stances
    game.save();
    const main = JSON.parse(localStorage.getItem('elhuesped.save.v1'));
    need(main.investigation.positions.br_suspect === 'prensa', 'elhuesped.save.v1 guarda la postura');
    window.FAST = false; game.autosave(); window.FAST = true;
    const r = Game.loadResume();
    need(r && r.state.investigation.positions.letter_author === 'greaves', 'el punto de reanudación guarda la postura');

    // a resume keeps them, and does not repeat the revisions
    const revs = game.state.investigation.revisions.length;
    await game.resume(r);
    await settle();
    need(P.readPosition(game.state, 'br_suspect') === 'prensa', 'reanudar perdió la postura de Brennan');
    need(P.readPosition(game.state, 'letter_author') === 'greaves', 'reanudar perdió la postura de la carta');
    need(game.state.investigation.revisions.length === revs, 'reanudar no repite revisiones');
    need(game.setPosition('br_suspect', 'prensa') === false, 'tras reanudar, repetir no escribe');
    need(game.state.investigation.revisions.length === revs, 'tras reanudar, repetir no añade revisión');
    need(game.state.flags.brennan_stance === 'clear', 'reanudar conserva la parada del capítulo I');

    // awake: no button, only what he thought before
    game.state.flags.awake = true;
    html = page();
    need(game.setPosition('letter_author', 'cercano') === false, 'despierto no se escribe');
    need(html.includes('(antes de saberlo): El barrio ya lo había elegido'), 'despierto: la postura de antes');
    need(html.includes('(antes de saberlo): Pudo escribirla Greaves'), 'despierto: la postura de la carta');
    need(!html.includes('data-toggle=') && !html.includes('data-q='), 'despierto no hay botones');

    // second reading: the stance is not asked at all
    game.state.flags.awake = false;
    game.state.flags.second = true;
    html = page();
    need(!html.includes('data-q=') && !html.includes('data-toggle='), 'segunda lectura: ningún botón de postura');
    const before = JSON.stringify(game.state.investigation.revisions);
    need(game.setPosition('letter_author', 'cercano') === false, 'segunda lectura no escribe');
    need(JSON.stringify(game.state.investigation.revisions) === before, 'segunda lectura no añade revisiones');
    return { revisions: game.state.investigation.revisions.length };
  }, opts);
}
