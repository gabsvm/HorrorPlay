"""A character of the cast as a 3D figure, rendered to sprite atlases for the game.

usage: blender -b --factory-startup -P tools/blender/figure.py -- OUT_DIR WHO [anim,anim...]

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

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cast import CAST  # noqa: E402

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(ARGS[0])
WHO = ARGS[1]
ONLY = ARGS[2].split(',') if len(ARGS) > 2 else None
os.makedirs(os.path.join(OUT, 'frames'), exist_ok=True)

DEF = dict(h=200, hat='bowler', hatColor='#121316', coat='#26282b', coatLen=0.78, flare=1.15, build=1.0,
           skin='#9c8470', trousers='#1c1d1f', boots='#121110', skirt=False, apron=None, scarf=None, cane=False,
           lantern=False, lanternOn=False, stoop=0, hair='#1e1712', cape=False, beard=None, moustache=None,
           sideburns=False, collarUp=False, buttons='single', belt=False, tails=False, rolled=False, patches=False,
           shawl=None, waistcoat=None, chain=False, number=False, bustle=False, lapel='#d8cfbd', notebook=False,
           gloves=None, walk=False, run=False, reach=False, poses=[], base=None, idle=8, lying=None, eyesClosed=False,
           cover=None)
C = {**DEF, **CAST[WHO]}

TAU, PI = math.tau, math.pi
SC = C['h'] / 200            # the figure is laid out in actor.js units, px at h = 200
U = 0.01                     # one of those px in Blender units: 1 unit = 100 px
YAW = math.radians(22)       # turned a little toward the viewer: a profile with volume
B = C['build']
if C['lying']:
    FW, FH = round(300 * SC), round(120 * SC)
    AX, AY = FW // 2, FH - round(14 * SC)   # the middle of the body, on the ground
else:
    FW, FH = round(210 * SC * (1 + (B - 1) * 0.6)), round(262 * SC)
    AX, AY = FW // 2, FH - round(20 * SC)   # where the point between the feet lands in a frame
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
scn.render.filter_size = 0.9
scn.render.image_settings.file_format = 'PNG'
scn.render.image_settings.color_mode = 'RGBA'
scn.render.image_settings.color_depth = '8'
scn.eevee.taa_render_samples = 16
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
ao = N.new('ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = 0.3
L.new(gi.outputs['Color'], ao.inputs['Color'])
aok = N.new('ShaderNodeMapRange'); aok.inputs['To Min'].default_value = 0.3
L.new(ao.outputs['AO'], aok.inputs['Value'])
geo = N.new('ShaderNodeNewGeometry')
vt = N.new('ShaderNodeVectorTransform'); vt.vector_type = 'NORMAL'; vt.convert_from = 'WORLD'; vt.convert_to = 'CAMERA'
L.new(geo.outputs['Normal'], vt.inputs[0])
sep = N.new('ShaderNodeSeparateXYZ'); L.new(vt.outputs[0], sep.inputs[0])
pw = N.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.use_clamp = True; pw.inputs[1].default_value = 0.8
L.new(sep.outputs['Z'], pw.inputs[0])
rim = N.new('ShaderNodeMapRange'); rim.inputs['To Min'].default_value = 0.5
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
def lathe(prof, seg=14, sx=1.0, sy=1.0):
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


def capsule(L, r0, r1, k=4):
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


def limb(name, parent, L, r0, r1, color, seg=12, sy=1.0):
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
    obj(f'shaft_{side}', lathe(capsule(0.11, 0.048, 0.047), 12), C['boots'], ankle, (0, 0, 0.1))
    boot = lathe([(0.0, 0.0), (0.012, 0.03), (0.04, 0.047), (0.12, 0.049), (0.2, 0.04), (0.235, 0.025), (0.245, 0.0)], 12)
    obj(f'boot_{side}', ([(z - 0.06, y2 * 0.95, -x * 0.85 - 0.035) for x, y2, z in boot[0]], boot[1]), C['boots'], ankle)
    legs[side] = (hip, knee, ankle)

arms = {}
hand_col = C['gloves'] or C['skin']
for side, y in (('near', -0.255 * B), ('far', 0.255 * B)):
    sh = empty(f'shoulder_{side}', spine, (-0.005, y, SHOULDER - 0.05))
    limb(f'upper_{side}', sh, UPPER, 0.068 * B ** 0.5, 0.056 * B ** 0.5, C['coat'])
    el = empty(f'elbow_{side}', sh, (0, 0, -UPPER))
    fore = C['skin'] if C['rolled'] else C['coat']
    limb(f'fore_{side}', el, FORE - 0.02, 0.056 * B ** 0.5, 0.05 * B ** 0.5, fore)
    if C['rolled']:
        obj(f'roll_{side}', lathe([(0.03, 0.0), (0.025, 0.06), (-0.03, 0.065), (-0.04, 0.0)], 12), C['coat'], el)
    else:
        obj(f'cuff_{side}', lathe([(0.0, 0.053), (-0.03, 0.058), (-0.032, 0.0)], 12), shaded(C['coat'], 0.8), el, (0, 0, -0.24))
    wr = empty(f'wrist_{side}', el, (0, 0, -FORE))
    obj(f'hand_{side}', lathe(capsule(0.05, 0.032, 0.027), 10, 1.0, 0.75), hand_col, wr)
    arms[side] = (sh, el, wr)


def build_lantern(name, parent, loc):
    lan = empty(name, parent, loc)
    lan.scale = (1.25, 1.25, 1.25)
    obj(name + 'bail', lathe([(0.0, 0.004), (-0.05, 0.004)], 6), '#2a2622', lan)
    obj(name + 'cap', lathe([(-0.045, 0.0), (-0.05, 0.02), (-0.07, 0.045), (-0.075, 0.048), (-0.078, 0.0)], 4), '#2a2622', lan, rot=(0, 0, PI / 4))
    obj(name + 'glass', lathe([(-0.078, 0.04), (-0.165, 0.04)], 4), '#5a4628', lan, rot=(0, 0, PI / 4), smooth=False, glass=True)
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
obj('skull', lathe(capsule(0.06, 0.098, 0.088), 16, 1.06, 0.9), sk, head, (0, 0, 0.055))
obj('jaw', lathe(capsule(0.04, 0.07, 0.05), 14, 1.0, 0.85), sk, head, (0.03, 0, -0.035))
obj('nose', lathe([(0.0, 0.0), (-0.004, 0.012), (-0.03, 0.016), (-0.036, 0.0)], 8), sk, head, (0.098, 0, 0.0), (0, -(PI / 2 - 0.3), 0))
obj('brow', lathe(capsule(0.06, 0.016, 0.016), 8), sk, head, (0.082, -0.03, 0.03), (PI / 2, 0, 0))
obj('lips', lathe(capsule(0.03, 0.008, 0.008), 6), shaded(sk, 0.78), head, (0.09, -0.015, -0.045), (PI / 2, 0, 0))
for s in (-1, 1):
    obj(f'ear{s}', lathe(capsule(0.03, 0.022, 0.018), 8, 1.0, 0.45), sk, head, (-0.01, s * 0.085, 0.02))
    obj(f'eye{s}', lathe(capsule(0.002, 0.012, 0.012), 8), shaded(sk, 0.75) if C['eyesClosed'] else '#2a1e18', head, (0.085, s * 0.034, 0.012))
    if C['sideburns']:
        obj(f'burn{s}', lathe(capsule(0.035, 0.013, 0.011), 8, 1.0, 0.5), hc, head, (0.03, s * 0.084, 0.01))
long_hair = skirt or C['hat'] in ('bonnet', 'shawl')
if C['hat'] != 'shawl':
    obj('hair', lathe(capsule(0.05, 0.095, 0.075), 14, 0.92, 0.94), hc, head, (-0.03, 0, 0.06))
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
    hat.scale = (1.06, 1.06, 1.05)
    obj('crown', lathe([(0.135, 0.0), (0.13, 0.05), (0.112, 0.088), (0.065, 0.11), (0.0, 0.112)], 18, 1.1, 0.95), hk, hat)
    obj('band', lathe([(0.02, 0.114), (-0.005, 0.115)], 18, 1.1, 0.95), shaded(hk, 1.4), hat)
    obj('brim', lathe([(0.0, 0.112), (-0.01, 0.135), (0.002, 0.148), (-0.008, 0.15), (-0.02, 0.135), (-0.026, 0.0)], 18, 1.12, 0.96), hk, hat)
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
    obj('scarf', lathe(capsule(0.07, 0.07, 0.05), 12, 0.9, 1.1), C['scarf'], spine, (0.1, 0, SHOULDER + 0.04))
    for i, (y, ln) in enumerate(((-0.035, 0.22), (0.03, 0.18))):
        obj(f'scarf_end{i}', lathe(capsule(ln, 0.034, 0.03), 10, 0.45, 1.0), C['scarf'], spine, (0.215 * B - i * 0.012, y, SHOULDER - 0.02), (0, 0.1, 0))
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
btn_col = '#b9a36a' if C['buttons'] == 'brass' else '#14151a'
cols = (0.0, 0.05) if C['buttons'] == 'double' else (0.0,)
buttons = [] if skirt else [(obj(f'btn{i}{c}', lathe(capsule(0.002, 0.011, 0.011), 6), btn_col, root), i, c) for c in cols for i in range(4)]
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
            fold = 1 + 0.045 * f * math.sin(7 * ang + 1.3) + 0.02 * f * math.sin(13 * ang)
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
    br = math.sin(t * 1.7) * 0.8
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
    k = 0.42 + 0.22 * run
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
        s[0].location.z = SHOULDER - 0.05 + br * 0.004
    push = max(0.0, fa[0]) * 0.35 * w * U * stretch
    trail = max(0.0, -fb[0]) * 0.3 * w * U * stretch
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
    ANIMS += [('idle', C['idle'], lambda i, n: pose(t=i / n * BREATH)),
              ('talk', 8, lambda i, n: pose(t=i / n * GESTURE, talk=i / n * TAU)),
              ('turn', 3, lambda i, n: pose(yaw=math.radians(55 + 35 * i)))]
if C['walk'] and not C['lying']:
    ANIMS += [('walk', 16, lambda i, n: pose(i / n * TAU, 1, 0, t=i / n)),
              ('walkh', 16, lambda i, n: pose(i / n * TAU, 0.5, 0, t=i / n))]
if C['run']:
    ANIMS += [('run', 12, lambda i, n: pose(i / n * TAU, 1, 1, t=i / n))]
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
