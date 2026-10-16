"""Validate the V2 game candidate against the production contract. System python.
usage: python verify_candidate.py  (paths fixed inside the benchmark)
Prints TESTED / PARTIAL / NOT_TESTED lines + measurements. Exit 0 = contract holds.
"""
import json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..'))
CAND = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(ROOT, 'exports', 'game_candidate')
PROD = os.path.normpath(os.path.join(ROOT, '..', '..', 'assets', 'models', 'thomas'))
fails = []
def check(name, ok, detail=''):
    print(('TESTED   ' if ok else 'FAIL     ') + name + (f' — {detail}' if detail else ''))
    if not ok:
        fails.append(name)

cm = json.load(open(os.path.join(CAND, 'model.json')))
pm = json.load(open(os.path.join(PROD, 'model.json')))
check('contract anims identical', cm['anims'] == pm['anims'],
      f"{sum(n for _, n in cm['anims'].values())} frames, {len(cm['anims'])} anims")
# contiguous indices from 0
idx = [(s, n) for s, n in cm['anims'].values()]
flat = [i for s, n in idx for i in range(s, s + n)]
check('indices contiguous 0..N', flat == list(range(len(flat))), f'N={len(flat)}')
for k in ('height', 'cols', 'ns'):
    check(f'meta {k} == production', cm[k] == pm[k], f"cand={cm[k]} prod={pm[k]}")
print(f'PARTIAL  frame box differs (expected, wider silhouette) — cand w/h/ax/ay={cm["w"]}/{cm["h"]}/{cm["ax"]}/{cm["ay"]} prod={pm["w"]}/{pm["h"]}/{pm["ax"]}/{pm["ay"]}')

alb = np.array(Image.open(os.path.join(CAND, 'albedo.png')).convert('RGBA'))
nor = np.array(Image.open(os.path.join(CAND, 'normal.png')).convert('RGBA'))
rows = -(-len(flat) // cm['cols'])
check('albedo dims match meta', (alb.shape[1], alb.shape[0]) == (cm['cols'] * cm['w'], rows * cm['h']),
      f'{alb.shape[1]}x{alb.shape[0]}')
check('normal is half-size', (nor.shape[1], nor.shape[0]) == (alb.shape[1] // 2, alb.shape[0] // 2),
      f'{nor.shape[1]}x{nor.shape[0]}')
# no empty cells
empty = 0
for k in range(len(flat)):
    r, c = divmod(k, cm['cols'])
    cell = alb[r * cm['h']:(r + 1) * cm['h'], c * cm['w']:(c + 1) * cm['w']]
    if (cell[..., 3] >= 100).sum() < 50:
        empty += 1
check('no empty cells', empty == 0, f'empty={empty}/{len(flat)}')
# hard alpha
ua = np.unique(alb[..., 3])
check('hard alpha', set(ua.tolist()) <= {0, 255}, f'alpha values={ua.tolist()}')
# glass mask: B>128 fraction small, albedo lit warm there
glass = (nor[..., 2] > 128) & (nor[..., 3] >= 100)
frac = float(glass.mean())
check('glass mask present + small', 0.0005 < frac < 0.05, f'{frac * 100:.2f}% of normal atlas')
# feet alignment ratios
for tag, m in (('prod', pm), ('cand', cm)):
    print(f'MEASURE  {tag} ax/w={m["ax"] / m["w"]:.3f} ay/h={m["ay"] / m["h"]:.3f} ground_overhang={m["ay"] - m["h"]}px')
# sizes + VRAM estimate (decoded RGBA in engine)
import glob as _g
sizes = {os.path.basename(p): os.path.getsize(p) for p in _g.glob(os.path.join(CAND, '*'))}
dec_alb = cm['cols'] * cm['w'] * rows * cm['h'] * 4
dec_nor = (cm['cols'] * cm['w'] // 2) * (rows * cm['h'] // 2) * 4
print(f'MEASURE  files bytes={sizes} total_png={sum(sizes.values()) // 1024}KB')
print(f'MEASURE  decoded_est albedo={dec_alb // 1024}KB normal={dec_nor // 1024}KB total={(dec_alb + dec_nor) // 1024}KB')
ps = {f: os.path.getsize(os.path.join(PROD, f)) for f in ('albedo.png', 'normal.png')}
print(f'MEASURE  production png albedo={ps["albedo.png"] // 1024}KB normal={ps["normal.png"] // 1024}KB')
# comparison files exist + legible sizes
comp_needed = ['01_hero_modelo_antes_despues.png', '02_silueta_antes_despues.png',
               '03_gameplay_640x360_antes_despues.png', '04_gameplay_1280x720_pixelado.png',
               '05_animacion_contact_sheet.png', '06_rostro_manos_ropa.png',
               '07_topologia_materiales.png', '08_galeria_general.png', 'preview_idle_walk.gif']
missing = [f for f in comp_needed if not os.path.exists(os.path.join(ROOT, 'comparison', f))]
check('comparison set complete', not missing, f'missing={missing}')
g34 = Image.open(os.path.join(ROOT, 'comparison', '03_gameplay_640x360_antes_despues.png'))
check('03 is 640x360', g34.size == (640, 360), str(g34.size))
g47 = Image.open(os.path.join(ROOT, 'comparison', '04_gameplay_1280x720_pixelado.png'))
check('04 is 1280x720', g47.size == (1280, 720), str(g47.size))
if 'game_candidate_v21' in os.path.basename(CAND):
    print('PARTIAL   Buck\'s Row was tested in a real browser with the unchanged engine (see comparison/ab_bucks_row); this validator does not launch the browser')
    print('NOT_TESTED Android / full story / physical-device frame rate')
else:
    print('NOT_TESTED V2.0 inside actual game engine / Android; the 03 comparison is a mockup')
print('RESULT', 'PASS' if not fails else f'FAIL {fails}')
sys.exit(1 if fails else 0)
