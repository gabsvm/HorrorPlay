"""Hanbury yard hero props for T4: roller mangle, dolly tub, tap + sink, privy door.

Run from the repository root:
  blender -b --factory-startup -P web/art_review/hanbury_yard/scripts/build_hanbury_props.py

Outputs: ../source/hanbury_props.blend and one transparent PNG per prop in
../renders/. Does not modify the game or its production sprites.

Adapted for Blender 5.2 (scripts of previous passes targeted 4.2): the
Principled BSDF socket names used here ('Base Color', 'Metallic',
'Roughness') still exist in 5.2, and the colour management setup is applied
defensively (falls back silently when a look is missing).

T4b tone fix (auditor rejected T4 as near-white): soaked near-black wood,
soot-dark stone, wet-grey linen, tarnished brass, dim rig (world 0.25,
areas ~45/28/35, look None) like the T3b jar remedy. Geometry and framing
unchanged; only albedo/roughness/lights plus thin algae skirting at the
privy base. The pack script applies the final value multiplier.
"""
from pathlib import Path
import math
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
(RENDERS := ROOT / "renders").mkdir(parents=True, exist_ok=True)
(SOURCE := ROOT / "source").mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def mat(name, rgb, rough=0.85, metal=0.0, noise=0.0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*rgb, 1)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if noise:
        n = m.node_tree.nodes.new("ShaderNodeTexNoise")
        n.inputs["Scale"].default_value = 43
        try:
            n.inputs["Detail"].default_value = 3
        except Exception:
            pass
        b = m.node_tree.nodes.new("ShaderNodeBump")
        b.inputs["Strength"].default_value = noise
        b.inputs["Distance"].default_value = 0.03
        m.node_tree.links.new(n.outputs["Fac"], b.inputs["Height"])
        m.node_tree.links.new(b.outputs["Normal"], p.inputs["Normal"])
    return m


wood_dark = mat("Madera empapada", (0.060, 0.043, 0.030), 0.96, noise=0.35)
wood_mid = mat("Tablon de tina sucio", (0.100, 0.070, 0.045), 0.96, noise=0.4)
roller = mat("Rodillo manchado", (0.110, 0.085, 0.060), 0.92, noise=0.25)
linen = mat("Ropa mojada gris", (0.130, 0.125, 0.110), 1.0, noise=0.3)
iron = mat("Hierro ennegrecido", (0.100, 0.105, 0.110), 0.60, metal=0.8)
iron_edge = mat("Arista de hierro", (0.160, 0.160, 0.155), 0.55, metal=0.7)
brass = mat("Laton deslustrado", (0.200, 0.140, 0.060), 0.60, metal=0.9)
stone = mat("Piedra ennegrecida", (0.110, 0.105, 0.100), 0.98, noise=0.4)
stone_dark = mat("Piedra mojada", (0.075, 0.070, 0.068), 1.0, noise=0.4)
water = mat("Agua estancada", (0.08, 0.10, 0.11), 0.12, metal=0.1)
hole = mat("Hueco oscuro", (0.02, 0.02, 0.02), 1.0)
privy_wood = mat("Tabla de retrete", (0.085, 0.060, 0.038), 0.97, noise=0.42)
privy_dark = mat("Tabla en sombra", (0.055, 0.040, 0.027), 0.98, noise=0.4)
moss = mat("Verdin de base", (0.060, 0.075, 0.045), 1.0, noise=0.45)


def box(name, at, scale, material, bevel=0.008, collection=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    ob = bpy.context.object
    ob.name = name
    ob.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ob.data.materials.append(material)
    if bevel:
        mod = ob.modifiers.new("Weathered corners", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        ob.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    if collection is not None:
        collection.append(ob)
    return ob


def cyl(name, at, r, depth, material, verts=20):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r,
                                        depth=depth, location=at)
    ob = bpy.context.object
    ob.name = name
    ob.data.materials.append(material)
    for polygon in ob.data.polygons:
        polygon.use_smooth = True
    return ob


def torus(name, at, major, minor, material, rx=0.0, major_seg=28, minor_seg=10):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor,
                                     major_segments=major_seg,
                                     minor_segments=minor_seg,
                                     location=at, rotation=(rx, 0, 0))
    ob = bpy.context.object
    ob.name = name
    ob.data.materials.append(material)
    for polygon in ob.data.polygons:
        polygon.use_smooth = True
    return ob


def ball(name, at, r, material, squash=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=7,
                                         radius=r, location=at)
    ob = bpy.context.object
    ob.name = name
    ob.scale = squash
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ob.data.materials.append(material)
    return ob


