"""El Huesped T2 photo v2: compose the albumen photograph (PIL finish only).

NEVER anatomy: the boys come from Blender plates (render_figures.py) with
JSON sidecars; PIL only paints the studio canvas/column/curtain/floor, pastes
the plates at the legacy anchors, and does albumen ageing, mount and type.

  python compose_v2.py --mode candidates            # 3 small PNGs + 3x faces
  python compose_v2.py --mode final --favorite B    # web/assets JPGs + sprite

Legacy anchors (unchanged, so room.js drawNear scratch and the torn variant
keep working with zero code changes):
  PHOTO_RECT = (80, 48, 1120, 512)  ELDER_HEAD = (540, 253, 46, 54)
  YOUNG_HEAD = (672, 297, 40, 47)   SPRITE_HEAD = (36, 32, 7, 8)
Reference luminance (measured 2026-10-16 from the shipped assets):
  closeup 123.03 (band 104.6-141.5), print-only 101.8, sprite 82.52 (70.1-94.9).
All paths resolve relative to this script; no personal paths.
"""
import argparse
import json
import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = Path(__file__).resolve()
TASK_V2 = HERE.parent.parent
WEB = TASK_V2.parent.parent.parent
PLATES = TASK_V2 / 'work' / 'plates'
CLOSEUPS = WEB / 'assets' / 'closeups'
PROPS = WEB / 'assets' / 'props'

PHOTO_RECT = (80, 48, 1120, 512)
ELDER_HEAD = (540, 253, 46, 54)
YOUNG_HEAD = (672, 297, 40, 47)
SPRITE_HEAD = (36, 32, 7, 8)
REF_PRINT_LUM = 101.8
REF_CLOSEUP_LUM = 123.03
REF_SPRITE_LUM = 82.52

GEORGIA = 'C:/Windows/Fonts/georgia.ttf'
GEORGIA_B = 'C:/Windows/Fonts/georgiab.ttf'


def font(path, size):
    return ImageFont.truetype(path, size)


def rng(seed):
    return random.Random(seed)


def lum(im):
    a = np.asarray(im.convert('RGB')).astype(float)
    return float((0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]).mean())


def grain(im, sigma=6, alpha=0.20, seed=1):
    r = np.random.default_rng(seed)
    n = r.normal(0, sigma, (im.height, im.width)).astype(np.float32)
    n = np.stack([n, n, n], axis=-1)
    a = np.asarray(im).astype(np.float32)
    return Image.fromarray(np.clip(a * (1 - alpha) + (a + n) * alpha, 0, 255).astype(np.uint8))


def vignette(im, strength=0.38):
    w, h = im.size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = (xx - w / 2) / (w / 2)
    dy = (yy - h / 2) / (h / 2)
    d = np.sqrt(dx * dx * 0.7 + dy * dy) / 1.25
    m = np.clip(1 - strength * np.clip(d - 0.45, 0, 1) ** 1.4, 0, 1)
    a = np.asarray(im).astype(np.float32) * m[..., None]
    return Image.fromarray(a.astype(np.uint8))


def foxing(im, spots, seed, color=(122, 84, 40), amax=34):
    r = rng(seed)
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for _ in range(spots):
        x, y = r.uniform(0, im.width), r.uniform(0, im.height)
        rad = r.uniform(im.width * 0.004, im.width * 0.02)
        a = r.uniform(amax * 0.3, amax)
        d.ellipse([x - rad, y - rad * 0.8, x + rad, y + rad * 0.8], fill=color + (int(a * 0.35),))
        d.ellipse([x - rad * 0.55, y - rad * 0.45, x + rad * 0.55, y + rad * 0.45], fill=color + (int(a),))
    return Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB')


def scratches(im, n, seed, color=(210, 198, 170), amax=44):
    r = rng(seed)
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for _ in range(n):
        x0, y0 = r.uniform(0, im.width), r.uniform(0, im.height)
        ang = r.uniform(0, math.pi)
        ln = r.uniform(im.width * 0.03, im.width * 0.22)
        d.line([x0, y0, x0 + math.cos(ang) * ln, y0 + math.sin(ang) * ln],
               fill=color + (int(r.uniform(amax * 0.3, amax)),), width=1)
    return Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB')


