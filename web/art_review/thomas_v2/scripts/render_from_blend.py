"""Thomas Ashgrove V2 -- candidate renderer (BENCHMARK, isolated).

Fork of web/tools/blender/figure.py (HEAD ffe46380) with V2 art deltas. NEVER writes to
web/assets/models/. Destination is always inside web/art_review/thomas_v2/.

usage: blender -b source/Thomas_Ashgrove_V2.blend -P scripts/render_from_blend.py -- OUT_DIR [anim,anim...]

The meshes and materials come from the loaded .blend, not from reconstructed geometry.
Python poses the named rig empties and reconstructs the COAT vertices each frame
(build_coat), using the gait and poses of Actor.drawFigure (src/engine/actor.js).
Every frame is
rendered twice from a side camera: once flat (base colour, ambient occlusion, darker where the surface
turns away) and once as camera-space normals. The game reduces the colour to its pixel grid and lights
it per pixel with the normals, like the scenery. Writes into OUT_DIR: albedo.png, normal.png (RG =
normal x/y, B = lantern glass), model.json, and preview.png (a lit contact sheet for checking by eye).
tools/blender/pack.py then compresses them into web/assets/models/WHO.
"""
import bpy
import json
import math
import os
import sys

import numpy as np

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _THIS_DIR)
sys.path.insert(0, os.path.join(_THIS_DIR, '..', '..', '..', 'tools', 'blender'))
try:
    from cast import CAST  # noqa: E402
    _BASE_THOMAS = dict(CAST.get('thomas', {}))
except Exception:
    _BASE_THOMAS = {}

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(ARGS[0])
WHO = 'thomas'
ONLY = ARGS[1].split(',') if len(ARGS) > 1 else None
os.makedirs(os.path.join(OUT, 'frames'), exist_ok=True)

DEF = dict(h=200, hat='bowler', hatColor='#121316', coat='#26282b', coatLen=0.78, flare=1.15, build=1.0,
           skin='#9c8470', trousers='#1c1d1f', boots='#121110', skirt=False, apron=None, scarf=None, cane=False,
           lantern=False, lanternOn=False, stoop=0, hair='#1e1712', cape=False, beard=None, moustache=None,
           sideburns=False, collarUp=False, buttons='single', belt=False, tails=False, rolled=False, patches=False,
           shawl=None, waistcoat=None, chain=False, number=False, bustle=False, lapel='#d8cfbd', notebook=False,
           gloves=None, walk=False, run=False, reach=False, poses=[], base=None, idle=8, lying=None, eyesClosed=False,
           cover=None, talk=True, gait=((('walk', 1.0, 16), ('walkh', 0.5, 16))), runFrames=12)
V2 = dict(
    h=206, hat='bowler', hatColor='#0f1114', coat='#2e3238', coatLen=0.88, flare=1.34, build=1.0,
    skin='#a78a6f', trousers='#141518', boots='#171310', skirt=False, apron=None,
    scarf='#5c1a15', cane=False, lantern=True, lanternOn=True, stoop=0,
    hair='#17110c', cape=False, beard=None, moustache=None, sideburns=True, collarUp=True,
    buttons='single', belt=False, tails=False, rolled=False, patches=False,
    shawl=None, waistcoat=None, chain=False, number=False, bustle=False, lapel='#d9cfba',
    notebook=True, gloves='#38301f', walk=True, run=True, reach=True, poses=None, base=None,
    idle=12, lying=None, eyesClosed=False, cover=None, talk=True,
    gait=(('walk', 1.0, 16), ('walk3', 0.75, 12), ('walkh', 0.5, 12), ('walkq', 0.25, 12)),
    runFrames=12,
)
C = {**DEF, **_BASE_THOMAS, **V2}
C['poses'] = ['kneel', 'take', 'inspect', 'recoil', 'clutch', 'write', 'sit', 'reach']

TAU, PI = math.tau, math.pi
SC = C['h'] / 200            # the figure is laid out in actor.js units, px at h = 200
U = 0.01                     # one of those px in Blender units: 1 unit = 100 px
YAW = math.radians(22)       # turned a little toward the viewer: a profile with volume
B = 1.0  # framing build frozen; visual width comes from the meshes, not the frame
# FROZEN framing = thomas baseline so V2 aligns pixel-fair with production (216x270, anchor 108,249)
FW, FH, AX, AY = 216, 270, 108, 249
STRIDE = 50
HIP_Z, SHOULDER = 0.97, 0.61                # pelvis height; shoulder line above the pelvis
THIGH, SHIN, UPPER, FORE = 0.45, 0.46, 0.29, 0.27
HEADK = 1.28 * (1 + max(0, 190 - C['h']) / 200) if not C['lying'] else 1.28   # stylised heads, bigger still on children

