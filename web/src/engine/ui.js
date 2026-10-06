// DOM user interface: dialogue, choices, documents, notebook, inventory, cards.
import { audio } from './audio.js';
import { pixelize } from '../art/pixel.js';

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
    const speed = style === 'voice' ? 55 : 22;
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
