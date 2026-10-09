"""The launcher icon, from one painting (android/icon-source.png, square).
usage: python web/tools/make-icon.py
Writes the Android adaptive icon (the painting as the foreground layer of 108dp, over a night-blue
background, so every launcher mask fills edge to edge), the legacy square icons for Android 7, and
windows/icon.ico. The painting is framed on the lamp and the man, and padded with its own blurred
edges so the 72dp the mask shows keeps both whole."""
import os
from PIL import Image, ImageFilter

os.chdir(os.path.join(os.path.dirname(__file__), '..'))
src = Image.open('android/icon-source.png').convert('RGB')
W = src.width
CX, CY = 0.49, 0.405         # between the lantern and the man's shoulders, as a fraction of the painting
VISIBLE = 0.80               # what the mask shows (72 of 108dp), as a fraction of the painting

side = round(W * VISIBLE * 108 / 72)
cx, cy = round(W * CX), round(W * CY)
x0, y0 = cx - side // 2, cy - side // 2
# padding: the painting stretched and blurred, darkened, under the painting itself
pad = src.resize((side, side), Image.LANCZOS).filter(ImageFilter.GaussianBlur(side / 40))
pad = Image.eval(pad, lambda v: int(v * 0.55))
full = pad.copy()
full.paste(src, (-x0, -y0))
# soften the seam between the painting and its padding
mask = Image.new('L', (side, side), 0)
inner = Image.new('L', (W, W), 255)
mask.paste(inner, (-x0, -y0))
mask = mask.filter(ImageFilter.GaussianBlur(side / 60))
full = Image.composite(full, pad, mask)

DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
cut = side * 18 // 108                                        # the 18dp margin outside the visible 72dp
visible = full.crop((cut, cut, side - cut, side - cut))
for d, k in DENS.items():
    os.makedirs(f'android/res/mipmap-{d}', exist_ok=True)
    full.resize((round(108 * k),) * 2, Image.LANCZOS).save(f'android/res/mipmap-{d}/ic_launcher_foreground.png', optimize=True)
    visible.resize((round(48 * k),) * 2, Image.LANCZOS).save(f'android/res/mipmap-{d}/ic_launcher.png', optimize=True)

os.makedirs('android/res/mipmap-anydpi-v26', exist_ok=True)
open('android/res/mipmap-anydpi-v26/ic_launcher.xml', 'w').write(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
    '    <background android:drawable="@color/ic_launcher_background"/>\n'
    '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
    '</adaptive-icon>\n')
os.makedirs('android/res/values', exist_ok=True)
open('android/res/values/ic_launcher.xml', 'w').write(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<resources>\n    <color name="ic_launcher_background">#0B0D12</color>\n</resources>\n')

visible.resize((256, 256), Image.LANCZOS).save('windows/icon.ico', sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
visible.resize((512, 512), Image.LANCZOS).save(os.environ.get('ICON_PREVIEW', 'dist/icon-preview.png'))
print('icon', side, 'px canvas, visible', visible.size)
