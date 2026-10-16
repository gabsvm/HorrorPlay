"""Pack the five Greaves jar variants (delivery C, v2).

Run (from the repository root):
  python web/art_review/greaves_study/v2/scripts/pack_jars_v2.py

Reads ../renders/greaves_jars_v2_raw.png (transparent Blender ortho
render, five jars in a row), crops/scales each fifth to game size and
writes web/assets/props/greaves_jar_{tall,squat,round,thin,wide}.png
plus the index.json entries (ax/ay/w/h) that the scene needs. Same flow
as the T3 pack_greaves.py: BRIGHTNESS 1.0 everywhere (the engine's night
lightmap already darkens the static layer), MARGIN-anchored bottoms, and
the BODY math the game uses to scale each sprite so its glass body
(below the lid) is jh tall:
  sy = jh / BODY  and  draw at (jx + 16, jy + MARGIN * sy).
"""

from pathlib import Path
import json

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
RENDERS = ROOT / "renders"
ASSETS = ROOT.parent.parent.parent / "assets" / "props"

BRIGHTNESS = 1.0
MARGIN = 4  # transparent padding kept around the cropped content

# Glass-body top in world z per variant (lid base); bottoms align at -0.25.
# Pack width per variant: real width variety on the shelf (narrow thin,
# wide squat/round/wide) while keeping 1+ px gaps on the 41 px pitch.
BODY_TOP_Z = {
    "greaves_jar_tall": (0.35, 34),
    "greaves_jar_squat": (0.15, 38),
    "greaves_jar_round": (0.22, 38),
    "greaves_jar_thin": (0.05, 30),
    "greaves_jar_wide": (0.25, 40),
}
# Camera mapping of the v2 build (100 px/unit, do not change one file
# without the other): view height = ortho * res_y / res_x = 1.4 units
# around cam z = 0.05, so raw pixel row of world z is (0.75 - z) * 100.
CAM_TOP_Z = 0.75


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
    kb = out.stat().st_size / 1024
    print("PACKED", out, im.size, f"({kb:.1f} KB)")
    assert out.stat().st_size < 100 * 1024, f"{name} over mobile budget"
    return im


raw = Image.open(RENDERS / "greaves_jars_v2_raw.png").convert("RGBA")
W, H = raw.size
assert W % 5 == 0, f"width {W} does not split in fifths"
names = list(BODY_TOP_Z)
entries = {}
for i, name in enumerate(names):
    top_z, target_w = BODY_TOP_Z[name]
    crop = raw.crop((i * W // 5, 0, (i + 1) * W // 5, H))
    box = crop.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    assert box, f"empty fifth {name}"
    # Symmetry guard: the jar must sit centred in its fifth, like the old
    # body rect centred on jx+16 (a drifted jar would misalign every shelf).
    assert abs((box[0] + box[2]) / 2 - crop.width / 2) <= 4, \
        f"{name} off-centre: {box}"
    body_row = (CAM_TOP_Z - top_z) * 100 - box[1]
    assert 0 < body_row < box[3] - box[1], f"{name} lid split outside crop"
    sprite, (cw, ch) = finish(crop.crop(box), target_w)
    k = cw / (box[2] - box[0])
    body_px = round((box[3] - box[1] - body_row) * k)
    save(sprite, name)
    # "body" is the glass height below the lid in sprite px: the game
    # scales it to jh (single source of truth, never a second constant).
    entries[name] = {"ax": MARGIN + cw // 2, "ay": MARGIN + ch,
                     "h": sprite.height, "w": sprite.width, "body": body_px}
    print(f"{name}: BODY = {body_px} px")

total = sum((ASSETS / f"{n}.png").stat().st_size for n in names)
print(f"TOTAL jars = {total / 1024:.1f} KB")
assert total < 100 * 1024, "jar library over mobile budget"

index_path = ASSETS / "index.json"
index = json.loads(index_path.read_text(encoding="utf8"))
index.update(entries)
# The repo file is CRLF: keep its endings (never convert a whole file).
text = json.dumps(dict(sorted(index.items())), ensure_ascii=False, indent=1)
index_path.write_bytes((text + "\n").replace("\n", "\r\n").encode("utf8"))
print("INDEX", index_path, sorted(entries))
