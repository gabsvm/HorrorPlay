"""Shared Blender setup for the prop renders (props.py): an empty scene with the flat-colour material
(base colour darkened by ambient occlusion and by surfaces turning from the viewer, written untouched
through the Raw view), and the primitives the props are built from. 1 unit = 100 logical px.
"""
import math

import bmesh
import bpy

TAU, PI = math.tau, math.pi
MATS = {}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scn = bpy.context.scene
    scn.render.engine = 'BLENDER_EEVEE'
    scn.render.film_transparent = True
    scn.render.dither_intensity = 0
    scn.render.filter_size = 0.9
    scn.render.image_settings.file_format = 'PNG'
    scn.render.image_settings.color_mode = 'RGBA'
    scn.eevee.taa_render_samples = 24
    scn.view_settings.view_transform = 'Raw'
    scn.view_settings.look = 'None'
    scn.world = bpy.data.worlds.new('void')
    scn.world.color = (0, 0, 0)
    MATS.clear()
    build_group()
    return scn


def build_group():
    ng = bpy.data.node_groups.new('Out', 'ShaderNodeTree')
    ng.interface.new_socket('Color', in_out='INPUT', socket_type='NodeSocketColor')
    ng.interface.new_socket('Shader', in_out='OUTPUT', socket_type='NodeSocketShader')
    N, L = ng.nodes, ng.links
    gi, go = N.new('NodeGroupInput'), N.new('NodeGroupOutput')
    ao = N.new('ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = 0.25
    L.new(gi.outputs['Color'], ao.inputs['Color'])
    aok = N.new('ShaderNodeMapRange'); aok.inputs['To Min'].default_value = 0.35
    L.new(ao.outputs['AO'], aok.inputs['Value'])
    geo = N.new('ShaderNodeNewGeometry')
    vt = N.new('ShaderNodeVectorTransform'); vt.vector_type = 'NORMAL'; vt.convert_from = 'WORLD'; vt.convert_to = 'CAMERA'
    L.new(geo.outputs['Normal'], vt.inputs[0])
    sep = N.new('ShaderNodeSeparateXYZ'); L.new(vt.outputs[0], sep.inputs[0])
    pw = N.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.use_clamp = True; pw.inputs[1].default_value = 0.8
    L.new(sep.outputs['Z'], pw.inputs[0])
    rim = N.new('ShaderNodeMapRange'); rim.inputs['To Min'].default_value = 0.55
    L.new(pw.outputs[0], rim.inputs['Value'])
    # a soft key from above so tops read lighter than fronts, as in the painted rooms
    up = N.new('ShaderNodeMapRange'); up.inputs['From Min'].default_value = -1; up.inputs['To Min'].default_value = 0.8; up.inputs['To Max'].default_value = 1.12
    L.new(sep.outputs['Y'], up.inputs['Value'])
    m1 = N.new('ShaderNodeMath'); m1.operation = 'MULTIPLY'
    L.new(aok.outputs[0], m1.inputs[0]); L.new(rim.outputs[0], m1.inputs[1])
    m2 = N.new('ShaderNodeMath'); m2.operation = 'MULTIPLY'
    L.new(m1.outputs[0], m2.inputs[0]); L.new(up.outputs[0], m2.inputs[1])
    mul = N.new('ShaderNodeVectorMath'); mul.operation = 'MULTIPLY'
    L.new(gi.outputs['Color'], mul.inputs[0]); L.new(m2.outputs[0], mul.inputs[1])
    em = N.new('ShaderNodeEmission'); L.new(mul.outputs[0], em.inputs['Color'])
    L.new(em.outputs[0], go.inputs['Shader'])


def hexc(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1.0,)


def mat(color, glass=False):
    key = (color, glass)
    if key in MATS:
        return MATS[key]
    m = bpy.data.materials.new(color + ('g' if glass else ''))
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    g = nt.nodes.new('ShaderNodeGroup'); g.node_tree = bpy.data.node_groups['Out']
    g.inputs['Color'].default_value = hexc(color)
    o = nt.nodes.new('ShaderNodeOutputMaterial')
    if glass:
        # mostly see-through, a pale sheen where the glass turns away (a dome, a lamp chimney)
        tr = nt.nodes.new('ShaderNodeBsdfTransparent')
        lw = nt.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.35
        mx = nt.nodes.new('ShaderNodeMixShader')
        nt.links.new(lw.outputs['Facing'], mx.inputs[0])
        nt.links.new(tr.outputs[0], mx.inputs[1]); nt.links.new(g.outputs[0], mx.inputs[2])
        nt.links.new(mx.outputs[0], o.inputs['Surface'])
        m.surface_render_method = 'BLENDED'
    else:
        nt.links.new(g.outputs[0], o.inputs['Surface'])
    MATS[key] = m
    return m


def link(o):
    bpy.context.scene.collection.objects.link(o)
    return o


def mesh(name, verts, faces, color, loc=(0, 0, 0), rot=(0, 0, 0), smooth=True, glass=False, scale=(1, 1, 1)):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    if smooth:
        me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    me.materials.append(mat(color, glass))
    o = link(bpy.data.objects.new(name, me))
    o.location, o.rotation_euler, o.scale = loc, rot, scale
    return o


def lathe(name, prof, color, seg=16, loc=(0, 0, 0), rot=(0, 0, 0), sx=1.0, sy=1.0, glass=False, smooth=True):
    """Revolve a list of (z, r) round z; a ring of radius 0 is a pole."""
    verts, faces, rings = [], [], []
    for z, r in prof:
        if r <= 1e-6:
            rings.append([len(verts)]); verts.append((0.0, 0.0, z)); continue
        ids = []
        for j in range(seg):
            a = TAU * j / seg
            ids.append(len(verts)); verts.append((math.cos(a) * r * sx, math.sin(a) * r * sy, z))
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
    return mesh(name, verts, faces, color, loc, rot, smooth, glass)


def box(name, size, loc, color, bevel=0.01, rot=(0, 0, 0)):
    """A box of size (x, y, z) centred on loc, with softened edges."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]; v.co.y *= size[1]; v.co.z *= size[2]
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    me.materials.append(mat(color))
    o = link(bpy.data.objects.new(name, me))
    o.location, o.rotation_euler = loc, rot
    if bevel:
        b = o.modifiers.new('bevel', 'BEVEL'); b.width = bevel; b.segments = 2
    return o


def tube(name, pts, radius, color, closed=False, res=4):
    """A round bar through the points: iron bedsteads, chair backs, wire."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = radius
    cu.bevel_resolution = res
    cu.use_fill_caps = True
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for p, c in zip(sp.points, pts):
        p.co = (c[0], c[1], c[2], 1)
    sp.use_cyclic_u = closed
    cu.materials.append(mat(color))
    return link(bpy.data.objects.new(name, cu))


def arc(cx, cz, r, a0, a1, n=12, y=0.0):
    return [(cx + math.cos(a0 + (a1 - a0) * i / n) * r, y, cz + math.sin(a0 + (a1 - a0) * i / n) * r) for i in range(n + 1)]
