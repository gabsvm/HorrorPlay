"""Scenery props modelled in Blender, rendered as flat-colour sprites for the painted layers.

usage: blender -b --factory-startup -P tools/blender/props.py -- OUT_DIR [name,name...]

Each prop is built round the same origin its painter in src/art uses (the left foot of a fireplace,
the centre of the séance table on the floor...), seen by an orthographic camera tilted a few degrees
down like the painted rooms, and framed automatically at 1 logical px per pixel. Writes OUT_DIR/<name>.png
and OUT_DIR/props.json ({name: {w, h, ax, ay}}: the origin's pixel). tools/blender/pack_props.py
compresses them into web/assets/props/. The scene's lights then light them like the rest of the
room, from their painted relief.
"""
import json
import math
import os
import random
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
from kit import PI, TAU, arc, box, lathe, mesh, tube  # noqa: E402

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(ARGS[0])
ONLY = ARGS[1].split(',') if len(ARGS) > 1 else None
os.makedirs(OUT, exist_ok=True)
ELEV = math.radians(9)       # the painted interiors look slightly down on the furniture
WOOD, DARKWOOD, BRASS, IRON = '#2b1f16', '#20170f', '#8a6a2a', '#1b1c1e'


def ripple_lathe(name, prof, color, ripple, seg=48, loc=(0, 0, 0)):
    """A lathe whose rings are pushed in and out by ripple(angle, t), t = 0 at the top to 1 at the
    bottom: folds in a hanging cloth."""
    verts, faces, rings = [], [], []
    n = len(prof)
    for k, (z, r) in enumerate(prof):
        if r <= 1e-6:
            rings.append([len(verts)]); verts.append((0, 0, z)); continue
        ids = []
        for j in range(seg):
            a = TAU * j / seg
            rr = r * (1 + ripple(a, k / (n - 1)))
            ids.append(len(verts)); verts.append((math.cos(a) * rr, math.sin(a) * rr, z))
        rings.append(ids)
    for A, B in zip(rings, rings[1:]):
        if len(A) == 1:
            faces += [(A[0], B[j], B[(j + 1) % seg]) for j in range(seg)]
        else:
            faces += [(A[j], B[j], B[(j + 1) % seg], A[(j + 1) % seg]) for j in range(seg)]
    return mesh(name, verts, faces, color, loc)


def candlestick(x, z, tall):
    lathe('cs_base', [(z + 0.012, 0.0), (z + 0.012, 0.07), (z, 0.075), (z - 0.004, 0.0)], BRASS, loc=(x, 0, 0))
    lathe('cs_stem', [(z + 0.06, 0.02), (z + 0.03, 0.016), (z + 0.012, 0.03)], BRASS, loc=(x, 0, 0))
    lathe('cs_cup', [(z + 0.075, 0.045), (z + 0.06, 0.03), (z + 0.055, 0.0)], BRASS, loc=(x, 0, 0))
    top = z + 0.075 + tall
    lathe('candle', [(top, 0.0), (top, 0.034), (z + 0.075, 0.036)], '#e0d4b4', loc=(x, 0, 0))
    for k in range(3):
        a = k * 2.1 + x * 7
        lathe(f'drip{k}', [(0.0, 0.0), (-0.01, 0.012), (-0.05 - 0.03 * k, 0.008), (-0.06 - 0.03 * k, 0.0)], '#d8ccaa',
              loc=(x + math.cos(a) * 0.034, math.sin(a) * 0.034, top - 0.01))


# ------------------------------------------------------------------ the séance
def seance_table():
    """Round table with a worn velvet cloth to below the knee, gold fringe, three candles. Origin:
    the centre, on the floor (seance.js TABLE_X, GROUND)."""
    R, top, hem = 1.5, 1.24, 0.66
    prof = [(top + 0.02, 0.0), (top + 0.02, R * 0.6), (top + 0.015, R), (top - 0.01, R + 0.03)]
    prof += [(top - 0.04 - (top - 0.04 - hem) * i / 7, R + 0.04 + 0.05 * i / 7) for i in range(8)]
    ripple_lathe('cloth', prof, '#3a1814', lambda a, t: (0.03 * math.sin(15 * a + 0.4) + 0.012 * math.sin(37 * a)) * max(0, t - 0.25) / 0.75)
    for i in range(160):
        a = TAU * i / 160
        r = (R + 0.09) * (1 + 0.03 * math.sin(15 * a + 0.4) + 0.012 * math.sin(37 * a))
        tube('fringe', [(math.cos(a) * r, math.sin(a) * r, hem + 0.01), (math.cos(a) * r, math.sin(a) * r, hem - 0.09)], 0.008, BRASS, res=1)
    lathe('pedestal', [(hem, 0.1), (0.4, 0.11), (0.2, 0.16), (0.12, 0.2), (0.1, 0.0)], '#1a0c0a')
    for k in range(3):
        a = PI / 2 + k * TAU / 3
        tube('foot', [(math.cos(a) * 0.15, math.sin(a) * 0.15, 0.14), (math.cos(a) * 0.4, math.sin(a) * 0.4, 0.05), (math.cos(a) * 0.52, math.sin(a) * 0.52, 0.02)], 0.035, '#1a0c0a')
    for x, tall in ((-0.30, 0.3), (0.10, 0.36), (0.50, 0.3)):
        candlestick(x, top + 0.02, tall)


