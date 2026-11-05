"""Prepare Poly Haven 1k diffuse JPGs (downloaded separately) for the game.

Usage: python web/tools/prepare-materials.py /path/to/originals
Requires Pillow. The input files use the asset IDs as their filenames.
"""
from pathlib import Path
from sys import argv
from PIL import Image, ImageOps

source = Path(argv[1])
target = Path(__file__).resolve().parents[1] / 'assets' / 'materials'
target.mkdir(parents=True, exist_ok=True)
for name in ('brown_brick_02', 'cobblestone_floor_04', 'wood_floor_worn',
             'painted_plaster_wall', 'brown_mud_rocks_01'):
    image = Image.open(source / (name + '.jpg')).convert('RGB')
    image = image.resize((512, 512), Image.Resampling.LANCZOS)
    if name == 'wood_floor_worn':
        image = image.transpose(Image.Transpose.ROTATE_90)
    image.save(target / (name + '.jpg'), quality=84, optimize=True, subsampling=0)

# The Met's Marigold sheet includes a printed border. Crop one repeating section,
# and remap its blue ink and cream paper to the subdued ink/paper palette.
marigold = Image.open(source / 'marigold.jpg').convert('RGB').crop((21, 95, 260, 334))
marigold = ImageOps.colorize(ImageOps.grayscale(marigold), '#262721', '#d0c1a1')
marigold.save(target / 'marigold.jpg', quality=88, optimize=True)
