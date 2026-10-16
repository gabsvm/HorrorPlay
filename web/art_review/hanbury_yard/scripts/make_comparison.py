"""Side-by-side 640x360 sheet for the Hanbury yard pass (T4b).

Run: python web/art_review/hanbury_yard/scripts/make_comparison.py

Reads the genuine engine captures (capture_hanbury.mjs: work/before for the
procedural fallback, work/after for the fixed dark sprites) for the wash
corner (x=500) and the tap/privy corner (x=1650) and writes a single
before/after sheet. Rain is animated, so pixels never match exactly between
captures. The work/ captures (including 1280x720 and logs) are regenerable
with capture_hanbury.mjs and are NOT kept in the repo: only AB_hanbury_640.png
ships (hard budget < 600 KB).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
YARD = HERE.parent
SRC = YARD / "comparison" / "work"
OUT = YARD / "comparison"
OUT.mkdir(parents=True, exist_ok=True)


def font(size):
    for p in ("C:/Windows/Fonts/arial.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


ROWS = [
    ("LAVADERO · TINA Y MANGLE (x=500)", "hanbury_x500_640x360.png"),
    ("GRIFO Y RETRETE (x=1650)", "hanbury_x1650_640x360.png"),
]
W, H = 640, 360
TOP = 64
sheet = Image.new("RGB", (W * 2, TOP + H * len(ROWS)), (13, 17, 22))
d = ImageDraw.Draw(sheet)
d.text((20, 8), "HANBURY STREET · PATIO TRASERO DEL Nº 29",
       fill=(234, 217, 178), font=font(22))
d.text((20, 38), "ANTES · FORMAS BASICAS", fill=(183, 193, 197), font=font(15))
d.text((W + 20, 38), "DESPUES · PROPS BLENDER (TONO T4b)", fill=(183, 193, 197), font=font(15))
for i, (label, name) in enumerate(ROWS):
    before = Image.open(SRC / "before" / name).convert("RGB")
    after = Image.open(SRC / "after" / name).convert("RGB")
    assert before.size == after.size == (W, H), name
    y = TOP + i * H
    sheet.paste(before, (0, y))
    sheet.paste(after, (W, y))
    d.line([(W, y), (W, y + H)], fill=(208, 177, 118), width=2)
    d.text((8, y + 6), label, fill=(234, 217, 178), font=font(14))

target = OUT / "AB_hanbury_640.png"
# Two full 640x360 rows will not fit the 600KB evidence budget as RGB, so
# the sheet is stored palette-quantized (no dither): at this size the night
# scene shows no visible banding and the props stay legible. 256 colors
# overflowed the budget (655KB in T4), so T4b ships at 192.
sheet = sheet.quantize(colors=192, method=Image.Quantize.MEDIANCUT,
                       dither=Image.Dither.NONE)
sheet.save(target, optimize=True)
print("SHEET", target, f"{target.stat().st_size // 1024}KB")
assert target.stat().st_size < 600 * 1024, "comparison over the 600KB budget"
