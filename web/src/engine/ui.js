// DOM user interface: dialogue, choices, documents, notebook, inventory, cards.
import { audio } from './audio.js';
import { prefs } from './prefs.js';
import { pixelize } from '../art/pixel.js';
import { Actor } from './actor.js';
import { evaluate as theories } from '../story/theories.js';
import { QUESTIONS, readPosition, BRENNAN_STANCE_LABEL } from '../story/positions.js';
import { morphFrames } from './signature.js';
import { perception, perceptionBand } from '../story/perception.js';
import { metrics } from './metrics.js';

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Every line ever read, by a short hash, so a replay (or the second reading) shows what was already
// read whole. Kept apart from the save; at most a few thousand entries.
const SEEN_KEY = 'elhuesped.seenLines';
const seenLines = (() => { try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); } })();
let seenDirty = 0;
function lineHash(t) { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); }
function markSeen(h) {
  if (seenLines.has(h)) return;
  seenLines.add(h);
  clearTimeout(seenDirty);
  seenDirty = setTimeout(() => { try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seenLines].slice(-4000))); } catch { /* storage unavailable */ } }, 1500);
}

// A wait the player can cut short with a click, a tap or a key (cards and title screens)
function skippableWait(ms, min = 500) {
  return new Promise((res) => {
    let done = false;
    const t0 = performance.now();
    const finish = () => { if (done) return; done = true; clearTimeout(timer); window.removeEventListener('pointerdown', onSkip, true); window.removeEventListener('keydown', onSkip, true); res(); };
    const onSkip = (e) => { if (performance.now() - t0 < min) return; if (e.type === 'keydown' && ![' ', 'Enter', 'Escape'].includes(e.key)) return; finish(); };
    const timer = setTimeout(finish, ms);
    window.addEventListener('pointerdown', onSkip, true);
    window.addEventListener('keydown', onSkip, true);
  });
}

