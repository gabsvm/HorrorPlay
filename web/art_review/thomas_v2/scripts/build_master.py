"""Thomas Ashgrove V2 -- candidate renderer (BENCHMARK, isolated).

Fork of web/tools/blender/figure.py (HEAD ffe46380) with V2 art deltas. NEVER writes to
web/assets/models/. Destination is always inside web/art_review/thomas_v2/.

usage: blender -b --factory-startup -P web/art_review/thomas_v2/scripts/render_candidate.py -- OUT_DIR [anim,anim...]

WHO is a key of cast.py. The figure is built from simple solids (a lathe per part), posed frame by
frame with the gait and the poses of Actor.drawFigure (src/engine/actor.js), and every frame is
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
# MASTER: no render frames dir (OUT is the .blend path, not a folder)

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
bpy.ops.wm.read_factory_settings(use_empty=True)
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
scn.world = bpy.data.worlds.new('void')
scn.world.color = (0, 0, 0)

cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
coll.objects.link(cam)
cam.data.type = 'ORTHO'
cam.data.ortho_scale = max(FW, FH) * U
cam.location = ((FW / 2 - AX) * U, -10, (AY - FH / 2) * U)
cam.rotation_euler = (PI / 2, 0, 0)
scn.camera = cam

# ------------------------------------------------------------------ materials
# Every material ends in one shared group: mode 0 emits the flat colour darkened by ambient occlusion
# and by how far the surface turns from the viewer; mode 1 emits the camera-space normal (and the glass
# mask in blue). The Raw view keeps the numbers.
ng = bpy.data.node_groups.new('Out', 'ShaderNodeTree')
ng.interface.new_socket('Color', in_out='INPUT', socket_type='NodeSocketColor')
ng.interface.new_socket('Mask', in_out='INPUT', socket_type='NodeSocketFloat')
ng.interface.new_socket('Shader', in_out='OUTPUT', socket_type='NodeSocketShader')
N, L = ng.nodes, ng.links
gi, go = N.new('NodeGroupInput'), N.new('NodeGroupOutput')
mode = N.new('ShaderNodeValue'); mode.outputs[0].default_value = 0
ao = N.new('ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = 0.28  # V2
L.new(gi.outputs['Color'], ao.inputs['Color'])
aok = N.new('ShaderNodeMapRange'); aok.inputs['To Min'].default_value = 0.22  # V2 deeper folds
L.new(ao.outputs['AO'], aok.inputs['Value'])
geo = N.new('ShaderNodeNewGeometry')
vt = N.new('ShaderNodeVectorTransform'); vt.vector_type = 'NORMAL'; vt.convert_from = 'WORLD'; vt.convert_to = 'CAMERA'
L.new(geo.outputs['Normal'], vt.inputs[0])
sep = N.new('ShaderNodeSeparateXYZ'); L.new(vt.outputs[0], sep.inputs[0])
pw = N.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.use_clamp = True; pw.inputs[1].default_value = 0.7  # V2 more volume
L.new(sep.outputs['Z'], pw.inputs[0])
rim = N.new('ShaderNodeMapRange'); rim.inputs['To Min'].default_value = 0.42  # V2 stronger edge
L.new(pw.outputs[0], rim.inputs['Value'])
shade = N.new('ShaderNodeMath'); shade.operation = 'MULTIPLY'
L.new(aok.outputs[0], shade.inputs[0]); L.new(rim.outputs[0], shade.inputs[1])
mul = N.new('ShaderNodeVectorMath'); mul.operation = 'MULTIPLY'
L.new(gi.outputs['Color'], mul.inputs[0]); L.new(shade.outputs[0], mul.inputs[1])
e0 = N.new('ShaderNodeEmission'); L.new(mul.outputs[0], e0.inputs['Color'])
comb = N.new('ShaderNodeCombineXYZ')
for k, axis in ((0, 'X'), (1, 'Y')):
    m = N.new('ShaderNodeMath'); m.operation = 'MULTIPLY_ADD'
    m.inputs[1].default_value = 0.5; m.inputs[2].default_value = 0.5
    L.new(sep.outputs[axis], m.inputs[0]); L.new(m.outputs[0], comb.inputs[k])
L.new(gi.outputs['Mask'], comb.inputs[2])
e1 = N.new('ShaderNodeEmission'); L.new(comb.outputs[0], e1.inputs['Color'])
mix = N.new('ShaderNodeMixShader')
L.new(mode.outputs[0], mix.inputs[0]); L.new(e0.outputs[0], mix.inputs[1]); L.new(e1.outputs[0], mix.inputs[2])
L.new(mix.outputs[0], go.inputs['Shader'])

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
root = empty('root', None)
root.scale = (SC, SC, SC)
pelvis = empty('pelvis', root, (0, 0, HIP_Z))
spine = empty('spine', pelvis)

legs = {}
leg_col = '#1a1614' if skirt else C['trousers']
for side, y in (('near', -0.085), ('far', 0.085)):
    hip = empty(f'hip_{side}', pelvis, (0, y, -0.02))
    limb(f'thigh_{side}', hip, THIGH, 0.078, 0.06, leg_col)
    knee = empty(f'knee_{side}', hip, (0, 0, -THIGH))
    limb(f'shin_{side}', knee, SHIN, 0.058, 0.047, leg_col)
    ankle = empty(f'ankle_{side}', knee, (0, 0, -SHIN))
    obj(f'shaft_{side}', lathe(capsule(0.11, 0.05, 0.049), 16), C['boots'], ankle, (0, 0, 0.1))
    boot = lathe([(0.0, 0.0), (0.012, 0.032), (0.04, 0.05), (0.12, 0.052), (0.2, 0.043), (0.235, 0.027), (0.245, 0.0)], 20)
    obj(f'boot_{side}', ([(z - 0.06, y2 * 0.95, -x * 0.85 - 0.035) for x, y2, z in boot[0]], boot[1]), C['boots'], ankle)
    # V2: sole, heel block and toe cap read at game size
    obj(f'sole_{side}', lathe([(0.0, 0.0), (0.0, 0.052), (-0.018, 0.055), (-0.02, 0.0)], 16), '#0b0a09', ankle, (0.1, 0, -0.048), (0, 0.06, 0))
    obj(f'toecap_{side}', lathe(capsule(0.03, 0.045, 0.04), 10), shaded(C['boots'], 1.25), ankle, (0.155, 0, -0.028))
    legs[side] = (hip, knee, ankle)

arms = {}
hand_col = C['gloves'] or C['skin']
for side, y in (('near', -0.262), ('far', 0.262)):  # V2: wider shoulder line
    sh = empty(f'shoulder_{side}', spine, (-0.005, y, SHOULDER - 0.045))
    obj(f'pad_{side}', lathe(capsule(0.07, 0.075, 0.062), 16), C['coat'], sh, (0, 0, 0.01))  # V2 shoulder cap
    limb(f'upper_{side}', sh, UPPER, 0.074, 0.06, C['coat'])  # V2: heavier sleeve
    el = empty(f'elbow_{side}', sh, (0, 0, -UPPER))
    fore = C['skin'] if C['rolled'] else C['coat']
    limb(f'fore_{side}', el, FORE - 0.02, 0.06, 0.053, fore)
    obj(f'fold_{side}', lathe(capsule(0.03, 0.062, 0.058), 12), shaded(C['coat'], 0.82), el, (0, 0, 0.015))  # V2 elbow fold
    if C['rolled']:
        obj(f'roll_{side}', lathe([(0.03, 0.0), (0.025, 0.06), (-0.03, 0.065), (-0.04, 0.0)], 12), C['coat'], el)
    else:
        obj(f'cuff_{side}', lathe([(0.0, 0.053), (-0.03, 0.058), (-0.032, 0.0)], 12), shaded(C['coat'], 0.8), el, (0, 0, -0.24))
    obj(f'cuffbtn_{side}', lathe(capsule(0.004, 0.011, 0.011), 8), '#c9a24a', el, (0.055, 0, -0.245))  # V2 brass cuff
    wr = empty(f'wrist_{side}', el, (0, 0, -FORE))
    obj(f'glovecuff_{side}', lathe([(0.0, 0.036), (-0.025, 0.04), (-0.028, 0.0)], 14), shaded(hand_col, 1.2), wr, (0, 0, 0.028))  # V2 glove gauntlet
    obj(f'hand_{side}', lathe(capsule(0.055, 0.034, 0.028), 12, 1.0, 0.78), hand_col, wr)
    obj(f'thumb_{side}', lathe(capsule(0.03, 0.012, 0.01), 8), hand_col, wr, (0.03, -0.02 if side == 'near' else 0.02, -0.045), (0, 0.5, 0))
    arms[side] = (sh, el, wr)


def build_lantern(name, parent, loc):
    lan = empty(name, parent, loc)
    lan.scale = (1.38, 1.38, 1.38)  # V2: lantern reads at 100 px
    obj(name + 'bail', lathe([(0.0, 0.004), (-0.05, 0.004)], 6), '#2a2622', lan)
    obj(name + 'cap', lathe([(-0.045, 0.0), (-0.05, 0.02), (-0.07, 0.045), (-0.075, 0.048), (-0.078, 0.0)], 4), '#2a2622', lan, rot=(0, 0, PI / 4))
    obj(name + 'glass', lathe([(-0.078, 0.043), (-0.165, 0.043)], 6), '#6a4c22', lan, rot=(0, 0, PI / 4), smooth=False, glass=True)
    obj(name + 'flame', lathe(capsule(0.035, 0.016, 0.01), 8), '#ffca7a', lan, (0, 0, -0.12), smooth=False, glass=True)  # V2 lit core
    for i in range(4):
        a = PI / 4 + i * PI / 2
        obj(f'{name}bar{i}', lathe([(-0.078, 0.006), (-0.165, 0.006)], 4), '#2a2622', lan, (math.cos(a) * 0.05, math.sin(a) * 0.05, 0))
    obj(name + 'base', lathe([(-0.165, 0.052), (-0.185, 0.05), (-0.188, 0.0)], 4), '#2a2622', lan, rot=(0, 0, PI / 4))
    return lan


def tree(o):
    out = [o]
    for c in o.children:
        out += tree(c)
    return out


def show(o, on):
    for x in tree(o):
        x.hide_render = not on


lanterns = {}
if C['lantern']:
    lanterns['near'] = build_lantern('lan_near', arms['near'][2], (0.01, 0, -0.06))
    lanterns['far'] = build_lantern('lan_far', arms['far'][2], (0.01, 0, -0.06))
    lanterns['ground'] = build_lantern('lan_ground', root, (0.42, -0.12, 0.235))
cane = None
if C['cane']:
    cane = empty('cane', arms['near'][2], (0.01, 0, -0.04))
    obj('cane_shaft', lathe(capsule(0.78, 0.014, 0.012), 8), '#100c09', cane)
    obj('cane_knob', lathe(capsule(0.02, 0.022, 0.02), 8), '#b9a36a', cane, (0, 0, 0.02))
# the notebook and the pencil, shown only when they are out
notebook = obj('notebook', lathe([(0.0, 0.0), (0.0, 0.07), (-0.012, 0.07), (-0.012, 0.0)], 4, 1.0, 0.75), '#d8cfbd',
               arms['near'][2], (0.04, 0, -0.07), (0, PI / 2, PI / 4), smooth=False)
pencil = obj('pencil', lathe(capsule(0.09, 0.006, 0.005), 6), '#3a2a1a', arms['far'][2], (0.02, 0, -0.03), (0, -1.0, 0))

# ---- neck, head, face
neck = empty('neck', spine, (0.03 + C['stoop'] * 0.04, 0, SHOULDER + 0.04))
limb('neckm', neck, 0.09, 0.045, 0.05, C['skin'])
head = empty('head', neck, (0.035, 0, 0.16))
head.scale = (HEADK,) * 3
sk, hc = C['skin'], C['hair']
# V2 skull: longer, gaunter; cheek hollows; stronger chin; tired human eyes
obj('skull', lathe(capsule(0.062, 0.1, 0.089), 22, 1.07, 0.9), sk, head, (0, 0, 0.055))
obj('cheek_near', lathe(capsule(0.03, 0.028, 0.02), 10, 1.0, 0.6), shaded(sk, 0.92), head, (0.055, -0.055, -0.005), (0.3, 0, 0))
obj('cheek_far', lathe(capsule(0.03, 0.028, 0.02), 10, 1.0, 0.6), shaded(sk, 0.88), head, (0.055, 0.055, -0.005), (-0.3, 0, 0))
obj('jaw', lathe(capsule(0.042, 0.072, 0.05), 20, 1.0, 0.85), sk, head, (0.032, 0, -0.035))
obj('chin', lathe(capsule(0.018, 0.032, 0.024), 12), shaded(sk, 0.95), head, (0.062, 0, -0.062))
obj('stubble', lathe(capsule(0.03, 0.071, 0.052), 18, 1.0, 0.86), '#6f5c48', head, (0.033, 0, -0.038))
obj('nose_bridge', lathe(capsule(0.035, 0.014, 0.012), 10), shaded(sk, 0.97), head, (0.095, 0, 0.012), (0, -0.35, 0))
obj('nose', lathe([(0.0, 0.0), (-0.004, 0.013), (-0.032, 0.017), (-0.038, 0.0)], 12), sk, head, (0.1, 0, -0.002), (0, -(PI / 2 - 0.3), 0))
obj('brow', lathe(capsule(0.062, 0.018, 0.016), 12), shaded(sk, 0.94), head, (0.082, -0.03, 0.032), (PI / 2, 0, 0))
obj('mouth_line', lathe(capsule(0.028, 0.006, 0.006), 8), shaded(sk, 0.62), head, (0.088, -0.012, -0.048), (PI / 2, 0, 0))
obj('lips', lathe(capsule(0.028, 0.009, 0.008), 8), shaded(sk, 0.78), head, (0.089, -0.015, -0.052), (PI / 2, 0, 0))
for s in (-1, 1):
    obj(f'ear{s}', lathe(capsule(0.034, 0.026, 0.02), 12, 1.0, 0.45), sk, head, (-0.012, s * 0.086, 0.02))
    obj(f'earfold{s}', lathe(capsule(0.018, 0.009, 0.007), 8, 1.0, 0.4), shaded(sk, 0.85), head, (-0.008, s * 0.088, 0.022))
    obj(f'socket{s}', lathe(capsule(0.004, 0.02, 0.017), 10), shaded(sk, 0.8), head, (0.084, s * 0.034, 0.014))
    obj(f'eye{s}', lathe(capsule(0.003, 0.0145, 0.013), 12), shaded(sk, 0.7) if C['eyesClosed'] else '#241a14', head, (0.088, s * 0.034, 0.013))
    obj(f'lid{s}', lathe(capsule(0.02, 0.007, 0.006), 8), shaded(sk, 0.9), head, (0.086, s * 0.034, 0.026), (PI / 2, 0, 0))
    obj(f'browhair{s}', lathe(capsule(0.032, 0.008, 0.007), 8), hc, head, (0.088, s * 0.036, 0.042), (PI / 2 + s * 0.12, 0, 0))
    if C['sideburns']:
        obj(f'burn{s}', lathe(capsule(0.05, 0.016, 0.012), 10, 1.0, 0.5), hc, head, (0.028, s * 0.085, 0.005))
long_hair = skirt or C['hat'] in ('bonnet', 'shawl')
if C['hat'] != 'shawl':
    obj('hair', lathe(capsule(0.055, 0.099, 0.078), 20, 0.94, 0.95), hc, head, (-0.032, 0, 0.062))
    obj('hair_side', lathe(capsule(0.04, 0.06, 0.05), 14, 0.9, 0.9), shaded(hc, 1.15), head, (-0.045, 0, 0.075))
    obj('nape', lathe(capsule(0.04, 0.05, 0.035), 12), hc, head, (-0.075, 0, 0.0))
    if C['hat'] == 'none':
        obj('hair_top', lathe([(0.16, 0.0), (0.15, 0.06), (0.12, 0.095), (0.07, 0.105), (0.04, 0.0)], 14, 1.08, 0.95), hc, head, (0.0, 0, 0.0))
    if long_hair:
        obj('bun', lathe(capsule(0.03, 0.045, 0.04), 10), hc, head, (-0.1, 0, 0.02))
if C['moustache']:
    obj('moustache', lathe(capsule(0.06, 0.016, 0.014), 8, 1.0, 1.0), C['moustache'], head, (0.095, -0.03, -0.025), (PI / 2, 0, 0))
if C['beard']:
    obj('beard', lathe(capsule(0.07, 0.072, 0.045), 14, 1.0, 0.85), C['beard'], head, (0.045, 0, -0.03))
    obj('beard_m', lathe(capsule(0.06, 0.017, 0.015), 8), C['beard'], head, (0.095, -0.03, -0.025), (PI / 2, 0, 0))

hat = empty('hat', head, (0.0, 0, 0.1))
hat.rotation_euler = (0, 0.1, 0)
hk = C['hatColor']
if C['hat'] == 'bowler':
    hat.scale = (1.08, 1.08, 1.07)  # V2: reads in 0.5-1 s at game size
    obj('crown', lathe([(0.148, 0.0), (0.143, 0.055), (0.122, 0.098), (0.07, 0.122), (0.0, 0.124)], 24, 1.1, 0.95), hk, hat)
    obj('band', lathe([(0.022, 0.124), (-0.006, 0.125)], 24, 1.1, 0.95), shaded(hk, 1.45), hat)
    obj('bow', lathe(capsule(0.02, 0.018, 0.014), 8, 0.7, 1.0), shaded(hk, 1.3), hat, (-0.1, 0.09, 0.02))
    obj('brim', lathe([(0.0, 0.122), (-0.011, 0.148), (0.002, 0.163), (-0.009, 0.165), (-0.022, 0.148), (-0.028, 0.0)], 24, 1.13, 0.97), hk, hat)
    obj('brim_edge', lathe([(0.0, 0.163), (-0.009, 0.165)], 24, 1.13, 0.97), shaded(hk, 0.8), hat)
elif C['hat'] == 'top':
    obj('crown', lathe([(0.25, 0.0), (0.25, 0.108), (0.15, 0.1), (0.0, 0.104)], 18, 1.08, 0.94), hk, hat)
    obj('band', lathe([(0.04, 0.106), (0.0, 0.106)], 18, 1.08, 0.94), shaded(hk, 1.6), hat)
    obj('brim', lathe([(0.0, 0.104), (-0.006, 0.14), (0.006, 0.152), (-0.006, 0.152), (-0.016, 0.0)], 18, 1.12, 0.95), hk, hat)
elif C['hat'] == 'helmet':
    hat.location = (0.0, 0, 0.05)
    obj('crown', lathe([(0.25, 0.0), (0.245, 0.03), (0.2, 0.08), (0.12, 0.112), (0.0, 0.12)], 18, 1.1, 0.96), hk, hat)
    obj('rose', lathe(capsule(0.03, 0.012, 0.012), 8), '#b9a36a', hat, (0.0, 0, 0.27))
    obj('badge', lathe(capsule(0.03, 0.02, 0.02), 8, 0.4, 1.0), '#b9a36a', hat, (0.125, 0, 0.11))
    obj('brim', lathe([(0.0, 0.12), (-0.02, 0.15), (-0.03, 0.15), (-0.03, 0.0)], 18, 1.15, 0.98), hk, hat)
elif C['hat'] == 'cap':
    hat.location = (0.01, 0, 0.07)
    obj('crown', lathe([(0.07, 0.0), (0.068, 0.08), (0.05, 0.125), (0.0, 0.12)], 16, 1.12, 1.05), hk, hat)
    obj('peak', lathe([(0.0, 0.0), (0.004, 0.07), (-0.01, 0.075), (-0.012, 0.0)], 12, 1.0, 1.4), shaded(hk, 0.9), hat, (0.1, 0, 0.0), (0, 0.15, 0))
elif C['hat'] == 'bonnet':
    # a hood round the back of the head, open round the face, tied under the chin
    obj('bonnet', lathe([(0.17, 0.0), (0.16, 0.08), (0.11, 0.13), (0.0, 0.135), (-0.1, 0.12), (-0.13, 0.08)], 16, 1.0, 1.05), hk, hat, (-0.05, 0, -0.06))
    obj('bonnet_rim', lathe([(0.0, 0.0), (0.0, 0.14), (-0.02, 0.145), (-0.02, 0.0)], 16, 0.25, 1.1), shaded(hk, 1.3), hat, (0.035, 0, 0.0), (0, -0.25, 0))
elif C['hat'] == 'shawl':
    obj('hood', lathe([(0.17, 0.0), (0.16, 0.09), (0.1, 0.135), (-0.05, 0.14), (-0.2, 0.15), (-0.26, 0.0)], 16, 1.0, 1.05), C['shawl'], hat, (-0.05, 0, -0.04))

# the scarf: a knot at the throat and the two ends down the chest
if C['scarf']:
    obj('scarf', lathe(capsule(0.075, 0.082, 0.058), 18, 0.92, 1.12), C['scarf'], spine, (0.1, 0, SHOULDER + 0.04))
    obj('knot', lathe(capsule(0.05, 0.045, 0.036), 14, 0.9, 1.0), shaded(C['scarf'], 0.85), spine, (0.155, -0.01, SHOULDER + 0.005), (0, 0.35, 0))
    for i, (y, ln) in enumerate(((-0.04, 0.26), (0.032, 0.21))):
        obj(f'scarf_end{i}', lathe(capsule(ln, 0.04, 0.034), 14, 0.48, 1.0), C['scarf'], spine, (0.218 - i * 0.014, y, SHOULDER - 0.03), (0, 0.1, 0))
        for f in range(3):
            obj(f'fringe{i}_{f}', lathe(capsule(0.035, 0.007, 0.005), 6), shaded(C['scarf'], 0.9), spine, (0.218 - i * 0.014, y - 0.018 + f * 0.018, SHOULDER - 0.045 - ln), (0, 0.12, 0))  # V2 fixed at scarf tip
elif not C['collarUp'] and not skirt:
    # a white collar and a dark tie in the open neck of the coat
    obj('collar', lathe([(0.03, 0.0), (0.03, 0.06), (-0.02, 0.075), (-0.03, 0.0)], 12), C['lapel'], spine, (0.04, 0, SHOULDER + 0.07))
    obj('tie', lathe(capsule(0.06, 0.025, 0.018), 8, 0.5, 1.0), '#141214', spine, (0.1, 0, SHOULDER + 0.02))
# a cape on the shoulders (Pike's Inverness) or a shawl round them, rigid with the spine
if C['cape'] or C['shawl']:
    col = C['shawl'] or shaded(C['coat'], 0.9)
    long = 0.38 if C['cape'] else 0.3
    prof = [(SHOULDER + 0.08, 0.09), (SHOULDER + 0.03, 0.2), (SHOULDER - 0.02, 0.29), (SHOULDER - long, 0.33), (SHOULDER - long - 0.02, 0.31)]
    obj('cape', lathe(prof, 24, 0.78 * B, 1.0 * B), col, spine)
    if C['shawl']:
        # its point hangs down the back
        obj('shawl_tip', lathe(capsule(0.16, 0.12, 0.02), 10, 0.5, 1.4), col, spine, (-0.2 * B, 0, SHOULDER - 0.2), (0, -0.25, 0))

# ------------------------------------------------------------------ coat (or bodice and skirt)
# Rings from the collar to the hem: (height above the pelvis, half width across, depth to the front,
# depth to the back, centre forward). Above the waist the cloth turns with the spine; below the hips it
# swings with the stride and is pushed out wherever a leg would come through it.
if skirt:
    top = [(0.7, 0.07, 0.075, 0.075, 0.03), (0.645, 0.15, 0.1, 0.1, 0.01), (0.6, 0.21, 0.12, 0.12, 0.0),
           (0.45, 0.2, 0.135, 0.125, 0.0), (0.25, 0.17, 0.11, 0.11, 0.0), (0.12, 0.155, 0.1, 0.1, 0.0)]
    bust = 0.12 if C['bustle'] else 0.0
    hem = -HIP_Z + 0.015
    rings = top + [(0.05, 0.2, 0.16, 0.18 + bust, 0.0), (-0.1, 0.25, 0.22, 0.25 + bust * 1.3, 0.0),
                   (-0.4, 0.3, 0.27, 0.3 + bust * 0.6, 0.0), (-0.7, 0.34, 0.31, 0.33, 0.0),
                   (hem, 0.37, 0.34, 0.36, 0.0), (hem - 0.004, 0.35, 0.32, 0.34, 0.0)]
else:
    collar = [(0.75, 0.072, 0.075, 0.075, 0.035), (0.69, 0.088, 0.09, 0.09, 0.03)] if C['collarUp'] else \
             [(0.68, 0.085, 0.08, 0.085, 0.0), (0.66, 0.11, 0.095, 0.095, 0.0)]
    top = collar + [(0.645, 0.16, 0.105, 0.1, 0.01), (0.6, 0.232, 0.125, 0.12, 0.0), (0.48, 0.225, 0.135, 0.13, 0.0),
                    (0.28, 0.2, 0.125, 0.12, 0.0), (0.1, 0.183, 0.115, 0.115, 0.0), (-0.02, 0.2, 0.135, 0.13, 0.0)]
    hem = -(HIP_Z - (97 - (C['coatLen'] - 0.5) * 140) * U) - 0.02
    fl = C['flare'] / 1.2
    span = hem + 0.02
    skirt_r = [(-0.02 + span * f, 0.2 + 0.07 * f * fl, 0.135 + 0.09 * f * fl, 0.13 + 0.105 * f * fl, 0.0) for f in (0.3, 0.62, 0.92)]
    rings = top + skirt_r + [(hem, 0.2 + 0.072 * fl, 0.135 + 0.093 * fl, 0.13 + 0.106 * fl, 0.0),
                             (hem + 0.005, 0.19 + 0.06 * fl, 0.125 + 0.08 * fl, 0.12 + 0.09 * fl, 0.0)]
# the game's figures read by their silhouette: heavier than anatomy would give
RINGS = [(z, a * (1.12 if z > 0.3 else 1.06) * B, bf * (1.42 if z > 0 else 1.3) * B, bb * (1.38 if z > 0 else 1.3) * B, cx)
         for z, a, bf, bb, cx in rings]
if C['lying']:
    # lying, the skirt no longer hangs in a bell: it falls flat over the legs and spreads on the stones
    RINGS = [(z, a * 1.15, bf * 0.42, bb * 0.3, cx) if z < 0.05 else (z, a, bf, bb, cx) for z, a, bf, bb, cx in RINGS]
HEM = RINGS[-2][0]
SEG = 28
coat_me = bpy.data.meshes.new('coat')
faces, fmat = [], []
slots = [C['coat'], C['apron'] or C['coat'], C['waistcoat'] or C['coat'], '#0c0d10', shaded(C['coat'], 1.35), C['lapel']]
for i in range(len(RINGS) - 1):
    zr = (RINGS[i][0] + RINGS[i + 1][0]) / 2
    for j in range(SEG):
        a, b = i * SEG + j, i * SEG + (j + 1) % SEG
        faces.append((a, a + SEG, b + SEG, b))
        c = math.cos(TAU * (j + 0.5) / SEG)
        k = 0
        if C['apron'] and c > 0.25 and HEM < zr < 0.5:
            k = 1
        elif C['waistcoat'] and not C['collarUp'] and c > 0.8 and 0.12 < zr < 0.6:
            k = 5 if zr > 0.5 and c > 0.9 else 2
        elif C['belt'] and 0.06 < zr < 0.13:
            k = 3
        elif C['patches'] and (i, j) in ((5, 20), (5, 21), (len(RINGS) - 4, 3), (len(RINGS) - 4, 4)):
            k = 4
        fmat.append(k)
coat_me.from_pydata([(0, 0, 0)] * (len(RINGS) * SEG), [], faces)
coat_me.polygons.foreach_set('use_smooth', [True] * len(faces))
for col in slots:
    coat_me.materials.append(mat(col))
coat_me.polygons.foreach_set('material_index', fmat)
coat = bpy.data.objects.new('coat', coat_me)
coll.objects.link(coat)
coat.parent = root
btn_col = '#c9a24a'  # V2: brass always for Thomas, reads at game size
cols = (0.0,)
buttons = [] if skirt else [(obj(f'btn{i}{c}', lathe(capsule(0.003, 0.013, 0.013), 8), btn_col, root), i, c) for c in cols for i in range(4)]
# V2 furniture: placket, lapels, raised collar ring, shoulder seams, pocket flap, hem band
placket = obj('placket', lathe(capsule(0.5, 0.022, 0.02), 8, 0.6, 1.0), shaded(C['coat'], 0.88), root, (0, 0, 0))
lapel_near = obj('lapel_near', lathe([(0.0, 0.0), (0.0, 0.055), (-0.1, 0.06), (-0.11, 0.0)], 4, 0.7, 1.0), C['lapel'], root, (0, 0, 0), smooth=False)
lapel_far = obj('lapel_far', lathe([(0.0, 0.0), (0.0, 0.055), (-0.1, 0.06), (-0.11, 0.0)], 4, 0.7, 1.0), shaded(C['lapel'], 0.9), root, (0, 0, 0), smooth=False)
collar_ring = obj('collar_ring', lathe([(0.09, 0.0), (0.085, 0.075), (0.06, 0.1), (0.045, 0.1), (0.04, 0.0)], 20), shaded(C['coat'], 0.75), root, (0, 0, 0))
seam_near = obj('seam_near', lathe(capsule(0.09, 0.008, 0.008), 6), shaded(C['coat'], 0.8), root, (0, 0, 0))
seam_far = obj('seam_far', lathe(capsule(0.09, 0.008, 0.008), 6), shaded(C['coat'], 0.8), root, (0, 0, 0))
pocket = obj('pocket', lathe([(0.0, 0.0), (0.0, 0.05), (-0.015, 0.052), (-0.015, 0.0)], 4, 1.0, 0.8), shaded(C['coat'], 0.85), root, (0, 0, 0), smooth=False)
hemband = obj('hemband', lathe([(0.0, 0.0), (-0.02, 0.01)], 20), shaded(C['coat'], 0.8), root, (0, 0, 0))
V2_FURNITURE = (placket, lapel_near, lapel_far, collar_ring, seam_near, seam_far, pocket, hemband)
extras = []
if C['number']:
    extras.append((obj('number', lathe(capsule(0.02, 0.012, 0.012), 6, 0.5, 1.0), '#b9a36a', root), 0.62, 0.04))
if C['chain']:
    extras.append((obj('chain', lathe(capsule(0.08, 0.006, 0.006), 6), '#c9a24a', root, rot=(PI / 2 - 0.2, 0, 0)), 0.25, 0.04))


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



# ------------------------------------------------------------------ master: pose, organize, studio, save
import sys as _sys
MASTER_OUT = os.path.abspath(_sys.argv[_sys.argv.index('--') + 1] if '--' in _sys.argv and len(_sys.argv) > _sys.argv.index('--') + 1 else os.path.join(_THIS_DIR, '..', 'source', 'Thomas_Ashgrove_V2.blend'))
os.makedirs(os.path.dirname(MASTER_OUT), exist_ok=True)

# neutral showcase pose: standing idle, breath mid-cycle, facing export yaw
pose(t=0.0)
bpy.context.view_layer.update()

def ensure_coll(name):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
        scn.collection.children.link(c)
    return c

BODY = ensure_coll('BODY'); CLOTH = ensure_coll('CLOTHING'); ACC = ensure_coll('ACCESSORIES')
RIG = ensure_coll('RIG'); LIGHTS = ensure_coll('LIGHTS'); CAMS = ensure_coll('CAMERAS')

def move(o, coll):
    for c in list(o.users_collection):
        try:
            c.objects.unlink(o)
        except Exception:
            pass
    try:
        coll.objects.link(o)
    except Exception:
        pass

for o in list(coll.objects):
    n = o.name.lower()
    if o.type == 'EMPTY':
        move(o, RIG)
    elif n.startswith(('skull', 'jaw', 'chin', 'stubble', 'nose', 'brow', 'mouth', 'lips', 'ear', 'socket', 'eye', 'lid', 'burn', 'hair', 'nape', 'neckm', 'hand', 'thumb', 'cheek')):
        move(o, BODY)
    elif n.startswith(('coat', 'placket', 'lapel', 'collar', 'seam', 'pocket', 'hem', 'scarf', 'knot', 'fringe', 'upper', 'fore', 'fold', 'cuff', 'pad', 'glove', 'thigh', 'shin', 'shaft', 'boot', 'sole', 'toe')):
        move(o, CLOTH)
    else:
        move(o, ACC)
# keep the export ortho camera in CAMERAS
try:
    move(cam, CAMS)
except Exception:
    pass

# ---- studio: 4 showcase cameras + export-equivalent ortho already present ----
def studio_cam(name, loc, rot):
    c = bpy.data.objects.new(name, bpy.data.cameras.new(name))
    CAMS.objects.link(c)
    c.location = loc
    c.rotation_euler = rot
    c.data.type = 'PERSP'
    c.data.lens = 85
    return c

studio_cam('STUDIO_front', (0.2, -4.2, 1.15), (1.35, 0, 0))
studio_cam('STUDIO_threequarter', (2.6, -3.2, 1.35), (1.3, 0, 0.68))
studio_cam('STUDIO_side', (4.2, -0.4, 1.1), (1.45, 0, 1.5708))
studio_cam('STUDIO_back', (-0.4, 4.2, 1.3), (1.35, 0, 3.1416))

def area(name, color, energy, loc, size=2.0):
    l = bpy.data.objects.new(name, bpy.data.lights.new(name, 'AREA'))
    LIGHTS.objects.link(l)
    l.location = loc
    l.data.color = color
    l.data.energy = float(energy)
    l.data.size = size
    return l

area('KEY_amber', (1.0, 0.72, 0.42), 900, (2.5, -3.0, 3.0))
area('FILL_blue', (0.35, 0.45, 0.62), 350, (-3.0, -1.5, 2.0))
area('RIM_cool', (0.6, 0.7, 0.85), 500, (-1.0, 3.5, 2.5))
# note for the next artist
txt = bpy.data.texts.new('THOMAS_V2_NOTES') if 'THOMAS_V2_NOTES' not in bpy.data.texts else bpy.data.texts['THOMAS_V2_NOTES']
txt.clear()
txt.write("THOMAS ASHGROVE V2 master\nSame construction/pose code as scripts/render_candidate.py.\nAnim rig = RIG empties; reproduce any animation by running render_candidate.py.\nExport ortho camera = 'cam' (FW=216 FH=270 AX=108 AY=249).\nStudio cameras: STUDIO_* (perspective, showcase only).\n")
print('MASTER pose set; collections:', [(c.name, len(c.objects)) for c in (BODY, CLOTH, ACC, RIG, LIGHTS, CAMS)], flush=True)
bpy.ops.wm.save_as_mainfile(filepath=MASTER_OUT)
print('MASTER saved', MASTER_OUT, flush=True)
# optional GLB next to the blend
glb = os.path.join(os.path.dirname(MASTER_OUT), 'thomas_v2.glb')
try:
    bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB')
    print('GLB saved', glb, flush=True)
except Exception as ex:
    print('GLB export skipped:', ex, flush=True)
