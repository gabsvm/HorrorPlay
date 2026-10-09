// Painted close-ups of the crime scenes (CLOSEUPS.md, prepared by tools/closeups.py). paintBody uses
// one when it exists and paints the body itself when it does not; the lantern relight works on either.
let index = null;
const loaded = {};

export function loadCloseups() {
  if (index || typeof Image === 'undefined' || typeof fetch === 'undefined') return;
  index = {};
  const take = (kind, url) => { const im = new Image(); im.onload = () => { loaded[kind] = im; }; im.src = url; };
  const emb = typeof window !== 'undefined' && window.__CLOSEUPS;
  if (emb) { for (const [k, url] of Object.entries(emb)) take(k, url); return; }
  fetch('assets/closeups/index.json')
    .then((r) => (r.ok ? r.json() : {}))
    .then((j) => { for (const [k, f] of Object.entries(j)) take(k, `assets/closeups/${f}`); })
    .catch(() => {});
}

export function closeupFor(kind) {
  return loaded[kind] || null;
}
