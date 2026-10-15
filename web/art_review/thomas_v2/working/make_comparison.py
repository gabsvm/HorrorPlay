"""Build comparison/01..08 + preview gif + sample_frames. System python, PIL only."""
import json, os, shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
WORK = os.path.join(ROOT, 'working')
COMP = os.path.join(ROOT, 'comparison')
EXP = os.path.join(ROOT, 'exports', 'game_candidate')
SAMP = os.path.join(ROOT, 'exports', 'sample_frames')
os.makedirs(COMP, exist_ok=True)
os.makedirs(SAMP, exist_ok=True)

PROD_DIR = os.path.abspath(os.path.join(ROOT, '..', '..', 'assets', 'models', 'thomas'))
prod_alb = Image.open(os.path.join(PROD_DIR, 'albedo.png')).convert('RGBA')
prod_meta = json.load(open(os.path.join(PROD_DIR, 'model.json')))
cand_alb = Image.open(os.path.join(EXP, 'albedo.png')).convert('RGBA')
cand_meta = json.load(open(os.path.join(EXP, 'model.json')))

def arial(sz):
    for p in ('C:/Windows/Fonts/arial.ttf', 'C:/Windows/Fonts/seguisb.ttf'):
        try:
            return ImageFont.truetype(p, sz)
        except Exception:
            pass
    return ImageFont.load_default()

F_TITLE, F_BIG, F_MED, F_SMALL = arial(54), arial(40), arial(30), arial(24)

def cell(img, meta, idx):
    w, h, cols = meta['w'], meta['h'], meta['cols']
    x, y = (idx % cols) * w, (idx // cols) * h
    return img.crop((x, y, x + w, y + h))

def foot_canvas(sprite, meta, cw, ch, foot_xy, bg):
    c = Image.new('RGBA', (cw, ch), bg)
    fx, fy = foot_xy
    c.alpha_composite(sprite, (int(fx - meta['ax']), int(fy - meta['ay'])))
    return c

def banner(img, text, sub=None):
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, img.width, 96 if sub is None else 150], fill=(12, 12, 16, 255))
    d.text((24, 18), text, font=F_TITLE, fill=(240, 235, 220, 255))
    if sub:
        d.text((24, 78), sub, font=F_MED, fill=(200, 190, 170, 255))
    return img

def tag(img, text, xy=(16, 110)):
    d = ImageDraw.Draw(img)
    t = text
    bb = d.textbbox((0, 0), t, font=F_SMALL)
    w = bb[2] - bb[0] + 24
    d.rounded_rectangle([xy[0], xy[1], xy[0] + w, xy[1] + 44], 10, fill=(16, 16, 20, 230))
    d.text((xy[0] + 12, xy[1] + 8), t, font=F_SMALL, fill=(255, 220, 150, 255))
    return img

BV2 = {'idle': 0, 'talk': 12, 'turn': 20, 'walk': 23, 'walk3': 39, 'walkh': 51,
       'walkq': 63, 'run': 75, 'kneel': 87, 'take': 91, 'inspect': 95, 'recoil': 99,
       'clutch': 103, 'write': 107, 'sit': 111, 'reach': 115, 'reach_lo': 119,
       'reach_mid': 120, 'reach_hi': 121}
print('assets loaded', prod_alb.size, cand_alb.size)

# ---- sample_frames: one raw V2 frame per anim ----
for name, idx in BV2.items():
    src = os.path.join(WORK, 'v2_raw', 'frames', f'{name}_00_a.png')
    if name in ('idle', 'talk', 'walk', 'run'):
        src = os.path.join(WORK, 'v2_raw', 'frames', f'{name}_04_a.png')
    if os.path.exists(src):
        shutil.copy(src, os.path.join(SAMP, f'{name}.png'))
print('samples:', len(os.listdir(SAMP)))