# ------------------------------------------------------------------ scene
scn = bpy.context.scene
coll = scn.collection
scn.render.engine = 'BLENDER_EEVEE'
scn.render.resolution_x, scn.render.resolution_y = FW, FH
scn.render.resolution_percentage = 100
scn.render.film_transparent = True
scn.render.dither_intensity = 0
scn.render.filter_size = 0.7  # V2: sharper edges, less halo at pack
scn.render.image_settings.file_format = 'PNG'
scn.render.image_settings.color_mode = 'RGBA'
scn.render.image_settings.color_depth = '8'
scn.eevee.taa_render_samples = 64  # V2: cleaner silhouette alpha
scn.view_settings.view_transform = 'Raw'      # the emitted numbers go to the file untouched
scn.view_settings.look = 'None'
scn.view_settings.exposure = 0
scn.view_settings.gamma = 1
cam = bpy.data.objects.get('cam')
assert cam is not None and cam.data.type == 'ORTHO', 'blend missing export ortho cam'
scn.camera = cam

# ------------------------------------------------------------------ materials
# Every material ends in one shared group: mode 0 emits the flat colour darkened by ambient occlusion
# and by how far the surface turns from the viewer; mode 1 emits the camera-space normal (and the glass
# mask in blue). The Raw view keeps the numbers.
_ng = bpy.data.node_groups.get('Out')
assert _ng is not None, 'blend missing Out node group'
_mode_nodes = [n for n in _ng.nodes if n.type == 'VALUE']
assert len(_mode_nodes) == 1, f'Out VALUE nodes: {len(_mode_nodes)}'
mode = _mode_nodes[0]

MATS = {}


def hexc(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1.0,)


def shaded(h, k):
    r, g, b, _ = hexc(h)
    return '#' + ''.join(f'{min(255, round(v * k * 255)):02x}' for v in (r, g, b))


def mat(color, glass=False):
    key = (color, glass)
    if key in MATS:
        return MATS[key]
    m = bpy.data.materials.new(f'{color}{"g" if glass else ""}')
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    g = nt.nodes.new('ShaderNodeGroup'); g.node_tree = ng
    g.inputs['Color'].default_value = hexc(color)
    g.inputs['Mask'].default_value = 1.0 if glass else 0.0
    o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(g.outputs[0], o.inputs['Surface'])
    MATS[key] = m
    return m


# ------------------------------------------------------------------ geometry
def lathe(prof, seg=24, sx=1.0, sy=1.0):  # V2: smoother silhouette
    """Revolve a list of (z, r) round the z axis; a ring of radius 0 is a single pole vertex."""
    verts, faces, rings = [], [], []
    for z, r in prof:
        if r <= 1e-6:
            rings.append([len(verts)]); verts.append((0.0, 0.0, z))
            continue
        ids = []
        for j in range(seg):
            a = TAU * j / seg
            ids.append(len(verts)); verts.append((math.cos(a) * r * sx, math.sin(a) * r * sy, z))
        rings.append(ids)
    for A, Bn in zip(rings, rings[1:]):
        if len(A) == 1 and len(Bn) == 1:
            continue
        if len(A) == 1:
            faces += [(A[0], Bn[j], Bn[(j + 1) % seg]) for j in range(seg)]
        elif len(Bn) == 1:
            faces += [(A[j], Bn[0], A[(j + 1) % seg]) for j in range(seg)]
        else:
            faces += [(A[j], Bn[j], Bn[(j + 1) % seg], A[(j + 1) % seg]) for j in range(seg)]
    return verts, faces


def capsule(L, r0, r1, k=6):  # V2: smoother caps
    """Profile of a tapered capsule hanging from z = 0 down to z = -L."""
    prof = [(r0 * math.cos((PI / 2) * i / k), r0 * math.sin((PI / 2) * i / k)) for i in range(k + 1)]
    prof += [(-L - r1 * math.sin((PI / 2) * i / k), r1 * math.cos((PI / 2) * i / k)) for i in range(k + 1)]
    return prof


def obj(name, vf, color, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), smooth=True, glass=False):
    me = bpy.data.meshes.new(name)
    me.from_pydata(vf[0], [], vf[1])
    me.update()
    if smooth:
        me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    me.materials.append(mat(color, glass))
    o = bpy.data.objects.new(name, me)
    coll.objects.link(o)
    o.parent = parent
    o.location = loc
    o.rotation_euler = rot
    return o


def empty(name, parent, loc=(0, 0, 0)):
    e = bpy.data.objects.new(name, None)
    coll.objects.link(e)
    e.parent = parent
    e.location = loc
    return e


def limb(name, parent, L, r0, r1, color, seg=16, sy=1.0):  # V2
    return obj(name, lathe(capsule(L, r0, r1), seg, 1.0, sy), color, parent)


