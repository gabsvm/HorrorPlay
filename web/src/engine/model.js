// Figures modelled in Blender (tools/blender) and rendered to two atlases: the flat colour, and the
// camera-space normals (blue marks the lantern glass). Actor draws a frame of the colour atlas through
// its usual sprite pass and lights it with the normals instead of guessing the relief.
const models = {};

export function loadModel(name) {
  let m = models[name];
  if (m && !m.released) return m;
  m ||= models[name] = { name, ready: false };
  m.released = false;
  if (typeof Image === 'undefined' || typeof document === 'undefined') return m;
  const emb = (typeof window !== 'undefined' && window.__MODELS?.[name]) || null;
  const base = `assets/models/${name}/`;
  const img = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const gen = (m.gen = (m.gen || 0) + 1);
  Promise.all([
    emb ? Promise.resolve(emb.meta) : fetch(base + 'model.json').then((r) => r.json()),
    img(emb ? emb.albedo : base + 'albedo.png'),
    img(emb ? emb.normal : base + 'normal.png'),
  ]).then(([meta, albedo, normal]) => {
    if (m.gen !== gen || m.released) return;      // let go of while it was loading
    // the normals are read on the CPU, once, when a sprite is shaded
    const c = document.createElement('canvas');
    c.width = normal.width; c.height = normal.height;
    const cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(normal, 0, 0);
    Object.assign(m, { meta, albedo, nData: cx.getImageData(0, 0, c.width, c.height).data, nW: c.width, ready: true });
  }).catch(() => {});
  return m;
}

// A decoded cast takes tens of megabytes: when a scene starts, let go of every model nobody in it
// uses. Whoever needs one again (an actor added later, a corpse) loads it back through loadModel.
export function releaseModels(inUse) {
  for (const m of Object.values(models)) {
    if (inUse.has(m) || m.released) continue;
    Object.assign(m, { released: true, ready: false, albedo: null, nData: null });
  }
}

// Who is played by which model (tools/blender/cast.py). The constables share one figure; actors
// not listed stay painted. The victims are looked up by their corpse key.
// ?procedural paints everyone, for comparison.
const CAST = {
  Thomas: 'thomas', Pike: 'pike', Greaves: 'greaves', Wexley: 'wexley', Viuda: 'viuda', Joven: 'joven',
  Brennan: 'brennan', Wren: 'wren', Neil: 'constable', Long: 'constable', Poli0: 'constable', Poli1: 'constable',
  Poli2: 'constable', Watkins: 'city', Agente: 'city', Morris: 'morris', Chico: 'chico', Amelia: 'amelia',
  polly: 'polly', annie: 'annie', kate: 'kate',
  // the mob at the knackers' yard: nine neighbours, six figures
  Vecino0: 'vecino_cap', Vecino1: 'vecino_bowler', Vecino2: 'vecino_bare', Vecino3: 'vecina_shawl', Vecino4: 'vecino_cap',
  Vecino5: 'vecino_bowler', Vecino6: 'vecino_cap', Vecino7: 'vecina_bonnet', Vecino8: 'vecino_big',
};
const painted = typeof location !== 'undefined' && /[?&]procedural\b/.test(location.search || '');

export function modelFor(name) {
  return !painted && CAST[name] ? loadModel(CAST[name]) : null;
}
