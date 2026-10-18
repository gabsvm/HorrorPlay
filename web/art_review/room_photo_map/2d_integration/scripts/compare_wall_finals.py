# Safe numeric + visual comparison of regenerated wall-sprite candidates
# against the production PNGs. READ-ONLY: never writes web/assets/props/.
# Exit 0 when both finals match production exactly, else 1 with a report
# (mismatch means: report it, do NOT publish over production).
#
# Usage (paths are relative to this script, no personal paths):
#   python web/art_review/room_photo_map/2d_integration/scripts/make_wall_photo.py
#   python web/art_review/room_photo_map/2d_integration/scripts/compare_wall_finals.py
import os
import sys
from PIL import Image
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
TASK = os.path.dirname(HERE)
WEB = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
CAND = os.path.join(TASK, "work", "candidates")
PROD = os.path.join(WEB, "assets", "props")

PAIRS = [
    ("room_photo_final.png", "room_photo.png"),
    ("room_photo_torn_final.png", "room_photo_torn.png"),
]


def stats(path):
    im = Image.open(path)
    a = np.asarray(im).astype(float)
    rgb = np.asarray(im.convert("RGB")).astype(float)
    lum = 0.2126 * rgb[:, :, 0] + 0.7152 * rgb[:, :, 1] + 0.0722 * rgb[:, :, 2]
    alpha = a[:, :, 3] if a.shape[2] == 4 else np.full(lum.shape, 255.0)
    return im, lum.mean(), (alpha > 8).mean(), alpha


def main():
    ok = True
    for cand_name, prod_name in PAIRS:
        cp, pp = os.path.join(CAND, cand_name), os.path.join(PROD, prod_name)
        if not os.path.isfile(cp):
            print("MISSING candidate (run make_wall_photo.py first): " + cp)
            return 1
        cim, cmean, ccov, calpha = stats(cp)
        pim, pmean, pcov, palpha = stats(pp)
        print("%s vs %s" % (cand_name, prod_name))
        print("  candidate: %dx%d %s mean=%.2f alpha-cover=%.4f" % (
            cim.size[0], cim.size[1], cim.mode, cmean, ccov))
        print("  product:   %dx%d %s mean=%.2f alpha-cover=%.4f" % (
            pim.size[0], pim.size[1], pim.mode, pmean, pcov))
        for label, cond in (("70x92 RGBA", cim.size == (70, 92) and cim.mode == "RGBA"),
                            ("70x92 RGBA (prod)", pim.size == (70, 92) and pim.mode == "RGBA"),
                            ("effective alpha", ccov > 0.5 and ccov < 1.0)):
            print("  [%s] %s" % ("ok" if cond else "FAIL", label))
            ok = ok and cond
        if cim.size != pim.size or cim.mode != pim.mode:
            print("  FAIL geometry/mode drift: not comparable, NOT publishing")
            ok = False
            continue
        ca = np.asarray(cim).astype(float)
        pa = np.asarray(pim).astype(float)
        d = np.abs(ca - pa)
        print("  pixel diff: mean=%.4f/255 max=%.0f/255" % (d.mean(), d.max()))
        if d.max() != 0:
            print("  INFORME: differs from production; do NOT copy over assets")
            ok = False
        else:
            print("  [ok] byte-identical to production")
    # Side-by-side for the eyeball check (temp work dir, never production).
    try:
        tiles = []
        for cand_name, prod_name in PAIRS:
            c = Image.open(os.path.join(CAND, cand_name)).convert("RGB")
            p = Image.open(os.path.join(PROD, prod_name)).convert("RGB")
            tile = Image.new("RGB", (c.size[0] * 2 + 8, c.size[1]), (200, 30, 30))
            tile.paste(c, (0, 0))
            tile.paste(p, (c.size[0] + 8, 0))
            tiles.append(tile)
        sheet = Image.new("RGB", (max(t.size[0] for t in tiles),
                                  sum(t.size[1] for t in tiles) + 8), (200, 30, 30))
        y = 0
        for t in tiles:
            sheet.paste(t, (0, y))
            y += t.size[1] + 8
        sheet = sheet.resize((sheet.size[0] * 4, sheet.size[1] * 4), Image.NEAREST)
        out = os.path.join(CAND, "compare_finals_vs_prod.png")
        sheet.save(out)
        print("  visual: " + os.path.relpath(out, TASK) + " (left=candidate, right=production)")
    except Exception as e:  # visual aid only; numeric verdict stands
        print("  visual sheet skipped: %s" % e)
    print("MATCH" if ok else "MISMATCH (reported, production untouched)")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
