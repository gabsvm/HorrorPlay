"""Thomas Ashgrove as a 3D figure, rendered to sprite atlases for the game.

usage: blender -b --factory-startup -P tools/blender/thomas.py -- OUT_DIR [anim]

Builds the figure from simple solids (a lathe per part), poses it frame by frame with the same gait
as Actor.footAt / drawFigure in src/engine/actor.js, and renders every frame twice from a side
camera: once flat (base colour times ambient occlusion) and once as camera-space normals. The game
reduces the albedo to its pixel grid and lights it per pixel with the normals, like the scenery.
Writes OUT_DIR/albedo.png, OUT_DIR/normal.png (RG = normal x/y, B = lantern glass mask),
OUT_DIR/model.json and OUT_DIR/preview.png (a lit contact sheet for checking by eye).
"""
import bpy
import json
import math
import os
import sys

import numpy as np

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(ARGS[0] if ARGS else 'thomas-out')
ONLY = ARGS[1] if len(ARGS) > 1 else None
os.makedirs(os.path.join(OUT, 'frames'), exist_ok=True)

TAU = math.tau
PI = math.pi
H = 206                      # the character's height in logical px (Actor.h)
SC = H / 200                 # the figure is laid out in actor.js units, px at h = 200
U = 0.01                     # one of those px in Blender units: 1 unit = 100 px
YAW = math.radians(22)       # turned a little toward the viewer: a profile with volume
FW, FH, AX, AY = 200, 264, 100, 244   # frame size and the point between the feet, in logical px
STRIDE = 50


def hexc(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1.0,)


COL = {
    'coat': '#23262b', 'trousers': '#1a1b1e', 'boots': '#121110', 'skin': '#9c8470', 'hair': '#1a1410',
    'hat': '#121316', 'band': '#1c1a1a', 'gloves': '#2a221c', 'scarf': '#4a1612', 'eye': '#2a1e18',
    'metal': '#2a2622', 'glass': '#5a4628', 'lip': '#7a5e50', 'button': '#14151a',
}

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
try:
    scn.eevee.taa_render_samples = 16
