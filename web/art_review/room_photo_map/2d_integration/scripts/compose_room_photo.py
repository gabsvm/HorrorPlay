# Room photograph close-ups from the 2D illustration candidates (16-oct pass).
# Regenerates web/assets/closeups/room_photo.jpg (c1, intact) and
# room_photo_torn.jpg (c3/c4, scraped) from the untouched third-party sources
# in ../../source/. The sources stay intact; this script only reads them.
#
# Recipe (same geometry and grade for both images, so the boys do not move):
#   - clean card cutout: near-white background threshold, morphological close,
#     feathered edge; the rounded cardboard corners land on the dark close-up
#     background, never on white.
#   - uniform scale (Lanczos), card height 604/720 px, centered on a dark warm
#     table background (vertical gradient + sheen + faint cloth bands + grain +
#     vignette + drop shadow), all seeded and deterministic.
#   - climate: highlight compression on luminance (keeps the albumen hue) plus
#     a warm multiply, so the ~188 cream cardboard drops to ~110 without
#     going sticker-white or modern; grain and emulsion marks are preserved.
#   - background-only servo: the card keeps absolute graded values while the
#     background gain is bisected so the c1 canvas lands on TARGET_MEAN.
#
# Usage (paths are relative to this script, no personal paths):
#   python web/art_review/room_photo_map/2d_integration/scripts/compose_room_photo.py
import os
import sys
from PIL import Image, ImageFilter
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
TASK = os.path.dirname(HERE)
SOURCE = os.path.join(TASK, "source")
WEB = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
OUT_C1 = os.path.join(WEB, "assets", "closeups", "room_photo.jpg")
OUT_C3 = os.path.join(WEB, "assets", "closeups", "room_photo_torn.jpg")

SRC1 = os.path.join(SOURCE, "01_foto_limpia_thomas_nat.png")
SRC2 = os.path.join(SOURCE, "02_foto_raspada_thomas_nat.png")

W, H = 1280, 720
CARD_H = 604  # ~84% of 720: inside the required 80-88% band, no stretching
BG_WHITE = 242  # source background is paper white; the card edge is far below
CLOSE_R = 15  # morphological closing diameter for interior pinholes
FEATHER = 1.5  # edge softness (px) so the cut never looks pasted
HL_COMPRESS = 0.50  # highlight compression strength on luminance
WARM = np.array([1.02, 0.94, 0.84])  # warm multiply after compression
BG_SEED = 7
JPEG_QUALITY = 84
TARGET_MEAN = 112.0  # inside the approved 120 +-15% band (102-138)


def lum(a):
    return 0.2126 * a[:, :, 0] + 0.7152 * a[:, :, 1] + 0.0722 * a[:, :, 2]


def grade(im):
    x = im / 255.0
    l = 0.2126 * x[:, :, 0] + 0.7152 * x[:, :, 1] + 0.0722 * x[:, :, 2]
    f = 1.0 - HL_COMPRESS * np.clip(l, 0, 1) ** 2
    return np.clip(x * f[:, :, None] * WARM, 0, 1) * 255.0


def background():
    rng = np.random.default_rng(BG_SEED)
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    top = np.array([168.0, 136.0, 102.0])
    bot = np.array([118.0, 95.0, 71.0])
    t = (yy / (H - 1))[:, :, None]
    bg = top[None, None, :] * (1 - t) + bot[None, None, :] * t
    cx, cy = W / 2, H * 0.46
    d2 = ((xx - cx) / 380.0) ** 2 + ((yy - cy) / 300.0) ** 2
    bg = bg + 12.0 * np.exp(-d2)[:, :, None]
    bg = bg + 1.2 * np.sin(yy / 9.0 + 1.7)[:, :, None] * np.array([1.0, 0.9, 0.8])
    bg = bg + rng.normal(0, 2.6, (H, W, 3))
    d2c = ((xx - cx) / (W * 0.62)) ** 2 + ((yy - cy) / (H * 0.62)) ** 2
    vig = np.clip(1.0 - 0.60 * np.clip(d2c, 0, 1) ** 1.4, 0, 1)
    return np.clip(bg * vig[:, :, None], 0, 255)


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