# ---- 01 hero: fair B vs C side, + studio D strip ----
b_raw = Image.open(os.path.join(WORK, 'baseline_full', 'frames', 'idle_00_a.png'))
v_raw = Image.open(os.path.join(WORK, 'v2_raw', 'frames', 'idle_00_a.png'))
hero = Image.new('RGBA', (1600, 1150), (24, 24, 28, 255))
banner(hero, '01  THOMAS V2  —  ANTES / DESPUES', 'Misma pose, tamano, angulo, encuadre (B baseline regenerado vs C candidato) — Antes IZQ, V2 DER')
for i, (frm, lab) in enumerate(((b_raw, '(B) ANTES regenerado'), (v_raw, '(C) V2 candidato'))):
    big = frm.resize((frm.width * 3, frm.height * 3), Image.NEAREST)
    hero.alpha_composite(big, (60 + i * 700, 180))
    d = ImageDraw.Draw(hero)
    d.text((60 + i * 700, 180 + big.height + 8), lab, font=F_BIG, fill=(255, 255, 255, 255))
st34 = Image.open(os.path.join(WORK, 'studio_34.png')).convert('RGBA')
st34.thumbnail((380, 380), Image.LANCZOS)
hero.alpha_composite(st34, (1150, 700))
d = ImageDraw.Draw(hero)
d.text((620, 700), '(D) master estudio 3/4 →', font=F_MED, fill=(255, 220, 150, 255))
d.text((620, 740), 'NO representativo del juego', font=F_MED, fill=(255, 220, 150, 255))
hero.convert('RGB').save(os.path.join(COMP, '01_hero_modelo_antes_despues.png'))
print('01 ok')

