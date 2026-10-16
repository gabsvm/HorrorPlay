"""T4b tone check: mean luminance in the same engine crops before/after.

Run: python web/art_review/hanbury_yard/scripts/check_tone.py
Reads comparison/work/before|after/hanbury_x<spot>_640x360.png (real engine
captures from capture_hanbury.mjs). Pass when every AFTER crop is no more
than 15% above its BEFORE crop. Rain is animated, so crops are tight on
each prop and the bar is a ratio, not pixel equality. Exit nonzero on fail.
"""
from pathlib import Path
import sys
from PIL import Image
import numpy as np

WORK = Path(__file__).resolve().parent.parent / "comparison" / "work"

# (name, frame file, x, y, w, h): tight boxes on prop pixels only
# (positions verified by drawing them over the captures; see REPORT).
BOXES = [
    ("tub", "hanbury_x500_640x360.png", 156, 260, 40, 50),
    ("tap-sink", "hanbury_x1650_640x360.png", 392, 275, 100, 48),
    ("tap-pipe", "hanbury_x1650_640x360.png", 412, 200, 24, 72),
    ("privy-door", "hanbury_x1650_640x360.png", 586, 205, 44, 115),
    ("privy-roof", "hanbury_x1650_640x360.png", 560, 168, 80, 28),
]


def lum(im):
    a = np.array(im.convert("RGB")).astype(float)
    return 0.2126 * a[:, :, 0] + 0.7152 * a[:, :, 1] + 0.0722 * a[:, :, 2]


fails = []
print("T4b tone check (BEFORE procedural vs AFTER fixed sprites):")
for name, frame, x, y, w, h in BOXES:
    b = lum(Image.open(WORK / "before" / frame).crop((x, y, x + w, y + h))).mean()
    a = lum(Image.open(WORK / "after" / frame).crop((x, y, x + w, y + h))).mean()
    ratio = a / b - 1
    ok = ratio <= 0.15
    fails += [] if ok else [name]
    print(f"  {name:11s} box {(x, y, w, h)} before={b:5.1f} after={a:5.1f} {ratio:+7.1%} {'OK' if ok else 'FAIL'}")

if fails:
    print("RESULT FAIL:", ", ".join(fails))
    sys.exit(1)
print("RESULT PASS: every crop within +15%")
