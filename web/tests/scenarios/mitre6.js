// Mitre Square after V4-06: the menu of Watkins in the order the story gives it, the notice from Berner
// Street and the City's line (each offered once), the neighbour's witness, the old route to Goulston, the
// saves with and without the notice, and the clipping that appears only in chapter four.
//   node web/tools/walk.mjs mitre6
import { scenario, fixture } from './harness.js';
import { evaluate } from '../../src/story/theories.js';
import { QUESTIONS } from '../../src/story/positions.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, clue }) => {
    // the menus the game offers (the text of each option), in order; the picks still go through the real UI
    const MENUS = [];
    const origChoice = game.ui.choice;
    game.ui.choice = (options, o) => { MENUS.push(options.slice()); return origChoice.call(game.ui, options, o); };
    // the documents the game shows, for the clipping
    const DOCS = [];
    const origDoc = game.ui.doc;
    game.ui.doc = (html) => { DOCS.push(String(html)); return origDoc.call(game.ui, html); };
    const menuAt = (from) => MENUS.slice(from).at(-1) || [];
    const count = (id) => game.state.clues.filter((c) => c === id).length;
    const says = (re) => window.LOG.some((l) => re.test(l));
    const c3 = await fixture('saves-v1-baseline/c3.json');
    const toMitre = async (snap = c3) => { await start('c3', snap); await act('desk'); await act('door'); await act('bed'); expectScene('mitre'); };
    const seen = {};

    // 1. the full route: placa, witness, found, the notice, the City's line, the name, then leave
    await toMitre();
    await act('watkins', 'placa', ['Aldgate']);
    let m = MENUS.length;
    await act('watkins', null, ['vio algo']);
    let offered = menuAt(m);
    need(offered.some((t) => /Qué ha encontrado/.test(t)) && offered.some((t) => /Alguien vio algo/.test(t)), `Primer menú: ${offered}`);
    need(offered.some((t) => /Quién lleva el caso/.test(t)), 'La línea de la City se ofrece tras la placa');
    need(!offered.some((t) => /novedades/.test(t)), 'Sin trozo no hay novedades');
    need(clue('testigo') && count('testigo') === 1, 'El testigo queda una vez');
    need(says(/Church Passage dice que, hacia la una y media/), 'El vecino de Church Passage habla');
    need(!says(/Duke|Stride|Gotemburgo/), 'Ni Duke\'s Place ni Stride en la escena');

    m = MENUS.length;
    await act('watkins', null, ['encontrado']);
    offered = menuAt(m);
    need(offered.some((t) => /^✓ ¿Alguien vio algo/.test(t)), 'El testigo se ofrece marcado como oído');
    need(!offered.some((t) => /novedades/.test(t)), 'Antes del trozo no hay aviso');
    need(clue('trozo') && count('trozo') === 1, 'El trozo queda una vez');

    m = MENUS.length;
    await act('watkins', null, ['novedades']);
    offered = menuAt(m);
    need(offered.some((t) => /novedades/.test(t)) && offered.some((t) => /^✓ ¿Qué ha encontrado/.test(t)), `Con trozo, aparecen novedades: ${offered}`);
    need(says(/Aviso de la Metropolitana: Berner Street, hacia la una/), 'Watkins da el aviso');
    need(clue('berner_aviso') && count('berner_aviso') === 1, 'El aviso queda una vez');

    m = MENUS.length;
    const sanityBeforeCity = game.state.sanity;
    await act('watkins', null, ['caso']);
    offered = menuAt(m);
    need(offered.some((t) => /Quién lleva el caso/.test(t)) && offered.some((t) => /^✓ ¿Hay novedades/.test(t)), `Tras el aviso: ${offered}`);
    need(says(/Aquí manda la City, inspector/), 'Watkins dice la línea de la City');
    need(game.state.flags.mitre_city === true, 'La City deja su flag');
    need(game.state.sanity === sanityBeforeCity, 'La línea de la City no cambia la cordura');

    m = MENUS.length;
    const sanityBeforeName = game.state.sanity;
    await act('watkins', null, ['quién era']);
    offered = menuAt(m);
    need(offered.some((t) => /^✓ ¿Quién lleva el caso/.test(t)), 'La City se ofrece marcada como oída');
    need(game.state.sanity === sanityBeforeName - 2, `El nombre cuesta dos de cordura: ${sanityBeforeName} → ${game.state.sanity}`);
    need(game.state.flags.watkins_name === true, 'El nombre deja su flag');
    need(says(/No\. Aquí nadie la conoce\./), 'Watkins dice «Aquí nadie la conoce»');
    need(!says(/Stride|Kelly|Duke|Gotemburgo|lúpulo|Bishopsgate/), 'Ningún nombre de la identificación en la escena');

    // only the goodbye is left; repeating the hotspot adds no clue and offers nothing new
    m = MENUS.length;
    await act('watkins', null, ['Nada más']);
    offered = menuAt(m);
    need(offered.length === 6 && offered.slice(0, 5).every((t) => t.startsWith('✓ ')) && /Nada más/.test(offered[5]), `Al final todo está marcado como oído y queda «Nada más»: ${offered}`);
    need(count('berner_aviso') === 1 && count('trozo') === 1 && count('testigo') === 1, 'Ninguna pista se duplica al repetir');
    await act('corner');
    await act('east');
    expectScene('goulston');
    seen.route = 'con aviso y ciudad: llega a Goulston';

    // 2. the old route: no notice, no City line; the way east still opens with the apron and the witness
    await toMitre();
    await act('watkins', 'placa', ['Aldgate']);
    await act('watkins', null, ['vio algo']);
    await act('watkins', null, ['encontrado']);
    await act('east');
    expectScene('goulston');
    need(!game.state.clues.includes('berner_aviso') && !game.state.flags.mitre_city, 'El camino viejo no da el aviso ni la City');
    seen.oldRoute = 'llega a Goulston sin aviso ni City';

    // 3. a save that already has the apron: the notice is offered at once
    const withApron = JSON.parse(JSON.stringify(c3));
    withApron.clues = [...new Set([...withApron.clues, 'trozo'])];
    await toMitre(withApron);
    await act('watkins', 'placa', ['Aldgate']);
    m = MENUS.length;
    await act('watkins', null, ['novedades']);
    offered = menuAt(m);
    need(offered.some((t) => /novedades/.test(t)), 'Un guardado con trozo ofrece el aviso');
    need(count('berner_aviso') === 1, 'El aviso llega al pedirlo');
    seen.saveWithApron = 'ofrece el aviso sin pista previa';

    // 4. a save with the apron and the witness but no notice: the question «doble» is not shown at all
    const noNotice = JSON.parse(JSON.stringify(c3));
    noNotice.clues = [...new Set([...noNotice.clues, 'trozo', 'testigo'])];
    await start('c3', noNotice);
    need(!evaluate(game.state).some((t) => t.id === 'doble'), 'Sin aviso, doble no aparece');
    need(!QUESTIONS.double_event.visible(game.state), 'Sin aviso, double_event no se muestra');
    seen.noNotice = 'doble oculta';

    // 5. the clipping: never before chapter four, once in it
    DOCS.length = 0;
    await start('c3', c3);
    need(!DOCS.some((h) => h.includes('RECORTE DE PRENSA')), 'El recorte no aparece en el capítulo III');
    DOCS.length = 0;
    await start('c4', await fixture('saves-v1-baseline/c4.json'));
    const clips = DOCS.filter((h) => h.includes('RECORTE DE PRENSA'));
    need(clips.length === 1, `El recorte aparece una vez en el capítulo IV (${clips.length})`);
    need(clips[0].includes('Elizabeth Stride') && clips[0].includes('John Kelly'), 'El recorte lleva los dos párrafos');
    seen.clipping = 'solo en c4, una vez';

    return { seen };
  }, opts);
}
