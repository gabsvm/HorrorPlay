// Painted dialogue portraits (PORTRAITS.md, prepared by tools/portraits.py): a base painting, the
// same with the mouth open and with the eyes closed. Actor.drawPortrait uses them when they exist and
// paints the bust itself when they do not.
const IDS = {
  Thomas: 'thomas', Pike: 'pike', Greaves: 'greaves', Wexley: 'wexley', Brennan: 'brennan', Wren: 'wren',
  Watkins: 'watkins', Neil: 'neil', Long: 'long', Morris: 'morris', Chico: 'chico', Joven: 'joven',
  Viuda: 'viuda', Amelia: 'richardson',
};
let index = null;
const loaded = {};

// what exists: embedded in the single-file build, or listed by assets/portraits/index.json; all of
// it is decoded straight away, so nobody's first line shows the painted-by-code bust instead
function known() {
  if (index) return index;
  index = {};
  const emb = typeof window !== 'undefined' && window.__PORTRAITS;
  if (emb) { Object.assign(index, emb); preload(); return index; }
  fetch('assets/portraits/index.json')
    .then((r) => (r.ok ? r.json() : {}))
    .then((j) => {
      for (const [id, vs] of Object.entries(j)) index[id] = Object.fromEntries(vs.map((v) => [v, `assets/portraits/${id}_${v}.png`]));
      preload();
    })
    .catch(() => {});
  return index;
}

function preload() {
  for (const [id, src] of Object.entries(index)) {
    if (loaded[id]) continue;
    const p = (loaded[id] = {});
    for (const [v, url] of Object.entries(src)) { const im = new Image(); im.onload = () => { p[v] = im; }; im.src = url; }
  }
}

export function loadPortraits() {
  if (typeof Image !== 'undefined' && typeof fetch !== 'undefined') known();
}

export function portraitFor(name) {
  if (typeof Image === 'undefined' || typeof fetch === 'undefined') return null;
  const id = IDS[name];
  return id && known()[id] && loaded[id]?.base ? loaded[id] : null;
}
