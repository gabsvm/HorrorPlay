"""Greaves's specimen jars v2 (delivery C): five distinct variants, one scene.

Run from the repository root (Blender path via the BLENDER environment
variable, typical Windows install as fallback; scripts were written for
4.2, adapted where 5.2 differs):
  set BLENDER=C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe
  "%BLENDER%" -b --factory-startup -P web/art_review/greaves_study/v2/scripts/build_jars_v2.py

Outputs (task folder only, never the game):
  web/art_review/greaves_study/v2/source/greaves_jars_v2.blend
  web/art_review/greaves_study/v2/renders/greaves_jars_v2_raw.png

Why five (quality/resources): at 640x360 each shelf jar is ~32 screen px
wide, so variety must come from silhouette, cap and content mass, not
fine detail. Two approved sprites (tall/squat) stay as the base; three
new ones (round/leather, thin/empty, wide/wax/leaning) break the clone
read. Five variants over 28 jars = ~5-6 instances each with no adjacent
clones (the game de-clusters neighbours), while each sprite is reused
enough to keep VRAM trivial (~20 KB total). Twenty-eight models would
each repeat ~once: no visual gain for 28x the memory and pack work.

Design notes (read before tweaking):
- FRONT view. Five jars centred at x=-1.0,-0.5,0,+0.5,+1.0; the pack
  script slices the render in fifths, so keep every part of each jar
  inside its own 0.5-wide slice (nothing may cross a slice border).
- Scale is locked to 100 px per Blender unit (sensor_fit HORIZONTAL,
  ortho_scale 2.5 at 250 px wide).
- Same approved T3b tone rig: dim olive-turbid body (0.33,0.34,0.21,
  alpha 0.72), dark specimen inside, dark cap, cream label, thin
  highlight, lights 30/15/18 + world 0.25. New mats (wax, leather
  string) stay equally dark. The game veils each jar with its own olive
  rgba(cR,cG,cB,0.6) via 'source-atop' as before.
- Labels are blank geometry only (varied size/height, never new text).
- Readability carriers at 32 px: cap silhouette (cork/wax/leather),
  body silhouette (narrow/wide/round-shouldered), content mass
  (big specimen / turbid low mass / small clear blob / dust speck /
  heavy sediment) and label position.
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
WAX = mat("Sello cera", (0.14, 0.06, 0.05), 0.6, 0.0)
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


def ring(name, at, r_major, r_minor, material):
    bpy.ops.mesh.primitive_torus_add(location=at, major_radius=r_major,
                                     minor_radius=r_minor,
                                     major_segments=16, minor_segments=8)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    return o


def labelGy(at, w, h=0.11):
    # Blank cream slip, slightly proud of the glass. No text: position and
    # size are the variety (low-wide, high-narrow, mid-square, torn-small).
    return box(f"Etiqueta {at[0]:.2f}", (at[0], at[1], at[2]), (w, 0.010, h),
               LABEL)


def glint(cx, r, zmid, h):
    return box(f"Brillo {cx:.2f}", (cx - r * 0.55, -r - 0.006, zmid),
               (0.014, 0.008, h * 0.72), GLINT)


# A tall narrow, cork stopper, large specimen (the approved tall role).
cx = -1.0
tube("Cuerpo A", (cx, 0, 0.05), 0.130, 0.60, LIQUID)
ball("Contenido A", (cx + 0.01, 0, 0.02), 0.078, SPECIMEN,
     squash=(1.15, 0.9, 1.35))
tube("Sedimento A", (cx, 0, -0.215), 0.112, 0.07, SPECIMEN)
tube("Tapa A", (cx, 0, 0.385), 0.150, 0.07, LID)
tube("Agarradera A", (cx, 0, 0.435), 0.035, 0.03, LID)
labelGy((cx, -0.134, -0.07), 0.16)
glint(cx, 0.130, 0.05, 0.60)

# B squat wide, wooden lid, turbid low mass (the approved squat role).
cx = -0.5
tube("Cuerpo B", (cx, 0, -0.05), 0.165, 0.40, LIQUID)
ball("Contenido B", (cx + 0.01, 0, -0.14), 0.099, SPECIMEN,
     squash=(1.15, 0.9, 0.70))
tube("Sedimento B", (cx, 0, -0.215), 0.142, 0.09, SPECIMEN)
tube("Tapa B", (cx, 0, 0.185), 0.185, 0.07, LID)
tube("Agarradera B", (cx, 0, 0.235), 0.035, 0.03, LID)
labelGy((cx, -0.169, 0.03), 0.12)
glint(cx, 0.165, -0.05, 0.40)

# C medium round shoulders, leather-tied lid, clear liquid + small blob.
cx = 0.0
tube("Cuerpo C", (cx, 0, -0.065), 0.150, 0.37, LIQUID)
ball("Hombro C", (cx, 0, 0.12), 0.150, LIQUID, squash=(1.0, 1.0, 0.55))
tube("Cuello C", (cx, 0, 0.175), 0.090, 0.11, LIQUID)
ball("Contenido C", (cx + 0.01, 0, -0.17), 0.053, SPECIMEN,
     squash=(1.1, 0.9, 0.8))
tube("Sedimento C", (cx, 0, -0.235), 0.129, 0.03, SPECIMEN)
tube("Tapa C", (cx, 0, 0.245), 0.105, 0.05, LID)
ring("Cuerda C", (cx, 0, 0.175), 0.093, 0.012, LID)
labelGy((cx, -0.154, -0.05), 0.13, h=0.13)
glint(cx, 0.150, -0.065, 0.37)

# D short thin, tall cork, empty with dust (tiny speck + thin film).
cx = 0.5
tube("Cuerpo D", (cx, 0, -0.10), 0.110, 0.30, LIQUID)
ball("Polvo D", (cx + 0.005, 0, -0.205), 0.028, SPECIMEN,
     squash=(1.2, 0.9, 0.6))
tube("Sedimento D", (cx, 0, -0.242), 0.095, 0.025, SPECIMEN)
tube("Tapa D", (cx, 0, 0.085), 0.120, 0.07, LID)
tube("Corcho D", (cx, 0, 0.155), 0.030, 0.07, LID)
labelGy((cx, -0.114, -0.10), 0.10, h=0.09)
glint(cx, 0.110, -0.10, 0.30)

# E medium wide, wax seal, heavy sediment + medium specimen, baked lean.
cx = 1.0
lean = 0.05
parts = []
parts.append(tube("Cuerpo E", (cx, 0, 0.0), 0.160, 0.50, LIQUID))
parts.append(ball("Contenido E", (cx + 0.01, 0, -0.06), 0.096, SPECIMEN,
                  squash=(1.1, 0.9, 1.0)))
parts.append(tube("Sedimento E", (cx, 0, -0.21), 0.138, 0.10, SPECIMEN))
parts.append(tube("Tapa E", (cx, 0, 0.285), 0.175, 0.06, WAX))
parts.append(ball("Sello E", (cx, 0, 0.325), 0.035, WAX,
                  squash=(1.0, 1.0, 0.5)))
parts.append(labelGy((cx, -0.164, -0.02), 0.14))
parts.append(glint(cx, 0.160, 0.0, 0.50))
for o in parts:
    o.rotation_euler = (0, lean, 0)

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


# Same dim shelf rig as the approved T3b jars: the jars must stay the
# darkest thing on the wall. Widened only to cover five slices evenly.
area("Luz fria estante", (-2.0, -2.6, 1.8), 30, (0.75, 0.85, 1.0), 3.4)
area("Luz calida cuarto", (2.4, -2.2, 0.6), 15, (1.0, 0.80, 0.58), 2.8)
area("Realce frontal vidrio", (0.0, -3.4, 0.1), 18, (0.9, 0.92, 0.9), 2.4)

bpy.ops.object.camera_add(location=(0, -4.2, 0.05))
cam = bpy.context.object
cam.name = "Camara frontal frascos"
cam.rotation_euler = (Vector((0, 0, 0.05)) - cam.location).to_track_quat("-Z", "Y").to_euler()
cam.data.type = "ORTHO"
cam.data.sensor_fit = "HORIZONTAL"
cam.data.ortho_scale = 2.5  # with resolution_x=250 this locks 100 px/unit
bpy.context.scene.camera = cam

sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.samples = 48
try:
    sc.cycles.use_denoising = True
except AttributeError:
    pass
sc.render.resolution_x = 250
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
sc.render.filepath = str(RENDER_DIR / "greaves_jars_v2_raw.png")
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_DIR / "greaves_jars_v2.blend"))
bpy.ops.render.render(write_still=True)
print("RENDERED", sc.render.filepath)
