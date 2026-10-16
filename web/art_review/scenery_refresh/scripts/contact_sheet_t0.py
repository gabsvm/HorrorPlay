# T0 lamp/crate audit: build CONTACT_SHEET.png from the before/after captures.
#   python web/art_review/scenery_refresh/scripts/contact_sheet_t0.py
# Reads comparison/audit_t0 and comparison/audit_t0_after, writes
# comparison/audit_t0/CONTACT_SHEET.png. Uses only the local Pillow.
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
COMP = HERE.parent / "comparison"
BEFORE = COMP / "audit_t0"
AFTER = COMP / "audit_t0_after"

# (scene, x) spots captured for the audit, in sheet order.
SPOTS = [
    ("alleys", 700), ("alleys", 1800), ("alleys", 2900), ("alleys", 3800),
    ("bucks_row", 300), ("bucks_row", 1640),
    ("goulston", 380),
    ("hanbury", 250), ("hanbury", 1760),
    ("knackers", 400), ("knackers", 1500),
    ("millers", 1320),
    ("mitre", 1380),
]
THUMB_W, THUMB_H = 384, 216
LABEL_W = 190
PAD = 8
BG = (12, 12, 14)
FG = (220, 215, 200)
ACCENT = (200, 150, 60)


def thumb(path):
    im = Image.open(path).convert("RGB")
    return im.resize((THUMB_W, THUMB_H), Image.LANCZOS)


rows = len(SPOTS)
sheet_w = LABEL_W + THUMB_W * 2 + PAD * 4
sheet_h = 30 + rows * (THUMB_H + 22) + PAD * 2
sheet = Image.new("RGB", (sheet_w, sheet_h), BG)
d = ImageDraw.Draw(sheet)
d.text((PAD, PAD), "T0 lamp/crate audit: BEFORE (left) vs AFTER (right), 640x360 in-engine",
       fill=ACCENT)
y = 30
for scene, x in SPOTS:
    tag = f"{scene}_x{x}"
    d.text((PAD, y + THUMB_H // 2 - 14), f"{scene}\nx={x}", fill=FG)
    for col, root in enumerate((BEFORE, AFTER)):
        t = thumb(root / f"{tag}_640x360.png")
        sheet.paste(t, (LABEL_W + PAD + col * (THUMB_W + PAD), y))
    d.text((LABEL_W + PAD, y + THUMB_H + 2), f"{tag} BEFORE", fill=FG)
    d.text((LABEL_W + PAD + THUMB_W + PAD, y + THUMB_H + 2), f"{tag} AFTER", fill=FG)
    y += THUMB_H + 22
out = BEFORE / "CONTACT_SHEET.png"
sheet.save(out, optimize=True)
print("wrote", out, sheet.size)
