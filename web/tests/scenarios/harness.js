// Shared helpers for the headless scenarios (run with `node web/tools/walk.mjs <name>`).
// Every scenario plays the real game in FAST mode against the stub DOM of tools/walk.mjs.
// Choices are picked by a piece of their text (or by position): `act('pike', null, ['médico'])`.

export function harness() {
  const game = window.game;
  const errors = [];
  const settle = async () => { for (let i = 0; i < 600 && game.running; i++) await new Promise((r) => setTimeout(r, 5)); };
  const waitScene = async (id, tries = 300) => { for (let i = 0; i < tries && game.state.scene !== id; i++) await new Promise((r) => setTimeout(r, 15)); await settle(); };
  const expectScene = (id) => { if (game.state.scene !== id) throw new Error(`Esperaba escena ${id}, estoy en ${game.state.scene}`); };
  const act = async (id, item = null, picks = []) => {
    await settle();
    const h = game.activeHotspots().find((x) => x.id === id);
    if (!h) throw new Error(`Hotspot no disponible: ${id} en ${game.state.scene}`);
    window.LOG.push(`### ${game.state.scene}:${id}${item ? ' +' + item : ''}`);
    window.PICKS = [...picks];
    game.selectedItem = item;
    const [x, y, w, hh] = typeof h.rect === 'function' ? h.rect(game.G) : h.rect;
    await game.onClick({ x: x + w / 2 - game.r.cam.x, y: y + hh / 2 }, false);
    await settle();
    if (window.PICKS.length) throw new Error(`Sobraron elecciones en ${id}: ${JSON.stringify(window.PICKS)}`);
  };
  const deduce = async (a, b) => {
    const res = game.tryDeduce(a, b);
    if (!res) throw new Error(`Deducción inválida: ${a} + ${b}`);
    await game.onNotebookClosed();
    await settle();
    return res;
  };
  const need = (cond, msg) => { if (!cond) throw new Error(msg); };
  const has = (id) => game.state.items.includes(id);
  const clue = (id) => game.state.clues.includes(id);
  const flag = (k) => game.state.flags[k];
  // start a new game (or a chapter from a snapshot) with the chapter scripts in FAST mode
  const start = async (chapter = 'prologue', snapshot = null, { second = false } = {}) => {
    game.inMenu = false;
    game.ui.hideMenu();
    const { freshState } = await import('../../src/engine/game.js');
    game.state = snapshot ? JSON.parse(JSON.stringify(snapshot)) : freshState();
    if (second) game.state.flags.second = true;
    await game.startChapter(chapter);
    await settle();
  };
  return { game, errors, settle, waitScene, expectScene, act, deduce, need, has, clue, flag, start };
}

// run a scenario body, collecting script errors (Game.run only logs them) as failures
export async function scenario(body, { log = false } = {}) {
  const game = window.game;
  window.FAST = true;
  window.LOG = [];
  const errors = [];
  const origError = console.error;
  console.error = (...a) => { errors.push(a.map(String).join(' ')); };
  let extra = {};
  try {
    extra = (await body(harness())) || {};
  } catch (e) {
    errors.push(`FALLO: ${e.message}`);
  } finally {
    window.FAST = false;
    console.error = origError;
  }
  const result = { ok: errors.length === 0, errors, scene: game.state.scene, lines: window.LOG.length, deductions: game.state.deductions.length, extra };
  if (log) console.log(result);
  return result;
}

// load a JSON fixture from tests/fixtures
export async function fixture(path) {
  const { readFileSync } = await import('node:fs');
  return JSON.parse(readFileSync(new URL(`../fixtures/${path}`, import.meta.url), 'utf8'));
}
