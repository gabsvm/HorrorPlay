// The single palette for the whole game. Albedo values are mid-tones: the lightmap does the darkening.

export const P = {
  // Albedo
  brick: ['#5a3a2e', '#4e3328', '#63402f', '#47302a', '#573a31', '#3f2a24'],
  brickSoot: '#2a2220',
  mortar: '#6b625a',
  plaster: '#7d7464',
  plasterDark: '#5a5348',
  stone: '#6d6a64',
  stoneDark: '#4a4844',
  wood: '#4a3526',
  woodDark: '#2f2219',
  iron: '#232528',
  glassDark: '#1a2228',
  cobble: '#55524d',
  cobbleDark: '#3a3834',
  mud: '#2b2620',
  water: '#1d2a2c',
  cloth: '#3a3530',
  coat: '#26282b',
  skin: '#9c8470',
  paper: '#c9b994',

  // Light (encoded at half strength: 0.5 == 1.0x, the shader doubles it)
  ambientNight: [0.10, 0.13, 0.17],
  gas: [1.0, 0.66, 0.30],
  lantern: [1.0, 0.74, 0.42],
  candle: [1.0, 0.58, 0.24],
  moon: [0.45, 0.58, 0.72],
  reef: [0.25, 0.95, 0.70],

  // Grading
  fog: [0.42, 0.50, 0.52],
  sky: ['#06080b', '#0b1116', '#142026'],
};

export const rgb = (c, a = 1) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;

export function toRgb(c) {
  if (c[0] === '#') { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  const m = c.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
}

export function shade(c, f) {
  const [r, g, b] = toRgb(c);
  return `rgb(${Math.min(255, r * f) | 0},${Math.min(255, g * f) | 0},${Math.min(255, b * f) | 0})`;
}

export function mix(a, b, t) {
  const A = toRgb(a), B = toRgb(b);
  return `rgb(${Math.round(A[0] * (1 - t) + B[0] * t)},${Math.round(A[1] * (1 - t) + B[1] * t)},${Math.round(A[2] * (1 - t) + B[2] * t)})`;
}