def ccw(o, a):
    """Rotate in the picture plane: counter-clockwise as the camera sees it (forward for a limb)."""
    o.rotation_euler = (0, -a, 0)


# ------------------------------------------------------------------ the figure
skirt = C['skirt']
if skirt:
    top = [(0.7, 0.07, 0.075, 0.075, 0.03), (0.645, 0.15, 0.1, 0.1, 0.01), (0.6, 0.21, 0.12, 0.12, 0.0),
           (0.45, 0.2, 0.135, 0.125, 0.0), (0.25, 0.17, 0.11, 0.11, 0.0), (0.12, 0.155, 0.1, 0.1, 0.0)]
    bust = 0.12 if C['bustle'] else 0.0
    hem = -HIP_Z + 0.015
    rings = top + [(0.05, 0.2, 0.16, 0.18 + bust, 0.0), (-0.1, 0.25, 0.22, 0.25 + bust * 1.3, 0.0),
                   (-0.4, 0.3, 0.27, 0.3 + bust * 0.6, 0.0), (-0.7, 0.34, 0.31, 0.33, 0.0),
                   (hem, 0.37, 0.34, 0.36, 0.0), (hem - 0.004, 0.35, 0.32, 0.34, 0.0)]
else:
    collar = ([(0.75, 0.072, 0.075, 0.075, 0.035), (0.69, 0.088, 0.09, 0.09, 0.03)]
              if C['collarUp']
              else [(0.68, 0.085, 0.08, 0.085, 0.0), (0.66, 0.11, 0.095, 0.095, 0.0)])
    top = collar + [(0.645, 0.16, 0.105, 0.1, 0.01), (0.6, 0.232, 0.125, 0.12, 0.0), (0.48, 0.225, 0.135, 0.13, 0.0),
                    (0.28, 0.2, 0.125, 0.12, 0.0), (0.1, 0.183, 0.115, 0.115, 0.0), (-0.02, 0.2, 0.135, 0.13, 0.0)]
    hem = -(HIP_Z - (97 - (C['coatLen'] - 0.5) * 140) * U) - 0.02
    fl = C['flare'] / 1.2
    span = hem + 0.02
    skirt_r = [(-0.02 + span * f, 0.2 + 0.07 * f * fl, 0.135 + 0.09 * f * fl, 0.13 + 0.105 * f * fl, 0.0) for f in (0.3, 0.62, 0.92)]
    rings = top + skirt_r + [(hem, 0.2 + 0.072 * fl, 0.135 + 0.093 * fl, 0.13 + 0.106 * fl, 0.0),
                             (hem + 0.005, 0.19 + 0.06 * fl, 0.125 + 0.08 * fl, 0.12 + 0.09 * fl, 0.0)]
RINGS = [(z, a * (1.12 if z > 0.3 else 1.06) * B, bf * (1.42 if z > 0 else 1.3) * B, bb * (1.38 if z > 0 else 1.3) * B, cx)
         for z, a, bf, bb, cx in rings]
if C['lying']:
    RINGS = [(z, a * 1.15, bf * 0.42, bb * 0.3, cx) if z < 0.05 else (z, a, bf, bb, cx) for z, a, bf, bb, cx in RINGS]
HEM = RINGS[-2][0]
SEG = 28


def tree(o):
    out = [o]
    for c in o.children:
        out += tree(c)
    return out


def show(o, on):
    for x in tree(o):
        x.hide_render = not on


def _ob(nm):
    o = bpy.data.objects.get(nm)
    assert o is not None, f'blend missing object {nm}'
    return o


root = _ob('root')
pelvis = _ob('pelvis')
spine = _ob('spine')
legs = {}
for _side in ('near', 'far'):
    legs[_side] = (_ob(f'hip_{_side}'), _ob(f'knee_{_side}'), _ob(f'ankle_{_side}'))
arms = {}
for _side in ('near', 'far'):
    arms[_side] = (_ob(f'shoulder_{_side}'), _ob(f'elbow_{_side}'), _ob(f'wrist_{_side}'))
lanterns = {'near': _ob('lan_near'), 'far': _ob('lan_far'), 'ground': _ob('lan_ground')}
cane = None
notebook = _ob('notebook')
pencil = _ob('pencil')
neck = _ob('neck')
head = _ob('head')
coat_me = _ob('coat').data
buttons = [(_ob(f'btn{i}0.0'), i, 0.0) for i in range(4)]
extras = []
placket = _ob('placket')
lapel_near = _ob('lapel_near')
lapel_far = _ob('lapel_far')
collar_ring = _ob('collar_ring')
seam_near = _ob('seam_near')
seam_far = _ob('seam_far')
pocket = _ob('pocket')
hemband = _ob('hemband')
V2_FURNITURE = (placket, lapel_near, lapel_far, collar_ring, seam_near, seam_far, pocket, hemband)


