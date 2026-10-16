"""Pack the Wexley mirror frame sprite for the game, reusing the crate flow.

Run: python web/art_review/wexley_mirror/scripts/pack_wexley_mirror.py

Reads ../renders/wexley_mirror_raw.png (frame with a truly transparent glass
opening), crops it, pads it so the hole sits at a CANONICAL inset, and writes
web/assets/props/wexley_mirror.png + the index.json entry (ax/ay/w/h) that
drawProp needs. The game (web/src/scenes/seance.js) then draws the sprite and
paints the dark glass + reflections + cracked overlay in canvas over the hole,
which is what preserves the mirror mechanic.

Canonical layout (all px, asserted below so a re-render that drifts fails
loudly instead of silently misaligning the glass):
  HOLE = (236, 267) at inset LEFT=32, TOP=110 in the final sprite.
  seance.js draws with drawProp(ctx, 'wexley_mirror', TABLE_X, 10), i.e. the
  hole lands on world rect (TABLE_X-118, 120, 236, 267); the painted glass
  rect (TABLE_X-121, 117, 242, 273) overlaps the hole edge by 3 px to hide
  the antialiased fringe while keeping the bright inner bead visible.
"""

from collections import deque
from pathlib import Path
import json

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT.parent.parent / "assets" / "props"

RAW = ROOT / "renders" / "wexley_mirror_raw.png"
CANDIDATE = ROOT / "renders" / "wexley_mirror_game_candidate.png"
OUT = ASSETS / "wexley_mirror.png"

HOLE_W, HOLE_H = 236, 267
HOLE_TOL = 3
LEFT, TOP = 32, 110
EDGE = 4  # transparent margin kept around the outer content
# T6 tone fix (reproducible, Hanbury-style VALUE): the T1b gilt reads
# neon-yellow in the engine (stile cores ~+40-60% over the painted frame,
# measured on comparison/AB_seance_640.png). This multiplier brings the
# in-engine frame back to <= +25% over the painted original while keeping
# the carving (eggs, rosettes, dentils, crest urn) legible. Calibrated
# against work/orig (painted fallback) vs work/before (VALUE 1.0) vs
# work/after captures at x=700: the gilt-pixel mean is linear in VALUE
# (slope ~70, additive candle-halo base ~75-85), so 0.72 lands ~1.15-1.20x
# over the original with margin under the 1.25x cap; 0.85 still read 1.27x.
# Change it only with a fresh before/after measurement. T1b used 1.0 (T1
# used 0.85 on a darker render and the frame died in the night lighting).
VALUE = 0.72


def hole_bbox(alpha):
    """BBox of the LARGEST fully-transparent region NOT touching the border.

    T1b: the ornate crest (cartouche, scroll rings, outer balls) encloses
    small transparent pockets between its volumes. They are not the glass,
    so label connected components and take the largest instead of the bbox
    of every enclosed pixel (which the crest pockets inflated vertically).
    """
    w, h = alpha.size
    px = alpha.load()
    outside = bytearray(w * h)
    queue = deque()
    for x in range(w):
        for y in (0, h - 1):
            if px[x, y] <= 8 and not outside[y * w + x]:
                outside[y * w + x] = 1
                queue.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if px[x, y] <= 8 and not outside[y * w + x]:
                outside[y * w + x] = 1
                queue.append((x, y))
    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                i = ny * w + nx
                if not outside[i] and px[nx, ny] <= 8:
                    outside[i] = 1
                    queue.append((nx, ny))
    seen = bytearray(w * h)
    regions = []
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if px[x, y] <= 8 and not outside[i] and not seen[i]:
                seen[i] = 1
                queue.append((x, y))
                xs = [x]
                ys = [y]
                while queue:
                    cx, cy = queue.popleft()
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy),
                                   (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < w and 0 <= ny < h:
                            j = ny * w + nx
                            if not seen[j] and not outside[j] \
                                    and px[nx, ny] <= 8:
                                seen[j] = 1
                                queue.append((nx, ny))
                                xs.append(nx)
                                ys.append(ny)
                regions.append((len(xs), min(xs), min(ys),
                                max(xs), max(ys)))
    assert regions, "no enclosed transparent hole found"
    regions.sort(reverse=True)
    for n, x0, y0, x1, y1 in regions[1:]:
        print(f"POCKET (crest gap, ignored): ({x0},{y0})-({x1},{y1}) {n} px")
    return regions[0][1:]


im = Image.open(RAW).convert("RGBA")
hx0, hy0, hx1, hy1 = hole_bbox(im.getchannel("A"))
hole_w, hole_h = hx1 - hx0 + 1, hy1 - hy0 + 1
print("HOLE", (hx0, hy0, hx1, hy1), hole_w, hole_h)
assert abs(hole_w - HOLE_W) <= HOLE_TOL, f"hole width drift: {hole_w}"
assert abs(hole_h - HOLE_H) <= HOLE_TOL, f"hole height drift: {hole_h}"

box = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
assert box, "empty render"
x0, y0, x1, y1 = box
hole_cx = (hx0 + hx1) / 2
crop_cx = (x0 + x1) / 2
assert abs(hole_cx - crop_cx) <= 2, "hole off-centre in crop"

# Crop with a small transparent margin, then pad so the hole sits at LEFT/TOP.
im = im.crop((max(0, x0 - EDGE), max(0, y0 - EDGE),
              min(im.width, x1 + EDGE), min(im.height, y1 + EDGE)))
hx0 -= max(0, x0 - EDGE)
hy0 -= max(0, y0 - EDGE)
canvas_w = LEFT + hole_w + (im.width - (hx0 + hole_w))
canvas_h = TOP + hole_h + (im.height - (hy0 + hole_h))
canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
canvas.alpha_composite(im, (LEFT - hx0, TOP - hy0))
im = canvas

rgb = ImageEnhance.Brightness(im.convert("RGB")).enhance(VALUE)
rgb.putalpha(im.getchannel("A"))
im = rgb

ax = LEFT + hole_w // 2
assert hx0 + (LEFT - hx0) == LEFT  # hole left edge lands exactly at LEFT
im.save(OUT, optimize=True)
im.save(CANDIDATE, optimize=True)

indexfile = ASSETS / "index.json"
raw = indexfile.read_bytes()
eol = b"\r\n" if b"\r\n" in raw else b"\n"
index = json.loads(raw.decode("utf8"))
index["wexley_mirror"] = {"ax": ax, "ay": TOP, "h": im.height, "w": im.width}
# T6: the repo index.json is CRLF (Hanbury pack); keep whatever endings the
# file already has instead of converting the whole file (T1b caught the
# LF->CRLF direction; the reverse conversion is just as bad).
text = json.dumps(dict(sorted(index.items())), ensure_ascii=False, indent=1) + "\n"
indexfile.write_bytes(text.replace("\n", eol.decode()).encode("utf8"))
print("PACKED", OUT, im.size, "ax/ay:", ax, TOP,
      f"({OUT.stat().st_size // 1024} KB)")
off = LEFT - ax  # hole left edge relative to the draw x (== -hole_w//2)
# ay == TOP is the hole top in sprite px, so drawing at (TABLE_X, 120)
# puts the hole top at world y=120 by construction (T1 drew at y=10,
# ~110 px too high). Keep seance.js in sync with this print.
print(f"SEANCE_CONSTANTS: draw at (TABLE_X, 120); "
      f"hole world rect (TABLE_X{off:+d}, 120, {hole_w}, {hole_h}); "
      f"glass rect (TABLE_X{off - 3:+d}, 117, {hole_w + 6}, {hole_h + 6})")