export class UI {
  constructor() {
    this.el = {
      ui: $('ui'), hud: $('hud'), date: $('date'), clock: $('clock'), sanity: $('sanity-fill'),
      dlg: $('dialogue'), dlgName: $('dlg-name'), dlgText: $('dlg-text'), dlgNext: $('dlg-next'),
      choices: $('choices'), toast: $('toast'), hover: $('hover-label'),
      invBtn: $('btn-inv'), invCount: $('inv-count'), held: $('held'), heldIcon: $('held-icon'), heldName: $('held-name'), heldCancel: $('held-cancel'),
      invModal: $('inv-modal'), invGrid: $('inv-grid'), invDName: $('inv-dname'), invDText: $('inv-dtext'), invExamine: $('inv-examine'), invUse: $('inv-use'), invClose: $('inv-close'),
      nb: $('notebook'), clueList: $('clue-list'), dedList: $('deduction-list'),
      profList: $('profile-list'), profTitle: $('profile-title'), nbFeedback: $('nb-feedback'), theoryList: $('theory-list'),
      doc: $('document'), docBody: $('doc-body'), card: $('card'),
      nameEntry: $('name-entry'), namePrompt: $('name-prompt'), nameInput: $('name-input'), nameOk: $('name-ok'),
      menu: $('menu'), menuButtons: $('menu-buttons'),
    };
    this._advance = null;
    // the one question whose «Mi postura» block is open (page state only: not in the save, not in storage)
    this._openPosture = null;
    this.el.dlg.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.advance(); });
    window.addEventListener('keydown', (e) => {
      if ((e.key === ' ' || e.key === 'Enter') && this._advance) { e.preventDefault(); this.advance(); }
      if (e.key === 'Escape' && this._inspectClose && !this._advance) this._inspectClose();
      if (/^[1-9]$/.test(e.key) && this._choiceKeys) { const b = this._choiceKeys[Number(e.key) - 1]; if (b) b.click(); }
    });
    $('doc-close').addEventListener('click', () => this._docClose && this._docClose());
    $('nb-close').addEventListener('click', () => this.closeNotebook());
    // the right-hand page: conclusions, the open questions, the profile
    for (const b of document.querySelectorAll ? document.querySelectorAll('#nb-tabs button') : []) b.addEventListener('click', () => { audio.paper?.(); this.notebookTab(b.dataset.tab); });
    $('nb-hint').addEventListener('click', () => this.hint());
    this.selectedClues = [];
    // the marker of the object in hand cancels it; the case blocks the scene under it, and a press outside its panel closes it
    this.el.heldCancel.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.el.heldCancel.addEventListener('click', (e) => { e.stopPropagation?.(); audio.click(); this._heldCancel?.(); });
    this.el.invModal.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (e.target === this.el.invModal) this._invClose?.(); });
    this.coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    // «Mi postura» (positions.js): one listener on the list, so re-rendering never stacks them. A press on
    // a question's line folds or unfolds it (page state only); an option writes the position. Each press
    // renders exactly once: game.setPosition renders when it writes, otherwise the listener does. The
    // pressed control gets its focus back after the render.
    this.el.theoryList?.addEventListener('click', (e) => {
      const toggle = e.target?.closest?.('button[data-toggle]');
      if (toggle) {
        const q = toggle.dataset.toggle;
        this._openPosture = this._openPosture === q ? null : q;
        this.renderNotebook();
        this.focusPosture(`button[data-toggle="${q}"]`);
        if (this._openPosture) this.el.theoryList?.querySelector?.(`button[data-q="${q}"]`)?.closest?.('.posture')?.scrollIntoView?.({ block: 'nearest' });
        return;
      }
      const opt = e.target?.closest?.('button[data-q]');
      if (!opt || !this.game) return;
      const { q, v } = opt.dataset;
      if (!this.game.setPosition(q, v)) this.renderNotebook();
      this.focusPosture(`button[data-q="${q}"][data-v="${v}"]`);
    });
  }

  // the control with this selector, inside the theory list, takes the focus (the list was just rebuilt)
  focusPosture(sel) { this.el.theoryList?.querySelector?.(sel)?.focus?.(); }

  busy(on) { this.el.ui.classList.toggle('busy', on); }
  showHud(on) { this.el.hud.classList.toggle('hidden', !on); if (!on) this.el.held.classList.add('hidden'); else if (this._heldCancel) this.el.held.classList.remove('hidden'); }

  setDate(date, clock) {
    if (date != null) this.el.date.textContent = date;
    if (clock != null) this.el.clock.textContent = clock;
  }

  setSanity(v) {
    this.el.sanity.style.width = `${Math.max(0, v)}%`;
    // the colour is the perception band (story/perception.js), not a separate scale
    const band = perceptionBand(v);
    this.el.sanity.style.background = band === 'steady' ? 'linear-gradient(90deg,#4f6b62,#9db3a6)' : band === 'strained' ? 'linear-gradient(90deg,#5f5a3c,#a69a64)' : 'linear-gradient(90deg,#5b1a14,#a2382b)';
  }

  advance() { if (this._advance) this._advance(); }

  // Typewriter dialogue, as subtitles: the name over the line, nothing behind it to cover the scene.
  // Click once to complete the line, again to continue. Thoughts carry no name.
  async say(name, text, { style = '', auto = 0 } = {}) {
    if (window.FAST) { (window.LOG ||= []).push(`${name || '·'}: ${text.replace(/<[^>]+>/g, '')}`); return; }
    const { dlg, dlgName, dlgText, dlgNext } = this.el;
    const speaker = style === 'thought' ? '' : name || '';
    const fresh = dlg.classList.contains('hidden') || this._speaker !== speaker;
    this._speaker = speaker;
    dlg.classList.remove('hidden');
    dlg.classList.toggle('voice', style === 'voice');
    if (fresh) { dlg.classList.remove('enter'); void dlg.offsetWidth; dlg.classList.add('enter'); }
    dlgName.textContent = speaker;
    dlgText.className = style;
    dlgNext.style.visibility = 'hidden';
    const html = text;
    const plain = html.replace(/<[^>]+>/g, '');
    let done = false;
    let skip = false;
    this._advance = () => { skip = true; };
    const speed = (style === 'voice' ? 55 : 22) * prefs.text;
    if (!speed) skip = true;
    const h = lineHash(`${speaker}|${plain}`);
    if (prefs.seenFast && seenLines.has(h)) skip = true;
    markSeen(h);
    for (let i = 1; i <= plain.length && !skip; i++) {
      dlgText.textContent = plain.slice(0, i);
      const ch = plain[i - 1];
      if (i % 3 === 0 && style !== 'voice') audio.tick();
      await wait(ch === '.' || ch === '?' || ch === '!' ? speed * 7 : ch === ',' ? speed * 3 : speed);
    }
    dlgText.innerHTML = html;
    dlgNext.style.visibility = 'visible';
    await new Promise((res) => {
      this._advance = () => { if (!done) { done = true; res(); } };
      if (auto) setTimeout(() => this._advance && this._advance(), auto);
    });
    this._advance = null;
    audio.click();
  }

  hideDialogue() { this.el.dlg.classList.add('hidden'); this._speaker = null; }

  // prompt: a question shown above the options (a timed choice must never be made blind)
  // cancel: the index Back/Escape picks (only a conversation menu has one: its «Nada más»)
  async choice(options, { timeout = 0, def = 0, prompt = '', cancel = -1 } = {}) {
    if (window.FAST) {
      // tests pick by position or, preferably, by a piece of the option's text
      let k = (window.PICKS || []).length ? window.PICKS.shift() : 0;
      if (typeof k === 'string') {
        const want = k;
        k = options.findIndex((o) => String(o).toLowerCase().includes(want.toLowerCase()));
        if (k < 0) throw new Error(`Opción no disponible: «${want}» entre ${options.map((o) => `«${o}»`).join(', ')}`);
      }
      k = Math.min(k, options.length - 1);
      if (prompt) (window.LOG ||= []).push(`  ? ${prompt}`);   // the question, so the script export carries it
      (window.LOG ||= []).push(`  > ${options[k]}`);
      return k;
    }
    const box = this.el.choices;
    box.innerHTML = '';
    box.classList.remove('hidden');
    if (prompt) { const q = document.createElement('div'); q.className = 'choice-prompt'; q.textContent = prompt; box.appendChild(q); }
    const shown = performance.now();
    return new Promise((res) => {
      let timer = null;
      if (timeout) {
        const bar = document.createElement('div');
        bar.className = 'timer';
        bar.style.animationDuration = `${timeout}ms`;
        box.appendChild(bar);
        const expire = () => { box.classList.add('hidden'); this._choiceKeys = null; this.pauseClock = this.resumeClock = null; res(def); };
        let deadline = performance.now() + timeout, left = 0;
        timer = setTimeout(expire, timeout);
        // the clock stops while the app is away (Android pause) and resumes with the time that was left
        this.pauseClock = () => { if (!timer) return; clearTimeout(timer); timer = null; left = Math.max(0, deadline - performance.now()); bar.style.animationPlayState = 'paused'; };
        this.resumeClock = () => { if (timer || !left) return; deadline = performance.now() + left; timer = setTimeout(expire, left); bar.style.animationPlayState = 'running'; };
      }
      const pick = (i) => {
        if (timer) clearTimeout(timer);
        this.pauseClock = this.resumeClock = null;
        this._talkCancel = null;
        audio.click();
        box.classList.add('hidden');
        this._choiceKeys = null;
        res(i);
      };
      if (cancel >= 0 && !timeout) this._talkCancel = () => pick(cancel);
      this._choiceKeys = options.map((opt, i) => {
        const b = document.createElement('button');
        b.className = 'choice';
        b.innerHTML = `<span class="num">${i + 1}</span>${opt}`;
        b.addEventListener('pointerdown', (e) => e.stopPropagation());
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          if (performance.now() - shown < 280) return;   // the click that ended the last line, landing here
          pick(i);
        });
        box.appendChild(b);
        return b;
      });
    });
  }

  toast(text, ms = 2600, notice = false) {
    if (window.FAST) (window.LOG ||= []).push(`[aviso] ${text}`);
    const t = this.el.toast;
    t.textContent = text;
    t.classList.toggle('notice', notice);
    t.classList.add('show');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.classList.remove('show'), ms);
  }

  // Label over the thing under the pointer: a small verb line and the name.
  hover(text, x, y, verb = '', kind = '', arrow = 0) {
    const h = this.el.hover;
    if (!text) { h.classList.add('hidden'); return; }
    h.classList.remove('hidden');
    h.className = kind;
    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const l = arrow < 0 ? '<span class="arrow">←</span>' : '', r = arrow > 0 ? '<span class="arrow">→</span>' : '';
    h.innerHTML = (verb ? `<span class="verb">${esc(verb)}</span>` : '') + l + esc(text) + r;
    // keep the whole label on screen, however long the name
    const u = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u')) || 1;
    const half = (h.offsetWidth || 0) / u / 2 + 12;
    h.style.left = `calc(${Math.max(half, Math.min(1280 - half, x))} * var(--u))`;
    h.style.top = `calc(${Math.max(70, y)} * var(--u))`;
  }

  setObjective(text) {
    const el = document.getElementById('hud-objective');
    if (el.textContent === (text || '')) return;
    el.textContent = text || '';
    if (text) this.toast('Nuevo objetivo', 2200);
  }

  setBadge(n) {
    const b = document.getElementById('nb-badge');
    b.textContent = n > 9 ? '9+' : String(n);
    b.classList.toggle('hidden', !n);
  }

  async tip(html, ms = 6500) {
    const t = document.getElementById('tip');
    t.innerHTML = html;
    t.classList.remove('hidden');
    await wait(30);
    t.classList.add('show');
    clearTimeout(this._tipT);
    this._tipT = setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.classList.add('hidden'), 900); }, ms);
  }

  async doc(html) {
    if (window.FAST) { (window.LOG ||= []).push('[documento]'); return; }
    this.el.docBody.innerHTML = html;
    this.el.doc.classList.remove('hidden');
    audio.paper();
    await new Promise((r) => { this._docClose = r; });
    this._docClose = null;
    this.el.doc.classList.add('hidden');
    audio.paper();
  }

  async card(kicker, title, sub = '', ms = 4200) {
    if (window.FAST) { (window.LOG ||= []).push(`[${kicker} ${title} ${sub}]`); return; }
    const c = this.el.card;
    $('card-kicker').textContent = kicker;
    $('card-title').textContent = title;
    $('card-sub').textContent = sub;
    c.classList.remove('hidden');
    await wait(50);
    c.classList.add('show');
    const t0 = performance.now();
    await skippableWait(ms);
    metrics.cinematic(performance.now() - t0);
    c.classList.remove('show');
    await wait(prefs.reduceMotion ? 300 : 900);
    c.classList.add('hidden');
  }

  // ------------------------------------------------------------ crime-scene close-up
  // A painted close-up explored in the dark: the pointer carries the lantern, and anything worth
  // examining names itself when the light falls on it. `onPoint(point)` runs the examination.
  async inspect({ title, paint, points, seen = {}, fx = null, keyMarks = false }, onPoint) {
    const box = $('inspect'), img = $('insp-img'), dark = $('insp-dark'), label = $('insp-label');
    this.hideDialogue();
    const hi = document.createElement('canvas'); hi.width = 1280; hi.height = 720;
    paint(hi.getContext('2d'), 1280, 720);
    const lo = pixelize(hi, 0.5, { dither: 8 });
    const ic = img.getContext('2d'); ic.imageSmoothingEnabled = false; ic.drawImage(lo, 0, 0);
    // unless quality is low, the lantern really lights the close-up: relief read from the painting,
    // raked from wherever the light is held
    const relight = Actor.lowFx ? null : makeRelight(ic, lo);
    $('insp-title').textContent = title || '';
    box.classList.remove('hidden', 'busy');
    const dc = dark.getContext('2d');
    let lx = 640, ly = 360, hover = null, armed = null, busy = false, closed = false, raf = 0;
    const toLocal = (e) => { const r = box.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 1280, y: ((e.clientY - r.top) / r.height) * 720 }; };
    const at = (x, y) => points.find((p) => Math.hypot(p.x - x, p.y - y) < (p.r || 60)) || null;
    const draw = () => {
      if (closed) return;
      const t = performance.now() / 1000, fl = 1 + Math.sin(t * 9) * 0.02 + Math.sin(t * 23) * 0.015;
      dc.globalCompositeOperation = 'source-over';
      dc.clearRect(0, 0, 640, 360);
      if (relight) relight(lx / 2, ly / 2, fl);
      else {
        dc.fillStyle = 'rgba(2,2,4,0.94)'; dc.fillRect(0, 0, 640, 360);
        dc.globalCompositeOperation = 'destination-out';
        const g = dc.createRadialGradient(lx / 2, ly / 2, 10, lx / 2, ly / 2, 120 * fl);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        dc.fillStyle = g; dc.fillRect(0, 0, 640, 360);
        // a little ambient so the shape of the body is always there
        dc.fillStyle = 'rgba(0,0,0,0.12)'; dc.fillRect(0, 0, 640, 360);
        dc.globalCompositeOperation = 'source-over';
      }
      // warm lantern tint where the light falls
      const w = dc.createRadialGradient(lx / 2, ly / 2, 4, lx / 2, ly / 2, 110 * fl);
      w.addColorStop(0, 'rgba(255,170,90,0.10)'); w.addColorStop(1, 'rgba(255,170,90,0)');
      dc.fillStyle = w; dc.fillRect(0, 0, 640, 360);
      for (const p of points) {
        const d = Math.hypot(p.x - lx, p.y - ly);
        // steady: what matters and is still unexamined shows from farther away
        const reach = keyMarks && p.key && !seen[p.id] ? 520 : 260;
        if (d > reach) continue;
        const a = Math.max(0, 1 - d / reach) * (seen[p.id] ? 0.35 : 0.8);
        dc.strokeStyle = seen[p.id] ? `rgba(160,160,150,${a})` : `rgba(255,214,140,${a})`;
        dc.lineWidth = 1;
        dc.beginPath(); dc.arc(p.x / 2, p.y / 2, (seen[p.id] ? 4 : 6) + Math.sin(t * 4) * 1, 0, Math.PI * 2); dc.stroke();
      }
      // the shocks of the scene reach the close-up: a wash of red, a jolt
      const f = fx ? fx() : null;
      if (f && f.red > 0.01) { dc.fillStyle = `rgba(130,0,0,${Math.min(0.6, f.red * 0.6)})`; dc.fillRect(0, 0, 640, 360); }
      box.style.transform = f && f.shake > 0.5 ? `translate(${(Math.random() - 0.5) * f.shake * 0.4}px, ${(Math.random() - 0.5) * f.shake * 0.3}px)` : '';
      raf = requestAnimationFrame(draw);
    };
    draw();
    const showLabel = () => {
      if (!hover || busy) { label.classList.add('hidden'); return; }
      label.classList.remove('hidden');
      label.innerHTML = `<span class="verb">${seen[hover.id] ? 'Volver a mirar' : 'Examinar'}</span>${hover.name}`;
      label.style.left = `calc(${hover.x} * var(--u))`; label.style.top = `calc(${hover.y} * var(--u))`;
    };
    const move = (e) => { const p = toLocal(e); lx = p.x; ly = p.y; hover = at(lx, ly); box.style.cursor = hover && !busy ? 'pointer' : 'none'; showLabel(); };
    const tally = () => {
      const n = points.filter((p) => seen[p.id]).length;
      const keysLeft = keyMarks ? points.filter((p) => p.key && !seen[p.id]).length : 0;
      $('insp-hint').textContent = n ? `Examinado: ${n} de ${points.length}${keysLeft ? ` · quedan ${keysLeft} detalle${keysLeft === 1 ? '' : 's'} importante${keysLeft === 1 ? '' : 's'}` : ''}` : this.coarse ? 'Toca para llevar la luz; toca otra vez para examinar.' : 'Mueve la luz. Haz clic en lo que quieras examinar.';
      $('insp-close').classList.toggle('done', n === points.length);
    };
    tally();
    const down = async (e) => {
      if (e.target.id === 'insp-close') return;
      if (this._advance) { this.advance(); return; }
      move(e);
      if (busy || !hover) return;
      // on a touch screen the first tap brings the light and names the thing; the second examines it
      if (e.pointerType === 'touch' && armed !== hover) { armed = hover; return; }
      armed = null;
      busy = true; box.classList.add('busy'); showLabel();
      audio.click();
      const p = hover;
      try { await onPoint(p); } finally { seen[p.id] = true; this.hideDialogue(); busy = false; box.classList.remove('busy'); tally(); showLabel(); }
    };
    box.addEventListener('pointermove', move);
    box.addEventListener('pointerdown', down);
    await new Promise((res) => {
      const close = () => { if (busy) return; res(); };
      $('insp-close').onclick = close;
      this._inspectClose = close;
    });
    closed = true; cancelAnimationFrame(raf);
    this._inspectClose = null;
    box.removeEventListener('pointermove', move);
    box.removeEventListener('pointerdown', down);
    box.classList.add('hidden'); label.classList.add('hidden'); box.style.transform = '';
  }

  // A flash of something he does not remember doing, a few frames long, twice. With reduced motion,
  // one still image that fades in and out: the same picture, no flicker.
  async vision(paint) {
    if (window.FAST) return;
    const v = $('vision');
    const hi = document.createElement('canvas'); hi.width = 1280; hi.height = 720;
    paint(hi.getContext('2d'), 1280, 720);
    const c = v.getContext('2d'); c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, 640, 360); c.drawImage(pixelize(hi, 0.5, { dither: 10 }), 0, 0);
    if (prefs.reduceMotion) {
      v.style.transition = 'opacity 400ms ease';
      v.style.opacity = '0';
      v.classList.remove('hidden');
      void v.offsetWidth;
      v.style.opacity = '0.7';
      await wait(1300);
      v.style.opacity = '0';
      await wait(450);
      v.classList.add('hidden');
      v.style.transition = ''; v.style.opacity = '';
      return;
    }
    for (const ms of [90, 60, 140]) {
      v.classList.remove('hidden'); v.style.opacity = String(0.6 + Math.random() * 0.4);
      await wait(ms);
      v.classList.add('hidden');
      await wait(70 + Math.random() * 120);
    }
  }

  // ------------------------------------------------------------ inventory
  // No bar over the scene: a HUD button with the count, a small marker for the object in hand, and a case
  // that opens on request. Select, examine, use and close are separate buttons (no hidden double tap). The
  // open case is page state only: it is rebuilt from state.items every time and is never saved.
  itemPix(d) {
    if (!d._pix) {
      const cv = document.createElement('canvas');
      cv.width = 96; cv.height = 96;
      d.icon(cv.getContext('2d'));
      d._pix = pixelize(cv, 0.5, { dither: 6, edge: 0.55 });
    }
    return d._pix;
  }

  // the HUD: "Inventario (n)", and the marker of the object in hand with its Cancel button
  renderHud(items, defs, selected, onCancel) {
    const n = items.length;
    this.el.invCount.textContent = n ? ` (${n})` : '';
    this.el.invBtn.setAttribute?.('aria-label', `Inventario: ${n} ${n === 1 ? 'objeto' : 'objetos'}`);
    const d = selected && defs[selected];
    if (d) {
      const c = this.el.heldIcon.getContext('2d');
      c.clearRect(0, 0, 48, 48);
      c.drawImage(this.itemPix(d), 0, 0);
      this.el.heldName.textContent = `${d.name}: elige dónde usarlo`;
      this.el.held.classList.remove('hidden');
    } else this.el.held.classList.add('hidden');
    this._heldCancel = d ? onCancel : null;
  }

  // something new went into the case: the button answers, no icon flies to a slot that is not there
  itemArrived() {
    const b = this.el.invBtn;
    b.classList.remove('arrive'); void b.offsetWidth; b.classList.add('arrive');
  }

  get inventoryOpen() { return !this.el.invModal.classList.contains('hidden'); }

  // open the case: o = { describe(id) -> Promise<string[]>, canUse() -> bool, onUse(id) }
  openInventory(items, defs, o) {
    if (this.inventoryOpen) return;
    const m = this.el.invModal, grid = this.el.invGrid;
    const before = document.activeElement;
    grid.innerHTML = '';
    const slots = [];
    let current = null, reading = 0;
    const show = (id) => {
      current = id;
      for (const b of slots) {
        const on = b.dataset.id === id;
        b.classList.toggle('selected', on);
        b.setAttribute?.('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;   // one stop for the grid in the Tab order; the arrows move inside it
      }
      const d = id && defs[id];
      this.el.invDName.textContent = d ? d.name : 'Vacío';
      this.el.invDText.textContent = d ? 'Examinar lee lo que Thomas ve en él. Usar lo deja en la mano para elegir dónde.' : 'No llevas nada.';
      this.el.invExamine.disabled = !d || !d.examine;
      this.el.invUse.disabled = !d || !o.canUse();
    };
    for (const id of items) {
      const d = defs[id];
      if (!d) continue;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'inv-slot';
      (b.dataset ||= {}).id = id;
      b.setAttribute?.('role', 'option');
      b.setAttribute?.('aria-label', d.name);
      const pix = document.createElement('canvas');
      pix.width = 48; pix.height = 48;
      pix.getContext('2d').drawImage(this.itemPix(d), 0, 0);
      b.appendChild(pix);
      const label = document.createElement('span');
      label.className = 'inv-slot-name'; label.textContent = d.name;
      b.appendChild(label);
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      b.addEventListener('click', (e) => { e.stopPropagation?.(); audio.click(); show(id); });
      grid.appendChild(b);
      slots.push(b);
    }
    const close = () => {
      m.classList.add('hidden');
      m.removeEventListener('keydown', trap);
      this._invClose = null;
      audio.bookClose?.();
      (before && before.focus ? before : this.el.invBtn).focus?.();
    };
    // examine: the object's own words, read here, not said behind the case
    const examine = async () => {
      if (!current) return;
      const ticket = ++reading;
      this.el.invDText.textContent = '…';
      const lines = await o.describe(current);
      if (ticket !== reading || !this.inventoryOpen) return;
      this.el.invDText.textContent = lines.length ? lines.join('\n\n') : 'Nada que añadir.';
    };
    const use = () => { if (!current || !o.canUse()) return; const id = current; close(); o.onUse(id); };
    this.el.invExamine.onclick = (e) => { e?.stopPropagation?.(); examine(); };
    this.el.invUse.onclick = (e) => { e?.stopPropagation?.(); use(); };
    this.el.invClose.onclick = (e) => { e?.stopPropagation?.(); close(); };
    // keep the keyboard inside the case (Tab and Shift+Tab cycle through what is enabled); in the grid of
    // slots the arrows, Home and End move the selection, as a listbox does (UX audit b69323b, UX-B05)
    const COLS = 3;
    const trap = (e) => {
      const at = slots.indexOf(document.activeElement);
      if (at >= 0 && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
        const n = slots.length;
        const to = { ArrowLeft: at - 1, ArrowRight: at + 1, ArrowUp: at - COLS, ArrowDown: at + COLS, Home: 0, End: n - 1 }[e.key];
        e.preventDefault();
        if (to < 0 || to >= n) return;
        slots[to].focus(); show(slots[to].dataset.id);
        return;
      }
      if (e.key !== 'Tab') return;
      const f = [...slots.filter((x) => x.tabIndex === 0), this.el.invExamine, this.el.invUse, this.el.invClose].filter((x) => !x.disabled);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      const next = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1);
      e.preventDefault(); f[next].focus();
    };
    m.addEventListener('keydown', trap);
    m.classList.remove('hidden');
    this._invClose = close;
    audio.bookOpen?.();
    show(items.find((id) => defs[id]) || null);
    (slots[0] || this.el.invClose).focus?.();
  }

  // ------------------------------------------------------------ notebook
  openNotebook(game) {
    this.game = game;
    this.selectedClues = [];
    this.el.nbFeedback.textContent = '';
    this.notebookTab(this._tab || 'ded');
    game.state.unread = 0;
    this.setBadge(0);
    this.renderNotebook();
    this.el.nb.classList.remove('hidden');
    audio.bookOpen();
  }

  closeNotebook() {
    this.el.nb.classList.add('hidden');
    audio.bookClose();
    if (this.game && this.game.onNotebookClosed) this.game.onNotebookClosed();
  }

  get notebookOpen() { return !this.el.nb.classList.contains('hidden'); }

  renderNotebook() {
    const g = this.game, st = g.state;
    const { clueList, dedList, profList, profTitle } = this.el;
    document.getElementById('objective').textContent = st.objective || '';
    clueList.innerHTML = '';
    const second = !!st.flags.second;
    for (const id of st.clues) {
      const c = g.clues[id];
      const li = document.createElement('li');
      // a clue may read differently in the second reading (text2), and carries a note in the other
      // hand there (truth2); text may depend on the story so far
      const txt = second && c.text2 ? c.text2 : typeof c.text === 'function' ? c.text(st) : c.text;
      // a tag may depend on the story so far too (the street where the chase went wrong, data.js)
      const tag = typeof c.tag === 'function' ? c.tag(st) : c.tag;
      li.innerHTML = `<span class="tag">${tag || ''}</span>${txt}${second && c.truth2 ? `<span class="second">${c.truth2}</span>` : ''}`;
      if (this.selectedClues.includes(id)) li.classList.add('sel');
      if (g.clueExhausted(id)) li.classList.add('used');
      li.addEventListener('click', () => this.pickClue(id));
      clueList.appendChild(li);
    }
    if (!st.clues.length) clueList.innerHTML = '<li>Todavía nada.</li>';
    dedList.innerHTML = '';
    const awake = !!st.flags.awake || second;
    st.deductions.forEach((id, i) => {
      const d = g.deductions.find((x) => x.id === id);
      const li = document.createElement('li');
      if (this._inkFrom != null && i >= this._inkFrom) li.classList.add('fresh');
      // hypotheses and inferences are marked as such: joining two clues does not make a guess a fact
      const kind = d.kind ? `<span class="ded-kind">${d.kind === 'hipotesis' ? 'Hipótesis' : 'Inferencia'}</span> ` : '';
      if (awake && d.truth && (d.denial || d.denialLate)) li.innerHTML = `${kind}<s>${d.text}</s><br><span class="truth">${d.truth}</span>`;
      else if (d.final) li.innerHTML = `<span class="truth">${d.text}</span>`;
      else li.innerHTML = kind + d.text;
      dedList.appendChild(li);
    });
    this._inkFrom = null;
    if (!st.deductions.length) dedList.innerHTML = '<li>Ninguna todavía.</li>';
    // the open questions: each explanation with what supports it and what does not
    const ths = theories(st);
    const tl = this.el.theoryList;
    if (tl) {
      tl.innerHTML = '';
      for (const t of ths) {
        const li = document.createElement('li');
        const doubt = perception.doubtTheories(st.sanity);
        li.innerHTML = `<span class="q">${t.q}</span>` + t.hyps.map((h) => `<span class="h"><span class="st ${h.status.replace(' ', '-')}">${h.status}${doubt && h.status === 'plausible' ? ', lo dudo' : ''}</span>${h.text}</span>`
          + (h.for.length ? `<span class="ev">A favor: ${h.for.join('; ')}.</span>` : '')
          + (h.against.length ? `<span class="ev">En contra: ${h.against.join('; ')}.</span>` : '')).join('') + this.postureHtml(st, t.id);
        tl.appendChild(li);
      }
      if (!ths.length) tl.innerHTML = '<li>Todavía no hay preguntas que sostener.</li>';
    }
    profList.innerHTML = '';
    profTitle.style.display = st.profile.length ? '' : 'none';
    for (const p of st.profile) { const li = document.createElement('li'); li.innerHTML = awake ? `${p} <span class="truth">— T. A.</span>` : p; profList.appendChild(li); }
  }

  // «Mi postura» under a theory (positions.js). Each shown question is one folded line: its button gives
  // the current stance and opens the block (the explanation, the chapter-one line about Brennan, the
  // options). One block at a time (this._openPosture). While the player is awake there is no button: the
  // line says what he thought before. In the second reading the stance is not asked: nothing is shown.
  postureHtml(st, theoryId) {
    if (st.flags.second) return '';
    const awake = !!st.flags.awake;
    const stance = st.flags.brennan_stance;
    let html = '';
    for (const [q, Q] of Object.entries(QUESTIONS)) {
      if (Q.theory !== theoryId || !Q.visible(st)) continue;
      const cur = readPosition(st, q);
      const label = (v) => Q.options.find(([o]) => o === v)?.[1] ?? '';
      const said = q === 'br_suspect' && BRENNAN_STANCE_LABEL[stance] ? `<span class="ev">En el cap. I dije: ${BRENNAN_STANCE_LABEL[stance]}</span>` : '';
      if (awake) {
        html += `<div class="posture">${said}<span class="ev">${cur ? `(antes de saberlo): ${label(cur)}` : 'Sin postura'}</span></div>`;
        continue;
      }
      const open = this._openPosture === q;
      html += `<div class="posture"><button type="button" class="ptoggle" aria-expanded="${open}" data-toggle="${q}">Mi postura: ${cur ? label(cur) : 'sin postura'} ${open ? '▾' : '▸'}</button>`;
      if (open) {
        const opts = Q.options.map(([v, text]) => `<button type="button" data-q="${q}" data-v="${v}" aria-pressed="${v === cur}">${text}</button>`).join('');
        html += `<span class="ps">Estado de pruebas: lo que permiten las pruebas reunidas. Mi postura: lo que creo ahora; puedo cambiarla.</span>${said}<span class="pbtns">${opts}</span>`;
      }
      html += '</div>';
    }
    return html;
  }

  notebookTab(tab) {
    this._tab = tab;
    for (const b of document.querySelectorAll ? document.querySelectorAll('#nb-tabs button') : []) b.classList.toggle('on', b.dataset.tab === tab);
    for (const d of document.querySelectorAll ? document.querySelectorAll('#notebook .tab') : []) d.classList.toggle('hidden', d.dataset.tab !== tab);
  }

  // "What now?": first a nudge, then (asked again with nothing changed) the answer
  hint() {
    const text = this.game.hint();
    audio.paper();
    // the answer may have closed the notebook to mark what can be touched: then it is shown as a notice
    if (!this.notebookOpen) { this.toast(text, 6000, true); return; }
    const fb = this.el.nbFeedback;
    fb.className = 'help'; fb.style.color = '';
    fb.textContent = text;
  }

  async pickClue(id) {
    audio.pen();
    const sel = this.selectedClues;
    if (sel.includes(id)) sel.splice(sel.indexOf(id), 1);
    else sel.push(id);
    this.el.nbFeedback.textContent = '';
    if (sel.length === 2) {
      const before = this.game.state.deductions.length;
      const res = this.game.tryDeduce(sel[0], sel[1]);
      if (res) {
        this.selectedClues = [];
        this._inkFrom = before;
        this.el.nbFeedback.className = 'ok';
        this.el.nbFeedback.style.color = '';
        this.el.nbFeedback.textContent = res.text;
        audio.sting(0.12); audio.paper();
      } else {
        // the two clues shake, then let go
        this.el.nbFeedback.className = '';
        this.el.nbFeedback.style.color = '';
        this.el.nbFeedback.textContent = 'No encajan. O no todavía.';
        this.renderNotebook();
        for (const li of this.el.clueList.querySelectorAll('li.sel')) li.classList.add('nope');
        await wait(420);
        this.selectedClues = [];
      }
    }
    this.renderNotebook();
  }

  // ------------------------------------------------------------ the séance raps
  // raps: [[row, col], ...] as knocked; board: whether Thomas has seen the board that reads them.
  // help: how much has gone wrong before (0, 1, 2, 3+): the page says more each time, and from the
  // third miss Wexley can be asked to read the first letters. Nobody is left guessing.
  // Resolves { ok, misses } — ok when the word is spelt, false if he leaves it for later.
  async knockPuzzle({ raps, answer, board, rows, help = 0, helper = null }) {
    if (window.FAST) {
      (window.LOG ||= []).push(`[golpes: ${board ? answer : 'sin tabla'}, ayuda ${help}]`);
      return { ok: !!board && !window.KNOCK_FAIL, misses: window.KNOCK_FAIL ? 1 : 0 };
    }
    const box = document.createElement('div');
    box.id = 'knocks';
    const dots = (n) => '•'.repeat(n);
    const hint = () => [
      'Cada letra son dos grupos de golpes.',
      'El primer grupo es la fila de la tabla; el segundo, la columna.',
      `La primera letra: ${raps[0][0]} golpes y ${raps[0][1]} golpes. Fila ${raps[0][0]}, columna ${raps[0][1]}: ${rows[raps[0][0] - 1][raps[0][1] - 1]}.`,
    ][Math.min(2, help)];
    box.innerHTML = `<div class="doc-paper"><h3>Los golpes</h3>
      <p class="small">Los apunté tal como sonaban: un grupo, una pausa, otro grupo.</p>
      <div class="raps">${raps.map(([r, c]) => `<span>${dots(r)}&ensp;${dots(c)}</span>`).join('<i>|</i>')}</div>
      ${board ? `<div class="grid"><b></b>${[1, 2, 3, 4, 5].map((c) => `<b>${c}</b>`).join('')}
        ${rows.map((row, r) => `<b>${r + 1}</b>${[...row].map((ch) => `<button data-ch="${ch}">${ch}</button>`).join('')}`).join('')}</div>`
    : '<p class="nogrid">No sé leerlos. En la pared, bajo la carta astral, había una tabla de letras: quizá sea la clave.</p>'}
      <p class="khelp">${board ? hint() : ''}</p>
      <div class="word"></div>
      <div class="row">${board ? '<button class="close erase">Borrar</button>' : ''}${board && helper && help >= 2 ? '<button class="close ask">Pedir ayuda a Wexley</button>' : ''}<button class="close leave">Dejarlo</button></div></div>`;
    document.getElementById('ui').appendChild(box);
    const word = box.querySelector('.word'), khelp = box.querySelector('.khelp');
    let typed = '', misses = 0, given = '';
    const result = await new Promise((resolve) => {
      let over = false;
      const done = (v) => { if (over) return; over = true; this._knockClose = null; resolve(v); };
      // Back and Escape leave the puzzle as «Dejarlo» does (UX audit b69323b, UX-B01)
      this._knockClose = () => { audio.click(); done(false); };
      box.querySelector('.leave').addEventListener('click', () => { audio.click(); done(false); });
      box.querySelector('.erase')?.addEventListener('click', () => { typed = given; word.textContent = typed; audio.click(); });
      box.querySelector('.ask')?.addEventListener('click', async (e) => {
        e.target.disabled = true;
        given = await helper();   // she reads the first letters aloud
        typed = given; word.textContent = typed;
        khelp.textContent = 'Wexley ha leído las primeras. El resto, igual: fila y columna.';
      });
      for (const b of box.querySelectorAll('.grid button')) {
        b.addEventListener('click', async () => {
          if (typed.length >= answer.length) return;
          typed += b.dataset.ch; word.textContent = typed; audio.tick();
          if (typed.length < answer.length) return;
          if (typed === answer) { audio.sting(0.2); await wait(900); done(true); return; }
          misses++; help++;
          word.classList.remove('nope'); void word.offsetWidth; word.classList.add('nope');
          khelp.textContent = hint();
          await wait(700); typed = given; word.textContent = typed;
          if (helper && help >= 2 && !box.querySelector('.ask')) {
            const ask = document.createElement('button'); ask.className = 'close ask'; ask.textContent = 'Pedir ayuda a Wexley';
            ask.addEventListener('click', async () => { ask.disabled = true; given = await helper(); typed = given; word.textContent = typed; khelp.textContent = 'Wexley ha leído las primeras. El resto, igual: fila y columna.'; });
            box.querySelector('.row').insertBefore(ask, box.querySelector('.leave'));
          }
        });
      }
    });
    this._knockClose = null;
    box.remove();
    return { ok: result, misses };
  }

  // ------------------------------------------------------------ name entry (the ending)
  // The signature page of the notebook. The player writes what they like and confirms; with `morph`,
  // what they wrote then turns, one stroke at a time, into that word (an empty line too).
  async nameEntry(prompt, morph = null, initial = '') {
    if (window.FAST) { (window.LOG ||= []).push(`[firma: ${morph || initial}]`); return morph || initial; }
    const { nameEntry, namePrompt, nameInput, nameOk } = this.el;
    namePrompt.textContent = prompt;
    nameInput.value = initial;
    nameInput.readOnly = false;
    nameEntry.classList.remove('hidden');
    let finish;
    const p = new Promise((r) => { finish = r; });
    const onKey = (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); finish(); } };
    const onInput = () => audio.pen();
    nameInput.addEventListener('keydown', onKey);
    nameInput.addEventListener('input', onInput);
    nameOk.addEventListener('click', finish);
    // with the phone's keyboard up, the signature goes to the middle of what is still visible
    const vv = window.visualViewport;
    const place = () => {
      if (!vv) return;
      const s = document.getElementById('stage').getBoundingClientRect();
      const covered = vv.height < Math.min(window.innerHeight, s.bottom) * 0.85;
      nameEntry.style.top = covered ? `${Math.max(8, vv.offsetTop + vv.height * 0.45 - s.top)}px` : '';
    };
    vv?.addEventListener('resize', place);
    vv?.addEventListener('scroll', place);
    setTimeout(() => { nameInput.focus(); nameInput.setSelectionRange(nameInput.value.length, nameInput.value.length); }, 100);
    await p;
    vv?.removeEventListener('resize', place);
    vv?.removeEventListener('scroll', place);
    nameInput.removeEventListener('keydown', onKey);
    nameInput.removeEventListener('input', onInput);
    nameOk.removeEventListener('click', finish);
    nameInput.readOnly = true;
    nameInput.blur();
    let text = nameInput.value;
    if (morph) {
      // slowly: the hand finishes the strokes itself (the phone's keyboard has time to go away first)
      await wait(700);
      const frames = morphFrames(text, morph), wearDown = frames.length - [...morph].length;
      for (let i = 0; i < frames.length; i++) {
        nameInput.value = frames[i];
        audio.pen();
        await wait(i < wearDown ? 140 : 520);
      }
      text = morph;
      await wait(1400);
    } else await wait(300);
    nameEntry.classList.add('hidden');
    nameEntry.style.top = '';
    window.dispatchEvent?.(new Event('resize'));   // a resize held back while typing is applied now (fitStage)
    return text;
  }

  menu(items) {
    const box = this.el.menuButtons;
    box.innerHTML = '';
    for (const it of items) {
      const b = document.createElement('button');
      b.className = 'menu-btn';
      b.textContent = it.label;
      b.disabled = !!it.disabled;
      b.addEventListener('click', () => { audio.init(); audio.click(); it.action(); });
      box.appendChild(b);
    }
    this.el.menu.classList.remove('hidden');
  }

  hideMenu() { this.el.menu.classList.add('hidden'); }
}

