"""Wexley parlour mirror: ornate aged-gilt Victorian frame, Blender 5.2.

Run from the repository root:
  blender -b --factory-startup -P web/art_review/wexley_mirror/scripts/build_wexley_mirror.py

Outputs (task folder only, never the game):
  web/art_review/wexley_mirror/source/wexley_mirror.blend
  web/art_review/wexley_mirror/renders/wexley_mirror_raw.png

Design notes (read before tweaking):
- FRAME ONLY: the glass opening is left empty so the render has a truly
  transparent hole. The game paints the dark glass + reflections + cracked
  overlay in canvas over that hole (see pack script + seance.js), which is
  what preserves the mirror mechanic (it never reflects the inspector).
- Scale is locked to 100 px per Blender unit: resolution_x / ortho_scale
  must stay 100 so the 2.375 x 2.685 opening renders as a ~238 x 269 px
  hole. The pack script asserts this.
- Front view, mirror plane = XZ, camera looks along +Y. Keep the build
  symmetric about x=0 so the crop stays centred.
- Readability at 640x360 (mirror is ~125 screen px wide) beats detail:
  T1b: bold egg-and-dart friezes, big corner rosettes, dentilled sill and a
  compact bright crest. The gilt is rendered BRIGHT warm gold on purpose:
  the engine's night lighting darkens the static layer, and T1's darker
  gold died there. Do NOT pre-darken in the pack (BRIGHTNESS 1.0).
- NEVER move the glass opening: x in [-1.1875, 1.1875] (inner filetes),
  z in [-1.4775, 1.2075]. All ornament sits on the mouldings outside it.
"""

from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
(RENDER_DIR := ROOT / "renders").mkdir(parents=True, exist_ok=True)
(SOURCE_DIR := ROOT / "source").mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def mat(name, rgb, rough=0.5, metal=0.85, bump=0.25, scale=34.0):
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
        b.inputs["Distance"].default_value = 0.02
        m.node_tree.links.new(n.outputs["Fac"], b.inputs["Height"])
        m.node_tree.links.new(b.outputs["Normal"], bs.inputs["Normal"])
    return m


# T1b gilt v3: saturated amber, mostly dielectric. v2 rendered chalky
# ivory in the engine: AgX desaturated the gold and the bright eggs blew
# out to white. These values are authored for the Standard (sRGB) view
# transform so the sprite meets the painted scene's palette directly.
GOLD = mat("Oro envejecido v3", (0.55, 0.34, 0.10), 0.55, 0.25, 0.30)
BRIGHT = mat("Oro vivo v3", (0.62, 0.40, 0.12), 0.40, 0.30, 0.12)
BRONZE = mat("Bronce oscuro v3", (0.09, 0.055, 0.025), 0.85, 0.10, 0.35)
INNER = mat("Filete interior v3", (0.72, 0.52, 0.20), 0.32, 0.35, 0.0)


def box(name, at, dims, material, bevel=0.010):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    o = bpy.context.object
    o.name = name
    o.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    if bevel:
        b = o.modifiers.new("Bisel desgastado", "BEVEL")
        b.width = bevel
        b.segments = 2
        o.modifiers.new("Normales ponderadas", "WEIGHTED_NORMAL")
    return o


def ball(name, at, radius, material, squash=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=14, ring_count=8, radius=radius, location=at)
    o = bpy.context.object
    o.name = name
    o.scale = squash
    for polygon in o.data.polygons:
        polygon.use_smooth = True
    o.data.materials.append(material)
    return o


def dart(name, at, radius, depth, material, rot=(0.0, 0.0, 0.0)):
    """Small dark cone, apex toward the glass: the 'dardos' between eggs."""
    bpy.ops.mesh.primitive_cone_add(
        radius1=radius, depth=depth, location=at)
    o = bpy.context.object
    o.name = name
    o.rotation_euler = rot
    for polygon in o.data.polygons:
        polygon.use_smooth = True
    o.data.materials.append(material)
    return o


def ring(name, at, major, minor, material):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major, minor_radius=minor,
        major_segments=28, minor_segments=10, location=at)
    o = bpy.context.object
    o.name = name
    for polygon in o.data.polygons:
        polygon.use_smooth = True
    o.data.materials.append(material)
    return o


# Side stiles: stepped molding, dark outer edge / aged gold / bright bead.
for side in (-1, 1):
    box("Borde bronce lateral", (side * 1.31, 0, -0.07),
        (0.20, 0.10, 3.32), BRONZE)
    box("Moldura oro lateral", (side * 1.28, -0.03, -0.07),
        (0.16, 0.16, 3.10), GOLD)
    box("Filete brillo lateral", (side * 1.205, -0.06, -0.07),
        (0.035, 0.20, 2.78), INNER, bevel=0.004)

# Top rail with a stepped crown.
box("Borde bronce superior", (0, 0, 1.375), (2.82, 0.10, 0.31), BRONZE)
box("Moldura oro superior", (0, -0.03, 1.35), (2.72, 0.16, 0.26), GOLD)
box("Filete brillo superior", (0, -0.06, 1.225), (2.44, 0.20, 0.035),
    INNER, bevel=0.004)

# Bottom rail, chunkier, with a protruding dentilled sill and a pendant.
box("Borde bronce inferior", (0, 0, -1.665), (2.82, 0.10, 0.37), BRONZE)
box("Moldura oro inferior", (0, -0.03, -1.62), (2.72, 0.16, 0.24), GOLD)
box("Repisa inferior", (0, -0.09, -1.70), (2.84, 0.26, 0.10), GOLD)
box("Filete brillo inferior", (0, -0.06, -1.495), (2.44, 0.20, 0.035),
    INNER, bevel=0.004)