def seg_closest(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, np.dot(p - a, ab) / max(1e-9, np.dot(ab, ab))))
    return a + ab * t


def build_coat(st):
    """Place every coat vertex for the current pose (all in root space, before the root's scale)."""
    pz, lean = st['pz'], st['lean']
    cl, sl = math.cos(lean), math.sin(lean)
    sway, push, trail, run, caps = st['sway'], st['push'], st['trail'], st['run'], st['caps']
    ground = 0.012 - pz
    co = []
    for zr, a, bf, bb, cx in RINGS:
        f = max(0.0, min(1.0, zr / HEM)) if zr < 0 else 0.0     # 0 at the hips, 1 at the hem
        up = max(0.0, min(1.0, zr / 0.12))                       # how much the ring turns with the spine
        for j in range(SEG):
            ang = TAU * j / SEG
            c, s = math.cos(ang), math.sin(ang)
            k = 1 / max(1e-6, (abs(c) ** 2.6 + abs(s) ** 2.6) ** (1 / 2.6))   # a squarish section
            fold = 1 + 0.06 * f * math.sin(7 * ang + 1.3) + 0.028 * f * math.sin(13 * ang)  # V2 deeper folds
            x = (bf if c > 0 else bb) * c * k * fold + cx
            y = a * s * k * fold
            z = zr
            if f > 0:
                # dragged by the stride, pushed by the leading knee, trailing on the back leg
                x += f * (sway - run * 0.05) + (push * f if c > 0.2 else 0) - (trail * f if c < -0.2 else 0)
                if C['tails'] and c < -0.3:
                    z -= 0.12 * f * -c
            rx, rz = x * cl + z * sl, -x * sl + z * cl
            x, z = x + (rx - x) * up, z + (rz - z) * up
            p = np.array([x, y, z + pz])
            if f > 0:
                for a0, b0, rad in caps:
                    q = seg_closest(p, a0, b0)
                    d = p - q
                    dist = float(np.linalg.norm(d))
                    if dist < rad:
                        d[1] *= 0.6          # pushed out mostly forward and back, not sideways
                        p = q + d / max(1e-6, float(np.linalg.norm(d))) * rad
                # cloth that reaches the street spreads on it instead of going through
                if not C['lying'] and p[2] < ground + pz:
                    p[0] += (ground + pz - p[2]) * 0.8 * (1 if c > 0 else -1)
                    p[2] = ground + pz
            co.append(p)
    coat_me.vertices.foreach_set('co', np.array(co, dtype=np.float32).ravel())
    coat_me.update()

    def on_chest(zr, x, y):
        rx, rz = x * cl + zr * sl, -x * sl + zr * cl
        return (rx, y, rz + pz)
    front = max(r[2] for r in RINGS if 0.2 < r[0] < 0.62)
    for b, i, c in buttons:
        b.location = on_chest(0.48 - i * 0.12, front * 0.98 - c * 0.3, -0.02 - c)
    # V2 furniture follows the chest
    try:
        placket.location = on_chest(0.3, front * 0.99, -0.02)
        placket.rotation_euler = (0, lean, 0)
        lapel_near.location = on_chest(0.58, front * 1.0, -0.055)
        lapel_near.rotation_euler = (0, lean + 0.28, 0.12)
        lapel_far.location = on_chest(0.58, front * 1.0, 0.055)
        lapel_far.rotation_euler = (0, lean + 0.28, -0.12)
        collar_ring.location = (math.sin(lean) * 0.68, 0, math.cos(lean) * 0.68 + pz)
        collar_ring.rotation_euler = (0, lean, 0)
        seam_near.location = on_chest(0.6, 0.1, -0.2)
        seam_near.rotation_euler = (3.14159 / 2, 0, 0)
        seam_far.location = on_chest(0.6, 0.1, 0.2)
        seam_far.rotation_euler = (3.14159 / 2, 0, 0)
        pocket.location = on_chest(0.3, front * 0.99, -0.14)
        pocket.rotation_euler = (0, lean, 0)
        hemband.location = (sway * 0.5, 0, HEM + pz + 0.01)
    except NameError:
        pass
    for o, zr, y in extras:
        o.location = on_chest(zr, front * 0.95, -y)


