"""Draws the launcher icon (a figure in a bowler under a gas lamp, in the fog) at every Android density.
usage: python web/tools/make-icon.py"""
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = 512
img = Image.new('RGB', (S, S), (8, 10, 14))
d = ImageDraw.Draw(img)
# night sky to fog
for y in range(S):
    k = y / S
    d.line([(0, y), (S, y)], fill=(int(10 + 30 * k), int(14 + 30 * k), int(20 + 26 * k)))
# lamp glow
glow = Image.new('L', (S, S), 0)
ImageDraw.Draw(glow).ellipse([S * 0.48, S * 0.08, S * 0.92, S * 0.52], fill=255)
glow = glow.filter(ImageFilter.GaussianBlur(S * 0.08))
img = Image.composite(Image.new('RGB', (S, S), (230, 170, 90)), img, glow.point(lambda v: int(v * 0.75)))
d = ImageDraw.Draw(img)
# lamp post
d.rectangle([S * 0.69, S * 0.28, S * 0.72, S * 0.98], fill=(12, 12, 14))
d.polygon([(S * 0.64, S * 0.2), (S * 0.77, S * 0.2), (S * 0.75, S * 0.31), (S * 0.66, S * 0.31)], fill=(14, 14, 16))
d.rectangle([S * 0.665, S * 0.215, S * 0.745, S * 0.295], fill=(255, 214, 140))
# the figure: greatcoat, bowler, collar up
fx = S * 0.38
d.ellipse([fx - 30, S * 0.42, fx + 30, S * 0.5], fill=(10, 10, 12))                       # head
d.ellipse([fx - 52, S * 0.405, fx + 52, S * 0.43], fill=(8, 8, 10))                       # brim
d.chord([fx - 34, S * 0.33, fx + 34, S * 0.46], 180, 360, fill=(8, 8, 10))                # crown
d.polygon([(fx - 60, S * 0.5), (fx + 60, S * 0.5), (fx + 92, S * 0.98), (fx - 92, S * 0.98)], fill=(10, 10, 12))
d.polygon([(fx + 60, S * 0.5), (fx + 92, S * 0.98), (fx + 84, S * 0.98), (fx + 54, S * 0.52)], fill=(120, 84, 44))   # rim light
# wet street
for y in range(int(S * 0.94), S):
    d.line([(0, y), (S, y)], fill=(18, 16, 14))
d.rectangle([S * 0.66, S * 0.95, S * 0.75, S], fill=(110, 80, 44))
for name, px in [('mdpi', 48), ('hdpi', 72), ('xhdpi', 96), ('xxhdpi', 144), ('xxxhdpi', 192)]:
    out = os.path.join(ROOT, 'android', 'res', f'mipmap-{name}', 'ic_launcher.png')
    img.resize((px, px), Image.LANCZOS).save(out)
print('icons ok')
