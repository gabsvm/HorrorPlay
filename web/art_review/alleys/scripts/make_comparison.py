"""Side-by-side 640x360 sheets for the alleys pass (T5).

Run: python web/art_review/alleys/scripts/make_comparison.py

Reads genuine engine captures at four chase spots (x=700 lamp corner,
x=1500 laundry run, x=2200 FLOWER & DEAN junction, x=3100 THRAWL
junction): before/ from the base painting, after/ from the T5
variation. Captures come from the shared tool:

  node web/art_review/scenery_refresh/scripts/capture_scene.mjs alleys before 700
  node web/art_review/scenery_refresh/scripts/capture_scene.mjs alleys before 1500
  node web/art_review/scenery_refresh/scripts/capture_scene.mjs alleys before 2200
  node web/art_review/scenery_refresh/scripts/capture_scene.mjs alleys before 3100
  (same four with "after")

copied to web/art_review/alleys/before|after/ (640x360 only for the
sheets; 1280x720 captures are visual QA intermediates and are NOT kept).
Rain is animated, so pixels never match exactly between captures.

Four full rows do not fit the 600KB evidence budget as one faithful PNG
(rain streaks are incompressible noise: 923KB at 64 colors, posterized
at 16), so the evidence ships as two 2-row sheets, each < 600KB at 96
colors without dithering. Only AB_alleys_640_a.png and
AB_alleys_640_b.png ship.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ALLEYS = HERE.parent
OUT = ALLEYS / "comparison"
OUT.mkdir(parents=True, exist_ok=True)


def font(size):
    for p in ("C:/Windows/Fonts/arial.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


SHEETS = [
    ("AB_alleys_640_a.png", [
        ("FAROLA Y COLADA (x=700)", "alleys_x700_640x360.png"),
        ("TRAMO DE COLADA (x=1500)", "alleys_x1500_640x360.png"),
    ]),
    ("AB_alleys_640_b.png", [
        ("CRUCE FLOWER & DEAN (x=2200)", "alleys_x2200_640x360.png"),
        ("CRUCE THRAWL ST (x=3100)", "alleys_x3100_640x360.png"),
    ]),
]
W, H = 640, 360
TOP = 64
for target_name, rows in SHEETS:
    sheet = Image.new("RGB", (W * 2, TOP + H * len(rows)), (13, 17, 22))
    d = ImageDraw.Draw(sheet)
    d.text((20, 8), "CALLEJONES · PERSECUCIÓN",
           fill=(234, 217, 178), font=font(22))
    d.text((20, 38), "ANTES · MUROS/COLADA PLANOS",
           fill=(183, 193, 197), font=font(15))
    d.text((W + 20, 38), "DESPUES · VARIACION T5",
           fill=(183, 193, 197), font=font(15))
    for i, (label, name) in enumerate(rows):
        before = Image.open(ALLEYS / "before" / name).convert("RGB")
        after = Image.open(ALLEYS / "after" / name).convert("RGB")
        assert before.size == after.size == (W, H), name
        y = TOP + i * H
        sheet.paste(before, (0, y))
        sheet.paste(after, (W, y))
        d.line([(W, y), (W, y + H)], fill=(208, 177, 118), width=2)
        d.text((8, y + 6), label, fill=(234, 217, 178), font=font(14))
    target = OUT / target_name
    sheet.quantize(colors=96, method=Image.Quantize.MEDIANCUT,
                   dither=Image.Dither.NONE).save(target, optimize=True)
    print(target, target.stat().st_size, "bytes")
    assert target.stat().st_size < 600 * 1024, "comparison over budget"