# ------------------------------------------------------------------ posing
# Actor.drawFigure, pose by pose: how far the body drops, how far it leans (px), where the feet go
# (x forward, height, toe pitch), the arms (shoulder and elbow angles as actor.js writes them:
# negative is forward), the head's tilt, and which hand has the lantern.
POSES = {
    'kneel': dict(lower=38, lean=0, ff=(30, 6, 0), fb=(-44, 4, 0.9), tilt=0.24),
    'clutch': dict(lower=38, lean=10, ff=(30, 6, 0), fb=(-44, 4, 0.9), tilt=0.42, near=(-2.7, -2.15), far=(-2.55, -2.15), lantern='ground'),
    'recoil': dict(lower=0, lean=-11, ff=(14, 6, -0.2), fb=(-36, 6, 0.35), tilt=-0.16, near=(-2.15, -1.7), far=(0.55, -0.18)),
    'write': dict(lower=0, lean=3, tilt=0.26, near=(-0.6, -1.45), far=(-0.8, -1.25), lantern='ground', notebook=True),
    'reach': dict(lower=0, lean=0, tilt=0, near=(-1.25, 0.26), lantern='far'),
    'take': dict(lower=16, lean=16, ff=(22, 6, 0), fb=(-16, 6, 0.2), tilt=0.3, near=(-0.55, 0.25), far=(-0.2, -0.25), lantern='far', target=(58, 10)),
    'inspect': dict(lower=0, lean=6, tilt=0.1, near=(-1.35, -0.15)),
    'cower': dict(lower=22, lean=14, ff=(16, 6, 0), fb=(-20, 6, 0.3), tilt=0.2, near=(-2.4, 0.66), far=(-2.1, 0.56)),
    'sit': dict(lower=44, lean=0, ff=(46, 6, 0), fb=(38, 6, 0), tilt=0, near=(-0.7, -0.9), far=(-0.7, -0.9)),
}
# The victims, from the inquest descriptions, laid out standing and then turned onto their backs:
# Polly with her legs straight and her arms at her sides; Annie with her knees drawn up and turned
# out and her left arm across her chest; Kate with her left leg out straight, the right bent at the
# knee, and her arms at her sides, palms up. The head falls back.
LIE = {
    'polly': dict(ff=(8, 6, 0.6), fb=(-6, 6, 0.7), tilt=-0.35, near=(0.08, -0.15), far=(-0.06, -0.15)),
    'annie': dict(ff=(40, 44, 0.3), fb=(30, 38, 0.4), tilt=-0.45, near=(0.15, -0.2), far=(-1.2, -1.9)),
    'kate': dict(ff=(46, 26, 0.3), fb=(-6, 6, 0.7), tilt=-0.3, near=(0.12, -0.1), far=(0.12, -0.1)),
}
REACH = {'reach_lo': (62, 60), 'reach_mid': (66, 110), 'reach_hi': (58, 160)}   # Actor.reachTo, px from the feet


def foot_at(q, w, run):
    """Actor.footAt: x forward, height, toe pitch (down positive), in px at h = 200."""
    S = STRIDE * w * (1 + 0.55 * run)
    lift = (15 + 24 * run) * w
    q = q % TAU
    if q < PI:
        u = q / PI
        return S / 2 - u * S, 0.0, 0.0
    u = (q - PI) / PI
    e = u * u * (3 - 2 * u)
    return -S / 2 + e * S, lift * math.sin(u * PI), -0.35 * math.sin(u * PI) + (0.15 if u > 0.8 else 0)


def two_bone(hx, hz, tx, tz, l1, l2, bend):
    """Angles of a two-bone limb reaching from (hx, hz) for (tx, tz); bend +1 knee forward, -1 elbow back."""
    dx, dz = tx - hx, tz - hz
    d = max(1e-4, min(math.hypot(dx, dz), l1 + l2 - 1e-4))
    base = math.atan2(dx, -dz)
    a1 = math.acos(max(-1, min(1, (l1 ** 2 + d * d - l2 ** 2) / (2 * l1 * d))))
    a2 = math.acos(max(-1, min(1, (l1 ** 2 + l2 ** 2 - d * d) / (2 * l1 * l2))))
    upper = base + bend * a1
    return upper, upper - bend * (PI - a2)


