"""Pack the Hanbury yard Blender renders into game-size prop sprites.

Run: python web/art_review/hanbury_yard/scripts/pack_hanbury_props.py

Reads ../renders/hanbury_<name>_raw.png, crops the alpha, resizes to the
game height, knocks the render back into the sooty night palette and
writes web/assets/props/hanbury_<name>.png plus its index.json metadata.
Existing procedural painting stays as the fallback.

T4b tone fix: the T4 rig overexposed pale albedos into near-white sprites
(tub +26%, privy +79% over the procedural in engine crops). The build
script now renders soaked dark albedo under a dim rig; this pack applies
the final reproducible value multiplier (VALUE) instead of eyeballing.
Anchors are the T4 measured values (mangle ax 57, tub ax 55), NOT image
centres, so re-packing never drifts the placement. The repo index.json is
CRLF: endings are preserved (never convert a whole file).
"""
from pathlib import Path
import json
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT.parent.parent
ASSETS = WEB / "assets" / "props"

# game heights in px (the near layer is painted at 1x world scale)
PROPS = {
    "mangle": 122,
    "tub": 96,
    "tap": 168,
    "privy": 252,
}

# T4b final value tweak (reproducible): the dark re-render already lands
# near the procedural tone; this multiplier puts every engine crop within
# +15% of the fallback without crushing detail. Calibrated against the
# work/before vs work/after captures (see check_tone.py); change it only
# with a fresh before/after measurement.
VALUE = 0.85

# Measured T4 anchors (feet/centre over the render, not w/2): re-packing
# must keep them, or the tub/mangle drift off their world points.
ANCHORS = {"mangle": 57, "tub": 55}

index_path = ASSETS / "index.json"
raw_index = index_path.read_bytes().decode("utf8")
index = json.loads(raw_index)

for name, height in PROPS.items():
    raw = ROOT / "renders" / f"hanbury_{name}_raw.png"
    img = Image.open(raw).convert("RGBA")
    box = img.getchannel("A").point(lambda a: 255 if a >= 7 else 0).getbbox()
    if not box:
        raise RuntimeError(f"Blender output has no visible {name}")
    img = img.crop(box)
    width = round(img.width * height / img.height)
    img = img.resize((width, height), Image.Resampling.LANCZOS)
    # Dark studio render eased into the 1888 night; modelling kept.
    alpha = img.getchannel("A")
    rgb = ImageEnhance.Brightness(img.convert("RGB")).enhance(VALUE)
    rgb.putalpha(alpha)
    out = Image.new("RGBA", (width + 8, height + 8))
    out.alpha_composite(rgb, (4, 2))
    target = ASSETS / f"hanbury_{name}.png"
    out.save(target, optimize=True)
    out.save(ROOT / "renders" / f"hanbury_{name}_game_candidate.png", optimize=True)
    ax = ANCHORS.get(name, round(out.width / 2))
    index[f"hanbury_{name}"] = {"ax": ax, "ay": out.height - 5,
                               "h": out.height, "w": out.width}
    print("PACKED", target, out.size, f"{target.stat().st_size // 1024}KB")

index_path.write_bytes((json.dumps(dict(sorted(index.items())), ensure_ascii=False, indent=1) + "\n").replace("\n", "\r\n").encode("utf8"))
print("INDEX", index_path, "VALUE", VALUE)
