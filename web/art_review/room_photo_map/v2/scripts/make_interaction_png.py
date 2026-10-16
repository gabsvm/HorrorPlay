"""El Huesped T-B: interaction sheet (lantern inside vs outside, real engine).

  python make_interaction_png.py

Reads v2/work/interaction/{photo,map}_{in,out}_640x360.png, writes the single
side-by-side sheet v2/comparison/INTERACTION_640.png (< 600 KB). All paths
relative to this script.
"""
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve()
TASK_V2 = HERE.parent.parent
WORK = TASK_V2 / 'work' / 'interaction'
OUT = TASK_V2 / 'comparison'

CELLS = [
    ('photo_in_640x360.png', 'FOTO — farol DENTRO (examinable, con etiqueta)'),
    ('photo_out_640x360.png', 'FOTO — farol FUERA en el cartón (sin etiqueta)'),
    ('map_in_640x360.png', 'MAPA — farol DENTRO (examinable, con etiqueta)'),
    ('map_out_640x360.png', 'MAPA — farol FUERA en la cartela (sin etiqueta)'),
]
BAR = 24
BG = (8, 6, 5)
FG = (216, 190, 150)


def plate(path):
    im = Image.open(path).convert('RGB')
    assert im.size == (640, 360), path
    return im


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.new('RGB', (1280, 720 + 2 * BAR), BG)
    draw = ImageDraw.Draw(sheet)
    for i, (name, caption) in enumerate(CELLS):
        im = plate(WORK / name)
        x = (i % 2) * 640
        y = (i // 2) * (360 + BAR)
        draw.text((x + 8, y + 5), caption, fill=FG)
        sheet.paste(im, (x, y + BAR))
    dest = OUT / 'INTERACTION_640.png'
    sheet.save(dest, optimize=True)
    n = dest.stat().st_size
    print('WROTE', dest, n, 'bytes')
    assert n < 600 * 1024, n


if __name__ == '__main__':
    main()
