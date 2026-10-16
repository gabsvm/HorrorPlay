// Game controller: loop, camera, input, hotspots, state, and the script API (G) scenes are written against.
import { Renderer, W, H } from './renderer.js';
import { Actor } from './actor.js';
import { modelFor, releaseModels } from './model.js';
import { loadCloseups } from '../art/closeups.js';
import { loadProps } from '../art/models.js';
import { buzz } from './haptics.js';
import { fgDressing } from '../art/build.js';
import { live } from '../art/paint.js';
import { Swing } from './life.js';
import { paintBody, paintVision } from '../art/bodies.js';
import { UI } from './ui.js';
import { KbSpots } from './kbspots.js';
import { audio } from './audio.js';
import { prefs } from './prefs.js';
import { normalizeState, currentGate, gateDeductions, canEnterFinale, canEnterWater, lackAlreadySaid } from '../story/progression.js';
import { statuses } from '../story/theories.js';
import { setPosition as writePosition } from '../story/positions.js';
import { perception } from '../story/perception.js';
import { metrics } from './metrics.js';

const wait = (ms) => new Promise((r) => setTimeout(r, window.FAST ? 0 : ms));
const SAVE_KEY = 'elhuesped.save.v1';

export function freshState() {
  return normalizeState({
    chapter: null, scene: null, flags: {}, items: [], clues: [], deductions: [], profile: [],
    sanity: 100, date: '', clock: '',
  });
}

// in development (localhost or ?dev) a script that fails says so on screen; players never see it
const DEV = typeof location !== 'undefined' && (/[?&]dev/.test(location.search || '') || /^(localhost|127\.0\.0\.1)$/.test(location.hostname || ''));

// the typefaces are painted into the scene's canvases: have them loaded first (a no-op without a page, as in the headless tests)
const fontsReady = () => (typeof document !== 'undefined' && document.fonts?.load
  ? Promise.all(['italic 20px "IM Fell English"', '20px "IM Fell English"', '600 20px "IM Fell English SC"', '20px "Special Elite"'].map((f) => document.fonts.load(f, 'Ñá').catch(() => null)))
  : Promise.resolve());

export class Game {
  constructor({ scenes, chapters, items, clues, deductions }) {
    this.scenes = scenes;
    this.chapters = chapters;
    this.itemDefs = items;
    this.clues = clues;
    this.deductions = deductions;
    this.view = document.getElementById('view');
    this.stage = document.getElementById('stage');
    this.cursorEl = document.getElementById('cursor');
    this.cursorItemEl = document.getElementById('cursor-item');
    this.idleClock = 0;
    this.r = new Renderer(this.view);
    this.ui = new UI();
    this.ui.game = this;
    this.kb = new KbSpots(this);   // the scene's hotspots for the keyboard (QA-V5-004)
    this.r.onLost = () => this.ui.toast('Recuperando la imagen…', 4000);
    this.r.onRestored = () => this.ui.toast('Imagen recuperada.', 1800);
    this.r.onFatal = () => { try { this.autosave(); } catch {} this.ui.toast('No se pudo recuperar la imagen. Cierra y vuelve a abrir el juego: la partida está guardada.', 12000, true); };
    this.state = freshState();
    this.actors = [];
    this.scene = null;
    this.selectedItem = null;
    this.running = 0; // scripts in flight
    this.pointer = { x: W / 2, y: H / 2, inside: false, touch: false };
    this.madTarget = 0;
    this.layerCache = new Map();
    this.player = new Actor('Thomas', { h: 206, hat: 'bowler', coat: '#23262b', coatLen: 0.88, flare: 1.2, lantern: true, speed: 150, z: 10, collarUp: true, sideburns: true, hair: '#1a1410', gloves: '#2a221c', scarf: '#4a1612', stubble: 'rgba(30,22,18,0.35)' });
    this.player.isPlayer = true;
    this.player.model = modelFor('Thomas');
    this._thomasModel = this.player.model;   // the adult's modelled atlas: the prologue's child is drawn procedurally instead (look(), chapters.js)
    loadCloseups();
    loadProps();
    this.player.onStep = (a) => {
      audio.step(this.scene?.surface || 'stone', a.h / 200);
      if (this.scene && (this.scene.wet || this.scene.rain) && !this.scene.indoor) this.r.splash(a.x + a.facing * 14 * (a.h / 200), a.y);
    };
    if (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) document.documentElement.classList.add('touch');
    this.fitStage();
    window.addEventListener('resize', () => this.fitStage());
    window.addEventListener('pointerdown', () => this.wantFullscreen(), { capture: true });
    this.bindInput();
    this.G = this.makeAPI();
    this.last = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  // On a phone in the browser: the first tap asks for fullscreen in landscape (the APK is already).
  wantFullscreen() {
    if (this._fsAsked || !matchMedia('(pointer: coarse)').matches || window.__APK) return;
    this._fsAsked = true;
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen({ navigationUI: 'hide' }).then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
    }
  }

  fitStage() {
    const vw = window.innerWidth, vh = window.innerHeight;
    // the phone's keyboard over the signature only shortens the viewport: the stage keeps its size and the
    // signature moves into the part still visible (ui.nameEntry), instead of everything shrinking to a strip
    if (this._fit && vw === this._fit.vw && vh < this._fit.vh && document.activeElement?.id === 'name-input') return;
    this._fit = { vw, vh };
    const u = Math.min(vw / W, vh / H);
    document.documentElement.style.setProperty('--u', `${u}px`);
    document.documentElement.classList?.toggle('small', u < 0.85);   // type floors for a short window or phone (QA-V5-016)
  }

  // ------------------------------------------------------------ input
  toLogical(e) {
    const rect = this.stage.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * W, y = ((e.clientY - rect.top) / rect.height) * H;
    // undo the camera push-in so clicks land on what is under the pointer
    const [z, ux, uy] = this.r.fx.zoom;
    if (z !== 1) { const cx = ux * W, cy = (1 - uy) * H; x = cx + (x - cx) / z; y = cy + (y - cy) / z; }
    return { x, y };
  }

  // Ease the camera's push-in toward its target: a held shot, a dialogue framing, or none.
  updateZoom(dt) {
    const zs = (this.zoom ||= { z: 1, x: W / 2, y: H / 2 });
    const tg = this.zoomTarget || { z: 1, x: zs.x, y: zs.y };
    this.punch = Math.max(0, (this.punch || 0) - dt * 2.5);
    if (prefs.reduceMotion && !this.zoomTarget && zs.z > 1) zs.z = 1;   // switched on mid-scene: the frame stops moving at once
    const k = Math.min(1, dt * (tg.speed || 1.6));
    zs.z += (tg.z - zs.z) * k; zs.x += (tg.x - zs.x) * k; zs.y += (tg.y - zs.y) * k;
    const z = zs.z + (prefs.reduceMotion ? 0 : this.punch * 0.05);
    const half = 0.5 / z;
    const ux = Math.max(half, Math.min(1 - half, (zs.x - this.r.cam.x) / W));
    const uy = Math.max(half, Math.min(1 - half, 1 - zs.y / H));
    this.r.fx.zoom = [z, ux, uy];
  }

  // Frame a dialogue: push in a little on the speaker, or between the two people talking.
  frameDialogue(npc, z = 1.08) {
    // with reduced motion the camera does not push in on a conversation (F11: no frame changes in that mode)
    if (this.zoomTarget?.hold || !this.player.visible || window.FAST || prefs.reduceMotion) return;
    const p = this.player, x = npc ? (npc.x + p.x) / 2 : p.x;
    this.zoomTarget = { z, x, y: this.scene.groundY - p.h * 0.6, speed: 1.2 };
  }