def spaced(draw, xy, text, fnt, fill, tracking=0.18, anchor='la'):
    x, y = xy
    widths = [draw.textlength(c, font=fnt) for c in text]
    steps = [w + tracking * fnt.size for w in widths]
    total = sum(steps)
    if 'm' in anchor:
        x -= total / 2
    for c, w in zip(text, steps):
        draw.text((x, y), c, font=fnt, fill=fill)
        x += w
    return total


# ---------------------------------------------------------------- backdrop
# Painted studio canvas: mottled backdrop, curtain one side, column and
# pedestal the other, floorboards below the horizon. Per-variant trim.
# All three share the studio layout (curtain left, column right); the
# candidates differ in head pose, key light and finish only, so no variant
# breaks continuity with the others for no canon reason.
VARIANTS = {
    'A': dict(seed=61, curtain='left', column='right', warm=1.00, glow=1.00, grain_a=0.20),
    'B': dict(seed=62, curtain='left', column='right', warm=1.04, glow=1.03, grain_a=0.17),
    'C': dict(seed=63, curtain='left', column='right', warm=0.97, glow=0.96, grain_a=0.15),
}


def paint_backdrop(pw, ph, variant):
    v = VARIANTS[variant]
    r = rng(v['seed'])
    yy, xx = np.mgrid[0:ph, 0:pw].astype(np.float32)
    glow = (1 - 0.16 * (((xx - pw * 0.46) / pw) ** 2 + ((yy - ph * 0.40) / ph) ** 2)) * v['glow']
    base = np.stack([np.full((ph, pw), 148.0) * glow,
                     np.full((ph, pw), 124.0) * glow,
                     np.full((ph, pw), 92.0) * glow], axis=-1)
    horizon = int(ph * 0.62)
    base[:horizon] *= 0.94
    base[horizon:] = np.stack([np.full((ph - horizon, pw), 118.0),
                               np.full((ph - horizon, pw), 97.0),
                               np.full((ph - horizon, pw), 70.0)], axis=-1)
    for row in range(horizon, ph, 7):
        base[row:row + 2] *= 0.92
    im = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    # curtain with folds on one side
    if v['curtain'] == 'left':
        d.polygon([(0, 0), (150, 0), (110, horizon), (0, horizon)], fill=(128, 106, 78))
        for i in range(9):
            x = 14 + i * 15
            d.line([x, 0, x - 26, horizon], fill=(112, 92, 66), width=5)
    else:
        d.polygon([(pw, 0), (pw - 150, 0), (pw - 110, horizon), (pw, horizon)], fill=(128, 106, 78))
        for i in range(9):
            x = pw - 14 - i * 15
            d.line([x, 0, x + 26, horizon], fill=(112, 92, 66), width=5)
    # column + pedestal on the other side
    if v['column'] == 'right':
        cx0, cx1 = pw - 170, pw - 60
    else:
        cx0, cx1 = 60, 170
    d.rectangle([cx0, 60, cx1, horizon], fill=(140, 117, 86))
    d.rectangle([cx0 - 15, 52, cx1 + 15, 70], fill=(150, 126, 94))
    d.rectangle([cx0 - 15, horizon - 26, cx1 + 15, horizon], fill=(120, 99, 72))
    im = im.filter(ImageFilter.GaussianBlur(2.2))
    if v['warm'] != 1.0:
        a = np.asarray(im).astype(np.float32)
        a[..., 0] = np.clip(a[..., 0] * v['warm'], 0, 255)
        a[..., 2] = np.clip(a[..., 2] / v['warm'], 0, 255)
        im = Image.fromarray(a.astype(np.uint8))
    return im, horizon


