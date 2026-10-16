"""El Huesped T2: studio photograph (Thomas & Nat, 1860s-70s) and Whitechapel 1888 map.

Reproducible PIL/numpy painting. No internet, no Blender: typography and paper
grain need pixel control that a 3D render cannot give at these sizes.

Outputs (rewritten every run):
  web/assets/closeups/room_photo.jpg       1280x720 inspection, intact faces
  web/assets/closeups/room_photo_torn.jpg  1280x720 inspection, elder face scraped (c3)
  web/assets/closeups/room_map.jpg         1280x720 inspection, ink & pencil
  web/assets/props/room_photo.png          110x84 wall sprite (older head kept at the
                                           exact old spot so the c3 scratch overlay fits)
  web/assets/props/room_map.png            130x96 wall sprite (paper + streets, no text;
                                           the red pins stay painted by room.js)
  + index.json entries for both pipelines.

Canon: two boys standing, the elder's hand on the younger's shoulder (Limehouse
steps comment in room.js); think-lines, flags, sanity untouched (see room.js diff).
Map streets are only ones the game already names (+Commercial Rd/Osborn St from
story text); pencil crosses mark the five wall-pin spots, nothing labelled.

Run: python web/art_review/room_photo_map/scripts/make_photo_map.py
"""
import json
import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = Path(__file__).resolve()
TASK = HERE.parent.parent
WEB = TASK.parent.parent
CLOSEUPS = WEB / 'assets' / 'closeups'
PROPS = WEB / 'assets' / 'props'
WORK = TASK / 'work'
WORK.mkdir(parents=True, exist_ok=True)

GEORGIA = 'C:/Windows/Fonts/georgia.ttf'
GEORGIA_B = 'C:/Windows/Fonts/georgiab.ttf'
TIMES = 'C:/Windows/Fonts/times.ttf'


def font(path, size):
    return ImageFont.truetype(path, size)


def rng(seed):
    return random.Random(seed)


def grain(im, sigma=7, alpha=0.16, seed=1):
    """Monochrome gaussian grain blended over the image (albumen/paper tooth)."""
    r = np.random.default_rng(seed)
    n = r.normal(0, sigma, (im.height, im.width)).astype(np.float32)
    n = np.stack([n, n, n], axis=-1)
    a = np.asarray(im).astype(np.float32)
    out = np.clip(a * (1 - alpha) + (a + n) * alpha, 0, 255)
    return Image.fromarray(out.astype(np.uint8))


def vignette(im, strength=0.42):
    w, h = im.size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = (xx - w / 2) / (w / 2)
    dy = (yy - h / 2) / (h / 2)
    d = np.sqrt(dx * dx * 0.7 + dy * dy) / 1.25
    m = np.clip(1 - strength * np.clip(d - 0.45, 0, 1) ** 1.4, 0, 1)
    a = np.asarray(im).astype(np.float32) * m[..., None]
    return Image.fromarray(a.astype(np.uint8))


def foxing(im, spots, seed, color=(122, 84, 40), amax=46):
    """Age spots: soft brown blotches with darker hearts."""
    r = rng(seed)
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for _ in range(spots):
        x = r.uniform(0, im.width)
        y = r.uniform(0, im.height)
        rad = r.uniform(im.width * 0.004, im.width * 0.02)
        a = r.uniform(amax * 0.3, amax)
        d.ellipse([x - rad, y - rad * 0.8, x + rad, y + rad * 0.8],
                  fill=color + (int(a * 0.35),))
        d.ellipse([x - rad * 0.55, y - rad * 0.45, x + rad * 0.55, y + rad * 0.45],
                  fill=color + (int(a),))
    return Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB')


def scratches(im, n, seed, color=(210, 198, 170), amax=60):
    r = rng(seed)
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for _ in range(n):
        x0, y0 = r.uniform(0, im.width), r.uniform(0, im.height)
        ang = r.uniform(0, math.pi)
        ln = r.uniform(im.width * 0.03, im.width * 0.22)
        x1, y1 = x0 + math.cos(ang) * ln, y0 + math.sin(ang) * ln
        d.line([x0, y0, x1, y1], fill=color + (int(r.uniform(amax * 0.3, amax)),), width=1)
    return Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB')


