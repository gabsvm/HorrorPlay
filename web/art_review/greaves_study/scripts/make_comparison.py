"""Side-by-side before/after contact sheet for the Greaves study (T3).

Run: python web/art_review/greaves_study/scripts/make_comparison.py

Reads work/before + work/after 640x360 desk captures (regenerable via
capture_greaves.mjs) and writes comparison/AB_greaves_640.png, the only
screenshot kept in the repo. The desk frame carries three of the four new
props (skull, microscope, shelf jars); the cabinet is covered by the
cabinet frame (verified numerically, regenerable, not kept).
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BEFORE = ROOT / "work" / "before" / "greaves_desk_640x360.png"
AFTER = ROOT / "work" / "after" / "greaves_desk_640x360.png"
OUT_DIR = ROOT / "comparison"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def font(size):
    for p in ("C:/Windows/Fonts/arial.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


a = Image.open(BEFORE).convert("RGB")
b = Image.open(AFTER).convert("RGB")
assert a.size == b.size == (640, 360), (a.size, b.size)
out = Image.new("RGB", (1280, 430), (13, 17, 22))
d = ImageDraw.Draw(out)
d.text((20, 9), "GREAVES · CONSULTORIO DEL DOCTOR", fill=(234, 217, 178), font=font(22))
d.text((20, 39), "ANTES · OBJETOS PROCEDURALES", fill=(183, 193, 197), font=font(16))
d.text((660, 39), "DESPUÉS · SPRITES CON FRASCOS CORREGIDOS (T3b)", fill=(183, 193, 197), font=font(16))
out.paste(a, (0, 70))
out.paste(b, (640, 70))
d.line([(640, 70), (640, 430)], fill=(208, 177, 118), width=2)
p = OUT_DIR / "AB_greaves_640.png"
# Median-cut to 256 colours (no dither) so the single kept sheet stays
# under the ~600 KB repo budget. Work/ captures regenerate pixel-exact RGB
# via capture_greaves.mjs; drop .quantize here for a full-res RGB sheet.
out.quantize(colors=256, method=2).save(p, optimize=True)
print("SHEET", p, f"({p.stat().st_size // 1024} KB)")
assert p.stat().st_size < 600 * 1024, "comparison over budget"
