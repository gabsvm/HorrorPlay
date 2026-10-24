"""Render one imported Scenario GLB to a transparent proof image.

Run from Blender (not system Python):
  blender -b --factory-startup -P web/tools/scenario3d/render_glb.py -- INPUT.glb PROOF.png

This renders into a staging path. build.py crops and scales the proof, then
installs only after explicit --install. No scene/game state is edited here.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if len(args) != 2:
    raise SystemExit("Usage: blender -b -P render_glb.py -- INPUT.glb PROOF.png")

source, output = map(os.path.abspath, args)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=source)

mesh_objects = [o for o in bpy.context.scene.objects if o.type == "MESH"]
if not mesh_objects:
    raise RuntimeError("No meshes imported from " + source)

def world_bounds(objects):
    points = [o.matrix_world @ Vector(v) for o in objects for v in o.bound_box]
    return (
        Vector((min(v.x for v in points), min(v.y for v in points), min(v.z for v in points))),
        Vector((max(v.x for v in points), max(v.y for v in points), max(v.z for v in points))),
    )

bpy.context.view_layer.update()
bmin, bmax = world_bounds(mesh_objects)
dims = bmax - bmin
if max(dims) <= 0 or not all(math.isfinite(v) for v in dims):
    raise RuntimeError("Invalid GLB bounding box")
# For rendering only: one world unit is approximately one metre.
scale = 1.55 / max(dims)
center = (bmin + bmax) * 0.5

root = bpy.data.objects.new("scenario_normalized_root", None)
bpy.context.scene.collection.objects.link(root)
original_roots = [o for o in bpy.context.scene.objects if o is not root and o.parent is None]
for obj in original_roots:
    matrix = obj.matrix_world.copy()
    obj.parent = root
    obj.matrix_world = matrix
root.scale = (scale,) * 3
root.location = (-center.x * scale, -center.y * scale, -bmin.z * scale)
bpy.context.view_layer.update()

bottom, top = world_bounds(mesh_objects)
height = max(top.z - bottom.z, 0.05)
target = Vector((0, 0, height * 0.52))
cam = bpy.data.objects.new("scenario_ortho_cam", bpy.data.cameras.new("scenario_cam"))
bpy.context.scene.collection.objects.link(cam)
cam.location = (2.8, -7.5, target.z + 2.2)
direction = target - cam.location
cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
cam.data.type = "ORTHO"
cam.data.ortho_scale = 2.6
bpy.context.scene.camera = cam

world = bpy.data.worlds.new("Scenario neutral night")
bpy.context.scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.65, 0.65, 0.7, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.65
for name, xyz, energy, size in [
    ("warm_key", (3, -4, 5), 480, 4.0),
    ("cool_fill", (-4, -2, 3), 175, 5.0),
]:
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = xyz
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()

scene = bpy.context.scene
for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES"):
    try:
        scene.render.engine = engine
        break
    except TypeError:
        continue
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.filepath = output
scene.camera.data.lens = 50
scene.view_settings.view_transform = "Standard"
try:
    scene.view_settings.look = "Medium High Contrast"
except TypeError:
    scene.view_settings.look = "Medium High Contrast" if bpy.app.version[0] < 4 else "AgX - Medium High Contrast"
except ValueError:
    pass
bpy.ops.render.render(write_still=True)
print("SCENARIO_RENDER_OK:", output, flush=True)
