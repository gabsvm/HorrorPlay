// Reduced motion reaches the visions too: one still image, faded in and out, no flicker and no
// camera punch. And the sanity bar's colour follows the perception bands of story/perception.js.
//   node web/tools/walk.mjs calm
import { scenario } from './harness.js';
import { prefs } from '../../src/engine/prefs.js';
import { STEADY, FRAYED } from '../../src/story/perception.js';

export async function run(opts) {
  return scenario(async ({ game, need }) => {
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
      try { await game.G.vision('hands'); } finally { window.FAST = true; }
      return { opacities: stop(), punch: game.punch, hidden: v.classList.contains('hidden') };
    };
    const before = prefs.reduceMotion;
    try {
      const calm = await play(true);
      need(JSON.stringify(calm.opacities) === JSON.stringify(['0', '0.7', '0', '']), `Visión con movimiento reducido: ${JSON.stringify(calm.opacities)}`);
      need(calm.punch === 0 && calm.hidden, `Sin golpe de cámara y oculta al final: ${JSON.stringify(calm)}`);
      const full = await play(false);
      need(full.opacities.length === 3 && full.punch > 0 && full.hidden, `Visión normal (tres destellos): ${JSON.stringify(full)}`);
    } finally { prefs.reduceMotion = before; }

    // the bar's colour is the band
    const bar = document.getElementById('sanity-fill');
    const colour = (n) => { game.ui.setSanity(n); return bar.style.background; };
    const steady = colour(100), strained = colour(50), frayed = colour(10);
    need(new Set([steady, strained, frayed]).size === 3, 'Tres colores distintos');
    for (const [n, want] of [[STEADY, steady], [STEADY - 1, strained], [60, strained], [FRAYED + 1, strained], [FRAYED, frayed], [30, frayed]]) {
      need(colour(n) === want, `Cordura ${n}: color de la banda equivocado`);
    }
    game.ui.setSanity(game.state.sanity);
    return {};
  }, opts);
}