def pose(phase=0.0, w=0.0, run=0.0, t=0.0, yaw=YAW, P=None, talk=None, target=None):
    root.rotation_euler = (0, 0, -yaw)
    stretch = 1 / max(0.2, math.cos(yaw))      # strides read at full length after the turn toward camera
    pp = LIE[C['lying']] if C['lying'] else POSES.get(P, {})
    lower = pp.get('lower', 0)
    qa = phase
    fa, fb = foot_at(qa, w, run), foot_at(qa + PI, w, run)
    sw = fa[0] / (STRIDE / 2)
    br = math.sin(t * 1.7) * 1.0  # V2: deeper breath
    bob = (2.6 * math.cos(2 * qa) * (1 - run) - 5 * abs(math.sin(qa)) * run + 2 * run) * w + br * 0.3
    pz = HIP_Z - (bob + lower) * U
    lean_px = C['stoop'] * 9 + w * 5 + run * 12 * w + pp.get('lean', 0)
    lean = math.atan2(lean_px, 61)
    pelvis.location = (0, 0, pz)
    spine.rotation_euler = (0, lean, 0)
    # ---- legs
    feet = {'near': pp.get('ff', (4 + fa[0], 6 + fa[1], fa[2])), 'far': pp.get('fb', (-3 + fb[0], 6 + fb[1], fb[2]))}
    caps = []
    for side in ('near', 'far'):
        hip, knee, ankle = legs[side]
        fx, fy, pitch = feet[side]
        hx, hz = 0.0, pz - 0.02
        ax, az = fx * U * stretch, fy * U
        th, sh = two_bone(hx, hz, ax, az, THIGH, SHIN, 1)
        ccw(hip, th); ccw(knee, sh - th); ccw(ankle, -pitch - sh)
        kx, kz = hx + math.sin(th) * THIGH, hz - math.cos(th) * THIGH
        ax2, az2 = kx + math.sin(sh) * SHIN, kz - math.cos(sh) * SHIN
        y = hip.location.y
        caps.append((np.array([hx, y, hz]), np.array([kx, y, kz]), 0.1 * B ** 0.5))
        caps.append((np.array([kx, y, kz]), np.array([ax2, y, az2]), 0.085 * B ** 0.5))
    # ---- arms, as drawFigure / arm() set them
    k = 0.5 + 0.24 * run  # V2: wider arm swing with weight
    lantern_hand = pp.get('lantern', 'near') if C['lantern'] else None
    if 'near' in pp:
        na, ne = pp['near']
    elif C['lantern'] and lantern_hand == 'near':
        na, ne = -0.18 + sw * 0.07 * w, -0.55
    else:
        na = sw * k * w
        ne = min(0, na) * -0.35 - 0.18 - run * 1.45
        if C['notebook'] and w == 0 and talk is None:
            ne = -1.5
        if C['cane']:
            na, ne = -0.25 + sw * 0.15 * w, -0.5
    if talk is not None and 'near' not in pp and not (C['lantern'] and lantern_hand == 'near') and not C['cane']:
        # a hand that comes up to make a point, then drops again
        g = max(0.0, math.sin(talk))
        na, ne = -0.5 * g * g + math.sin(talk * 4) * 0.06 * g, -0.18 - 0.9 * g * g
    fa_, fe = pp.get('far', (-sw * k * w, min(0, -sw * k * w) * -0.35 - 0.18 - run * 1.45))
    if lantern_hand == 'far':
        fe = -0.55
    if P == 'sit' and talk is not None:
        g = max(0.0, math.sin(talk))
        na, ne = -0.7 - 0.5 * g * g, -0.9 - 0.4 * g
    near_a, near_b = -na, -ne
    far_a, far_b = -fa_, -fe
    tgt = target or pp.get('target')
    if tgt:
        # the hand goes to the thing: shoulder to target in the picture plane
        sx = math.sin(lean) * (SHOULDER - 0.05) * 1 + math.cos(lean) * -0.005
        sz = pz + math.cos(lean) * (SHOULDER - 0.05)
        up, lo = two_bone(sx, sz, tgt[0] * U * stretch, tgt[1] * U, UPPER, FORE + 0.04, -1)
        near_a, near_b = up + lean, lo - up
    ccw(arms['near'][0], near_a); ccw(arms['near'][1], near_b)
    ccw(arms['far'][0], far_a); ccw(arms['far'][1], far_b)
    # ---- what the hands hold: lanterns and the cane hang plumb, the lantern swinging behind the hand
    lag = 0.22 * math.sin(qa - 0.9) * w * (1 + run) + 0.03 * math.sin(t * 1.3)
    for side, o in lanterns.items():
        show(o, side == lantern_hand)
        if side in arms:
            a, b = (near_a, near_b) if side == 'near' else (far_a, far_b)
            ccw(o, -(a + b - lean) + lag)
    if cane:
        ccw(cane, -(near_a + near_b - lean) + 0.1)
    notebook.hide_render = not (pp.get('notebook') or (C['notebook'] and w == 0 and talk is None and not P))
    pencil.hide_render = not pp.get('notebook')
    # ---- head: steady against the bob, tilted for the pose, nodding a little when talking
    tilt = pp.get('tilt', 0) + (0.04 * math.sin(talk * 1.6) if talk is not None else 0)
    ccw(neck, lean * 0.6 - 0.03 * w - C['stoop'] * 0.1)
    ccw(head, -tilt - 0.02 * math.sin(2 * qa) * w)
    for s in arms.values():
        s[0].location.z = SHOULDER - 0.045 + br * 0.005  # V2: tense shoulders
    push = max(0.0, fa[0]) * 0.42 * w * U * stretch  # V2: coat answers the stride
    trail = max(0.0, -fb[0]) * 0.36 * w * U * stretch
    build_coat({'pz': pz, 'lean': lean, 'sway': -sw * 5 * w * U, 'push': push, 'trail': trail, 'run': run, 'caps': caps})
    if C['lying']:
        lay_down()