except AttributeError:
    pass
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
# Every material ends in one shared group: Mode 0 emits the flat colour darkened by ambient occlusion,
# Mode 1 emits the camera-space normal (and the glass mask in blue). Raw view keeps the numbers.
ng = bpy.data.node_groups.new('Out', 'ShaderNodeTree')
ng.interface.new_socket('Color', in_out='INPUT', socket_type='NodeSocketColor')
ng.interface.new_socket('Mask', in_out='INPUT', socket_type='NodeSocketFloat')
ng.interface.new_socket('Shader', in_out='OUTPUT', socket_type='NodeSocketShader')
N, L = ng.nodes, ng.links
gi, go = N.new('NodeGroupInput'), N.new('NodeGroupOutput')
mode = N.new('ShaderNodeValue'); mode.name = 'mode'; mode.outputs[0].default_value = 0
ao = N.new('ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = 0.3
L.new(gi.outputs['Color'], ao.inputs['Color'])
aok = N.new('ShaderNodeMapRange'); aok.inputs['To Min'].default_value = 0.3
L.new(ao.outputs['AO'], aok.inputs['Value'])
geo = N.new('ShaderNodeNewGeometry')
vt = N.new('ShaderNodeVectorTransform'); vt.vector_type = 'NORMAL'; vt.convert_from = 'WORLD'; vt.convert_to = 'CAMERA'
L.new(geo.outputs['Normal'], vt.inputs[0])
sep = N.new('ShaderNodeSeparateXYZ'); L.new(vt.outputs[0], sep.inputs[0])
# surfaces turning away from the viewer darken, so the figure reads round under any lamp
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
for k, ax in ((0, 'X'), (1, 'Y')):
    m = N.new('ShaderNodeMath'); m.operation = 'MULTIPLY_ADD'
    m.inputs[1].default_value = 0.5; m.inputs[2].default_value = 0.5
    L.new(sep.outputs[ax], m.inputs[0]); L.new(m.outputs[0], comb.inputs[k])
L.new(gi.outputs['Mask'], comb.inputs[2])
e1 = N.new('ShaderNodeEmission'); L.new(comb.outputs[0], e1.inputs['Color'])
mix = N.new('ShaderNodeMixShader')
L.new(mode.outputs[0], mix.inputs[0]); L.new(e0.outputs[0], mix.inputs[1]); L.new(e1.outputs[0], mix.inputs[2])
L.new(mix.outputs[0], go.inputs['Shader'])

MATS = {}


def mat(name):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    if bpy.app.version < (5, 0, 0):
        m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    g = nt.nodes.new('ShaderNodeGroup'); g.node_tree = ng
    g.inputs['Color'].default_value = hexc(COL[name])
    g.inputs['Mask'].default_value = 1.0 if name == 'glass' else 0.0
    o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(g.outputs[0], o.inputs['Surface'])
    MATS[name] = m
    return m


# ------------------------------------------------------------------ geometry
def lathe(prof, seg=14, sx=1.0, sy=1.0, ripple=None):
    """Revolve a list of (z, r) round the z axis; a ring of radius 0 is a single pole vertex."""
    verts, faces, rings = [], [], []
    for z, r in prof:
        if r <= 1e-6:
            rings.append([len(verts)]); verts.append((0.0, 0.0, z))
            continue
        ids = []
        for j in range(seg):
            a = TAU * j / seg
            k = 1 + (ripple(a, z) if ripple else 0)
            ids.append(len(verts)); verts.append((math.cos(a) * r * sx * k, math.sin(a) * r * sy * k, z))
        rings.append(ids)
    for A, B in zip(rings, rings[1:]):
        if len(A) == 1 and len(B) == 1:
            continue
        if len(A) == 1:
            faces += [(A[0], B[j], B[(j + 1) % seg]) for j in range(seg)]
        elif len(B) == 1:
            faces += [(A[j], B[0], A[(j + 1) % seg]) for j in range(seg)]
        else:
            faces += [(A[j], B[j], B[(j + 1) % seg], A[(j + 1) % seg]) for j in range(seg)]
    return verts, faces


def capsule(L, r0, r1, k=4):
    """Profile of a tapered capsule hanging from z = 0 down to z = -L."""
    prof = [(r0 * math.cos((PI / 2) * i / k), r0 * math.sin((PI / 2) * i / k)) for i in range(k + 1)]
    prof += [(-L - r1 * math.sin((PI / 2) * i / k), r1 * math.cos((PI / 2) * i / k)) for i in range(k + 1)]
    return prof


def obj(name, vf, material, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), smooth=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata(vf[0], [], vf[1])
    me.update()
    if smooth:
        me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    me.materials.append(mat(material))
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


def limb(name, parent, L, r0, r1, material, seg=12, sy=1.0):
    return obj(name, lathe(capsule(L, r0, r1), seg, 1.0, sy), material, parent)


# ------------------------------------------------------------------ the figure
# Proportions from drawFigure: hip at 97 px, shoulders at 158, head at 180, at h = 200.
HIP_Z, SHOULDER = 0.97, 0.61          # pelvis height; shoulder line above the pelvis
THIGH, SHIN = 0.45, 0.46
root = empty('root', None)
root.scale = (SC, SC, SC)
pelvis = empty('pelvis', root, (0, 0, HIP_Z))
spine = empty('spine', pelvis)

legs = {}
for side, y in (('near', -0.085), ('far', 0.085)):
    hip = empty(f'hip_{side}', pelvis, (0, y, -0.02))
    limb(f'thigh_{side}', hip, THIGH, 0.078, 0.06, 'trousers')
    knee = empty(f'knee_{side}', hip, (0, 0, -THIGH))
    limb(f'shin_{side}', knee, SHIN, 0.058, 0.047, 'trousers')
    ankle = empty(f'ankle_{side}', knee, (0, 0, -SHIN))
    # a boot: shaft up the ankle, then the foot running forward
    obj(f'shaft_{side}', lathe(capsule(0.11, 0.046, 0.046), 12), 'boots', ankle, (0, 0, 0.1))
    boot = lathe([(0.0, 0.0), (0.012, 0.03), (0.04, 0.045), (0.12, 0.047), (0.2, 0.038), (0.235, 0.024), (0.245, 0.0)], 12, 1.0, 1.0)
    # laid along +x, flattened so the sole is level
    v = [(z - 0.06, y2 * 0.95, -x * 0.85 - 0.035) for x, y2, z in boot[0]]
    obj(f'boot_{side}', (v, boot[1]), 'boots', ankle)
    legs[side] = (hip, knee, ankle)

arms = {}
for side, y in (('near', -0.255), ('far', 0.255)):
    sh = empty(f'shoulder_{side}', spine, (-0.005, y, SHOULDER - 0.05))
    limb(f'upper_{side}', sh, 0.29, 0.068, 0.056, 'coat')
    el = empty(f'elbow_{side}', sh, (0, 0, -0.29))
    limb(f'fore_{side}', el, 0.25, 0.056, 0.05, 'coat')
    obj(f'cuff_{side}', lathe([(0.0, 0.053), (-0.03, 0.058), (-0.032, 0.0)], 12), 'coat', el, (0, 0, -0.24))
    wr = empty(f'wrist_{side}', el, (0, 0, -0.27))
    obj(f'hand_{side}', lathe(capsule(0.05, 0.03, 0.026), 10, 1.0, 0.75), 'gloves', wr, (0.005, 0, 0.0))
    arms[side] = (sh, el, wr)

# the lantern hangs from the near hand
lan = empty('lantern', arms['near'][2], (0.01, 0, -0.06))
lan.scale = (1.25, 1.25, 1.25)
obj('bail', lathe([(0.0, 0.004), (-0.05, 0.004)], 6), 'metal', lan)
obj('cap', lathe([(-0.045, 0.0), (-0.05, 0.02), (-0.07, 0.045), (-0.075, 0.048), (-0.078, 0.0)], 4, 1, 1), 'metal', lan, rot=(0, 0, PI / 4))
obj('glass', lathe([(-0.078, 0.04), (-0.165, 0.04)], 4), 'glass', lan, rot=(0, 0, PI / 4), smooth=False)
for i in range(4):
    a = PI / 4 + i * PI / 2
    obj(f'bar{i}', lathe([(-0.078, 0.006), (-0.165, 0.006)], 4), 'metal', lan, (math.cos(a) * 0.05, math.sin(a) * 0.05, 0))
obj('base', lathe([(-0.165, 0.052), (-0.185, 0.05), (-0.188, 0.0)], 4), 'metal', lan, rot=(0, 0, PI / 4))

# neck, head and the bowler
neck = empty('neck', spine, (0.03, 0, SHOULDER + 0.04))
limb('neckm', neck, 0.09, 0.045, 0.05, 'skin')
head = empty('head', neck, (0.035, 0, 0.16))
head.scale = (1.28, 1.28, 1.28)   # a stylised head: the face has to read at a hundred pixels
obj('skull', lathe(capsule(0.06, 0.098, 0.088), 16, 1.06, 0.9), 'skin', head, (0, 0, 0.055))
obj('jaw', lathe(capsule(0.04, 0.07, 0.05), 14, 1.0, 0.85), 'skin', head, (0.03, 0, -0.035))
obj('nose', lathe([(0.0, 0.0), (-0.004, 0.012), (-0.03, 0.016), (-0.036, 0.0)], 8), 'skin', head, (0.098, 0, 0.0), (0, -(PI / 2 - 0.3), 0))
obj('brow', lathe(capsule(0.06, 0.016, 0.016), 8), 'skin', head, (0.082, -0.03, 0.03), (PI / 2, 0, 0))
for s in (-1, 1):
    obj(f'ear{s}', lathe(capsule(0.03, 0.022, 0.018), 8, 1.0, 0.45), 'skin', head, (-0.01, s * 0.085, 0.02))
    obj(f'eye{s}', lathe(capsule(0.002, 0.012, 0.012), 8), 'eye', head, (0.085, s * 0.034, 0.012))
    obj(f'burn{s}', lathe(capsule(0.035, 0.013, 0.011), 8, 1.0, 0.5), 'hair', head, (0.03, s * 0.084, 0.01))
obj('hair', lathe(capsule(0.05, 0.09, 0.07), 14, 0.9, 0.9), 'hair', head, (-0.035, 0, 0.045))
obj('lips', lathe(capsule(0.03, 0.008, 0.008), 6), 'lip', head, (0.09, -0.015, -0.045), (PI / 2, 0, 0))
hat = empty('hat', head, (0.0, 0, 0.1))
hat.rotation_euler = (0, 0.12, 0)
hat.scale = (1.06, 1.06, 1.05)
obj('crown', lathe([(0.135, 0.0), (0.13, 0.05), (0.112, 0.088), (0.065, 0.11), (0.0, 0.112)], 18, 1.1, 0.95), 'hat', hat)
obj('band', lathe([(0.02, 0.114), (-0.005, 0.115)], 18, 1.1, 0.95), 'band', hat)
obj('brim', lathe([(-0.0, 0.112), (-0.01, 0.135), (0.002, 0.148), (-0.008, 0.15), (-0.02, 0.135), (-0.026, 0.0)], 18, 1.12, 0.96), 'hat', hat)
# the scarf shows in the gap of the turned-up collar
obj('scarf', lathe(capsule(0.07, 0.07, 0.05), 12, 0.9, 1.1), 'scarf', spine, (0.1, 0, SHOULDER + 0.04))
for i, (y, ln) in enumerate(((-0.035, 0.22), (0.03, 0.18))):
    obj(f'scarf_end{i}', lathe(capsule(ln, 0.034, 0.03), 10, 0.45, 1.0), 'scarf', spine, (0.215 - i * 0.012, y, SHOULDER - 0.02), (0, 0.1, 0))

# ------------------------------------------------------------------ the greatcoat
# Rings from the turned-up collar to the hem: (height above the pelvis, half width across, depth to the
# front, depth to the back, centre forward). Above the waist the coat turns with the spine; below the
# hips it swings with the stride and is pushed out wherever a leg would come through it.
RINGS = [
    (0.75, 0.072, 0.075, 0.075, 0.035), (0.69, 0.088, 0.09, 0.09, 0.03), (0.645, 0.16, 0.105, 0.1, 0.01),
    (0.6, 0.232, 0.125, 0.12, 0.0), (0.48, 0.225, 0.135, 0.13, 0.0), (0.28, 0.2, 0.125, 0.12, 0.0),
    (0.1, 0.183, 0.115, 0.115, 0.0), (-0.02, 0.2, 0.135, 0.13, 0.0), (-0.17, 0.228, 0.175, 0.17, 0.0),
    (-0.35, 0.25, 0.205, 0.21, 0.0), (-0.5, 0.268, 0.225, 0.232, 0.0), (-0.53, 0.272, 0.228, 0.236, 0.0),
    (-0.525, 0.255, 0.212, 0.22, 0.0),
]
# the game's figures read by their silhouette: a heavier coat than anatomy would give
RINGS = [(z, a * (1.12 if z > 0.3 else 1.06), bf * (1.42 if z > 0 else 1.3), bb * (1.38 if z > 0 else 1.3), cx) for z, a, bf, bb, cx in RINGS]
SEG = 28
coat_me = bpy.data.meshes.new('coat')
faces = []
for i in range(len(RINGS) - 1):
    for j in range(SEG):
        a, b = i * SEG + j, i * SEG + (j + 1) % SEG
        faces.append((a, a + SEG, b + SEG, b))
coat_me.from_pydata([(0, 0, 0)] * (len(RINGS) * SEG), [], faces)
coat_me.polygons.foreach_set('use_smooth', [True] * len(faces))
coat_me.materials.append(mat('coat'))
coat = bpy.data.objects.new('coat', coat_me)
coll.objects.link(coat)
coat.parent = root
# buttons down the front, on the coat surface (placed with it each frame)
buttons = [obj(f'btn{i}', lathe(capsule(0.002, 0.011, 0.011), 6), 'button', root) for i in range(4)]


def seg_closest(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, np.dot(p - a, ab) / max(1e-9, np.dot(ab, ab))))
    return a + ab * t