def balloon_chair():
    """A balloon-back parlour chair, facing right (the sitter's back to the left). Origin: the middle
    of the seat, on the floor. Seat at the height a sitting figure's hips come to (Actor 'sit')."""
    seat, d, w = 0.5, 0.42, 0.42
    box('seat', (d, w, 0.08), (0, 0, seat - 0.02), '#4a1a1a', bevel=0.03)
    box('rail', (d - 0.02, w - 0.02, 0.06), (0, 0, seat - 0.08), '#2a160e')
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * (d / 2 - 0.03), sy * (w / 2 - 0.03)
            if sx > 0:   # front legs, a little cabriole
                tube('leg', [(x, y, seat - 0.1), (x + 0.03, y, seat - 0.3), (x - 0.01, y, 0.05), (x + 0.02, y, 0.0)], 0.022, '#2a160e')
            else:        # back legs run on up into the back
                tube('leg', [(x - 0.04, y, 0.0), (x, y, seat - 0.1), (x - 0.02, y, seat + 0.2), (x - 0.06, y, seat + 0.35)], 0.022, '#2a160e')
    # the balloon: a loop between the two back uprights
    pts = [(-d / 2 - 0.03 - 0.03 * math.sin(PI * i / 20), -w / 2 + 0.03 + (w - 0.06) * (0.5 - 0.5 * math.cos(PI * i / 20)),
            seat + 0.35 + 0.22 * math.sin(PI * i / 20)) for i in range(21)]
    tube('balloon', pts, 0.022, '#2a160e')
    tube('crest', [(-d / 2 - 0.05, -w / 2 + 0.08, seat + 0.2), (-d / 2 - 0.05, 0, seat + 0.16), (-d / 2 - 0.05, w / 2 - 0.08, seat + 0.2)], 0.018, '#2a160e')


def side_table():
    """Small round table with a tambourine and a hand bell (the spirit trumpet is drawn live on it).
    Origin: the centre, on the floor."""
    lathe('top', [(1.0, 0.0), (1.0, 0.55), (0.97, 0.56), (0.95, 0.5), (0.95, 0.0)], '#20150e')
    lathe('column', [(0.95, 0.05), (0.7, 0.06), (0.5, 0.09), (0.3, 0.06), (0.12, 0.08), (0.08, 0.0)], '#20150e')
    for k in range(3):
        a = PI / 2 + k * TAU / 3
        tube('foot', [(math.cos(a) * 0.06, math.sin(a) * 0.06, 0.12), (math.cos(a) * 0.22, math.sin(a) * 0.22, 0.04), (math.cos(a) * 0.3, math.sin(a) * 0.3, 0.01)], 0.022, '#20150e')
    lathe('tambourine', [(0.04, 0.0), (0.04, 0.15), (0.0, 0.15), (0.0, 0.14), (0.035, 0.14)], '#5a4630', loc=(0.4, 0.05, 1.0), rot=(0.12, 0, 0))
    lathe('skin', [(0.037, 0.0), (0.037, 0.142)], '#b8a882', loc=(0.4, 0.05, 1.0), rot=(0.12, 0, 0))
    for k in range(5):
        a = TAU * k / 5
        lathe('jingle', [(0.012, 0.0), (0.012, 0.022), (0.0, 0.022), (0.0, 0.0)], BRASS, loc=(0.4 + math.cos(a) * 0.15, 0.05 + math.sin(a) * 0.15, 1.015))
    lathe('bell', [(0.12, 0.0), (0.11, 0.012), (0.07, 0.014), (0.06, 0.03), (0.02, 0.045), (0.0, 0.05), (0.0, 0.0)], BRASS, loc=(0.1, 0.12, 1.0))
    lathe('bell_handle', [(0.2, 0.0), (0.19, 0.012), (0.12, 0.01), (0.115, 0.0)], '#1a0c0a', loc=(0.1, 0.12, 1.0))