# ---------------------------------------------------------------- figures
# Paste the Blender plates head-first at the legacy anchors so the torn
# scrape (ELDER_HEAD) and the wall overlay (SPRITE_HEAD) keep working.
# Scale is head-size based: s = head-box height / plate head height, where
# the plate head height comes from the JSON sidecar (projected hair-top and
# chin points, which bracket the rendered head with a ~4 % inset so the
# faces print slightly inside their boxes and the scrape keeps its margin).
# Feet land where they land: a half/three-quarter studio crop (legs past
# the edge, ~70 % visible elder / ~61 % younger); contact shadows ground
# the cut edge. Print-local head anchors: elder (460, 205), younger (592,
# 249).
PRINT_W, PRINT_H = 1120, 512
# Knee-cut studio framing (Victorian carte-de-visite): the visible figure
# (head top to knees, shins continuing past the print edge) fills ~70 %
# of the print height; faces stay centred in the legacy head boxes so the
# torn scrape and the wall overlay keep working with zero code changes.
E_TARGET = dict(head=(460, 205), h=82)
Y_TARGET = dict(head=(592, 249), h=72)


def load_plate(variant, prefix):
    im = Image.open(PLATES / ('%s_%s.png' % (variant, prefix))).convert('RGBA')
    sc = json.loads((PLATES / ('%s_%s.json' % (variant, prefix))).read_text())
    return im, sc


def paste_figure(canvas, variant, prefix, target):
    plate, sc = load_plate(variant, prefix)
    plate_head_h = sc['head_bot_px'][1] - sc['head_top_px'][1]
    assert plate_head_h > 0, 'bad sidecar head bracket for %s' % prefix
    s = target['h'] / plate_head_h
    w, h = plate.size
    small = plate.resize((max(1, int(w * s)), max(1, int(h * s))), Image.LANCZOS)
    mid_x = (sc['head_top_px'][0] + sc['head_bot_px'][0]) / 2
    mid_y = (sc['head_top_px'][1] + sc['head_bot_px'][1]) / 2
    canvas.paste(small, (int(target['head'][0] - mid_x * s), int(target['head'][1] - mid_y * s)), small)
    feet = (target['head'][0] + (sc['feet_px'][0] - mid_x) * s,
            target['head'][1] + (sc['feet_px'][1] - mid_y) * s)
    span = (feet[1] - (target['head'][1] - target['h'] / 2)) / PRINT_H
    return s, feet, span


def contact_shadow(canvas, xy, rx, ry, alpha=60):
    sh = Image.new('L', canvas.size, 0)
    d = ImageDraw.Draw(sh)
    d.ellipse([xy[0] - rx, xy[1] - ry, xy[0] + rx, xy[1] + ry], fill=alpha)
    sh = sh.filter(ImageFilter.GaussianBlur(6))
    black = Image.new('RGB', canvas.size, (20, 14, 8))
    canvas.paste(Image.composite(black, canvas, sh), (0, 0))


def figure_geom(variant, prefix, target):
    """Paste geometry without drawing: scale, feet and paste origin.

    The framing is a half/three-quarter studio crop: legs may continue past
    the photo edge (feet beyond PRINT_H), like a Victorian carte-de-visite.
    Span is the VISIBLE figure (head top to the print edge); the shadow
    grounds the cut edge when the feet are cropped.
    """
    plate, sc = load_plate(variant, prefix)
    plate_head_h = sc['head_bot_px'][1] - sc['head_top_px'][1]
    assert plate_head_h > 0, 'bad sidecar head bracket for %s' % prefix
    s = target['h'] / plate_head_h
    mid_x = (sc['head_top_px'][0] + sc['head_bot_px'][0]) / 2
    mid_y = (sc['head_top_px'][1] + sc['head_bot_px'][1]) / 2
    origin = (int(target['head'][0] - mid_x * s), int(target['head'][1] - mid_y * s))
    feet = (target['head'][0] + (sc['feet_px'][0] - mid_x) * s,
            target['head'][1] + (sc['feet_px'][1] - mid_y) * s)
    vis_bottom = min(feet[1], PRINT_H)
    span = (vis_bottom - (target['head'][1] - target['h'] / 2)) / PRINT_H
    return s, feet, span, origin