def build_coat(st):
    """Place every coat vertex for the current pose (all in root space, before the root's scale)."""
    px, pz, lean = st['px'], st['pz'], st['lean']
    cl, sl = math.cos(lean), math.sin(lean)
    sway, push, trail, run = st['sway'], st['push'], st['trail'], st['run']
    caps = st['caps']
    hem_z = RINGS[-2][0]
    co = []
    for zr, a, bf, bb, cx in RINGS:
        f = max(0.0, min(1.0, -zr / -hem_z)) if zr < 0 else 0.0     # 0 at the hips, 1 at the hem
        up = max(0.0, min(1.0, (zr - 0.0) / 0.12))                  # how much the ring turns with the spine
        for j in range(SEG):
            ang = TAU * j / SEG
            c, s = math.cos(ang), math.sin(ang)
            # a squarish section, deeper at the front
            k = 1 / max(1e-6, (abs(c) ** 2.6 + abs(s) ** 2.6) ** (1 / 2.6))
            fold = 1 + 0.045 * f * math.sin(7 * ang + 1.3) + 0.02 * f * math.sin(13 * ang)
            x = (bf if c > 0 else bb) * c * k * fold + cx
            y = a * s * k * fold
            # the skirt: dragged by the stride, pushed by the leading knee, trailing on the back leg
            if f > 0:
                x += f * (sway - run * 0.05) + (push * f if c > 0.2 else 0) - (trail * f if c < -0.2 else 0)
            z = zr
            # turn with the spine round the pelvis
            rx, rz = x * cl + z * sl, -x * sl + z * cl
            x, z = x + (rx - x) * up, z + (rz - z) * up
            p = np.array([x + px, y, z + pz])
            if f > 0:
                for a0, b0, rad in caps:
                    q = seg_closest(p, a0, b0)
                    d = p - q
                    dist = float(np.linalg.norm(d))
                    if dist < rad:
                        d[1] *= 0.6          # push out mostly forward and back, not sideways
                        p = q + d / max(1e-6, float(np.linalg.norm(d))) * rad
            co.append(p)
    flat = np.array(co, dtype=np.float32).ravel()
    coat_me.vertices.foreach_set('co', flat)
    coat_me.update()
    # buttons: on the front of the chest rings
    for i, b in enumerate(buttons):
        zr = 0.44 - i * 0.12
        x = 0.19 - 0.004 * i
        rx, rz = x * cl + zr * sl, -x * sl + zr * cl
        b.location = (rx + px + 0.005, -0.02, rz + pz)


