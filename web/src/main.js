import { prefs, savePrefs, cycle, labelOf, VOLUMES, SPEEDS, QUALITIES, TOGGLES } from './engine/prefs.js';
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

function optionsMenu(back) {
  const render = () => game.ui.menu([
    { label: `Volumen: ${labelOf(VOLUMES, prefs.volume)}`, action: () => { prefs.volume = cycle(VOLUMES, prefs.volume); audio.setVolume(prefs.volume); savePrefs(); render(); } },
    { label: `Voces: ${labelOf(VOLUMES, prefs.voices)}`, action: () => { prefs.voices = cycle(VOLUMES, prefs.voices); audio.setVoiceVolume(prefs.voices); savePrefs(); render(); } },
    { label: `Texto: ${labelOf(SPEEDS, prefs.text)}`, action: () => { prefs.text = cycle(SPEEDS, prefs.text); savePrefs(); render(); } },
    { label: `Calidad: ${labelOf(QUALITIES, prefs.quality)}`, action: () => { prefs.quality = cycle(QUALITIES, prefs.quality); savePrefs(); render(); } },
    { label: `Vibración: ${labelOf(TOGGLES, prefs.vibrate)}`, action: () => { prefs.vibrate = cycle(TOGGLES, prefs.vibrate); savePrefs(); render(); if (prefs.vibrate && navigator.vibrate) navigator.vibrate(40); } },
    { label: 'Volver', action: back },
  ]);
  render();
}

async function credits() {
  game.ui.hideMenu();
  await game.ui.doc(`<h3>El Huésped</h3>
    <p class="small" style="text-align:center">Whitechapel, 1888</p>
    <p>Idea y dirección: <b>gabsvm</b>.</p>
    <p>Programación, arte procedural, sonido sintetizado y textos desarrollados con Claude (Anthropic).</p>
    <p class="small">Grabaciones CC0: lluvia de Ylmir, tormenta de kindland y bucles de agua de rubberduck (OpenGameArt); pasos de TinyWorlds (OpenGameArt); pasos de madera, puertas, telas y papeles de Kenney (kenney.nl).</p>
    <p class="small">Tipografías: IM Fell English (Igino Marini) y Special Elite (Astigmatic), bajo la licencia SIL Open Font.</p>
    <p class="small">Mary Ann Nichols, Annie Chapman, Elizabeth Stride, Catherine Eddowes y Mary Jane Kelly existieron. Thomas Ashgrove, el Huésped y el resto de personajes son ficticios.</p>
    <p class="hand" style="text-align:center">En memoria de las cinco.</p>`);
  mainMenu();
}

function resumeGame(r) {
  audio.init();
  game.ui.hideMenu();
  game.inMenu = false;
  game.resume(r);
}

function mainMenu() {
  game.inMenu = true;
  game.stage.classList.remove('cinema');
  game.ui.showHud(false);
  game.ui.hideDialogue();
  const saved = Game.loadSave();
  const unlocked = Game.unlocked();
  const items = [];
  const resumePoint = Game.loadResume();
  if (resumePoint && resumePoint.state && resumePoint.state.scene) items.push({ label: 'Continuar', action: () => resumeGame(resumePoint) });
  else if (saved && saved.chapter) items.push({ label: 'Continuar', action: () => begin(saved.chapter, Game.chapterSnapshot(saved.chapter) || saved) });
  items.push({ label: 'Nueva partida', action: () => { Game.clearSave(); game.introNext = true; begin('prologue'); } });
  // once the game has been finished: the same story again, read the way it happened
  if (Game.read()) items.push({ label: 'Segunda lectura', action: () => { Game.clearSave(); game.introNext = true; const st = freshState(); st.flags.second = true; begin('prologue', st); } });
  if (unlocked.length > 1) items.push({ label: 'Capítulos', action: () => chapterMenu() });
  items.push({ label: 'Opciones', action: () => optionsMenu(() => mainMenu()) });
  items.push({ label: 'Créditos', action: () => credits() });
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
  Object.assign(game.player, { visible: true, facing: -1, lanternOn: false, pose: null, hat: 'bowler', collarUp: true, coat: '#23262b' });
  game.actors = [game.player];
  game.camFocus = 1500;
  game.fadeTo(0.25, 2500);
  game.menuPan = true;
}

game.onPause = () => {
  if (game.running) return;
  if (game.paused) { game.paused = false; game.inMenu = false; game.ui.hideMenu(); return; }
  if (game.inMenu) return;
  if (game.ui.notebookOpen) game.ui.closeNotebook();
  game.paused = true; game.inMenu = true;
  game.ui.hover(null);
  const pauseMenu = () => game.ui.menu([
    { label: 'Continuar', action: () => { game.paused = false; game.inMenu = false; game.ui.hideMenu(); } },
    { label: 'Opciones', action: () => optionsMenu(pauseMenu) },
    { label: 'Volver al menú', action: () => { game.paused = false; game.ui.hideMenu(); mainMenu(); } },
  ]);
  pauseMenu();
};
document.getElementById('btn-menu').addEventListener('click', () => game.onPause());

// Android app hooks: Back pauses (or closes what is open), leaving the app saves and goes quiet.
window.__appBack = () => {
  if (game.ui._inspectClose) { game.ui._inspectClose(); return; }
  if (game.ui.notebookOpen) { game.ui.closeNotebook(); return; }
  if (game.ui._advance) { game.ui.advance(); return; }
  if (game.onPause) game.onPause();
};
window.__appPause = () => { game.autosave(); if (audio.ctx) audio.ctx.suspend(); };
window.__appResume = () => { if (audio.ctx) audio.ctx.resume(); };

game.finish = () => {
  Game.clearSave();
  Game.markRead();
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