def paste_figure(canvas, variant, prefix, target):
    plate, _sc = load_plate(variant, prefix)
    s, _, _, origin = figure_geom(variant, prefix, target)
    w, h = plate.size
    small = plate.resize((max(1, int(w * s)), max(1, int(h * s))), Image.LANCZOS)
    canvas.paste(small, origin, small)
    return s


def build_print(variant):
    pw, ph = PRINT_W, PRINT_H
    canvas, horizon = paint_backdrop(pw, ph, variant)
    # shadows first (under the boots, or grounding the cut edge when cropped)
    _, feet_e, span_e, _ = figure_geom(variant, 'E', E_TARGET)
    _, feet_y, span_y, _ = figure_geom(variant, 'Y', Y_TARGET)
    contact_shadow(canvas, (feet_e[0], min(feet_e[1], 498)), 70, 12)
    contact_shadow(canvas, (feet_y[0], min(feet_y[1], 498)), 60, 11)
    paste_figure(canvas, variant, 'E', E_TARGET)
    paste_figure(canvas, variant, 'Y', Y_TARGET)
    return canvas, dict(feet_e=feet_e, feet_y=feet_y, span_e=span_e, span_y=span_y)


def match_exposure(canvas):
    g = REF_PRINT_LUM / lum(canvas)
    g = min(1.25, max(0.80, g))
    a = np.asarray(canvas).astype(np.float32) * g
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)), g


def albumen(canvas, seed, grain_a=0.20):
    canvas = canvas.filter(ImageFilter.GaussianBlur(0.4))
    canvas = foxing(canvas, 26, seed + 7, amax=34)
    canvas = scratches(canvas, 7, seed + 11, amax=44)
    canvas = grain(canvas, sigma=6, alpha=grain_a, seed=seed + 13)
    return vignette(canvas, strength=0.38)


def mount(print_im):
    W, H = 1280, 720
    r = rng(61)
    mount_im = Image.new('RGB', (W, H), (178, 160, 126))
    d = ImageDraw.Draw(mount_im)
    for _ in range(2600):
        x, y = r.uniform(0, W), r.uniform(0, H)
        v = r.uniform(-9, 9)
        d.point((x, y), fill=(int(178 + v), int(160 + v), int(126 + v)))
    px, py, pw, ph = PHOTO_RECT
    mount_im.paste(print_im, (px, py))
    d = ImageDraw.Draw(mount_im)
    d.rectangle([px - 8, py - 8, px + pw + 8, py + ph + 8], outline=(138, 106, 62), width=3)
    d.rectangle([px - 14, py - 14, px + pw + 14, py + ph + 14], outline=(96, 78, 54), width=1)
    f1 = font(GEORGIA_B, 30)
    spaced(d, (W / 2, py + ph + 34), 'E.  VANCE', f1, (74, 58, 40), anchor='ma')
    f2 = font(GEORGIA, 21)
    spaced(d, (W / 2, py + ph + 70), 'PHOTOGRAPHIC  STUDIO,  23  COMMERCIAL  STREET,  LONDON,  E.',
           f2, (88, 70, 50), anchor='ma')
    mount_im = foxing(mount_im, 20, 61 + 23, amax=40)
    return grain(mount_im, sigma=4, alpha=0.10, seed=61 + 29)


def paint_torn(photo):
    """Same sitting, elder boy's face scraped away (chapter 3). Same polygon
    as the v1 generator so wall and close-up keep telling one story."""
    im = photo.copy()
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
        d.line([x0, cy - ry * 1.3, x0 + rx * 0.35, cy + ry * 1.3], fill=(122, 112, 96, 255), width=5)
        d.line([x0 - 2, cy - ry * 1.3, x0 + rx * 0.35 - 2, cy + ry * 1.3], fill=(228, 220, 202, 255), width=2)
    out = im.convert('RGB')
    return grain(out, sigma=5, alpha=0.12, seed=99)


def build_photo(variant):
    canvas, info = build_print(variant)
    canvas, gain = match_exposure(canvas)
    v = VARIANTS[variant]
    return mount(albumen(canvas, seed=v['seed'], grain_a=v['grain_a'])), gain, info