# ---------------------------------------------------------------- mangle (x = 0)
# Box-mangle silhouette: two end frames, top beam, two pale rollers (the
# readable bands at night), iron screws and a big side wheel with a crank.
M = []
M.append(box("Mangle pata izq", (-0.42, 0, 0.45), (0.11, 0.34, 0.9), wood_dark, collection=M))
M.append(box("Mangle pata der", (0.42, 0, 0.45), (0.11, 0.34, 0.9), wood_dark, collection=M))
M.append(box("Mangle travesano", (0, 0, 0.92), (1.0, 0.36, 0.12), wood_dark, collection=M))
M.append(box("Mangle larguero bajo", (0, 0, 0.12), (0.95, 0.30, 0.10), wood_dark, collection=M))
for i, z in enumerate((0.52, 0.70)):
    r = cyl("Mangle rodillo " + str(i), (0, 0.02, z), 0.095, 0.72, roller)
    r.rotation_euler[1] = math.pi / 2
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    M.append(r)
M.append(box("Mangle caja izq", (-0.42, 0.02, 0.61), (0.14, 0.38, 0.42), wood_mid, collection=M))
M.append(box("Mangle caja der", (0.42, 0.02, 0.61), (0.14, 0.38, 0.42), wood_mid, collection=M))
for x in (-0.30, 0.30):
    M.append(cyl("Mangle tornillo", (x, 0.02, 1.02), 0.028, 0.22, iron))
M.append(box("Mangle manija", (0, 0.02, 1.13), (0.72, 0.06, 0.06), wood_dark, collection=M))
wheel = torus("Mangle volante", (0.58, 0, 0.55), 0.24, 0.028, iron_edge)
M.append(wheel)
for a in (0.0, math.pi / 2):
    sp = box("Mangle radio", (0.58, 0, 0.55), (0.44, 0.03, 0.035), iron)
    sp.rotation_euler[0] = a
    M.append(sp)
M.append(cyl("Mangle eje", (0.52, 0, 0.55), 0.035, 0.22, iron))
crank = box("Mangle ciguena", (0.58, -0.20, 0.36), (0.035, 0.035, 0.30), wood_mid)
crank.rotation_euler[1] = 0.5
M.append(crank)
M.append(box("Mangle empuñadura", (0.65, -0.20, 0.28), (0.05, 0.05, 0.14), wood_dark, collection=M))

# ---------------------------------------------------------------- dolly tub (x = 4)
# Tapered stave tub with iron hoops, dark water, a draped sheet (pale cue)
# and a corrugated washboard leaning on the right.
T = []
OX = 4.0
bpy.ops.mesh.primitive_cone_add(vertices=18, radius1=0.30, radius2=0.38,
                                depth=0.52, location=(OX, 0, 0.30))
tub = bpy.context.object
tub.name = "Tina de lavar"
tub.data.materials.append(wood_mid)
bevel = tub.modifiers.new("Weathered corners", "BEVEL")
bevel.width = 0.012
bevel.segments = 2
T.append(tub)
T.append(torus("Tina aro bajo", (OX, 0, 0.12), 0.315, 0.016, iron))
T.append(torus("Tina aro alto", (OX, 0, 0.46), 0.365, 0.016, iron))
lid = cyl("Tina agua", (OX, 0, 0.545), 0.335, 0.015, water, verts=18)
T.append(lid)
glint = box("Tina brillo", (OX - 0.10, -0.30, 0.555), (0.22, 0.012, 0.008), linen)
glint.rotation_euler[2] = 0.25
T.append(glint)
sheet = box("Tina sabana doblada", (OX - 0.30, 0, 0.60), (0.30, 0.42, 0.09), linen)
T.append(sheet)
hang = box("Tina sabana colgando", (OX - 0.30, -0.20, 0.42), (0.28, 0.05, 0.32), linen)
T.append(hang)
board = box("Tabla de lavar", (OX + 0.52, 0, 0.42), (0.30, 0.05, 0.85), wood_mid)
board.rotation_euler[1] = -0.38
T.append(board)
for i in range(6):
    slat = box("Tabla acanalada " + str(i), (OX + 0.52, -0.035, 0.14 + i * 0.115),
               (0.26, 0.02, 0.055), roller if i % 2 else linen)
    slat.rotation_euler[1] = -0.38
    T.append(slat)

