import { Game, freshState } from './engine/game.js';
import { audio } from './engine/audio.js';
import { ITEMS, CLUES, DEDUCTIONS } from './story/data.js';
import { makeChapters } from './story/chapters.js';
import room from './scenes/room.js';
import bucks_row from './scenes/bucks_row.js';
import knackers from './scenes/knackers.js';
import foreshore from './scenes/foreshore.js';
import hanbury from './scenes/hanbury.js';
import seance from './scenes/seance.js';
import mitre from './scenes/mitre.js';
import goulston from './scenes/goulston.js';
import alleys from './scenes/alleys.js';
import greaves from './scenes/greaves.js';
import millers from './scenes/millers.js';

const scenes = { room, bucks_row, knackers, foreshore, hanbury, seance, mitre, goulston, alleys, greaves, millers };
const { chapters, hooks } = makeChapters();

const game = new Game({ scenes, chapters, items: ITEMS, clues: CLUES, deductions: DEDUCTIONS });
game.chapterHooks = hooks;
window.game = game;

const CHAPTER_NAMES = { prologue: 'Prólogo · La marea baja', c1: "I · Buck's Row", c2: 'II · El delantal de cuero', c3: 'III · Tinta roja', c4: 'IV · Huésped' };

function begin(chapterId, snapshot) {
  audio.init();
  game.ui.hideMenu();
  game.inMenu = false;
  game.r.fx.fade = 1;
  game.state = snapshot ? JSON.parse(JSON.stringify(snapshot)) : freshState();
  game.startChapter(chapterId);
}

function mainMenu() {
  game.inMenu = true;
  game.stage.classList.remove('cinema');
  game.ui.showHud(false);
  game.ui.hideDialogue();
  const saved = Game.loadSave();
  const unlocked = Game.unlocked();
  const items = [];
  if (saved && saved.chapter) items.push({ label: 'Continuar', action: () => begin(saved.chapter, Game.chapterSnapshot(saved.chapter) || saved) });
  items.push({ label: 'Nueva partida', action: () => { Game.clearSave(); begin('prologue'); } });
  if (unlocked.length > 1) items.push({ label: 'Capítulos', action: () => chapterMenu() });
  game.ui.menu(items);
  menuBackdrop();
}

function chapterMenu() {
  const unlocked = Game.unlocked();
  const items = Object.keys(CHAPTER_NAMES).map((id) => ({
    label: CHAPTER_NAMES[id],
    disabled: !unlocked.includes(id),
    action: () => begin(id, Game.chapterSnapshot(id)),
  }));
  items.push({ label: 'Volver', action: () => mainMenu() });
  game.ui.menu(items);
}

async function menuBackdrop() {
  // the menu sits over a slow pan of Buck's Row in the rain
  await game.goto('bucks_row', { x: 1600, fade: false, noEnter: true });
  // key art: a lone figure under the gas lamp, his back to us, in the rain
  Object.assign(game.player, { visible: true, facing: -1, lanternOn: false, pose: null, hat: 'bowler', collarUp: true, coat: '#23262b', h: 206 });
  game.actors = [game.player];
  game.camFocus = 1500;
  game.fadeTo(0.25, 2500);
  game.menuPan = true;
}

game.onPause = () => {
  if (game.inMenu || game.running) return;
  game.ui.menu([
    { label: 'Continuar', action: () => game.ui.hideMenu() },
    { label: 'Volver al menú', action: () => { game.ui.hideMenu(); mainMenu(); } },
  ]);
};
document.getElementById('btn-menu').addEventListener('click', () => game.onPause());

game.finish = () => {
  Game.clearSave();
  mainMenu();
};

const params = new URLSearchParams(location.search);
const dev = params.get('scene');
const devChapter = params.get('chapter');
if (devChapter) {
  begin(devChapter, Game.chapterSnapshot(devChapter));
} else if (dev) {
  game.ui.hideMenu();
  game.ui.showHud(true);
  game.inMenu = false;
  for (const f of (params.get('flags') || '').split(',').filter(Boolean)) game.state.flags[f] = true;
  game.goto(dev, { x: Number(params.get('x')) || undefined, fade: false, noEnter: params.has('noenter') }).then(() => { game.r.fx.fade = 0; });
  game.r.fx.fade = 0;
} else {
  mainMenu();
}
