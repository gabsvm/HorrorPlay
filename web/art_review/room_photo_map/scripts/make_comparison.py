"""Before/after contact sheets for T2 (room photograph + Whitechapel map).

Run: python web/art_review/room_photo_map/scripts/make_comparison.py
Reads work/before + work/after (see capture_room.mjs), writes comparison/.
Rain is animated, so pixels never match exactly; these are visual QA sheets.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BEFORE = ROOT / 'work' / 'before'
AFTER = ROOT / 'work' / 'after'
OUT = ROOT / 'comparison'
OUT.mkdir(parents=True, exist_ok=True)


def font(size):
    for p in ('C:/Windows/Fonts/arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def sheet(left, right, title, left_tag, right_tag, out):
    a = Image.open(left).convert('RGB')
    b = Image.open(right).convert('RGB')
    assert a.size == b.size == (640, 360), (left, a.size, right, b.size)
    im = Image.new('RGB', (1280, 430), (13, 17, 22))
    d = ImageDraw.Draw(im)
    d.text((20, 9), title, fill=(234, 217, 178), font=font(22))
    d.text((20, 39), left_tag, fill=(183, 193, 197), font=font(16))
    d.text((660, 39), right_tag, fill=(183, 193, 197), font=font(16))
    im.paste(a, (0, 70))
    im.paste(b, (640, 70))
    d.line([(640, 70), (640, 430)], fill=(208, 177, 118), width=2)
    # 255-colour sheets: the repo keeps one 640 comparison per view (<600 KB)
    im = im.quantize(colors=255, method=Image.Quantize.MEDIANCUT,
                     dither=Image.Dither.FLOYDSTEINBERG)
    im.save(out, optimize=True)
    print('SHEET', out, out.stat().st_size, 'bytes')


sheet(BEFORE / 'room_photo_640x360.png', AFTER / 'room_photo_640x360.png',
      'EL HUÉSPED · HABITACIÓN DE THOMAS · FOTOGRAFÍA', 'ANTES · FIGURAS ESQUEMÁTICAS',
      'DESPUÉS · ALBÚMINA 1860s (E. VANCE) + INSPECCIÓN', OUT / 'AB_room_photo_640.png')
sheet(BEFORE / 'room_map_640x360.png', AFTER / 'room_map_640x360.png',
      'EL HUÉSPED · HABITACIÓN DE THOMAS · MAPA', 'ANTES · CUADRÍCULA GENÉRICA',
      'DESPUÉS · WHITECHAPEL 1888 EN TINTA + INSPECCIÓN', OUT / 'AB_room_map_640.png')
# inspection views are new (the old hotspots only thought out loud)
sheet(AFTER / 'inspect_photo_640x360.png', AFTER / 'inspect_map_640x360.png',
      'EL HUÉSPED · INSPECCIONES NUEVAS (VISTAS DE FAROL)', 'FOTOGRAFÍA · CAPÍTULO 1 INTACTA',
      'MAPA · TINTA Y LÁPIZ LEGIBLES', OUT / 'INSP_room_640.png')
