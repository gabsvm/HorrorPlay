// The same stretches at different sanity: 10, 36, 64, 100. Every band gets through; the raps' help
// starts earlier when frayed; Wren's last line always answers what Thomas did, and the band only
// changes how she begins it.
//   node web/tools/walk.mjs sanity
import { scenario, fixture } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, deduce, need, expectScene, waitScene, settle }) => {
    const out = {};
    for (const level of [10, 36, 64, 100]) {
      // the séance's raps
      const c2 = await fixture('saves-v1-baseline/c2.json');
      c2.sanity = level;
      await start('c2', c2);
      game.state.sanity = level;   // the chapter adds its own; pin it for the test
      await act('greaves', null, ['corte']); await act('apron'); await act('comb', null, ['Guardármelo']);
      await act('passage'); expectScene('seance');
      game.state.sanity = level;
      await act('chart'); await act('table');
      game.state.sanity = level;   // the chart and the knocks cost a little; read at exactly this level
      const n = window.LOG.length;
      await act('table');
      const help = Number((window.LOG.slice(n).join(' ').match(/ayuda (\d)/) || [])[1]);
      need(game.state.clues.includes('hospes'), `Con cordura ${level} se leen los golpes`);
      need(help === (level <= 35 ? 1 : 0), `Ayuda inicial de los golpes con cordura ${level}: ${help}`);
      // the ending
      const c4 = await fixture('saves-v1-baseline/c4.json');
      await start('c4', c4);
      await act('drawer', 'bisturi');
      await act('cabinet', 'llave', ['Todavía no sé quién la escribió.', 'acusando', 'Romper el folio']);
      await waitScene('foreshore');
      for (const c of ['zurdo', 'bisturi', 'testigo']) await deduce('ficha', c);
      game.state.sanity = level;
      const m = window.LOG.length;
      await act('water', null, ['Responder']);
      await waitScene('millers');
      for (let i = 0; i < 400 && !game.inMenu; i++) await new Promise((r) => setTimeout(r, 20));
      await settle();
      const wren = window.LOG.slice(m).filter((l) => /^Wren: (Era Thomas|No era este)/.test(l))[0] || '';
      need(/Romper papeles no cambia los nombres/.test(wren), `Con cordura ${level} Wren responde a lo que hizo Thomas: «${wren}»`);
      need(level <= 35 ? /^Wren: No era este/.test(wren) : /^Wren: Era Thomas/.test(wren), `El comienzo de su frase depende de la banda (${level})`);
      need(game.inMenu, `Con cordura ${level} el juego termina`);
      out[level] = { help, wren: wren.slice(6, 40) };
    }
    return { out };
  }, opts);
}
