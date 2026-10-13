// The first victims after V4-09: the September clipping opens chapter two once, before its card, and
// not again on a resume or in chapter three; Pike's answer about the woman of Buck's Row is one line
// (the hat), and the notebook question is still offered after it; Hanbury Street names the woman only
// as a rumour of the house; the October clipping keeps its one line about the hop-picking.
//   node web/tools/walk.mjs victims
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, settle }) => {
    // the menus the game offers (the text of each option), in order; the picks still go through the real UI
    const MENUS = [];
    const origChoice = game.ui.choice;
    game.ui.choice = (options, o) => { MENUS.push(options.slice()); return origChoice.call(game.ui, options, o); };
    // the documents and the cards the game shows, in the order they come
    const ORDER = [];
    const origDoc = game.ui.doc;
    game.ui.doc = (html) => { ORDER.push(['doc', String(html)]); return origDoc.call(game.ui, html); };
    const origCard = game.ui.card;
    game.ui.card = (k, t, s, ms) => { ORDER.push(['card', k, t]); return origCard.call(game.ui, k, t, s, ms); };
    const says = (re) => window.LOG.some((l) => re.test(l));
    const menuAt = (from) => MENUS.slice(from).at(-1) || [];
    const isSept = ([k, v]) => k === 'doc' && v.includes('RECORTE DE PRENSA — SEPTIEMBRE DE 1888');
    const isOct = ([k, v]) => k === 'doc' && v.includes('RECORTE DE PRENSA — OCTUBRE DE 1888');

    // 1. chapter two opens with the September clipping, once, and the card comes after it
    await start('c2', await fixture('saves-v1-baseline/c2.json'));
    expectScene('hanbury');
    const sept = ORDER.filter(isSept);
    need(sept.length === 1, `El recorte de septiembre aparece una vez al entrar en el capítulo II (${sept.length})`);
    const at = ORDER.findIndex(isSept);
    const card = ORDER.findIndex(([k, c]) => k === 'card' && c === 'Capítulo II');
    need(at >= 0 && card > at, `El recorte va antes de la tarjeta del capítulo II (${at}, ${card})`);
    need(sept[0][1].includes('El 31 de agosto, una compañera del asilo de Lambeth reconoció a la mujer de Buck\'s Row'), 'Cuerpo del recorte');

    // Hanbury Street: the house's rumour, the trade, and the hotspot with no name in it
    need(says(/Dicen en la casa que es Annie, de Dorset Street\. Hay que confirmarlo\./), 'La línea de la casa en Hanbury');
    need(says(/Dicen que hacía ganchillo y vendía flores/), 'La línea del oficio en Hanbury');
    need(!says(/Dark Annie|Annie Chapman/), 'Ningún nombre de Chapman en la escena de Hanbury');

    // a resume in chapter two shows nothing again
    await game.resume({ state: JSON.parse(JSON.stringify(game.state)), x: 240, facing: 1 });
    await settle();
    need(ORDER.filter(isSept).length === 1, 'Reanudar en el capítulo II no repite el recorte');

    // 2. chapter three never shows it
    ORDER.length = 0;
    await start('c3', await fixture('saves-v1-baseline/c3.json'));
    need(!ORDER.some(isSept), 'El recorte de septiembre no aparece en el capítulo III');

    // 3. Buck's Row: the hat is the one answer about the woman, and the notebook is still offered after it
    await start('c1', await fixture('saves-v1-baseline/c1.json'));
    await act('coat'); await act('boots'); await act('lantern');
    await act('door'); expectScene('bucks_row');
    let m = MENUS.length;
    await act('pike', null, ['Quién era ella']);
    need(game.state.flags.pike_polly === true, 'La opción deja pike_polly');
    need(says(/Tiene al lado un sombrero de paja negro; parece nuevo\. Alguien lo eligió con cuidado\./), 'La línea del sombrero se dice');
    need(!says(/cinco hijos|peniques|encargada/), 'Ningún dato de vida en la escena');
    // the menu again, closed with «Nada más»: the notebook is offered, the woman's question is not
    m = MENUS.length;
    await act('pike', null, ['Nada más']);
    const offered = menuAt(m);
    need(offered.some((t) => /libreta/.test(t)), `La libreta sigue ofreciéndose tras el sombrero: ${offered}`);
    need(offered.some((t) => /^✓ ¿Quién era ella/.test(t)), '«¿Quién era ella?» se ofrece marcada como oída');
    await act('pike', null, ['libreta']);
    need(game.state.flags.pike_notes === true, 'La libreta deja pike_notes');
    need(says(/Quién entra\. Quién sale\. A qué hora\./), 'Pike contesta sobre la libreta');

    // 4. chapter four: the October clipping with its one line about the hop-picking
    ORDER.length = 0;
    await start('c4', await fixture('saves-v1-baseline/c4.json'));
    const oct = ORDER.filter(isOct);
    need(oct.length === 1, `El recorte de octubre aparece una vez en el capítulo IV (${oct.length})`);
    const hop = oct[0][1].split('recogida del lúpulo').length - 1;
    need(hop === 1, `La línea del lúpulo aparece una vez (${hop})`);

    return { seen: { september: 'antes de la tarjeta de c2, una vez, no en c3', pike: 'sombrero; libreta accesible', october: 'lúpulo una vez' } };
  }, opts);
}
