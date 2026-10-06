// Game controller: loop, camera, input, hotspots, state, and the script API (G) scenes are written against.
import { Renderer, W, H } from './renderer.js';
import { Actor } from './actor.js';
import { UI } from './ui.js';
import { audio } from './audio.js';

const wait = (ms) => new Promise((r) => setTimeout(r, window.FAST ? 0 : ms));
const SAVE_KEY = 'elhuesped.save.v1';

export function freshState() {
  return {
    chapter: null, scene: null, flags: {}, items: [], clues: [], deductions: [], profile: [],
    sanity: 100, date: '', clock: '',
  };
}

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
    this.r = new Renderer(this.view);
    this.ui = new UI();
    this.ui.game = this;
    this.state = freshState();
    this.actors = [];
    this.scene = null;
    this.selectedItem = null;
    this.running = 0; // scripts in flight
    this.pointer = { x: W / 2, y: H / 2, inside: false, touch: false };
    this.madTarget = 0;
    this.layerCache = new Map();
    this.player = new Actor('Thomas', { h: 206, hat: 'bowler', coat: '#23262b', coatLen: 0.88, flare: 1.2, lantern: true, speed: 150, z: 10, collarUp: true, sideburns: true, hair: '#1a1410' });
    this.player.isPlayer = true;
    this.player.onStep = () => audio.step(this.scene?.surface || 'stone');
    this.fitStage();
    window.addEventListener('resize', () => this.fitStage());
    this.bindInput();
    this.G = this.makeAPI();
    this.last = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  fitStage() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const u = Math.min(vw / W, vh / H);
    document.documentElement.style.setProperty('--u', `${u}px`);
  }

  // ------------------------------------------------------------ input
  toLogical(e) {
    const rect = this.stage.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
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
      const p = this.toLogical(e);
      Object.assign(this.pointer, p, { touch: e.pointerType === 'touch' });
      if (this.ui._advance) { this.ui.advance(); return; }
      if (e.button === 2) { this.onClick(p, true); return; }
      this.onClick(p, false);
    });
    v.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'n' || e.key === 'N') this.toggleNotebook();
      if (e.key === 'Escape') {
        if (this.ui.notebookOpen) this.ui.closeNotebook();
        else if (this.selectedItem) this.selectItem(null);
        else if (this.onPause) this.onPause();
      }
    });
    document.getElementById('btn-notebook').addEventListener('click', () => this.toggleNotebook());
    document.getElementById('btn-reveal').addEventListener('click', () => this.reveal());
    window.addEventListener('keydown', (e) => { if (e.key === ' ' && !this.ui._advance && !this.running) { e.preventDefault(); this.reveal(); } });
  }

  reveal() {
    if (this.inMenu || !this.scene) return;
    this.revealT = 2.4;
    audio.whisper(0.4, 0.03);
  }

  toggleNotebook() {
    if (this.running || !this.scene) return;
    if (this.ui.notebookOpen) this.ui.closeNotebook();
    else this.ui.openNotebook(this);
  }

  hotspotAt(p) {
    if (!this.scene) return null;
    const wx = p.x + this.r.cam.x, wy = p.y;
    const list = this.activeHotspots();
    for (let i = list.length - 1; i >= 0; i--) {
      const h = list[i];
      const [x, y, w, hh] = typeof h.rect === 'function' ? h.rect(this.G) : h.rect;
      if (wx >= x && wx <= x + w && wy >= y && wy <= y + hh) return h;
    }
    return null;
  }

  activeHotspots() {
    return (this.scene.hotspots || []).filter((h) => !h.when || h.when(this.G));
  }

  async onClick(p, look) {
    if (this.inMenu || this.running || !this.scene || this.ui.notebookOpen) return;
    const h = this.hotspotAt(p);
    if (!h) {
      if (this.selectedItem) { this.selectItem(null); return; }
      const wx = p.x + this.r.cam.x;
      const [a, b] = this.scene.walk;
      this.player.walkTo(Math.max(a, Math.min(b, wx)));
      this.clickMark = { x: Math.max(a, Math.min(b, wx)), t: 0 };
      return;
    }
    const item = this.selectedItem;
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
      if (item) {
        this.selectItem(null);
        if (h.use) {
          const handled = await h.use(G, item);
          if (handled !== false) return;
        }
        await G.think(this.itemDefs[item].wrong || 'No. Eso no sirve ahí.');
        return;
      }
      if (look && h.look) await h.look(G);
      else if (h.act) await h.act(G);
      else if (h.look) await h.look(G);
    });
  }

  async run(fn) {
    this.running++;
    this.ui.busy(true);
    this.ui.hover(null);
    try { await fn(this.G); } catch (err) { console.error(err); }
    finally {
      this.running--;
      if (!this.running) { this.ui.busy(false); this.ui.hideDialogue(); }
    }
  }

  selectItem(id) {
    this.selectedItem = this.selectedItem === id ? null : id;
    this.refreshInventory();
  }

  refreshInventory(newId) {
    this.ui.renderInventory(this.state.items, this.itemDefs, this.selectedItem, (id) => {
      if (this.running) return;
      const def = this.itemDefs[id];
      if (this.selectedItem === id && def.examine) { this.selectItem(null); this.run((G) => def.examine(G)); return; }
      this.selectItem(id);
      if (this.selectedItem) this.ui.toast(`${def.name} — elige dónde usarlo (otra vez para examinar)`, 2600);
    }, newId);
  }

  // ------------------------------------------------------------ deduction
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
    if (d.denial) { this.state.sanity = Math.max(0, this.state.sanity - 6); this.ui.setSanity(this.state.sanity); audio.heartbeat(0.7); }
    if (d.final && this.state.deductions.filter((x) => x.startsWith('f_')).length >= 3) this.state.objective = 'Ir al agua.';
    if (d.final) { audio.whisper(1.4, 0.1); this.state.sanity = Math.max(0, this.state.sanity - 4); this.ui.setSanity(this.state.sanity); }
    this.pendingDeduction = d;
    return d;
  }

  async onNotebookClosed() {
    const d = this.pendingDeduction;
    this.pendingDeduction = null;
    if (d && d.after) await this.run((G) => d.after(G));
    if (this.scene?.onDeduce) await this.run((G) => this.scene.onDeduce(G));
  }

  // ------------------------------------------------------------ scenes
  buildLayers(scene) {
    const key = `${scene.id}@${this.r.rs}@${scene.variant ? scene.variant(this.G) : ''}`;
    if (!this.layerCache.has(key)) {
      const built = scene.build(this.r, this.G);
      this.layerCache.set(key, built);
    }
    const built = this.layerCache.get(key);
    scene.layers = built.layers;
    scene.lights = built.lights.map((l) => ({ ...l }));
    scene.built = built;
  }

  async goto(id, { x, facing, fade = true, noEnter = false } = {}) {
    const scene = this.scenes[id];
    if (!scene) throw new Error(`Escena desconocida: ${id}`);
    if (fade) await this.fadeTo(1, 700);
    this.ui.hover(null);
    if (this.scene?.leave) this.scene.leave(this.G);
    scene.G = this.G;
    this.scene = scene;
    this.state.scene = id;
    this.buildLayers(scene);
    this.actors = [this.player];
    this.player.visible = scene.noPlayer ? false : true;
    this.player.y = scene.groundY;
    this.player.h = scene.playerH || 206;
    this.player.lanternOn = !!scene.lantern;
    this.player.pose = null;
    this.player.alpha = 1;
    this.player.speed = scene.playerSpeed || (this.player.h < 160 ? 120 : 150);
    this.player.stop();
    this.camFocus = null;
    this.menuPan = false;
    this.player.x = x ?? scene.spawn ?? scene.walk[0] + 40;
    this.player.facing = facing ?? 1;
    if (scene.actors) for (const a of scene.actors(this.G)) this.actors.push(a);
    scene.life = scene.makeLife ? scene.makeLife(this.G) : [];
    this.r.cam.x = this.camTarget();
    audio.setBeds(scene.beds || {}, 1.5);
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

  addActor(a) { this.actors.push(a); return a; }
  actor(name) { return this.actors.find((a) => a.name === name); }

  // ------------------------------------------------------------ loop
  loop(now) {
    requestAnimationFrame((t) => this.loop(t));
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    try { this.tick(now, dt); } catch (err) { if (!this._loopErr) console.error(err); this._loopErr = true; }
  }

  tick(now, dt) {
    if (this.scene) {
      for (const a of this.actors) a.update(dt);
      if (this.scene.update) this.scene.update(this.G, dt);
      if (this.scene.life) for (const l of this.scene.life) if (l.update) l.update(dt, this.G);
      if (this.menuPan) this.camFocus = 1500 + Math.sin(now / 12000) * 260;
      const target = this.camTarget();
      this.r.cam.x += (target - this.r.cam.x) * Math.min(1, dt * 3.2);
      this.r.cam.shake = Math.max(0, this.r.cam.shake - dt * 20);
      const sanityMad = Math.max(0, (65 - this.state.sanity) / 65) * 0.6;
      const mad = Math.max(sanityMad, this.madTarget);
      this.r.fx.mad += (mad - this.r.fx.mad) * Math.min(1, dt * 1.5);
      this.r.fx.flash = Math.max(0, this.r.fx.flash - dt * 2.5);
      this.r.fx.red = Math.max(0, this.r.fx.red - dt * 1.2);
      this.updateHover();
      if (this.clickMark) this.clickMark.t += dt;
      if (this.revealT > 0) this.revealT -= dt;
      this.r.frame(this.scene, this.actors, dt, (ctx) => this.drawOverlay(ctx));
    }
  }

  updateHover() {
    const p = this.pointer;
    const c = this.cursorEl;
    if (!p.inside || p.touch || this.inMenu) { c.style.display = this.inMenu && p.inside && !p.touch ? 'block' : 'none'; c.style.left = `calc(${p.x} * var(--u))`; c.style.top = `calc(${p.y} * var(--u))`; c.className = ''; this.ui.hover(null); return; }
    c.style.display = 'block';
    c.style.left = `calc(${p.x} * var(--u))`;
    c.style.top = `calc(${p.y} * var(--u))`;
    if (this.running || this.ui.notebookOpen) { c.className = 'wait'; this.ui.hover(null); return; }
    const h = this.hotspotAt(p);
    c.className = h ? (h.cursor || 'look') : (this.selectedItem ? 'item' : '');
    if (h) this.ui.hover(this.selectedItem ? `Usar ${this.itemDefs[this.selectedItem].name.toLowerCase()} con ${h.name.toLowerCase()}` : h.name, p.x, p.y);
    else this.ui.hover(null);
  }

  drawOverlay(ctx) {
    if (this.revealT > 0 && this.scene && !this.running) {
      const a = Math.min(1, this.revealT) * 0.9;
      for (const h of this.activeHotspots()) {
        const [x, y, w, hh] = typeof h.rect === 'function' ? h.rect(this.G) : h.rect;
        const cx = x + w / 2 - this.r.cam.x, cy = Math.min(690, y + hh / 2);
        if (cx < -20 || cx > 1300) continue;
        ctx.strokeStyle = h.cursor === 'exit' ? `rgba(160,200,220,${a})` : `rgba(255,214,140,${a})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(cx, cy, 9 + Math.sin(performance.now() / 200) * 1.5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();
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

  static clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } }

  static unlocked() {
    try { return JSON.parse(localStorage.getItem(`${SAVE_KEY}.unlocked`) || '["prologue"]'); } catch { return ['prologue']; }
  }

  static chapterSnapshot(id) {
    try { const s = localStorage.getItem(`${SAVE_KEY}.ch.${id}`); return s ? JSON.parse(s) : null; } catch { return null; }
  }

  async startChapter(id, snapshot) {
    this.state = snapshot ? JSON.parse(JSON.stringify(snapshot)) : this.state;
    this.state.chapter = id;
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
      flag: (k, v) => { if (v === undefined) return !!game.state.flags[k]; game.state.flags[k] = v; return v; },
      has: (id) => game.state.items.includes(id),
      hasClue: (id) => game.state.clues.includes(id),
      deduced: (id) => game.state.deductions.includes(id),
      say: (who, text, opts) => game.ui.say(who, text, opts),
      think: (text) => game.ui.say('Ashgrove', text, { style: 'thought' }),
      voice: (text, opts = {}) => { audio.whisper(2.2, 0.16); return game.ui.say(opts.name ?? '', text, { style: 'voice', ...opts }); },
      narrate: (text) => game.ui.say('', text, { style: 'thought' }),
      choice: (opts, o) => { game.ui.hideDialogue(); return game.ui.choice(opts, o); },
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
      face: (dir) => { game.player.facing = dir; },
      fade: (v, ms = 800) => game.fadeTo(v, ms),
      flash: (v = 1) => { game.r.fx.flash = v; },
      red: (v = 0.8) => { game.r.fx.red = v; },
      shake: (v = 10) => { game.r.cam.shake = v; },
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
        game.refreshInventory(id);
        game.ui.toast(`Obtienes: ${game.itemDefs[id].name}`);
        audio.paper();
      },
      take: (id) => {
        game.state.items = game.state.items.filter((i) => i !== id);
        if (game.selectedItem === id) game.selectedItem = null;
        game.refreshInventory();
      },
      clue: (id) => {
        if (game.state.clues.includes(id)) return false;
        game.state.clues.push(id);
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
      chapter: (id) => game.startChapter(id),
      objective: (text) => { game.state.objective = text; },
      cinema: (on) => { game.stage.classList.toggle('cinema', !!on); },
      save: () => game.save(),
      nameEntry: (prompt, forced) => game.ui.nameEntry(prompt, forced),
      Actor,
    };
    return G;
  }
}
