// Headless full playthrough: boots the real game (engine, UI, story) against a stub DOM and
// canvas, then runs tests/walkthrough.js in fast mode. No browser needed.
//   node web/tools/walk.mjs
import { performance } from 'node:perf_hooks';

// ---- canvas / WebGL stubs (lenient: this test is about story logic, smoke.mjs checks drawing)
function ctx2d(canvas) {
  let a = 1;
  const t = {
    canvas, getTransform: () => ({ a }), setTransform(m) { a = typeof m === 'number' ? m : 1; }, scale(x) { a *= x; },
    createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }),
    measureText: (s) => ({ width: String(s).length * 8 }),
    getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }),
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
  };
  return new Proxy(t, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
}
const gl = new Proxy({}, { get: (o, k) => (k === 'getShaderParameter' || k === 'getProgramParameter' ? () => true : typeof k === 'string' && k.toUpperCase() === k ? 1 : () => ({})) });

// ---- DOM stubs
const listeners = new Map();
class El {
  constructor(id = '') { this.id = id; this.style = { setProperty() {} }; this.children = []; this.width = 300; this.height = 150; this._cls = new Set(); this.innerHTML = ''; this.textContent = ''; this.value = ''; this.disabled = false; }
  get classList() { const s = this._cls; return { add: (...c) => c.forEach((x) => s.add(x)), remove: (...c) => c.forEach((x) => s.delete(x)), toggle: (c, on) => (on ?? !s.has(c)) ? s.add(c) : s.delete(c), contains: (c) => s.has(c) }; }
  set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return [...this._cls].join(' '); }
  addEventListener(type, fn) { (this._l ||= {})[type] = fn; }
  removeEventListener() {}
  appendChild(c) { this.children.push(c); return c; }
  getContext(type) { return type === '2d' ? (this._c ||= ctx2d(this)) : gl; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; }
  focus() {}
  click() { this._l?.click?.({ stopPropagation() {}, preventDefault() {} }); }
  get offsetWidth() { return 0; }
}
const byId = new Map();
// start every element with the classes index.html gives it (several begin hidden)
const { readFileSync } = await import('node:fs');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const initialClass = new Map([...html.matchAll(/id="([^"]+)"\s+class="([^"]+)"/g)].map((m) => [m[1], m[2]]));
globalThis.document = {
  createElement: () => new El(),
  getElementById: (id) => {
    if (!byId.has(id)) { const e = new El(id); if (initialClass.has(id)) e.className = initialClass.get(id); byId.set(id, e); }
    return byId.get(id);
  },
  documentElement: { style: { setProperty() {} } },
};
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.window = globalThis;
globalThis.innerWidth = 1280; globalThis.innerHeight = 720; globalThis.devicePixelRatio = 1;
globalThis.addEventListener = (type, fn) => listeners.set(type, fn);
globalThis.requestAnimationFrame = () => 0;
globalThis.location = { search: '', href: '' };
globalThis.performance = performance;
globalThis.AudioContext = undefined;

await import('../src/main.js');
await new Promise((r) => setTimeout(r, 50)); // let the menu backdrop finish loading
const t = await import(process.argv[2] === 'alt' ? '../tests/walkthrough-alt.js' : '../tests/walkthrough.js');
const res = await t.run({ log: false });
console.log(JSON.stringify({ ok: res.ok, errors: res.errors, lines: res.lines, deductions: res.deductions, scene: res.scene }, null, 1));
if (!res.ok) {
  console.log('\nÚltimas líneas:');
  for (const l of window.LOG.slice(-12)) console.log('  ' + l);
  process.exit(1);
}
