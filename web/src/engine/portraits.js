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

// what exists: embedded in the single-file build, or listed by assets/portraits/index.json
function known() {
  if (index) return index;
  index = {};
  const emb = typeof window !== 'undefined' && window.__PORTRAITS;
  if (emb) return Object.assign(index, emb);
  fetch('assets/portraits/index.json')
    .then((r) => (r.ok ? r.json() : {}))
    .then((j) => { for (const [id, vs] of Object.entries(j)) index[id] = Object.fromEntries(vs.map((v) => [v, `assets/portraits/${id}_${v}.png`])); })
    .catch(() => {});
  return index;
}

export function portraitFor(name) {
  if (typeof Image === 'undefined' || typeof fetch === 'undefined') return null;
  const id = IDS[name], src = id && known()[id];
  if (!src?.base) return null;
  if (!loaded[id]) {
    const p = (loaded[id] = {});
    for (const [v, url] of Object.entries(src)) { const im = new Image(); im.onload = () => { p[v] = im; }; im.src = url; }
  }
  return loaded[id].base ? loaded[id] : null;
}
