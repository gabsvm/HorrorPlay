// The notebook's "what now?" answers what the place asks for first. In Hanbury Street, with an
// optional pair ready (the apron and Brennan) and the comb still undecided, the second ask points
// at the comb, never at the pair. Where the gate is the notebook itself, it offers a deduction
// that meets it (chapter I's conclusion, a new source for the finale), not one that moves nothing.
//   node web/tools/walk.mjs hint
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene }) => {
    const st = () => game.state;
    const gist = (id) => { const c = game.clues[id], t = typeof c.text === 'function' ? c.text(st()) : c.text; return `«${t.split(/[.:;]/)[0]}»`; };
    const ask = () => { game._hintKey = null; return [game.hint(), game.hint()]; };

    // ---- Hanbury: the comb before an optional deduction
    await start('c2', await fixture('saves-v1-baseline/c2.json'));
    expectScene('hanbury');
    await act('apron');
    await act('greaves', null, ['corte']);
    const opt = game.deductions.find((d) => d.id === 'd_delantal');
    need(st().clues.includes(opt.a) && st().clues.includes(opt.b) && !st().deductions.includes('d_delantal'), 'd_delantal debería estar disponible');
    const [h1, h2] = ask();
    need(!/Junta|dos pruebas/.test(h1) && /valla/.test(h1), `Primera ayuda en Hanbury: ${h1}`);
    need(!/Junta/.test(h2) && /valla/.test(h2), `Segunda ayuda en Hanbury debería llevar al peine: ${h2}`);

    // ---- chapter I: a conclusion it accepts (here only Brennan's), not the mud listed before it
    Object.assign(st(), { chapter: 'c1', scene: 'knackers', deductions: [], clues: ['zurdo', 'bisturi', 'brennan_zurdo', 'botas', 'ventana'], objective: 'Relacionar pruebas en el cuaderno.' });
    st().flags.c1_done = false;
    const [c1a, c1b] = ask();
    need(/dos pruebas/.test(c1a), `Primera ayuda en C1: ${c1a}`);
    need(c1b.includes(gist('brennan_zurdo')) && !c1b.includes(gist('botas')), `Segunda ayuda en C1 debería dar d_brennan, no d_barro: ${c1b}`);

    // ---- the finale: a new independent source, not the mud nor an old hypothesis
    Object.assign(st(), { chapter: 'c4', scene: 'foreshore', deductions: ['f_zurdo', 'f_anat'], clues: ['ficha', 'zurdo', 'bisturi', 'huellas', 'expediente', 'delantal', 'brennan_zurdo'], objective: 'Relacionar mi ficha.' });
    st().flags.awake = true;
    const [, f2] = ask();
    need(f2.includes(gist('expediente')), `En el final debería ofrecer f_exp: ${f2}`);
    // with only the mud and the optional pair ready, it says what is missing instead
    st().clues = st().clues.filter((c) => c !== 'expediente');
    const [f3, f4] = ask();
    need(!/Junta|dos pruebas/.test(f3 + f4) && /relacionar mi ficha con 1 prueba/.test(f4), `Sin fuentes nuevas no debe sugerir barro ni hipótesis: ${f3} / ${f4}`);
    return { hanbury: h2, c1: c1b, finale: f2 };
  }, opts);
}
