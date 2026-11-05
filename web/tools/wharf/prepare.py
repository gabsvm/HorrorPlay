"""Rebuild the far-bank sprite: python web/tools/wharf/prepare.py DP813302.jpg

Black Lion Wharf (1859), J. M. Whistler, The Met, 17.3.35. Public domain.
Source: https://images.metmuseum.org/CRDImages/dp/web-large/DP813302.jpg
Object: https://www.metmuseum.org/art/collection/search/372506
"""
from hashlib import sha256
from pathlib import Path
import sys

from PIL import Image, ImageChops, ImageDraw, ImageOps

source = Path(sys.argv[1])
if sha256(source.read_bytes()).hexdigest() != '8c57f9cf1a472d0b922a9c879663443dda04f29ee910ed873e240cf5b7918bc9':
    raise ValueError('Use the web-large DP813302.jpg edition linked above.')

# Trace the river-facing roofline. Masts above it keep their ink and lose the paper.
ink = ImageOps.grayscale(Image.open(source)).resize((900, 627), Image.Resampling.LANCZOS)
roof = [(18,241),(80,137),(124,125),(157,114),(181,124),(204,122),(230,133),
        (243,132),(256,111),(318,104),(321,38),(327,31),(329,102),(374,101),
        (390,130),(404,134),(433,135),(465,125),(500,117),(501,98),(510,94),
        (514,111),(520,110),(523,95),(532,94),(535,104),(548,102),(557,99),
        (565,106),(580,99),(588,97),(592,69),(598,67),(600,100),(622,100),
        (635,108),(648,96),(660,96),(663,103),(687,105),(688,82),(695,78),
        (699,97),(749,96),(754,78),(759,80),(762,98),(765,53),(782,38),
        (818,35),(839,43),(843,77),(865,84),(880,94)]
mask = Image.new('L',ink.size)
ImageDraw.Draw(mask).polygon(roof + [(880,278),(18,278)],fill=255)
rigging = ink.point(lambda v: max(0, min(255,(161-v)*2)))
mask=ImageChops.lighter(mask,rigging)
crop=(19,24,879,278)
tone=ImageOps.autocontrast(ink.crop(crop),cutoff=(1,4))
out=Path(__file__).resolve().parents[2]/'assets/props'
# Restrict the tonal range to keep this distant bank behind the jetty and actor.
for period, shadow, light in [('dusk','#211d20','#705c4e'),('night','#081014','#384b4c')]:
    sprite=ImageOps.colorize(tone,shadow,light).convert('RGBA')
    sprite.putalpha(mask.crop(crop))
    sprite=sprite.resize((688,203),Image.Resampling.LANCZOS)
    sprite.quantize(colors=128,method=Image.Quantize.FASTOCTREE).save(out/f'wharf_{period}.png',optimize=True)
