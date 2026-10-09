"""Prepare the painted dialogue portraits (see PORTRAITS.md) for the game.

usage: python tools/portraits.py SOURCE_DIR

SOURCE_DIR holds the generated images as <id>.png, <id>_talk.png and <id>_blink.png (any size, any
common format). Each is cropped to a centred square, reduced to 144 px (the game redraws it on its
72 px portrait grid) and written to web/assets/portraits/, with index.json listing what each id has.
"""
import json
import os
import sys

from PIL import Image

SIZE = 144
src = sys.argv[1]
dst = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'portraits')
os.makedirs(dst, exist_ok=True)
index = {}
for f in sorted(os.listdir(src)):
    stem, ext = os.path.splitext(f)
    if ext.lower() not in ('.png', '.jpg', '.jpeg', '.webp'):
        continue
    pid, _, var = stem.partition('_')
    var = var or 'base'
    if var not in ('base', 'talk', 'blink'):
        print(f'skipped {f}: expected <id>.png, <id>_talk.png or <id>_blink.png')
        continue
    im = Image.open(os.path.join(src, f)).convert('RGB')
    s = min(im.size)
    im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2))
    im.resize((SIZE, SIZE), Image.LANCZOS).save(os.path.join(dst, f'{pid}_{var}.png'), optimize=True)
    index.setdefault(pid, []).append(var)
for pid, vs in index.items():
    if 'base' not in vs:
        print(f'{pid}: no base image, it will not be used')
json.dump(index, open(os.path.join(dst, 'index.json'), 'w'), indent=1, sort_keys=True)
print(json.dumps(index))