def lay_down():
    """Turn the posed figure onto its back, head to the left, rolled a little toward the camera so
    the body reads from the side, and rest it on the ground in the middle of the frame."""
    root.rotation_mode = 'YXZ'
    root.rotation_euler = (0.45, -PI / 2, 0)
    root.location = (0, 0, 0)
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ v.co for o in coll.objects if o.type == 'MESH' and not o.hide_render for v in o.data.vertices]
    xs, zs = [p.x for p in pts], [p.z for p in pts]
    root.location = (-(min(xs) + max(xs)) / 2, 0, -min(zs))
    if C['cover']:
        bpy.context.view_layer.update()
        drape(min(xs) - (min(xs) + max(xs)) / 2, max(xs) - (min(xs) + max(xs)) / 2)


def drape(x0, x1):
    """The cape or sacking thrown over her, from the shoulders to the knees: a sheet dropped from above
    onto the body (a ray down at every point), thickened and softened so it rests on the high places
    and sags between them, its edges falling to the stones. Sodden with blood over the chest."""
    dg = bpy.context.evaluated_depsgraph_get()
    nx, ny = 48, 24
    xa, xb = x0 + (x1 - x0) * 0.17, x0 + (x1 - x0) * 0.93
    half = 0.48 * SC
    hgt = np.zeros((nx, ny))
    for i in range(nx):
        for j in range(ny):
            x, y = xa + (xb - xa) * i / (nx - 1), -half + 2 * half * j / (ny - 1)
            hit, loc, *_ = scn.ray_cast(dg, (x, y, 5.0), (0, 0, -1))
            hgt[i, j] = loc.z if hit else 0.0
    # rest on the highest points nearby, then soften
    from_max = np.copy(hgt)
    for di in (-2, -1, 1, 2):
        for dj in (-1, 1, 0):
            from_max = np.maximum(from_max, np.roll(np.roll(hgt, di, 0), dj, 1) * (0.9 if abs(di) == 2 else 0.97))
    z = from_max
    for _ in range(3):
        z = (z + np.roll(z, 1, 0) + np.roll(z, -1, 0) + np.roll(z, 1, 1) + np.roll(z, -1, 1)) / 5
    z = np.maximum(z, hgt) + 0.012
    # the edges slope down to the stones over a few cells, unevenly, as cloth does
    ii, jj = np.meshgrid(np.arange(nx), np.arange(ny), indexing='ij')
    edge = np.minimum(np.minimum(ii, nx - 1 - ii), np.minimum(jj, ny - 1 - jj)).astype(float)
    edge += 0.8 * np.sin(ii * 0.9 + jj * 1.7) + 0.6 * np.sin(ii * 2.3 - jj * 0.7)
    k = np.clip(edge / 4.0, 0, 1)
    z = 0.004 + (z - 0.004) * k * k * (3 - 2 * k)
    # and never sink into the body it lies on, except right at the hem
    z = np.where(edge > 1.2, np.maximum(z, hgt + 0.01), z)
    verts, faces, fm = [], [], []
    for i in range(nx):
        for j in range(ny):
            x, y = xa + (xb - xa) * i / (nx - 1), -half + 2 * half * j / (ny - 1)
            verts.append((x, y, float(z[i, j]) + 0.006 * math.sin(i * 1.7 + j * 0.9)))
    for i in range(nx - 1):
        for j in range(ny - 1):
            a = i * ny + j
            faces.append((a, a + ny, a + ny + 1, a + 1))
            u, v = i / (nx - 1), (j - ny / 2) / ny
            fm.append(1 if (u - 0.28) ** 2 / 0.02 + v * v / 0.06 < 1 else 0)
    me = bpy.data.meshes.new('cover')
    me.from_pydata(verts, [], faces)
    me.polygons.foreach_set('use_smooth', [True] * len(faces))
    me.materials.append(mat(C['cover']))
    me.materials.append(mat('#3a0808'))
    me.polygons.foreach_set('material_index', fm)
    o = bpy.data.objects.new('cover', me)
    coll.objects.link(o)


# ------------------------------------------------------------------ animations
BREATH = TAU / 1.7               # one breath (drawFigure: sin(t * 1.7))
GESTURE = TAU / 1.3              # one gesture while talking (drawFigure: sin(t * 1.3))
ANIMS = []
base = C['base']
if C['lying']:
    ANIMS += [('lie', 1, lambda i, n: pose())]
elif base:
    ANIMS += [(base, 4, lambda i, n: pose(t=i / n * BREATH, P=base)),
              (base + '_talk', 8, lambda i, n: pose(t=i / n * BREATH, P=base, talk=i / n * TAU))]
