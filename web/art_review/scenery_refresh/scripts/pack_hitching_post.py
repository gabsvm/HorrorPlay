"""Convert transparent Blender hero render to game-size stone_post prop.

Run: python web/art_review/scenery_refresh/scripts/pack_hitching_post.py
Leaves the before sprite in comparison/original_stone_post.png and produces
the production PNG + its existing index metadata (the gameplay asset contract).
"""
from pathlib import Path
import json
import shutil
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT.parent.parent
assets = WEB / "assets" / "props"
comparison = ROOT / "comparison"
comparison.mkdir(parents=True, exist_ok=True)
old = comparison / "original_stone_post.png"
target = assets / "stone_post.png"
if not old.exists():
    shutil.copy2(target, old)
img = Image.open(ROOT / "renders" / "wren_hitching_post_raw.png").convert("RGBA")
alpha = img.getchannel("A")
box = alpha.point(lambda a: 255 if a >= 7 else 0).getbbox()
if not box:
    raise RuntimeError("Blender output has no visible post")
img = img.crop(box)
height = 105  # scene uses logical 1280x720, visible height ~52px at 640x360
width = round(img.width * height / img.height)
img = img.resize((width, height), Image.Resampling.LANCZOS)
# Warm stone is visible but remains shaded in the 1888 nighttime palette.
alpha = img.getchannel("A")
rgb = ImageEnhance.Brightness(img.convert("RGB")).enhance(0.73)
rgb = ImageEnhance.Contrast(rgb).enhance(1.06)
rgb.putalpha(alpha)
img = Image.new("RGBA", (width + 8, height + 7))
img.alpha_composite(rgb, (4, 1))
img.save(target, optimize=True)
index_path = assets / "index.json"
index = json.loads(index_path.read_text(encoding="utf8"))
index["stone_post"] = {"ax": round(img.width / 2), "ay": img.height - 5,
                       "h": img.height, "w": img.width}
index_path.write_text(json.dumps(index, indent=1, ensure_ascii=False) + "\n", encoding="utf8")
img.save(comparison / "new_stone_post.png", optimize=True)
print("PACKED", target, img.size, "origin", index["stone_post"])
