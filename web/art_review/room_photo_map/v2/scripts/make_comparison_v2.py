"""El Huesped T2 photo v2: side-by-side 640 comparisons (before/after).

  python make_comparison_v2.py

Reads v2/work/before + v2/work/after 640x360 shots, writes one AB PNG per
scene into v2/comparison/ (each < 600 KB). All paths relative to this script.
"""
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve()
TASK_V2 = HERE.parent.parent
WORK = TASK_V2 / 'work'
OUT = TASK_V2 / 'comparison'

SCENES = [
    # wall scenes read at ~47 px wide in the 640 frame: halves at 480 keep
    # framing/luminance/mood legible while the PNG stays under 600 KB.
    # Inspection scenes keep native 640 halves (faces are judged there).
    ('wall_c1', 'Wall (ch.1): pictograms -> modelled brothers', 480),
    ('inspect_photo_c1', 'Inspection + lantern (ch.1): faces readable', 640),
    ('wall_c3', 'Wall (ch.3): scratch over the elder brother', 480),
    ('inspect_photo_c3', 'Inspection (ch.3): elder face scraped, Nat intact', 640),
]


def plate(path):
    im = Image.open(path).convert('RGB')
    assert im.size == (640, 360), path
    return im


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for tag, title, half_w in SCENES:
        a = plate(WORK / 'before' / (tag + '_640x360.png'))
        b = plate(WORK / 'after' / (tag + '_640x360.png'))
        half_h = int(360 * half_w / 640)
        a = a.resize((half_w, half_h), Image.LANCZOS)
        b = b.resize((half_w, half_h), Image.LANCZOS)
        sheet = Image.new('RGB', (half_w * 2, half_h + 40), (16, 14, 12))
        sheet.paste(a, (0, 40))
        sheet.paste(b, (half_w, 40))
        d = ImageDraw.Draw(sheet)
        d.text((12, 10), 'BEFORE', fill=(255, 240, 210))
        d.text((half_w + 12, 10), 'AFTER (v2 Blender brothers)', fill=(255, 240, 210))
        out = OUT / ('AB_%s_640.png' % tag)
        buf = BytesIO()
        sheet.save(buf, format='PNG', optimize=True)
        if len(buf.getvalue()) < 600 * 1024:
            out.write_bytes(buf.getvalue())
        else:
            # grainy wall frames: adaptive 255-color PNG stays faithful and small
            small = sheet.convert('P', palette=Image.ADAPTIVE, colors=255).convert('RGB')
            small.save(out, optimize=True)
            print('NOTE %s quantized to PNG-8 palette for size' % tag)
        print('WROTE', out.relative_to(TASK_V2.parent.parent.parent), out.stat().st_size, 'bytes')
        assert out.stat().st_size < 600 * 1024, out


main()
