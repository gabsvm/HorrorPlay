"""Pack the Greaves study props (T3): skull, microscope, cabinet, two jars.

Run: python web/art_review/greaves_study/scripts/pack_greaves.py

Reads ../renders/greaves_*_raw.png (transparent Blender ortho renders),
crops/scales them to game size and writes web/assets/props/*.png plus the
index.json entries (ax/ay/w/h) that drawProp needs. Game code
(web/src/scenes/greaves.js) draws each sprite with its origin at the stated
world point and keeps the old procedural drawing as the fallback.

Anchors: ax/ay point at the sprite pixel that lands on the world point, so
ay = MARGIN + content height puts the content bottom exactly on the desk /
shelf / floor line (the crate/hitching-post precedent).
BRIGHTNESS 1.0 everywhere: the engine's night lightmap already darkens the
static layer (T1b lesson); verify in the engine captures, not here.
"""

from pathlib import Path
import json

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
RENDERS = ROOT / "renders"
ASSETS = ROOT.parent.parent / "assets" / "props"

BRIGHTNESS = 1.0
MARGIN = 4  # transparent padding kept around the cropped content


def load(name):
    im = Image.open(RENDERS / name).convert("RGBA")
    box = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    assert box, f"empty render {name}"
    return im, box


def finish(crop, target_w, target_h=None, bright=BRIGHTNESS):
    """Scale cropped content, apply the shared brightness, pad with margin.
    Returns (padded sprite, content w/h after scaling)."""
    cw, ch = crop.size
    if target_h is None:
        target_h = round(ch * target_w / cw)
    content = crop.resize((target_w, target_h), Image.Resampling.LANCZOS)
    rgb = ImageEnhance.Brightness(content.convert("RGB")).enhance(bright)
    rgb.putalpha(content.getchannel("A"))
    out = Image.new("RGBA",
                    (content.width + MARGIN * 2, content.height + MARGIN * 2))
    out.alpha_composite(rgb, (MARGIN, MARGIN))
    return out, content.size


def save(im, name):
    out = ASSETS / f"{name}.png"
    im.save(out, optimize=True)
    im.save(RENDERS / f"{name}_game_candidate.png", optimize=True)
    kb = out.stat().st_size // 1024
    print("PACKED", out, im.size, f"({kb} KB)")
    assert out.stat().st_size < 100 * 1024, f"{name} over mobile budget"
    return im


entries = {}

# Skull + microscope: small desk objects, width-led to 36 px.
for name, raw in (("greaves_skull", "greaves_skull_raw.png"),
                  ("greaves_microscope", "greaves_microscope_raw.png")):
    im, box = load(raw)
    sprite, (cw, ch) = finish(im.crop(box), 36)
    save(sprite, name)
    entries[name] = {"ax": MARGIN + cw // 2, "ay": MARGIN + ch,
                     "h": sprite.height, "w": sprite.width}

# Cabinet: modelled exactly 1.8 x 4.0 units for the old 180x400 world rect.
# The render carries ~1% of margin/AA around the carcass, so fit
# non-uniformly to the exact rect (a few percent of furniture squeeze).
cab, _ = load("greaves_cabinet_raw.png")
cab = cab.resize((180, 400), Image.Resampling.LANCZOS)
rgb = ImageEnhance.Brightness(cab.convert("RGB")).enhance(BRIGHTNESS)
rgb.putalpha(cab.getchannel("A"))
save(rgb, "greaves_cabinet")
entries["greaves_cabinet"] = {"ax": 90, "ay": 400, "h": 400, "w": 180}

# Jars: split the shared render at the middle (the build script keeps each
# jar on its own side of x=0), pack each to 36 px wide keeping aspect.
# The game scales each sprite so its BODY (below the lid) is jh tall:
#   sy = jh / BODY  and  draw at (jx + 16, jy + MARGIN * sy).
raw = Image.open(RENDERS / "greaves_jars_raw.png").convert("RGBA")
W, H = raw.size
# Camera mapping of the jars build (100 px/unit, do not change one file
# without the other): view height = ortho * res_y / res_x = 1.4 units
# around cam z = 0.05, so raw pixel row of world z is (0.75 - z) * 100.
CAM_TOP_Z = 0.75
BODY_TOP_Z = {"greaves_jar_tall": 0.35, "greaves_jar_squat": 0.15}
for name, x0 in (("greaves_jar_tall", 0), ("greaves_jar_squat", W // 2)):
    crop = raw.crop((x0, 0, x0 + W // 2, H))
    box = crop.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    assert box, f"empty half {name}"
    # Symmetry guard: the jar must sit centred in its half, like the old
    # body rect centred on jx+16 (a drifted jar would misalign every shelf).
    assert abs((box[0] + box[2]) / 2 - crop.width / 2) <= 4, \
        f"{name} off-centre: {box}"
    body_row = (CAM_TOP_Z - BODY_TOP_Z[name]) * 100 - box[1]
    assert 0 < body_row < box[3] - box[1], f"{name} lid split outside crop"
    sprite, (cw, ch) = finish(crop.crop(box), 36)
    k = cw / (box[2] - box[0])
    body_px = round((box[3] - box[1] - body_row) * k)
    save(sprite, name)
    entries[name] = {"ax": MARGIN + cw // 2, "ay": MARGIN + ch,
                     "h": sprite.height, "w": sprite.width}
    print(f"{name}: BODY = {body_px} px -> "
          f"drawProp(ctx, '{name}', jx + 16, jy + {MARGIN} * sy, "
          f"{{{{sy: jh / {body_px}}}}})")

index_path = ASSETS / "index.json"
index = json.loads(index_path.read_text(encoding="utf8"))
index.update(entries)
# The repo file is CRLF: keep its endings (never convert a whole file).
text = json.dumps(dict(sorted(index.items())), ensure_ascii=False, indent=1)
index_path.write_bytes((text + "\n").replace("\n", "\r\n").encode("utf8"))
print("INDEX", index_path, sorted(entries))
print("SKULL: drawProp(ctx, 'greaves_skull', 752, GROUND - 99)")
print("MICROSCOPE: drawProp(ctx, 'greaves_microscope', 827, GROUND - 98)")
print("CABINET: drawProp(ctx, 'greaves_cabinet', 1330, GROUND - 10)")
