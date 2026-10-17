# Side-by-side BEFORE/AFTER comparisons for ENTREGA B (2D).
# Reads the regenerable motor captures in ../../work/ (before/ + after/) and
# writes the small 640x360 comparisons into ../../comparison/.
#
# Usage (paths are relative to this script, no personal paths):
#   python web/art_review/room_photo_map/2d_integration/scripts/make_comparison_wall.py
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
TASK = os.path.dirname(HERE)
WORK = os.path.join(TASK, "work")
OUT = os.path.join(TASK, "comparison")


def pair(before_name, after_name, out_name, labels=("ANTES", "DESPUES")):
    b = Image.open(os.path.join(WORK, "before", before_name)).convert("RGB")
    a = Image.open(os.path.join(WORK, "after", after_name)).convert("RGB")
    assert b.size == a.size == (640, 360), (b.size, a.size)
    c = Image.new("RGB", (640 * 2 + 12, 360 + 28), (16, 14, 12))
    d = ImageDraw.Draw(c)
    c.paste(b, (0, 28))
    c.paste(a, (640 + 12, 28))
    d.text((8, 6), labels[0] + " " + before_name.replace("wall_", "").replace(".png", ""), fill=(235, 220, 190))
    d.text((640 + 20, 6), labels[1] + " " + after_name.replace("wall_", "").replace(".png", ""), fill=(235, 220, 190))
    p = os.path.join(OUT, out_name)
    # Median-cut to 256 colours: the motor frames are grainy and would top
    # 700 KB as RGB; quantized they stay under 600 KB with no visible loss.
    c.quantize(colors=256, method=Image.MEDIANCUT).save(p, optimize=True)
    print(out_name, os.path.getsize(p), "bytes")


def main():
    os.makedirs(OUT, exist_ok=True)
    pair("wall_c1_640x360.png", "wall_c1_640x360.png", "cmp_wall_c1_640x360.png")
    pair("wall_c3b_640x360.png", "wall_c3b_640x360.png", "cmp_wall_c3_640x360.png")
    trio = Image.open(os.path.join(WORK, "eval_trio_wall.png")).convert("RGB")
    p = os.path.join(OUT, "cmp_variants_wall.png")
    trio.save(p, optimize=True)
    print("cmp_variants_wall.png", os.path.getsize(p), "bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
