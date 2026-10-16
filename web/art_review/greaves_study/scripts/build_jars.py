"""Greaves's specimen jars: tall + squat cloudy jars with contents, Blender 5.2.

Run from the repository root (stderr warnings about use_nodes are the known
harmless 5.2 deprecations; the run is good when the raw PNG is saved):
  & 'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe' -b --factory-startup -P web/art_review/greaves_study/scripts/build_jars.py

Outputs (task folder only, never the game):
  web/art_review/greaves_study/source/greaves_jars.blend
  web/art_review/greaves_study/renders/greaves_jars_raw.png

Design notes (read before tweaking):
- FRONT view. Tall jar centred at x=-0.5, squat jar at x=+0.5; the pack
  script splits the render in halves, so keep every part of each jar on
  its own side of x=0 (nothing may cross the middle).
- Scale is locked to 100 px per Blender unit (sensor_fit HORIZONTAL).
- Readability at 640x360: each shelf jar is ~32 screen px wide, so a dark
  cork/wax cap, a dim olive-turbid body with a darker specimen mass
  inside, a thin highlight line and a small cream label slip carry it.
  Ground-glass texture and jar mouth threads would die in the downsample:
  not modelled.
- The body uses Principled Alpha 0.85 (cloudy liquid) so the dark
  specimen inside stays visible through it; lid, label and highlight are
  opaque. The render aims at a mid olive-grey body (~105,108,72): the game
  then veils each jar with its own olive rgba(cR,cG,cB,0.6) via
  'source-atop' (same rng values as the procedural fallback), landing near
  the original rgb(70-95,78-96,48-62) with per-jar variety.
"""

from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
(RENDER_DIR := ROOT / "renders").mkdir(parents=True, exist_ok=True)
(SOURCE_DIR := ROOT / "source").mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def mat(name, rgb, rough=0.4, metal=0.0, alpha=1.0, emit=0.0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = (*rgb, 1)
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Metallic"].default_value = metal
    try:
        bs.inputs["Alpha"].default_value = alpha
    except (KeyError, TypeError):
        pass
    if emit:
        bs.inputs["Emission Color"].default_value = (*rgb, 1)
        bs.inputs["Emission Strength"].default_value = emit
    return m


LIQUID = mat("Liquido turbio", (0.33, 0.34, 0.21), 0.4, 0.0, alpha=0.72)
SPECIMEN = mat("Contenido oscuro", (0.07, 0.055, 0.04), 0.95, 0.0)
LID = mat("Tapon corcho", (0.08, 0.055, 0.04), 0.8, 0.0)
LABEL = mat("Etiqueta frasco", (0.78, 0.73, 0.56), 0.9, 0.0)
GLINT = mat("Brillo vidrio", (0.92, 0.94, 0.92), 0.3, 0.0, emit=0.3)


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


def box(name, at, dims, material, bevel=0.0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    o = bpy.context.object
    o.name = name
    o.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.rotation_euler = rot
    o.data.materials.append(material)
    if bevel:
        b = o.modifiers.new("Bisel gastado", "BEVEL")
        b.width = bevel
        b.segments = 2
        o.modifiers.new("Normales ponderadas", "WEIGHTED_NORMAL")
    return o


def jar(cx, body_r, body_bottom, body_top, specimen_squash, label_w):
    """One complete jar. NOTHING may cross x=0: keep parts within cx +/- 0.4."""
    h = body_top - body_bottom
    zmid = (body_top + body_bottom) / 2
    tube(f"Cuerpo {cx}", (cx, 0, zmid), body_r, h, LIQUID)
    # Dark specimen mass floating in the liquid, wider than the label so its
    # edges flank the slip like tissue in murk.
    ball(f"Contenido {cx}", (cx + 0.01, 0, body_bottom + h * 0.44),
         body_r * 0.6, SPECIMEN, squash=specimen_squash)
    # Sediment settling at the bottom.
    tube(f"Sedimento {cx}", (cx, 0, body_bottom + 0.035), body_r * 0.86,
         0.07, SPECIMEN)
    # Wooden lid with a small knob cap.
    tube(f"Tapa {cx}", (cx, 0, body_top + 0.035), body_r + 0.02, 0.07, LID)
    tube(f"Agarradera {cx}", (cx, 0, body_top + 0.085), 0.035, 0.03, LID)
    # Cream label slip low on the belly, slightly proud of the glass, so the
    # dark specimen mass stays visible above it.
    box(f"Etiqueta {cx}", (cx, -body_r - 0.004, zmid - h * 0.20),
        (label_w, 0.010, 0.11), LABEL)
    # Thin highlight stripe at the left edge of the glass: a fine specular
    # line, never a white body.
    box(f"Brillo {cx}", (cx - body_r * 0.55, -body_r - 0.006, zmid),
        (0.014, 0.008, h * 0.72), GLINT)


# Tall jar (left) and squat jar (right): bottoms aligned at z=-0.25.
jar(-0.5, 0.155, -0.25, 0.35, (1.15, 0.9, 1.35), 0.16)
jar(0.5, 0.165, -0.25, 0.15, (1.15, 0.9, 0.85), 0.18)

world = bpy.context.scene.world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.05, 0.06, 0.075, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.25


def area(name, at, energy, color, size):
    bpy.ops.object.light_add(type="AREA", location=at)
    o = bpy.context.object
    o.name = name
    o.data.energy = energy
    o.data.color = color
    o.data.size = size
    o.rotation_euler = (Vector((0, 0, 0.05)) - o.location).to_track_quat("-Z", "Y").to_euler()


# Dim shelf lights: the jars must stay the darkest thing on the wall, a dim
# olive murk with a darker specimen inside (T3b: the old rig overexposed
# the cloudy glass into glowing cream).
area("Luz fria estante", (-1.2, -2.6, 1.8), 30, (0.75, 0.85, 1.0), 2.6)
area("Luz calida cuarto", (1.6, -2.2, 0.6), 15, (1.0, 0.80, 0.58), 2.2)
area("Realce frontal vidrio", (0.0, -3.4, 0.1), 18, (0.9, 0.92, 0.9), 1.8)

bpy.ops.object.camera_add(location=(0, -4.2, 0.05))
cam = bpy.context.object
cam.name = "Camara frontal frascos"
cam.rotation_euler = (Vector((0, 0, 0.05)) - cam.location).to_track_quat("-Z", "Y").to_euler()
cam.data.type = "ORTHO"
cam.data.sensor_fit = "HORIZONTAL"
cam.data.ortho_scale = 2.0  # with resolution_x=200 this locks 100 px/unit
bpy.context.scene.camera = cam

sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.samples = 48
try:
    sc.cycles.use_denoising = True
except AttributeError:
    pass
sc.render.resolution_x = 200
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
sc.render.filepath = str(RENDER_DIR / "greaves_jars_raw.png")
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_DIR / "greaves_jars.blend"))
bpy.ops.render.render(write_still=True)
print("RENDERED", sc.render.filepath)
