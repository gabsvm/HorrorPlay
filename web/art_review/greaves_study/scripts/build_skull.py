"""Greaves's desk skull: small aged-bone paperweight skull, Blender 5.2.

Run from the repository root:
  & 'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe' -b --factory-startup -P web/art_review/greaves_study/scripts/build_skull.py

Outputs (task folder only, never the game):
  web/art_review/greaves_study/source/greaves_skull.blend
  web/art_review/greaves_study/renders/greaves_skull_raw.png

Design notes (read before tweaking):
- FRONT view, symmetric about x=0. Camera looks along +Y, up is +Z.
- Scale is locked to 100 px per Blender unit: resolution_x / ortho_scale
  must stay 100 (sensor_fit HORIZONTAL so the wide axis cannot rescale it).
- Readability at 640x360 beats anatomy: the skull is ~36 screen px wide,
  so bold dark sockets, a nasal wedge and a pale teeth strip carry it.
  Sutures and fine cracks would die in the downsample: not modelled.
- Bone is authored BRIGHT warm ivory for the Standard (sRGB) view
  transform: the engine's night lightmap darkens the static layer, and a
  dark-authored bone would die there (T1b lesson from the Wexley mirror).
  Do NOT pre-darken in the pack (BRIGHTNESS 1.0); verify in the engine.
"""

from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
(RENDER_DIR := ROOT / "renders").mkdir(parents=True, exist_ok=True)
(SOURCE_DIR := ROOT / "source").mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def mat(name, rgb, rough=0.6, metal=0.0, bump=0.0, scale=28.0):
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


BONE = mat("Hueso marfilenvejecido", (0.78, 0.70, 0.55), 0.62, 0.0, 0.18)
BONE_DARK = mat("Hueso sombra mandibula", (0.66, 0.57, 0.43), 0.7, 0.0, 0.2)
TEETH = mat("Dientes", (0.82, 0.75, 0.60), 0.45, 0.0, 0.0)
DARK = mat("Cuencas oscuras", (0.030, 0.025, 0.020), 0.95, 0.0, 0.0)


def ball(name, at, radius, material, squash=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=16, ring_count=10, radius=radius, location=at)
    o = bpy.context.object
    o.name = name
    o.scale = squash
    for polygon in o.data.polygons:
        polygon.use_smooth = True
    o.data.materials.append(material)
    return o


def box(name, at, dims, material, bevel=0.006):
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


# Cranium: tall egg of bone, slightly narrower at the cheeks.
ball("Craneo", (0, 0.01, 0.10), 0.170, BONE, squash=(1.0, 0.94, 1.10))
# Cheek mass each side, pulled forward toward the viewer.
for side in (-1, 1):
    ball("Pomulo", (side * 0.105, -0.055, -0.015), 0.075, BONE,
         squash=(1.0, 0.9, 1.15))
# Brow ridge shading the sockets.
box("Arco superciliar", (0, -0.105, 0.055), (0.175, 0.045, 0.035), BONE)
# Sockets: bold dark bowls, slightly proud so they survive the downsample.
for side in (-1, 1):
    ball("Cuenca ocular", (side * 0.063, -0.118, 0.028), 0.050, DARK,
         squash=(1.0, 0.55, 1.12))
# Nasal cavity: dark wedge, apex down.
bpy.ops.mesh.primitive_cone_add(radius1=0.030, depth=0.055,
                                location=(0, -0.112, -0.038))
nasal = bpy.context.object
nasal.name = "Fosa nasal"
nasal.rotation_euler = (3.14159, 0, 0)
for polygon in nasal.data.polygons:
    polygon.use_smooth = True
nasal.data.materials.append(DARK)
# Upper teeth: one pale strip, slightly forward.
box("Dientes superiores", (0, -0.118, -0.088), (0.105, 0.020, 0.028), TEETH,
    bevel=0.003)
# Jaw: separate bone mass with a chin, hinged look via a shadow gap.
box("Mandibula", (0, -0.045, -0.175), (0.135, 0.085, 0.075), BONE_DARK)
box("Barbilla", (0, -0.075, -0.185), (0.070, 0.045, 0.045), BONE_DARK)
box("Dientes inferiores", (0, -0.100, -0.128), (0.085, 0.018, 0.022), TEETH,
    bevel=0.002)

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
    o.rotation_euler = (Vector((0, 0, 0.0)) - o.location).to_track_quat("-Z", "Y").to_euler()


# Warm desk-lamp key from the upper left, cool moon fill, soft frontal
# lift so the sockets stay holes and the bone stays ivory, not chalk.
area("Lampara calida escritorio", (-1.6, -2.6, 2.0), 300, (1.0, 0.78, 0.55), 2.6)
area("Relleno luna fria", (1.8, -1.8, 0.8), 90, (0.60, 0.72, 1.0), 2.2)
area("Realce frontal hueso", (0.2, -3.4, 0.2), 130, (1.0, 0.88, 0.70), 1.8)

bpy.ops.object.camera_add(location=(0, -4.2, -0.03))
cam = bpy.context.object
cam.name = "Camara frontal craneo"
cam.rotation_euler = (Vector((0, 0, -0.03)) - cam.location).to_track_quat("-Z", "Y").to_euler()
cam.data.type = "ORTHO"
cam.data.sensor_fit = "HORIZONTAL"
cam.data.ortho_scale = 1.6  # with resolution_x=160 this locks 100 px/unit
bpy.context.scene.camera = cam

sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.samples = 32
try:
    sc.cycles.use_denoising = True
except AttributeError:
    pass
sc.render.resolution_x = 160
sc.render.resolution_y = 200
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGBA"
sc.render.film_transparent = True
sc.view_settings.view_transform = "Standard"
try:
    sc.view_settings.look = "None"
except TypeError:
    pass
sc.render.filepath = str(RENDER_DIR / "greaves_skull_raw.png")
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_DIR / "greaves_skull.blend"))
bpy.ops.render.render(write_still=True)
print("RENDERED", sc.render.filepath)
