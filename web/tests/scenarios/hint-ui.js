// The notebook's "¿Qué hago ahora?" as the player sees it (UI.hint, not only Game.hint). When the
// answer closes the notebook to mark what can be touched, the words appear as a notice that outlives
// the close; they never land in the hidden notebook. And a place ready to move on (chapter I closable,
// Hanbury done, the finale's sources in hand) never has an optional pair put in front of its exit.
//   node web/tools/walk.mjs hint-ui
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene }) => {
    const st = () => game.state;
    const ui = game.ui;
    const toast = () => document.getElementById('toast');
    const fb = () => document.getElementById('nb-feedback');
    const open = () => { ui.openNotebook(game); need(ui.notebookOpen, 'El cuaderno debería abrirse'); };

    // ---- UX-01: second ask in Hanbury (the comb pending) closes the notebook and leaves the words on screen
    await start('c2', await fixture('saves-v1-baseline/c2.json'));
    expectScene('hanbury');
    await act('apron');
    await act('greaves', null, ['corte']);
    open();
    ui.hint();                                     // first ask: nudge in the notebook
    need(ui.notebookOpen && /valla/.test(fb().textContent), `Primera ayuda en el cuaderno: ${fb().textContent}`);
    fb().textContent = '';
    ui.hint();                                     // second ask: notebook closes
    need(!ui.notebookOpen, 'La segunda ayuda debería cerrar el cuaderno para marcar los puntos');
    need(/valla/.test(toast().textContent) && toast().classList.contains('show'), `El aviso debe verse tras cerrar: "${toast().textContent}"`);
    need(!/valla/.test(fb().textContent), 'El mensaje no debe quedar solo en el cuaderno oculto');

    // ---- UX-02: chapter I can close (Brennan's conclusion is in), and the optional pair (the mud) is ready too
    Object.assign(st(), { chapter: 'c1', scene: 'knackers', deductions: ['d_brennan'], clues: ['zurdo', 'bisturi', 'brennan_zurdo', 'botas', 'ventana'], objective: 'Cerrar la noche con Pike o con Brennan.' });
    st().flags.c1_done = false; st().flags.wren_met = true;
    const obj = game.deductions.find((d) => d.id === 'd_barro');
    need(st().clues.includes(obj.a) && st().clues.includes(obj.b) && !st().deductions.includes('d_barro'), 'd_barro debería estar disponible');
    open();
    ui.hint(); const a = fb().textContent;
    ui.hint(); const b = toast().textContent;
    need(!/Junta|dos pruebas/.test(a + b) && /Cerrar la noche/.test(a + b), `Con C1 listo no debe proponer el barro: "${a}" / "${b}"`);

    // Hanbury done (the comb decided, apron, doctor): the exit wins over the optional apron pair
    await start('c2', await fixture('saves-v1-baseline/c2.json'));
    Object.assign(st(), { scene: 'hanbury', deductions: [], clues: ['delantal', 'brennan_zurdo', 'laudano'], flags: { ...st().flags, greaves_met: true, peine_taken: true } });
    game.ui.closeNotebook && ui.closeNotebook();
    open(); ui.hint(); const h = fb().textContent;
    need(!/Junta|dos pruebas/.test(h), `Hanbury listo para salir no debe proponer una pareja opcional: "${h}"`);

    // the finale: three independent sources are in, the mud is still ready
    Object.assign(st(), { chapter: 'c4', scene: 'foreshore', deductions: ['f_zurdo', 'f_anat', 'f_testigo'], clues: ['ficha', 'zurdo', 'bisturi', 'testigo', 'huellas', 'ronda'], objective: 'Ir al agua.' });
    st().flags.awake = true;
    ui.closeNotebook && ui.closeNotebook();
    open(); ui.hint(); const f = fb().textContent;
    need(!/Junta|dos pruebas/.test(f), `Final listo no debe proponer el barro: "${f}"`);
    return { c1First: a, c1Second: b };
  }, opts);
}
