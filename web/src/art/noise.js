// Seeded randomness and value noise used by every painted texture.

export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (lo, hi) => lo + (hi - lo) * next();
  next.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * next());
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.chance = (p) => next() < p;
  return next;
}

function hash2(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t) => t * t * (3 - 2 * t);

// Value noise in [0,1]. `period` makes it tile horizontally/vertically.
export function vnoise(x, y, seed = 0, px = 0, py = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const wrap = (v, p) => (p ? ((v % p) + p) % p : v);
  const x0 = wrap(xi, px), x1 = wrap(xi + 1, px), y0 = wrap(yi, py), y1 = wrap(yi + 1, py);
  const a = hash2(x0, y0, seed), b = hash2(x1, y0, seed), c = hash2(x0, y1, seed), d = hash2(x1, y1, seed);
  const u = smooth(xf), v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x, y, { seed = 0, octaves = 4, lacunarity = 2, gain = 0.5, px = 0, py = 0 } = {}) {
  let amp = 0.5, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * vnoise(x * freq, y * freq, seed + i * 17, px * freq, py * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

// Build a grayscale noise canvas. `fn(nx, ny)` -> [0..1] is optional for custom shaping.
// Cells are low resolution on purpose; callers draw them scaled with smoothing for a painterly result.
export function noiseCanvas(w, h, { scale = 8, seed = 1, octaves = 4, tile = false, alpha = false, shape } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const px = tile ? scale : 0;
  const py = tile ? Math.max(1, Math.round(scale * h / w)) : 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = fbm((x / w) * scale, (y / h) * (py || scale * h / w), { seed, octaves, px, py });
      if (shape) v = shape(v, x / w, y / h);
      v = Math.max(0, Math.min(1, v));
      const i = (y * w + x) * 4;
      if (alpha) {
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = v * 255;
      } else {
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v * 255;
        img.data[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
