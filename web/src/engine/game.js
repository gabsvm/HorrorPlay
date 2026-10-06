// Game controller: loop, camera, input, hotspots, state, and the script API (G) scenes are written against.
import { Renderer, W, H } from './renderer.js';
import { Actor } from './actor.js';
import { fgDressing } from '../art/build.js';
import { paintBody, paintVision } from '../art/bodies.js';
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
    this.cursorItemEl = document.getElementById('cursor-item');
    this.idleClock = 0;
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
    this.player = new Actor('Thomas', { h: 206, hat: 'bowler', coat: '#23262b', coatLen: 0.88, flare: 1.2, lantern: true, speed: 150, z: 10, collarUp: true, sideburns: true, hair: '#1a1410', gloves: '#2a221c', scarf: '#4a1612', stubble: 'rgba(30,22,18,0.35)' });
    this.player.isPlayer = true;
    this.player.onStep = (a) => {
      audio.step(this.scene?.surface || 'stone');
      if (this.scene && (this.scene.wet || this.scene.rain) && !this.scene.indoor) this.r.splash(a.x + a.facing * 14 * (a.h / 200), a.y);
    };
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
    const k = Math.min(1, dt * (tg.speed || 1.6));
    zs.z += (tg.z - zs.z) * k; zs.x += (tg.x - zs.x) * k; zs.y += (tg.y - zs.y) * k;
    const z = zs.z + this.punch * 0.05;
    const half = 0.5 / z;
    const ux = Math.max(half, Math.min(1 - half, (zs.x - this.r.cam.x) / W));
    const uy = Math.max(half, Math.min(1 - half, 1 - zs.y / H));
    this.r.fx.zoom = [z, ux, uy];
  }

  // Frame a dialogue: push in a little on the speaker, or between the two people talking.
  frameDialogue(npc, z = 1.08) {
    if (this.zoomTarget?.hold || !this.player.visible || window.FAST) return;
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
    if (this.running || !this.scene || this.inMenu) return;
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

  // How a hotspot presents itself to the player.
  verbFor(h) {
    if (this.selectedItem) return `Usar ${this.itemDefs[this.selectedItem].name.toLowerCase()} con`;
    if (h.cursor === 'talk') return 'Hablar con';
    if (h.cursor === 'exit') return 'Ir';
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

  async onClick(p, look) {
    if (this.inMenu || this.running || !this.scene || this.ui.notebookOpen) return;
    this.idleClock = 0;
    if (this.player.fidget) { if (this.player.pose === 'inspect') this.player.pose = null; this.player.fidget = null; this.player.shiver = 0; this.player.stillT = 0; }
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
      if (gesture) { this.player.pose = gesture; await wait(gesture === 'take' ? 260 : 180); }
      const settle = () => { if (this.player.pose === gesture) this.player.pose = null; };
      if (item) {
        this.selectItem(null);
        if (h.use) {
          const handled = await h.use(G, item);
          if (handled !== false) { settle(); return; }
        }
        await G.think(this.itemDefs[item].wrong || 'No. Eso no sirve ahí.');
        settle();
        return;
      }
      try {
      if (look && h.look) await h.look(G);
      else if (h.act) await h.act(G);
      else if (h.look) await h.look(G);
      } finally { settle(); (this.state.seen ||= {})[this.seenKey(h)] = true; }
    });
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
    try { await fn(this.G); } catch (err) { console.error(err); }
    finally {
      this.running--;
      if (!this.running) { this.ui.busy(false); this.ui.hideDialogue(); if (!this.zoomTarget?.hold) this.zoomTarget = null; }
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
    if (!built._dressed && !scene.noFgDressing) {
      const w = scene.width * 1.3;
      const fg = this.r.paintLayer(w, (ctx) => fgDressing(ctx, w, { seed: scene.id.length * 13 + scene.width, indoor: !!scene.indoor }), H, { blur: 3 });
      built.layers = [...built.layers, { canvas: fg, parallax: 1.3, kind: 'fg' }];
      built._dressed = true;
    }
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
    // one scale per scene: everyone in it (and the architecture) shares the same metres-to-pixels
    this.sceneScale = scene.scale ?? (scene.indoor ? 1.12 : 0.84);
    this.player.h = Math.round((scene.playerH || 206) * this.sceneScale);
    this.player.lanternOn = !!scene.lantern;
    this.player.pose = null;
    this.player.alpha = 1;
    this.player.speed = scene.playerSpeed || (this.player.h < 140 ? 120 : 150);
    this.player.stop();
    this.camFocus = null;
    this.menuPan = false;
    this.player.x = x ?? scene.spawn ?? scene.walk[0] + 40;
    this.player.facing = facing ?? 1;
    if (scene.actors) for (const a of scene.actors(this.G)) this.addActor(a);
    scene.life = scene.makeLife ? scene.makeLife(this.G) : [];
    this.r.cam.x = this.camTarget();
    this.zoomTarget = null;
    this.zoom = { z: window.FAST ? 1 : 1.07, x: this.player.x, y: scene.groundY - 160 };
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

  addActor(a) {
    if (!a._scaled) { a.h = Math.round(a.h * (this.sceneScale ?? 1)); a._scaled = true; }
    this.actors.push(a); return a;
  }
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
      this.player.idleAllowed = !this.running && !this.inMenu && !this.ui.notebookOpen;
      for (const a of this.actors) a.update(dt);
      if (this.scene.update) this.scene.update(this.G, dt);
      if (this.scene.life) for (const l of this.scene.life) if (l.update) l.update(dt, this.G);
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
      this.updateHover();
      if (this.clickMark) this.clickMark.t += dt;
      if (this.revealT > 0) this.revealT -= dt;
      this.idleClock = this.running || this.inMenu || this.ui.notebookOpen ? 0 : (this.idleClock || 0) + dt;
      this.r.frame(this.scene, this.actors, dt, (ctx) => this.drawOverlay(ctx));
    }
  }

  // The satchel shows itself when the pointer goes near it, while an item is held, just after
  // something new arrives, and always on touch screens.
  updateSatchel() {
    const p = this.pointer;
    const show = !!this.selectedItem || p.touch || this.ui.coarse || this.ui.invHover || (p.inside && p.y > 560) || performance.now() < (this.invShowUntil || 0) || this.ui.notebookOpen;
    this.ui.invTuck(!show);
  }

  updateHover() {
    this.updateSatchel();
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
      flag: (k, v) => { if (v === undefined) return !!game.state.flags[k]; game.state.flags[k] = v; return v; },
      has: (id) => game.state.items.includes(id),
      hasClue: (id) => game.state.clues.includes(id),
      deduced: (id) => game.state.deductions.includes(id),
      say: async (who, text, opts) => {
        const speaking = (who === 'Ashgrove' || who === 'Thomas') && !(opts && opts.style);
        if (speaking) game.player.talking = true;
        // the NPC who speaks moves their mouth and turns to whoever they are talking to
        const npc = !speaking && who ? game.actors.find((a) => a !== game.player && (a.name === who || a.name === who.split(' ').pop()) && a.visible) : null;
        const was = npc && npc.talking;
        if (npc) { npc.talking = true; if (!npc.pose && game.player.visible) npc.facing = game.player.x >= npc.x ? 1 : -1; }
        const portrait = speaking ? game.player : npc;
        if (portrait) game.frameDialogue(npc);
        try { await game.ui.say(who, text, { portrait, ...opts }); } finally { if (speaking) game.player.talking = false; if (npc && !was) npc.talking = false; }
      },
      think: (text) => (game.frameDialogue(null, 1.05), game.ui.say('Ashgrove', text, { style: 'thought', portrait: game.player.visible ? game.player : null })),
      voice: (text, opts = {}) => { audio.whisper(2.2, 0.16); return game.ui.say(opts.name ?? '', text, { style: 'voice', portrait: game.player.visible ? game.player : null, ...opts }); },
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
      flash: (v = 1) => { game.r.fx.flash = v; game.punch = 1; },
      red: (v = 0.8) => { game.r.fx.red = v; game.punch = 1; },
      shake: (v = 10) => { game.r.cam.shake = v; game.punch = Math.max(game.punch || 0, 0.6); },
      // Kneel over a body and examine it close up. `points`: [{ id, x, y, r, name, act(G) }] in 1280x720.
      inspect: async (id, { title, body, points }) => {
        const seen = ((game.state.seen ||= {})[`insp:${id}`] ||= {});
        const p = game.player;
        if (!window.FAST && !seen.__first) { p.pose = 'recoil'; G.audio.sting(0.15); await wait(750); }
        seen.__first = true;
        p.pose = 'kneel';
        if (window.FAST) { for (const pt of points) { await pt.act(G); seen[pt.id] = true; } }
        else {
          // the scene stays black behind the close-up, and comes back when he stands up
          await G.fade(1, 450);
          await game.ui.inspect({ title, paint: (ctx, w, h) => paintBody(ctx, w, h, body), points, seen, fx: () => ({ red: game.r.fx.red, shake: game.r.cam.shake }) }, (pt) => pt.act(G));
          await G.fade(0, 600);
        }
        p.pose = null;
      },
      // a subliminal flash: 'hands' or a body close-up
      vision: (kind = 'hands') => { game.punch = 1; return game.ui.vision((ctx, w, h) => paintVision(ctx, w, h, kind)); },
      // a held camera move for a scripted moment; G.zoom(1) lets go
      zoom: (z = 1.15, x, y, speed = 0.8) => {
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
          mouse: 'Para usar un objeto, haz clic en él en el inventario y luego en lo que quieras usarlo. Dos clics sobre el objeto lo examinan. <kbd>Esc</kbd> lo suelta.',
          touch: 'Para usar un objeto, tócalo en el inventario y luego toca dónde usarlo. Tócalo dos veces para examinarlo.',
        }, 8000);
        game.refreshInventory(id);
        game.ui.toast(`Obtienes: ${game.itemDefs[id].name}`);
        audio.pickup();
        // the satchel opens to receive it and the icon flies there from where it was found
        game.invShowUntil = performance.now() + 3200;
        game.ui.invTuck(false);
        const p = game.player, from = game.actingAt || { x: p.x - game.r.cam.x, y: p.y - p.h * 0.5 };
        if (!window.FAST) game.ui.flyItem(game.itemDefs[id], id, from);
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
      nameEntry: (prompt, forced) => game.ui.nameEntry(prompt, forced),
      Actor,
    };
    return G;
  }
}
