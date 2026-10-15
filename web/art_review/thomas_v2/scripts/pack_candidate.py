"""Compress the V2 candidate render into game-format atlases (ISOLATED).

usage: python tools/blender/pack.py RENDER_DIR WHO      (writes web/assets/models/WHO/)

The colour atlas becomes an indexed PNG with a hard alpha and the lantern glass lit (the game cuts at alpha 100 and snaps to its
own palette anyway). The normal atlas is kept at half size: the sprite is lit on the 640x360 grid,
two logical pixels to one, so the extra normals were never read.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

# ISOLATED: never writes to web/assets/models/. Default destination is the benchmark folder.
# usage: python pack_candidate.py RENDER_DIR [DST_DIR]
src = sys.argv[1]
_this = os.path.dirname(os.path.abspath(__file__))
_default_dst = os.path.normpath(os.path.join(_this, '..', 'exports', 'game_candidate'))
dst = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else _default_dst
assert 'art_review/thomas_v2' in dst.replace(os.sep, '/'), f"refusing destination outside benchmark: {dst}"
who = 'thomas'
os.makedirs(dst, exist_ok=True)
meta = json.load(open(os.path.join(src, 'model.json')))

alb = np.array(Image.open(os.path.join(src, 'albedo.png')).convert('RGBA'))
nor_full = np.array(Image.open(os.path.join(src, 'normal.png')).convert('RGBA'))

# Every frame is rendered with room to spare; crop them all to the box the figure ever uses (even
# numbers, so the half-size normals stay aligned) and lay them out again. This roughly halves the
# memory the game spends decoding them.
W, H, cols = meta['w'], meta['h'], meta['cols']
count = sum(n for _, n in meta['anims'].values())
cells = [((k % cols) * W, (k // cols) * H) for k in range(count)]
used = np.zeros((H, W), bool)
for x, y in cells:
    used |= alb[y:y + H, x:x + W, 3] >= 100
ys, xs = np.where(used)
x0, x1 = max(0, (xs.min() - 2) // 2 * 2), min(W, (xs.max() + 4) // 2 * 2)
y0, y1 = max(0, (ys.min() - 2) // 2 * 2), min(H, (ys.max() + 4) // 2 * 2)
w2, h2 = x1 - x0, y1 - y0
rows = -(-count // cols)
packed_a = np.zeros((rows * h2, cols * w2, 4), np.uint8)
packed_n = np.zeros_like(packed_a)
for k, (x, y) in enumerate(cells):
    r, c = divmod(k, cols)
    packed_a[r * h2:(r + 1) * h2, c * w2:(c + 1) * w2] = alb[y + y0:y + y1, x + x0:x + x1]
    packed_n[r * h2:(r + 1) * h2, c * w2:(c + 1) * w2] = nor_full[y + y0:y + y1, x + x0:x + x1]
alb, nor_full = packed_a, packed_n
meta.update(w=int(w2), h=int(h2), ax=int(meta['ax'] - x0), ay=int(meta['ay'] - y0))

solid = alb[..., 3] >= 100
# the lantern glass is stored lit (the usual case, and what low quality shows); Actor dims it when
# the lantern is out
alb[solid & (nor_full[..., 2] > 128), :3] = (255, 214, 140)
alb[..., 3] = np.where(solid, 255, 0)
alb[~solid, :3] = 0
Image.fromarray(alb, 'RGBA').quantize(255, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(
    os.path.join(dst, 'albedo.png'), optimize=True)

# half-size normals: average only the covered pixels of each 2x2 block, so edges keep their slope
nor = nor_full.astype(np.float32)
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