# ------------------------------------------------------------------ posing
def foot_at(q, w, run):
    """Actor.footAt: x forward, y up, pitch (toe down positive), in px at h = 200."""
    S = STRIDE * w * (1 + 0.55 * run)
    lift = (15 + 24 * run) * w
    q = q % TAU
    if q < PI:
        u = q / PI
        return S / 2 - u * S, 0.0, 0.0
    u = (q - PI) / PI
    e = u * u * (3 - 2 * u)
    return -S / 2 + e * S, lift * math.sin(u * PI), -0.35 * math.sin(u * PI) + (0.15 if u > 0.8 else 0)


def two_bone(hx, hz, ax, az):
    """Thigh and knee angles (counter-clockwise seen from the camera) for an ankle target."""
    dx, dz = ax - hx, az - hz
    d = min(math.hypot(dx, dz), THIGH + SHIN - 1e-4)
    base = math.atan2(dx, -dz)
    a1 = math.acos(max(-1, min(1, (THIGH ** 2 + d * d - SHIN ** 2) / (2 * THIGH * d))))
    a2 = math.acos(max(-1, min(1, (THIGH ** 2 + SHIN ** 2 - d * d) / (2 * THIGH * SHIN))))
    thigh = base + a1                     # the knee bends forward
    return thigh, thigh - (PI - a2)


