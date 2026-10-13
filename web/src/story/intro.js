// The frame before the prologue (about 13 seconds): the notebook found in the Black Ditch, one line over Whitechapel
// in the rain, and the first page in his hand. It promises the question the game will answer and seeds the ending.
// Only on a new game; a press skips it. The full police record of the notebook is not in the opening: it is in the
// menu, as a document of 1888 (recordHtml), never as an item of the boy's inventory of 1866 (V4-10).

import { prefs } from '../engine/prefs.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// the police record of the notebook: kept whole for the menu (not for the opening)
export const RECORD = [
  ['h', 'POLICÍA METROPOLITANA · DIVISIÓN H'],
  ['s', 'Registro de efectos. Objeto n.º 214.'],
  ['p', 'Cuaderno de tapas de hule, muy deteriorado por el agua. Hallado en la boca del desagüe del Black Ditch, en Limehouse, el 10 de noviembre de 1888.'],
  ['p', 'Propiedad del inspector T. Ashgrove, de esta División, en paradero desconocido.'],
  ['p', 'Las anotaciones están escritas con dos caligrafías distintas.'],
];

// the record as one document, for the menu: dated 1888, outside the story's inventory
export function recordHtml() {
  const body = RECORD.map(([k, t]) => (k === 'h' ? `<h3>${t}</h3>` : k === 's' ? `<p class="small">${t}</p>` : `<p>${t}</p>`)).join('');
  return `<p class="small">Documento de 1888 · no es un objeto de Thomas</p>${body}`;
}

// the opening's own lines: where the notebook was found and the two hands in it; one line over the street; the first page
const FOUND = 'Hallado en el desagüe del Black Ditch. Dos caligrafías.';

// one line over the street; the name (his, and the other) is for the game to find, not to announce
const LINES = [
  'Otoño de 1888. Alguien está matando mujeres en Whitechapel.',
];

const PAGE = 'Para entender lo que pasó este otoño tengo que empezar por el río. Por Nat.';

export async function playIntro(G) {
  if (window.FAST) return;
  const game = G.game, audio = G.audio;
  const box = document.getElementById('intro');
  const doc = box.querySelector('.intro-doc'), line = box.querySelector('.intro-line'), page = box.querySelector('.intro-page');
  let skipped = false, onSkip, closedAt = 0;
  const skipP = new Promise((r) => { onSkip = r; });
  const w = (ms) => Promise.race([wait(ms), skipP]);
  const skip = (e) => {
    if (e.type === 'keydown' && ![' ', 'Enter', 'Escape'].includes(e.key)) return;
    e.preventDefault(); e.stopPropagation();
    if (e.repeat) return;   // a held key is one press
    // a second press just after the first (a double click, a double tap) is not a skip of the whole intro
    if (performance.now() - closedAt < 600) return;
    closedAt = performance.now();
    skipped = true; onSkip();
  };
  window.addEventListener('pointerdown', skip, true);
  window.addEventListener('keydown', skip, true);
  const show = (el, on) => el.classList.toggle('on', on);

  // types text into an element, one character at a time, with a sound per few letters
  const type = async (el, text, ms, sound) => {
    for (let i = 1; i <= text.length && !skipped; i++) {
      el.textContent = text.slice(0, i);
      if (sound && i % 3 === 0) sound();
      await w(text[i - 1] === '.' || text[i - 1] === ',' ? ms * 6 : ms);
    }
    el.textContent = text;
  };

  game.ui.hud && game.ui.showHud(false);
  box.className = 'black';
  box.classList.remove('hidden');
  audio.setBeds({ rain: 0.35, drone: 0.08 }, 2);
  try {
    // 1. the notebook, where it was found and the two hands in it (about 4 seconds)
    await w(200);
    show(line, true);
    await type(line, FOUND, 26, () => audio.tick());
    await w(1600);
    show(line, false);
    await w(400);

    // 2. Whitechapel in the rain, one line (about 4 seconds)
    if (!skipped) {
      await game.goto('bucks_row', { fade: false, noEnter: true });
      game.player.visible = false;
      game.actors = [game.player];          // an empty street: only her, under the cape, and the rain
      game.ui.showHud(false);
      game.stage.classList.add('cinema');
      game.camFocus = 2100;
      game.r.cam.x = game.camTarget();
      box.className = 'clear';
      const t0 = performance.now();
      let panning = true;
      const pan = () => { if (!panning) return; game.camFocus = 2100 - Math.min(1, (performance.now() - t0) / 9000) * 1200; requestAnimationFrame(pan); };
      // the menu's own slow sway stops here: the street's framing is the intro's (F11, shot "Intro")
      game.menuPan = false;
      // the slow look at the street; with reduced motion the frame stays where it is
      if (!prefs.reduceMotion) pan();
      game.fadeTo(0, 1500);
      await w(600);
      for (const text of LINES) {
        if (skipped) break;
        line.textContent = text;
        show(line, true);
        await w(3300);   // 59 characters at 17–20 a second need about 3–3.5 s
        show(line, false);
        await w(300);
      }
      await Promise.race([game.fadeTo(1, 800), skipP]);
      panning = false;
      game.stage.classList.remove('cinema');
      box.className = 'black';
    }

    // 3. the first page, in his own hand, and the signature (about 5 seconds). Silence before the page (F11, shot "Intro")
    if (!skipped) {
      audio.setBeds({ rain: 0, drone: 0 }, 0.6);
      await w(700);   // the silence has fallen before the page appears
      page.querySelector('.text').textContent = '';
      page.querySelector('.sig').classList.remove('on');
      show(page, true);
      await w(400);
      await type(page.querySelector('.text'), PAGE, 42, () => audio.pen());
      await w(400);
      page.querySelector('.sig').classList.add('on');
      await w(1000);
      show(page, false);
      await w(200);
    }
  } finally {
    window.removeEventListener('pointerdown', skip, true);
    window.removeEventListener('keydown', skip, true);
    show(doc, false); show(line, false); show(page, false);
    box.classList.add('hidden');
    game.stage.classList.remove('cinema');
    game.camFocus = null;
    game.player.visible = true;
    game.r.fx.fade = 1;
  }
}
