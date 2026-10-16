"""Turn the Blender toy-boat render into a transparent, game-ready prop sprite.

Run: python web/art_review/scenery_refresh/scripts/pack_nat_boat.py
"""
from pathlib import Path
import json
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT.parent.parent / "assets" / "props"
SOURCE = ROOT / "renders" / "nat_boat_raw.png"
im = Image.open(SOURCE).convert("RGBA")
box = im.getchannel("A").point(lambda a: 255 if a > 7 else 0).getbbox()
assert box, "boat render is transparent"
im = im.crop(box)
target_w = 90
im = im.resize((target_w, round(im.height * target_w / im.width)), Image.Resampling.LANCZOS)
a = im.getchannel("A")
rgb = ImageEnhance.Brightness(im.convert("RGB")).enhance(.78)
rgb.putalpha(a)
im = Image.new("RGBA", (rgb.width + 6, rgb.height + 8))
im.alpha_composite(rgb, (3, 2))
out = ASSETS / "nat_boat.png"
im.save(out, optimize=True)
im.save(ROOT / "renders" / "nat_boat_game_candidate.png", optimize=True)
indexfile = ASSETS / "index.json"
index = json.loads(indexfile.read_text(encoding="utf8"))
index["nat_boat"] = {"ax": im.width // 2, "ay": im.height - 4, "h": im.height, "w": im.width}
indexfile.write_text(json.dumps(dict(sorted(index.items())), ensure_ascii=False, indent=1) + "\n", encoding="utf8")
print("PACKED",out,im.size,index["nat_boat"])
