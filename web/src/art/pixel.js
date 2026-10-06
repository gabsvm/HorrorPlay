// HD pixel-art finishing pass. Everything painted by code is supersampled, reduced to the
// 640x360 pixel grid and snapped to one curated palette with light ordered dithering, so
// buildings, props and characters share the same hand-made finish.

// Ramps per material, dark to light. The lightmap tints and darkens these later in the shader.
const RAMPS = {
  ink: ['#07080b', '#0d1015', '#141a21', '#1d252e', '#29343e', '#3a4752', '#52616b', '#6f7e86', '#93a1a6'],
  fog: ['#1b2b2c', '#26403f', '#355856', '#4a7470', '#6c9690', '#9cbcb4'],
  brick: ['#21110e', '#2f1914', '#3d1f18', '#52291e', '#683627', '#7e4532', '#955a41', '#a9714f'],
  wood: ['#170f0a', '#1e140d', '#2e1f14', '#42301f', '#594330', '#735a40', '#8f7655'],
  stone: ['#1f1e1b', '#2b2925', '#3d3a34', '#514d45', '#69645a', '#837d70', '#a19a8a', '#c4bca9'],
  light: ['#5c3410', '#8a5418', '#b97a24', '#e0a33c', '#f3c96a', '#fde6a8', '#fff6dc'],
  blood: ['#2a0807', '#3a0a0a', '#5e1212', '#8a1c18', '#b32b20'],
  host: ['#0f2a20', '#164a36', '#1f6f4f', '#2fa274', '#5fd6a4', '#a8f0d0'],
  skin: ['#3a271d', '#4a3226', '#6e4d3a', '#946b52', '#b88c6c', '#d8b08e'],
  dusk: ['#1c1420', '#2c2033', '#43314a', '#5e4656'],
  paper: ['#7a6c50', '#9c8d6c', '#c9b994', '#e6dcc0'],
  police: ['#0d1120', '#12172a', '#1c2440', '#2b375c'],
  moss: ['#1a2116', '#28331f', '#3b4a2b', '#55663a'],
  white: ['#d0d0c8', '#e8e8e0', '#ffffff'],
};

export const PALETTE = Object.values(RAMPS).flat().map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);

// 32 levels per channel -> nearest palette index (red-mean perceptual distance)
const LUT = new Uint8Array(32 * 32 * 32);
(function buildLut() {
  for (let r = 0; r < 32; r++) for (let g = 0; g < 32; g++) for (let b = 0; b < 32; b++) {
    const R = r * 8.226, Gc = g * 8.226, B = b * 8.226;
    let best = 0, bd = Infinity;
    for (let i = 0; i < PALETTE.length; i++) {
      const p = PALETTE[i];
      const rm = (R + p[0]) / 2;
      const dr = R - p[0], dg = Gc - p[1], db = B - p[2];
      const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
      if (d < bd) { bd = d; best = i; }
    }
    LUT[(r << 10) | (g << 5) | b] = best;
  }
})();

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);

export function quantizeData(data, w, h, { dither = 14, alphaCut = 110, edge = 0 } = {}) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      if (a < alphaCut) { data[i + 3] = 0; continue; }
      const k = 1;
      const o = BAYER[(y & 3) * 4 + (x & 3)] * dither;
      const r = Math.max(0, Math.min(255, data[i] * k + o)), g = Math.max(0, Math.min(255, data[i + 1] * k + o)), b = Math.max(0, Math.min(255, data[i + 2] * k + o));
      const p = PALETTE[LUT[((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)]];
      data[i] = p[0]; data[i + 1] = p[1]; data[i + 2] = p[2]; data[i + 3] = 255;
    }
  }
  if (edge) {
    // inner outline: darken opaque pixels that touch transparency (sprites read better)
    const copy = new Uint8ClampedArray(data);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!copy[i + 3]) continue;
      const open = (xx, yy) => xx < 0 || yy < 0 || xx >= w || yy >= h || !copy[(yy * w + xx) * 4 + 3];
      if (open(x - 1, y) || open(x + 1, y) || open(x, y - 1) || open(x, y + 1)) {
        data[i] *= edge; data[i + 1] *= edge; data[i + 2] *= edge;
      }
    }
  }
}

// Reduce a supersampled canvas to `scale` of its size and snap it to the palette.
export function pixelize(src, scale, opts = {}) {
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(src.width * scale));
  out.height = Math.max(1, Math.round(src.height * scale));
  pixelizeInto(src, out, opts);
  // copy into an ordinary (GPU-friendly) canvas: the CPU one used for reading back pixels
  // would otherwise be re-uploaded every time it is drawn
  const gpu = document.createElement('canvas');
  gpu.width = out.width; gpu.height = out.height;
  gpu.getContext('2d').drawImage(out, 0, 0);
  return gpu;
}

// Same, into an existing canvas (reused every frame for sprites).
export function pixelizeInto(src, out, opts = {}) {
  const w = out.width, h = out.height;
  const c = out.getContext('2d', { willReadFrequently: true });
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, w, h);
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.drawImage(src, 0, 0, w, h);
  const img = c.getImageData(0, 0, w, h);
  quantizeData(img.data, w, h, opts);
  c.putImageData(img, 0, 0);
  return out;
}
