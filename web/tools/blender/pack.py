"""Compress what figure.py rendered into the game's model files.

usage: python tools/blender/pack.py RENDER_DIR WHO      (writes web/assets/models/WHO/)

The colour atlas becomes an indexed PNG with a hard alpha (the game cuts at alpha 100 and snaps to its
own palette anyway). The normal atlas is kept at half size: the sprite is lit on the 640x360 grid,
two logical pixels to one, so the extra normals were never read.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

src, who = sys.argv[1], sys.argv[2]
dst = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'assets', 'models', who)
os.makedirs(dst, exist_ok=True)
meta = json.load(open(os.path.join(src, 'model.json')))

alb = np.array(Image.open(os.path.join(src, 'albedo.png')).convert('RGBA'))
solid = alb[..., 3] >= 100
alb[..., 3] = np.where(solid, 255, 0)
alb[~solid, :3] = 0
Image.fromarray(alb, 'RGBA').quantize(255, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(
    os.path.join(dst, 'albedo.png'), optimize=True)

# half-size normals: average only the covered pixels of each 2x2 block, so edges keep their slope
nor = np.array(Image.open(os.path.join(src, 'normal.png')).convert('RGBA')).astype(np.float32)
h, w = nor.shape[0] // 2 * 2, nor.shape[1] // 2 * 2
nor = nor[:h, :w]
cov = (nor[..., 3] >= 100).astype(np.float32)[..., None]
blk = lambda a: a.reshape(h // 2, 2, w // 2, 2, -1).sum(axis=(1, 3))
n = blk(nor[..., :3] * cov) / np.maximum(blk(cov), 1)
a = (blk(cov)[..., 0] > 0) * 255
out = np.concatenate([n, a[..., None]], axis=2).round().clip(0, 255).astype(np.uint8)
Image.fromarray(out, 'RGBA').save(os.path.join(dst, 'normal.png'), optimize=True)

meta['ns'] = 0.5
json.dump(meta, open(os.path.join(dst, 'model.json'), 'w'), separators=(',', ':'))
size = sum(os.path.getsize(os.path.join(dst, f)) for f in os.listdir(dst))
print(f'{who}: {size // 1024} KB')