def ccw(o, a):
    o.rotation_euler = (0, -a, 0)


def pose(phase=0.0, w=0.0, run=0.0, t=0.0, yaw=YAW, breathe=None):
    root.rotation_euler = (0, 0, -yaw)
    stretch = 1 / max(0.2, math.cos(yaw))   # strides read at full length after the turn toward camera
    qa, qb = phase, phase + PI
    fa, fb = foot_at(qa, w, run), foot_at(qb, w, run)
    sw = fa[0] / (STRIDE / 2)
    br = math.sin(t * 1.7) * 0.8 if breathe is None else breathe
    bob = (2.6 * math.cos(2 * qa) * (1 - run) - 5 * abs(math.sin(qa)) * run + 2 * run) * w + br * 0.3
    pz = HIP_Z - bob * U
    lean_px = w * 5 + run * 12 * w
    lean = math.atan2(lean_px, 61)
    pelvis.location = (0, 0, pz)
    spine.rotation_euler = (0, lean, 0)
    caps = []
    for side, f, off in (('near', fa, 4), ('far', fb, -3)):
        hip, knee, ankle = legs[side]
        hx, hz = 0.0, pz - 0.02
        ax, az = (off + f[0]) * U * stretch, (6 + f[1]) * U
        th, sh = two_bone(hx, hz, ax, az)
        ccw(hip, th); ccw(knee, sh - th)
        ccw(ankle, -f[2] - sh)
        kx, kz = hx + math.sin(th) * THIGH, hz - math.cos(th) * THIGH
        y = hip.location.y
        caps.append((np.array([hx, y, hz]), np.array([kx, y, kz]), 0.1))
        caps.append((np.array([kx, y, kz]), np.array([ax, y, az]), 0.085))
    # arms: the free one swings against the near leg; the lantern arm holds it out and steadies it
    k = 0.42 + 0.22 * run
    far_a = sw * k * w
    near_a = 0.2 - sw * (0.07 + 0.2 * run) * w
    ccw(arms['far'][0], far_a); ccw(arms['far'][1], 0.18 + 0.3 * max(0, far_a) + run * 1.2)
    ccw(arms['near'][0], near_a); ccw(arms['near'][1], 0.35 + run * 0.7)
    # the lantern hangs plumb, lagging the swing of the arm a little
    lag = 0.12 * math.sin(qa) * w * (1 + 1.5 * run) + 0.03 * math.sin(t * 1.3)
    arm_world = near_a + 0.35 + run * 0.7 - lean
    ccw(lan, -arm_world + lag)
    # head steady against the bob, chin a touch down while walking
    ccw(neck, lean * 0.6 - 0.03 * w)
    ccw(head, -0.02 * math.sin(2 * qa) * w)
    # breathing lifts the shoulders
    for s in arms.values():
        s[0].location.z = SHOULDER - 0.05 + br * 0.004
    push = max(0.0, fa[0] + 4 - 4) * 0.35 * w * U * stretch
    trail = max(0.0, -(fb[0] - 3) - 3) * 0.3 * w * U * stretch
    sway = -sw * 5 * w * U
    build_coat({'px': 0.0, 'pz': pz, 'lean': lean, 'sway': sway, 'push': push, 'trail': trail, 'run': run, 'caps': caps})


