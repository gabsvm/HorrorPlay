// Mobile (UX audit 675df9f, block 4): a finger that lands just outside a hotspot still reaches it, within
// 24 CSS px, and a person comes before a way out; a mouse keeps exact rectangles. With reduced motion the
// shocks never move the camera: flash, red and shake leave no punch.
//   node web/tools/walk.mjs touch-motion
import { scenario, fixture } from './harness.js';
import { prefs } from '../../src/engine/prefs.js';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene }) => {
    await start('c1', await fixture('saves-v1-baseline/c1.json'));
    await act('coat'); await act('boots'); await act('lantern');
    await act('door'); expectScene('bucks_row');
    const rectOf = (id) => { const h = game.activeHotspots().find((x) => x.id === id); return typeof h.rect === 'function' ? h.rect(game.G) : h.rect; };
    const [x, y, w, hh] = rectOf('pike');
    const cx = game.r.cam.x;
    // the stub stage has no size: one logical unit per CSS px, so the tolerance is 24 units
    const beside = { x: x + w + 12 - cx, y: y + hh / 2 };
    need(game.hotspotAt({ ...beside, touch: false })?.id !== 'pike', 'con ratón, fuera del rectángulo no hay nada');
    need(game.hotspotAt({ ...beside, touch: true })?.id === 'pike', 'con el dedo, 12 px al lado de Pike llega a Pike');
    need(!game.hotspotAt({ x: x + w + 40 - cx, y: y + hh / 2, touch: true }) || game.hotspotAt({ x: x + w + 40 - cx, y: y + hh / 2, touch: true }).id !== 'pike', 'a 40 px ya no');
    // inside a rectangle the exact hit wins as before
    need(game.hotspotAt({ x: x + w / 2 - cx, y: y + hh / 2, touch: true })?.id === 'pike', 'dentro, Pike');
    // semantic priority: a made-up exit and a person, both 10 px away, the person first
    const fake = [{ id: 'out', cursor: 'exit', rect: [x + w + 20, y, 40, hh] }, { id: 'pike', cursor: 'talk', rect: [x, y, w, hh] }];
    const real = game.activeHotspots;
    game.activeHotspots = () => fake;
    try {
      need(game.hotspotAt({ x: x + w + 10 - cx, y: y + hh / 2, touch: true })?.id === 'pike', 'a la misma distancia, la persona antes que la salida');
    } finally { game.activeHotspots = real; }

    // reduced motion: no punch from any shock
    const before = prefs.reduceMotion;
    try {
      prefs.reduceMotion = true;
      game.punch = 0;
      game.G.flash(); game.G.red(); game.G.shake(10);
      need(game.punch === 0 && game.r.cam.shake === 0, `con movimiento reducido no hay golpe de cámara: punch ${game.punch}, shake ${game.r.cam.shake}`);
      prefs.reduceMotion = false;
      game.G.flash();
      need(game.punch > 0, 'sin el modo reducido el golpe sigue');
    } finally { prefs.reduceMotion = before; game.punch = 0; game.r.cam.shake = 0; }
    return { ok: true };
  }, opts);
}
