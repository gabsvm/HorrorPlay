// Android Back (UX audit 675df9f): one press closes the innermost thing in a fixed order, and never takes a
// decision or skips a line for the player. Leaving the app freezes a timed choice's clock; coming back resumes it.
// The UI here runs for real (FAST off) against the stub DOM, so the promises are the ones a player meets.
//   node web/tools/walk.mjs android-back
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, settle }) => {
    await start('c1', await fixture('saves-v1-baseline/c1.json'));
    await act('coat'); await act('boots'); await act('lantern');
    await act('door'); expectScene('bucks_row');
    const ui = game.ui, back = () => window.__appBack();
    const tick = () => new Promise((r) => setTimeout(r, 30));
    const real = async (f) => { window.FAST = false; try { return await f(); } finally { window.FAST = true; } };

    await real(async () => {
      // a document, even with a script running behind it: Back closes it like «Dejar»
      let closed = false;
      ui.doc('<p>Prueba</p>').then(() => { closed = true; });
      await tick();
      need(!!ui._docClose, 'el documento está abierto');
      back(); await tick();
      need(closed && !ui._docClose, 'Atrás cierra el documento');

      // a line of dialogue: Back never skips it (it could not be read again)
      let said = false;
      ui.say('Pike', 'Una línea que hay que leer.').then(() => { said = true; });
      await new Promise((r) => setTimeout(r, 120));
      back(); await tick();
      need(!said && !!ui._advance, 'Atrás no salta una línea de diálogo');
      while (ui._advance && !said) { ui.advance(); await tick(); }
      need(said, 'la línea termina al avanzar');

      // the notebook
      ui.openNotebook(game); await tick();
      need(ui.notebookOpen, 'el cuaderno está abierto');
      back(); await tick();
      need(!ui.notebookOpen, 'Atrás cierra el cuaderno');

      // a conversation menu: Back picks its «Nada más»
      let picked = null;
      ui.choice(['Uno', 'Dos', 'Nada más.'], { cancel: 2 }).then((k) => { picked = k; });
      await tick();
      need(!!ui._talkCancel, 'el menú de conversación se puede dejar');
      back(); await tick();
      need(picked === 2 && !ui._talkCancel && !ui._choiceKeys, `Atrás deja la conversación con «Nada más»: ${picked}`);

      // a timed choice: Back does nothing; leaving the app stops its clock, coming back resumes it
      picked = null;
      ui.choice(['Izquierda', 'Derecha'], { timeout: 200, def: 1 }).then((k) => { picked = k; });
      await tick();
      need(!ui._talkCancel, 'una elección cronometrada no se cancela');
      back(); await tick();
      need(picked === null && !!ui._choiceKeys, 'Atrás no decide una elección cronometrada');
      window.__appPause();
      await new Promise((r) => setTimeout(r, 350));
      need(picked === null, 'con la app en segundo plano el reloj no se agota');
      window.__appResume();
      await new Promise((r) => setTimeout(r, 350));
      need(picked === 1, `al volver, el reloj sigue y se agota con la opción por defecto: ${picked}`);

      // a plain choice in a scene: Back waits for the player
      picked = null;
      ui.choice(['Dárselo a Pike.', 'Guardármelo.']).then((k) => { picked = k; });
      await tick();
      back(); await tick();
      need(picked === null && !!ui._choiceKeys, 'Atrás no decide una elección de escena');
      ui._choiceKeys[0].click?.() ?? ui._choiceKeys[0].dispatchEvent?.(new Event('click'));
    });
    await tick();
    if (ui._choiceKeys) { ui.el.choices.classList.add('hidden'); ui._choiceKeys = null; }

    // the inventory case comes before anything behind it
    need(game.openInventory(), 'el maletín se abre');
    back();
    need(!ui.inventoryOpen, 'Atrás cierra el maletín');

    // an object in hand: Back lets it go before pausing
    game.selectedItem = game.state.items[0]; game.refreshInventory();
    back();
    need(game.selectedItem === null && !game.paused, 'Atrás suelta el objeto antes de pausar');

    // nothing open: Back pauses, and again resumes
    back();
    need(game.paused && game.inMenu, 'Atrás pausa la partida');
    back();
    need(!game.paused && !game.inMenu, 'Atrás otra vez sale de la pausa');
    await settle();
    return { ok: true };
  }, opts);
}
