"""Side-by-side sheets for Greaves delivery C (v2).

Run (from the repository root):
  python web/art_review/greaves_study/v2/scripts/make_comparison_v2.py

Reads the regenerable engine captures in ../work/before + ../work/after
(run capture_jars.mjs for each label) and writes the three kept sheets in
../comparison/ (the only screenshots kept in the repo):
  AB_jars_640.png      shelf frame before/after at 640x360
  ZOOM_shelves_640.png 2x nearest zoom of the four shelf boards before/after
  AB_jars_1280.png     shelf frame before/after at 1280x720
All sheets are median-cut to 256 colours (no dither) to stay under the
~600 KB repo budget each.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / "work"
OUT_DIR = ROOT / "comparison"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# The shelf-zone crop shared with measure_shelf.py.
SHELF_CROP = (40, 40, 280, 280)


def font(size):
    for p in ("C:/Windows/Fonts/arial.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def sheet(path, title_left, title_right, left, right):
    assert left.size == right.size, (left.size, right.size)
    w, h = left.size
    out = Image.new("RGB", (w * 2, h + 70), (13, 17, 22))
    d = ImageDraw.Draw(out)
    d.text((20, 9), "GREAVES · FRASCOS DE LA ESTANTERIA (C)", fill=(234, 217, 178), font=font(22))
    d.text((20, 39), title_left, fill=(183, 193, 197), font=font(16))
    d.text((w + 20, 39), title_right, fill=(183, 193, 197), font=font(16))
    out.paste(left, (0, 70))
    out.paste(right, (w, 70))
    d.line([(w, 70), (w, 70 + h)], fill=(208, 177, 118), width=2)
    out.quantize(colors=256, method=2).save(path, optimize=True)
    print("SHEET", path, f"({path.stat().st_size // 1024} KB)")
    assert path.stat().st_size < 600 * 1024, f"{path} over budget"


before640 = Image.open(WORK / "before" / "greaves_shelf_640x360.png").convert("RGB")
after640 = Image.open(WORK / "after" / "greaves_shelf_640x360.png").convert("RGB")
sheet(OUT_DIR / "AB_jars_640.png", "ANTES · 2 VARIANTES (T3b)", "DESPUES · 5 VARIANTES (C)", before640, after640)

zoom = lambda im: im.crop((*SHELF_CROP[:2], SHELF_CROP[2], SHELF_CROP[3])).resize((480, 480), Image.NEAREST)
sheet(OUT_DIR / "ZOOM_shelves_640.png", "ANTES · ZOOM 2X BALDAS", "DESPUES · ZOOM 2X BALDAS",
      zoom(before640), zoom(after640))

before1280 = Image.open(WORK / "before" / "greaves_shelf_1280x720.png").convert("RGB")
after1280 = Image.open(WORK / "after" / "greaves_shelf_1280x720.png").convert("RGB")
sheet(OUT_DIR / "AB_jars_1280.png", "ANTES 1280", "DESPUES 1280", before1280, after1280)
