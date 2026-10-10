// Greaves's drawer: the scalpel opens it and the key is given once; looking again shows the note from
// Scotland Yard and gives nothing, creates no flag and no clue; the cabinet and its file do not change.
// In FAST mode a document only logs "[documento]", so the note's text is taken from the document call.
//   node web/tools/walk.mjs forense
import { scenario, fixture } from './harness.js';

const NOTA = 'NOTA DEL INSPECTOR JEFE D. S. SWANSON';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, waitScene, has, flag, settle }) => {
    const docs = [];
    const realDoc = game.ui.doc;
    game.ui.doc = async (html) => { docs.push(html); };
    try {
      await start('c4', await fixture('saves-v1-baseline/c4.json'));
      expectScene('greaves');
      docs.length = 0;
      const count = (id) => game.state.items.filter((i) => i === id).length;

      // before the scalpel: the drawer is locked, nothing is shown
      await act('drawer');
      need(docs.length === 0 && !flag('drawer_open') && !has('llave'), 'Sin el bisturí el cajón solo dice que la cerradura es pequeña');

      // the scalpel opens it: the key is given, and the note is in the drawer
      await act('drawer', 'bisturi');
      need(flag('drawer_open') === true, 'El bisturí abre el cajón');
      need(count('llave') === 1, `La llave se entrega una vez (${count('llave')})`);
      need(docs.length === 1 && docs[0].includes(NOTA), 'Al abrir el cajón se ve la nota');
      const afterOpen = JSON.stringify([game.state.items, game.state.flags, game.state.clues]);

      // looking again: the same note, and nothing new
      await act('drawer');
      need(docs.length === 2 && docs[1] === docs[0], 'Volver a mirar el cajón muestra la misma nota');
      need(JSON.stringify([game.state.items, game.state.flags, game.state.clues]) === afterOpen, 'Volver a mirar no entrega la llave, ni crea flags o pistas');

      // the scalpel again on the open drawer: nothing is given twice
      await act('drawer', 'bisturi');
      need(count('llave') === 1 && docs.length === 2, 'El bisturí sobre el cajón abierto no vuelve a dar la llave ni la nota');
      need(JSON.stringify([game.state.items, game.state.flags, game.state.clues]) === afterOpen, 'Ni ese intento cambia el estado');

      // the cabinet is what it was: closed, and no file read until the key opens it
      need(!flag('cabinet_open') && !flag('file_read'), 'La vitrina sigue cerrada');
      await act('cabinet');
      need(!docs.some((d) => d.includes('EXPEDIENTE CLÍNICO')), 'Mirar la vitrina sin llave no lee el expediente');

      // the cabinet with the key: the file is read as before, and the note is not in it
      await act('cabinet', 'llave', ['acusando', 'Deténgame']);
      await waitScene('foreshore');
      expectScene('foreshore');
      const files = docs.filter((d) => d.includes('EXPEDIENTE CLÍNICO'));
      need(files.length === 1 && !files[0].includes('SWANSON'), 'El expediente de la vitrina no cambia y no lleva la nota');
      need(docs.filter((d) => d.includes(NOTA)).length === 2, 'La nota se ve al abrir el cajón y al volver a mirar, y en ninguna otra parte');
      need(count('llave') === 0, 'La llave se gasta en la vitrina');
      return { notes: 2, files: files.length };
    } finally {
      game.ui.doc = realDoc;
    }
  }, opts);
}
