// The scene without a mouse (QA-V5-004). The hotspots of the scene stand in a hidden list of real buttons,
// ordered from left to right: Tab or the left/right arrows move through them, Enter (or Space) acts exactly as a
// click on the thing does (the same walk, the same item in hand), Shift+Enter looks. The focused one is named on
// the stage with its verb, ringed when it is in view and pointed at with an arrow when it is not.
// Only Enter acts. Space keeps its meaning (reveal the points of interest) even with a point in focus, and what the list
// itself has just focused ignores a press for a moment: the Enter or Space that advanced the last line of a conversation
// must never also act on the thing the focus lands on afterwards.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class KbSpots {
  constructor(game) {
    this.g = game;
    this.box = document.getElementById('kb-spots');
    this.ring = document.getElementById('kb-ring');
    this.list = [];            // the hotspots now offered, left to right
    this.sig = '';
    this.id = null;            // the one in focus (or the last one that was, to come back to it)
    this.kbMode = false;       // the last thing the player touched was the keyboard
    this.focused = false;
    this._camX = null;
    this._focusAt = 0;
    this._space = false;
    if (!this.box) return;
    this.box.addEventListener('focusin', (e) => { const b = e.target.closest?.('button'); if (b) this.focus(b.dataset.id); });
    this.box.addEventListener('keydown', (e) => {
      // a held Enter or Space (key repeat) never acts: only a deliberate press does
      if (e.repeat && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); return; }
      if (e.key === ' ') { e.preventDefault(); this._space = true; this.g.reveal(); }
    });
    // the Space that was pressed on a point is over whenever it is released, wherever the focus has gone since
    window.addEventListener('keyup', (e) => { if (e.key === ' ') setTimeout(() => { this._space = false; }, 0); }, true);
    window.addEventListener('blur', () => { this._space = false; });
    this.box.addEventListener('focusout', (e) => { if (!this.box.contains(e.relatedTarget)) this.clear(); });
    this.box.addEventListener('click', (e) => {
      // Space on a button clicks it on key-up: here Space reveals instead; and a press right after the focus came back is ignored
      if (this._space || performance.now() - this._focusAt < 450) return;
      const b = e.target.closest?.('button');
      const h = b && this.list.find((x) => x.id === b.dataset.id);
      if (h) this.g.onClick(null, !!e.shiftKey, h);
    });
    window.addEventListener('keydown', (e) => {
      if (['Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) this.kbMode = true;   // Enter and Space also advance dialogue: they say nothing about where the focus belongs
      if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target;
      if (t && t !== document.body && !this.box.contains(t) && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (this.box.classList.contains('hidden') || !this.list.length) return;
      e.preventDefault();
      this.step(e.key === 'ArrowRight' ? 1 : -1);
    });
    // a pointer takes over from the keyboard: the ring and the label go, and the focus with them
    const leave = () => { this.kbMode = false; if (this.focused) { this.clear(); const a = document.activeElement; if (a && this.box.contains(a)) a.blur(); } };
    window.addEventListener('pointerdown', leave, true);
    window.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch' && (e.movementX || e.movementY)) leave(); }, true);
  }

  nameOf(h) { return typeof h.name === 'function' ? h.name(this.g.G) : h.name; }

  // the player can reach the scene now: nothing is open over it and no script is running
  available() {
    const g = this.g, ui = g.ui;
    return !!g.scene && !g.inMenu && !g.running && !g.paused && !ui.notebookOpen && !ui.inventoryOpen
      && !ui._docClose && !ui._advance && !ui._choiceKeys && !ui._inspectClose && !ui._knockClose && !ui._talkCancel
      && !g.scene.noPlayer && document.getElementById('name-entry')?.classList.contains('hidden') !== false;
  }

  // once per frame: keep the list in step with the scene (it changes with what has happened)
  sync() {
    if (!this.box) return;
    if (!this.available()) {
      if (!this.box.classList.contains('hidden')) { this.box.classList.add('hidden'); this.clear(); }
      this.sig = '';
      return;
    }
    const g = this.g;
    const cx = (h) => { const [x, , w] = typeof h.rect === 'function' ? h.rect(g.G) : h.rect; return x + w / 2; };
    const list = g.activeHotspots().slice().sort((a, b) => cx(a) - cx(b));
    const sig = `${g.scene.id}|${g.selectedItem || ''}|` + list.map((h) => `${h.id}:${this.nameOf(h)}:${g.verbFor(h)}`).join(';');
    const wasHidden = this.box.classList.contains('hidden');
    if (sig !== this.sig || wasHidden) {
      this.sig = sig;
      this.list = list;
      this._camX = null;
      const had = this.box.contains(document.activeElement) ? this.id : null;
      this.box.classList.remove('hidden');
      this.box.innerHTML = list.map((h) => `<button type="button" data-id="${esc(h.id)}">${esc(g.verbFor(h))}: ${esc(this.nameOf(h))}</button>`).join('');
      // a script has just ended or the scene changed and the player was using the keyboard: put the focus back
      const want = had || (this.kbMode && (document.activeElement === document.body || !document.activeElement) ? (list.some((h) => h.id === this.id) ? this.id : list[0]?.id) : null);
      const b = want && [...this.box.children].find((x) => x.dataset.id === want);
      if (b) { this._focusAt = performance.now(); b.focus({ preventScroll: true }); }
    }
    if (this.focused) this.place();
  }

  step(dir) {
    const btns = [...this.box.children];
    if (!btns.length) return;
    const at = btns.findIndex((b) => b === document.activeElement);
    let i;
    if (at < 0) {
      // from nowhere: the nearest one in that direction from where Thomas stands
      const px = this.g.player.x;
      const ix = this.list.findIndex((h) => { const [x, , w] = typeof h.rect === 'function' ? h.rect(this.g.G) : h.rect; return dir > 0 ? x + w / 2 >= px : x + w / 2 > px; });
      i = dir > 0 ? (ix < 0 ? 0 : ix) : (ix < 0 ? btns.length - 1 : Math.max(0, ix - 1));
    } else i = (at + dir + btns.length) % btns.length;
    btns[i].focus({ preventScroll: true });
  }

  focus(id) {
    this.id = id;
    this.focused = true;
    this._camX = null;
    this.place();
  }

  clear() {
    if (!this.focused && this.ring.classList.contains('hidden')) return;
    this.focused = false;
    this.ring.classList.add('hidden');
    this.g.ui.hover(null);
  }

  // the name over the thing, a ring round it; both follow the camera
  place() {
    const g = this.g, h = this.list.find((x) => x.id === this.id);
    if (!h) { this.clear(); return; }
    const cam = g.r.cam.x;
    if (this._camX !== null && Math.abs(cam - this._camX) < 0.5) return;
    this._camX = cam;
    const [x, y, w, hh] = typeof h.rect === 'function' ? h.rect(g.G) : h.rect;
    const cx = x + w / 2 - cam;
    const exit = h.cursor === 'exit';
    const off = cx < 40 ? -1 : cx > 1240 ? 1 : 0;
    g.ui.hover(this.nameOf(h), Math.max(40, Math.min(1240, cx)), Math.max(130, Math.min(640, y + Math.min(hh, 30))), g.verbFor(h), g.selectedItem ? 'item' : exit ? 'exit' : '', off || (exit ? g.exitDir(h) : 0));
    const r = this.ring;
    if (off) { r.classList.add('hidden'); return; }
    const pad = 8, top = Math.max(0, y - pad), bottom = Math.min(712, y + hh + pad);
    r.style.left = `calc(${Math.max(0, x - cam - pad)} * var(--u))`;
    r.style.top = `calc(${top} * var(--u))`;
    r.style.width = `calc(${Math.max(24, w + 2 * pad)} * var(--u))`;
    r.style.height = `calc(${Math.max(24, bottom - top)} * var(--u))`;
    r.classList.remove('hidden');
  }
}
