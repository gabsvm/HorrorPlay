"""Greaves's microscope: Victorian brass monocular on the desk, Blender 5.2.

Run from the repository root:
  & 'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe' -b --factory-startup -P web/art_review/greaves_study/scripts/build_microscope.py

Outputs (task folder only, never the game):
  web/art_review/greaves_study/source/greaves_microscope.blend
  web/art_review/greaves_study/renders/greaves_microscope_raw.png

Design notes (read before tweaking):
- FRONT view, symmetric about x=0. Camera looks along +Y, up is +Z.
- Scale is locked to 100 px per Blender unit (sensor_fit HORIZONTAL).
- Readability at 640x360: the instrument is ~36 screen px wide, so the
  long brass tube, the black eyepiece, the stage plate and the round base
  carry it. Screws and rack teeth would die in the downsample: not modelled.
- Brass is authored bright for the Standard (sRGB) view transform: the
  engine's night lightmap darkens the static layer (T1b lesson). Do NOT
  pre-darken in the pack; verify in the engine.
"""

from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
(RENDER_DIR := ROOT / "renders").mkdir(parents=True, exist_ok=True)
(SOURCE_DIR := ROOT / "source").mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def mat(name, rgb, rough=0.4, metal=0.0, bump=0.0, scale=30.0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = (*rgb, 1)
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Metallic"].default_value = metal
    if bump:
        n = m.node_tree.nodes.new("ShaderNodeTexNoise")
        n.inputs["Scale"].default_value = scale
        n.inputs["Detail"].default_value = 2.0
        b = m.node_tree.nodes.new("ShaderNodeBump")
        b.inputs["Strength"].default_value = bump
        b.inputs["Distance"].default_value = 0.015
        m.node_tree.links.new(n.outputs["Fac"], b.inputs["Height"])
        m.node_tree.links.new(b.outputs["Normal"], bs.inputs["Normal"])
    return m


BRASS = mat("Laton victoriano", (0.58, 0.38, 0.14), 0.34, 0.85, 0.10)
BRASS_DARK = mat("Laton sombreado", (0.34, 0.21, 0.08), 0.5, 0.7, 0.15)
JAPAN = mat("Japon negro", (0.045, 0.045, 0.050), 0.42, 0.25, 0.0)
MIRROR = mat("Espejo condensador", (0.72, 0.80, 0.84), 0.12, 1.0, 0.0)


def box(name, at, dims, material, bevel=0.005):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    o = bpy.context.object
    o.name = name
    o.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    if bevel:
        b = o.modifiers.new("Bisel gastado", "BEVEL")
        b.width = bevel
        b.segments = 2
        o.modifiers.new("Normales ponderadas", "WEIGHTED_NORMAL")
    return o


def tube(name, at, radius, depth, material, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth,
                                       location=at)
    o = bpy.context.object
    o.name = name
    o.rotation_euler = rot
    for polygon in o.data.polygons:
        polygon.use_smooth = True
    o.data.materials.append(material)
    return o


def ball(name, at, radius, material, squash=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=12, ring_count=8, radius=radius, location=at)
    o = bpy.context.object
    o.name = name
    o.scale = squash
    for polygon in o.data.polygons:
        polygon.use_smooth = True
    o.data.materials.append(material)
    return o


# Horseshoe-ish round foot, black japan with a brass rim.
tube("Base", (0, 0, -0.335), 0.150, 0.030, JAPAN)
tube("Aro de la base", (0, 0, -0.322), 0.150, 0.008, BRASS_DARK)
# Pillar rising behind the stage, with a trunnion joint.
box("Columna", (0, 0.055, -0.175), (0.050, 0.050, 0.300), JAPAN)
ball("Articulacion", (0, 0.030, -0.045), 0.038, BRASS, squash=(1, 0.8, 1))
# Stage plate: dark square the sample sits on.
box("Platina", (0, -0.010, -0.020), (0.240, 0.150, 0.022), JAPAN)
box("Pinza de muestra", (0.055, -0.075, -0.004), (0.090, 0.020, 0.010),
    BRASS_DARK, bevel=0.002)
# Condenser mirror below the stage, tilted to catch the lamp: the glint.
tube("Espejo condensador", (0, -0.020, -0.105), 0.048, 0.010, MIRROR,
     rot=(0.85, 0, 0))
box("Brazo del espejo", (0, 0.030, -0.100), (0.020, 0.020, 0.120), JAPAN,
    bevel=0.003)
# Body tube, inclined ~16 degrees in the screen plane like the old drawing.
TILT = -0.28
tube("Tubo laton", (0.058, -0.010, 0.185), 0.046, 0.300, BRASS,
     rot=(0, TILT, 0))
tube("Manguito inferior", (0.018, -0.010, 0.048), 0.052, 0.045, BRASS_DARK,
     rot=(0, TILT, 0))
tube("Objetivo", (0.011, -0.010, 0.020), 0.026, 0.035, JAPAN,
     rot=(0, TILT, 0))
tube("Ocular ebonita", (0.098, -0.010, 0.320), 0.027, 0.075, JAPAN,
     rot=(0, TILT, 0))
tube("Anillo del ocular", (0.090, -0.010, 0.290), 0.031, 0.014, BRASS,
     rot=(0, TILT, 0))
# Focus knobs: one proud disc each side of the limb.
for side in (-1, 1):
    tube("Boton de enfoque", (side * 0.062, 0.030, -0.030), 0.036, 0.022,
         BRASS_DARK, rot=(0, 1.5708, 0))

world = bpy.context.scene.world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.05, 0.06, 0.075, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.55


def area(name, at, energy, color, size):
    bpy.ops.object.light_add(type="AREA", location=at)
    o = bpy.context.object
    o.name = name
    o.data.energy = energy
    o.data.color = color
    o.data.size = size
    o.rotation_euler = (Vector((0, 0, -0.02)) - o.location).to_track_quat("-Z", "Y").to_euler()


# Warm key from the desk lamp side, cool fill, frontal lift for the brass.
area("Lampara calida escritorio", (-1.6, -2.6, 1.6), 320, (1.0, 0.78, 0.55), 2.6)
area("Relleno luna fria", (1.8, -1.8, 0.6), 100, (0.60, 0.72, 1.0), 2.2)
area("Realce frontal laton", (0.2, -3.4, 0.0), 150, (1.0, 0.88, 0.70), 1.8)

bpy.ops.object.camera_add(location=(0, -4.2, -0.02))
cam = bpy.context.object
cam.name = "Camara frontal microscopio"
cam.rotation_euler = (Vector((0, 0, -0.02)) - cam.location).to_track_quat("-Z", "Y").to_euler()
cam.data.type = "ORTHO"
cam.data.sensor_fit = "HORIZONTAL"
cam.data.ortho_scale = 1.4  # with resolution_x=140 this locks 100 px/unit
bpy.context.scene.camera = cam

sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.samples = 32
try:
    sc.cycles.use_denoising = True
except AttributeError:
    pass
sc.render.resolution_x = 140
sc.render.resolution_y = 140
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGBA"
sc.render.film_transparent = True
sc.view_settings.view_transform = "Standard"
try:
    sc.view_settings.look = "None"
except TypeError:
    pass
sc.render.filepath = str(RENDER_DIR / "greaves_microscope_raw.png")
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_DIR / "greaves_microscope.blend"))
bpy.ops.render.render(write_still=True)
print("RENDERED", sc.render.filepath)