def raven_dome():
    """A stuffed raven on a branch under a glass dome, on a tall plinth. Origin: the plinth's left
    foot, on the floor (seance.js x 1000)."""
    box('plinth', (0.5, 0.4, 1.4), (0.25, 0, 0.7), '#20150e', bevel=0.02)
    box('cap', (0.58, 0.46, 0.06), (0.25, 0, 1.43), '#2a1c12', bevel=0.015)
    box('foot', (0.58, 0.46, 0.08), (0.25, 0, 0.04), '#2a1c12', bevel=0.015)
    lathe('base', [(1.52, 0.0), (1.52, 0.2), (1.46, 0.21), (1.46, 0.0)], '#1a120c', loc=(0.25, 0, 0))
    tube('branch', [(0.12, 0, 1.53), (0.25, 0.02, 1.6), (0.38, 0, 1.64)], 0.012, '#3a2a1a')
    lathe('body', [(0.12, 0.0), (0.1, 0.05), (0.04, 0.06), (-0.04, 0.045), (-0.08, 0.0)], '#0c0b0c', loc=(0.25, 0, 1.68), rot=(0, 0.5, 0), sy=0.8)
    lathe('head', [(0.04, 0.0), (0.03, 0.03), (-0.02, 0.032), (-0.04, 0.0)], '#0c0b0c', loc=(0.33, 0, 1.8))
    lathe('beak', [(0.0, 0.0), (-0.005, 0.012), (-0.07, 0.0)], '#141214', loc=(0.36, 0, 1.8), rot=(0, -1.75, 0))
    lathe('tail', [(0.0, 0.03), (-0.12, 0.015), (-0.13, 0.0)], '#0c0b0c', loc=(0.16, 0, 1.6), rot=(0, 1.1, 0), sy=0.5)
    lathe('dome', [(1.98, 0.0), (1.95, 0.08), (1.86, 0.16), (1.7, 0.2), (1.52, 0.2)], '#c8d4d8', loc=(0.25, 0, 0), glass=True, seg=24)


def fireplace():
    """A black marble chimneypiece with an arched cast-iron insert, grate and fender, 1.6 wide (the
    séance's). Origin: its left foot, on the floor (build.js fireplace(x, base))."""
    W = 1.6
    box('jamb_l', (0.26, 0.3, 1.5), (0.13, 0, 0.75), '#2a2420', bevel=0.015)
    box('jamb_r', (0.26, 0.3, 1.5), (W - 0.13, 0, 0.75), '#2a2420', bevel=0.015)
    box('frieze', (W, 0.3, 0.16), (W / 2, 0, 1.43), '#2a2420', bevel=0.015)
    box('shelf', (W + 0.24, 0.42, 0.08), (W / 2, 0.02, 1.56), '#3a332c', bevel=0.02)
    box('shelf_lip', (W + 0.16, 0.36, 0.05), (W / 2, 0.02, 1.5), '#332c26', bevel=0.012)
    box('plinth', (W + 0.08, 0.34, 0.08), (W / 2, 0, 0.04), '#3a332c', bevel=0.01)
    # the arched iron insert, set back
    box('back', (W - 0.5, 0.05, 1.2), (W / 2, 0.16, 0.6), '#0d0c0b', bevel=0)
    box('arch_l', (0.06, 0.12, 0.62), (0.29, 0.08, 0.31), '#141312', bevel=0.01)
    box('arch_r', (0.06, 0.12, 0.62), (W - 0.29, 0.08, 0.31), '#141312', bevel=0.01)
    tube('arch', arc(W / 2, 0.62, W / 2 - 0.29, PI, 0, 16, 0.04), 0.03, '#141312')
    box('grate', (W - 0.8, 0.22, 0.32), (W / 2, 0.05, 0.3), '#262627', bevel=0.01)
    for i in range(7):
        tube('bar', [(0.42 + i * (W - 0.84) / 6, -0.07, 0.14), (0.42 + i * (W - 0.84) / 6, -0.07, 0.46)], 0.012, '#0a0a0a')
    tube('fender', [(0.2, -0.24, 0.05), (W - 0.2, -0.24, 0.05)], 0.025, '#5a4a2a')
    box('hearth', (W + 0.1, 0.5, 0.03), (W / 2, -0.15, 0.015), '#2e2824', bevel=0.005)


