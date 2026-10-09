// Figures modelled in Blender (tools/blender) and rendered to two atlases: the flat colour, and the
// camera-space normals (blue marks the lantern glass). Actor draws a frame of the colour atlas through
// its usual sprite pass and lights it with the normals instead of guessing the relief.
const models = {};

export function loadModel(name) {
  if (models[name]) return models[name];
  const m = (models[name] = { name, ready: false });
  if (typeof Image === 'undefined' || typeof document === 'undefined') return m;
  const emb = (typeof window !== 'undefined' && window.__MODELS?.[name]) || null;
  const base = `assets/models/${name}/`;
  const img = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  Promise.all([
    emb ? Promise.resolve(emb.meta) : fetch(base + 'model.json').then((r) => r.json()),
    img(emb ? emb.albedo : base + 'albedo.png'),
    img(emb ? emb.normal : base + 'normal.png'),
  ]).then(([meta, albedo, normal]) => {
    // the normals are read on the CPU, once, when a sprite is shaded
    const c = document.createElement('canvas');
    c.width = normal.width; c.height = normal.height;
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(normal, 0, 0);
    Object.assign(m, { meta, albedo, nData: cx.getImageData(0, 0, c.width, c.height).data, nW: c.width, ready: true });
  }).catch(() => {});
  return m;
}
