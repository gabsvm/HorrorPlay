"""Prepare the painted crime-scene close-ups (see CLOSEUPS.md) for the game.

usage: python tools/closeups.py SOURCE_DIR

SOURCE_DIR holds nichols.png, chapman.png and eddowes.png (any size, any common format). Each is
cropped to a centred 16:9 frame, reduced to 1280x720 (the close-up's logical size) and written to
web/assets/closeups/ as JPEG, with index.json listing what there is.
"""
import json
import os
import sys

from PIL import Image

KINDS = ('nichols', 'chapman', 'eddowes', 'hands')
src = sys.argv[1]
dst = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'closeups')
os.makedirs(dst, exist_ok=True)
for f in sorted(os.listdir(src)):
    kind, ext = os.path.splitext(f)
    if kind not in KINDS or ext.lower() not in ('.png', '.jpg', '.jpeg', '.webp'):
        continue
    im = Image.open(os.path.join(src, f)).convert('RGB')
    w, h = im.size
    cw, ch = (w, w * 9 // 16) if w * 9 <= h * 16 else (h * 16 // 9, h)
    im = im.crop(((w - cw) // 2, (h - ch) // 2, (w + cw) // 2, (h + ch) // 2)).resize((1280, 720), Image.LANCZOS)
    im.save(os.path.join(dst, kind + '.jpg'), quality=88, optimize=True)
index = {os.path.splitext(f)[0]: f for f in sorted(os.listdir(dst)) if f.endswith('.jpg')}
json.dump(index, open(os.path.join(dst, 'index.json'), 'w'), indent=1)
print(json.dumps(index))