# ---------------------------------------------------------------- tap + stone sink (x = 8)
# Stone trough on legs, vertical iron pipe with elbow, brass tap body and a
# cross handle: the brass cross is the glint the eye finds at night.
S = []
SX = 8.0
S.append(box("Fregadero seno", (SX, 0, 0.42), (1.05, 0.55, 0.42), stone, collection=S))
S.append(box("Fregadero borde", (SX, 0, 0.65), (1.15, 0.65, 0.09), stone_dark, collection=S))
S.append(box("Fregadero agua", (SX, 0, 0.63), (0.95, 0.45, 0.03), water, collection=S))
S.append(box("Fregadero pata izq", (SX - 0.40, 0, 0.10), (0.14, 0.45, 0.20), stone_dark, collection=S))
S.append(box("Fregadero pata der", (SX + 0.40, 0, 0.10), (0.14, 0.45, 0.20), stone_dark, collection=S))
S.append(cyl("Tubo vertical", (SX + 0.18, 0.10, 1.10), 0.045, 1.10, iron))
S.append(box("Tubo placa", (SX + 0.18, 0.10, 1.62), (0.16, 0.05, 0.10), iron, collection=S))
arm = cyl("Tubo brazo", (SX + 0.18, -0.08, 1.60), 0.04, 0.40, iron)
arm.rotation_euler[0] = math.pi / 2
bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
S.append(arm)
S.append(cyl("Tubo pico", (SX + 0.18, -0.27, 1.50), 0.032, 0.22, iron))
S.append(cyl("Grifo cuerpo", (SX + 0.18, -0.27, 1.36), 0.05, 0.12, brass))
S.append(box("Grifo cruz A", (SX + 0.18, -0.27, 1.28), (0.20, 0.045, 0.045), brass, collection=S))
S.append(box("Grifo cruz B", (SX + 0.18, -0.27, 1.28), (0.045, 0.045, 0.20), brass, collection=S))
S.append(cyl("Grifo vastago", (SX + 0.18, -0.27, 1.30), 0.022, 0.10, brass))

# ---------------------------------------------------------------- privy front (x = 12)
# Weatherboard hut front with a pent roof, a ledged door and a crisp dark
# heart cut out of the upper panel, plus strap hinges and a knob.
P = []
PX = 12.0
P.append(box("Retrete lateral izq", (PX - 0.62, 0, 1.10), (0.16, 0.70, 2.20), privy_dark, collection=P))
P.append(box("Retrete lateral der", (PX + 0.62, 0, 1.10), (0.16, 0.70, 2.20), privy_dark, collection=P))
for i in range(6):
    shade = privy_wood if i % 2 else privy_dark
    P.append(box("Retrete tabla " + str(i), (PX - 0.62, -0.36, 0.25 + i * 0.36),
                 (0.10, 0.03, 0.32), shade, collection=P))
    P.append(box("Retrete tabla d" + str(i), (PX + 0.62, -0.36, 0.25 + i * 0.36),
                 (0.10, 0.03, 0.32), shade, collection=P))
roof = box("Retrete techo", (PX, -0.05, 2.32), (1.70, 1.00, 0.09), wood_dark)
roof.rotation_euler[0] = 0.22
P.append(roof)
P.append(box("Retrete alero", (PX, -0.50, 2.20), (1.74, 0.10, 0.07), privy_dark, collection=P))
P.append(box("Retrete jamba izq", (PX - 0.42, -0.30, 1.00), (0.12, 0.14, 2.00), wood_dark, collection=P))
P.append(box("Retrete jamba der", (PX + 0.42, -0.30, 1.00), (0.12, 0.14, 2.00), wood_dark, collection=P))
P.append(box("Retrete dintel", (PX, -0.30, 2.02), (0.96, 0.14, 0.12), wood_dark, collection=P))
P.append(box("Retrete puerta", (PX, -0.32, 1.00), (0.72, 0.07, 1.94), privy_wood, collection=P))
for i, z in enumerate((0.35, 1.00, 1.65)):
    P.append(box("Retrete travesaño " + str(i), (PX, -0.37, z),
                 (0.76, 0.04, 0.16), wood_dark, collection=P))
for i, z in enumerate((0.55, 1.45)):
    P.append(box("Retrete bisagra " + str(i), (PX - 0.30, -0.39, z),
                 (0.22, 0.03, 0.06), iron, collection=P))
