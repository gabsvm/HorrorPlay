// Conversations with several topics (UX audit 675df9f, G.talk): the menu comes back after each topic until
// «Nada más»; a topic heard is marked ✓ and can be heard again without its effects twice; topics unlock as the
// case moves (Pike's notebook after the woman, the beat sheet after Neil); the marks survive a save and a
// resume; a save from before the marks were kept shows as heard what its flags say was heard.
//   node web/tools/walk.mjs dialogue-topics
import { scenario, fixture } from './harness.js';
import { normalizeState } from '../../src/story/progression.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, settle, flag, clue }) => {
    const MENUS = [];
    const origChoice = game.ui.choice;
    game.ui.choice = (options, o) => { MENUS.push(options.slice()); return origChoice.call(game.ui, options, o); };
    const count = (re) => window.LOG.filter((l) => re.test(l)).length;

    await start('c1', await fixture('saves-v1-baseline/c1.json'));
    await act('coat'); await act('boots'); await act('lantern');
    await act('door'); expectScene('bucks_row');

    // one visit, three topics and out: médico → quién era ella → médico again → nada más
    let m = MENUS.length;
    const unread = () => game.state.unread || 0;
    await act('pike', null, ['médico', 'quién era', 'médico', 'Nada más']);
    const menus = MENUS.slice(m);
    need(menus.length === 4, `el menú vuelve tras cada tema: ${menus.length} menús`);
    need(menus[1].some((t) => t === '✓ ¿Qué dijo el médico?'), `el médico queda marcado: ${menus[1]}`);
    need(menus[2].some((t) => t === '✓ ¿Quién era ella?'), `la mujer queda marcada: ${menus[2]}`);
    need(!menus[0].some((t) => /libreta/.test(t)) && menus[2].some((t) => /libreta/.test(t)), 'la libreta se abre tras preguntar por ella');
    need(menus.every((x) => x[x.length - 1] === 'Nada más.'), 'siempre hay una salida explícita al final');
    need(count(/Llewellyn cree que los cortes/) === 2, 'el médico se puede volver a oír');
    need(clue('zurdo') && clue('anatomia') && game.state.clues.filter((c) => c === 'zurdo').length === 1, 'oírlo dos veces no duplica la pista');
    const u = unread();
    await act('pike', null, ['médico', 'Nada más']);
    need(unread() === u, 'volver a oír al médico no anota nada nuevo en el cuaderno');
    const seen = game.state.conversationSeen['bucks_row:pike'];
    need(JSON.stringify(seen) === JSON.stringify(['doc', 'polly']), `las marcas se guardan por escena y personaje: ${JSON.stringify(seen)}`);

    // the lead, heard again, does not take the objective back to the knacker's yard
    await act('pike', null, ['trabaja de noche']);
    need(flag('knackers_lead'), 'la pista del desolladero');
    game.state.objective = 'otro objetivo';
    const obj = game.state.objective;
    await act('pike', null, ['trabaja de noche']);
    need(count(/Barber tiene un desolladero/) === 2 && game.state.objective === obj, 'oír otra vez la pista no cambia el objetivo');

    // the beat sheet unlocks after Neil
    m = MENUS.length;
    await act('pike', null, ['Nada más']);
    need(!MENUS[m].some((t) => /hoja de rondas/.test(t)), 'sin Neil no hay hoja de rondas');
    await act('neil');
    m = MENUS.length;
    await act('pike', null, ['Nada más']);
    need(MENUS[m].some((t) => t === 'La hoja de rondas de esta noche.'), 'tras Neil, la hoja de rondas (una acción, sin marca)');

    // a topic that closes the conversation: after the beat sheet no menu of Pike's comes back, so a spare pick
    // is left over (the FAST rule «no picks left, leave» cannot hide a menu that reopens)
    let spare = '';
    try { await act('pike', null, ['La hoja de rondas de esta noche.', 'Entre las 3:30 y las 3:40', 'Nada más']); } catch (e) { spare = e.message; }
    need(/Sobraron elecciones/.test(spare) && clue('ronda'), `tras la hoja de rondas la conversación se cierra: ${spare || 'el menú volvió'}`);
    window.PICKS = [];
    // every action topic in the scenes closes its conversation
    const fs = await import('node:fs');
    for (const f of ['bucks_row', 'knackers']) {
      const code = fs.readFileSync(new URL(`../../src/scenes/${f}.js`, import.meta.url), 'utf8');
      for (const id of ['beats', 'book', 'close']) {
        const at = code.indexOf(`{ id: '${id}', label:`);
        if (at < 0) continue;
        need(/ends: true/.test(code.slice(at, code.indexOf('\n', at))), `${f}: el tema «${id}» debe cerrar la conversación (ends)`);
      }
    }

    // save and resume: the marks stay
    await game.resume({ state: JSON.parse(JSON.stringify(game.state)), x: Math.round(game.player.x), facing: 1 });
    await settle();
    m = MENUS.length;
    await act('pike', null, ['Nada más']);
    need(MENUS[m].includes('✓ ¿Qué dijo el médico?') && MENUS[m].includes('✓ ¿Quién era ella?'), `las marcas sobreviven a reanudar: ${MENUS[m]}`);

    // Brennan: coartada → oír algo, the second unlocked by the first
    await act('west'); expectScene('knackers');
    m = MENUS.length;
    await act('brennan', null, ['tres y media', 'oyeron', 'Nada más']);
    need(!MENUS[m].some((t) => /oyeron/.test(t)) && MENUS[m + 1].some((t) => t === '¿No oyeron nada?'), '«¿No oyeron nada?» llega tras la coartada');
    need(MENUS[m + 2].includes('✓ ¿Dónde estaba a las tres y media?') && MENUS[m + 2].includes('✓ ¿No oyeron nada?'), 'Brennan: los dos temas quedan marcados');

    // an old save: no marks kept, but its flags say what was heard
    const old = await fixture('saves-v1-baseline/c1.json');
    delete old.conversationSeen;
    const s = normalizeState(JSON.parse(JSON.stringify(old)));
    need(s.conversationSeen && typeof s.conversationSeen === 'object' && !Object.keys(s.conversationSeen).length, 'la migración añade un registro vacío');
    const again = normalizeState(JSON.parse(JSON.stringify({ ...s, conversationSeen: { 'a:b': ['x', 'x', 3], bad: 'y' } })));
    need(JSON.stringify(again.conversationSeen) === '{"a:b":["x"]}', `la migración limpia y es idempotente: ${JSON.stringify(again.conversationSeen)}`);
    await start('c1', { ...old, flags: { ...old.flags, br_alibi: true, knackers_lead: true } });
    await act('coat'); await act('boots'); await act('lantern'); await act('door');
    await act('west');
    m = MENUS.length;
    await act('brennan', null, ['Nada más']);
    need(MENUS[m].includes('✓ ¿Dónde estaba a las tres y media?'), `una partida antigua con la coartada oída la muestra marcada: ${MENUS[m]}`);
    // right after a scripted first meeting the topics are offered at once (UX-B06): Greaves's question about the
    // cut is already marked; Pike's first beat, then his menu with Phillips marked
    await start('c2', await fixture('saves-v1-baseline/c2.json'));
    expectScene('hanbury');
    m = MENUS.length;
    await act('greaves', null, ['corte', 'Dónde puedo', 'Nada más']);
    const gm = MENUS.slice(m);
    need(gm.length === 3 && gm[1].includes('✓ ¿Qué opina del corte?') && gm[1].includes('¿Dónde puedo encontrarle?'), `tras conocer a Greaves, sus temas sin volver a pulsarlo: ${JSON.stringify(gm)}`);
    need(count(/Parece trabajo de alguien acostumbrado/) === 1, 'el corte no se repite solo');
    if (!clue('ordenados')) {
      m = MENUS.length;
      await act('pike', null, ['Nada más']);
      need(MENUS[m] && MENUS[m].includes('✓ ¿Qué calcula Phillips?'), `tras el primer encuentro con Pike, su menú: ${MENUS[m]}`);
    }
    // a headless pass with no picks after a first meeting leaves the menu at once (it does not replay a topic)
    const n = window.LOG.length;
    await act('amelia');
    need(!window.LOG.slice(n).some((l) => /cobran por mirar/.test(l)), 'sin elección, la primera visita no reproduce un tema');
    return { menus: MENUS.length };
  }, opts);
}