def spaced(draw, xy, text, fnt, fill, tracking=0.18, anchor='la', direction='h'):
    """Letterspaced caption (period maps did not set captions tight).

    direction 'h' advances along x; 'v' sets the string top-to-bottom (for
    tiles that are rotated 90 deg afterwards into along-street labels).
    """
    x, y = xy
    widths = [draw.textlength(c, font=fnt) for c in text]
    steps = [w + tracking * fnt.size for w in widths]
    total = sum(steps)
    if direction == 'h':
        if 'm' in anchor:
            x -= total / 2
        for c, w in zip(text, steps):
            draw.text((x, y), c, font=fnt, fill=fill)
            x += w
    else:
        for c, w in zip(text, steps):
            draw.text((x, y), c, font=fnt, fill=fill)
            y += w
    return total


# ---------------------------------------------------------------- photograph
# Close-up geometry (1280x720 cabinet card). The elder boy's head centre is the
# anchor shared with the torn variant.
PHOTO_RECT = (80, 48, 1120, 512)   # x, y, w, h of the albumen print on the mount
ELDER_HEAD = (540, 253, 46, 54)    # cx, cy, rx, ry in full-image coords
YOUNG_HEAD = (672, 297, 40, 47)


def skin(base=(196, 158, 122), shade=1.0):
    return tuple(min(255, int(c * shade)) for c in base)


