"""Side-by-side arrival framing for Delivery D (mangle visibility).

Run: python web/art_review/hanbury_yard/v2/scripts/make_mangle_comparison.py

Reads the genuine engine captures (capture_mangle.mjs: work/before for the
procedural fallback, work/after for the current sprites) at the arrival
framing (player x=560, cam 0, Amelia at actors() x=470) and writes a single
before/after sheet. Rain is animated, so pixels never match exactly. The
work/ captures (including 1280x720 and logs) are regenerable and are NOT kept
in the repo: only AB_mangle_640.png ships (hard budget < 600 KB).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
V2 = HERE.parent
SRC = V2 / "comparison" / "work"
OUT = V2 / "comparison"
OUT.mkdir(parents=True, exist_ok=True)


def font(size):
    for p in ("C:/Windows/Fonts/arial.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


NAME = "hanbury_arrival_640x360.png"
LABEL = "PATIO CON LA CASERA EN SU SITIO (x=560, cam 0, Amelia x=470)"
W, H = 640, 360
TOP = 64
sheet = Image.new("RGB", (W * 2, TOP + H), (13, 17, 22))
d = ImageDraw.Draw(sheet)
d.text((20, 8), "HANBURY STREET · EL MANGLE A LA LLEGADA",
       fill=(234, 217, 178), font=font(22))
d.text((20, 38), "ANTES · PROCEDURAL", fill=(183, 193, 197), font=font(15))
d.text((W + 20, 38), "DESPUES · SPRITE T4b (MISMA POSICION)",
       fill=(183, 193, 197), font=font(15))
before = Image.open(SRC / "before" / NAME).convert("RGB")
after = Image.open(SRC / "after" / NAME).convert("RGB")
assert before.size == after.size == (W, H), NAME
sheet.paste(before, (0, TOP))
sheet.paste(after, (W, TOP))
d.line([(W, TOP), (W, TOP + H)], fill=(208, 177, 118), width=2)
d.text((8, TOP + 6), LABEL, fill=(234, 217, 178), font=font(14))

target = OUT / "AB_mangle_640.png"
sheet = sheet.quantize(colors=192, method=Image.Quantize.MEDIANCUT,
                       dither=Image.Dither.NONE)
sheet.save(target, optimize=True)
print("SHEET", target, f"{target.stat().st_size // 1024}KB")
assert target.stat().st_size < 600 * 1024, "comparison over the 600KB budget"
