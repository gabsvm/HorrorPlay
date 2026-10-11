// The frame before the prologue: the notebook found in the Black Ditch after Ashgrove vanished,
// one slow look at Whitechapel in the rain, and the first page in his hand. It promises the
// question the game will answer and seeds the ending. Only on a new game; a click skips it.

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const RECORD = [
  ['h', 'POLICÍA METROPOLITANA · DIVISIÓN H'],
  ['s', 'Registro de efectos. Objeto n.º 214.'],
  ['p', 'Cuaderno de tapas de hule, muy deteriorado por el agua. Hallado en la boca del desagüe del Black Ditch, en Limehouse, el 10 de noviembre de 1888.'],
  ['p', 'Propiedad del inspector T. Ashgrove, de esta División, en paradero desconocido.'],
  ['p', 'Las anotaciones están escritas con dos caligrafías distintas.'],
];

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
  let skipped = false, onSkip;
  const skipP = new Promise((r) => { onSkip = r; });
  const w = (ms) => Promise.race([wait(ms), skipP]);
  const skip = (e) => {
    if (e.type === 'keydown' && ![' ', 'Enter', 'Escape'].includes(e.key)) return;
    e.preventDefault(); e.stopPropagation();
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
    // 1. the record of effects
    await w(900);
    doc.innerHTML = RECORD.map(([k]) => `<div class="${k}"></div>`).join('');
    show(doc, true);
    await w(700);
    const rows = doc.children;
    for (let i = 0; i < RECORD.length && !skipped; i++) {
      await type(rows[i], RECORD[i][1], RECORD[i][0] === 'p' ? 20 : 26, () => audio.tick());
      await w(RECORD[i][0] === 'p' ? 500 : 250);
    }
    // the record stays long enough for a reader to finish its last row: the rows are typed faster than they are read,
    // so the last one needs about 8 s after it is typed (V4-10; it was 1.5 s, then 5 s, both too short)
    await w(8000);
    show(doc, false);
    await w(600);

    // 2. Whitechapel in the rain, three lines
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
      const pan = () => { if (!panning) return; game.camFocus = 2100 - Math.min(1, (performance.now() - t0) / 11000) * 1200; requestAnimationFrame(pan); };
      pan();
      game.fadeTo(0, 1800);
      await w(1600);
      for (const text of LINES) {
        if (skipped) break;
        line.textContent = text;
        show(line, true);
        await w(text.length > 20 ? 2400 : 2200);
        show(line, false);
        await w(900);
      }
      await Promise.race([game.fadeTo(1, 1400), skipP]);
      panning = false;
      game.stage.classList.remove('cinema');
      box.className = 'black';
    }

    // 3. the first page, in his own hand
    if (!skipped) {
      await w(700);
      page.querySelector('.text').textContent = '';
      page.querySelector('.sig').classList.remove('on');
      show(page, true);
      await w(900);
      await type(page.querySelector('.text'), PAGE, 42, () => audio.pen());
      await w(500);
      page.querySelector('.sig').classList.add('on');
      await w(1300);
      show(page, false);
      await w(900);
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
