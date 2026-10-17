# Wall sprite of the room photograph for ENTREGA B (2D).
# Builds small framed wall sprites (with real alpha) from the untouched
# third-party candidates in ../../source/. The sources are never modified.
#
# Pipeline (same geometry and grade for every variant, so they are comparable):
#   - card cutout: near-white background threshold, morphological close,
#     feathered edge (rounded cardboard corners land on the dark frame, never
#     on white: no keyed-color halo).
#   - grade: highlight compression on luminance (keeps the albumen hue) plus a
#     warm multiply, then a linear servo so the whole framed sprite lands on
#     TARGET_MEAN (~75, the measured mean of the sprite it replaces).
#   - Lanczos downscale to the wall size + light thumbnail sharpening.
#   - dark walnut frame painted UNDER the card (solid rounded rect, so no wall
#     pixel shows through edge gaps), with a faint top/left relief light.
#
# Usage (paths are relative to this script, no personal paths):
#   python web/art_review/room_photo_map/2d_integration/scripts/make_wall_photo.py
# Output: work/candidates/room_photo_<tag>.png + room_photo_torn_<tag>.png
#   (from 02 with the same transform), plus metrics on stdout.
import os
from PIL import Image, ImageFilter, ImageDraw
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
TASK = os.path.dirname(HERE)
SOURCE = os.path.join(TASK, "source")
OUT = os.path.join(TASK, "work", "candidates")

CANDIDATES = {
    "03": "03_sprite_pared_foto.png",
    "05": "05_sprite_pared_foto_alto_contraste.png",
    "07": "07_sprite_pared_foto_pixel_safe.png",
}
TORN_SRC = "02_foto_raspada_thomas_nat.png"

BG_WHITE = 242
CLOSE_R = 15
FEATHER = 1.5
HL_COMPRESS = 0.50
WARM = np.array([1.02, 0.94, 0.84])
TARGET_MEAN = 75.0  # measured mean of the replaced wall sprite (75 +-15%)
CARD_H = 84  # card height inside the frame; total sprite height ~92
FRAME = 4  # dark walnut border top/bottom (sides vary: the card is centered)
CORNER = 7  # outer corner radius at final size
FINAL_W, FINAL_H = 70, 92  # both final sprites share one canvas, one placement
CREAM_LUM = 160.0  # photo-area pixels (tone-match stats) live below this


def lum(a):
    return 0.2126 * a[:, :, 0] + 0.7152 * a[:, :, 1] + 0.0722 * a[:, :, 2]


def grade(im):
    x = im / 255.0
    l = 0.2126 * x[:, :, 0] + 0.7152 * x[:, :, 1] + 0.0722 * x[:, :, 2]
    f = 1.0 - HL_COMPRESS * np.clip(l, 0, 1) ** 2
    return np.clip(x * f[:, :, None] * WARM, 0, 1) * 255.0