P.append(ball("Retrete pomo", (PX + 0.24, -0.38, 1.00), 0.045, iron_edge))
# Heart cut: two lobes plus an inverted point, matte black, proud of the door
# by a centimetre so it reads as a cut at game scale.
P.append(ball("Corazon lobo izq", (PX - 0.07, -0.375, 1.62), 0.062, hole, squash=(1, 0.5, 1)))
P.append(ball("Corazon lobo der", (PX + 0.07, -0.375, 1.62), 0.062, hole, squash=(1, 0.5, 1)))
bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.115, radius2=0.0,
                                depth=0.16, location=(PX, -0.375, 1.50))
tip = bpy.context.object
tip.name = "Corazon punta"
tip.rotation_euler[0] = math.pi
bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
tip.data.materials.append(hole)
P.append(tip)
P.append(box("Corazon brillo", (PX, -0.378, 1.685), (0.16, 0.008, 0.014), iron_edge, collection=P))
# T4b: algae skirting at the base of the ruinous outdoor closet (thin strips
# proud of the door/sides, inside the existing silhouette so anchors hold).
P.append(box("Retrete verdin puerta", (PX, -0.365, 0.10), (0.74, 0.02, 0.16), moss, collection=P))
P.append(box("Retrete verdin izq", (PX - 0.62, -0.375, 0.10), (0.10, 0.02, 0.16), moss, collection=P))
P.append(box("Retrete verdin der", (PX + 0.62, -0.375, 0.10), (0.10, 0.02, 0.16), moss, collection=P))

# ---------------------------------------------------------------- lighting, camera, render
world = bpy.context.scene.world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.05, 0.06, 0.075, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.25


def area(name, at, energy, color, size):
    bpy.ops.object.light_add(type="AREA", location=at)
    ob = bpy.context.object
    ob.name = name
    ob.data.energy = energy
    ob.data.color = color
    ob.data.shape = "DISK"
    ob.data.size = size
    direction = Vector((ob.location[0], 0, 0.55)) - ob.location
    ob.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return ob


# T4b: dim night rig (T4 overexposed the pale albedos into glowing cream;
# T3b jar remedy used 30/15/18 + world 0.25). Positions, colors and sizes kept.
lights = [
    area("Farola calida lateral", (-1.7, -3, 2.9), 45, (1, 0.73, 0.46), 3.2),
    area("Relleno luna azul", (2.5, -1, 2.2), 28, (0.62, 0.75, 1), 2.5),
    area("Recorte trasero", (-0.3, 2.1, 1.7), 35, (0.65, 0.76, 0.87), 1.3),
]
bpy.ops.object.camera_add(location=(0, -4.6, 0.6))
camera = bpy.context.object
camera.data.type = "ORTHO"
bpy.context.scene.camera = camera

sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.samples = 28
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGBA"
sc.render.film_transparent = True
try:
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
except Exception as e:
    print("COLOUR MGMT FALLBACK", e)
sc.view_settings.exposure = 0
sc.view_settings.gamma = 1

ALL = {"mangle": M, "tub": T, "tap": S, "privy": P}


def aim(ob, target, off):
    ob.location = (target[0] + off[0], target[1] + off[1], target[2] + off[2])
    direction = Vector(target) - ob.location
    ob.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


# (centre, camera height, ortho scale, pixels)
SHOTS = {
    "mangle": ((0.0, 0, 0.60), 0.85, 1.70, (340, 300)),
    "tub": ((OX, 0, 0.42), 0.70, 1.60, (360, 260)),
    "tap": ((SX, 0, 0.95), 1.15, 2.10, (360, 420)),
    "privy": ((PX, 0, 1.15), 1.30, 2.75, (360, 560)),
}

for name, props in ALL.items():
    for ob in bpy.data.objects:
        if ob.type in ("LIGHT", "CAMERA"):
            continue
        ob.hide_render = ob not in props
    (cx, cy, cz), cam_h, scale, (rx, ry) = SHOTS[name]
    for light, (dx, dy, dz) in zip(lights, [(-1.7, 0, 2.3), (2.5, 0, 1.5), (-0.3, 0, 1.1)]):
        light.location = (cx + dx, cy - 3.0 + dy, cz + dz)
        direction = Vector((cx, cy, cz)) - light.location
        light.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    aim(camera, (cx, cy, cz), (0.55, -4.6, cam_h))
    camera.data.ortho_scale = scale
    sc.render.resolution_x, sc.render.resolution_y = rx, ry
    sc.render.resolution_percentage = 100
    sc.render.filepath = str(RENDERS / f"hanbury_{name}_raw.png")
    bpy.ops.render.render(write_still=True)
    print("RENDERED", sc.render.filepath)

bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / "hanbury_props.blend"))
print("SAVED", SOURCE / "hanbury_props.blend")
