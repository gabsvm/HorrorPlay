"""El Huesped room photo: Thomas-method studio master (two boys, 1866).

Fork notes: the figure primitives below (lathe, capsule, obj, empty,
limb, ccw, shaded) are copied from web/art_review/thomas_v2/scripts/
build_master.py (NOT modified there) and adapted to a photo studio:
faceted low-segment solids, flat shading, no subsurf anywhere, faces in
the master's minimal language (block nose, dark eye dots, closed mouth
line, no eyeballs, no teeth, flat ears). Proportions are children
(elder ~7 heads, younger ~6, short necks, short limbs). Clothes are
working-class 1860s: short jacket with lapels and brass buttons, shirt
with collar, long trousers (elder) / knickers + stockings (younger),
boots, hair volume (no top hat, no long coat, no lantern, no scarf).

Run inside Blender 5.2 (Blender path via BLENDER env var or CLI
--blender, typical Windows install only as documented default):
  blender -b --python build_blend.py -- --out ../source/photo_studio_v2.blend

Builds collections STUDIO / ELDER / YOUNG / LIGHTS / CAMERA; the elder's
right arm grows from his shoulder onto the younger boy's shoulder with a
matching-radius elbow sphere and a faceted block hand overlapping the
shoulder cap (continuous, never floating). Camera is a slight-3/4
perspective (a two-sitter carte cannot use the master's full 3/4 yaw
without turning one face away; heads turn back to the lens). Light is
one soft warm lateral key with a low fill. Canvas, ageing and mount are
PIL work in compose_v2.py, never anatomy. All paths resolve relative to
this script; no personal paths.
"""
import argparse
import math
from pathlib import Path

import bpy
from mathutils import Vector

HERE = Path(__file__).resolve()
TASK_V2 = HERE.parent.parent

# Face direction: the camera sits at -Y looking +Y, so every "front"
# (face, shirt, toes) offset points -Y. (Blender 5.2 note:
# primitive_cone_add takes vertices=/radius1/radius2.)
FY = -1.0
TAU, PI = math.tau, math.pi


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for coll in (bpy.data.meshes, bpy.data.materials):
        for x in list(coll):
            try:
                coll.remove(x)
            except Exception:
                pass


def collection(name):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(c)
    return c


# ---- COPIED figure method (fork of thomas_v2/scripts/build_master.py) ----
# lathe/capsule/obj/empty/limb/ccw/shaded, adapted: fewer segments and
# rings (faceted children), flat shading, Principled photo-studio
# materials instead of the game-atlas Out group.

def lathe(prof, seg=10, sx=1.0, sy=1.0):
    """Revolve a list of (z, r) round the z axis; radius 0 = pole vertex."""
    verts, faces, rings = [], [], []
    for z, r in prof:
        if r <= 1e-6:
            rings.append([len(verts)])
            verts.append((0.0, 0.0, z))
            continue
        ids = []
        for j in range(seg):
            a = TAU * j / seg
            ids.append(len(verts))
            verts.append((math.cos(a) * r * sx, math.sin(a) * r * sy, z))
        rings.append(ids)
    for A, Bn in zip(rings, rings[1:]):
        if len(A) == 1 and len(Bn) == 1:
            continue
        if len(A) == 1:
            faces += [(A[0], Bn[j], Bn[(j + 1) % seg]) for j in range(seg)]
        elif len(Bn) == 1:
            faces += [(A[j], Bn[0], A[(j + 1) % seg]) for j in range(seg)]
        else:
            faces += [(A[j], Bn[j], Bn[(j + 1) % seg], A[(j + 1) % seg])
                      for j in range(seg)]
    return verts, faces


def capsule(L, r0, r1, k=3):
    """Profile of a tapered capsule hanging from z = 0 down to z = -L."""
    prof = [(r0 * math.cos((PI / 2) * i / k), r0 * math.sin((PI / 2) * i / k))
            for i in range(k + 1)]
    prof += [(-L - r1 * math.sin((PI / 2) * i / k),
              r1 * math.cos((PI / 2) * i / k)) for i in range(k + 1)]
    return prof


def hexc(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1.0,)


