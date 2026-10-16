// Scenery props modelled in Blender (tools/blender/props.py): flat-colour sprites that the painters
// in build.js and the scenes draw in place of their own shapes when they are loaded. Scenes are built
// once, so the game waits for them (briefly) before building the first one.
const props = {};
let ready = null;

export function loadProps() {
  if (ready) return ready;
  if (typeof Image === 'undefined' || typeof fetch === 'undefined') return (ready = Promise.resolve());
  const take = (name, m, url) => new Promise((res) => {
    const im = new Image();
    im.onload = () => { props[name] = { ...m, img: im }; res(); };
    im.onerror = () => res();
    im.src = url;
  });
  const emb = typeof window !== 'undefined' && window.__PROPS;
  ready = emb
    ? Promise.all(Object.entries(emb).map(([n, p]) => take(n, p.meta, p.src)))
    : fetch('assets/props/index.json').then((r) => (r.ok ? r.json() : {}))
      .then((j) => Promise.all(Object.entries(j).map(([n, m]) => take(n, m, `assets/props/${n}.png`))))
      .catch(() => {});
  return ready;
}

export const hasProp = (name) => !!props[name];

// The loaded sprite (image plus anchor), or null when it is missing: for painters that
// post-process a prop before drawing it themselves (a per-instance tint).
export const propSprite = (name) => props[name] || null;
// Draw prop `name` with its origin at (x, y); flip mirrors it round x, sx/sy stretch it (a desk of
// another length), rot turns it round its origin (a wheel). Returns false when there is no such
// sprite, so the caller paints its own.
export function drawProp(ctx, name, x, y, { flip = false, sx = 1, sy = 1, rot = 0 } = {}) {
  const p = props[name];
  if (!p) return false;
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(flip ? -sx : sx, sy);
  ctx.drawImage(p.img, -p.ax, -p.ay);
  ctx.restore();
  return true;
}

// Draw prop `name` stretched into the box (x, y, w, h), its render margin left out: for painters
// that take a box rather than a point (barrels of every size).
const MARGIN = 4;
export function drawPropIn(ctx, name, x, y, w, h) {
  const p = props[name];
  if (!p) return false;
  ctx.drawImage(p.img, MARGIN, MARGIN, p.w - MARGIN * 2, p.h - MARGIN * 2, x, y, w, h);
  return true;
}
