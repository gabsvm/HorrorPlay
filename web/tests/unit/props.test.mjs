// Greaves's specimen jars (T3b): the shelf must stay in shadow. The jar
// sprites are dark olive glass, not cream, and the scene varies every jar
// with a per-jar veil instead of stamping 28 clones (the fallback stays).
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ok } from './assert.mjs';

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PROPS = resolve(WEB, 'assets/props');

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

const index = JSON.parse(readFileSync(resolve(PROPS, 'index.json'), 'utf8'));
const scene = readFileSync(resolve(WEB, 'src/scenes/greaves.js'), 'utf8');

export const tests = [
  ['los frascos son vidrio oscuro, no crema', () => {
    for (const name of ['greaves_jar_tall', 'greaves_jar_squat']) {
      const png = readPng(resolve(PROPS, `${name}.png`));
      const [r, g, b] = opaqueMean(png);
      ok(r < 135 && g < 135, `${name}: too bright (${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)})`);
      ok(b < 90, `${name}: too blue/pale (${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)})`);
      ok(g >= r - 12, `${name}: not greenish (${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)})`);
    }
  }],
  ['las dos variantes existen, difieren y caben en móvil', () => {
    const a = readFileSync(resolve(PROPS, 'greaves_jar_tall.png'));
    const b = readFileSync(resolve(PROPS, 'greaves_jar_squat.png'));
    ok(!a.equals(b), 'tall and squat are the same file');
    for (const [name, buf] of [['greaves_jar_tall', a], ['greaves_jar_squat', b]]) {
      ok(buf.length < 100 * 1024, `${name} over mobile budget`);
      const m = index[name];
      ok(m && m.ax > 0 && m.ay > 0, `${name}: missing index entry`);
      const png = readPng(resolve(PROPS, `${name}.png`));
      ok(m.w === png.w && m.h === png.h, `${name}: index size drift`);
    }
  }],
  ['el respaldo procedural y el velo por frasco siguen en greaves.js', () => {
    ok(scene.includes('rgba(${cR},${cG},${cB},0.8)'), 'procedural fallback gone');
    ok(scene.includes('source-atop') && scene.includes('propSprite'), 'per-jar veil gone');
  }],
];