# ------------------------------------------------------------------ Thomas's room
def bed():
    """An iron bedstead with brass knobs, a thin mattress, a patchwork quilt and a pillow, the head to
    the left, turned a little toward the viewer; a chamber pot beneath. Origin: the head post on the
    floor (build.js bed(x, y, w))."""
    L, Wd = 2.8, 1.1
    rot = math.radians(14)
    objs = []

    def P(x, y, z):        # bed space (x along, y across) to world, turned toward the viewer
        return (x * math.cos(rot) + y * math.sin(rot), -x * math.sin(rot) + y * math.cos(rot) + 0.55, z)
    for x, hgt in ((0.03, 1.22), (L - 0.03, 0.86)):
        for y in (-Wd / 2, Wd / 2):
            objs.append(tube('post', [P(x, y, 0.0), P(x, y, hgt)], 0.028, IRON))
            objs.append(lathe('knob', [(0.03, 0.0), (0.022, 0.026), (-0.02, 0.026), (-0.03, 0.0)], '#9a8350', loc=P(x, y, hgt + 0.03)))
        objs.append(tube('rail', [P(x, -Wd / 2, hgt - 0.04), P(x, Wd / 2, hgt - 0.04)], 0.022, IRON))
        objs.append(tube('rail', [P(x, -Wd / 2, hgt * 0.62), P(x, Wd / 2, hgt * 0.62)], 0.016, IRON))
        for k in range(1, 6):
            y = -Wd / 2 + Wd * k / 6
            objs.append(tube('rod', [P(x, y, hgt * 0.62), P(x, y, hgt - 0.04)], 0.009, IRON))
    for y in (-Wd / 2, Wd / 2):
        objs.append(tube('side', [P(0.03, y, 0.42), P(L - 0.03, y, 0.42)], 0.02, IRON))
    # mattress and quilt as one draped block with soft edges
    m = box('mattress', (L - 0.1, Wd - 0.02, 0.18), (0, 0, 0), '#8c8470', bevel=0.06)
    m.location = P(L / 2, 0, 0.52); m.rotation_euler = (0, 0, -rot)
    quilt_cols = ['#4a3e34', '#3a3430', '#5a3428', '#34403a', '#56504a']
    random.seed(8)
    nx, ny = 14, 6
    verts, faces = [], []
    for i in range(nx + 1):
        for j in range(ny + 1):
            x = 0.62 + (L - 0.75) * i / nx
            y = -Wd / 2 - 0.06 + (Wd + 0.12) * j / ny
            edge = min(j, ny - j)
            z = 0.63 if edge > 0 else 0.4
            verts.append(P(x, y, z + 0.015 * math.sin(i * 1.3 + j)))
    for i in range(nx):
        for j in range(ny):
            a = i * (ny + 1) + j
            faces.append((a, a + ny + 1, a + ny + 2, a + 1))
    q = mesh('quilt', verts, faces, quilt_cols[0])
    for c in quilt_cols[1:]:
        q.data.materials.append(kit.mat(c))
    q.data.polygons.foreach_set('material_index', [random.randrange(len(quilt_cols)) for _ in faces])
    pw = box('pillow', (0.36, 0.78, 0.13), (0, 0, 0), '#a49c86', bevel=0.06)
    pw.location = P(0.3, 0, 0.68); pw.rotation_euler = (0, -0.12, -rot)
    lathe('pot', [(0.0, 0.0), (0.0, 0.11), (0.1, 0.13), (0.14, 0.12), (0.15, 0.13), (0.15, 0.0)], '#e0d8c8', loc=P(1.1, -0.1, 0.0))


def desk():
    """A pedestal desk, three drawers a side, a green leather top, 2.3 wide. Origin: its left end on
    the floor (build.js desk(x, y, w))."""
    W = 2.3
    box('top', (W + 0.08, 0.75, 0.1), (W / 2, 0.1, 0.93), WOOD, bevel=0.02)
    box('leather', (W - 0.4, 0.55, 0.01), (W / 2, 0.1, 0.985), '#1e3a2a', bevel=0)
    for x0 in (0.06, W - 0.76):
        box('ped', (0.7, 0.68, 0.86), (x0 + 0.35, 0.1, 0.43), DARKWOOD, bevel=0.015)
        for i in range(3):
            z = 0.74 - i * 0.26
            box('drawer', (0.6, 0.02, 0.22), (x0 + 0.35, -0.245, z), '#241a11', bevel=0.008)
            box('pull', (0.08, 0.025, 0.025), (x0 + 0.35, -0.26, z + 0.02), '#9a8350', bevel=0.004)
    box('modesty', (W - 1.5, 0.03, 0.5), (W / 2, 0.42, 0.62), DARKWOOD, bevel=0.005)