else:
    ANIMS += [('idle', C['idle'], lambda i, n: pose(t=i / n * BREATH))]
    if C['talk']:
        ANIMS += [('talk', 8, lambda i, n: pose(t=i / n * GESTURE, talk=i / n * TAU))]
    ANIMS += [('turn', 3, lambda i, n: pose(yaw=math.radians(55 + 35 * i)))]
if C['walk'] and not C['lying']:
    # one cycle per stride length: Actor picks the nearest to how far into the walk it is, so starting
    # and stopping shorten the stride step by step instead of jumping to standing
    for name, w, frames in C['gait']:
        ANIMS += [(name, frames, lambda i, n, w=w: pose(i / n * TAU, w, 0, t=i / n))]
if C['run']:
    ANIMS += [('run', C['runFrames'], lambda i, n: pose(i / n * TAU, 1, 1, t=i / n))]
for p in C['poses']:
    ANIMS += [(p, 4, lambda i, n, p=p: pose(t=i / n * BREATH, P=p))]
if C['reach']:
    for name, tgt in REACH.items():
        ANIMS += [(name, 1, lambda i, n, tgt=tgt: pose(P='reach', target=tgt))]
if ONLY:
    ANIMS = [a for a in ANIMS if a[0] in ONLY]


def render(path, m):
    mode.outputs[0].default_value = m
    scn.render.filepath = path
    bpy.ops.render.render(write_still=True)


def load(path):
    im = bpy.data.images.load(path)
    im.colorspace_settings.name = 'Non-Color'
    a = np.empty(FW * FH * 4, dtype=np.float32)
    im.pixels.foreach_get(a)
    bpy.data.images.remove(im)
    return a.reshape(FH, FW, 4)[::-1]          # Blender stores rows bottom up


def save(arr, path):
    h, w = arr.shape[:2]
    im = bpy.data.images.new(os.path.basename(path), w, h, alpha=True)
    im.colorspace_settings.name = 'Non-Color'
    im.pixels.foreach_set(np.ascontiguousarray(arr[::-1]).ravel().astype(np.float32))
    im.filepath_raw = path
    im.file_format = 'PNG'
    im.save()
    bpy.data.images.remove(im)


frames = []
for name, n, fn in ANIMS:
    for i in range(n):
        fn(i, n)
        bpy.context.view_layer.update()
        stem = os.path.join(OUT, 'frames', f'{name}_{i:02d}')
        render(stem + '_a.png', 0)
        render(stem + '_n.png', 1)
        frames.append((name, stem))
    print(f'{WHO}: {name} x{n}', flush=True)

COLS = 10
rows = math.ceil(len(frames) / COLS)
alb = np.zeros((rows * FH, COLS * FW, 4), np.float32)
nor = np.zeros_like(alb)
meta = {'w': FW, 'h': FH, 'ax': AX, 'ay': AY, 'height': C['h'], 'cols': COLS, 'anims': {}}
for k, (name, stem) in enumerate(frames):
    r, c = divmod(k, COLS)
    alb[r * FH:(r + 1) * FH, c * FW:(c + 1) * FW] = load(stem + '_a.png')
    nor[r * FH:(r + 1) * FH, c * FW:(c + 1) * FW] = load(stem + '_n.png')
    meta['anims'].setdefault(name, [k, 0])[1] += 1
nor[..., 3] = alb[..., 3]
save(alb, os.path.join(OUT, 'albedo.png'))
save(nor, os.path.join(OUT, 'normal.png'))
json.dump(meta, open(os.path.join(OUT, 'model.json'), 'w'), indent=1)

# a contact sheet lit by a warm lamp on the right and a cold sky on the left, for eyes only
n = nor[..., :3] * 2 - 1
nx, ny = n[..., 0], n[..., 1]
nz = np.sqrt(np.clip(1 - nx * nx - ny * ny, 0, 1))
key = np.clip(nx * 0.6 + ny * 0.5 + nz * 0.62, 0, 1)[..., None] * np.array([1.0, 0.78, 0.55])
fill = np.clip(-nx * 0.7 + ny * 0.2 + nz * 0.7, 0, 1)[..., None] * np.array([0.3, 0.38, 0.5])
lit = alb[..., :3] * (0.35 + 1.6 * key + 0.8 * fill)
glass = nor[..., 2:3] * alb[..., 3:4]
lit = lit * (1 - glass) + glass * np.array([1.0, 0.8, 0.5])
a = alb[..., 3:4]
prev = np.concatenate([np.clip(lit * a + np.array([0.16, 0.15, 0.14]) * (1 - a), 0, 1), np.ones_like(a)], axis=2)
save(prev, os.path.join(OUT, 'preview.png'))
print('done', WHO, meta['anims'], flush=True)