def shaded(h, k):
    r, g, b, _ = hexc(h)
    return '#' + ''.join(f'{min(255, round(v * k * 255)):02x}'
                         for v in (r, g, b))


def mat(name, rgb, rough=0.85, spec=0.2):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1.0)
    for key, val in (('Roughness', rough), ('Specular IOR Level', spec)):
        if key in bsdf.inputs:
            bsdf.inputs[key].default_value = val
    return m


def link(obj, coll):
    try:
        coll.objects.link(obj)
    except RuntimeError:
        pass
    for c in list(obj.users_collection):
        if c != coll:
            try:
                c.objects.unlink(obj)
            except RuntimeError:
                pass


def finish(obj, coll):
    link(obj, coll)
    obj.select_set(False)
    if obj.type == 'MESH':
        for p in obj.data.polygons:
            p.use_smooth = False
    return obj


def obj(name, vf, material, coll, loc=(0, 0, 0), rot=(0, 0, 0)):
    me = bpy.data.meshes.new(name)
    me.from_pydata(vf[0], [], vf[1])
    me.update()
    me.materials.append(material)
    o = bpy.data.objects.new(name, me)
    link(o, coll)
    o.location = loc
    o.rotation_euler = rot
    return finish(o, coll)


def empty(name, coll, loc=(0, 0, 0)):
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=loc)
    o = bpy.context.active_object
    o.name = name
    return finish(o, coll)


def limb(name, p1, p2, r, material, coll, tapered=1.0):
    p1, p2 = Vector(p1), Vector(p2)
    d = p2 - p1
    length = d.length
    mid = (p1 + p2) / 2
    if abs(tapered - 1.0) < 0.01:
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=r,
                                            depth=length, location=mid)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=r * tapered,
                                        radius2=r, depth=length, location=mid)
    o = bpy.context.active_object
    o.name = name
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(
        d.normalized())
    o.data.materials.append(material)
    return finish(o, coll)


def ccw(o, a):
    """Rotate in the picture plane (counter-clockwise as camera sees it)."""
    o.rotation_euler = (0, -a, 0)


def box(name, loc, size, rot, material, coll):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = (size[0] / 2.0, size[1] / 2.0, size[2] / 2.0)
    o.data.materials.append(material)
    return finish(o, coll)


def ball(name, loc, r, material, coll):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=5,
                                        location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = (r, r, r)
    o.data.materials.append(material)
    return finish(o, coll)


def parent_keep(child, par):
    child.parent = par
    child.matrix_parent_inverse = par.matrix_world.inverted()


def aim(obj, target):
    d = Vector(target) - Vector(obj.location)
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = d.to_track_quat('-Z', 'Y')


# ---- faces in the master's minimal language ----
# Block nose, dark eye dots (no eyeballs, no sclera, no shine), closed
# straight mouth line (no teeth, never open), thin lids, straight serious
# brows, small flat ears. Layering: each relief stands proud of the face
# so the albumen downsample keeps it.