def room_chair():
    """A plain spindle-back chair, its back to the right (build.js chair(x, y, 1)). Origin: the left
    of the seat on the floor."""
    box('seat', (0.54, 0.46, 0.06), (0.27, 0, 0.6), '#21180f', bevel=0.015)
    for x in (0.06, 0.48):
        for y in (-0.19, 0.19):
            top = 1.46 if x > 0.4 else 0.57
            tube('leg', [(x, y, 0.0), (x, y, top)], 0.022, '#21180f')
    tube('stretcher', [(0.06, -0.19, 0.22), (0.48, -0.19, 0.22)], 0.012, '#21180f')
    tube('stretcher', [(0.06, 0.19, 0.22), (0.48, 0.19, 0.22)], 0.012, '#21180f')
    box('crest', (0.08, 0.46, 0.08), (0.48, 0, 1.44), '#21180f', bevel=0.02)
    for k in range(4):
        y = -0.14 + k * 0.093
        tube('spindle', [(0.48, y, 0.63), (0.48, y, 1.4)], 0.012, '#21180f')


def bookshelf():
    """A wall shelf of books, 1.7 wide and 0.8 high, two shelves. Origin: its top-left corner
    (build.js bookcase(x, y, w, h)); the books lean, stack and stick out a little."""
    W, H = 1.7, 0.8
    box('back', (W, 0.03, H), (W / 2, 0.14, -H / 2), '#1e150e', bevel=0)
    for z in (-H / 2 + 0.03, -H + 0.03):
        box('shelf', (W, 0.28, 0.04), (W / 2, 0.02, z), '#2a1e14', bevel=0.008)
    for x in (0.02, W - 0.02):
        box('side', (0.04, 0.28, H), (x, 0.02, -H / 2), '#2a1e14', bevel=0.008)
    random.seed(4)
    cols = ['#3a1a14', '#22301e', '#2a2430', '#4a3a20', '#30261c', '#1a2632']
    for zshelf in (-H / 2 + 0.05, -H + 0.05):
        x = 0.07
        while x < W - 0.12:
            bw, bh, bd = random.uniform(0.06, 0.12), random.uniform(0.2, 0.33), random.uniform(0.17, 0.23)
            col = random.choice(cols)
            if random.random() < 0.1:     # a leaning book
                box('book', (bw, bd, bh), (x + bh * 0.3, 0.02, zshelf + bh * 0.45), col, bevel=0.006, rot=(0, 0.35, 0))
                x += bw + 0.1
                continue
            box('book', (bw, bd, bh), (x + bw / 2, 0.02 + random.uniform(-0.02, 0.02), zshelf + bh / 2), col, bevel=0.006)
            box('band', (bw + 0.002, bd + 0.002, 0.012), (x + bw / 2, 0.02, zshelf + bh * 0.8), '#7a6a40', bevel=0)
            x += bw + 0.01


