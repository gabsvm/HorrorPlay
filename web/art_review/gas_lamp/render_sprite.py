"""Render the existing Victorian gas-lamp GLB into reproducible game sprites.

Blender 4.2: blender -b --python web/art_review/gas_lamp/render_sprite.py

The 128x384 PNG is meant for ~320 logical-pixel lamp height; the 2x PNG is
for high-DPI viewing. No part of the game or source model is modified.
"""

import hashlib
import json
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector


HERE = Path(__file__).resolve().parent
DEFAULT_SOURCE = HERE / "source" / "farol_victoriano.glb"
ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
SOURCE = Path(ARGS[0]).resolve() if ARGS else DEFAULT_SOURCE
OUT_2X = HERE / "gas_lamp_2x.png"
OUT_1X = HERE / "gas_lamp.png"
QA_PATH = HERE / "qa_metrics.json"
W, H = 256, 768


def area_light(name, location, energy, color, size, target, size_y=None):
    datablock = bpy.data.lights.new(name, "AREA")
    datablock.energy = energy
    datablock.color = color
    datablock.shape = "DISK" if size_y is None else "RECTANGLE"
    if size_y is None:
        datablock.size = size
    else:
        datablock.size = size
        datablock.size_y = size_y
    # Eliminate harsh rectangular reflection across lantern panes.
    if hasattr(datablock, "visible_glossy"):
        datablock.visible_glossy = False
    obj = bpy.data.objects.new(name, datablock)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()
    return obj


def bounds_for_meshes(meshes):
    pts = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    return Vector([min(p[i] for p in pts) for i in range(3)]), Vector([max(p[i] for p in pts) for i in range(3)])


def tune_materials():
    material_log = []
    for mat in bpy.data.materials:
        if not mat.use_nodes:
            continue
        name = mat.name.lower()
        if "glass" in name or "vidrio" in name:
            # The physically refractive GLB panes reflect studio rectangles as
            # almost opaque white at game resolution. A thin amber overlay on
            # actual transparency leaves the burner visible, avoids clipping,
            # and composites properly over gameplay backgrounds.
            nodes = mat.node_tree.nodes
            nodes.clear()
            output = nodes.new("ShaderNodeOutputMaterial")
            transparent = nodes.new("ShaderNodeBsdfTransparent")
            tint = nodes.new("ShaderNodeEmission")
            tint.inputs["Color"].default_value = (0.35, 0.12, 0.025, 1.0)
            tint.inputs["Strength"].default_value = 0.8
            mix = nodes.new("ShaderNodeMixShader")
            mix.inputs[0].default_value = 0.38
            mat.node_tree.links.new(transparent.outputs[0], mix.inputs[1])
            mat.node_tree.links.new(tint.outputs[0], mix.inputs[2])
            mat.node_tree.links.new(mix.outputs[0], output.inputs["Surface"])
            material_log.append(mat.name)
            continue
        for node in mat.node_tree.nodes:
            if node.type != "BSDF_PRINCIPLED":
                continue
            if "flame" in name or "llama" in name:
                node.inputs["Emission Color"].default_value = (1.0, 0.46, 0.09, 1.0)
                node.inputs["Emission Strength"].default_value = 2.4
            elif "castiron" in name or "hierro" in name:
                # The source material's procedural charcoal color is not baked
                # into the GLB: glTF imports this channel nearly white.
                # Reconstruct a dark cast-iron PBR approximation for sprites.
                node.inputs["Base Color"].default_value = (0.055, 0.069, 0.071, 1.0)
                node.inputs["Metallic"].default_value = 0.55
                node.inputs["Roughness"].default_value = 0.57
        material_log.append(mat.name)
    return material_log


def read_png_metrics(path):
    img = bpy.data.images.load(str(path), check_existing=False)
    px = np.asarray(img.pixels[:], dtype=np.float32).reshape((img.size[1], img.size[0], 4))
    # Blender image pixels are bottom-origin. Store bbox in top-origin image coords.
    a = px[:, :, 3]
    ys, xs = np.where(a > 0.10)
    if xs.size == 0:
        raise RuntimeError(f"No visible pixels in {path.name}")
    bbox = [int(xs.min()), int(img.size[1] - 1 - ys.max()), int(xs.max()), int(img.size[1] - 1 - ys.min())]
    rgb_visible = px[:, :, :3][a > 0.5]
    luminance = rgb_visible @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    values = {
        "resolution_px": list(img.size),
        "mode": "RGBA",
        "bbox_alpha_gt_0_1_xyxy": bbox,
        "margins_px_left_top_right_bottom": [bbox[0], bbox[1], int(img.size[0] - 1 - bbox[2]), int(img.size[1] - 1 - bbox[3])],
        "fully_transparent_fraction": round(float((a < 0.001).mean()), 4),
        "visible_fraction_alpha_gt_0_1": round(float((a > 0.1).mean()), 4),
        "partially_transparent_pixel_count": int(((a > 0.001) & (a < 0.999)).sum()),
        "visible_luminance_p99_linear": round(float(np.percentile(luminance, 99)), 4),
        "visible_luminance_max_linear": round(float(luminance.max()), 4),
    }
    bpy.data.images.remove(img)
    return values


