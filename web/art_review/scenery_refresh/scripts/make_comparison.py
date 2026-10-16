"""Build before/after contact sheets from genuine engine screenshots.

Run: python web/art_review/scenery_refresh/scripts/make_comparison.py
Screenshots come from capture_scene.mjs. Animated rain and timed props do not
have exactly identical pixels; they are not used for numerical asset diffs.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parent.parent
BEFORE=ROOT/'comparison'/'before'
AFTER=ROOT/'comparison'/'final'
OUT=ROOT/'comparison'
OUT.mkdir(parents=True,exist_ok=True)

def font(size):
    for p in ('C:/Windows/Fonts/arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if Path(p).exists():return ImageFont.truetype(p,size)
    return ImageFont.load_default()

for scene,label in [('knackers','WINTHROP STREET · WREN / POSTE'),('bucks_row','BUCK\'S ROW · FAROLA DE GAS')]:
    old=BEFORE/f'{scene}_640x360_production.png'
    new=AFTER/f'{scene}_640x360.png'
    if not old.exists() or not new.exists():
        if scene=='bucks_row':
            # Buck's Row has a genuine pre-upgrade screenshot from Thomas A/B.
            old=Path(__file__).resolve().parents[2]/'thomas_v2'/'comparison'/'ab_bucks_row'/'bucks_row_640x360_production.png'
        if not old.exists():
            print('SKIPPED',scene,'baseline unavailable')
            continue
    a=Image.open(old).convert('RGB');b=Image.open(new).convert('RGB')
    assert a.size==b.size==(640,360)
    out=Image.new('RGB',(1280,430),(13,17,22))
    d=ImageDraw.Draw(out)
    d.text((20,9),label,fill=(234,217,178),font=font(22))
    d.text((20,39),'ANTES · ASSETS ANTERIORES',fill=(183,193,197),font=font(16))
    d.text((660,39),'DESPUÉS · MODELOS BLENDER',fill=(183,193,197),font=font(16))
    out.paste(a,(0,70));out.paste(b,(640,70))
    d.line([(640,70),(640,430)],fill=(208,177,118),width=2)
    p=OUT/f'AB_{scene}_640.png';out.save(p)
    print('SHEET',p)

# Present the new Blender source assets to make the artistic scope explicit.
pieces=[
    ('POSTE DE AMARRE',ROOT/'renders'/'wren_hitching_post_raw.png'),
    ('FAROLA 3D DEV',Path(__file__).resolve().parents[2]/'gas_lamp'/'gas_lamp_2x.png'),
    ('BARCA DE NAT',ROOT/'renders'/'nat_boat_raw.png'),
    ('CAJÓN VICTORIANO',ROOT/'renders'/'crate_raw.png'),
]
boxw,boxh=300,360
out=Image.new('RGB',(boxw*4,boxh+65),(13,17,22))
d=ImageDraw.Draw(out)
d.text((20,11),'EL HUÉSPED · NUEVOS ASSETS 3D PRE-RENDERIZADOS',fill=(234,217,178),font=font(22))
for k,(name,path) in enumerate(pieces):
    im=Image.open(path).convert('RGBA')
    im.thumbnail((boxw-24,boxh-42),Image.Resampling.LANCZOS)
    x=k*boxw+(boxw-im.width)//2
    y=56+(boxh-im.height)//2
    out.paste(im,(x,y),im)
    d.text((k*boxw+14,boxh+38),name,fill=(211,195,163),font=font(16))
out.save(OUT/'GALERIA_NUEVOS_ASSETS.png')
print('SHEET',OUT/'GALERIA_NUEVOS_ASSETS.png')
