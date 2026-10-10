// Goulston Street after V4-05: the first finding (its order, one chase, the clues it leaves), the
// second reading, an old save that has seen the chalk, the jamb drawn as unreadable strokes with no
// text, the same finding at high and low sanity, and the chalk vision with reduced motion.
// The chase itself is in chapter3.js and walkthrough.js.
//   node web/tools/walk.mjs goulston
import { scenario, fixture } from './harness.js';
import { prefs } from '../../src/engine/prefs.js';
import { CLUES } from '../../src/story/data.js';
import goulstonScene from '../../src/scenes/goulston.js';

// the clean run, as chapter3.js picks it: run, then the junctions
const CHOICES = ['Correr', 0, 1, 1];

// a canvas context that records which operations were called (and never draws)
const recorder = () => {
  const ops = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (...a) => { ops.push(String(k)); }),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  return { ctx, ops };
};

export async function run(opts) {
  return scenario(async ({ game, start, act, need, waitScene, expectScene, settle, flag }) => {
    const c3 = await fixture('saves-v1-baseline/c3.json');
    const c3second = await fixture('saves-v1-baseline-second/c3.json');

    // the chase's hook, counted: what the state holds when it starts, and where the log stands
    const hooks = game.chapterHooks;
    const realCaught = hooks.caught;
    let caughtAt = [];
    hooks.caught = async (G) => {
      caughtAt.push({ clues: [...game.state.clues], chalk: !!game.state.flags.chalk_seen, paper: !!game.state.flags.paper_read, clock: game.state.clock, logAt: window.LOG.length });
      return realCaught(G);
    };

    const enter = async (snap, { second = false } = {}) => {
      await start('c3', snap, { second });
      await game.goto('goulston', { x: 160, facing: 1 });
      await settle();
      expectScene('goulston');
      caughtAt = [];
    };

    try {
      // ---- the first finding, first reading
      await enter(c3);
      need(!flag('apron_found') && !flag('chalk_seen'), 'Partida nueva: la jamba aún no se ha visto');
      let n = window.LOG.length;
      await act('doorway', null, [...CHOICES]);
      await waitScene('room');
      let log = window.LOG.slice(n, caughtAt[0]?.logAt).join('\n');
      need(caughtAt.length === 1, `caught debe llamarse una vez; se llamó ${caughtAt.length} veces`);
      const at = caughtAt[0];
      need(at.clues.includes('goulston_historic') && at.clues.includes('aqui_estoy'), 'Al empezar la persecución ya están las dos pistas');
      need(game.state.clues.indexOf('goulston_historic') < game.state.clues.indexOf('aqui_estoy'), 'goulston_historic debe darse antes que aqui_estoy');
      need(!at.paper && at.clock === '2:55', `El hallazgo es a las 2:55 sin periódico leído (${at.clock}, paper ${at.paper})`);
      need(!/borr/i.test(CLUES.goulston_historic.text({ flags: { paper_read: false } })), 'goulston_historic a las 2:55 no menciona el borrado');
      need(flag('apron_found') && flag('chalk_seen'), 'Quedan marcadas la jamba y la tiza');
      need(/Ashgrove: En el ladrillo mojado, junto a la jamba, creo leer HERE I AM\. Parpadeo y es solo agua\./.test(log), 'Primera lectura: el pensamiento exacto');
      need(/Ashgrove: ¿Lo he leído o lo he oído\?/.test(log) || flag('answered1866'), 'Primera lectura: «¿Lo he leído o lo he oído?» si no contestó en 1866');
      need(!/Reconozco la A/.test(log), 'La primera lectura no reconoce la A');
      need(!/·: Aquí estoy/.test(log), 'La primera lectura no tiene la voz «Aquí estoy»');
      need(!/Yo no respondí entonces\. ¿Quién escribió esto\?/.test(log), 'Ya no se dice «¿Quién escribió esto?»');

      // ---- a second visit: the guard, nothing again
      const before = game.state.clues.length;
      await game.goto('goulston', { x: 160, facing: 1 });
      await settle();
      caughtAt = [];
      await act('doorway');
      need(caughtAt.length === 0 && game.state.clues.length === before, 'La segunda visita no repite nada ni llama a caught');

      // ---- the second reading: the same scene, said as it was
      await enter(c3second, { second: true });
      n = window.LOG.length;
      await act('doorway', null, [...CHOICES]);
      await waitScene('room');
      log = window.LOG.slice(n, caughtAt[0]?.logAt).join('\n');
      need(caughtAt.length === 1, `Segunda lectura: caught una vez (${caughtAt.length})`);
      need(/Ashgrove: En el ladrillo mojado, letra inclinada\. Reconozco la A antes de leer la frase\./.test(log), 'Segunda lectura: el pensamiento de la A');
      need(!/·: Aquí estoy/.test(log), 'Segunda lectura: sin voz nueva');
      need(!/creo leer/.test(log), 'Segunda lectura: no vuelve la primera lectura');

      // ---- an old save with the chalk already seen: no retroactive historic clue, aqui_estoy kept
      const old = JSON.parse(JSON.stringify(c3));
      old.flags.apron_found = true; old.flags.chalk_seen = true; old.clues.push('aqui_estoy');
      await enter(old);
      await act('doorway');
      need(caughtAt.length === 0, 'Guardado con chalk_seen: no vuelve a empezar la escena');
      need(!game.state.clues.includes('goulston_historic'), 'Guardado antiguo: goulston_historic no se añade retroactivamente');
      need(game.state.clues.includes('aqui_estoy'), 'Guardado antiguo: aqui_estoy se conserva');
      // the jamb is drawn with strokes, always, and never with text, with or without the mark
      for (const seen of [true, false]) {
        const { ctx, ops } = recorder();
        game.state.flags.chalk_seen = seen;
        goulstonScene.drawNear.call(goulstonScene, ctx);
        need(ops.includes('stroke') && !ops.includes('fillText') && !ops.includes('strokeText'), `drawNear (chalk_seen=${seen}): trazos sin texto (${ops.join(',')})`);
      }
      need(goulstonScene.drawGlow === undefined, 'La jamba no tiene brillo (drawGlow)');

      // ---- high and low sanity: the same finding, the same log and state up to the chase
      const runAt = async (sanity) => {
        const s = JSON.parse(JSON.stringify(c3));
        s.sanity = sanity;
        await enter(s);
        const n0 = window.LOG.length;
        await act('doorway', null, [...CHOICES]);
        await waitScene('room');
        const c = caughtAt[0];
        return { clues: c.clues, log: window.LOG.slice(n0, c.logAt).join('\n'), apron: flag('apron_found'), chalk: flag('chalk_seen') };
      };
      const high = await runAt(100), low = await runAt(10);
      need(JSON.stringify(high) === JSON.stringify(low), 'Cordura alta y baja dan el mismo hallazgo');

      // ---- the vision of the chalk, with reduced motion: one picture, faded, no flash
      const v = document.getElementById('vision');
      const watch = () => {
        const seen = [];
        const style = v.style;
        v.style = new Proxy(style, { set: (o, k, val) => { if (k === 'opacity') seen.push(val); o[k] = val; return true; } });
        return () => { v.style = style; return seen; };
      };
      const play = async (calm) => {
        prefs.reduceMotion = calm;
        game.punch = 0;
        const stop = watch();
        window.FAST = false;
        try { await game.G.vision('chalk'); } finally { window.FAST = true; }
        return { opacities: stop(), punch: game.punch, hidden: v.classList.contains('hidden') };
      };
      const before2 = prefs.reduceMotion;
      try {
        const calm2 = await play(true);
        need(JSON.stringify(calm2.opacities) === JSON.stringify(['0', '0.7', '0', '']), `Visión de tiza con movimiento reducido: ${JSON.stringify(calm2.opacities)}`);
        need(Math.max(...calm2.opacities.map(Number)) <= 0.7 && calm2.punch === 0 && calm2.hidden, `Sin destellos ni golpe: ${JSON.stringify(calm2)}`);
        const full2 = await play(false);
        need(full2.opacities.length === 3 && full2.punch > 0 && full2.hidden, `Visión de tiza normal (tres destellos): ${JSON.stringify(full2)}`);
      } finally { prefs.reduceMotion = before2; }
    } finally {
      hooks.caught = realCaught;
    }
    return {};
  }, opts);
}