box("Colgante inferior", (0, -0.05, -1.83), (0.20, 0.14, 0.12), GOLD)
ball("Pera del colgante", (0, -0.05, -1.93), 0.075, BRIGHT, squash=(1, 1, 1.25))

# Egg-and-dart frieze on the top rail: bright eggs, dark darts between.
x = -1.05
i = 0
while x <= 1.06:
    ball(f"Huevo superior {i}", (x, -0.12, 1.35), 0.080, BRIGHT,
         squash=(1, 0.55, 1.15))
    if x + 0.15 <= 1.06:
        # apex down (-Z), toward the glass
        dart(f"Dardo superior {i}", (x + 0.15, -0.10, 1.33), 0.045, 0.14,
             BRONZE, rot=(3.14159, 0, 0))
    x += 0.30
    i += 1

# Egg-and-dart down both stiles, clear of the corner rosettes.
for side in (-1, 1):
    z = -1.25
    i = 0
    while z <= 1.01:
        ball(f"Huevo lateral {side} {i}", (side * 1.28, -0.12, z), 0.075,
             BRIGHT, squash=(1, 0.55, 1.15))
        if z + 0.14 <= 1.01:
            # apex toward the glass (inward, -side * X)
            dart(f"Dardo lateral {side} {i}", (side * 1.28, -0.10, z + 0.14),
                 0.042, 0.13, BRONZE, rot=(0, -side * 1.5708, 0))
        z += 0.28
        i += 1

# Dentilled sill: bright teeth under the protruding shelf.
x = -1.20
i = 0
while x <= 1.21:
    box(f"Dentellon {i}", (x, -0.24, -1.66), (0.09, 0.10, 0.09), BRIGHT,
        bevel=0.004)
    x += 0.24
    i += 1

# Corner rosettes: big bright carved bosses with a dark heart.
for cx, cz in [(-1.28, 1.35), (1.28, 1.35), (-1.28, -1.62), (1.28, -1.62)]:
    ball("Roseta esquinera", (cx, -0.13, cz), 0.130, BRIGHT, squash=(1, 0.6, 1))
    ball("Corazón de roseta", (cx, -0.19, cz), 0.055, BRONZE, squash=(1, 0.6, 1))

# Crest: thick scroll rings flank a cartouche; urn finial crowns it.
# Tip stays below z~2.24 so it hangs just under the cornice in game.
for side in (-1, 1):
    ring("Voluta del remate", (side * 0.62, -0.13, 1.60), 0.24, 0.075, GOLD)
    ball("Ojo de voluta", (side * 0.62, -0.20, 1.60), 0.085, BRIGHT,
         squash=(1, 0.6, 1))
ball("Cartela central", (0, -0.06, 1.78), 0.30, GOLD, squash=(1.1, 0.55, 1.2))
ball("Sombra de cartela", (0, -0.10, 1.78), 0.150, BRONZE, squash=(1.0, 0.5, 1.2))
ball("Medallón de cartela", (0, -0.16, 1.78), 0.115, BRIGHT, squash=(1, 0.5, 1))
bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.14,
                                    location=(0, -0.04, 2.02))
bpy.context.object.name = "Cuello de urna"
bpy.context.object.data.materials.append(GOLD)
ball("Urna del remate", (0, -0.04, 2.13), 0.085, BRIGHT, squash=(1, 1, 1.2))

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
    o.rotation_euler = (Vector((0, 0, 0.1)) - o.location).to_track_quat("-Z", "Y").to_euler()


# T1b lighting v3: warm key + top kicker for crest speculars, gentler
# fills so nothing clips to white (v2's eggs blew out to ivory).
area("Vela cálida izquierda", (-2.4, -3.2, 2.6), 420, (1.0, 0.74, 0.47), 3.2)
area("Relleno luna derecha", (2.6, -2.4, 1.4), 100, (0.60, 0.72, 1.0), 2.4)
area("Realce frontal oro", (0.4, -4.2, 0.6), 180, (1.0, 0.86, 0.62), 2.0)
area("Cenital de cresta", (0.0, -1.6, 4.4), 260, (1.0, 0.88, 0.68), 1.6)

bpy.ops.object.camera_add(location=(0, -5.4, 0.08))
cam = bpy.context.object
cam.name = "Camara frontal espejo"
cam.rotation_euler = (Vector((0, 0, 0.08)) - cam.location).to_track_quat("-Z", "Y").to_euler()
cam.data.type = "ORTHO"
# Explicit horizontal fit: with a portrait frame, AUTO would fit the wrong
# axis and silently change the px/unit scale. Horizontal fit makes
# ortho_scale the exact view width, so 3.4 units over 340 px = 100 px/unit.
cam.data.sensor_fit = "HORIZONTAL"
cam.data.ortho_scale = 3.4  # with resolution_x=340 this locks 100 px/unit
bpy.context.scene.camera = cam

sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.samples = 32
try:
    sc.cycles.use_denoising = True
except AttributeError:
    pass
sc.render.resolution_x = 340
# Tall enough for urn (z~2.22) and pendant (z~-2.0) with margin; width still
# locks 100 px/unit via ortho_scale=3.4.
sc.render.resolution_y = 480
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGBA"
sc.render.film_transparent = True
# Standard (plain sRGB), NOT AgX: this sprite must meet the painted scene's
# flat-sRGB palette, and AgX desaturated v2's gold to chalky ivory.
sc.view_settings.view_transform = "Standard"
try:
    sc.view_settings.look = "None"
except TypeError:
    pass
sc.render.filepath = str(RENDER_DIR / "wexley_mirror_raw.png")
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_DIR / "wexley_mirror.blend"))
bpy.ops.render.render(write_still=True)
print("RENDERED", sc.render.filepath)
