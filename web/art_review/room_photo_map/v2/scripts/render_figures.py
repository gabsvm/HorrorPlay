"""El Huesped T2 photo v2: render figure plates from the studio master.

Run inside Blender 5.2:
  blender -b source/photo_studio_v2.blend --python render_figures.py -- --variant A
  (or --variant all; --out defaults to ../work/plates relative to this script)

For each variant the script poses the head pivots, hides the other boy,
renders elder and younger separately with transparent film, and writes a
JSON sidecar with the head-centre, hair-top/chin bracket and feet pixels
(projected with world_to_camera_view, so compose_v2.py can scale by head
size and pin the legacy anchors exactly). All paths resolve relative to
this script.
"""
import argparse
import json
import math
from pathlib import Path

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

HERE = Path(__file__).resolve()
TASK_V2 = HERE.parent.parent

# variant poses: head euler (XYZ deg) + light trim. All three stay solemn
# and frontal: the canon "Nat laughed here" beat lives in the younger boy's
# baked minimal lip-smile, never in an open laughing pose (no teeth ever).
# A: classic frontal studio. B: younger head tipped faintly up toward the
# camera, elder head inclined a breath toward him. C: same pose as A but a
# harder side key (deeper socket/nose modelling shadows).
POSES = {
    'A': dict(e_head=(0, 0, 0), y_head=(0, 0, 0), key=150.0, fill=18.0),
    'B': dict(e_head=(0, 0, -3), y_head=(-3, 0, 4), key=155.0, fill=24.0),
    'C': dict(e_head=(0, 0, 0), y_head=(0, 0, 0), key=210.0, fill=10.0),
}


def apply_pose(variant):
    pose = POSES[variant]
    sc = bpy.context.scene
    for name, vals in (('E_HEAD', pose['e_head']), ('Y_HEAD', pose['y_head'])):
        o = bpy.data.objects.get(name)
        if o is not None:
            o.rotation_mode = 'XYZ'
            o.rotation_euler = tuple(math.radians(v) for v in vals)
    key = bpy.data.objects.get('KEY')
    if key is not None:
        key.data.energy = pose['key']
    fill = bpy.data.objects.get('FILL')
    if fill is not None:
        fill.data.energy = pose['fill']
    bpy.context.view_layer.update()


def set_visible(prefix_on):
    for o in bpy.context.scene.objects:
        if o.name.startswith(('E_', 'Y_')):
            hide = not o.name.startswith(prefix_on + '_')
            o.hide_render = hide
            o.hide_viewport = hide
    bpy.context.view_layer.update()


def project(obj_name, world_point):
    sc = bpy.context.scene
    cam = sc.camera
    ndc = world_to_camera_view(sc, cam, Vector(world_point))
    w, h = sc.render.resolution_x, sc.render.resolution_y
    return [float(ndc.x * w), float((1.0 - ndc.y) * h)]


def sidecar(prefix, variant, out_json):
    skull = bpy.data.objects.get(prefix + '_skull')
    head_c = (skull.matrix_world @ Vector((0, 0, 0))).xyz if skull else Vector((0, 0, 1))
    x0 = float(bpy.context.scene.get('v2_elder_x0' if prefix == 'E' else 'v2_young_x0', 0.0))
    feet = Vector((x0, 0.01, 0.0))
    hand_o = bpy.data.objects.get('E_handR_palm')
    hand_w = (hand_o.matrix_world @ Vector((0, 0, 0))).xyz if hand_o else None
    hr = float(bpy.context.scene.get('v2_%s_hr' % prefix, 0.09))
    # hair-top / chin bracket: projected 3D points (not geometry), so the
    # compose side can scale by head size. The bracket carries a ~4 % inset
    # versus the tallest rendered hair, keeping the scrape margin.
    top = Vector((head_c.x, head_c.y, head_c.z + 1.38 * hr))
    bot = Vector((head_c.x, head_c.y, head_c.z - 1.02 * hr))
    data = {
        'variant': variant,
        'prefix': prefix,
        'head_px': project(prefix, head_c),
        'head_top_px': project(prefix, top),
        'head_bot_px': project(prefix, bot),
        'feet_px': project(prefix, feet),
        'hand_px': project(prefix, hand_w) if hand_w else None,
        'render_size': [bpy.context.scene.render.resolution_x, bpy.context.scene.render.resolution_y],
    }
    out_json.write_text(json.dumps(data, indent=1) + '\n')
    print('SIDECAR', prefix, data)
    return data


def render_one(prefix, variant, out_dir):
    set_visible(prefix)
    sc = bpy.context.scene
    sc.render.filepath = str(out_dir / ('%s_%s.png' % (variant, prefix)))
    bpy.ops.render.render(write_still=True)
    return sidecar(prefix, variant, out_dir / ('%s_%s.json' % (variant, prefix)))


def main():
    import sys
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    variant = args[args.index('--variant') + 1] if '--variant' in args else 'all'
    out = Path(args[args.index('--out') + 1]) if '--out' in args else TASK_V2 / 'work' / 'plates'
    out.mkdir(parents=True, exist_ok=True)
    variants = ['A', 'B', 'C'] if variant == 'all' else [variant]
    for v in variants:
        apply_pose(v)
        for prefix in ('E', 'Y'):
            render_one(prefix, v, out)


main()