# ------------------------------------------------------------------ animations
IDLE_T = TAU / 1.7               # one breath (Actor.drawFigure: sin(t * 1.7))
ANIMS = [
    ('idle', 12, lambda i, n: pose(0, 0, 0, t=i / n * IDLE_T)),
    ('walk', 16, lambda i, n: pose(i / n * TAU, 1, 0, t=i / n)),
    ('walkh', 16, lambda i, n: pose(i / n * TAU, 0.5, 0, t=i / n)),
    ('run', 12, lambda i, n: pose(i / n * TAU, 1, 1, t=i / n)),
    ('turn', 3, lambda i, n: pose(0, 0, 0, yaw=math.radians(55 + 35 * i), breathe=0)),
]
if ONLY:
    ANIMS = [a for a in ANIMS if a[0] in ONLY.split(',')]


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
        base = os.path.join(OUT, 'frames', f'{name}_{i:02d}')
        render(base + '_a.png', 0)
        render(base + '_n.png', 1)
        frames.append((name, i, base))
    print(f'rendered {name} x{n}', flush=True)

COLS = 10
rows = math.ceil(len(frames) / COLS)
alb = np.zeros((rows * FH, COLS * FW, 4), np.float32)
nor = np.zeros_like(alb)
meta = {'w': FW, 'h': FH, 'ax': AX, 'ay': AY, 'height': H, 'cols': COLS, 'anims': {}}
for k, (name, i, base) in enumerate(frames):
    r, c = divmod(k, COLS)
    alb[r * FH:(r + 1) * FH, c * FW:(c + 1) * FW] = load(base + '_a.png')
    nor[r * FH:(r + 1) * FH, c * FW:(c + 1) * FW] = load(base + '_n.png')
    meta['anims'].setdefault(name, [k, 0])[1] += 1
nor[..., 3] = alb[..., 3]
save(alb, os.path.join(OUT, 'albedo.png'))
save(nor, os.path.join(OUT, 'normal.png'))
json.dump(meta, open(os.path.join(OUT, 'model.json'), 'w'), indent=1)

# a contact sheet lit from the upper right by a warm lamp and from the left by a cold sky, for eyes only
n = nor[..., :3] * 2 - 1
nx, ny = n[..., 0], n[..., 1]
nz = np.sqrt(np.clip(1 - nx * nx - ny * ny, 0, 1))
key = np.clip(nx * 0.6 + ny * 0.5 + nz * 0.62, 0, 1)[..., None] * np.array([1.0, 0.78, 0.55])
fill = np.clip(-nx * 0.7 + ny * 0.2 + nz * 0.7, 0, 1)[..., None] * np.array([0.3, 0.38, 0.5])
lit = alb[..., :3] * (0.35 + 1.6 * key + 0.8 * fill)
glass = nor[..., 2:3] * alb[..., 3:4]
lit = lit * (1 - glass) + glass * np.array([1.0, 0.8, 0.5])
bg = np.array([0.16, 0.15, 0.14])
a = alb[..., 3:4]
prev = np.concatenate([np.clip(lit * a + bg * (1 - a), 0, 1), np.ones_like(a)], axis=2)
save(prev, os.path.join(OUT, 'preview.png'))
print('done', OUT, meta['anims'], flush=True)