# ---- 02 silueta: dark + light, foot/head aligned ----
sil = Image.new('RGBA', (1600, 1050), (24, 24, 28, 255))
banner(sil, '02  SILUETA  —  ANTES / V2', 'Fondos claro y oscuro — figuras alineadas por pie y cabeza — Antes IZQ, V2 DER')
for row, bg in enumerate(((10, 10, 14, 255), (225, 220, 210, 255))):
    y0 = 170 + row * 430
    for col, frm in enumerate((b_raw, v_raw)):
        x0 = 80 + col * 730
        panel = Image.new('RGBA', (690, 400), bg)
        h = 370
        sc = h / frm.height
        w = int(frm.width * sc)
        small = frm.resize((w, h), Image.LANCZOS)
        panel.alpha_composite(small, ((690 - w) // 2, 400 - h - 6))
        sil.alpha_composite(panel, (x0, y0))
    d = ImageDraw.Draw(sil)
    ink = (255, 255, 255, 255) if row == 0 else (20, 20, 20, 255)
    d.text((80, y0 + 404), '(B) ANTES' if False else ('FONDO OSCURO  —  (B) ANTES izq / (C) V2 der' if row == 0 else 'FONDO CLARO  —  (B) ANTES izq / (C) V2 der'), font=F_MED, fill=ink if False else (255, 255, 255, 255))
sil.convert('RGB').save(os.path.join(COMP, '02_silueta_antes_despues.png'))
print('02 ok')

# ---- 03 gameplay 640x360 (E mockup) + 04 upscale ----
import math as _m
def street(w=320, h=360, lamp_x=250):
    base = Image.new('RGBA', (w, h), (0, 0, 0, 255))
    d = ImageDraw.Draw(base, 'RGBA')
    for y in range(h):
        k = y / h
        d.line([(0, y), (w, y)], fill=(int(8 + 18 * k), int(10 + 20 * k), int(16 + 26 * k), 255))
    for y in range(200, h, 14):
        d.line([(0, y), (w, y)], fill=(0, 0, 0, 45))
    for x in range(0, w, 26):
        d.line([(x, 200), (x - 12, h)], fill=(0, 0, 0, 35))
    for r in range(48, 0, -6):  # lamp halo
        a = int(110 * (1 - r / 52) ** 2)
        d.ellipse([lamp_x - r, 150 - r // 2, lamp_x + r, 150 + r // 2], fill=(255, 170, 80, a))
    d.ellipse([lamp_x - 8, 130, lamp_x + 8, 162], fill=(255, 205, 130, 255))
    d.rectangle([0, 0, w, 26], fill=(5, 6, 10, 255))  # rooftops band
    for x in range(10, w, 60):
        d.polygon([(x, 26), (x + 30, 26), (x + 15, 8)], fill=(10, 11, 16, 255))
    return base

def place(sprite, meta, scene, gx, gy, scale=0.5):
    w = max(1, int(sprite.width * scale))
    h = max(1, int(sprite.height * scale))
    sm = sprite.resize((w, h), Image.LANCZOS)
    ax = int(meta['ax'] * scale)
    ay = int(meta['ay'] * scale)
    scene.alpha_composite(sm, (int(gx - ax), int(gy - ay)))
    return scene

game = Image.new('RGBA', (640, 360), (0, 0, 0, 255))
left = street(320, 360, 250)
right = street(320, 360, 250)
before = cell(prod_alb, prod_meta, BV2['walk'] + 8)
after = cell(cand_alb, cand_meta, BV2['walk'] + 8)
place(before, prod_meta, left, 160, 330)
place(after, cand_meta, right, 160, 330)
game.alpha_composite(left, (0, 0))
game.alpha_composite(right, (320, 0))
d = ImageDraw.Draw(game)
d.rectangle([0, 0, 640, 84], fill=(12, 12, 16, 255))
d.text((16, 10), '03  GAMEPLAY 640x360 — ANTES / V2', font=arial(30), fill=(240, 235, 220, 255))
d.text((16, 48), '(E) mockup — misma luz/zoom/posicion', font=arial(22), fill=(200, 190, 170, 255))
d.text((24, 94), '(A) ANTES produccion', font=F_MED, fill=(255, 255, 255, 255))
d.text((344, 94), '(C) V2 candidato', font=F_MED, fill=(255, 230, 160, 255))
d.line([(320, 84), (320, 360)], fill=(255, 255, 255, 200), width=3)
game.convert('RGB').save(os.path.join(COMP, '03_gameplay_640x360_antes_despues.png'))
game.resize((1280, 720), Image.NEAREST).save(os.path.join(COMP, '04_gameplay_1280x720_pixelado.png'))
print('03+04 ok')

# ---- 05 contact sheet: same mid-cycle instants, A vs C ----
rows = [('walk', 8, 'caminar'), ('run', 6, 'correr'), ('talk', 4, 'hablar'),
        ('inspect', 2, 'inspeccionar'), ('kneel', 1, 'arrodillarse'), ('write', 2, 'escribir')]
sheet = Image.new('RGBA', (1600, 300 + 6 * 290), (24, 24, 28, 255))
banner(sheet, '05  ANIMACION — MISMO INSTANTE', '(A) atlas produccion IZQ  vs  (C) candidato V2 DER — fotograma medio de cada ciclo')
d = ImageDraw.Draw(sheet)
d.text((330, 170), '(A) ANTES', font=F_BIG, fill=(255, 255, 255, 255))
d.text((1030, 170), '(C) V2', font=F_BIG, fill=(255, 230, 160, 255))
for r, (anim, off, label) in enumerate(rows):
    y0 = 230 + r * 290
    d.text((40, y0 + 110), label, font=F_MED, fill=(200, 190, 170, 255))
    for c, (im, meta) in enumerate(((prod_alb, prod_meta), (cand_alb, cand_meta))):
        spr = cell(im, meta, BV2[anim] + off)
        panel = Image.new('RGBA', (620, 270), (38, 38, 44, 255))
        sc = 250 / spr.height
        sm = spr.resize((int(spr.width * sc), 250), Image.LANCZOS)
        panel.alpha_composite(sm, ((620 - sm.width) // 2, 250 - int(meta['ay'] * sc) + (250 - 250)))
        # foot align: place so ay lands at y=250
        panel = Image.new('RGBA', (620, 270), (38, 38, 44, 255))
        panel.alpha_composite(sm, ((620 - sm.width) // 2, 250 - int(meta['ay'] * sc)))
        sheet.alpha_composite(panel, (330 + c * 700, y0))
sheet.convert('RGB').save(os.path.join(COMP, '05_animacion_contact_sheet.png'))
print('05 ok')

# ---- 06 rostro/manos/ropa (D master, NO representativo) ----
det = Image.new('RGBA', (1600, 1000), (24, 24, 28, 255))
banner(det, '06  ROSTRO · MANOS · ROPA', '(D) detalle master 3D en estudio — expresamente NO representativo del juego')
front = Image.open(os.path.join(WORK, 'studio_front.png')).convert('RGBA')
tq = Image.open(os.path.join(WORK, 'studio_34.png')).convert('RGBA')
side = Image.open(os.path.join(WORK, 'studio_side.png')).convert('RGBA')
crops = [
    (front.crop((320, 130, 580, 390)), 'rostro: patillas, ojeras, rictus'),
    (tq.crop((330, 330, 590, 590)), 'mano + farol + punos'),
    (side.crop((280, 280, 620, 620)), 'abrigo: solapas, bufanda, botones'),
]
d = ImageDraw.Draw(det)
for i, (cr, lab) in enumerate(crops):
    cr = cr.resize((cr.width * 2, cr.height * 2), Image.LANCZOS)
    x0 = 60 + i * 510
    det.alpha_composite(cr, (x0, 200))
    d.text((x0, 200 + cr.height + 10), lab, font=F_MED, fill=(255, 255, 255, 255))
d.text((60, 936), 'A tamano real solo llegan silueta y contraste: decidir en 03.', font=F_SMALL, fill=(255, 220, 150, 255))
det.convert('RGB').save(os.path.join(COMP, '06_rostro_manos_ropa.png'))
print('06 ok')

# ---- 07 topologia/materiales ----
top = Image.new('RGBA', (1600, 1000), (24, 24, 28, 255))
banner(top, '07  TOPOLOGIA · MATERIALES', 'Estadisticas reales del .blend + paleta V2 — “ordenado” no significa game-ready')
edge = v_raw.convert('L').filter(ImageFilter.FIND_EDGES).convert('RGBA')
edge_big = edge.resize((520, 650), Image.LANCZOS)
top.alpha_composite(edge_big, (60, 200))
d = ImageDraw.Draw(top)
d.text((60, 860), 'bordes del frame V2 (orientativo)', font=F_MED, fill=(255, 255, 255, 255))
stats = ['116 objetos malla · 11.260 verts · 11.858 polys', '44 materiales · 6 colecciones', 'rig: 21 empties (RIG)',
         'camaras: cam orto + 4 estudio', 'luces: KEY ambar + FILL azul + RIM', '.blend 212 KB · .glb 406 KB']
for i, s in enumerate(stats):
    d.text((660, 220 + i * 52), '· ' + s, font=F_MED, fill=(255, 255, 255, 255))
pal = [('#2e3238', 'abrigo'), ('#5c1a15', 'bufanda'), ('#a78a6f', 'piel'),
       ('#17110c', 'pelo'), ('#d9cfba', 'solapa'), ('#c9a24a', 'laton'),
       ('#141518', 'pantalon'), ('#38301f', 'guantes')]
for i, (hx, nm) in enumerate(pal):
    x0, y0 = 660 + (i % 4) * 220, 600 + (i // 4) * 110
    d.rectangle([x0, y0, x0 + 200, y0 + 56], fill=hx)
    d.text((x0 + 6, y0 + 62), hx + ' ' + nm, font=F_SMALL, fill=(255, 255, 255, 255))
d.text((660, 880), 'Sin captura wireframe en batch: inspeccionar el .blend.', font=F_SMALL, fill=(255, 220, 150, 255))
top.convert('RGB').save(os.path.join(COMP, '07_topologia_materiales.png'))
print('07 ok')

# ---- 08 galeria general (movil, retrato) ----
gal = Image.new('RGBA', (1200, 1900), (16, 16, 20, 255))
d = ImageDraw.Draw(gal)
d.rectangle([0, 0, 1200, 210], fill=(12, 12, 16, 255))
d.text((40, 30), 'THOMAS ASHGROVE V2', font=arial(64), fill=(240, 235, 220, 255))
d.text((40, 110), 'Benchmark de arte · ANTES izq / V2 der', font=arial(30), fill=(255, 220, 150, 255))
d.text((40, 152), 'Abrir en el telefono: comparison/01 - 03 - 05 - preview_idle_walk.gif', font=arial(26), fill=(200, 190, 170, 255))
h01 = Image.open(os.path.join(COMP, '01_hero_modelo_antes_despues.png')).convert('RGBA')
h01.thumbnail((1120, 640), Image.LANCZOS)
gal.alpha_composite(h01, ((1200 - h01.width) // 2, 230))
d = ImageDraw.Draw(gal)
d.text((40, 230 + h01.height + 8), '01 heroe (B vs C, justo) + estudio (D)', font=F_MED, fill=(255, 255, 255, 255))
g03 = Image.open(os.path.join(COMP, '03_gameplay_640x360_antes_despues.png')).convert('RGBA')
g03.thumbnail((560, 330), Image.LANCZOS)
gal.alpha_composite(g03, (40, 230 + h01.height + 60))
g05 = Image.open(os.path.join(COMP, '05_animacion_contact_sheet.png')).convert('RGBA')
g05.thumbnail((540, 700), Image.LANCZOS)
gal.alpha_composite(g05, (620, 230 + h01.height + 60))
d = ImageDraw.Draw(gal)
y2 = 230 + h01.height + 60 + max(g03.height, g05.height) + 16
d.text((40, 230 + h01.height + 60 + g03.height + 8), '03 gameplay nativo (E mockup)', font=F_MED, fill=(255, 255, 255, 255))
d.text((620, 230 + h01.height + 60 + g05.height + 8), '05 animacion, mismo instante (A vs C)', font=F_MED, fill=(255, 255, 255, 255))
y3 = y2 + 50
for i, line in enumerate(['VEREDICTO: CANDIDATE_READY_FOR_REVIEW (revisar 03 a tamano real)', 'MEJORA: silueta, cara, bufanda, farol, botones (ver REPORT)',
                          'CONTRATO: 122 frames, anims OK, height 206, ns 0.5',
                          'RUTAS: source/*.blend - exports/game_candidate/ - comparison/']):
    d.text((40, y3 + i * 44), line, font=arial(30), fill=(235, 230, 215, 255))
gal.convert('RGB').save(os.path.join(COMP, '08_galeria_general.png'))
print('08 ok')

# ---- preview gif: idle + walk, A vs C ----
frames = []
for anim, n in (('idle', 8), ('walk', 8)):
    for i in range(n):
        a = cell(prod_alb, prod_meta, BV2[anim] + i).resize((67, 118), Image.LANCZOS)
        c = cell(cand_alb, cand_meta, BV2[anim] + i).resize((72, 121), Image.LANCZOS)
        fr = Image.new('RGBA', (320, 170), (20, 20, 24, 255))
        fr.alpha_composite(a, (40, 165 - 118))
        fr.alpha_composite(c, (200, 165 - 121))
        dd = ImageDraw.Draw(fr)
        dd.text((30, 8), '(A)', font=arial(22), fill=(255, 255, 255, 255))
        dd.text((190, 8), '(C) V2', font=arial(22), fill=(255, 230, 160, 255))
        dd.text((130, 140), anim, font=arial(22), fill=(200, 190, 170, 255))
        frames.append(fr.convert('RGB'))
frames[0].save(os.path.join(COMP, 'preview_idle_walk.gif'), save_all=True,
               append_images=frames[1:], duration=150, loop=0)
print('gif ok', len(frames), 'frames')
print('ALL COMPARISONS DONE')
