"""Build review boards from the unchanged Chrome/Edge game screenshots.

First run: node web/art_review/thomas_v2/scripts/ingame_ab.mjs
Then:      python web/art_review/thomas_v2/scripts/make_ab_board.py
The source screenshots remain intact; crops use nearest-neighbor enlargement.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent / "comparison" / "ab_bucks_row"
ROOT.mkdir(parents=True, exist_ok=True)


def font(size):
    for path in ("C:/Windows/Fonts/arial.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def text(draw, x, y, value, size=19):
    draw.text((x, y), value, fill=(236, 223, 198), font=font(size))


def pair(width, height, top=60):
    a = Image.open(ROOT / f"bucks_row_{width}x{height}_production.png").convert("RGB")
    b = Image.open(ROOT / f"bucks_row_{width}x{height}_v21.png").convert("RGB")
    assert a.size == b.size == (width, height)
    out = Image.new("RGB", (width * 2, height + top), (12, 15, 21))
    draw = ImageDraw.Draw(out)
    text(draw, 20, 12, f"THOMAS EN BUCK'S ROW - {width}x{height} | MOTOR REAL", 18)
    text(draw, 20, 36, "ANTES: V1 produccion", 16)
    text(draw, width + 20, 36, "DESPUES: V2.1 candidato", 16)
    out.paste(a, (0, top))
    out.paste(b, (width, top))
    draw.line([(width, top), (width, height + top)], fill=(220, 181, 102), width=2)
    target = ROOT / f"AB_BuckRow_{width}.png"
    out.save(target)
    print("BOARD", target, out.size)


pair(640, 360)
pair(1280, 720)

# The actor stands near x=320 / y=255 in the 640px render. An enlarged crop
# is diagnostic only: it cannot restore detail absent from the actual sprites.
a = Image.open(ROOT / "bucks_row_640x360_production.png").convert("RGB")
b = Image.open(ROOT / "bucks_row_640x360_v21.png").convert("RGB")
box = (283, 180, 356, 333)
scale = 4
w, h = (box[2] - box[0]) * scale, (box[3] - box[1]) * scale
out = Image.new("RGB", (w * 2, h + 78), (12, 15, 21))
draw = ImageDraw.Draw(out)
text(draw, 12, 12, "PRIMER PLANO X4 - PIXELES REALES, SIN SUAVIZADO", 15)
text(draw, 12, 40, "V1 produccion", 15)
text(draw, w + 12, 40, "V2.1 candidato", 15)
for im, x in [(a, 0), (b, w)]:
    crop = im.crop(box).resize((w, h), Image.Resampling.NEAREST)
    out.paste(crop, (x, 78))
out.save(ROOT / "AB_BuckRow_closeup_x4.png")
print("BOARD", ROOT / "AB_BuckRow_closeup_x4.png", out.size)

# Real Actor animation path under the original scene: these are controlled QA
# animation states, not full character conversations or a human playthrough.
states = ("walk", "talk", "recoil")
out = Image.new("RGB", (1280, 3 * (360 + 38) + 42), (12, 15, 21))
draw = ImageDraw.Draw(out)
text(draw, 12, 9, "BUCK'S ROW - ANIMACIONES DEL ACTOR REAL / ESTADOS QA", 20)
for row, action in enumerate(states):
    y = 42 + row * 398
    text(draw, 12, y + 4, f"{action.upper()} - V1", 16)
    text(draw, 652, y + 4, f"{action.upper()} - V2.1", 16)
    for variant, x in (("production", 0), ("v21", 640)):
        shot = Image.open(ROOT / f"bucks_row_{action}_640x360_{variant}.png").convert("RGB")
        assert shot.size == (640, 360)
        out.paste(shot, (x, y + 38))
out.save(ROOT / "AB_BuckRow_actions.png")
print("BOARD", ROOT / "AB_BuckRow_actions.png", out.size)
