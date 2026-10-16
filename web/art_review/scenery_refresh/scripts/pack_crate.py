"""Install a transparent 3D-modelled packing-crate sprite, with fallback retained.

Run: python web/art_review/scenery_refresh/scripts/pack_crate.py
"""
from pathlib import Path
import json
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT.parent.parent / "assets" / "props"
im = Image.open(ROOT / "renders" / "crate_raw.png").convert("RGBA")
box = im.getchannel("A").point(lambda a: 255 if a > 7 else 0).getbbox()
assert box, "empty crate"
im = im.crop(box)
# The actual game stretches props to varied scene-specific crate rectangles;
# leave enough detail in the sprite for the renderer's half-resolution pass.
w = 128
im = im.resize((w, round(w * im.height / im.width)), Image.Resampling.LANCZOS)
rgb = ImageEnhance.Brightness(im.convert("RGB")).enhance(.68)
rgb.putalpha(im.getchannel("A"))
im = Image.new("RGBA", (rgb.width + 8, rgb.height + 8))
im.alpha_composite(rgb, (4, 4))
im.save(ASSETS / "crate.png", optimize=True)
im.save(ROOT / "renders" / "crate_game_candidate.png", optimize=True)
indexfile=ASSETS/"index.json"
index=json.loads(indexfile.read_text(encoding="utf8"))
index["crate"]={"ax":0, "ay":0, "h":im.height, "w":im.width}
indexfile.write_text(json.dumps(dict(sorted(index.items())),ensure_ascii=False,indent=1)+"\n",encoding="utf8")
print("PACKED", (ASSETS/"crate.png"), im.size)
