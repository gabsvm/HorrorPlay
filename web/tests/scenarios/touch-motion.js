// Mobile (UX audit 675df9f, block 4; b69323b UX-B02/B03): a finger that lands just outside a hotspot still
// reaches it, within 24 CSS px; distance decides and the kind of thing only breaks a near tie; a mouse keeps
// exact rectangles. An object in hand survives a step on empty ground and a use that does not work. With reduced motion the
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
    // distance decides; the kind of thing only breaks a near tie (UX-B02)
    const real = game.activeHotspots;
    const at = (list, px) => { game.activeHotspots = () => list; try { return game.hotspotAt({ x: px - cx, y: y + hh / 2, touch: true })?.id; } finally { game.activeHotspots = real; } };
    const R = x + w;   // the person's right edge
    // a person at 23 and a thing at 1: the thing
    need(at([{ id: 'pike', cursor: 'talk', rect: [x, y, w, hh] }, { id: 'thing', rect: [R + 24, y, 20, hh] }], R + 23) === 'thing', 'un objeto a 1 gana a una persona a 23');
    // the same distance: the person before the way out, the thing before the way out
    need(at([{ id: 'out', cursor: 'exit', rect: [R + 20, y, 40, hh] }, { id: 'pike', cursor: 'talk', rect: [x, y, w, hh] }], R + 10) === 'pike', 'a la misma distancia, la persona antes que la salida');
    need(at([{ id: 'out', cursor: 'exit', rect: [R + 20, y, 40, hh] }, { id: 'thing', rect: [x, y, w, hh] }], R + 11) === 'thing', 'casi a la misma distancia, el objeto antes que la salida');
    // a clear difference wins over the kind: the way out at 2, the person at 18
    need(at([{ id: 'out', cursor: 'exit', rect: [R + 20, y, 40, hh] }, { id: 'pike', cursor: 'talk', rect: [x, y, w, hh] }], R + 18) === 'out', 'la salida mucho más cerca gana a la persona');

    // an object in hand: empty ground is a step, it does not let the object go (UX-B03)
    game.selectedItem = game.state.items[0]; game.refreshInventory();
    const held = game.selectedItem;
    const [wa, wb] = game.scene.walk;
    let ground = null;
    for (let gx = wa + 10; gx < wb && !ground; gx += 15) if (!game.hotspotAt({ x: gx - cx, y: 700, touch: false })) ground = gx;
    await game.onClick({ x: ground - cx, y: 700 }, false);
    need(game.selectedItem === held, `tocar el suelo con un objeto en la mano no lo suelta: ${game.selectedItem}`);
    const wait = async () => { for (let i = 0; i < 400 && game.running; i++) await new Promise((r) => setTimeout(r, 5)); };
    const tap = async (id) => { const [hx, hy, hw, hh2] = rectOf(id); await game.onClick({ x: hx + hw / 2 - game.r.cam.x, y: hy + hh2 / 2 }, false); await wait(); };
    // a wrong use on a thing says so and leaves it in hand to try elsewhere
    window.PICKS = [];
    const n = window.LOG.length;
    await tap('window');
    need(game.selectedItem === held && window.LOG.length > n, `un uso que no sirve en una cosa lo dice y deja el objeto en la mano: ${game.selectedItem}`);
    // on a person it is put away, so the next tap talks instead of repeating «no sirve» (review of UX-B03)
    window.PICKS = ['Nada más'];
    await tap('pike');
    need(game.selectedItem === null, `tras un uso que no sirve con una persona, el objeto se guarda: ${game.selectedItem}`);
    window.PICKS = [];
    // a way out that takes no object is taken with the object still in hand (the test does not leave: west
    // needs the lead; the object is still checked to stay)
    game.selectedItem = held; game.refreshInventory();
    await tap('west');
    need(game.selectedItem === held, `una salida sin uso no gasta un intento con el objeto: ${game.selectedItem}`);
    game.selectItem(null);

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
