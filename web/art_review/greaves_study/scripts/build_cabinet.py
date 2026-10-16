"""Greaves's filing cabinet: glazed case-file cupboard, Blender 5.2.

Run from the repository root (stderr warnings about use_nodes are the known
harmless 5.2 deprecations; the run is good when the raw PNG is saved):
  & 'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe' -b --factory-startup -P web/art_review/greaves_study/scripts/build_cabinet.py

Outputs (task folder only, never the game):
  web/art_review/greaves_study/source/greaves_cabinet.blend
  web/art_review/greaves_study/renders/greaves_cabinet_raw.png

Design notes (read before tweaking):
- FRONT view, symmetric about x=0. Camera looks along +Y, up is +Z.
- Scale is locked to 100 px per Blender unit (sensor_fit HORIZONTAL), and
  the cabinet is modelled EXACTLY 1.8 x 4.0 units so the packed sprite is
  180 x 400 px: the old procedural world rect, no hotspot or layout change.
- Readability at 640x360: bold shelf rows of coloured file spines with
  pale label slips, a brass lock plate on the mid rail, panelled lower
  doors with knobs. No glass plane: transparency would punch a hole in the
  sprite; a dim diagonal sheen suggests the glazing instead.
- Wood is authored mid mahogany for the Standard (sRGB) view transform:
  the engine's night lightmap darkens the static layer (T1b lesson). Do
  NOT pre-darken in the pack; verify in the engine.
"""