def washstand():
    """A washstand with a marble top, a jug in its basin, a razor strop, and the shaving mirror on the
    wall above it hidden under a sheet. Origin: the stand's left end on the floor (room.js x 400)."""
    W = 1.3
    box('top', (W + 0.04, 0.5, 0.05), (W / 2, 0.12, 1.21), '#8a8478', bevel=0.012)
    box('apron', (W, 0.46, 0.1), (W / 2, 0.12, 1.12), '#2a2018', bevel=0.008)
    for x in (0.12, W - 0.12):
        for y in (-0.08, 0.32):
            box('leg', (0.08, 0.08, 1.08), (x, y, 0.54), '#2a2018', bevel=0.01)
    box('shelf', (W - 0.1, 0.42, 0.04), (W / 2, 0.12, 0.38), '#2a2018', bevel=0.008)
    box('splash', (W + 0.04, 0.04, 0.22), (W / 2, 0.35, 1.34), '#8a8478', bevel=0.01)
    lathe('basin', [(1.33, 0.38), (1.3, 0.36), (1.24, 0.24), (1.235, 0.0)], '#d6cfc0', loc=(0.65, 0.12, 0), seg=24)
    lathe('jug', [(1.62, 0.0), (1.62, 0.1), (1.58, 0.09), (1.5, 0.08), (1.38, 0.13), (1.26, 0.1), (1.245, 0.0)], '#c9c1ae', loc=(0.6, 0.12, 0), seg=20)
    tube('handle', [(0.68, 0.12, 1.58), (0.76, 0.12, 1.55), (0.76, 0.12, 1.42), (0.7, 0.12, 1.38)], 0.012, '#c9c1ae')
    box('strop', (0.06, 0.02, 0.6), (1.25, 0.38, 2.3), '#4a3420', bevel=0.005)
    # the mirror's frame on the wall, and the sheet thrown over it, hanging in folds
    box('frame', (0.9, 0.04, 1.5), (0.65, 0.4, 2.55), '#1a1410', bevel=0.01)
    nx, nz = 26, 30
    verts, faces = [], []
    for i in range(nx + 1):
        u = i / nx
        for k in range(nz + 1):
            t = k / nz
            x = 0.1 + 1.1 * u + (u - 0.5) * 0.12 * t
            hem = 1.66 + 0.06 * math.sin(u * 9.0) + 0.04 * math.sin(u * 23.0)
            z = 3.36 - (3.36 - hem) * t
            fold = math.sin(u * 19 + 0.5) * 0.035 * t + math.sin(u * 7) * 0.02
            y = 0.36 - 0.06 - fold - 0.05 * t * t
            if t < 0.06:               # over the top of the frame and back to the wall
                y = 0.36 - 0.06 + (0.06 - t) * 1.6
            verts.append((x, y, z))
    for i in range(nx):
        for k in range(nz):
            a = i * (nz + 1) + k
            faces.append((a, a + 1, a + nz + 2, a + nz + 1))
    mesh('sheet', verts, faces, '#9a917c')


# chairs read by their backs: turn them toward the viewer
balloon_chair.yaw = math.radians(-32)
room_chair.yaw = math.radians(28)

PROPS = {f.__name__: f for f in (seance_table, balloon_chair, side_table, raven_dome, fireplace, bed, desk, room_chair, bookshelf, washstand)}


def render(name, fn):
    scn = kit.reset()
    fn()
    if getattr(fn, 'yaw', 0):
        root = kit.link(bpy.data.objects.new('root', None))
        for o in list(scn.objects):
            if o is not root:
                o.parent = root
        root.rotation_euler = (0, 0, fn.yaw)
    cam = kit.link(bpy.data.objects.new('cam', bpy.data.cameras.new('cam')))
    cam.data.type = 'ORTHO'
    cam.rotation_euler = (PI / 2 - ELEV, 0, 0)
    cam.location = (0, -30, 30 * math.tan(ELEV))
    scn.camera = cam
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    inv = cam.matrix_world.inverted()
    xs, ys = [], []
    for o in scn.objects:
        if o.type not in ('MESH', 'CURVE'):
            continue
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        for v in me.vertices:
            p = inv @ (ev.matrix_world @ v.co)
            xs.append(p.x); ys.append(p.y)
        ev.to_mesh_clear()
    m = 0.04
    x0, x1, y0, y1 = min(xs) - m, max(xs) + m, min(ys) - m, max(ys) + m
    W, H = math.ceil((x1 - x0) * 100), math.ceil((y1 - y0) * 100)
    scn.render.resolution_x, scn.render.resolution_y = W, H
    cam.data.ortho_scale = max(W, H) / 100
    # move the camera in its own plane to the middle of the prop
    cam.location = cam.location + cam.matrix_world.to_3x3() @ Vector((x0 + W / 200, y0 + H / 200, 0))
    bpy.context.view_layer.update()
    o = cam.matrix_world.inverted() @ Vector((0, 0, 0))
    ax, ay = round(o.x * 100 + W / 2), round(H / 2 - o.y * 100)
    scn.render.filepath = os.path.join(OUT, name + '.png')
    bpy.ops.render.render(write_still=True)
    print(f'{name}: {W}x{H} origin {ax},{ay}', flush=True)
    return {'w': W, 'h': H, 'ax': ax, 'ay': ay}


meta_path = os.path.join(OUT, 'props.json')
meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
for name, fn in PROPS.items():
    if ONLY and name not in ONLY:
        continue
    meta[name] = render(name, fn)
json.dump(meta, open(meta_path, 'w'), indent=1)