def card_mask(src_img):
    a = np.asarray(src_img).astype(float)
    white = (a[:, :, 0] > BG_WHITE) & (a[:, :, 1] > BG_WHITE) & (a[:, :, 2] > BG_WHITE)
    m = Image.fromarray((~white).astype(np.uint8) * 255)
    m = m.filter(ImageFilter.MaxFilter(CLOSE_R)).filter(ImageFilter.MinFilter(CLOSE_R))
    hard = (np.asarray(m) > 127).astype(float)
    soft = np.asarray(
        Image.fromarray((hard * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(FEATHER))
    ).astype(float) / 255.0
    return hard, soft


def frame_layer(w, h):
    top = np.array([74.0, 52.0, 32.0])
    bot = np.array([44.0, 30.0, 18.0])
    yy = (np.mgrid[0:h, 0:w][0] / max(1, h - 1))[:, :, None]
    fr = top[None, None, :] * (1 - yy) + bot[None, None, :] * yy
    fr[0:2, :, :] += 10.0  # faint relief light on the top edge
    fr[:, 0:2, :] += 6.0
    return fr


def zncc_offset(big, small, dx_range, dy_range):
    # Zero-mean normalized cross-correlation on luminance: robust to the
    # different tone curves of the candidates. Returns (dx, dy, score).
    b = lum(np.asarray(big).astype(float))
    s = lum(np.asarray(small).astype(float))
    sh, sw = s.shape
    s0 = s - s.mean()
    best = (0, 0, -2.0)
    for dy in dy_range:
        for dx in dx_range:
            if dy + sh > b.shape[0] or dx + sw > b.shape[1]:
                continue
            w = b[dy:dy + sh, dx:dx + sw] - b[dy:dy + sh, dx:dx + sw].mean()
            score = (w * s0).sum() / np.sqrt((w * w).sum() * (s0 * s0).sum() + 1e-9)
            if score > best[2]:
                best = (dx, dy, score)
    return best


def tone_match(torn_card, ref_card):
    # Per-channel CDF match of the photo area (cream and the bright scrape
    # excluded by CREAM_LUM), so the c3 wall keeps the c1 tone curve and only
    # the scrape changes. Same hue family, same contrast, no warp needed.
    out = torn_card.copy()
    for c in range(3):
        t, r = torn_card[:, :, c], ref_card[:, :, c]
        lt = lum(torn_card) < CREAM_LUM
        lr = lum(ref_card) < CREAM_LUM
        ht, _ = np.histogram(t[lt], bins=256, range=(0, 255))
        hr, _ = np.histogram(r[lr], bins=256, range=(0, 255))
        ct = np.cumsum(ht) / max(1, lt.sum())
        cr = np.cumsum(hr) / max(1, lr.sum())
        table = np.searchsorted(cr, ct)
        out[:, :, c] = table[np.clip(t, 0, 255).astype(int)]
    return out


def build_sprite(card_full, alpha_full, box, name, canvas_w=None, ref_card=None):
    x0, y0, x1, y1 = box
    cw, ch = x1 - x0 + 1, y1 - y0 + 1
    s = CARD_H / ch
    nw = round(cw * s)
    raw = np.asarray(card_full.crop((x0, y0, x1 + 1, y1 + 1)
                                    ).resize((nw, CARD_H), Image.LANCZOS)).astype(float)
    card = grade(raw)
    if ref_card is not None:
        card = tone_match(card, ref_card)
    alpha = np.asarray(
        Image.fromarray((alpha_full[y0:y1 + 1, x0:x1 + 1] * 255).astype(np.uint8)
                        ).resize((nw, CARD_H), Image.LANCZOS)).astype(float) / 255.0
    if canvas_w is None:
        canvas_w = nw + FRAME * 2
    ox = (canvas_w - nw) // 2
    W, H = canvas_w, CARD_H + FRAME * 2
    # Rounded-corner silhouette for the whole framed sprite.
    sil = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sil).rounded_rectangle([0, 0, W - 1, H - 1], radius=CORNER, fill=255)
    sil = sil.filter(ImageFilter.GaussianBlur(0.6))
    sil_a = np.asarray(sil).astype(float) / 255.0
    fr = frame_layer(W, H)
    # Paste the graded card over the solid frame: edge gaps (if any) show dark
    # wood, never wall white.
    canvas = fr.copy()
    a3 = alpha[:, :, None]
    canvas[FRAME:FRAME + CARD_H, ox:ox + nw, :] = (
        card * a3 + fr[FRAME:FRAME + CARD_H, ox:ox + nw, :] * (1 - a3))
    sprite = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8))
    sprite = sprite.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    # Servo the whole framed sprite (card + frame) onto TARGET_MEAN.
    arr = np.asarray(sprite).astype(float)
    m = lum(arr).mean()
    arr = np.clip(arr * (TARGET_MEAN / m), 0, 255)
    out = Image.fromarray(arr.astype(np.uint8))
    out.putalpha(Image.fromarray((sil_a * 255).astype(np.uint8)))
    print("%s: sprite %dx%d card %dx%d scale=%.4f pre-servo-mean=%.1f final-mean=%.1f" % (
        name, W, H, nw, CARD_H, s, m, lum(np.asarray(out.convert("RGB")).astype(float)).mean()))
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    intact = {tag: Image.open(os.path.join(SOURCE, fn)).convert("RGB")
              for tag, fn in CANDIDATES.items()}
    torn = Image.open(os.path.join(SOURCE, TORN_SRC)).convert("RGB")
    for p in list(intact.values()) + [torn]:
        assert p.size == (1448, 1086), p.size
    # Each source gets its own tight box (same method): the candidates are
    # reframed differently (05/07 tighter than 03), so sharing one box would
    # clip 02's photo area. The recipe (mask, grade, size, frame) is shared.
    boxes = {}
    for tag, im in list(intact.items()) + [("torn", torn)]:
        hard, _ = card_mask(im)
        ys, xs = np.where(hard > 0.5)
        pad = 6
        boxes[tag] = (max(0, xs.min() - pad), max(0, ys.min() - pad),
                      min(im.size[0] - 1, xs.max() + pad), min(im.size[1] - 1, ys.max() + pad))
        print(tag, "crop x=%d y=%d w=%d h=%d ratio=%.3f" % (
            boxes[tag][0], boxes[tag][1], boxes[tag][2] - boxes[tag][0] + 1,
            boxes[tag][3] - boxes[tag][1] + 1,
            (boxes[tag][2] - boxes[tag][0] + 1) / (boxes[tag][3] - boxes[tag][1] + 1)))
    for tag, im in intact.items():
        _, soft = card_mask(im)
        sp = build_sprite(im, soft, boxes[tag], "room_photo_" + tag)
        sp.save(os.path.join(OUT, "room_photo_%s.png" % tag))
    # Finals: the chosen candidate (05) and the torn sprite from 02. The two
    # framings share one scale but different crops, so 02 is registered onto
    # 05's window (ZNCC, coarse-to-fine) and tone-matched to the intact card:
    # c1/c3 differ only in the scrape. Both share one FINAL_W x FINAL_H
    # canvas: one placement, one hotspot fit.
    x0, y0, x1, y1 = boxes["05"]
    w05, h05 = x1 - x0 + 1, y1 - y0 + 1
    card05 = intact["05"].crop((x0, y0, x1 + 1, y1 + 1))
    tx0, ty0, tx1, ty1 = boxes["torn"]
    card02 = torn.crop((tx0, ty0, tx1 + 1, ty1 + 1))
    c5 = card05.resize((w05 // 4, h05 // 4), Image.LANCZOS)
    c2 = card02.resize((card02.size[0] // 4, card02.size[1] // 4), Image.LANCZOS)
    cdx, cdy, cs = zncc_offset(c2, c5, range(0, c2.size[0] - c5.size[0] + 1), range(0, 9))
    dx, dy, fs = zncc_offset(card02, card05,
                             range(max(0, cdx * 4 - 4), cdx * 4 + 5),
                             range(max(0, cdy * 4 - 4), cdy * 4 + 5))
    print("register 02->05 coarse=(%d,%d,%.4f) fine=(%d,%d,%.4f)" % (cdx, cdy, cs, dx, dy, fs))
    reg02 = card02.crop((dx, dy, dx + w05, dy + h05))
    _, soft05 = card_mask(intact["05"])
    x0, y0, x1, y1 = boxes["05"]
    ref = grade(np.asarray(intact["05"].crop(
        (x0, y0, x1 + 1, y1 + 1)).resize(
        (round((x1 - x0 + 1) * (CARD_H / (y1 - y0 + 1))), CARD_H),
        Image.LANCZOS)).astype(float))
    sp = build_sprite(intact["05"], soft05, boxes["05"], "room_photo_final",
                      canvas_w=FINAL_W)
    sp.save(os.path.join(OUT, "room_photo_final.png"))
    _, soft_t = card_mask(torn)
    box_reg = (tx0 + dx, ty0 + dy, tx0 + dx + w05 - 1, ty0 + dy + h05 - 1)
    sp = build_sprite(torn, soft_t, box_reg, "room_photo_torn_final",
                      canvas_w=FINAL_W, ref_card=ref)
    sp.save(os.path.join(OUT, "room_photo_torn_final.png"))
    print("wrote", OUT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