def build_head(prefix, C, M, head_c, hr, hair_m, smile=0.0):
    skin = M['skin']
    # skull: faceted egg, slightly long; jaw: angular box chin
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=5,
                                         location=head_c)
    skull = bpy.context.active_object
    skull.name = prefix + '_skull'
    skull.scale = (hr * 0.86, hr * 0.90, hr * 1.02)
    skull.data.materials.append(skin)
    finish(skull, C)
    box(prefix + '_jaw', head_c + Vector((0, FY * hr * 0.42, -0.52 * hr)),
        (hr * 0.95, hr * 1.00, hr * 0.60), (0, 0, 0), skin, C)
    box(prefix + '_chin', head_c + Vector((0, FY * hr * 0.45, -0.82 * hr)),
        (hr * 0.44, hr * 0.40, hr * 0.22), (0, 0, 0),
        M['skin_shade'], C)
    for s in (-1, 1):
        ex = head_c.x + s * hr * 0.33
        # socket: dark bed flush on the jaw; eye: small dark dot proud
        box(prefix + '_socket%d' % s,
            Vector((ex, head_c.y + FY * hr * 0.925, head_c.z + hr * 0.02)),
            (hr * 0.32, hr * 0.030, hr * 0.22), (0, 0, 0),
            M['socket'], C)
        ball(prefix + '_eye%d' % s,
             Vector((ex, head_c.y + FY * hr * 0.945, head_c.z + hr * 0.01)),
             hr * 0.075, M['eye'], C)
        # lid: thin skin bar tucked above the socket; straight serious brow
        box(prefix + '_lid%d' % s,
            Vector((ex, head_c.y + FY * hr * 0.905, head_c.z + hr * 0.20)),
            (hr * 0.30, hr * 0.04, hr * 0.045), (0, 0, 0), skin, C)
        box(prefix + '_brow%d' % s,
            Vector((ex, head_c.y + FY * hr * 0.87, head_c.z + hr * 0.315)),
            (hr * 0.36, hr * 0.055, hr * 0.075), (0, 0, s * 0.04),
            M[hair_m], C)
        # small flat ear, outer face proud of the skull
        box(prefix + '_ear%d' % s,
            Vector((head_c.x + s * hr * 0.88,
                    head_c.y + FY * hr * 0.02, head_c.z - hr * 0.05)),
            (hr * 0.10, hr * 0.22, hr * 0.34), (0, 0, 0), skin, C)
    # nose: one block + small tip block (never a shiny ball)
    box(prefix + '_nose', Vector((head_c.x, head_c.y + FY * hr * 0.92,
                                  head_c.z - hr * 0.10)),
        (hr * 0.20, hr * 0.20, hr * 0.42), (0.10, 0, 0), skin, C)
    box(prefix + '_nosetip', Vector((head_c.x, head_c.y + FY * hr * 0.99,
                                     head_c.z - hr * 0.30)),
        (hr * 0.22, hr * 0.14, hr * 0.12), (0, 0, 0), skin, C)
    if smile <= 0.0:
        # elder: single straight closed line, proud of the jaw face
        box(prefix + '_mouth', Vector((head_c.x, head_c.y + FY * hr * 0.935,
                                       head_c.z - hr * 0.52)),
            (hr * 0.40, hr * 0.030, hr * 0.045), (0, 0, 0), M['mouth'], C)
    else:
        # younger: closed lips, one corner a breath higher (canon hint)
        box(prefix + '_mouth', Vector((head_c.x - hr * 0.03,
                                       head_c.y + FY * hr * 0.935,
                                       head_c.z - hr * 0.52)),
            (hr * 0.34, hr * 0.030, hr * 0.045), (0, 0, 0.03),
            M['mouth'], C)
        box(prefix + '_mouth_end',
            Vector((head_c.x + hr * 0.20, head_c.y + FY * hr * 0.933,
                    head_c.z - hr * 0.505)),
            (hr * 0.10, hr * 0.028, hr * 0.040), (0, 0, 0.22),
            M['mouth'], C)


def build_hair(prefix, C, M, head_c, hr, hair_m, style):
    """Hair with real volume but faceted: cap slab, back, side locks."""
    hm = M[hair_m]
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=5,
                                         location=head_c + Vector(
                                             (0, FY * hr * 0.08,
                                              hr * 0.62)))
    cap = bpy.context.active_object
    cap.name = prefix + '_haircap'
    cap.scale = (hr * 0.95, hr * 0.88, hr * 0.52)
    cap.data.materials.append(hm)
    finish(cap, C)
    box(prefix + '_hairback', head_c + Vector((0, FY * hr * 0.55,
                                               hr * 0.05)),
        (hr * 1.30, hr * 0.55, hr * 1.10), (0, 0, 0), hm, C)
    for s in (-1, 1):
        box(prefix + '_lock%d' % s,
            Vector((head_c.x + s * hr * 0.82, head_c.y + FY * hr * 0.10,
                    head_c.z - hr * 0.15)),
            (hr * 0.20, hr * 0.34, hr * 0.70), (0, 0, s * -0.06), hm, C)
    if style == 'sidepart':
        box(prefix + '_fringe', head_c + Vector((-hr * 0.08,
                                                  FY * hr * 0.60,
                                                  hr * 0.38)),
            (hr * 1.10, hr * 0.30, hr * 0.22), (0, 0, 0.10), hm, C)
        box(prefix + '_crown', head_c + Vector((hr * 0.28,
                                                FY * hr * 0.10,
                                                hr * 0.85)),
            (hr * 0.70, hr * 0.75, hr * 0.30), (0, 0, -0.08), hm, C)
    else:
        for i, fx in enumerate((-0.42, 0.0, 0.42)):
            box(prefix + '_tuft%d' % i,
                head_c + Vector((fx * hr, FY * hr * 0.58, hr * 0.36)),
                (hr * 0.34, hr * 0.30, hr * 0.26), (0, 0, fx * 0.15),
                hm, C)


