"""Compress what props.py rendered into web/assets/props/.

usage: python tools/blender/pack_props.py RENDER_DIR

Each sprite becomes an indexed PNG (the game snaps it to its own palette anyway); index.json keeps
each one's size and the pixel of its origin.
"""
import json
import os
import sys

from PIL import Image

src = sys.argv[1]
dst = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'assets', 'props')
os.makedirs(dst, exist_ok=True)
meta = json.load(open(os.path.join(src, 'props.json')))
for name in meta:
    im = Image.open(os.path.join(src, name + '.png')).convert('RGBA')
    im.quantize(255, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(os.path.join(dst, name + '.png'), optimize=True)
json.dump(meta, open(os.path.join(dst, 'index.json'), 'w'), indent=1, sort_keys=True)
print(sum(os.path.getsize(os.path.join(dst, f)) for f in os.listdir(dst)) // 1024, 'KB')
