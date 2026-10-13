// The inventory case (UX audit 675df9f): no bar over the scene; the HUD counts the objects; the case opens only
// when the player has control; examine reads the object's words inside the case; use puts it in the hand (with a
// marker and Cancel) and closes the case; Back closes it; nothing about it is saved.
//   node web/tools/walk.mjs inventory14
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, settle, flag }) => {
    const f = await fixture('saves-v1-baseline/c4.json');
    f.items = [...new Set([...(f.items || []), 'penique', 'bisturi', 'placa'])];
    await start('c4', f);
    await settle();
    const ui = game.ui;
    const el = (id) => document.getElementById(id);
    need(el('btn-inv').textContent !== undefined, 'falta el botón de inventario');
    need(el('inv-count').textContent === ` (${game.state.items.length})`, `el contador no cuenta los objetos: «${el('inv-count').textContent}»`);
    need(el('inv-modal').classList.contains('hidden'), 'el inventario no debe empezar abierto');

    // not while a script runs
    game.running++;
    need(game.openInventory() === false, 'el inventario no debe abrirse con un guion en marcha');
    game.running--;

    // open: one slot per object, and the case blocks the scene
    need(game.openInventory() === true && ui.inventoryOpen, 'el inventario no se abre');
    need(el('inv-grid').children.length === game.state.items.length, 'una ranura por objeto');

    // examine: the object's own words, inside the case
    const lines = await game.describeItem('bisturi');
    need(lines.length >= 1 && /Weiss/.test(lines[0]), `examinar el bisturí no lee su texto: ${JSON.stringify(lines)}`);
    need(game.state.items.includes('bisturi'), 'examinar no debe gastar el objeto');

    // Back closes it
    window.__appBack();
    need(!ui.inventoryOpen, 'Atrás debe cerrar el inventario');

    // use: select the scalpel, Use, and it is in the hand with its marker; the case is closed
    game.openInventory();
    // the stub DOM of the walk tool does not clear children on innerHTML = '': the current slot is the last one
    const slot = el('inv-grid').children.filter((b) => b.dataset.id === 'bisturi').pop();
    slot.click();
    el('inv-use').onclick();
    need(game.selectedItem === 'bisturi' && !ui.inventoryOpen, 'Usar debe dejar el bisturí en la mano y cerrar el inventario');
    need(!el('held').classList.contains('hidden'), 'falta el indicador del objeto en la mano');
    // Cancel lets it go
    el('held-cancel').click();
    need(game.selectedItem === null && el('held').classList.contains('hidden'), 'Cancelar debe soltar el objeto');

    // the open case is not saved: the state has no trace of it
    game.openInventory();
    const saved = JSON.stringify(game.state);
    ui._invClose();
    need(!/inv-modal|inventoryOpen/.test(saved), 'el estado no debe guardar el inventario abierto');

    // using an object still works through a hotspot: the scalpel opens the drawer
    await act('drawer', 'bisturi');
    need(flag('drawer_open') && game.state.items.includes('llave'), 'el bisturí debe abrir el cajón y dar la llave');
    need(el('inv-count').textContent === ` (${game.state.items.length})`, 'el contador sigue a los objetos');
    return { items: game.state.items.length };
  }, opts);
}