def build_hand(prefix, C, M, wrist, direction):
    """Faceted block hand: palm slab, four finger slabs, thumb slab."""
    d = Vector(direction).normalized()
    side = Vector((-d.y, d.x, 0))
    if side.length < 1e-6:
        side = Vector((1, 0, 0))
    side = side.normalized()
    skin = M['skin']
    palm_c = Vector(wrist) + d * 0.030
    palm = box(prefix + '_palm', palm_c, (0.046, 0.026, 0.058), (0, 0, 0),
               skin, C)
    for i, off in enumerate((-0.018, -0.006, 0.006, 0.018)):
        base = palm_c + d * 0.028 + side * off + Vector((0, 0, 0.008))
        box(prefix + '_f%d' % i, base + d * 0.016 + Vector((0, 0, -0.010)),
            (0.011, 0.011, 0.042), (0.35, 0, 0), skin, C)
    tb = palm_c + side * 0.026 + Vector((0, 0.004, -0.006))
    box(prefix + '_thumb', tb + side * 0.012 + d * 0.008,
        (0.024, 0.012, 0.030), (0, 0, 0), skin, C)
    return palm


ELDER_OPT = dict(build='elder', height=1.28, jacket='ejacket',
                 shirt='eshirt', buttons='brass', hair_m='ehair',
                 hairstyle='sidepart', smile=0.0)
YOUNG_OPT = dict(build='younger', height=1.05, jacket='yjacket',
                 shirt='yshirt', buttons='brass', hair_m='yhair',
                 hairstyle='tufts', smile=1.0)