  bindInput() {
    const v = this.view;
    v.addEventListener('pointermove', (e) => {
      const p = this.toLogical(e);
      Object.assign(this.pointer, p, { inside: true, touch: e.pointerType === 'touch' });
    });
    v.addEventListener('pointerleave', () => { this.pointer.inside = false; });
    v.addEventListener('pointerdown', (e) => {
      audio.init();
      metrics.input();
      const p = this.toLogical(e);
      Object.assign(this.pointer, p, { touch: e.pointerType === 'touch' });
      if (this.ui._advance) { this.ui.advance(); return; }
      if (e.button === 2) { this.onClick(p, true); return; }
      if (e.pointerType === 'touch' && !this.running && !this.inMenu && this.scene) {
        const h = this.hotspotAt(p);
        if (h && this.armed !== h) {
          // first tap on something only points it out; a second tap acts
          this.armed = h; this.armedAt = performance.now();
          const [x, y, w] = typeof h.rect === 'function' ? h.rect(this.G) : h.rect;
          this.ui.hover(h.name, x + w / 2 - this.r.cam.x, y, this.verbFor(h), h.cursor === 'exit' ? 'exit' : '', h.cursor === 'exit' ? this.exitDir(h) : 0);
          audio.click();
          return;
        }
        this.armed = null;
      }
      this.onClick(p, false);
    });
    v.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
      if (this.ui.inventoryOpen) {   // the case keeps the keyboard: Escape closes it, nothing else reaches the scene
        if (e.key === 'Escape' || e.key === 'i' || e.key === 'I') this.ui._invClose?.();
        return;
      }
      if (e.key === 'n' || e.key === 'N') this.toggleNotebook();
      if (e.key === 'i' || e.key === 'I') this.openInventory();
      if (e.key === 'Escape') {
        if (this.ui._docClose) this.ui._docClose();
        else if (this.ui.notebookOpen) this.ui.closeNotebook();
        else if (this.ui._talkCancel) this.ui._talkCancel();
        else if (this.ui._knockClose && !this.ui._advance) this.ui._knockClose();
        else if (this.selectedItem) this.selectItem(null);
        else if (this.onPause) this.onPause();
      }
    });
    document.getElementById('btn-notebook').addEventListener('click', () => this.toggleNotebook());
    document.getElementById('btn-inv').addEventListener('click', (e) => { e?.stopPropagation?.(); this.openInventory(); });
    document.getElementById('btn-reveal').addEventListener('click', () => this.reveal());
    window.addEventListener('keydown', (e) => { if (e.key === ' ' && !this.ui._advance && !this.running && !this.ui.inventoryOpen && !(e.target && e.target.tagName === 'BUTTON')) { e.preventDefault(); this.reveal(); } });
  }

  reveal() {
    if (this.inMenu || !this.scene) return;
    this.revealT = 2.4;
    audio.whisper(0.4, 0.03);
  }

  toggleNotebook() {
    if (this.running || !this.scene || this.inMenu) return;
    if (this.ui.notebookOpen) this.ui.closeNotebook();
    else this.ui.openNotebook(this);
  }

  // What is under the pointer. A finger is wider than its point: on touch, a tap that misses every rectangle
  // still takes the nearest one within 24 CSS px (a 48 px target). Distance decides; only when two are about
  // as near (within an eighth of the tolerance) does a person to talk to come before a thing, and a thing before a way out
  // (UX audit 675df9f UX-05; b69323b UX-B02).
  hotspotAt(p) {
    if (!this.scene) return null;
    const wx = p.x + this.r.cam.x, wy = p.y;
    const list = this.activeHotspots();
    const rects = list.map((h) => (typeof h.rect === 'function' ? h.rect(this.G) : h.rect));
    for (let i = list.length - 1; i >= 0; i--) {
      const [x, y, w, hh] = rects[i];
      if (wx >= x && wx <= x + w && wy >= y && wy <= y + hh) return list[i];
    }
    if (!(p.touch ?? this.pointer?.touch) && !this.ui.coarse) return null;
    const width = this.stage?.getBoundingClientRect?.().width || W;
    const tol = 24 * (W / width) / (this.r.fx.zoom?.[0] || 1);
    const rank = (h) => (h.cursor === 'talk' ? 0 : h.cursor === 'exit' ? 2 : 1);
    const near = [];
    list.forEach((h, i) => {
      const [x, y, w, hh] = rects[i];
      const d = Math.hypot(Math.max(x - wx, 0, wx - x - w), Math.max(y - wy, 0, wy - y - hh));
      if (d <= tol) near.push({ h, d });
    });
    if (!near.length) return null;
    const dMin = Math.min(...near.map((n) => n.d));
    const tied = near.filter((n) => n.d <= dMin + tol / 8);   // a near tie, scaled like the tolerance
    tied.sort((a, b) => rank(a.h) - rank(b.h) || a.d - b.d);
    return tied[0].h;
  }

  // How a hotspot presents itself to the player.
  verbFor(h) {
    if (this.selectedItem) return `Usar ${this.itemDefs[this.selectedItem].name.toLowerCase()} con`;
    if (h.cursor === 'talk') return 'Hablar con';
    if (h.cursor === 'exit') return 'Ir';
    // what has been looked at once says so: the second look is never the full first one again
    if (this.state.seen?.[this.seenKey(h)] && !h.verb) return 'Volver a mirar';
    return h.verb || 'Examinar';
  }

  exitDir(h) {
    if (h.dir) return h.dir;
    const [x, , w] = typeof h.rect === 'function' ? h.rect(this.G) : h.rect;
    return x + w / 2 < this.scene.width / 2 ? -1 : 1;
  }

  seenKey(h) { return `${this.scene.id}:${h.id}`; }

  activeHotspots() {
    return (this.scene.hotspots || []).filter((h) => !h.when || h.when(this.G));
  }

  // forced: a hotspot chosen with the keyboard (kbspots.js); the pointer then plays no part
  async onClick(p, look, forced = null) {
    if (this.inMenu || this.running || !this.scene || this.ui.notebookOpen) return;
    this.idleClock = 0;
    if (this.player.fidget) { if (this.player.pose === 'inspect') this.player.pose = null; this.player.fidget = null; this.player.shiver = 0; this.player.stillT = 0; }
    const h = forced || this.hotspotAt(p);
    if (!h) {
      // with an object in hand, empty ground is a step, not a cancel: only Cancel, Back or Escape let it go
      // (UX audit b69323b, UX-B03); the marker keeps showing what is held
      if (this.selectedItem) metrics.moveWithItem();   // a step with the object in hand, not a wasted click
      const wx = p.x + this.r.cam.x;
      const [a, b] = this.scene.walk;
      this.player.walkTo(Math.max(a, Math.min(b, wx)));
      this.clickMark = { x: Math.max(a, Math.min(b, wx)), t: 0 };
      return;
    }
    // a way out that takes no object is simply taken: the object stays in hand (UX audit b69323b, review of UX-B03)
    const item = this.selectedItem && !(h.cursor === 'exit' && !h.use) ? this.selectedItem : null;
    {
      const [hx, hy, hw, hh] = typeof h.rect === 'function' ? h.rect(this.G) : h.rect;
      this.actingAt = { x: hx + hw / 2 - this.r.cam.x, y: Math.min(660, hy + hh / 2) };
    }
    await this.run(async (G) => {
      if (h.walk != null) {
        const tx = typeof h.walk === 'function' ? h.walk(G) : h.walk;
        const ok = await this.player.walkTo(Math.max(this.scene.walk[0], Math.min(this.scene.walk[1], tx)));
        if (!ok) return;
      }
      if (h.face) this.player.facing = h.face;
      else {
        const [x, , w] = typeof h.rect === 'function' ? h.rect(G) : h.rect;
        this.player.facing = x + w / 2 >= this.player.x ? 1 : -1;
      }
      const gesture = this.gestureFor(h, G);
      if (gesture === 'take' || h.reach) {
        // the hand goes to the thing, not just somewhere in front
        const [rx, ry, rw, rh] = typeof h.rect === 'function' ? h.rect(G) : h.rect;
        const p = this.player, s = p.h / 200;
        p.reachTo = { x: Math.max(p.x - 90 * s, Math.min(p.x + 90 * s, rx + rw / 2)), y: Math.max(p.y - 170 * s, Math.min(p.y - 4, ry + rh / 2)) };
      }
      if (gesture) { this.player.pose = gesture; await wait(gesture === 'take' ? 320 : 180); }
      const settle = () => { if (this.player.pose === gesture) this.player.pose = null; this.player.reachTo = null; };
      if (item) {
        this.selectItem(null);
        if (h.use) {
          const handled = await h.use(G, item);
          if (handled !== false) { settle(); return; }
        }
        metrics.wrongItem();
        await G.think(this.itemDefs[item].wrong || this.wrongUse(h));
        settle();
        // it did not work on a thing: the object stays in hand, to try somewhere else (UX-B03); on a person it
        // is put away, so the next tap talks instead of repeating that it does not work
        if (h.cursor !== 'talk' && this.state.items.includes(item)) { this.selectedItem = item; this.refreshInventory(); }
        return;
      }
      try {
        // something already examined answers with its short second look (`again`), not the first again
        const seenBefore = this.state.seen?.[this.seenKey(h)];
        if (seenBefore && h.again && !(h.againWhen && !h.againWhen(G))) {
          if (typeof h.again === 'function') await h.again(G);
          else await G.think(h.again);
        } else if (look && h.look) await h.look(G);
        else if (h.act) await h.act(G);
        else if (h.look) await h.look(G);
      } finally { settle(); (this.state.seen ||= {})[this.seenKey(h)] = true; }
      if (h.cursor !== 'exit' && Math.random() < perception.whisperChance(this.state.sanity)) audio.whisper(0.6, 0.03);
    });
  }

  // An item offered where it does nothing: a few short answers by what it was offered to, in turn,
  // so the same sentence does not come back every time.
  wrongUse(h) {
    const lines = h.cursor === 'talk' ? ['No es momento de enseñarle esto.', 'No. A esta persona no.', 'Me guardo esto.']
      : h.cursor === 'exit' ? ['No.', 'Eso no me abre camino.']
      : ['No. Eso no sirve ahí.', 'No tiene nada que ver.', 'Ahí no.'];
    this._wrongN = (this._wrongN || 0) + 1;
    return lines[this._wrongN % lines.length];
  }

  // Which body language fits a hotspot: talk to people, raise the lantern at things in front,
  // crouch for things on the ground. Exits get none.
  gestureFor(h, G) {
    if (h.cursor === 'exit' || h.cursor === 'talk' || h.gesture === false) return null;
    if (h.gesture) return h.gesture;
    const [, y, , hh] = typeof h.rect === 'function' ? h.rect(G) : h.rect;
    const cy = y + hh / 2, g = this.scene.groundY;
    if (cy > g - 40) return 'take';
    if (this.player.lantern && this.player.lanternOn && cy > g - 260) return 'inspect';
    return null;
  }

  async run(fn) {
    this.running++;
    this.ui.busy(true);
    this.ui.hover(null);
    try { await fn(this.G); } catch (err) {
      console.error(err);
      (this.scriptErrors ||= []).push({ at: this.state.scene, chapter: this.state.chapter, message: String(err && err.message || err) });
      if (this.scriptErrors.length > 20) this.scriptErrors.shift();
      if (DEV) this.ui.toast(`Error de guion: ${err && err.message}`, 6000);
    }
    finally {
      this.running--;
      if (!this.running) { this.ui.busy(false); this.ui.hideDialogue(); if (!this.zoomTarget?.hold) this.zoomTarget = null; this.autosave(); }
    }
  }

  selectItem(id) {
    this.selectedItem = this.selectedItem === id ? null : id;
    this.refreshInventory();
  }

  // the HUD (count and the object in hand) is rebuilt from state.items every time: nothing about it is saved
  refreshInventory() {
    if (this.selectedItem && !this.state.items.includes(this.selectedItem)) this.selectedItem = null;
    this.ui.renderHud(this.state.items, this.itemDefs, this.selectedItem, () => this.selectItem(null));
  }

  // the inventory case: only when the player has control (no script, menu, notebook, cinematic or signature)
  openInventory() {
    if (this.running || this.inMenu || this.ui.notebookOpen || !this.scene || this.scene.noPlayer || this.ui.inventoryOpen) return false;
    this.ui.openInventory(this.state.items, this.itemDefs, {
      describe: (id) => this.describeItem(id),
      canUse: () => !this.running && !this.inMenu,
      onUse: (id) => {
        this.selectedItem = id;
        this.refreshInventory();
        this.ui.toast(`${this.itemDefs[id].name}: toca dónde usarlo, o Cancelar`, 2600);
      },
    });
    return true;
  }

  // what an object's own examine says, collected into the case instead of said behind it (it only reads state)
  async describeItem(id) {
    const def = this.itemDefs[id];
    if (!def || !def.examine) return [];
    const lines = [];
    const plain = (t) => String(t ?? '').replace(/<[^>]+>/g, '');
    // a reading only: whatever an examine might write (now or in a later version) goes nowhere
    const G2 = Object.create(this.G);
    const nothing = () => false;
    for (const k of ['clue', 'give', 'take', 'sanity', 'sanityOnce', 'doc', 'card', 'toast', 'objective', 'deduce', 'profile', 'walk', 'zoom', 'shake', 'flash', 'red', 'inspect', 'tipOnce', 'goto', 'run', 'vision', 'mad', 'fade', 'nameEntry', 'talk']) G2[k] = nothing;
    G2.choice = async () => 0;
    G2.voice = async (t) => { lines.push(plain(t)); };
    G2.flag = (k, v) => (v === undefined ? this.G.flag(k) : v);
    G2.think = async (t) => { lines.push(plain(t)); };
    G2.narrate = G2.think;
    G2.say = async (n, t) => { lines.push(plain(t)); };
    try { await def.examine(G2); } catch (err) { console.error(err); }
    return lines;
  }

  // ------------------------------------------------------------ deduction
  // The notebook's "what now?". Asked once, it nudges; asked again with nothing changed since, it
  // answers. What the place still asks for comes first (story/progression.js): a deduction that
  // meets it, or what to go and look at; a deduction that moves nothing is offered only when the
  // place asks for nothing.
  hint() {
    metrics.hint();
    const st = this.state, G = this.G;
    const key = `${st.objective}|${st.deductions.length}|${st.clues.length}|${st.scene}`;
    const again = this._hintKey === key;
    this._hintKey = key;
    const fits = (d) => !st.deductions.includes(d.id) && (!d.final || st.flags.awake) && st.clues.includes(d.a) && st.clues.includes(d.b);
    const gist = (id) => { const c = this.clues[id], t = typeof c.text === 'function' ? c.text(st) : c.text; return `«${t.split(/[.:;]/)[0]}»`; };
    const pair = (d) => (again ? `Junta ${gist(d.a)} con ${gist(d.b)}.` : 'Hay dos pruebas en el cuaderno que encajan y que todavía no he relacionado. (Vuelve a preguntar si no las encuentras.)');
    const base = st.objective || 'Mirar alrededor.';
    const gate = currentGate(st);
    const lack = gate && !gate.ok ? gate.missing[0] : null;
    // the objective already says it when the missing thing is the same as the objective's own words: once, not twice (QA-V5-009)
    const sayLack = lack && !lackAlreadySaid(base, lack);
    if (lack) {
      // the open requirement comes first; a deduction is offered only if it meets that requirement
      const needed = /cuaderno|relacionar/.test(lack)
        && gateDeductions(st).map((id) => this.deductions.find((d) => d.id === id)).find((d) => d && fits(d));
      if (needed) return pair(needed);
    } else if (!gate?.ok) {
      // nothing is required here, so an optional deduction may be the answer
      const ready = this.deductions.find(fits);
      if (ready && (/cuaderno/i.test(st.objective || '') || again)) return pair(ready);
    }
    // a place that is ready to move on (gate ok) never gets an optional pair in front of its exit
    if (!again) return sayLack ? `${base} Antes de seguir me falta ${lack}. (Vuelve a preguntar si sigues atascado.)` : `${base} (Vuelve a preguntar si sigues atascado.)`;
    // asked again: what can be touched here is marked; the notebook closes, so the answer is shown as a notice (ui.hint)
    this.ui.closeNotebook();
    this.reveal();
    return (this.scene?.hint && this.scene.hint(G)) || (lack ? `Me falta ${lack}. Todo lo que se puede tocar queda marcado un momento.` : `${base} Todo lo que se puede tocar queda marcado un momento.`);
  }

  // keep the theories' statuses in the save, so later scenes (and old saves) can read them
  updateInvestigation() {
    normalizeState(this.state);
    this.state.investigation.hypotheses = statuses(this.state);
  }

  // Thomas's stance on an open question, from the notebook's buttons (positions.js). Only the position
  // and its revision change: no scene, objective or progression flag moves.
  setPosition(q, option) {
    if (!writePosition(this.state, q, option)) return false;
    this.autosave();
    this.ui.renderNotebook();
    return true;
  }

  clueExhausted(id) {
    return this.deductions.filter((d) => d.a === id || d.b === id).every((d) => this.state.deductions.includes(d.id));
  }

  tryDeduce(a, b) {
    const d = this.deductions.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
    if (!d) return null;
    if (this.state.deductions.includes(d.id)) return { text: 'Ya lo había anotado.' };
    this.state.deductions.push(d.id);
    if (d.profile && !this.state.profile.includes(d.profile)) this.state.profile.push(d.profile);
    if (d.flag) this.state.flags[d.flag] = true;
    if (d.denial) { this.state.sanity = Math.max(0, this.state.sanity - 4); this.ui.setSanity(this.state.sanity); audio.heartbeat(0.7); }
    if (d.final && canEnterFinale(this.state).ok) { this.state.objective = canEnterWater(this.state).ok ? 'Ir al agua.' : 'En el cuaderno, pestaña «Nombre»: ordenar la cadena de la firma.'; this.ui.setObjective(this.state.objective); }
    this.updateInvestigation();
    if (d.final) { audio.whisper(1.4, 0.1); this.state.sanity = Math.max(0, this.state.sanity - 4); this.ui.setSanity(this.state.sanity); }
    this.pendingDeduction = d;
    return d;
  }

  // V5-03: the notebook's «Nombre» page asks for the chain to be ordered. The page closes and the script runs on the stage,
  // where the choices are; closing the notebook is what starts it (onNotebookClosed). Tests call runNameChain directly.
  requestNameChain() {
    if (this.running) return false;
    this.pendingChain = true;
    this.ui.closeNotebook();
    return true;
  }

  async runNameChain() {
    this.pendingChain = false;
    await this.run((G) => this.chapterHooks.nameChain(G));
    if (this.scene?.onDeduce) await this.run((G) => this.scene.onDeduce(G));
  }

  async onNotebookClosed() {
    if (this.pendingChain) { this.pendingDeduction = null; await this.runNameChain(); return; }
    const d = this.pendingDeduction;
    this.pendingDeduction = null;
    if (d && d.after) await this.run((G) => d.after(G));
    if (this.scene?.onDeduce) await this.run((G) => this.scene.onDeduce(G));
  }

  // ------------------------------------------------------------ scenes
  buildLayers(scene) {
    const key = `${scene.id}@${this.r.rs}@${scene.variant ? scene.variant(this.G) : ''}`;
    let tBuild = 0;
    if (!this.layerCache.has(key)) {
      live.on = true; live.list = [];
      let built;
      metrics.buildStart();
      const t0 = performance.now();
      try { built = scene.build(this.r, this.G); } finally { live.on = false; }
      tBuild = performance.now() - t0;
      built.swings = live.list;
      this.layerCache.set(key, built);
    }
    const built = this.layerCache.get(key);
    if (!built._dressed && !scene.noFgDressing) {
      const tFg = performance.now();
      const w = scene.width * 1.3;
      const fg = this.r.paintLayer(w, (ctx) => fgDressing(ctx, w, { seed: scene.id.length * 13 + scene.width, indoor: !!scene.indoor }), H, { blur: 3 });
      built.layers = [...built.layers, { canvas: fg, parallax: 1.3, kind: 'fg' }];
      built._dressed = true;
      if (metrics.on && tBuild) metrics.sceneBuilt(scene.id, tBuild + (performance.now() - tFg), performance.now() - tFg);
    }
    scene.layers = built.layers;
    scene.lights = built.lights.map((l) => ({ ...l }));
    scene.built = built;
  }

  // Thomas's clothes follow where he is and what he has taken, never a stored state. In the room of chapter one
  // he wakes without them: the coat and the bowler hang on the pegs until he takes them (coat_on) and so does the
  // lantern (lantern_taken) (QA-V5-014); after the chase (room_phase 'c3b') they hang there again and he has none
  // of them on; everywhere else, and in every other phase, he is dressed as before.
  dressFor(id) {
    if (this.state.chapter === 'prologue') return;   // the child's look belongs to the prologue (chapters.js LOOKS.child)
    const f = this.state.flags, inRoom = id === 'room', ph = f.room_phase || 'c1';
    const c3b = inRoom && ph === 'c3b';
    const coatOff = c3b || (inRoom && ph === 'c1' && !f.coat_on);
    const lanternOff = c3b || (inRoom && ph === 'c1' && !f.lantern_taken);
    this.player.coat = coatOff ? '#3a3a34' : '#23262b';
    this.player.hat = coatOff ? 'none' : 'bowler';
    this.player.lantern = !lanternOff;
    // the modelled atlas shows him dressed: undressed, he is drawn procedurally, where the clothes are the ones above
    this._thomasModel ??= this.player.model;
    // a wounded hand (the chase, injured) is drawn procedurally too: the bandage is part of that drawing
    const bandaged = f.chase_outcome === 'injured';
    this.player.bandaged = bandaged;
    // the room of chapter one is drawn procedurally the whole visit, so that taking the coat or the lantern never swaps the figure on screen
    this.player.model = coatOff || lanternOff || bandaged || (inRoom && ph === 'c1') ? null : this._thomasModel;
  }

  async goto(id, { x, facing, fade = true, noEnter = false } = {}) {
    const scene = this.scenes[id];
    if (!scene) throw new Error(`Escena desconocida: ${id}`);
    if (fade) await this.fadeTo(1, 700);
    // the modelled props are painted into the layers when the scene is built: give them a moment to load
    await Promise.race([Promise.all([loadProps(), fontsReady()]), wait(2000)]);
    this.ui.hover(null);
    // a new place starts with empty hands: an object carried through a way out is put away (review of UX-B03)
    if (this.selectedItem) { this.selectedItem = null; this.refreshInventory(); }
    if (this.scene?.leave) this.scene.leave(this.G);
    scene.G = this.G;
    this.scene = scene;
    this.state.scene = id;
    this.buildLayers(scene);
    this.actors = [this.player];
    this.player.visible = scene.noPlayer ? false : true;
    this.player.y = scene.groundY;
    // one scale per scene: everyone in it (and the architecture) shares the same metres-to-pixels
    this.sceneScale = scene.scale ?? (scene.indoor ? 1.12 : 0.84);
    this.player.h = Math.round((scene.playerH || 206) * this.sceneScale);
    this.player.lanternOn = !!scene.lantern;
    this.dressFor(id);
    this.player.pose = null;
    this.player.alpha = 1;
    this.player.speed = scene.playerSpeed || (this.player.h < 140 ? 120 : 150);
    this.player.stop();
    this.camFocus = null;
    this.menuPan = false;
    this.player.x = x ?? scene.spawn ?? scene.walk[0] + 40;
    this.player.facing = facing ?? 1;
    if (scene.actors) for (const a of scene.actors(this.G)) this.addActor(a);
    // the protagonist's atlas is never let go, even while the child or the procedural room figure is on screen: he comes back to it
    releaseModels(new Set([this._thomasModel, ...this.actors.map((a) => a.model)].filter(Boolean)));
    scene.life = scene.makeLife ? scene.makeLife(this.G) : [];
    // what swings in the street joins its life; what swings in the foreground is drawn with that layer
    for (const s of scene.built.swings || []) if (!s.fg) scene.life.push(new Swing(s));
    scene.fgSwings = (scene.built.swings || []).filter((s) => s.fg).map((s) => new Swing(s));
    this.r.cam.x = this.camTarget();
    this.zoomTarget = null;
    // the scene settles in from 1.07 unless motion is reduced: then it never moves (QA-V5-002)
    this.zoom = { z: window.FAST || prefs.reduceMotion ? 1 : 1.07, x: this.player.x, y: scene.groundY - 160 };
    audio.setBeds((typeof scene.beds === 'function' ? scene.beds(this.G) : scene.beds) || {}, 1.5);
    // the acoustics of the place, what sounds in it, and the city outside
    audio.setSpace(scene.space || (scene.indoor ? 'room' : 'street'));
    audio.setEmitters(scene.sounds || []);
    audio.setCity(scene.city !== undefined ? scene.city : scene.indoor ? { cab: 0.6, muffle: true } : { cab: 1, bell: 1 });
    audio.playMusic(scene.music || null);
    if (scene.date) this.ui.setDate(scene.date, null);
    if (fade) this.fadeTo(0, 900);
    if (scene.enter && !noEnter) await scene.enter(this.G);
  }

  camTarget() {
    const s = this.scene;
    const focus = this.camFocus != null ? this.camFocus : this.player.x;
    return Math.max(0, Math.min(s.width - W, focus - W / 2));
  }

  fadeTo(v, ms) {
    if (window.FAST) { this.r.fx.fade = v; return Promise.resolve(); }
    const fx = this.r.fx, from = fx.fade, t0 = performance.now();
    return new Promise((res) => {
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        fx.fade = from + (v - from) * k;
        if (k < 1) requestAnimationFrame(step); else res();
      };
      step();
    });
  }

  addActor(a) {
    if (!a._scaled) { a.h = Math.round(a.h * (this.sceneScale ?? 1)); a._scaled = true; }
    if (a.model === undefined) a.model = modelFor(a.name);
    // everyone's footfalls are heard, from where they walk
    if (!a.onStep) a.onStep = (b) => { if (b.visible) audio.step(this.scene?.surface || 'stone', b.h / 200, audio.spatial(b.x, 1000)); };
    this.actors.push(a); return a;
  }
  actor(name) { return this.actors.find((a) => a.name === name); }

  // ------------------------------------------------------------ loop
  loop(now) {
    requestAnimationFrame((t) => this.loop(t));
    // hidden (another app, the screen off): no work at all. Paused behind the menu: the scene still breathes,
    // at about 12 frames a second instead of the screen's rate (engine audit 1b3fc5e, P2)
    // without a GPU context the picture is frozen: the game waits too, instead of playing on blind
    if ((typeof document !== 'undefined' && document.hidden) || this.r.lost) { this.last = now; return; }
    if (this.paused && now - this.last < 80) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const t0 = performance.now();
    try { this.tick(now, dt); } catch (err) { if (!this._loopErr) console.error(err); this._loopErr = true; }
    // the throttled frames of the pause say nothing about the phone: they do not count towards the quality
    if (!this.paused) this.adaptQuality(performance.now() - t0, now); else this._lastNow = null;
  }

  // Quality: 'alta' always full, 'baja' always light, 'auto' drops the costly effects (rim light,
  // reflections, dust) if a frame's work stays too high for a phone to hold its frame rate.
  adaptQuality(cost, now) {
    const q = prefs.quality || 'auto';
    let low = q === 'baja';
    if (q === 'auto') {
      this._cost = this._cost == null ? cost : this._cost * 0.97 + cost * 0.03;
      // the GPU's share does not show in the cost, so watch the real frame rate too: sustained under
      // 25 fps means the per-pixel lighting is too much for this phone (pauses and stalls ignored)
      const iv = this._lastNow != null ? now - this._lastNow : 16;
      this._lastNow = now;
      if (iv < 120) this._iv = this._iv == null ? iv : this._iv * 0.98 + iv * 0.02;
      // down when a phone cannot hold the frame rate for a while; back up only after a long, clearly easy
      // stretch (20 s near 60 fps with little work), at most twice a session so it never seesaws
      if (this.paused || this.inMenu || this.running) this._easySince = null;   // never changes up mid-scene
      else if (!this._autoLow && now > 8000 && (this._cost > 15 || this._iv > 40)) { this._autoLow = true; this._easySince = null; metrics.quality('baja', this._cost, this._iv); }
      else if (this._autoLow && (this._ups || 0) < 2) {
        const easy = this._cost < 5 && this._iv < 19;
        if (!easy) this._easySince = null;
        else if (this._easySince == null) this._easySince = now;
        else if (now - this._easySince > 20000) { this._autoLow = false; this._ups = (this._ups || 0) + 1; this._easySince = null; this._cost = 8; metrics.quality('alta', this._cost, this._iv); }
      }
      low = !!this._autoLow;
    }
    if (low !== !!this.r.lowFx) {
      this.r.lowFx = low; Actor.lowFx = low;
      this.r._staticKey = null;   // the static copy the lighting reads is only kept while it is on
    }
  }

  tick(now, dt) {
    if (this.scene) {
      this.player.idleAllowed = !this.running && !this.inMenu && !this.ui.notebookOpen;
      for (const a of this.actors) a.update(dt);
      if (this.scene.update) this.scene.update(this.G, dt);
      if (this.scene.life) for (const l of this.scene.life) if (l.update) l.update(dt, this.G);
      audio.listener = this.player.x;
      audio.updateEmitters(this.G);
      if (this.menuPan) this.camFocus = 1500 + Math.sin(now / 12000) * 260;
      const target = this.camTarget();
      this.r.cam.x += (target - this.r.cam.x) * Math.min(1, dt * 3.2);
      this.updateZoom(dt);
      this.r.cam.shake = Math.max(0, this.r.cam.shake - dt * 20);
      const sanityMad = Math.max(0, (65 - this.state.sanity) / 65) * 0.6;
      const mad = Math.max(sanityMad, this.madTarget);
      this.r.fx.mad += (mad - this.r.fx.mad) * Math.min(1, dt * 1.5);
      this.r.fx.flash = Math.max(0, this.r.fx.flash - dt * 2.5);
      this.r.fx.red = Math.max(0, this.r.fx.red - dt * 1.2);
      this.kb.sync();
      this.updateHover();
      if (this.clickMark) this.clickMark.t += dt;
      if (this.revealT > 0) this.revealT -= dt;
      this.idleClock = this.running || this.inMenu || this.ui.notebookOpen ? 0 : (this.idleClock || 0) + dt;
      this.r.frame(this.scene, this.actors, dt, (ctx) => this.drawOverlay(ctx));
    }
  }

  updateHover() {
    if (this.kb.focused) return;   // the keyboard is naming a thing: the pointer's label waits
    const p = this.pointer;
    const c = this.cursorEl;
    if (this.cursorItemEl && (!p.inside || p.touch || this.inMenu)) this.cursorItemEl.classList.add('hidden');
    if (p.touch && this.armed && !this.running) { this.hoverH = this.armed; if (performance.now() - this.armedAt > 4000) { this.armed = null; this.ui.hover(null); } return; }
    if (!p.inside || p.touch || this.inMenu) { c.style.display = this.inMenu && p.inside && !p.touch ? 'block' : 'none'; c.style.left = `calc(${p.x} * var(--u))`; c.style.top = `calc(${p.y} * var(--u))`; c.className = ''; this.ui.hover(null); return; }
    c.style.display = 'block';
    c.style.left = `calc(${p.x} * var(--u))`;
    c.style.top = `calc(${p.y} * var(--u))`;
    if (this.running || this.ui.notebookOpen) { c.className = 'wait'; this.ui.hover(null); return; }
    const h = this.hotspotAt(p);
    this.hoverH = h;
    const exit = h && h.cursor === 'exit';
    c.className = h ? (exit ? (this.exitDir(h) < 0 ? 'exit-left' : 'exit-right') : (h.cursor || 'look')) : (this.selectedItem ? 'item' : '');
    if (h) this.ui.hover(h.name, p.x, p.y, this.verbFor(h), this.selectedItem ? 'item' : exit ? 'exit' : '', exit ? this.exitDir(h) : 0);
    else this.ui.hover(null);
    const ci = this.cursorItemEl;
    if (this.selectedItem) {
      if (ci._for !== this.selectedItem) {
        const d = this.itemDefs[this.selectedItem];
        const cc = ci.getContext('2d'); cc.clearRect(0, 0, 48, 48);
        if (d._pix) cc.drawImage(d._pix, 0, 0);
        ci._for = this.selectedItem;
      }
      ci.classList.remove('hidden');
      ci.style.left = `calc(${p.x} * var(--u))`; ci.style.top = `calc(${p.y} * var(--u))`;
    } else ci.classList.add('hidden');
  }

  drawOverlay(ctx) {
    if (!this.scene) return;
    const now = performance.now() / 1000;
    const cam = this.r.cam.x;
    const seen = this.state.seen || {};
    const playing = !this.running && !this.inMenu && !this.scene.noPlayer;
    const list = playing ? this.activeHotspots() : [];
    // exits: chevrons by the ground that always show where you can go
    for (const h of list) {
      if (h.cursor !== 'exit') continue;
      const [x, y, w, hh] = typeof h.rect === 'function' ? h.rect(this.G) : h.rect;
      const dir = this.exitDir(h), hov = this.hoverH === h;
      const cx = x + w / 2 - cam, cy = Math.min(this.scene.groundY - 26, y + hh - 30);
      if (cx < -40 || cx > 1320) continue;
      for (let k = 0; k < 3; k++) {
        const ph = (now * 1.6 - k * 0.33) % 1;
        const a = (hov ? 0.9 : 0.5) * Math.sin(Math.max(0, ph) * Math.PI);
        const px = cx + dir * (k * 12 + ph * 8);
        ctx.strokeStyle = `rgba(170,210,225,${a})`; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(px - dir * 8, cy - 12); ctx.lineTo(px + dir * 4, cy); ctx.lineTo(px - dir * 8, cy + 12); ctx.stroke();
      }
    }
    // the thing under the pointer gets corner brackets
    const hv = playing ? this.hoverH : null;
    if (hv && hv.cursor !== 'exit') {
      let [x, y, w, hh] = typeof hv.rect === 'function' ? hv.rect(this.G) : hv.rect;
      x -= cam;
      const pad = 4 + Math.sin(now * 5) * 2, L = Math.min(18, w / 3, hh / 3);
      const col = this.selectedItem ? '230,120,95' : hv.cursor === 'talk' ? '255,214,140' : '255,224,170';
      ctx.strokeStyle = `rgba(${col},0.75)`; ctx.lineWidth = 2.5;
      const X0 = x - pad, Y0 = y - pad, X1 = x + w + pad, Y1 = Math.min(712, y + hh + pad);
      for (const [px, py, sx, sy] of [[X0, Y0, 1, 1], [X1, Y0, -1, 1], [X0, Y1, 1, -1], [X1, Y1, -1, -1]]) {
        ctx.beginPath(); ctx.moveTo(px + sx * L, py); ctx.lineTo(px, py); ctx.lineTo(px, py + sy * L); ctx.stroke();
      }
    }
    // reveal: gold for what you have not examined yet, grey for what you have
    if (this.revealT > 0 && playing) {
      const a = Math.min(1, this.revealT) * 0.9;
      for (const h of list) {
        const [x, y, w, hh] = typeof h.rect === 'function' ? h.rect(this.G) : h.rect;
        const cx = x + w / 2 - cam, cy = Math.min(690, y + hh / 2);
        if (cx < -20 || cx > 1300) continue;
        const done = seen[this.seenKey(h)];
        ctx.strokeStyle = h.cursor === 'exit' ? `rgba(160,200,220,${a})` : done ? `rgba(150,150,140,${a * 0.6})` : `rgba(255,214,140,${a})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(cx, cy, (done ? 7 : 10) + Math.sin(now * 5) * 1.5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    // stuck for a while? what you have not examined glints now and then
    if (playing && this.idleClock > 25) {
      for (const h of list) {
        if (h.cursor === 'exit' || seen[this.seenKey(h)]) continue;
        const [x, y, w, hh] = typeof h.rect === 'function' ? h.rect(this.G) : h.rect;
        const k = ((now * 0.5 + (x % 97) / 97) % 1);
        if (k > 0.25) continue;
        const a = Math.sin((k / 0.25) * Math.PI) * 0.7;
        const cx = x + w / 2 - cam, cy = Math.min(690, y + hh / 2);
        ctx.fillStyle = `rgba(255,230,180,${a})`;
        ctx.fillRect(cx - 1, cy - 9, 2, 18); ctx.fillRect(cx - 9, cy - 1, 18, 2);
      }
    }
    // a soft lantern-coloured ripple where the player clicked to walk
    const m = this.clickMark;
    if (m && m.t < 0.6) {
      const sx = m.x - this.r.cam.x, sy = this.scene.groundY;
      ctx.strokeStyle = `rgba(255,200,130,${0.35 * (1 - m.t / 0.6)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(sx, sy, 10 + m.t * 50, 3 + m.t * 10, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // ------------------------------------------------------------ save
  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); } catch { /* storage unavailable */ }
  }

  static loadSave() {
    try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  }

  static clearSave() { try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(`${SAVE_KEY}.resume`); } catch { /* ignore */ } }

  // A resume point: the whole state plus where Ashgrove stands. Written every time a script ends
  // and the player gets control back, except in scenes that are one continuous script. A script in
  // flight is never a resume point (its state is half-written): the save from its end covers it.
  autosave() {
    const sc = this.scene;
    if (this.running || !sc || this.inMenu || window.FAST || !this.state.chapter || !this.player.visible) return;
    if (sc.noSave || (sc.canSave && !sc.canSave(this.G))) return;
    try { localStorage.setItem(`${SAVE_KEY}.resume`, JSON.stringify({ state: this.state, x: Math.round(this.player.x), facing: this.player.facing, at: Date.now() })); } catch { /* storage unavailable */ }
  }

  static loadResume() {
    try { const s = localStorage.getItem(`${SAVE_KEY}.resume`); return s ? JSON.parse(s) : null; } catch { return null; }
  }

  async resume(r) {
    this.state = normalizeState(JSON.parse(JSON.stringify(r.state)));
    this.selectedItem = null;
    this.madTarget = 0;
    this.r.fx.desat = 0; this.r.fx.mad = 0;
    this.stage.classList.remove('cinema');
    if (this.chapterHooks.restoreLook) this.chapterHooks.restoreLook(this.G);
    this.ui.showHud(this.state.chapter !== 'prologue');
    this.ui.setSanity(this.state.sanity);
    this.ui.setObjective(this.state.objective || '');
    this.ui.setBadge(this.state.unread || 0);
    this.ui.setDate(this.state.date || '', this.state.clock || '');
    this.refreshInventory();
    this.r.fx.fade = 1;
    await this.run(async () => {
      await this.goto(this.state.scene, { x: r.x, facing: r.facing, fade: false });
      await this.fadeTo(0, 1200);
    });
  }

  // finishing the game once opens the second reading
  static read() { try { return localStorage.getItem(`${SAVE_KEY}.read`) === '1'; } catch { return false; } }
  static markRead() { try { localStorage.setItem(`${SAVE_KEY}.read`, '1'); } catch { /* storage unavailable */ } }

  static unlocked() {
    try { return JSON.parse(localStorage.getItem(`${SAVE_KEY}.unlocked`) || '["prologue"]'); } catch { return ['prologue']; }
  }

  static chapterSnapshot(id) {
    try { const s = localStorage.getItem(`${SAVE_KEY}.ch.${id}`); return s ? JSON.parse(s) : null; } catch { return null; }
  }

  async startChapter(id, snapshot) {
    this.state = normalizeState(snapshot ? JSON.parse(JSON.stringify(snapshot)) : this.state);
    this.state.chapter = id;
    metrics.chapter(id, this.state);
    this.selectedItem = null;
    this.madTarget = 0;
    this.r.fx.desat = 0;
    this.save();
    try {
      localStorage.setItem(`${SAVE_KEY}.ch.${id}`, JSON.stringify(this.state));
      const u = Game.unlocked();
      if (!u.includes(id)) { u.push(id); localStorage.setItem(`${SAVE_KEY}.unlocked`, JSON.stringify(u)); }
    } catch { /* storage unavailable */ }
    this.ui.setSanity(this.state.sanity);
    this.ui.setObjective(this.state.objective || '');
    this.ui.setBadge(this.state.unread || 0);
    this.refreshInventory();
    await this.run((G) => this.chapters[id](G));
  }

  // ------------------------------------------------------------ script API
  makeAPI() {
    const game = this;
    const G = {
      game,
      get state() { return game.state; },
      get player() { return game.player; },
      get scene() { return game.scene; },
      audio,
      wait,
      // the first reading and the second: the same scene, said as Thomas believes it, or as it was
      two: (first, second) => (game.state.flags.second ? second : first),
      second: () => !!game.state.flags.second,
      knocks: (o) => game.ui.knockPuzzle(o),
      flag: (k, v) => { if (v === undefined) return !!game.state.flags[k]; game.state.flags[k] = v; return v; },
      has: (id) => game.state.items.includes(id),
      hasClue: (id) => game.state.clues.includes(id),
      deduced: (id) => game.state.deductions.includes(id),
      say: async (who, text, opts) => {
        const speaking = (who === 'Ashgrove' || who === 'Thomas') && !(opts && opts.style);
        if (speaking) game.player.talking = true;
        // the NPC who speaks moves their mouth and turns to whoever they are talking to
        const npc = !speaking && who ? game.actors.find((a) => a !== game.player && (a.name === who || a.speaker === who || a.name === who.split(' ').pop()) && a.visible) : null;
        const was = npc && npc.talking;
        if (npc) {
          npc.talking = true;
          const p = game.player;
          if (!npc.pose && p.visible) npc.facing = p.x >= npc.x ? 1 : -1;
          // the two of them look at each other's faces, up or down as their heights require
          npc.lookAt = { x: p.x, y: p.y - p.h * 0.9 };
          if (p.visible && !p.pose && !game.player.moving) { p.facing = npc.x >= p.x ? 1 : -1; p.lookAt = { x: npc.x, y: npc.y - npc.h * 0.9 }; }
        }
        if (speaking || npc) game.frameDialogue(npc);
        try { await game.ui.say(who, text, opts); } finally {
          if (speaking) game.player.talking = false;
          if (npc && !was) npc.talking = false;
          if (npc) { npc.lookAt = null; game.player.lookAt = null; }
        }
      },
      think: (text) => (game.frameDialogue(null, 1.05), game.ui.say('Ashgrove', text, { style: 'thought' })),
      voice: (text, opts = {}) => { audio.whisper(2.2, 0.16); return game.ui.say(opts.name ?? '', text, { style: 'voice', ...opts }); },
      narrate: (text) => game.ui.say('', text, { style: 'thought' }),
      choice: (opts, o) => { game.ui.hideDialogue(); return game.ui.choice(opts, o); },
      // An exploratory conversation (UX audit 675df9f): the menu comes back after each topic until the player
      // says «Nada más» (or presses Back). topics: [{ id, label, available(G), done(G), run(G), repeat(G), ends }].
      // A topic already heard is marked ✓ and can be heard again: `repeat` (or `run`, when its effects are
      // idempotent) replays it without new effects. `done` recognises topics heard in a save from before the
      // marks were kept. `ends` closes the conversation after the topic (a puzzle, closing the night).
      // The marks are kept in state.conversationSeen["scene:npc"]. Never for a timed or irreversible choice.
      // `after`: the menu comes right after a scripted first meeting (headless tests then leave unless they pick)
      talk: async (npc, topics, { exit = 'Nada más.', after = false } = {}) => {
        const key = `${game.scene.id}:${npc}`;
        const marks = () => (game.state.conversationSeen[key] ||= []);
        const heard = (t) => marks().includes(t.id) || !!t.done?.(G);
        let asked = after ? 1 : 0;
        for (;;) {
          // headless tests: once their picks run out after a topic, they leave the conversation
          if (window.FAST && asked && !(window.PICKS || []).length) return null;
          const open = topics.filter((t) => !t.available || t.available(G));
          const labels = [...open.map((t) => (!t.ends && heard(t) ? '✓ ' : '') + t.label), exit];
          game.ui.hideDialogue();
          const k = await game.ui.choice(labels, { cancel: labels.length - 1 });
          if (k >= open.length) return null;
          const t = open[k], again = heard(t);
          asked++;
          await (again && t.repeat ? t.repeat(G) : t.run(G));
          if (!marks().includes(t.id)) marks().push(t.id);
          if (t.ends) return t.id;
        }
      },
      doc: (html) => game.ui.doc(html),
      card: (k, t, s, ms) => game.ui.card(k, t, s, ms),
      toast: (t) => game.ui.toast(t),
      date: (d, c) => {
        if (d != null) game.state.date = d;
        if (c != null) { game.state.clock = c; const [h, m] = c.split(':').map(Number); game.state.clockHands = [h, m]; }
        game.ui.setDate(d, c);
      },
      hud: (on) => game.ui.showHud(on),
      goto: (id, opts) => game.goto(id, opts),
      walk: (x, opts) => game.player.walkTo(x, opts),
      // up or down a flight of steps to (x, y)
      stairs: (x, y, opts) => game.player.climb(x, y, opts),
      face: (dir) => { game.player.facing = dir; },
      fade: (v, ms = 800) => game.fadeTo(v, ms),
      // with reduced motion the shocks stay, softened: a dimmer flash, no shake
      // the camera never jumps either (UX-04): the push of a shock (punch) is 0 in that mode
      flash: (v = 1) => { game.r.fx.flash = prefs.reduceMotion ? v * 0.35 : v; game.punch = prefs.reduceMotion ? 0 : 1; },
      red: (v = 0.8) => { game.r.fx.red = prefs.reduceMotion ? v * 0.6 : v; game.punch = prefs.reduceMotion ? 0 : 1; },
      shake: (v = 10) => { game.r.cam.shake = prefs.reduceMotion ? 0 : v; /* no shaking at all with reduced motion (F11 convention) */ if (!prefs.reduceMotion) game.punch = Math.max(game.punch || 0, 0.6); if (v >= 6) buzz(Math.min(90, v * 5)); },
      // Kneel over a body and examine it close up. `points`: [{ id, x, y, r, name, act(G) }] in 1280x720. calm looks at a wall object instead: no kneel, no sting, no body toast.
      inspect: async (id, { title, body, points, calm = false, close = null }) => {
        const seen = ((game.state.seen ||= {})[`insp:${id}`] ||= {});
        const p = game.player;
        if (!calm && !window.FAST && !seen.__first) { p.pose = 'recoil'; G.audio.sting(0.15); await wait(750); }
        seen.__first = true;
        if (!calm) p.pose = 'kneel';
        if (window.FAST) { for (const pt of points) { await pt.act(G); seen[pt.id] = true; } }
        else {
          // the scene stays black behind the close-up, and comes back when he stands up
          await G.fade(1, 450);
          await game.ui.inspect({ title, paint: (ctx, w, h) => paintBody(ctx, w, h, body), points, seen, keyMarks: perception.forensicMarks(game.state.sanity), fx: () => ({ red: game.r.fx.red, shake: game.r.cam.shake }), close: close || (calm ? 'Atrás' : null) }, (pt) => pt.act(G));
          await G.fade(0, 600);
          // closing early is allowed; a word says that something that matters was left unexamined
          if (!calm && points.some((pt) => pt.key && !seen[pt.id])) game.ui.toast('Quedan detalles del cuerpo sin examinar.', 3200);
        }
        if (!calm) p.pose = null;
      },
      // a subliminal flash: 'hands' or a body close-up
      vision: (kind = 'hands') => { game.punch = prefs.reduceMotion ? 0 : 1; return game.ui.vision((ctx, w, h) => paintVision(ctx, w, h, kind)); },
      // a held camera move for a scripted moment; G.zoom(1) lets go
      // with reduced motion no scripted push-in happens anywhere (F11): only the reset to 1 goes through
      zoom: (z = 1.15, x, y, speed = 0.8) => {
        if (prefs.reduceMotion && z !== 1) return;
        game.zoomTarget = z === 1 ? null : { z, x: x ?? game.player.x, y: y ?? game.scene.groundY - game.player.h * 0.6, speed, hold: true };
      },
      mad: (v) => { game.madTarget = v; },
      desat: (v) => { game.r.fx.desat = v; },
      camFocus: (x) => { game.camFocus = x; },
      actor: (n) => game.actor(n),
      addActor: (a) => game.addActor(a),
      removeActor: (n) => { game.actors = game.actors.filter((a) => a.name !== n); },
      light: (id) => game.scene.lights.find((l) => l.id === id),
      give: (id) => {
        if (game.state.items.includes(id)) return;
        game.state.items.push(id);
        G.tipOnce('item', {
          mouse: 'Los objetos van al <b>Inventario</b> (botón de arriba o <kbd>I</kbd>). Allí puedes <b>Examinar</b> o <b>Usar</b> cada uno; <b>Usar</b> lo deja en la mano para elegir dónde. <kbd>Esc</kbd> lo suelta.',
          touch: 'Los objetos van al <b>Inventario</b> (botón de arriba). Allí puedes <b>Examinar</b> o <b>Usar</b> cada uno; <b>Usar</b> lo deja en la mano para tocar dónde. <b>Cancelar</b> lo suelta.',
        }, 8000);
        game.refreshInventory();
        game.ui.toast(`Obtienes: ${game.itemDefs[id].name}`);
        audio.pickup();
        // the inventory button answers; nothing flies to a bar that is not there
        game.ui.itemArrived();
        game.actingAt = null;
      },
      take: (id) => {
        game.state.items = game.state.items.filter((i) => i !== id);
        if (game.selectedItem === id) game.selectedItem = null;
        game.refreshInventory();
      },
      clue: (id) => {
        if (game.state.clues.includes(id)) return false;
        game.state.clues.push(id);
        game.updateInvestigation();
        const pl = game.player;
        if (!window.FAST && pl.visible && !pl.pose && !pl.moving) {
          pl.pose = 'write'; audio.pen();
          setTimeout(() => { if (pl.pose === 'write') pl.pose = null; }, 1500);
        }
        G.tipOnce('clue', {
          mouse: 'Las pistas se anotan solas en el <b>cuaderno</b>. Ábrelo con <kbd>N</kbd> o con el botón de arriba.',
          touch: 'Las pistas se anotan solas en el <b>cuaderno</b>. Ábrelo con el botón de arriba.',
        });
        game.state.unread = (game.state.unread || 0) + 1;
        const has = (c) => game.state.clues.includes(c);
        if (game.deductions.some((d) => !d.final && has(d.a) && has(d.b) && !game.state.deductions.includes(d.id))) {
          G.tipOnce('deduce', {
            mouse: 'Algunas pistas encajan entre sí. En el <b>cuaderno</b>, haz clic en dos pistas para relacionarlas y sacar una deducción.',
            touch: 'Algunas pistas encajan entre sí. En el <b>cuaderno</b>, toca dos pistas para relacionarlas y sacar una deducción.',
          }, 8000);
        }
        game.ui.setBadge(game.state.unread);
        game.ui.toast('Anotado en el cuaderno');
        audio.pen();
        document.getElementById('btn-notebook').classList.remove('pulse');
        void document.getElementById('btn-notebook').offsetWidth;
        document.getElementById('btn-notebook').classList.add('pulse');
        return true;
      },
      sanity: (delta) => {
        game.state.sanity = Math.max(0, Math.min(100, game.state.sanity + delta));
        game.ui.setSanity(game.state.sanity);
        if (delta < 0) { audio.heartbeat(Math.min(1, -delta / 10)); }
      },
      // a cost paid once: looking at the same thing again shows it (the reaction) but takes no more (V4-12)
      sanityOnce: (key, delta) => {
        const k = `cost_${key}`;
        if (game.state.flags[k]) return false;
        game.state.flags[k] = true;
        game.G.sanity(delta);
        return true;
      },
      chapter: (id) => game.startChapter(id),
      objective: (text) => { game.state.objective = text; game.ui.setObjective(text); },
      tip: (html, ms) => game.ui.tip(html, ms),
      // show a tip once per save; `variants` = { mouse, touch }
      tipOnce: (key, variants, ms) => {
        const f = (game.state.tips ||= {});
        if (f[key]) return;
        f[key] = true;
        const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
        game.ui.tip(touch ? variants.touch : variants.mouse, ms);
      },
      cinema: (on) => { game.stage.classList.toggle('cinema', !!on); },
      save: () => game.save(),
      nameEntry: (prompt, morph, initial) => game.ui.nameEntry(prompt, morph, initial),
      Actor,
    };
    return G;
  }
}