def main():
    for p in (SRC1, SRC2):
        if not os.path.isfile(p):
            print("missing source: " + p)
            return 1
    im1 = Image.open(SRC1).convert("RGB")
    im2 = Image.open(SRC2).convert("RGB")
    # One mask from the intact source rules both crops: 01 and 02 share the
    # same base geometry (verified: mean abs diff outside the damage ~0.7/255),
    # so the boys cannot shift between c1 and c3.
    hard, soft = card_mask(im1)
    ys, xs = np.where(hard > 0.5)
    HH, WW = hard.shape
    pad = 6
    x0, x1 = max(0, xs.min() - pad), min(WW - 1, xs.max() + pad)
    y0, y1 = max(0, ys.min() - pad), min(HH - 1, ys.max() + pad)
    cw, ch = x1 - x0 + 1, y1 - y0 + 1
    s = CARD_H / ch
    nw = round(cw * s)
    ox, oy = (W - nw) // 2, (H - CARD_H) // 2
    print("crop x=%d y=%d w=%d h=%d scale=%.4f card=%dx%d at=(%d,%d)" % (
        x0, y0, cw, ch, s, nw, CARD_H, ox, oy))

    cards, alphas = {}, {}
    for name, im in (("c1", im1), ("c3", im2)):
        cards[name] = grade(
            np.asarray(im.crop((x0, y0, x1 + 1, y1 + 1)).resize((nw, CARD_H), Image.LANCZOS)).astype(float))
        alphas[name] = np.asarray(
            Image.fromarray((soft[y0:y1 + 1, x0:x1 + 1] * 255).astype(np.uint8)
                            ).resize((nw, CARD_H), Image.LANCZOS)
        ).astype(float) / 255.0
    # Drop shadow from the shared c1 silhouette: identical offset for both.
    shadow = np.asarray(
        Image.fromarray((alphas["c1"] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(9))
    ).astype(float) / 255.0 * 0.55
    bg0 = background()

    def compose(name, bg_gain):
        bg = np.clip(bg0 * bg_gain, 0, 255)
        canvas = bg.copy()
        dx, dy = 7, 9
        sy0, sy1 = oy + dy, oy + dy + CARD_H
        sx0, sx1 = ox + dx, ox + dx + nw
        yy0, yy1 = max(0, sy0), min(H, sy1)
        xx0, xx1 = max(0, sx0), min(W, sx1)
        canvas[yy0:yy1, xx0:xx1] *= (
            1 - shadow[yy0 - sy0:yy1 - sy0, xx0 - sx0:xx1 - sx0][:, :, None])
        a3 = alphas[name][:, :, None]
        canvas[oy:oy + CARD_H, ox:ox + nw] = (
            canvas[oy:oy + CARD_H, ox:ox + nw] * (1 - a3) + cards[name] * a3)
        return np.clip(canvas, 0, 255)

    lo, hi = 0.5, 2.5
    for _ in range(32):
        mid = (lo + hi) / 2
        if lum(compose("c1", mid)).mean() < TARGET_MEAN:
            lo = mid
        else:
            hi = mid
    bg_gain = (lo + hi) / 2
    print("background servo gain=%.4f target=%.1f" % (bg_gain, TARGET_MEAN))

    ok = True
    for name, out_path in (("c1", OUT_C1), ("c3", OUT_C3)):
        out = compose(name, bg_gain)
        L = lum(out)
        Image.fromarray(out.astype(np.uint8)).save(
            out_path, quality=JPEG_QUALITY, optimize=True)
        size = os.path.getsize(out_path)
        mean = L.mean()
        print("%s -> %s mean=%.1f (band 102-138) p5=%.0f p95=%.0f max=%.0f %dKB" % (
            name, os.path.relpath(out_path, WEB), mean,
            np.percentile(L, 5), np.percentile(L, 95), L.max(), size // 1024))
        if not 102.0 <= mean <= 138.0:
            print("FAIL luminance band")
            ok = False

    # Damage report on the composed 1280x720 canvases (pre-JPEG): the pipeline
    # is identical for both, so any difference is damage carried by source 02.
    cv1 = compose("c1", bg_gain)
    cv3 = compose("c3", bg_gain)
    d = np.abs(cv1 - cv3).mean(axis=2)
    dm = Image.fromarray(((d > 25) * 255).astype(np.uint8)
                         ).filter(ImageFilter.MaxFilter(17))
    big = np.asarray(dm) > 127
    print("damage: frac=%.4f inside=%.1f outside=%.2f (composed canvas)" % (
        big.mean(), d[big].mean(), d[~big].mean()))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