from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
(RENDER_DIR := ROOT / "renders").mkdir(parents=True, exist_ok=True)
(SOURCE_DIR := ROOT / "source").mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def mat(name, rgb, rough=0.6, metal=0.0, bump=0.0, scale=24.0, emit=0.0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = (*rgb, 1)
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Metallic"].default_value = metal
    if emit:
        bs.inputs["Emission Color"].default_value = (*rgb, 1)
        bs.inputs["Emission Strength"].default_value = emit
    if bump:
        n = m.node_tree.nodes.new("ShaderNodeTexNoise")
        n.inputs["Scale"].default_value = scale
        n.inputs["Detail"].default_value = 2.0
        b = m.node_tree.nodes.new("ShaderNodeBump")
        b.inputs["Strength"].default_value = bump
        b.inputs["Distance"].default_value = 0.02
        m.node_tree.links.new(n.outputs["Fac"], b.inputs["Height"])
        m.node_tree.links.new(b.outputs["Normal"], bs.inputs["Normal"])
    return m


WOOD = mat("Caoba consultorio", (0.23, 0.13, 0.07), 0.62, 0.0, 0.25)
WOOD_DARK = mat("Caoba sombra", (0.12, 0.065, 0.035), 0.75, 0.0, 0.2)
TRIM = mat("Moldura caoba", (0.30, 0.17, 0.09), 0.5, 0.0, 0.15)
BRASS = mat("Laton cerradura", (0.58, 0.38, 0.14), 0.38, 0.8, 0.1)
SHEEN = mat("Reflejo cristal", (0.35, 0.44, 0.48), 0.4, 0.0, emit=0.35)
BUFF = mat("Carpeta ante", (0.52, 0.40, 0.24), 0.85, 0.0, 0.1)
OXBLOOD = mat("Expediente rojo", (0.38, 0.12, 0.10), 0.8, 0.0, 0.1)
GREEN = mat("Expediente verde", (0.16, 0.26, 0.16), 0.8, 0.0, 0.1)
NAVY = mat("Expediente azul", (0.13, 0.16, 0.27), 0.8, 0.0, 0.1)
SLIP = mat("Etiqueta expediente", (0.78, 0.72, 0.58), 0.9, 0.0, 0.0)


def box(name, at, dims, material, bevel=0.008, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    o = bpy.context.object
    o.name = name
    o.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.rotation_euler = rot
    o.data.materials.append(material)
    if bevel:
        b = o.modifiers.new("Bisel ebanista", "BEVEL")
        b.width = bevel
        b.segments = 2
        o.modifiers.new("Normales ponderadas", "WEIGHTED_NORMAL")
    return o


# Carcass: sides, back, plinth and cornice. Outer x in [-0.9, 0.9].
for side in (-1, 1):
    box("Lateral", (side * 0.86, 0, 0), (0.08, 0.55, 3.90), WOOD)
box("Trasera", (0, 0.25, 0), (1.72, 0.05, 3.80), WOOD_DARK, bevel=0.0)
box("Zocalo", (0, 0, -1.925), (1.88, 0.58, 0.15), WOOD_DARK)
box("Cornisa", (0, -0.01, 1.925), (1.90, 0.60, 0.11), TRIM)
box("Tapa superior", (0, -0.01, 2.0), (1.96, 0.64, 0.05), WOOD, bevel=0.006)

# Glazed upper section: z in [-0.15, 1.85]. Three shelf boards with files.
FILE_MATS = [BUFF, OXBLOOD, GREEN, NAVY, BUFF, GREEN]
for s, sz in enumerate((0.15, 0.75, 1.35)):
    box(f"Balda {s}", (0, 0.02, sz), (1.66, 0.48, 0.05), TRIM)
    # Six upright files per shelf; the last one leans, as clerks leave them.
    x = -0.70
    for i in range(6):
        w = 0.20 if i % 3 == 2 else 0.16
        h = 0.46 + (0.06 if (i + s) % 3 == 0 else 0.0)
        lean = (0, -0.14 if i == 5 else 0, 0)
        f = box(f"Expediente {s}-{i}", (x + w / 2, -0.02, sz + 0.025 + h / 2),
                (w, 0.34, h), FILE_MATS[(i + s) % len(FILE_MATS)],
                bevel=0.004, rot=lean)
        if i % 2 == 0:
            box(f"Etiqueta {s}-{i}", (x + w / 2, -0.20, sz + 0.30),
                (w * 0.55, 0.012, 0.07), SLIP, bevel=0.0)
        x += w + 0.035
# Glazing bars: centre muntin and shelf front rails over the files.
box("Mainel central", (0, -0.26, 0.85), (0.055, 0.03, 2.00), WOOD)
for sz in (0.15, 0.75, 1.35):
    box(f"Travesano balda", (0, -0.26, sz + 0.02), (1.66, 0.03, 0.07), WOOD,
        bevel=0.004)
box("Riel superior cristal", (0, -0.26, 1.83), (1.66, 0.03, 0.07), WOOD)
# The sheen: one dim diagonal suggestion of glass, left of the files.
box("Reflejo cristal", (-0.52, -0.30, 0.90), (0.16, 0.008, 1.90), SHEEN,
    bevel=0.0, rot=(0, 0, 0.30))

# Mid rail with the brass lock the key opens.
box("Riel cerradura", (0, -0.01, -0.25), (1.72, 0.56, 0.18), TRIM)
box("Placa laton", (0, -0.30, -0.25), (0.11, 0.02, 0.13), BRASS, bevel=0.003)
box("Bocallave", (0, -0.315, -0.26), (0.025, 0.012, 0.05), WOOD_DARK,
    bevel=0.0)

# Lower double doors with inset panels and brass knobs.
for side in (-1, 1):
    box("Puerta inferior", (side * 0.43, -0.01, -1.05), (0.80, 0.52, 1.40),
        WOOD)
    box("Tablero puerta", (side * 0.43, -0.04, -1.05), (0.58, 0.48, 1.10),
        WOOD_DARK, bevel=0.01)
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=10, ring_count=6, radius=0.035, location=(side * 0.12, -0.30, -1.05))
    knob = bpy.context.object
    knob.name = "Pomo puerta"
    for polygon in knob.data.polygons:
        polygon.use_smooth = True
    knob.data.materials.append(BRASS)

world = bpy.context.scene.world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.05, 0.06, 0.075, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.5


def area(name, at, energy, color, size):
    bpy.ops.object.light_add(type="AREA", location=at)
    o = bpy.context.object
    o.name = name
    o.data.energy = energy
    o.data.color = color
    o.data.size = size
    o.rotation_euler = (Vector((0, 0, 0.0)) - o.location).to_track_quat("-Z", "Y").to_euler()


# Dim corner dressed by the gas bracket above: soft warm top light, cool
# fill, gentle frontal lift so the file rows stay legible, never bright.
area("Aplique de gas", (0.3, -2.8, 4.6), 380, (1.0, 0.80, 0.58), 3.0)
area("Relleno luna fria", (2.6, -2.2, 0.2), 110, (0.60, 0.72, 1.0), 2.6)
area("Realce frontal caoba", (-0.4, -4.4, 0.2), 150, (1.0, 0.88, 0.70), 2.2)

bpy.ops.object.camera_add(location=(0, -6.5, 0.0))
cam = bpy.context.object
cam.name = "Camara frontal archivador"
cam.rotation_euler = (Vector((0, 0, 0.0)) - cam.location).to_track_quat("-Z", "Y").to_euler()
cam.data.type = "ORTHO"
cam.data.sensor_fit = "HORIZONTAL"
cam.data.ortho_scale = 2.6  # with resolution_x=260 this locks 100 px/unit
bpy.context.scene.camera = cam

sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.samples = 32
try:
    sc.cycles.use_denoising = True
except AttributeError:
    pass
sc.render.resolution_x = 260
sc.render.resolution_y = 440
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGBA"
sc.render.film_transparent = True
sc.view_settings.view_transform = "Standard"
try:
    sc.view_settings.look = "None"
except TypeError:
    pass
sc.render.filepath = str(RENDER_DIR / "greaves_cabinet_raw.png")
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_DIR / "greaves_cabinet.blend"))
bpy.ops.render.render(write_still=True)
print("RENDERED", sc.render.filepath)
