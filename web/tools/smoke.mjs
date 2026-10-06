// Headless smoke test: paints every scene and renders frames against a strict canvas/WebGL mock.
// It catches the errors that blank the screen in the browser (bad gradient radii, undefined
// variables, non-finite coordinates) without opening the game.
//   node web/tools/smoke.mjs
import { performance } from 'node:perf_hooks';

const problems = [];
const finite = (name, args) => {
  for (const a of args) if (typeof a === 'number' && !Number.isFinite(a)) { problems.push(`${name}(${args.join(', ')}) recibe un valor no finito`); return; }
};

function gradient(kind, args) {
  finite(kind, args);
  if (kind === 'createRadialGradient' && (args[2] < 0 || args[5] < 0)) throw new Error(`${kind}: radio negativo (${args.join(', ')})`);
  return { addColorStop(o, c) { if (!(o >= 0 && o <= 1)) throw new Error(`addColorStop offset fuera de rango: ${o}`); if (typeof c !== 'string') throw new Error('addColorStop sin color'); } };
}

function ctx2d(canvas) {
  let a = 1;
  const stack = [];
  const target = {
    canvas,
    globalAlpha: 1, globalCompositeOperation: 'source-over', fillStyle: '#000', strokeStyle: '#000', lineWidth: 1,
    font: '10px serif', textAlign: 'left', textBaseline: 'alphabetic', filter: 'none', imageSmoothingEnabled: true,
    shadowColor: '', shadowBlur: 0, lineCap: 'butt', lineJoin: 'miter',
    save() { stack.push(a); }, restore() { a = stack.pop() ?? 1; },
    setTransform(m0) { finite('setTransform', [...arguments]); a = typeof m0 === 'number' ? m0 : 1; },
    resetTransform() { a = 1; },
    getTransform() { return { a, b: 0, c: 0, d: a, e: 0, f: 0 }; },
    scale(x) { finite('scale', [...arguments]); a *= x; },
    translate() { finite('translate', [...arguments]); }, rotate() { finite('rotate', [...arguments]); },
    createLinearGradient(...g) { return gradient('createLinearGradient', g); },
    createRadialGradient(...g) { return gradient('createRadialGradient', g); },
    createPattern() { return {}; },
    measureText(t) { return { width: String(t).length * 8 }; },
    getImageData(x, y, w, h) { w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h)); return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4).fill(128) }; },
    createImageData(w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; },
    putImageData() {},
    drawImage(img, ...r) { if (!img || !(img.width >= 0)) throw new Error('drawImage sin imagen válida'); finite('drawImage', r); },
    ellipse(...e) { finite('ellipse', e); if (e[2] < 0 || e[3] < 0) throw new Error(`ellipse: radio negativo (${e.join(', ')})`); },
    arc(...e) { finite('arc', e); if (e[2] < 0) throw new Error(`arc: radio negativo (${e.join(', ')})`); },
  };
  for (const fn of ['beginPath', 'closePath', 'moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo', 'rect', 'fill', 'stroke', 'clip', 'fillRect', 'strokeRect', 'clearRect', 'fillText', 'strokeText', 'setLineDash', 'roundRect']) {
    target[fn] = (...args) => finite(fn, args.filter((v) => typeof v === 'number'));
  }
  return target;
}

function glMock() {
  return new Proxy({}, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'getShaderParameter' || k === 'getProgramParameter') return () => true;
      if (k === 'getUniformLocation' || k === 'getAttribLocation') return () => 0;
      if (k === 'drawingBufferWidth') return 640;
      if (k === 'drawingBufferHeight') return 360;
      if (typeof k === 'string' && k.toUpperCase() === k) return 1;
      return () => ({});
    },
  });
}

class FakeCanvas {
  constructor() { this.width = 300; this.height = 150; this.style = {}; }
  getContext(type) { if (type === '2d') return (this._2d ||= ctx2d(this)); return (this._gl ||= glMock()); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; }
  addEventListener() {}
}