def build_boy(prefix, C, M, x0, opt, reach_target=None):
    """Full boy standing at x0 (feet on z=0, facing -Y). Returns pivots."""
    H = opt['height']
    # child head units: elder ~7 heads, younger ~6
    u = H / 7.0 if opt['build'] == 'elder' else H / 6.0
    hr = u / 2.0
    jacket, shirt = opt['jacket'], opt['shirt']
    P = {}
    hip_z = H * 0.50
    sh_z = H * 0.795
    neck_z = H * 0.825
    head_c = Vector((x0, 0.0, H - hr * 1.10))
    half_hip = H * (0.072 if opt['build'] == 'elder' else 0.082)
    # pelvis + short jacket body: tapered faceted cone, hem above crotch
    limb(prefix + '_jacket', (x0, 0, sh_z + 0.01), (x0, 0, hip_z - 0.02),
         H * 0.105, M[jacket], C, tapered=0.72)
    box(prefix + '_pelvis', Vector((x0, 0, hip_z - 0.02)),
        (half_hip * 2.2, 0.19, 0.15), (0, 0, 0), M[jacket], C)
    # sloped shoulder bar + sunk caps (one smooth mass, never ball joints)
    w_sh = H * (0.115 if opt['build'] == 'elder' else 0.108)
    for s in (-1, 1):
        box(prefix + '_shoulder%d' % s,
            Vector((x0 + s * w_sh * 0.38, 0, sh_z - 0.020)),
            (w_sh * 0.70, 0.14, 0.070), (0, s * 0.10, 0), M[jacket], C)
        box(prefix + '_shcap%d' % s,
            Vector((x0 + s * w_sh * 0.78, 0, sh_z - 0.030)),
            (0.066, 0.095, 0.075), (0, s * 0.08, 0), M[jacket], C)
    # shirt front, chin-derived collar, lapels, brass buttons: each layer
    # stands proud of the previous one (flat shirt < lapels < collar).
    box(prefix + '_shirt', Vector((x0, FY * 0.105, (sh_z + hip_z) / 2)),
        (H * 0.060, 0.030, sh_z - hip_z - 0.05), (0, 0, 0), M[shirt], C)
    for s in (-1, 1):
        box(prefix + '_lapel%d' % s,
            Vector((x0 + s * H * 0.050, FY * 0.118, sh_z - H * 0.10)),
            (H * 0.042, 0.020, H * 0.125), (0.06, 0, s * -0.26),
            M[jacket], C)
        chin_b = head_c.z - hr
        box(prefix + '_collar%d' % s,
            Vector((x0 + s * H * 0.026, FY * 0.100, chin_b - 0.048)),
            (H * 0.020, 0.040, 0.036), (0, 0, s * 0.14), M[shirt], C)
    for i in range(3):
        ball(prefix + '_btn%d' % i,
             Vector((x0 + H * 0.030, FY * 0.125,
                     sh_z - H * (0.10 + 0.072 * i))),
             0.0105, M[opt['buttons']], C)
    # trapezius wedges + thick short neck running UP INTO the skull
    for s in (-1, 1):
        box(prefix + '_trap%d' % s, Vector((x0 + s * 0.062, 0.004,
                                            sh_z + 0.002)),
            (0.110, 0.070, 0.060), (0, s * -0.18, 0), M[jacket], C)
    limb(prefix + '_neck', (x0, 0, sh_z - 0.015),
         (x0, 0, head_c.z - 0.30 * hr), 0.048, M['skin'], C)
    P['head'] = empty(prefix + '_HEAD', C, Vector((x0, 0, neck_z)))
    build_head(prefix, C, M, head_c, hr, opt['hair_m'],
               smile=opt.get('smile', 0.0))
    build_hair(prefix, C, M, head_c, hr, opt['hair_m'], opt['hairstyle'])
    head_tags = ('skull', 'jaw', 'chin', 'socket', 'eye', 'lid', 'brow',
                 'ear', 'nose', 'nosetip', 'mouth', 'haircap', 'hairback',
                 'lock', 'fringe', 'crown', 'tuft')
    for o in list(C.objects):
        if o.name.startswith(prefix + '_') and any(
                t in o.name for t in head_tags):
            parent_keep(o, P['head'])
    P['head_c'] = head_c
    P['hr'] = hr
    P['H'] = H
    P['x0'] = x0
    P['sh_z'] = sh_z
    P['w_sh'] = w_sh
    P['neck_z'] = neck_z
    # arms: single-piece hanging sleeves (no segmentation, nothing to
    # ring); the elder right arm bends once with a matching-radius elbow
    # sphere onto the younger shoulder, palm overlapping the shoulder cap.
    P['reach'] = reach_target is not None
    for s in (-1, 1):
        sh = Vector((x0 + s * w_sh * 0.96, 0, sh_z - 0.028))
        if P['reach'] and s == 1:
            P['sho_R'] = empty(prefix + '_SHO_R', C, sh)
            palm_goal = Vector(reach_target) + Vector((0, FY * 0.015,
                                                       0.040))
            d = Vector((0.22, FY * 0.28, -0.94)).normalized()
            wrist = palm_goal - d * 0.030
            el = (sh + wrist) / 2 + Vector((0.030, FY * 0.020, 0.030))
            P['elb_R'] = empty(prefix + '_ELB_R', C, el)
            parent_keep(P['elb_R'], P['sho_R'])
            up_dir = (el - sh).normalized()
            up = limb(prefix + '_sleeveR_up', sh + Vector((0, 0, -0.015)),
                      el + up_dir * 0.028, 0.047, M[jacket], C,
                      tapered=0.94)
            parent_keep(up, P['sho_R'])
            elball = ball(prefix + '_elbowR', el, 0.044, M[jacket], C)
            parent_keep(elball, P['elb_R'])
            fo_dir = (wrist - el).normalized()
            fo = limb(prefix + '_sleeveR_fo', el - fo_dir * 0.028, wrist,
                      0.044, M[jacket], C, tapered=0.92)
            parent_keep(fo, P['elb_R'])
            box(prefix + '_cuffR', wrist - fo_dir * 0.008,
                (0.048, 0.082, 0.082), (0, 0, 0), M[shirt], C)
            parent_keep(C.objects[prefix + '_cuffR'], P['elb_R'])
            palm = build_hand(prefix + '_handR', C, M, wrist, d)
            for o in list(C.objects):
                if o.name.startswith(prefix + '_handR'):
                    parent_keep(o, P['elb_R'])
            P['wrist_R'] = wrist
        else:
            wr = sh + Vector((s * 0.022, 0.015, -0.30))
            limb(prefix + '_sleeve%d' % s, sh + Vector((0, 0, -0.015)),
                 wr, 0.046, M[jacket], C, tapered=0.84)
            box(prefix + '_cuff%d' % s, wr + Vector((0, 0.004, -0.010)),
                (0.046, 0.078, 0.075), (0, 0, 0), M[shirt], C)
            build_hand(prefix + '_hand%d' % s, C, M,
                       wr + Vector((0, 0.008, -0.022)),
                       (s * 0.10, 0.05, -1.0))
    # legs: single radius through the bend with a matching knee sphere;
    # elder long trousers, younger knickers + stockings.
    for s in (-1, 1):
        lx = x0 + s * half_hip * 0.85
        knee = Vector((lx, 0.004, H * 0.27))
        ankle = Vector((lx, 0.008, 0.065))
        if opt['build'] == 'elder':
            limb(prefix + '_thigh%d' % s, (lx, 0, hip_z - 0.05),
                 knee + Vector((0, 0, 0.045)), 0.058, M['trousers'], C)
            ball(prefix + '_knee%d' % s, knee + Vector((0, 0, 0.028)),
                 0.056, M['trousers'], C)
            limb(prefix + '_shin%d' % s, knee, ankle, 0.054,
                 M['trousers'], C, tapered=0.92)
        else:
            limb(prefix + '_thigh%d' % s, (lx, 0, hip_z - 0.05),
                 knee + Vector((0, 0, 0.070)), 0.064, M['trousers'], C)
            ball(prefix + '_knee%d' % s, knee + Vector((0, 0, 0.028)),
                 0.054, M['trousers'], C)
            limb(prefix + '_stock%d' % s, knee, ankle, 0.037,
                 M['stockings'], C)
        box(prefix + '_boot%d' % s, ankle + Vector((0, FY * 0.030,
                                                     -0.032)),
            (0.080, 0.185, 0.065), (0, 0, 0), M['boots'], C)
        box(prefix + '_toe%d' % s, ankle + Vector((0, FY * 0.115,
                                                   -0.042)),
            (0.075, 0.075, 0.055), (0, 0, 0), M['boots'], C)
    return P


