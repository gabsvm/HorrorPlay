"""Shelf-zone mean luminance for Greaves delivery C (v2).

Run (from the repository root):
  python web/art_review/greaves_study/v2/scripts/measure_shelf.py [before|after|both]

Reads the regenerable 640x360 engine captures in v2/work/<label>/ and
prints the mean Rec.709 luminance over fixed screen crops. The same
crops apply to every label, so before/after differ only in the art.
Gate (task C): the AFTER shelf mean must stay within +15 % of the
BEFORE (approved T3b tone) mean.
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / "work"

# Shelf-centred frame (player x=450): shelves fill the left-centre.
# x 40..280, y 40..280 covers the four shelf boards and their jars,
# clear of the edge vignette and of the bright chart/window at x > 300.
SHELF_CROP = (40, 40, 280, 280)
# Desk frame (player x=700, the T3b reference framing): shelves are at the
# left edge; x 0..150, y 40..280 is what that framing shows of them.
DESK_CROP = (0, 40, 150, 280)


def mean_l(path, crop):
    im = Image.open(path).convert("RGB").crop((*crop[:2], crop[2], crop[3]))
    px = list(im.getdata())
    return sum(0.2126 * r + 0.7152 * g + 0.0722 * b for r, g, b in px) / len(px)


def shelf_repeats(label):
    d = WORK / label
    out = [d / "greaves_shelf_640x360.png"]
    out += sorted(d.glob("greaves_shelf_r*_640x360.png"))
    return [p for p in out if p.exists()]


def main():
    which = sys.argv[1] if len(sys.argv) > 1 else "both"
    labels = ["before", "after"] if which == "both" else [which]
    base = None
    for label in labels:
        reps = shelf_repeats(label)
        assert reps, f"no shelf captures in {WORK / label} (run capture_jars.mjs {label})"
        vals = [mean_l(p, SHELF_CROP) for p in reps]
        avg = sum(vals) / len(vals)
        desk = WORK / label / "greaves_desk_640x360.png"
        desk_l = mean_l(desk, DESK_CROP)
        print(f"{label}: shelf frames={len(reps)} " +
              " ".join(f"{v:.2f}" for v in vals) +
              f" mean={avg:.2f} desk_crop={desk_l:.2f}")
        if label == "before":
            base = avg
        elif base is not None:
            print(f"gate: after/before = {avg / base:.3f} "
                  f"({'PASS <= 1.15' if avg <= base * 1.15 else 'FAIL > +15 %'}), "
                  f"delta = {avg - base:+.2f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
