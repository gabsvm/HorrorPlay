// DOM user interface: dialogue, choices, documents, notebook, inventory, cards.
import { audio } from './audio.js';
import { prefs } from './prefs.js';
import { pixelize } from '../art/pixel.js';
import { Actor } from './actor.js';

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class UI {
  constructor() {
    this.el = {
      ui: $('ui'), hud: $('hud'), date: $('date'), clock: $('clock'), sanity: $('sanity-fill'),
      dlg: $('dialogue'), dlgName: $('dlg-name'), dlgText: $('dlg-text'), dlgNext: $('dlg-next'), dlgPortrait: $('dlg-portrait'),
      choices: $('choices'), toast: $('toast'), hover: $('hover-label'),
      inv: $('inventory'), nb: $('notebook'), clueList: $('clue-list'), dedList: $('deduction-list'),
      profList: $('profile-list'), profTitle: $('profile-title'), nbFeedback: $('nb-feedback'),
      doc: $('document'), docBody: $('doc-body'), card: $('card'),
      nameEntry: $('name-entry'), namePrompt: $('name-prompt'), nameInput: $('name-input'), nameOk: $('name-ok'),
      menu: $('menu'), menuButtons: $('menu-buttons'),
    };
    this._advance = null;
    this.el.dlg.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.advance(); });
    window.addEventListener('keydown', (e) => {
      if ((e.key === ' ' || e.key === 'Enter') && this._advance) { e.preventDefault(); this.advance(); }
      if (e.key === 'Escape' && this._inspectClose && !this._advance) this._inspectClose();
      if (/^[1-9]$/.test(e.key) && this._choiceKeys) { const b = this._choiceKeys[Number(e.key) - 1]; if (b) b.click(); }
    });
    $('doc-close').addEventListener('click', () => this._docClose && this._docClose());
    $('nb-close').addEventListener('click', () => this.closeNotebook());
    this.selectedClues = [];
    this.el.inv.addEventListener('pointerenter', () => { this.invHover = true; });
    this.el.inv.addEventListener('pointerleave', () => { this.invHover = false; });
    this.coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  }

  busy(on) { this.el.ui.classList.toggle('busy', on); }
  showHud(on) { this.el.hud.classList.toggle('hidden', !on); this.el.inv.classList.toggle('hidden', !on); }

  setDate(date, clock) {
    if (date != null) this.el.date.textContent = date;
    if (clock != null) this.el.clock.textContent = clock;
  }

  setSanity(v) {
    this.el.sanity.style.width = `${Math.max(0, v)}%`;
    this.el.sanity.style.background = v > 55 ? 'linear-gradient(90deg,#4f6b62,#9db3a6)' : v > 25 ? 'linear-gradient(90deg,#5f5a3c,#a69a64)' : 'linear-gradient(90deg,#5b1a14,#a2382b)';
  }

  advance() { if (this._advance) this._advance(); }

  // Typewriter dialogue. Click once to complete the line, again to continue.
  async say(name, text, { style = '', auto = 0, portrait = null } = {}) {
    if (window.FAST) { (window.LOG ||= []).push(`${name || '·'}: ${text.replace(/<[^>]+>/g, '')}`); return; }
    const { dlg, dlgName, dlgText, dlgNext } = this.el;
    const fresh = dlg.classList.contains('hidden') || this._portraitOf !== portrait;
    dlg.classList.remove('hidden');
    dlg.classList.toggle('has-portrait', !!portrait);
    dlg.classList.toggle('voice', style === 'voice');
    if (fresh) { dlg.classList.remove('enter'); void dlg.offsetWidth; dlg.classList.add('enter'); }
    this.portrait(portrait, style === 'voice' ? 'voice' : 'listen');
    dlgName.textContent = name || '';
    dlgText.className = style;
    dlgNext.style.visibility = 'hidden';
    const html = text;
    const plain = html.replace(/<[^>]+>/g, '');
    let done = false;
    let skip = false;
    this._advance = () => { skip = true; };
    const speed = (style === 'voice' ? 55 : 22) * prefs.text;
    if (!speed) skip = true;
    if (style !== 'thought' && style !== 'voice') this._portraitMode = 'talk';
    for (let i = 1; i <= plain.length && !skip; i++) {
      dlgText.textContent = plain.slice(0, i);
      const ch = plain[i - 1];
      if (i % 3 === 0 && style !== 'voice') audio.tick();
      await wait(ch === '.' || ch === '?' || ch === '!' ? speed * 7 : ch === ',' ? speed * 3 : speed);
    }
    dlgText.innerHTML = html;
    if (this._portraitMode === 'talk') this._portraitMode = 'listen';
    dlgNext.style.visibility = 'visible';
    await new Promise((res) => {
      this._advance = () => { if (!done) { done = true; res(); } };
      if (auto) setTimeout(() => this._advance && this._advance(), auto);
    });
    this._advance = null;
    audio.click();
  }

  hideDialogue() { this.el.dlg.classList.add('hidden'); this.portrait(null); }

  // The speaker's animated bust beside the text, redrawn a dozen times a second.
  portrait(actor, mode = 'listen') {
    this._portraitOf = actor;
    this._portraitMode = mode;
    if (!actor) { clearInterval(this._portraitT); this._portraitT = null; return; }
    const draw = () => {
      try { this._portraitOf.drawPortrait(this.el.dlgPortrait, performance.now() / 1000, this._portraitMode); } catch (e) { console.error(e); }
    };
    draw();
    if (!this._portraitT) this._portraitT = setInterval(() => { if (this._portraitOf) draw(); }, 80);
  }

  async choice(options, { timeout = 0, def = 0 } = {}) {
    if (window.FAST) { const k = (window.PICKS || []).length ? window.PICKS.shift() : 0; (window.LOG ||= []).push(`  > ${options[Math.min(k, options.length - 1)]}`); return Math.min(k, options.length - 1); }
    const box = this.el.choices;
    box.innerHTML = '';
    box.classList.remove('hidden');
    return new Promise((res) => {
      let timer = null;
      if (timeout) {
        const bar = document.createElement('div');
        bar.className = 'timer';
        bar.style.animationDuration = `${timeout}ms`;
        box.appendChild(bar);
        timer = setTimeout(() => { box.classList.add('hidden'); this._choiceKeys = null; res(def); }, timeout);
      }
      this._choiceKeys = options.map((opt, i) => {
        const b = document.createElement('button');
        b.className = 'choice';
        b.innerHTML = `<span class="num">${i + 1}</span>${opt}`;
        b.addEventListener('pointerdown', (e) => e.stopPropagation());
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          if (timer) clearTimeout(timer);
          audio.click();
          box.classList.add('hidden');
          this._choiceKeys = null;
          res(i);
        });
        box.appendChild(b);
        return b;
      });
    });
  }

  toast(text, ms = 2600) {
    const t = this.el.toast;
    t.textContent = text;
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
    await wait(ms);
    c.classList.remove('show');
    await wait(1400);
    c.classList.add('hidden');
  }

  // ------------------------------------------------------------ crime-scene close-up
  // A painted close-up explored in the dark: the pointer carries the lantern, and anything worth
  // examining names itself when the light falls on it. `onPoint(point)` runs the examination.
  async inspect({ title, paint, points, seen = {}, fx = null }, onPoint) {
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
        if (d > 260) continue;
        const a = Math.max(0, 1 - d / 260) * (seen[p.id] ? 0.35 : 0.8);
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
      $('insp-hint').textContent = n ? `Examinado: ${n} de ${points.length}` : this.coarse ? 'Toca para llevar la luz; toca otra vez para examinar.' : 'Mueve la luz. Haz clic en lo que quieras examinar.';
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

  // A flash of something he does not remember doing, a few frames long, twice.
  async vision(paint) {
    if (window.FAST) return;
    const v = $('vision');
    const hi = document.createElement('canvas'); hi.width = 1280; hi.height = 720;
    paint(hi.getContext('2d'), 1280, 720);
    const c = v.getContext('2d'); c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, 640, 360); c.drawImage(pixelize(hi, 0.5, { dither: 10 }), 0, 0);
    for (const ms of [90, 60, 140]) {
      v.classList.remove('hidden'); v.style.opacity = String(0.6 + Math.random() * 0.4);
      await wait(ms);
      v.classList.add('hidden');
      await wait(70 + Math.random() * 120);
    }
  }

  // ------------------------------------------------------------ inventory
  renderInventory(items, defs, selected, onSelect, newId) {
    const inv = this.el.inv;
    inv.innerHTML = '';
    for (const id of items) {
      const d = defs[id];
      const b = document.createElement('div');
      b.className = 'inv-item' + (selected === id ? ' selected' : '');
      (b.dataset ||= {}).id = id;
      if (newId === id) b.style.visibility = 'hidden';   // shown when the flying icon lands
      if (!d._pix) {
        const cv = document.createElement('canvas');
        cv.width = 96; cv.height = 96;
        d.icon(cv.getContext('2d'));
        d._pix = pixelize(cv, 0.5, { dither: 6, edge: 0.55 });
      }
      const pix = document.createElement('canvas');
      pix.width = 48; pix.height = 48;
      pix.getContext('2d').drawImage(d._pix, 0, 0);
      b.appendChild(pix);
      const label = document.createElement('span');
      label.className = 'inv-name'; label.textContent = d.name;
      b.appendChild(label);
      b.addEventListener('pointerdown', (e) => { e.stopPropagation(); audio.click(); onSelect(id); });
      inv.appendChild(b);
    }
  }

  // Tuck the satchel down to its handle when nothing needs it.
  invTuck(on) {
    if (this._tucked === on) return;
    this._tucked = on;
    this.el.inv.classList.toggle('tuck', on);
  }

  // A new item leaves the place it was found and drops into its slot.
  flyItem(def, id, from) {
    const slot = this.el.inv.querySelector(`.inv-item[data-id="${id}"]`);
    if (!slot || !def._pix) { if (slot) slot.style.visibility = ''; return; }
    const ui = this.el.ui.getBoundingClientRect();
    const u = ui.width / 1280;
    const f = document.createElement('canvas');
    f.width = 48; f.height = 48; f.className = 'fly';
    f.getContext('2d').drawImage(def._pix, 0, 0);
    const x0 = from.x * u - 34 * u, y0 = from.y * u - 34 * u;
    f.style.left = `${x0}px`; f.style.top = `${y0}px`;
    this.el.ui.appendChild(f);
    // wait for the satchel to slide up, then aim at where the slot really is
    setTimeout(() => {
      const r = slot.getBoundingClientRect();
      const dx = r.left - ui.left - x0, dy = r.top - ui.top - y0;
      const lift = -60 * u;
      const anim = f.animate([
        { transform: 'translate(0,0) scale(0.4)', opacity: 0 },
        { transform: `translate(0,${lift}px) scale(1.5)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 1 },
      ], { duration: 950, easing: 'cubic-bezier(.45,0,.25,1)' });
      anim.onfinish = () => {
        f.remove();
        slot.style.visibility = '';
        slot.classList.remove('arrive'); void slot.offsetWidth; slot.classList.add('arrive');
        audio.click();
      };
    }, 300);
  }

  // ------------------------------------------------------------ notebook
  openNotebook(game) {
    this.game = game;
    this.selectedClues = [];
    this.el.nbFeedback.textContent = '';
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
    for (const id of st.clues) {
      const c = g.clues[id];
      const li = document.createElement('li');
      li.innerHTML = `<span class="tag">${c.tag || ''}</span>${c.text}`;
      if (this.selectedClues.includes(id)) li.classList.add('sel');
      if (g.clueExhausted(id)) li.classList.add('used');
      li.addEventListener('click', () => this.pickClue(id));
      clueList.appendChild(li);
    }
    if (!st.clues.length) clueList.innerHTML = '<li>Todavía nada.</li>';
    dedList.innerHTML = '';
    const awake = !!st.flags.awake;
    st.deductions.forEach((id, i) => {
      const d = g.deductions.find((x) => x.id === id);
      const li = document.createElement('li');
      if (this._inkFrom != null && i >= this._inkFrom) li.classList.add('fresh');
      if (awake && d.truth && (d.denial || d.denialLate)) li.innerHTML = `<s>${d.text}</s><br><span class="truth">${d.truth}</span>`;
      else if (d.final) li.innerHTML = `<span class="truth">${d.text}</span>`;
      else li.textContent = d.text;
      dedList.appendChild(li);
    });
    this._inkFrom = null;
    if (!st.deductions.length) dedList.innerHTML = '<li>Ninguna todavía.</li>';
    profList.innerHTML = '';
    profTitle.style.display = st.profile.length ? '' : 'none';
    for (const p of st.profile) { const li = document.createElement('li'); li.innerHTML = awake ? `${p} <span class="truth">— T. A.</span>` : p; profList.appendChild(li); }
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

  // ------------------------------------------------------------ name entry (the ending)
  async nameEntry(prompt, forced) {
    if (window.FAST) { (window.LOG ||= []).push(`[nombre: ${forced}]`); return forced; }
    const { nameEntry, namePrompt, nameInput, nameOk } = this.el;
    namePrompt.textContent = prompt;
    nameInput.value = '';
    nameEntry.classList.remove('hidden');
    let i = 0;
    const type = () => {
      if (i < forced.length) { i++; nameInput.value = forced.slice(0, i); audio.pen(); }
    };
    const onKey = (e) => {
      e.preventDefault();
      if (e.key === 'Enter' && i >= forced.length) { finish(); return; }
      if (e.key.length === 1 || e.key === 'Backspace') type();
    };
    let finish;
    const p = new Promise((r) => { finish = r; });
    nameInput.addEventListener('keydown', onKey);
    const onBefore = (e) => { e.preventDefault(); const n = Math.max(1, (e.data || '').length); for (let k = 0; k < n; k++) type(); };
    nameInput.addEventListener('beforeinput', onBefore);
    const okHandler = () => { if (i < forced.length) { type(); return; } finish(); };
    nameOk.addEventListener('click', okHandler);
    setTimeout(() => nameInput.focus(), 100);
    await p;
    nameInput.removeEventListener('keydown', onKey);
    nameInput.removeEventListener('beforeinput', onBefore);
    nameOk.removeEventListener('click', okHandler);
    nameEntry.classList.add('hidden');
    return forced;
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
  const AMB = 0.07, R0 = 128, Z = 34;
  let last = '';
  return (lx, ly, fl) => {
    // the flame's flicker is felt at a few steps, so a still light is not recomputed every frame
    const key = `${Math.round(lx)},${Math.round(ly)},${Math.round(fl * 60)}`;
    if (key === last) return;
    last = key;
    const R = R0 * fl;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, j = i * 4;
      const dx = lx - x, dy = ly - y, d2 = dx * dx + dy * dy;
      let k = AMB, sp = 0;
      if (d2 < R * R) {
        const att = (1 - Math.sqrt(d2) / R) ** 1.6;
        const l = Math.sqrt(d2 + Z * Z), ux = dx / l, uy = dy / l, uz = Z / l;
        const lam = Math.max(0, NX[i] * ux + NY[i] * uy + NZ[i] * uz);
        k += att * (0.35 + lam * 1.45);
        if (wet[i]) {
          const hz = uz + 1, hl = Math.sqrt(ux * ux + uy * uy + hz * hz);
          sp = att * Math.max(0, (NX[i] * ux + NY[i] * uy + NZ[i] * hz) / hl) ** 30 * 255;
        }
      }
      // the lantern is warm; the dark around it a little cold
      o[j] = Math.min(255, src[j] * k * 1.08 + sp);
      o[j + 1] = Math.min(255, src[j + 1] * k * 0.94 + sp * 0.85);
      o[j + 2] = Math.min(255, src[j + 2] * (k * 0.8 + 0.02) + sp * 0.7);
      o[j + 3] = 255;
    }
    ic.putImageData(out, 0, 0);
  };
}