def main():
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Missing benchmark GLB: {SOURCE}")
    HERE.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        raise RuntimeError(f"GLB imported no meshes: {SOURCE}")
    for obj in bpy.context.scene.objects:
        if obj.type in {"LIGHT", "CAMERA"}:
            bpy.data.objects.remove(obj, do_unlink=True)

    pmin, pmax = bounds_for_meshes(meshes)
    center = (pmin + pmax) * 0.5
    height = pmax.z - pmin.z
    if not 2.5 < height < 4.5:
        raise RuntimeError(f"Unexpected height {height:.3f}m: maybe wrong GLB / transform")
    materials = tune_materials()

    camera_data = bpy.data.cameras.new("Sprite_Orthographic")
    camera = bpy.data.objects.new("Sprite_Orthographic", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (center.x + 5.0, center.y - 11.5, center.z + 3.0)
    camera.rotation_euler = (center - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 3.97
    bpy.context.scene.camera = camera

    area_light("Key_soft_moon", (center.x - 2.8, center.y - 4.2, pmin.z + 3.45),
               520, (0.64, 0.78, 1.0), 3.3, (center.x, center.y, pmin.z + 1.6))
    area_light("Warm_side", (center.x + 2.0, center.y - 1.3, pmin.z + 3.4),
               310, (1.0, 0.57, 0.24), 2.0, (center.x, center.y, pmin.z + 2.35))
    area_light("Cold_rim", (center.x + 0.5, center.y + 2.1, pmin.z + 2.5),
               420, (0.34, 0.47, 0.67), 1.8, (center.x, center.y, pmin.z + 1.4))
    area_light("Pedestal_fill", (center.x - 1.5, center.y - 3.0, pmin.z + 0.75),
               95, (0.82, 0.76, 0.66), 1.8, (center.x, center.y, pmin.z + 0.5))

    world = bpy.data.worlds.new("Night_fill")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.075, 0.095, 0.13, 1.0)
    bg.inputs["Strength"].default_value = 0.35
    scene = bpy.context.scene
    scene.world = world
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 48
    scene.cycles.use_denoising = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = True
    scene.render.resolution_x = W
    scene.render.resolution_y = H
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "AgX"
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0
    scene.render.filepath = str(OUT_2X)
    print(f"SOURCE={SOURCE} SHA256={hashlib.sha256(SOURCE.read_bytes()).hexdigest()}", flush=True)
    print(f"IMPORTED_MESHES={len(meshes)} BOUNDS={list(pmin)}..{list(pmax)} HEIGHT={height:.3f}", flush=True)
    bpy.ops.render.render(write_still=True)

    image = bpy.data.images.load(str(OUT_2X), check_existing=False)
    image.scale(W // 2, H // 2)
    image.filepath_raw = str(OUT_1X)
    image.file_format = "PNG"
    image.save()
    bpy.data.images.remove(image)

    metrics = {
        "asset": "Victorian gas street lamp, full length",
        "source_glb": str(SOURCE),
        "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        "blender_version": bpy.app.version_string,
        "orthographic": True,
        "camera_ortho_scale_m": camera_data.ortho_scale,
        "source_bounds_m": {"min": [round(float(v), 5) for v in pmin], "max": [round(float(v), 5) for v in pmax]},
        "source_height_m": round(float(height), 5),
        "imported_mesh_count": len(meshes),
        "imported_materials": materials,
        "render_engine": "Cycles",
        "samples": scene.cycles.samples,
        "sprite_1x": read_png_metrics(OUT_1X),
        "sprite_2x": read_png_metrics(OUT_2X),
    }
    QA_PATH.write_text(json.dumps(metrics, indent=2, ensure_ascii=False), encoding="utf-8")
    print("SPRITE_QA=" + json.dumps(metrics, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