def build_all():
    CE = collection('ELDER')
    CY = collection('YOUNG')
    CL = collection('LIGHTS')
    CC = collection('CAMERA')
    CS = collection('STUDIO')
    M = {
        # Thomas V2 skin/eye palette: muted skin, very dark eye dots
        'skin': mat('skin', (0.653, 0.541, 0.435), rough=0.7, spec=0.3),
        'skin_shade': mat('skin_shade', (0.52, 0.42, 0.33), rough=0.8,
                          spec=0.2),
        'socket': mat('socket', (0.30, 0.235, 0.18), rough=0.85, spec=0.15),
        'eye': mat('eye', (0.141, 0.102, 0.078), rough=0.4, spec=0.5),
        'mouth': mat('mouth', (0.29, 0.18, 0.14), rough=0.6, spec=0.3),
        'ejacket': mat('ejacket', (0.20, 0.21, 0.23), rough=0.92,
                       spec=0.1),
        'yjacket': mat('yjacket', (0.24, 0.21, 0.165), rough=0.92,
                       spec=0.1),
        'eshirt': mat('eshirt', (0.72, 0.66, 0.55), rough=0.9, spec=0.1),
        'yshirt': mat('yshirt', (0.74, 0.68, 0.57), rough=0.9, spec=0.1),
        'brass': mat('brass', (0.45, 0.33, 0.15), rough=0.45, spec=0.6),
        'trousers': mat('trousers', (0.145, 0.14, 0.15), rough=0.92,
                        spec=0.1),
        'stockings': mat('stockings', (0.60, 0.53, 0.42), rough=0.9,
                         spec=0.1),
        'boots': mat('boots', (0.09, 0.075, 0.06), rough=0.55, spec=0.4),
        'ehair': mat('ehair', (0.13, 0.10, 0.075), rough=0.75, spec=0.3),
        'yhair': mat('yhair', (0.19, 0.14, 0.095), rough=0.75, spec=0.3),
    }
    # younger first: the elder reach hand lands on his shoulder landmark.
    Y = build_boy('Y', CY, M, 0.31, YOUNG_OPT)
    reach = (Y['x0'] - Y['w_sh'] * 0.55, -0.10, Y['sh_z'])
    E = build_boy('E', CE, M, -0.31, ELDER_OPT, reach_target=reach)
    bpy.context.scene['v2_elder_x0'] = -0.31
    bpy.context.scene['v2_young_x0'] = 0.31
    bpy.context.scene['v2_E_hr'] = E['hr']
    bpy.context.scene['v2_Y_hr'] = Y['hr']
    # one soft warm lateral key + low cool fill + gentle frontal.
    bpy.ops.object.light_add(type='AREA', location=(-1.8, -1.8, 2.1))
    key = bpy.context.active_object
    key.name = 'KEY'
    key.data.energy = 140.0
    key.data.size = 2.4
    key.data.color = (1.0, 0.88, 0.74)
    aim(key, (-0.1, 0, 1.0))
    finish(key, CL)
    bpy.ops.object.light_add(type='AREA', location=(1.9, -1.5, 1.2))
    fill = bpy.context.active_object
    fill.name = 'FILL'
    fill.data.energy = 32.0
    fill.data.size = 2.8
    fill.data.color = (0.82, 0.86, 0.92)
    aim(fill, (0.1, 0, 0.9))
    finish(fill, CL)
    bpy.ops.object.light_add(type='AREA', location=(0.0, -2.3, 1.35))
    face = bpy.context.active_object
    face.name = 'FACE'
    face.data.energy = 30.0
    face.data.size = 3.0
    face.data.color = (1.0, 0.95, 0.88)
    aim(face, (0, 0, 1.0))
    finish(face, CL)
    bpy.ops.object.light_add(type='SPOT', location=(0.4, 1.7, 2.4))
    rim = bpy.context.active_object
    rim.name = 'RIM'
    rim.data.energy = 80.0
    rim.data.color = (1.0, 0.95, 0.88)
    rim.data.spot_size = 0.7
    aim(rim, (-0.2, 0, 1.2))
    finish(rim, CL)
    # slight-3/4 perspective (studio three-quarter adapted to two
    # sitters): faces turn back to the lens via head pivots at render.
    bpy.ops.object.camera_add(location=(0.85, -3.5, 1.12),
                              rotation=(math.pi / 2, 0, 0))
    cam = bpy.context.active_object
    cam.name = 'PHOTO_CAM'
    cam.data.type = 'PERSP'
    cam.data.lens = 85
    aim(cam, (-0.02, 0, 0.92))
    finish(cam, CC)
    bpy.context.scene.camera = cam
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new('studio_world')
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg is not None:
        bg.inputs['Color'].default_value = (0.035, 0.032, 0.030, 1.0)
        bg.inputs['Strength'].default_value = 0.3
    sc = bpy.context.scene
    try:
        sc.render.engine = 'BLENDER_EEVEE_NEXT'
    except Exception:
        sc.render.engine = 'BLENDER_EEVEE'
    try:
        sc.eevee.taa_render_samples = 64
    except Exception:
        pass
    sc.render.film_transparent = True
    sc.render.resolution_x = 1100
    sc.render.resolution_y = 1300
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    return E, Y


def main():
    import sys
    args = [a for a in sys.argv[sys.argv.index('--') + 1:]] \
        if '--' in sys.argv else []
    out = Path(args[args.index('--out') + 1]) if '--out' in args \
        else TASK_V2 / 'source' / 'photo_studio_v2.blend'
    clear_scene()
    build_all()
    out.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(out))
    print('WROTE blend', out)


main()