globalThis.document = {
  createElement: (tag) => (tag === 'canvas' ? new FakeCanvas() : { style: {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, addEventListener() {} }),
  getElementById: () => null,
  documentElement: { style: { setProperty() {} } },
};
globalThis.window = { devicePixelRatio: 1, innerWidth: 1280, innerHeight: 720, addEventListener() {} };
globalThis.location = { search: '' };
globalThis.performance = performance;

const { Renderer } = await import('../src/engine/renderer.js');
const { Actor } = await import('../src/engine/actor.js');
const scenesDir = new URL('../src/scenes/', import.meta.url);
const names = ['room', 'bucks_row', 'knackers', 'foreshore', 'hanbury', 'seance', 'mitre', 'goulston', 'alleys', 'greaves', 'millers'];

function fakeG(flags = {}) {
  const G = {
    state: { flags, items: [], clues: [], deductions: [], sanity: 70, clockHands: [3, 40] },
    flag: (k, v) => (v === undefined ? !!flags[k] : (flags[k] = v)),
    has: () => false, hasClue: () => false, deduced: () => false,
    actor: (n) => G.game.actors.find((a) => a.name === n),
    light: (id) => G.scene?.lights.find((l) => l.id === id),
    audio: new Proxy({}, { get: () => () => {} }),
    Actor,
    game: { actors: [] },
  };
  return G;
}

const variants = {
  room: [{}, { room_phase: 'c3a', tinta_vacia: true }, { room_phase: 'c3b' }],
  knackers: [{}, { mob: true }],
  foreshore: [{}, { fs_1888: true, ditch_glow: true, water_light: true }],
  seance: [{}, { candles_out: true, mirror_cracked: true, comb_on_table: true }],
  goulston: [{ chalk_seen: true }],
};

const view = new FakeCanvas();
const R = new Renderer(view);
let total = 0;
for (const name of names) {
  const scene = (await import(new URL(`${name}.js`, scenesDir))).default;
  for (const flags of variants[name] || [{}]) {
    const label = `${name}${Object.keys(flags).length ? ' [' + Object.keys(flags).join(',') + ']' : ''}`;
    try {
      const G = fakeG(flags);
      scene.G = G; G.scene = scene;
      const t0 = performance.now();
      const built = scene.build(R, G);
      const tb = performance.now() - t0;
      scene.layers = built.layers; scene.lights = built.lights.map((l) => ({ ...l })); scene.built = built;
      const player = new Actor('Thomas', { x: scene.spawn ?? 400, y: scene.groundY, h: scene.playerH || 206, lantern: true, lanternOn: !!scene.lantern });
      player.isPlayer = true;
      const actors = [player, ...(scene.actors ? scene.actors(G) : [])];
      G.game.actors = actors;
      G.player = player;
      scene.life = scene.makeLife ? scene.makeLife(G) : [];
      if (scene.reflection !== undefined) scene.reflection = true;
      const t1 = performance.now();
      for (let f = 0; f < 24; f++) {
        R.cam.x = Math.max(0, Math.min(scene.width - 1280, (scene.width - 1280) * (f / 23)));
        player.walkTo(player.x + 300);
        for (const a of actors) a.update(1 / 30);
        if (scene.update) scene.update(G, 1 / 30);
        for (const l of scene.life) if (l.update) l.update(0.5, G);
        R.frame(scene, actors, 1 / 30);
      }
      const tf = (performance.now() - t1) / 24;
      total += tb;
      console.log(`ok   ${label.padEnd(40)} build ${tb.toFixed(0).padStart(5)} ms   frame ${tf.toFixed(1).padStart(5)} ms`);
    } catch (e) {
      problems.push(`${label}: ${e.stack.split('\n').slice(0, 3).join(' | ')}`);
      console.log(`FAIL ${label}: ${e.message}`);
    }
  }
}
console.log(`\nbuild total ${total.toFixed(0)} ms`);
if (problems.length) {
  console.log(`\n${problems.length} problema(s):`);
  for (const p of [...new Set(problems)].slice(0, 30)) console.log(' - ' + p);
  process.exit(1);
}
console.log('Sin problemas.');