def paint_boy(d, cx, feet_y, height, build, pal):
    """A stiff long-exposure studio pose. Returns (head box, head circle)."""
    head_ry = int(height * 0.105)
    head_rx = int(head_ry * 0.86)
    head_cy = int(feet_y - height + head_ry * 0.9)
    shoulder_y = head_cy + int(head_ry * 1.5)
    hip_y = int(feet_y - height * 0.42)
    w_sh = int(height * (0.13 if build == 'slight' else 0.155))
    leg_w = max(3, int(height * 0.045))
    for s in (-1, 1):
        lx = cx + s * int(w_sh * 0.45)
        if build == 'knicker':
            knee = int(feet_y - height * 0.20)
            d.line([lx, hip_y, lx + s * 3, knee], fill=pal['trousers'], width=leg_w + 6)
            d.line([lx + s * 3, knee, lx + s * 4, feet_y - 8],
                   fill=pal['stockings'], width=leg_w)
            d.ellipse([lx + s * 4 - 9, feet_y - 16, lx + s * 4 + 9, feet_y - 2],
                      fill=pal['boots'])
        else:
            d.line([lx, hip_y, lx + s * 2, feet_y - 10], fill=pal['trousers'],
                   width=leg_w + 5)
            d.ellipse([lx + s * 2 - 8, feet_y - 15, lx + s * 2 + 8, feet_y - 2],
                      fill=pal['boots'])
    d.polygon([(cx - w_sh, shoulder_y), (cx + w_sh, shoulder_y),
               (cx + w_sh - 4, hip_y + 14), (cx - w_sh + 4, hip_y + 14)],
              fill=pal['jacket'])
    d.polygon([(cx - 9, shoulder_y + 4), (cx + 9, shoulder_y + 4),
               (cx + 5, hip_y + 10), (cx - 5, hip_y + 10)], fill=pal['shirt'])
    for i in range(3):
        by = shoulder_y + 26 + i * 26
        d.ellipse([cx + 12 - 3, by - 3, cx + 12 + 3, by + 3], fill=pal['buttons'])
    d.polygon([(cx - 20, shoulder_y), (cx + 20, shoulder_y),
               (cx + 10, shoulder_y + 16), (cx - 10, shoulder_y + 16)],
              fill=pal['collar'])
    for s in (-1, 1):
        ax = cx + s * (w_sh + 2)
        d.line([ax, shoulder_y + 6, ax + s * 4, hip_y + 6], fill=pal['jacket'],
               width=max(4, int(height * 0.05)))
        d.ellipse([ax + s * 4 - 7, hip_y, ax + s * 4 + 7, hip_y + 14], fill=skin())
    d.rectangle([cx - 10, head_cy + head_ry - 14, cx + 10, shoulder_y + 2],
                fill=skin(shade=0.94))
    box = [cx - head_rx, head_cy - head_ry, cx + head_rx, head_cy + head_ry]
    d.ellipse(box, fill=skin())
    d.pieslice(box, 180, 360, fill=pal['hair'])
    d.ellipse([cx - head_rx, head_cy - head_ry - 4, cx + head_rx, head_cy - 2],
              fill=None, outline=pal['hair'], width=max(3, head_ry // 4))
    return box, (cx, head_cy, head_rx, head_ry)


def paint_photo_base(seed=61):
    W, H = 1280, 720
    r = rng(seed)
    mount = Image.new('RGB', (W, H), (178, 160, 126))
    d = ImageDraw.Draw(mount)
    for _ in range(2600):
        x, y = r.uniform(0, W), r.uniform(0, H)
        v = r.uniform(-9, 9)
        d.point((x, y), fill=(int(178 + v), int(160 + v), int(126 + v)))
    px, py, pw, ph = PHOTO_RECT
    yy, xx = np.mgrid[0:ph, 0:pw].astype(np.float32)
    glow = 1 - 0.16 * (((xx - pw * 0.46) / pw) ** 2 + ((yy - ph * 0.40) / ph) ** 2)
    base = np.stack([np.full((ph, pw), 148.0) * glow,
                     np.full((ph, pw), 124.0) * glow,
                     np.full((ph, pw), 92.0) * glow], axis=-1)
    horizon = int(ph * 0.62)
    base[:horizon] *= 0.94
    base[horizon:] = np.stack([np.full((ph - horizon, pw), 118.0),
                              np.full((ph - horizon, pw), 97.0),
                              np.full((ph - horizon, pw), 70.0)], axis=-1)
    for row in range(horizon, ph, 7):
        base[row:row + 2] *= 0.92  # floorboards stretching away
    im = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    d.polygon([(0, 0), (150, 0), (110, horizon), (0, horizon)], fill=(128, 106, 78))
    for i in range(9):
        x = 14 + i * 15
        d.line([x, 0, x - 26, horizon], fill=(112, 92, 66), width=5)
    d.rectangle([pw - 170, 60, pw - 60, horizon], fill=(140, 117, 86))
    d.rectangle([pw - 185, 52, pw - 45, 70], fill=(150, 126, 94))
    d.rectangle([pw - 185, horizon - 26, pw - 45, horizon], fill=(120, 99, 72))
    im = im.filter(ImageFilter.GaussianBlur(2.2))
    d = ImageDraw.Draw(im)
    elder_pal = {'jacket': (74, 60, 46), 'shirt': (168, 148, 118), 'buttons': (40, 32, 24),
                 'collar': (176, 158, 128), 'trousers': (62, 52, 42),
                 'stockings': (150, 130, 102), 'boots': (38, 30, 24), 'hair': (52, 40, 30)}
    young_pal = {'jacket': (88, 72, 54), 'shirt': (172, 152, 122), 'buttons': (44, 36, 26),
                 'collar': (180, 162, 132), 'trousers': (70, 58, 46),
                 'stockings': (158, 138, 108), 'boots': (40, 32, 26), 'hair': (66, 50, 36)}
    # print-local coords; the elder stands a half-step forward (feet lower)
    ebox, ehead = paint_boy(d, ELDER_HEAD[0] - px, 477, 300, 'straight', elder_pal)
    ybox, yhead = paint_boy(d, YOUNG_HEAD[0] - px, 464, 236, 'knicker', young_pal)
    # the elder's right arm lies across the younger's shoulder; hand rests on it
    ex = ELDER_HEAD[0] - px
    yx = YOUNG_HEAD[0] - px
    d.line([ex + 48, 257, yx - 10, 283], fill=elder_pal['jacket'], width=15)
    d.ellipse([yx - 24, 272, yx + 4, 292], fill=skin())
    for (fcx, fcy, frx, fry) in (ehead, yhead):
        face = im.crop((fcx - frx, fcy - fry, fcx + frx, fcy + fry))
        face = face.filter(ImageFilter.GaussianBlur(3.2))
        im.paste(face, (fcx - frx, fcy - fry))
    d = ImageDraw.Draw(im)
    for (fcx, fcy, frx, fry) in (ehead, yhead):
        eo = max(2, frx // 9)
        for s in (-1, 1):
            exx = fcx + s * int(frx * 0.36)
            eyy = fcy - int(fry * 0.05)
            d.ellipse([exx - eo, eyy - 1, exx + eo, eyy + 2], fill=(96, 74, 58))
        d.arc([fcx - frx * 0.3, fcy + fry * 0.15, fcx + frx * 0.3, fcy + fry * 0.55],
              20, 160, fill=(110, 86, 66), width=2)
    im = im.filter(ImageFilter.GaussianBlur(0.7))
    im = foxing(im, 26, seed + 7, amax=34)
    im = scratches(im, 7, seed + 11, amax=44)
    im = grain(im, sigma=6, alpha=0.20, seed=seed + 13)
    im = vignette(im, strength=0.38)
    mount.paste(im, (px, py))
    d = ImageDraw.Draw(mount)
    d.rectangle([px - 8, py - 8, px + pw + 8, py + ph + 8], outline=(138, 106, 62), width=3)
    d.rectangle([px - 14, py - 14, px + pw + 14, py + ph + 14], outline=(96, 78, 54), width=1)
    f1 = font(GEORGIA_B, 30)
    spaced(d, (W / 2, py + ph + 34), 'E.  VANCE', f1, (74, 58, 40), anchor='ma')
    f2 = font(GEORGIA, 21)
    spaced(d, (W / 2, py + ph + 70), 'PHOTOGRAPHIC  STUDIO,  23  COMMERCIAL  STREET,  LONDON,  E.',
           f2, (88, 70, 50), anchor='ma')
    mount = foxing(mount, 20, seed + 23, amax=40)
    mount = grain(mount, sigma=4, alpha=0.10, seed=seed + 29)
    return mount


def paint_photo_torn():
    """Same sitting, elder boy's face scraped away (chapter 3).

    Matches the wall overlay palette in room.js drawNear (pale board showing
    through + diagonal gouges) so wall and close-up tell one story.
    """
    im = paint_photo_base(seed=61)
    d = ImageDraw.Draw(im, 'RGBA')
    cx, cy, rx, ry = ELDER_HEAD
    r = rng(1888)
    pts = []
    for k in range(26):
        a = k / 26 * 2 * math.pi
        wob = 1 + r.uniform(-0.22, 0.22)
        pts.append((cx + math.cos(a) * rx * 1.35 * wob, cy + math.sin(a) * ry * 1.45 * wob))
    d.polygon(pts, fill=(201, 192, 174, 255))
    for _ in range(60):
        x, y = r.uniform(cx - rx, cx + rx), r.uniform(cy - ry, cy + ry)
        d.point((x, y), fill=(214, 206, 188, 255))
    for i in range(4):
        x0 = cx - rx * 0.7 + i * (rx * 0.5)
        d.line([x0, cy - ry * 1.3, x0 + rx * 0.35, cy + ry * 1.3],
               fill=(122, 112, 96, 255), width=5)
        d.line([x0 - 2, cy - ry * 1.3, x0 + rx * 0.35 - 2, cy + ry * 1.3],
               fill=(228, 220, 202, 255), width=2)
    out = im.convert('RGB')
    out = grain(out, sigma=5, alpha=0.12, seed=99)
    return out


# ------------------------------------------------------------------- map ---
# A division policeman's Whitechapel: only streets the game already names.
# Normalized layout (x east, y south); rendered at any size, text optional.
INK = (59, 45, 31)
INK_SOFT = (90, 70, 50)
PENCIL = (84, 82, 80)

# east-west streets: (name, y, x0, x1, major)
EW = [
    ("BUCK'S ROW", 0.200, 0.55, 0.84, False),
    ('HANBURY ST', 0.280, 0.38, 0.78, True),
    ('FASHION ST', 0.335, 0.38, 0.66, False),
    ('DORSET ST', 0.352, 0.38, 0.62, False),
    ('FLOWER & DEAN ST', 0.395, 0.42, 0.68, False),
    ('WENTWORTH ST', 0.440, 0.42, 0.60, False),
    ('WHITECHAPEL HIGH ST', 0.520, 0.06, 0.385, True),
    ('WHITECHAPEL RD', 0.520, 0.385, 0.94, True),
]
# north-south streets: (name, x, y0, y1, major)
NS = [
    ('BISHOPSGATE ST', 0.055, 0.06, 0.30, False),
    ('GOULSTON ST', 0.260, 0.30, 0.52, True),
    ('COMMERCIAL ST', 0.385, 0.10, 0.52, True),
    ('OSBORN ST', 0.360, 0.52, 0.74, False),
    ('THRAWL ST', 0.500, 0.395, 0.52, False),
    ('BRICK LANE', 0.620, 0.14, 0.66, True),
    ('BERNER ST', 0.740, 0.55, 0.82, True),
]
# Winthrop Street is the game's own invention (Barber's yard by the railway):
# a short stub north-west, labelled like the rest, contradicting nothing.
WINTHROP = ('WINTHROP ST', 0.24, 0.30, 0.38, False)
# horizontal labels: name -> (centre-x norm, y offset px from the carriageway)
# Wentworth/High/Flower sit below their streets; the rest above. Hand-placed so
# no two labels touch (checked when the sheet was laid out).
EW_LABEL = {
    "BUCK'S ROW": (0.76, -32),
    'HANBURY ST': (0.52, -34),
    'FASHION ST': (0.56, -32),
    'DORSET ST': (0.45, -37),
    'FLOWER & DEAN ST': (0.68, -32),
    'WENTWORTH ST': (0.435, -32),
    'WHITECHAPEL HIGH ST': (0.20, +12),
    'WHITECHAPEL RD': (0.80, -34),
}
# vertical labels: name -> (mid-y norm, half-length norm); drawn east of the line
NS_LABEL = {
    'BISHOPSGATE ST': (0.17, 0.11),
    'GOULSTON ST': (0.36, 0.08),
    'COMMERCIAL ST': (0.12, 0.11),
    'OSBORN ST': (0.63, 0.09),
    'THRAWL ST': (0.452, 0.095),
    'BRICK LANE': (0.24, 0.09),
    'BERNER ST': (0.70, 0.10),
}
# diagonal: Commercial Road runs south-east from the corner
COMMERCIAL_RD = [(0.385, 0.52), (0.55, 0.62), (0.72, 0.70), (0.94, 0.80)]
# pencil crosses: the five wall-pin spots (canon places the pins, not the map)
MARKS = [(0.70, 0.20), (0.50, 0.28), (0.74, 0.68), (0.115, 0.60), (0.575, 0.352)]
HOME = (0.50, 0.52)  # his own corner, ringed but never labelled


def paper_base(w, h, seed=7, tone=(201, 178, 131)):
    r = rng(seed)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    blotch = (np.sin(xx / 130 + 1) * np.sin(yy / 170 + 2)
              + 0.6 * np.sin(xx / 47 + yy / 61)) / 1.6
    m = 1 + blotch * 0.045 + r.uniform(-0.012, 0.012)
    a = np.stack([np.full((h, w), float(tone[0])) * m,
                  np.full((h, w), float(tone[1])) * m,
                  np.full((h, w), float(tone[2])) * m], axis=-1)
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    for _ in range(900):
        x, y = r.uniform(0, w), r.uniform(0, h)
        v = r.uniform(-7, 7)
        d.point((x, y), fill=(int(tone[0] + v), int(tone[1] + v), int(tone[2] + v)))
    return im


def street_width(w, major, labels):
    base = w / 1280
    return max(2, int(round((7 if major else 4.5) * base)) if labels else max(1, int(round((3 if major else 2) * base))))


def paint_map(w, h, labels=True, seed=1888):
    im = paper_base(w, h, seed=seed)
    d = ImageDraw.Draw(im)
    X = lambda u: int(u * w)
    Y = lambda v: int(v * h)
    if labels:
        # fold lines first (ink sits over them, age under the ink)
        for fx in (0.36, 0.71):
            d.line([X(fx), 0, X(fx), h], fill=(150, 128, 92), width=max(1, w // 640))
            d.line([X(fx) + 2, 0, X(fx) + 2, h], fill=(214, 192, 146), width=1)
        d.line([0, Y(0.55), w, Y(0.55)], fill=(150, 128, 92), width=max(1, w // 640))
    # street blocks: faint plot divisions between the named streets
    r = rng(seed + 3)
    for _ in range(46):
        x, y = r.uniform(0.03, 0.95), r.uniform(0.05, 0.9)
        bw, bh = r.uniform(0.02, 0.07), r.uniform(0.02, 0.06)
        d.rectangle([X(x), Y(y), X(x + bw), Y(y + bh)], outline=(160, 138, 100), width=1)
    # carriageways
    for name, y, x0, x1, major in EW:
        sw = street_width(w, major, labels)
        d.line([X(x0), Y(y), X(x1), Y(y)], fill=(226, 208, 170), width=sw + 2)
        d.line([X(x0), Y(y), X(x1), Y(y)], fill=INK, width=sw)
        d.line([X(x0), Y(y), X(x1), Y(y)], fill=(232, 214, 176), width=max(1, sw - 3))
    for name, x, y0, y1, major in NS:
        sw = street_width(w, major, labels)
        d.line([X(x), Y(y0), X(x), Y(y1)], fill=(226, 208, 170), width=sw + 2)
        d.line([X(x), Y(y0), X(x), Y(y1)], fill=INK, width=sw)
        d.line([X(x), Y(y0), X(x), Y(y1)], fill=(232, 214, 176), width=max(1, sw - 3))
    pts = [(X(u), Y(v)) for u, v in COMMERCIAL_RD]
    sw = street_width(w, True, labels)
    d.line(pts, fill=(226, 208, 170), width=sw + 2, joint='curve')
    d.line(pts, fill=INK, width=sw, joint='curve')
    # Winthrop stub (see WINTHROP above)
    _wn, wy, wx0, wx1, _wm = WINTHROP
    sw = street_width(w, False, labels)
    d.line([X(wx0), Y(wy), X(wx1), Y(wy)], fill=(226, 208, 170), width=sw + 2)
    d.line([X(wx0), Y(wy), X(wx1), Y(wy)], fill=INK, width=sw)
    # Mitre Square: a walled city square, south-west
    mx, my, ms = X(0.10), Y(0.575), int(w * 0.028)
    d.rectangle([mx - ms, my - ms, mx + ms, my + ms], outline=INK, width=3)
    d.rectangle([mx - ms, my - ms, mx + ms, my + ms], outline=(226, 208, 170), width=1)
    # London Hospital block, south side of the Road
    hx, hy = X(0.655), Y(0.548)
    hw, hh = int(w * 0.055), int(h * 0.045)
    d.rectangle([hx, hy, hx + hw, hy + hh], outline=INK, width=2)
    for k in range(1, 4):
        d.line([hx, hy + k * hh // 4, hx + hw, hy + k * hh // 4], fill=(160, 138, 100), width=1)
    # Christ Church mark, north of the middle
    chx, chy, chs = X(0.45), Y(0.165), int(w * 0.008)
    d.line([chx - chs, chy, chx + chs, chy], fill=INK, width=3)
    d.line([chx, chy - chs * 2, chx, chy + chs], fill=INK, width=3)
    boxes = []  # every text label's box; the sheet fails if two touch
    if labels:
        f_street = font(GEORGIA, 24)
        f_small = font(GEORGIA, 17)
        f_area = font(GEORGIA_B, 22)

        def note(box, what):
            boxes.append((box, what))

        def hlabel(cx, y, text, fnt, fill=INK):
            total = spaced(d, (X(cx), y), text, fnt, fill, anchor='ma')
            asc, desc = fnt.getmetrics()
            note((X(cx) - total / 2, y, X(cx) + total / 2, y + asc + desc), text)

        # along-street labels sit just off the carriageway, never on it
        for name, y, x0, x1, major in EW + [WINTHROP]:
            fnt = f_street if major else f_small
            cx, dy = EW_LABEL.get(name, ((x0 + x1) / 2, -32))
            if name == 'WINTHROP ST':
                cx, dy = (wx0 + wx1) / 2, +14
            hlabel(cx, Y(y) + dy, name, fnt)
        probe = ImageDraw.Draw(im)
        for name, x, y0, y1, major in NS:
            fnt = f_street if major else f_small
            mid, half = NS_LABEL.get(name, ((y0 + y1) / 2, (y1 - y0) / 2))
            total = sum(probe.textlength(c, font=fnt) + 0.18 * fnt.size for c in name)
            th = int(total) + 16
            tile = Image.new('RGBA', (44, th), (0, 0, 0, 0))
            td = ImageDraw.Draw(tile)
            spaced(td, (22, 8), name, fnt, INK + (255,), anchor='la', direction='v')
            # top-to-bottom setting turns into left-to-right reading
            tile = tile.rotate(90, expand=True)
            px0, py0 = X(x) + 10, int(Y(mid) - tile.height / 2)
            im.paste(tile, (px0, py0), tile)
            note((px0, py0, px0 + tile.width, py0 + tile.height), name)
        hlabel(0.60, Y(0.72), 'COMMERCIAL RD', f_street)
        hlabel(0.26, Y(0.10), 'SPITALFIELDS', f_area, INK_SOFT)
        hlabel(0.115, my - ms - 32, 'MITRE SQUARE', f_small)
        hlabel(0.115, my + ms + 8, '(CITY)', font(GEORGIA, 15), INK_SOFT)
        hlabel(0.648, hy + hh + 8, 'LONDON HOSPITAL', f_small)
        hlabel(0.48, chy + 16, 'CHRIST CHURCH', f_small)
        hlabel(0.575, Y(0.352) + 30, "MILLER'S CT", f_small)
        d.line([X(0.575), Y(0.352) - 8, X(0.575), Y(0.352) + 28], fill=INK, width=2)
        # title cartouche + scale, as a division map would carry them
        spaced(d, (X(0.83), Y(0.075)), 'WHITECHAPEL', font(GEORGIA_B, 30), INK, anchor='ma')
        spaced(d, (X(0.83), Y(0.115)), 'SPITALFIELDS  &  MILE  END  —  1888',
               font(GEORGIA, 16), INK_SOFT, anchor='ma')
        sx, sy, sl = X(0.78), Y(0.885), int(w * 0.10)
        d.line([sx, sy, sx + sl, sy], fill=INK, width=3)
        for k in range(5):
            d.line([sx + k * sl / 4, sy - 6, sx + k * sl / 4, sy + 6], fill=INK, width=2)
        spaced(d, (sx + sl / 2, sy + 10), 'QUARTER  OF  A  MILE', font(GEORGIA, 15),
               INK_SOFT, anchor='ma')
        # compass rose
        nx, ny, nr = X(0.06), Y(0.87), int(w * 0.022)
        d.polygon([(nx, ny - nr), (nx + nr * 0.35, ny), (nx, ny + nr), (nx - nr * 0.35, ny)],
                  fill=INK)
        spaced(d, (nx, ny + nr + 6), 'N', font(GEORGIA_B, 20), INK, anchor='ma')
        for i, ((ax0, ay0, ax1, ay1), aname) in enumerate(boxes):
            for (bx0, by0, bx1, by1), bname in boxes[i + 1:]:
                if ax0 < bx1 - 4 and bx0 < ax1 - 4 and ay0 < by1 - 2 and by0 < ay1 - 2:
                    raise AssertionError(f'label collision: {aname} vs {bname}')
    # pencil: five crosses where his pins went, his own corner ringed
    pm = max(2, w // 90)
    for (u, v) in MARKS:
        x, y, s = X(u), Y(v), int(w * 0.016)
        d.line([x - s, y - s, x + s, y + s], fill=PENCIL, width=pm)
        d.line([x - s, y + s, x + s, y - s], fill=PENCIL, width=pm)
    hx0, hy0 = X(HOME[0]), Y(HOME[1])
    hr = int(w * 0.020)
    d.ellipse([hx0 - hr, hy0 - hr, hx0 + hr, hy0 + hr], outline=PENCIL, width=pm)
    if labels:
        im = im.filter(ImageFilter.GaussianBlur(0.4))  # ink bite, not laser edges
    im = foxing(im, 30 if labels else 6, seed + 11, amax=36 if labels else 26)
    im = scratches(im, 5 if labels else 2, seed + 17, amax=40)
    im = grain(im, sigma=5, alpha=0.14, seed=seed + 21)
    im = vignette(im, strength=0.30)
    # darkened handling edges, as if folded into a pocket book
    edge = Image.new('L', (w, h), 0)
    ed = ImageDraw.Draw(edge)
    ed.rectangle([0, 0, w - 1, h - 1], outline=255, width=max(2, w // 200))
    edge = edge.filter(ImageFilter.GaussianBlur(max(2, w // 160)))
    im = Image.composite(Image.new('RGB', (w, h), (74, 58, 38)), im, edge)
    return im


# ------------------------------------------------------- wall sprites ---
# The wall reads at ~47 px wide in the 640 frame: sepia mass, gilt frame lines
# and two figures for the photo; paper tone + street mass for the map. The map
# carries no text down here (it would be mush); the red pins stay in room.js.
# The photo keeps the elder head EXACTLY on the old procedural spot so the
# chapter-3 scratch overlay in drawNear still lands on his face.
WALL_PHOTO = (110, 84)
WALL_MAP = (130, 96)
# old procedural anchors in room.js build(): frame (680, GROUND-400, 110, 84),
# elder head ellipse centre (716, GROUND-368) rx7 ry8
SPRITE_HEAD = (36, 32, 7, 8)


def paint_wall_photo():
    w, h = WALL_PHOTO
    r = rng(61)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    glow = 1 - 0.20 * (((xx - w * 0.46) / w) ** 2 + ((yy - h * 0.42) / h) ** 2)
    a = np.stack([np.full((h, w), 138.0) * glow,
                  np.full((h, w), 116.0) * glow,
                  np.full((h, w), 86.0) * glow], axis=-1)
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    d.rectangle([8, 8, w - 9, 30], fill=(120, 100, 72))       # backdrop
    d.rectangle([8, 30, w - 9, h - 9], fill=(104, 86, 62))     # floor
    # two soft figures: elder left with his hand on the younger's shoulder.
    # elder head centre lands on SPRITE_HEAD so the c3 scratch overlay fits.
    for (fx, fw, fh, tone) in ((36, 15, 34, 66), (62, 13, 36, 80)):
        top = h - 12 - fh
        d.ellipse([fx - fw // 2, top, fx + fw // 2, top + fh], fill=(tone, tone - 8, tone - 22))
        d.ellipse([fx - 7, top - 13, fx + 7, top + 1], fill=(tone + 90, tone + 62, tone + 34))
    d.line([43, 48, 55, 46], fill=(66, 58, 46), width=4)       # the arm across
    d.ellipse([53, 43, 59, 49], fill=(156, 128, 100))         # the hand
    im = im.filter(ImageFilter.GaussianBlur(0.6))
    im = grain(im, sigma=5, alpha=0.22, seed=5)
    im = vignette(im, strength=0.45)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w - 1, h - 1], outline=(58, 42, 22), width=5)   # frame
    d.rectangle([5, 5, w - 6, h - 6], outline=(138, 106, 62), width=1)  # gilt slip
    return im


def paint_wall_map():
    w, h = WALL_MAP
    im = paint_map(w, h, labels=False, seed=1888)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w - 1, h - 1], outline=(70, 56, 36), width=2)  # pinned edge
    for (fx, fy) in ((4, 4), (w - 5, 4)):                            # drawing pins
        d.ellipse([fx - 2, fy - 2, fx + 2, fy + 2], fill=(40, 30, 22))
    return im


def save_jpg(im, path, quality=84):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, quality=quality, optimize=True)
    return path.stat().st_size


def main():
    photo = paint_photo_base()
    torn = paint_photo_torn()
    mmap = paint_map(1280, 720, labels=True)
    n1 = save_jpg(photo, CLOSEUPS / 'room_photo.jpg')
    n2 = save_jpg(torn, CLOSEUPS / 'room_photo_torn.jpg')
    n3 = save_jpg(mmap, CLOSEUPS / 'room_map.jpg')
    wp = paint_wall_photo()
    wm = paint_wall_map()
    assert wp.size == WALL_PHOTO, wp.size
    assert wm.size == WALL_MAP, wm.size
    wp.save(PROPS / 'room_photo.png', optimize=True)
    wm.save(PROPS / 'room_map.png', optimize=True)
    # the wall-sprite head must sit where drawNear's scratch expects it
    hx, hy, hrx, hry = SPRITE_HEAD
    head_px = wp.crop((hx - hrx, hy - hry, hx + hrx, hy + hry))
    skinny = np.asarray(head_px).astype(int)
    assert skinny[..., 0].mean() > 120, 'sprite head not pale - overlay would miss'
    # keep work-in-progress full-size previews next to the script output
    photo.save(WORK / 'preview_photo.png')
    torn.save(WORK / 'preview_photo_torn.png')
    mmap.save(WORK / 'preview_map.png')
    wp.save(WORK / 'preview_wall_photo.png')
    wm.save(WORK / 'preview_wall_map.png')
    # index.json entries for both pipelines (each file keeps its own line endings)
    def write_index(path, data):
        raw = path.read_bytes()
        eol = b'\r\n' if b'\r\n' in raw else b'\n'
        text = json.dumps(data, ensure_ascii=False, indent=1) + '\n'
        path.write_bytes(text.replace('\n', eol.decode()).encode('utf8'))

    ci = CLOSEUPS / 'index.json'
    index = json.loads(ci.read_text(encoding='utf8'))
    index.update({'room_map': 'room_map.jpg', 'room_photo': 'room_photo.jpg',
                  'room_photo_torn': 'room_photo_torn.jpg'})
    write_index(ci, index)
    pi = PROPS / 'index.json'
    pindex = json.loads(pi.read_text(encoding='utf8'))
    pindex.update({'room_map': {'ax': 0, 'ay': 0, 'h': 96, 'w': 130},
                   'room_photo': {'ax': 0, 'ay': 0, 'h': 84, 'w': 110}})
    write_index(pi, dict(sorted(pindex.items())))
    for p in (CLOSEUPS / 'room_photo.jpg', CLOSEUPS / 'room_photo_torn.jpg',
              CLOSEUPS / 'room_map.jpg', PROPS / 'room_photo.png', PROPS / 'room_map.png'):
        print('WROTE', p.relative_to(WEB), p.stat().st_size, 'bytes')
    print('closeup bytes:', n1, n2, n3)


if __name__ == '__main__':
    main()
