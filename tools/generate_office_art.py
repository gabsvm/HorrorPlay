"""
Office Benchmark Hero Art Generator for HorrorPlay
Generates high-resolution 1920x1080 illustrated pixel-art production assets
matching the target quality of cinematic neo-noir narrative games (Massachusetts 1926).
"""
import math
import random
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

W = 1920
H = 1080

def create_office_background():
    img = Image.new("RGBA", (W, H), (14, 18, 22, 255))
    draw = ImageDraw.Draw(img)

    # 1. Base Wall (Upper Plaster & Wainscoting)
    # Ceiling & Crown Molding (y: 0 to 35)
    for y in range(0, 36):
        t = y / 36.0
        c = (int(10 + t * 12), int(12 + t * 14), int(15 + t * 18), 255)
        draw.line([(0, y), (W, y)], fill=c)
    draw.line([(0, 36), (W, 36)], fill=(6, 8, 10, 255), width=3)
    draw.line([(0, 39), (W, 39)], fill=(28, 34, 42, 255), width=2)

    # Upper Plaster Wall (y: 40 to 520) - Deep muted charcoal-teal plaster with dampness & age
    for y in range(40, 520):
        t = (y - 40) / 480.0
        # Subtle vertical gradient and horizontal variation
        base_r = int(18 + t * 8)
        base_g = int(24 + t * 9)
        base_b = int(30 + t * 10)
        draw.line([(0, y), (W, y)], fill=(base_r, base_g, base_b, 255))

    # Subtle Damask wallpaper / vertical wall stripes
    for x in range(0, W, 48):
        draw.line([(x, 40), (x, 520)], fill=(15, 20, 26, 255), width=2)
        draw.line([(x + 24, 40), (x + 24, 520)], fill=(24, 32, 40, 255), width=1)

    # Water stains and grime near ceiling and window
    random.seed(1926)
    for _ in range(45):
        sx = random.randint(40, 480)
        sy = random.randint(40, 160)
        sw = random.randint(15, 60)
        sh = random.randint(40, 180)
        draw.ellipse([sx, sy, sx + sw, sy + sh], fill=(12, 16, 20, 40))

    # Dark Electrical Conduit Pipe & Junction Boxes across top wall
    draw.line([(0, 75), (W, 75)], fill=(22, 25, 28, 255), width=5)
    draw.line([(0, 74), (W, 74)], fill=(45, 50, 58, 255), width=1) # pipe highlight
    # Junction boxes & elbows
    for jx in [390, 830, 1220, 1590]:
        draw.rectangle([jx - 10, 65, jx + 10, 85], fill=(32, 36, 42, 255), outline=(12, 14, 16, 255), width=2)
        draw.ellipse([jx - 3, 72, jx + 3, 78], fill=(180, 140, 70, 255)) # brass screw

    # Wainscoting Chair Rail Molding (y: 515 to 540)
    draw.rectangle([0, 515, W, 540], fill=(28, 18, 12, 255))
    draw.line([(0, 515), (W, 515)], fill=(65, 42, 28, 255), width=2) # top highlight
    draw.line([(0, 522), (W, 522)], fill=(48, 30, 20, 255), width=2)
    draw.line([(0, 538), (W, 538)], fill=(10, 6, 4, 255), width=3) # shadow

    # Lower Wood Wainscoting Panels (y: 540 to 695)
    draw.rectangle([0, 540, W, 695], fill=(22, 14, 10, 255))
    for px in range(0, W, 120):
        # Recessed wood panel
        draw.rectangle([px + 10, 548, px + 110, 685], fill=(16, 10, 7, 255), outline=(38, 24, 16, 255), width=2)
        draw.line([(px + 10, 548), (px + 110, 548)], fill=(52, 34, 22, 255), width=1)
        draw.line([(px + 110, 548), (px + 110, 685)], fill=(8, 5, 3, 255), width=2)
        draw.line([(px + 10, 685), (px + 110, 685)], fill=(8, 5, 3, 255), width=2)

    # Baseboard Molding (y: 695 to 715)
    draw.rectangle([0, 695, W, 715], fill=(14, 9, 6, 255))
    draw.line([(0, 695), (W, 695)], fill=(42, 28, 18, 255), width=2)
    draw.line([(0, 714), (W, 714)], fill=(6, 4, 2, 255), width=2)

    # 2. Hardwood Parquet Floor (y: 715 to 1080)
    for y in range(715, H):
        t = (y - 715) / (H - 715)
        # Deep dark rich oak floor boards
        c_floor = (int(26 - t * 8), int(22 - t * 7), int(19 - t * 6), 255)
        draw.line([(0, y), (W, y)], fill=c_floor)

    # Horizontal plank lines in perspective
    floor_planks_y = [715, 735, 760, 790, 825, 865, 910, 960, 1015, 1075]
    for py in floor_planks_y:
        draw.line([(0, py), (W, py)], fill=(8, 6, 5, 255), width=2)
        draw.line([(0, py + 1), (W, py + 1)], fill=(40, 32, 26, 255), width=1)

    # Perspective vertical plank seams
    for x0 in range(-200, W + 300, 110):
        # Vanishing perspective toward center horizon
        top_x = 960.0 + (x0 - 960.0) * 0.58
        draw.line([(top_x, 715), (x0, H)], fill=(12, 9, 7, 255), width=2)

    # Subtle wood grain streaks on floor
    for _ in range(80):
        gx1 = random.randint(0, W)
        gy = random.randint(720, H - 20)
        gl = random.randint(30, 140)
        draw.line([(gx1, gy), (gx1 + gl, gy)], fill=(34, 28, 22, 90), width=1)

    # 3. Worn Victorian Oriental Carpet (x: 240 to 1680, y: 765 to 1060)
    carpet_poly = [
        (340, 770),
        (1580, 770),
        (1720, 1050),
        (200, 1050)
    ]
    # Carpet drop shadow
    shadow_poly = [(p[0] + 8, p[1] + 8) for p in carpet_poly]
    draw.polygon(shadow_poly, fill=(5, 4, 3, 160))
    # Carpet base: dark faded crimson wine
    draw.polygon(carpet_poly, fill=(52, 22, 24, 255))

    # Outer ornate border: aged gold and charcoal
    carpet_inner_1 = [(360, 782), (1560, 782), (1695, 1038), (225, 1038)]
    draw.polygon(carpet_inner_1, fill=(78, 32, 34, 255), outline=(125, 88, 42, 255), width=3)
    carpet_inner_2 = [(380, 794), (1540, 794), (1670, 1026), (250, 1026)]
    draw.polygon(carpet_inner_2, fill=(45, 20, 22, 255), outline=(32, 16, 18, 255), width=2)

    # Carpet ornamental central medallion & pattern
    draw.ellipse([800, 850, 1120, 970], fill=(68, 28, 30, 255), outline=(140, 98, 48, 255), width=3)
    draw.ellipse([850, 875, 1070, 945], fill=(32, 18, 22, 255), outline=(110, 76, 38, 255), width=2)
    # Fringe tassels at the bottom edge
    for fx in range(200, 1720, 8):
        draw.line([(fx, 1050), (fx - 2, 1058)], fill=(160, 140, 110, 220), width=2)

    # 4. The Arched Noir Window (x: 80 to 390, y: 70 to 580)
    # Masonry Arch Surround (heavy cut granite stones)
    draw.rectangle([70, 60, 400, 590], fill=(18, 22, 26, 255), outline=(8, 10, 12, 255), width=4)
    # Keystone and voussoirs around arch
    for sx in range(80, 390, 45):
        draw.line([(sx, 60), (sx, 90)], fill=(8, 10, 12, 255), width=3)
        draw.line([(sx + 2, 62), (sx + 40, 62)], fill=(32, 38, 46, 255), width=2)

    # Outer deep window reveal (inner bevel)
    draw.rectangle([90, 85, 380, 570], fill=(10, 13, 16, 255))
    draw.line([(90, 570), (380, 570)], fill=(4, 6, 8, 255), width=4)

    # Glass Panes Area (Cold Atlantic ocean night view)
    glass_rect = [105, 100, 365, 550]
    for gy in range(100, 551):
        gt = (gy - 100) / 450.0
        # Stormy blue-cyan night sky gradient
        gr = int(12 + gt * 8)
        gg = int(24 + gt * 26)
        gb = int(38 + gt * 34)
        draw.line([(105, gy), (365, gy)], fill=(gr, gg, gb, 255))

    # Distant Moon & Cold Halo
    draw.ellipse([270, 140, 340, 210], fill=(160, 205, 220, 60))
    draw.ellipse([285, 155, 325, 195], fill=(210, 235, 245, 230))
    # Craggy distant coastline / dark sea waves at bottom of window
    coast_points = [
        (105, 450), (145, 435), (185, 442), (230, 420),
        (280, 438), (325, 428), (365, 445), (365, 550), (105, 550)
    ]
    draw.polygon(coast_points, fill=(6, 12, 16, 255))

    # Cast-Iron Window Frame & Mullions (Classic 8-pane noir window)
    # Outer frame
    draw.rectangle([105, 100, 365, 550], outline=(14, 18, 22, 255), width=8)
    # Heavy central vertical mullion
    draw.rectangle([230, 100, 240, 550], fill=(16, 20, 24, 255), outline=(8, 10, 12, 255), width=2)
    draw.line([(232, 100), (232, 550)], fill=(32, 40, 48, 255), width=1) # mullion highlight
    # Horizontal transoms
    for ty in [230, 360, 480]:
        draw.rectangle([105, ty - 4, 365, ty + 4], fill=(16, 20, 24, 255), outline=(8, 10, 12, 255), width=2)
        draw.line([(105, ty - 3), (365, ty - 3)], fill=(32, 40, 48, 255), width=1)

    # Window Rain Streaks & Water Rivulets on Glass
    random.seed(47)
    for _ in range(65):
        rx = random.randint(110, 360)
        ry1 = random.randint(110, 480)
        rlen = random.randint(18, 70)
        rslant = random.randint(-4, 2)
        draw.line([(rx, ry1), (rx + rslant, ry1 + rlen)], fill=(175, 215, 230, 140), width=1)
        # Droplet at bottom of streak
        draw.ellipse([rx + rslant - 1, ry1 + rlen - 1, rx + rslant + 2, ry1 + rlen + 2], fill=(210, 240, 255, 190))

    # Heavy Wooden Window Sill (x: 75 to 395, y: 565 to 600)
    draw.rectangle([75, 565, 395, 585], fill=(24, 16, 11, 255), outline=(8, 5, 3, 255), width=3)
    draw.line([(76, 566), (394, 566)], fill=(62, 42, 28, 255), width=2) # top highlight
    draw.rectangle([85, 585, 385, 600], fill=(14, 9, 6, 255))
    draw.line([(85, 600), (385, 600)], fill=(4, 3, 2, 255), width=2)

    # 5. Case Board / Tablero de Caso 47-B (x: 430 to 770, y: 105 to 385)
    # Heavy Walnut Beveled Frame
    draw.rectangle([430, 105, 770, 385], fill=(12, 8, 5, 255), outline=(4, 3, 2, 255), width=3)
    draw.rectangle([436, 111, 764, 379], fill=(42, 28, 18, 255))
    draw.line([(437, 112), (763, 112)], fill=(75, 50, 32, 255), width=2)
    # Corkboard Surface
    draw.rectangle([448, 123, 752, 367], fill=(108, 86, 62, 255))
    # Cork texture specks
    for _ in range(250):
        cpx = random.randint(450, 750)
        cpy = random.randint(125, 365)
        draw.point((cpx, cpy), fill=(78, 60, 42, 255))

    # Pinned Evidence 1: Sepia Crime Scene Photo (x: 465, y: 140, 95x75)
    draw.rectangle([467, 142, 562, 217], fill=(10, 8, 6, 160)) # photo drop shadow
    draw.rectangle([465, 140, 560, 215], fill=(228, 220, 202, 255), outline=(18, 14, 10, 255), width=1)
    draw.rectangle([472, 147, 553, 201], fill=(48, 42, 36, 255)) # photo image area
    draw.ellipse([495, 160, 530, 195], fill=(85, 75, 65, 255)) # mysterious shadowy figure
    draw.ellipse([510, 166, 516, 172], fill=(210, 180, 140, 255)) # face glint
    draw.line([(472, 190), (553, 190)], fill=(32, 28, 24, 255), width=2) # dock pier line
    # Brass thumbtack
    draw.ellipse([510, 137, 516, 143], fill=(195, 155, 65, 255), outline=(50, 35, 15, 255), width=1)

    # Pinned Evidence 2: Faded Newspaper Article (x: 605, y: 135, 125x105)
    draw.rectangle([607, 137, 732, 242], fill=(10, 8, 6, 160))
    draw.rectangle([605, 135, 730, 240], fill=(215, 205, 185, 255), outline=(35, 28, 20, 255), width=1)
    # Newspaper headline & columns
    draw.rectangle([612, 142, 722, 150], fill=(32, 28, 22, 255)) # bold headline
    for ny in range(155, 230, 7):
        draw.line([(612, ny), (664, ny)], fill=(65, 58, 48, 255), width=2)
        draw.line([(670, ny), (722, ny)], fill=(65, 58, 48, 255), width=2)
    # Red "CONFIDENTIAL" rubber stamp
    draw.rectangle([628, 190, 705, 212], outline=(168, 42, 38, 240), width=2)
    draw.line([(632, 201), (701, 201)], fill=(168, 42, 38, 240), width=4)
    draw.ellipse([665, 132, 671, 138], fill=(195, 155, 65, 255), outline=(50, 35, 15, 255), width=1)

    # Pinned Evidence 3: Nautical Chart / Reef Map (x: 485, y: 250, 110x95)
    draw.rectangle([487, 252, 597, 347], fill=(10, 8, 6, 160))
    draw.rectangle([485, 250, 595, 345], fill=(225, 218, 195, 255), outline=(35, 28, 20, 255), width=1)
    # Coastlines and depth soundings
    draw.arc([500, 265, 570, 335], 45, 240, fill=(42, 68, 85, 255), width=2)
    draw.arc([515, 280, 585, 340], 60, 200, fill=(42, 68, 85, 255), width=1)
    draw.point((545, 305), fill=(185, 35, 30, 255)) # Red X mark for Devil Reef
    draw.line([(540, 300), (550, 310)], fill=(185, 35, 30, 255), width=2)
    draw.line([(540, 310), (550, 300)], fill=(185, 35, 30, 255), width=2)
    draw.ellipse([538, 247, 544, 253], fill=(195, 155, 65, 255), outline=(50, 35, 15, 255), width=1)

    # Pinned Evidence 4: Typewritten Suspect Dossier (x: 625, y: 260, 100x85)
    draw.rectangle([627, 262, 727, 347], fill=(10, 8, 6, 160))
    draw.rectangle([625, 260, 725, 345], fill=(220, 210, 190, 255), outline=(35, 28, 20, 255), width=1)
    for dy in range(270, 335, 6):
        draw.line([(633, dy), (715, dy)], fill=(50, 44, 38, 255), width=2)
    draw.ellipse([672, 257, 678, 263], fill=(195, 155, 65, 255), outline=(50, 35, 15, 255), width=1)

    # Red Yarn Thread Connecting the Clues
    thread_pts = [(513, 140), (668, 135), (545, 305), (675, 260)]
    draw.line([(513, 140), (668, 135)], fill=(185, 38, 32, 240), width=2)
    draw.line([(668, 135), (545, 305)], fill=(185, 38, 32, 240), width=2)
    draw.line([(545, 305), (675, 260)], fill=(185, 38, 32, 240), width=2)

    # 6. Antique Wall Clock (x: 795 to 845, y: 130 to 210)
    draw.ellipse([793, 128, 847, 212], fill=(10, 8, 6, 180)) # shadow
    draw.ellipse([795, 130, 845, 210], fill=(32, 22, 14, 255), outline=(12, 8, 5, 255), width=3) # dark wood octagonal frame
    draw.ellipse([802, 137, 838, 203], fill=(145, 115, 55, 255)) # brass bezel ring
    draw.ellipse([806, 141, 834, 199], fill=(225, 218, 198, 255)) # aged face
    # Clock hands at 11:42
    draw.line([(820, 170), (814, 152)], fill=(20, 16, 12, 255), width=2) # hour hand
    draw.line([(820, 170), (810, 175)], fill=(20, 16, 12, 255), width=2) # minute hand
    draw.ellipse([818, 168, 822, 172], fill=(180, 135, 50, 255)) # center pin

    # 7. Confiscated Occult Bookcase (x: 870 to 1210, y: 220 to 730)
    # Bookcase Shadow
    draw.rectangle([866, 216, 1214, 734], fill=(6, 4, 3, 200))
    # Outer Carved Frame
    draw.rectangle([870, 220, 1210, 730], fill=(24, 15, 10, 255), outline=(10, 6, 4, 255), width=4)
    # Crown Pediment Molding on top
    draw.rectangle([860, 210, 1220, 225], fill=(38, 24, 16, 255), outline=(12, 8, 5, 255), width=3)
    draw.line([(861, 211), (1219, 211)], fill=(75, 48, 32, 255), width=2)

    # Interior Bookcase Cavity (dark shadowed wood)
    draw.rectangle([886, 235, 1194, 715], fill=(14, 9, 6, 255))

    # Shelves (4 levels: y=355, y=475, y=595, y=715)
    shelves_y = [355, 475, 595, 715]
    for sy in shelves_y:
        draw.rectangle([886, sy - 8, 1194, sy], fill=(38, 24, 16, 255), outline=(10, 6, 4, 255), width=2)
        draw.line([(886, sy - 7), (1194, sy - 7)], fill=(65, 42, 28, 255), width=1) # edge highlight
        # Shadow cast below each shelf
        draw.rectangle([886, sy + 1, 1194, sy + 14], fill=(6, 4, 2, 180))

    # Shelf 1 Books (y: 245 to 347)
    book_palettes = [
        (88, 32, 28), (35, 52, 42), (42, 55, 68), (95, 72, 38),
        (65, 28, 48), (28, 36, 42), (110, 45, 32), (54, 48, 38)
    ]
    bx = 892
    random.seed(317)
    while bx < 1185:
        bw = random.randint(12, 24)
        bh = random.randint(75, 100)
        by = 347 - bh
        col = random.choice(book_palettes)
        draw.rectangle([bx, by, bx + bw, 347], fill=col, outline=(12, 8, 5, 255), width=1)
        # Gold embossed spine lines & title ribs
        draw.line([(bx + 2, by + 12), (bx + bw - 2, by + 12)], fill=(185, 145, 65, 200), width=1)
        draw.line([(bx + 2, by + 22), (bx + bw - 2, by + 22)], fill=(185, 145, 65, 200), width=1)
        draw.line([(bx + 2, 347 - 12), (bx + bw - 2, 347 - 12)], fill=(185, 145, 65, 200), width=1)
        # Spine specular highlight
        draw.line([(bx + 2, by + 2), (bx + 2, 346)], fill=(255, 255, 255, 35), width=1)
        bx += bw + 1

    # Shelf 2 Books & Grimoires (y: 365 to 467)
    bx = 894
    while bx < 1140:
        bw = random.randint(14, 28)
        bh = random.randint(70, 96)
        by = 467 - bh
        col = random.choice(book_palettes)
        draw.rectangle([bx, by, bx + bw, 467], fill=col, outline=(12, 8, 5, 255), width=1)
        draw.line([(bx + 2, by + 15), (bx + bw - 2, by + 15)], fill=(190, 155, 75, 200), width=1)
        draw.line([(bx + 2, 467 - 15), (bx + bw - 2, 467 - 15)], fill=(190, 155, 75, 200), width=1)
        bx += bw + 2
    # Leaning books at end of shelf 2
    draw.polygon([(1155, 410), (1172, 415), (1165, 467), (1148, 467)], fill=(75, 35, 30, 255), outline=(10, 6, 4, 255), width=1)
    draw.polygon([(1172, 415), (1188, 420), (1182, 467), (1165, 467)], fill=(38, 55, 48, 255), outline=(10, 6, 4, 255), width=1)

    # Shelf 3 Occult Artifact & Confiscated Binders (y: 485 to 587)
    # Ancient basalt idol from Innsmouth on shelf 3
    draw.ellipse([920, 520, 970, 587], fill=(22, 28, 26, 255), outline=(8, 12, 10, 255), width=2)
    draw.ellipse([935, 530, 942, 537], fill=(45, 85, 70, 255)) # eerie greenish stone eye
    draw.ellipse([948, 530, 955, 537], fill=(45, 85, 70, 255))
    # Rolled parchment scrolls tied with red ribbons
    for sy_scr in [555, 568, 580]:
        draw.rectangle([995, sy_scr, 1070, sy_scr + 9], fill=(215, 202, 175, 255), outline=(50, 42, 32, 255), width=1)
        draw.line([(1025, sy_scr), (1025, sy_scr + 9)], fill=(175, 35, 30, 255), width=2) # red ribbon
        draw.line([(1045, sy_scr), (1045, sy_scr + 9)], fill=(175, 35, 30, 255), width=2)

    # Heavy Case Ledgers on right of shelf 3
    for lx in [1085, 1115, 1145]:
        draw.rectangle([lx, 500, lx + 26, 587], fill=(36, 24, 18, 255), outline=(10, 6, 4, 255), width=1)
        draw.rectangle([lx + 4, 520, lx + 22, 545], fill=(210, 195, 165, 255), outline=(60, 45, 30, 255), width=1) # paper spine label

    # Shelf 4 Storage Binders & Archive Boxes (y: 605 to 707)
    for bx in [900, 985, 1070]:
        draw.rectangle([bx, 620, bx + 75, 707], fill=(42, 34, 28, 255), outline=(12, 8, 5, 255), width=2)
        draw.rectangle([bx + 20, 645, bx + 55, 670], fill=(225, 215, 190, 255)) # label
        draw.ellipse([bx + 35, 680, bx + 41, 686], fill=(165, 130, 60, 255)) # brass pull ring

    # 8. Victorian Cast-Iron Radiator (x: 1225 to 1325, y: 560 to 715)
    draw.rectangle([1220, 560, 1330, 715], fill=(5, 4, 4, 160)) # shadow
    for rx in range(1225, 1320, 12):
        # Vertical cast iron radiator rib
        draw.rectangle([rx, 565, rx + 9, 708], fill=(32, 36, 38, 255), outline=(14, 16, 18, 255), width=1)
        draw.line([(rx + 2, 568), (rx + 2, 705)], fill=(65, 72, 78, 255), width=1) # iron highlight
        # Feet touching floor
        draw.rectangle([rx + 1, 708, rx + 8, 715], fill=(18, 20, 22, 255))
    # Top and bottom horizontal connection pipes
    draw.rectangle([1220, 575, 1328, 583], fill=(24, 26, 28, 255))
    draw.rectangle([1220, 690, 1328, 698], fill=(24, 26, 28, 255))
    # Steam valve on left
    draw.ellipse([1215, 568, 1226, 579], fill=(185, 140, 65, 255), outline=(45, 30, 15, 255), width=1)

    # 9. Industrial Filing Cabinet (x: 1340 to 1570, y: 480 to 735)
    # Shadow
    draw.rectangle([1335, 475, 1575, 740], fill=(4, 5, 5, 200))
    # Steel Cabinet Shell (Cold industrial olive-slate)
    draw.rectangle([1340, 480, 1570, 730], fill=(35, 42, 40, 255), outline=(12, 16, 15, 255), width=4)
    draw.line([(1342, 482), (1568, 482)], fill=(65, 78, 75, 255), width=2) # top highlight

    # 4 Drawers (Drawer 1: y=490, Drawer 2: y=550, Drawer 3: y=610, Drawer 4: y=670)
    drawer_y = [490, 550, 610, 670]
    labels = ["1923 - 1924", "1925 - A", "CASE 47-B", "ARCHIVE"]
    for i, dy in enumerate(drawer_y):
        draw.rectangle([1350, dy, 1560, dy + 52], fill=(44, 52, 50, 255), outline=(18, 24, 22, 255), width=2)
        draw.line([(1352, dy + 2), (1558, dy + 2)], fill=(75, 88, 85, 255), width=1) # drawer edge highlight
        draw.line([(1352, dy + 51), (1558, dy + 51)], fill=(12, 15, 14, 255), width=2) # shadow

        # Brass Label Holder with Paper Card
        draw.rectangle([1420, dy + 10, 1490, dy + 26], fill=(175, 140, 70, 255), outline=(45, 35, 15, 255), width=1)
        draw.rectangle([1424, dy + 13, 1486, dy + 23], fill=(230, 222, 200, 255))
        # Text suggestion on card
        draw.line([(1428, dy + 18), (1482, dy + 18)], fill=(40, 32, 24, 255), width=2)

        # Heavy Brass Pull Handle
        draw.rectangle([1430, dy + 32, 1480, dy + 42], fill=(160, 125, 55, 255), outline=(35, 25, 12, 255), width=2)
        draw.line([(1432, dy + 34), (1478, dy + 34)], fill=(225, 185, 105, 255), width=1) # handle highlight

        # Keyhole on Drawer 3 ("CASE 47-B" - Evidence drawer requiring Rusty Key!)
        if i == 2:
            draw.ellipse([1525, dy + 22, 1535, dy + 32], fill=(185, 145, 65, 255), outline=(40, 30, 15, 255), width=1)
            draw.ellipse([1528, dy + 25, 1532, dy + 29], fill=(8, 6, 4, 255))
            draw.polygon([(1529, dy + 27), (1531, dy + 27), (1532, dy + 34), (1528, dy + 34)], fill=(8, 6, 4, 255))

    # Cabinet steel feet
    draw.rectangle([1348, 730, 1365, 736], fill=(18, 22, 20, 255))
    draw.rectangle([1545, 730, 1562, 736], fill=(18, 22, 20, 255))

    # 10. Heavy Noir Exit Door (x: 1610 to 1860, y: 240 to 740)
    # Shadow
    draw.rectangle([1605, 235, 1865, 745], fill=(4, 3, 2, 210))
    # Outer Door Frame Molding
    draw.rectangle([1610, 240, 1860, 740], fill=(28, 18, 12, 255), outline=(8, 5, 3, 255), width=4)
    draw.line([(1612, 242), (1858, 242)], fill=(62, 42, 28, 255), width=2)
    # Inner Recessed Door Slab
    draw.rectangle([1624, 254, 1846, 732], fill=(20, 13, 8, 255))

    # Upper Frosted Glass Window Panel (x: 1640 to 1830, y: 275 to 465)
    draw.rectangle([1640, 275, 1830, 465], fill=(18, 24, 28, 255), outline=(48, 32, 20, 255), width=5)
    # Frosted pebbled glass texture with muted yellow hallway light
    for gy in range(280, 460):
        gt = (gy - 280) / 180.0
        draw.line([(1645, gy), (1825, gy)], fill=(int(38 + gt * 14), int(48 + gt * 12), int(42 + gt * 6), 255))
    # Stencil backward lettering on frosted glass
    draw.line([(1665, 355), (1805, 355)], fill=(12, 16, 18, 220), width=6)
    draw.line([(1675, 375), (1795, 375)], fill=(12, 16, 18, 220), width=4)

    # Lower Wood Door Panels
    draw.rectangle([1640, 495, 1830, 595], fill=(14, 9, 6, 255), outline=(38, 24, 16, 255), width=3)
    draw.rectangle([1640, 615, 1830, 715], fill=(14, 9, 6, 255), outline=(38, 24, 16, 255), width=3)

    # Heavy Antique Brass Door Knob & Backplate (x: 1650, y: 485)
    draw.rectangle([1646, 475, 1660, 515], fill=(165, 130, 60, 255), outline=(40, 28, 12, 255), width=2)
    draw.ellipse([1642, 487, 1664, 503], fill=(195, 160, 75, 255), outline=(40, 28, 12, 255), width=2)
    draw.ellipse([1646, 491, 1654, 497], fill=(245, 215, 135, 255)) # highlight
    draw.ellipse([1651, 506, 1655, 510], fill=(8, 6, 4, 255)) # keyhole

    # 11. The Hero Executive Desk (x: 390 to 920, y: 560 to 885)
    # Large desk floor shadow
    desk_shadow = [(370, 840), (940, 840), (960, 915), (350, 915)]
    draw.polygon(desk_shadow, fill=(3, 2, 2, 210))

    # Desk Pedestals (Left Pedestal: 420 to 550, Right Pedestal: 760 to 890, Modesty Board: 550 to 760)
    # Left Pedestal
    draw.rectangle([420, 630, 550, 850], fill=(22, 13, 8, 255), outline=(10, 6, 4, 255), width=3)
    # Left Pedestal Drawers (3 drawers)
    for ldy in [645, 710, 775]:
        draw.rectangle([430, ldy, 540, ldy + 55], fill=(32, 19, 12, 255), outline=(14, 8, 5, 255), width=2)
        draw.line([(432, ldy + 2), (538, ldy + 2)], fill=(58, 36, 24, 255), width=1)
        # Brass drawer pulls
        draw.ellipse([475, ldy + 24, 495, ldy + 32], fill=(175, 140, 65, 255), outline=(40, 28, 14, 255), width=1)

    # Right Pedestal
    draw.rectangle([760, 630, 890, 850], fill=(22, 13, 8, 255), outline=(10, 6, 4, 255), width=3)
    # Right Pedestal Drawers (3 drawers)
    for rdy in [645, 710, 775]:
        draw.rectangle([770, rdy, 880, rdy + 55], fill=(32, 19, 12, 255), outline=(14, 8, 5, 255), width=2)
        draw.line([(772, rdy + 2), (878, rdy + 2)], fill=(58, 36, 24, 255), width=1)
        draw.ellipse([815, rdy + 24, 835, rdy + 32], fill=(175, 140, 65, 255), outline=(40, 28, 14, 255), width=1)

    # Recessed Central Modesty Board (connecting the two pedestals)
    draw.rectangle([550, 640, 760, 810], fill=(14, 8, 5, 255), outline=(8, 5, 3, 255), width=2)

    # Massive Desktop Surface (Mahogany with carved beveled molding)
    draw.rectangle([390, 580, 920, 635], fill=(42, 25, 16, 255), outline=(10, 6, 4, 255), width=3)
    draw.line([(391, 581), (919, 581)], fill=(95, 62, 40, 255), width=2) # crisp top edge highlight
    draw.line([(391, 634), (919, 634)], fill=(12, 7, 4, 255), width=3)

    # Green Leather Desk Blotter with Gold-Tooled Border (x: 480 to 790, y: 588 to 628)
    draw.rectangle([480, 588, 790, 628], fill=(24, 48, 36, 255), outline=(160, 130, 60, 255), width=2)
    # Blotter brass corner protectors
    for cx, cy in [(480, 588), (784, 588), (480, 622), (784, 622)]:
        draw.polygon([(cx, cy), (cx + 12, cy), (cx, cy + 12)], fill=(195, 160, 75, 255))

    # Vintage Remington Typewriter (x: 520 to 625, y: 555 to 615)
    # Typewriter drop shadow
    draw.rectangle([518, 595, 627, 622], fill=(5, 4, 3, 180))
    # Cast Iron Body
    draw.polygon([(525, 570), (620, 570), (625, 615), (520, 615)], fill=(18, 20, 22, 255), outline=(8, 9, 10, 255), width=2)
    # Carriage roller & paper sheet
    draw.rectangle([515, 558, 630, 568], fill=(32, 36, 38, 255))
    draw.rectangle([535, 545, 605, 568], fill=(235, 228, 212, 255)) # paper sheet sticking out
    draw.line([(542, 550), (598, 550)], fill=(40, 36, 30, 255), width=1) # typed line
    draw.line([(542, 554), (588, 554)], fill=(40, 36, 30, 255), width=1)
    # Circular Keys Grid (3 rows)
    for row_y in [585, 593, 601]:
        for kx in range(535, 612, 8):
            draw.ellipse([kx, row_y, kx + 5, row_y + 4], fill=(225, 220, 210, 255), outline=(25, 28, 30, 255), width=1)

    # Brass Candlestick Telephone (x: 435 to 475, y: 535 to 615)
    # Base
    draw.ellipse([440, 602, 470, 616], fill=(165, 125, 55, 255), outline=(40, 30, 15, 255), width=2)
    # Shaft
    draw.line([(455, 555), (455, 605)], fill=(185, 145, 65, 255), width=5)
    # Transmitter Mouthpiece
    draw.ellipse([446, 545, 464, 560], fill=(28, 32, 35, 255), outline=(165, 125, 55, 255), width=2)
    # Receiver Earpiece hanging on hook
    draw.line([(444, 560), (436, 575)], fill=(25, 28, 30, 255), width=4)
    draw.line([(436, 575), (442, 600)], fill=(12, 14, 16, 255), width=2) # curly cord

    # Scattered Case Documents & Manila Folder (x: 645 to 740, y: 585 to 625)
    # Manila folder
    draw.polygon([(645, 592), (730, 586), (736, 624), (650, 628)], fill=(185, 160, 115, 255), outline=(75, 60, 35, 255), width=1)
    # White document sheet on top
    draw.polygon([(652, 590), (715, 587), (718, 620), (655, 623)], fill=(238, 232, 218, 255), outline=(60, 52, 42, 255), width=1)
    for py in [594, 599, 604, 609, 614]:
        draw.line([(658, py), (708, py - 1)], fill=(55, 48, 40, 255), width=1)
    # Red Confidential mark
    draw.rectangle([678, 600, 712, 612], outline=(175, 40, 35, 220), width=1)

    # The Famous RUSTY KEY resting on the folder! (x: 685, y: 610)
    draw.ellipse([680, 608, 692, 618], fill=(130, 80, 40, 255), outline=(70, 40, 20, 255), width=2) # key ring
    draw.line([(690, 613), (715, 613)], fill=(145, 90, 45, 255), width=3) # key stem
    draw.line([(708, 613), (708, 619)], fill=(145, 90, 45, 255), width=2) # key teeth
    draw.line([(713, 613), (713, 618)], fill=(145, 90, 45, 255), width=2)
    # Key specular brass glint
    draw.point((683, 611), fill=(245, 210, 120, 255))

    # Cut-Crystal Whiskey Glass & Bottle (x: 745 to 780, y: 565 to 615)
    # Amber Bottle
    draw.rectangle([762, 565, 782, 610], fill=(85, 52, 20, 220), outline=(25, 15, 6, 255), width=1)
    draw.line([(764, 568), (764, 608)], fill=(235, 185, 95, 180), width=1) # bottle glass glint
    # Glass tumbler
    draw.rectangle([746, 588, 758, 608], fill=(160, 200, 220, 120), outline=(220, 240, 250, 190), width=1)
    draw.rectangle([748, 597, 756, 606], fill=(195, 125, 45, 220)) # whiskey liquid

    # Vintage Emerald Banker's Lamp (x: 795 to 870, y: 520 to 625)
    # Heavy tiered brass base
    draw.ellipse([812, 610, 858, 626], fill=(175, 135, 60, 255), outline=(45, 32, 14, 255), width=2)
    draw.ellipse([818, 612, 852, 622], fill=(225, 185, 100, 255)) # base highlight
    # Curved brass gooseneck
    draw.arc([820, 545, 855, 615], 270, 90, fill=(185, 145, 65, 255), width=6)
    # Cased emerald-green glass shade
    shade_poly = [
        (800, 555), (865, 555), (872, 578), (792, 578)
    ]
    draw.polygon(shade_poly, fill=(28, 92, 58, 255), outline=(14, 45, 28, 255), width=2)
    # Glass glossy highlight across curved shade
    draw.line([(802, 558), (862, 558)], fill=(110, 215, 165, 200), width=2)
    # Warm amber tungsten bulb glowing underneath shade
    draw.ellipse([818, 572, 846, 584], fill=(255, 235, 160, 255))

    # 12. Atmospheric Lighting Pools (Soft radial light overlays)
    # Desk Lamp Tungsten Pool
    lamp_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    lamp_draw = ImageDraw.Draw(lamp_overlay)
    # Warm amber illumination falling over the desk and papers
    lamp_draw.ellipse([450, 520, 1050, 850], fill=(255, 195, 95, 65))
    lamp_draw.ellipse([580, 540, 920, 750], fill=(255, 220, 140, 95))
    lamp_overlay = lamp_overlay.filter(ImageFilter.GaussianBlur(45))
    img.alpha_composite(lamp_overlay)

    # Window Cold Moonlight Beam across floor
    moon_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    moon_draw = ImageDraw.Draw(moon_overlay)
    moon_beam_poly = [
        (120, 550), (360, 550),
        (560, 920), (180, 920)
    ]
    moon_draw.polygon(moon_beam_poly, fill=(120, 185, 220, 45))
    moon_overlay = moon_overlay.filter(ImageFilter.GaussianBlur(35))
    img.alpha_composite(moon_overlay)

    # Subtle Room Vignette on outer borders
    vignette = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vig_draw = ImageDraw.Draw(vignette)
    vig_draw.rectangle([0, 0, W, H], outline=(0, 0, 0, 140), width=60)
    vig_draw.rectangle([0, 0, W, H], outline=(0, 0, 0, 80), width=120)
    vignette = vignette.filter(ImageFilter.GaussianBlur(50))
    img.alpha_composite(vignette)

    return img

if __name__ == "__main__":
    out_path = "assets/images/backgrounds/office_benchmark_production.png"
    print("Generating AA production office benchmark background...")
    im = create_office_background()
    im.save(out_path, "PNG")
    print(f"Successfully saved {out_path} ({im.width}x{im.height})")