# ------------------------------------------------------------ wall sprite
# Miniature for the 110x84 frame: backdrop bands + the same Blender plates
# downscaled, elder head pinned at SPRITE_HEAD so the c3 overlay fits.
# Sprite heads print 16/14 px tall (same elder size as before, so the fixed
# overlay keeps covering the whole face with margin); feet follow.
WALL_W, WALL_H = 110, 84
SPR_E = dict(head=(36, 32), h=16)
SPR_Y = dict(head=(62, 30), h=14)


def build_wall(variant):
    w, h = WALL_W, WALL_H
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    glow = 1 - 0.20 * (((xx - w * 0.46) / w) ** 2 + ((yy - h * 0.42) / h) ** 2)
    a = np.stack([np.full((h, w), 138.0) * glow,
                  np.full((h, w), 116.0) * glow,
                  np.full((h, w), 86.0) * glow], axis=-1)
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    d.rectangle([8, 8, w - 9, 30], fill=(120, 100, 72))
    d.rectangle([8, 30, w - 9, h - 9], fill=(104, 86, 62))
    paste_figure(im, variant, 'E', SPR_E)
    paste_figure(im, variant, 'Y', SPR_Y)
    im = im.filter(ImageFilter.GaussianBlur(0.6))
    g = REF_SPRITE_LUM / lum(im)
    g = min(1.25, max(0.80, g))
    im = Image.fromarray(np.clip(np.asarray(im).astype(np.float32) * g, 0, 255).astype(np.uint8))
    im = grain(im, sigma=5, alpha=0.22, seed=5)
    im = vignette(im, strength=0.45)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w - 1, h - 1], outline=(58, 42, 22), width=5)
    d.rectangle([5, 5, w - 6, h - 6], outline=(138, 106, 62), width=1)
    return im, g


def save_jpg(im, path, quality=84):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, quality=quality, optimize=True)
    return path.stat().st_size


def faces3x(photo):
    out = {}
    for name, (cx, cy, rx, ry) in (('elder', ELDER_HEAD), ('young', YOUNG_HEAD)):
        crop = photo.crop((cx - rx, cy - ry, cx + rx, cy + ry))
        out[name] = crop.resize((crop.width * 3, crop.height * 3), Image.LANCZOS)
    return out


def mouth_teeth(photo):
    """Anti-grin guard: a solemn Victorian mouth is a closed dark line, never
    teeth. Fraction of very bright pixels in the mouth band of each face
    (the v2 iteration-1 grin measured 0.031/0.025 here)."""
    a = np.asarray(photo.convert('RGB')).astype(float)
    L = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    out = {}
    for who, (cx, cy, rx, ry) in (('elder', ELDER_HEAD), ('young', YOUNG_HEAD)):
        band = L[cy + int(ry * 0.28):cy + int(ry * 0.72),
                 cx - int(rx * 0.87):cx + int(rx * 0.87)]
        out[who] = float((band > 190).mean())
    return out


def run_candidates():
    cand = TASK_V2 / 'candidates'
    cand.mkdir(parents=True, exist_ok=True)
    for variant in ('A', 'B', 'C'):
        photo, gain, info = build_photo(variant)
        small = photo.resize((640, 360), Image.LANCZOS)
        small.save(cand / ('cand%s_640.png' % variant), optimize=True)
        for name, face in faces3x(photo).items():
            face.save(cand / ('cand%s_%s_3x.png' % (variant, name)), optimize=True)
        print('CAND %s gain=%.3f closeup_lum=%.1f span_e=%.3f span_y=%.3f teeth=%s bytes=%d' % (
            variant, gain, lum(photo), info['span_e'], info['span_y'],
            {k: round(v, 4) for k, v in mouth_teeth(photo).items()},
            (cand / ('cand%s_640.png' % variant)).stat().st_size))