// The close-up lit per pixel by a lantern at (lx, ly): a height field from the painting's lightness
// (gaps and wounds sink, cloth and skin stand), its slopes as normals, each pixel lit by how it
// faces the lamp held a little above the picture, with a warm falloff and wet things glinting.
function makeRelight(ic, lo) {
  const w = lo.width, h = lo.height, n = w * h;
  const src = lo.getContext('2d').getImageData(0, 0, w, h).data;
  const H = new Float32Array(n), T = new Float32Array(n);
  for (let i = 0; i < n; i++) H[i] = (src[i * 4] * 0.3 + src[i * 4 + 1] * 0.59 + src[i * 4 + 2] * 0.11) / 255;
  for (let pass = 0; pass < 2; pass++) {          // soften it a little so the dither does not sparkle
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      T[i] = (H[i] * 2 + H[y * w + Math.max(0, x - 1)] + H[y * w + Math.min(w - 1, x + 1)]) / 4;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      H[i] = (T[i] * 2 + T[Math.max(0, y - 1) * w + x] + T[Math.min(h - 1, y + 1) * w + x]) / 4;
    }
  }
  const NX = new Float32Array(n), NY = new Float32Array(n), NZ = new Float32Array(n), wet = new Uint8Array(n);
  const S = 7;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const nx = (H[y * w + Math.max(0, x - 1)] - H[y * w + Math.min(w - 1, x + 1)]) * S;
    const ny = (H[Math.max(0, y - 1) * w + x] - H[Math.min(h - 1, y + 1) * w + x]) * S;
    const l = Math.sqrt(nx * nx + ny * ny + 1);
    NX[i] = nx / l; NY[i] = ny / l; NZ[i] = 1 / l;
    const r = src[i * 4], g = src[i * 4 + 1], b = src[i * 4 + 2];
    wet[i] = r > g * 2.2 && r > b * 1.7 && r > 16 ? 1 : 0;
  }
  const out = ic.createImageData(w, h), o = out.data;
  // the ambient lifts darker images more (a painted close-up is already lit dimly), so the shape of
  // the body always shows outside the lantern
  let luma = 0;
  for (let i = 0; i < n; i += 7) luma += src[i * 4] * 0.3 + src[i * 4 + 1] * 0.55 + src[i * 4 + 2] * 0.15;
  luma /= Math.ceil(n / 7);
  const AMB = Math.min(0.22, 0.07 * Math.max(1, 60 / Math.max(1, luma))), R0 = 128, Z = 34;
  // one pixel in the dark: only the ambient reaches it
  const dark = (j) => {
    o[j] = src[j] * AMB * 1.08; o[j + 1] = src[j + 1] * AMB * 0.94; o[j + 2] = src[j + 2] * (AMB * 0.8 + 0.02); o[j + 3] = 255;
  };
  for (let i = 0; i < n; i++) dark(i * 4);
  ic.putImageData(out, 0, 0);
  let last = '', prev = null;
  return (lx, ly, fl) => {
    // the flame's flicker is felt at a few steps, so a still light is not recomputed every frame
    const key = `${Math.round(lx)},${Math.round(ly)},${Math.round(fl * 60)}`;
    if (key === last) return;
    last = key;
    const R = R0 * fl;
    // only the circle the light reaches now, and the one it reached before, need painting
    const cur = [Math.max(0, Math.floor(lx - R - 1)), Math.max(0, Math.floor(ly - R - 1)), Math.min(w, Math.ceil(lx + R + 1)), Math.min(h, Math.ceil(ly + R + 1))];
    const box = prev ? [Math.min(cur[0], prev[0]), Math.min(cur[1], prev[1]), Math.max(cur[2], prev[2]), Math.max(cur[3], prev[3])] : cur;
    prev = cur;
    if (box[2] <= box[0] || box[3] <= box[1]) return;
    for (let y = box[1]; y < box[3]; y++) for (let x = box[0]; x < box[2]; x++) {
      const i = y * w + x, j = i * 4;
      const dx = lx - x, dy = ly - y, d2 = dx * dx + dy * dy;
      if (d2 >= R * R) { dark(j); continue; }
      let k = AMB, sp = 0;
      const att = (1 - Math.sqrt(d2) / R) ** 1.6;
      const l = Math.sqrt(d2 + Z * Z), ux = dx / l, uy = dy / l, uz = Z / l;
      const lam = Math.max(0, NX[i] * ux + NY[i] * uy + NZ[i] * uz);
      k += att * (0.35 + lam * 1.45);
      if (wet[i]) {
        const hz = uz + 1, hl = Math.sqrt(ux * ux + uy * uy + hz * hz);
        sp = att * Math.max(0, (NX[i] * ux + NY[i] * uy + NZ[i] * hz) / hl) ** 30 * 255;
      }
      // the lantern is warm; the dark around it a little cold
      o[j] = Math.min(255, src[j] * k * 1.08 + sp);
      o[j + 1] = Math.min(255, src[j + 1] * k * 0.94 + sp * 0.85);
      o[j + 2] = Math.min(255, src[j + 2] * (k * 0.8 + 0.02) + sp * 0.7);
      o[j + 3] = 255;
    }
    ic.putImageData(out, 0, 0, box[0], box[1], box[2] - box[0], box[3] - box[1]);
  };
}
