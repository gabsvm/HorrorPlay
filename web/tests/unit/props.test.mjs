// Greaves's specimen jars (T3b + delivery C): the shelf must stay in shadow
// and must not read as clones. Five dark-olive sprites share the 28 jars,
// each veiled with its own olive tone; the pick is deterministic (rng(5))
// and the procedural fallback still paints when the PNGs are missing.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ok, eq } from './assert.mjs';
import { rng } from '../../src/art/noise.js';

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PROPS = resolve(WEB, 'assets/props');

const JARS = ['greaves_jar_tall', 'greaves_jar_squat', 'greaves_jar_round', 'greaves_jar_thin', 'greaves_jar_wide'];

// Minimal PNG reader: 8-bit RGBA, non-interlaced (what the pack writes).
function readPng(path) {
  const b = readFileSync(path);
  ok(b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${path}: bad signature`);
  let w, h, ctype, bitd, im;
  const idat = [];
  let o = 8;
  while (o < b.length) {
    const len = b.readUInt32BE(o);
    const type = b.toString('ascii', o + 4, o + 8);
    const data = b.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bitd = data[8]; ctype = data[9]; im = data[12]; }
    if (type === 'IDAT') idat.push(data);
    o += 12 + len;
  }
  ok(bitd === 8 && ctype === 6 && im === 0, `${path}: expected 8-bit RGBA non-interlaced`);
  const raw = inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(w * h * 4);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p++];
    for (let x = 0; x < w; x++) {
      for (let c = 0; c < 4; c++) {
        const v = raw[p++];
        const a = x === 0 ? 0 : px[(y * w + x - 1) * 4 + c];
        const up = y === 0 ? 0 : px[((y - 1) * w + x) * 4 + c];
        const ul = x === 0 || y === 0 ? 0 : px[((y - 1) * w + x - 1) * 4 + c];
        let r;
        if (f === 0) r = v;
        else if (f === 1) r = v + a;
        else if (f === 2) r = v + up;
        else if (f === 3) r = v + ((a + up) >> 1);
        else { const q = a + up - ul; const pa = Math.abs(q - a); const pb = Math.abs(q - up); const pc = Math.abs(q - ul); r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? up : ul); }
        px[(y * w + x) * 4 + c] = r & 255;
      }
    }
  }
  return { w, h, px };
}

function opaqueMean(png) {
  let n = 0, r = 0, g = 0, bl = 0;
  for (let i = 0; i < png.w * png.h; i++) {
    if (png.px[i * 4 + 3] > 8) { n++; r += png.px[i * 4]; g += png.px[i * 4 + 1]; bl += png.px[i * 4 + 2]; }
  }
  ok(n > 100, 'sprite almost empty');
  return [r / n, g / n, bl / n];
}

// The exact per-jar draw sequence in greaves.js (same rng(5) consumption
// order: height, three veil ints, tilt, then the variant pick with the
// neighbour step-aside). Kept in sync by review: the static test below
// pins the markers in the scene file.
function dealJars() {
  const r = rng(5);
  const seq = [];
  let prev = -1;
  for (let s = 0; s < 4; s++) for (let i = 0; i < 7; i++) {
    const jh = r.range(46, 78);
    const cR = r.int(70, 95), cG = r.int(78, 96), cB = r.int(48, 62);
    r.range(-0.3, 0.3);
    let vi = r.int(0, JARS.length - 1);
    if (vi === prev) vi = (vi + 1 + r.int(0, JARS.length - 2)) % JARS.length;
    prev = vi;
    seq.push([JARS[vi], jh, cR, cG, cB]);
  }
  return seq;
}

const index = JSON.parse(readFileSync(resolve(PROPS, 'index.json'), 'utf8'));
const scene = readFileSync(resolve(WEB, 'src/scenes/greaves.js'), 'utf8');

export const tests = [
  ['los frascos son vidrio oscuro, no crema', () => {
    for (const name of JARS) {
      const png = readPng(resolve(PROPS, `${name}.png`));
      const [r, g, b] = opaqueMean(png);
      ok(r < 135 && g < 135, `${name}: too bright (${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)})`);
      ok(b < 90, `${name}: too blue/pale (${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)})`);
      ok(g >= r - 12, `${name}: not greenish (${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)})`);
    }
  }],
  ['cinco variantes distintas que caben en móvil', () => {
    const bufs = JARS.map((n) => readFileSync(resolve(PROPS, `${n}.png`)));
    for (let i = 0; i < bufs.length; i++) for (let j = i + 1; j < bufs.length; j++) {
      ok(!bufs[i].equals(bufs[j]), `${JARS[i]} and ${JARS[j]} are the same file`);
    }
    let total = 0;
    for (let i = 0; i < JARS.length; i++) {
      ok(bufs[i].length < 100 * 1024, `${JARS[i]} over mobile budget`);
      total += bufs[i].length;
      const m = index[JARS[i]];
      ok(m && m.ax > 0 && m.ay > 0, `${JARS[i]}: missing index entry`);
      ok(Number.isFinite(m.body) && m.body >= 20 && m.body <= 80, `${JARS[i]}: bad glass body ${m && m.body}`);
      const png = readPng(resolve(PROPS, `${JARS[i]}.png`));
      ok(m.w === png.w && m.h === png.h, `${JARS[i]}: index size drift`);
    }
    ok(total < 100 * 1024, `jar library over mobile budget (${(total / 1024).toFixed(1)} KB)`);
  }],
  ['el respaldo procedural y el velo por frasco siguen en greaves.js', () => {
    ok(scene.includes('rgba(${cR},${cG},${cB},0.8)'), 'procedural fallback gone');
    ok(scene.includes('source-atop') && scene.includes('propSprite'), 'per-jar veil gone');
    ok(scene.includes('JAR_VEIL') && scene.includes('JAR_NAMES'), 'veil/variant constants gone');
    for (const n of JARS) ok(scene.includes(`'${n}'`), `${n} not dealt in greaves.js`);
    // The tinted copy bails out before touching document when the sprite
    // is missing, so painting without PNGs cannot throw there (the smoke
    // test then paints the real fallback for every scene).
    const guard = scene.indexOf('if (!p) return false;');
    const alloc = scene.indexOf("document.createElement('canvas')");
    ok(guard >= 0 && alloc > guard, 'missing-sprite guard must precede the tint canvas');
  }],
  ['el reparto es determinista y sin vecinos clonados', () => {
    ok(scene.includes('rng(5)'), 'seeded rng(5) gone from greaves.js');
    const code = scene.replace(/\/\/[^\n]*/g, '');
    ok(!code.includes('Math.random'), 'jar deal must not use Math.random');
    ok(!code.includes('Date.now'), 'jar deal must not depend on time');
    const a = dealJars(), b = dealJars();
    eq(a, b, 'same seed must deal the same jars');
    eq(a.length, 28, 'the shelf keeps its 28 jars');
    for (let i = 1; i < a.length; i++) {
      ok(a[i][0] !== a[i - 1][0], `adjacent clones at ${i - 1},${i} (${a[i][0]})`);
    }
    const seen = new Set(a.map((j) => j[0]));
    eq([...seen].sort(), [...JARS].sort(), 'every variant must appear on the shelf');
    const veils = new Set(a.map((j) => j.slice(2).join(',')));
    ok(veils.size === 28, `veils should all differ (${veils.size}/28)`);
  }],
];