def eye_metrics(photo):
    """Thomas-language eye guard: each eye box must hold a small dark dot
    clearly below cheek skin, must NOT be a black hollow, and must hold
    NO plush white (no eyeballs, no sclera, no shine). Returns dict;
    asserts live in run_final."""
    a = np.asarray(photo.convert('RGB')).astype(float)
    L = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    out = {}
    for who, (cx, cy, rx, ry) in (('elder', ELDER_HEAD), ('young', YOUNG_HEAD)):
        eye = L[cy - ry // 2:cy + ry // 2, cx - rx:cx + rx]
        cheek = L[cy + ry:cy + ry + 24, cx - rx:cx - rx // 3]
        out[who] = dict(eye_min=float(eye.min()), eye_mean=float(eye.mean()),
                        cheek_mean=float(cheek.mean()),
                        bright_frac=float((eye > 170).mean()))
    return out


def run_final(favorite):
    photo, gain, info = build_photo(favorite)
    torn = paint_torn(photo)
    wall, wgain = build_wall(favorite)
    assert wall.size == (WALL_W, WALL_H), wall.size
    # framing: the visible figures must fill ~65-75 % (elder) of the print
    # height (the defect being fixed). The crop is deliberate: both pairs of
    # feet continue well past the photo edge (never a grazing cut), so the
    # carte-de-visite reads as composed, not clipped by accident.
    assert 0.63 <= info['span_e'] <= 0.78, 'elder framing off: %.3f' % info['span_e']
    assert info['span_y'] >= 0.45, 'younger figure lost: %.3f' % info['span_y']
    assert info['feet_e'][1] >= 540, 'elder crop grazes the boots: %.1f' % info['feet_e'][1]
    assert info['feet_y'][1] >= 540, 'younger crop grazes the boots: %.1f' % info['feet_y'][1]
    teeth = mouth_teeth(photo)
    print('TEETH', {k: round(v, 4) for k, v in teeth.items()})
    for who in ('elder', 'young'):
        assert teeth[who] < 0.010, '%s mouth shows bright teeth/grin: %.4f' % (who, teeth[who])
    hx, hy, hrx, hry = SPRITE_HEAD
    head_px = np.asarray(wall.crop((hx - hrx, hy - hry, hx + hrx, hy + hry))).astype(int)
    # two-tone head check: dark hair cap over a pale face band, so the c3
    # scratch overlay in room.js drawNear lands on a real head, not the wall
    top_r = head_px[:hry, :, 0].mean()
    bot_r = head_px[hry:, :, 0].mean()
    assert bot_r > 105, 'sprite face not pale - overlay would miss: %.1f' % bot_r
    assert top_r < bot_r, 'sprite head upside down/misplaced: %.1f vs %.1f' % (top_r, bot_r)
    lc, lt = lum(photo), lum(torn)
    assert 104.6 <= lc <= 141.5, 'closeup luminance out of band: %.1f' % lc
    assert 70.1 <= lum(wall) <= 94.9, 'sprite luminance out of band: %.1f' % lum(wall)
    em = eye_metrics(photo)
    print('EYES', em)
    for who in ('elder', 'young'):
        m = em[who]
        assert m['eye_min'] < m['cheek_mean'] - 8, '%s eye has no dark core' % who
        assert m['eye_mean'] > m['cheek_mean'] - 40, '%s eye is a black hollow' % who
        assert m['bright_frac'] < 0.10, '%s eye shows plush white' % who
    n1 = save_jpg(photo, CLOSEUPS / 'room_photo.jpg')
    n2 = save_jpg(torn, CLOSEUPS / 'room_photo_torn.jpg')
    wall.save(PROPS / 'room_photo.png', optimize=True)
    print('FINAL fav=%s gain=%.3f/%.3f lum=%.1f/%.1f/%.1f span=%.3f/%.3f bytes=%d/%d/%d' % (
        favorite, gain, wgain, lc, lt, lum(wall), info['span_e'], info['span_y'],
        n1, n2, (PROPS / 'room_photo.png').stat().st_size))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--mode', choices=('candidates', 'final'), default='candidates')
    ap.add_argument('--favorite', default='B')
    args = ap.parse_args()
    if args.mode == 'candidates':
        run_candidates()
    else:
        assert args.favorite in VARIANTS, args.favorite
        run_final(args.favorite)


if __name__ == '__main__':
    main()
