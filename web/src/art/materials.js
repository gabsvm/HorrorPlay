// Photographic material detail is baked into the static canvas once per scene.
// The procedural painting remains the fallback when an image cannot be loaded.
const names = ['brown_brick_02', 'cobblestone_floor_04', 'wood_floor_worn', 'painted_plaster_wall', 'brown_mud_rocks_01', 'marigold', 'sunset_clouds'];
const images = {};
let ready;

export function loadMaterials() {
  if (ready) return ready;
  if (typeof Image === 'undefined') return Promise.resolve();
  const embedded = typeof window !== 'undefined' && window.__MATERIALS;
  ready = Promise.all(names.map((name) => new Promise((resolve) => {
    const image = new Image();
    image.onload = () => { images[name] = image; resolve(); };
    image.onerror = () => resolve();
    image.src = embedded ? embedded[name] : `assets/materials/${name}.jpg`;
  })));
  return ready;
}

export const hasMaterial = (name) => !!images[name];

// Scale the seamless material in scene coordinates. The existing paint supplies perspective,
// local colour, damage and lighting; this pass supplies irregular worn surface detail.
export function material(ctx, name, x, y, w, h, { tileW = 256, tileH = tileW, alpha = 0.4, mode = 'soft-light', tint = null, offsetY = 0 } = {}) {
  const image = images[name];
  if (!image || w <= 0 || h <= 0) return false;
  const pattern = ctx.createPattern(image, 'repeat');
  if (!pattern) return false;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.translate(x, y - offsetY); ctx.scale(tileW / image.width, tileH / image.height);
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = mode;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, offsetY * image.height / tileH, w * image.width / tileW, h * image.height / tileH);
  if (tint) {
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = tint;
    ctx.fillRect(0, offsetY * image.height / tileH, w * image.width / tileW, h * image.height / tileH);
  }
  ctx.restore();
  return true;
}
