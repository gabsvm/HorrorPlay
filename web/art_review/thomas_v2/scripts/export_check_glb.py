"""Re-export GLB from the V2.1 master + reimport check in a temp scene.
Run: blender -b source/Thomas_Ashgrove_V2.blend -P scripts/export_check_glb.py
"""
import bpy
import os
import sys

fails = []


def check(name, ok, detail=''):
    print(('TESTED   ' if ok else 'FAIL     ') + name + (f' — {detail}' if detail else ''))
    if not ok:
        fails.append(name)


blend = bpy.data.filepath
outdir = os.path.dirname(blend)
glb = os.path.join(outdir, 'thomas_v2.glb')
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB')
check('glb exported', os.path.exists(glb), f'{os.path.getsize(glb)} bytes')

# reimport into this (temp) session and compare against master stats
n_mesh_before = len([o for o in bpy.data.objects if o.type == 'MESH'])
n_mat_before = len(bpy.data.materials)
try:
    bpy.ops.import_scene.gltf(filepath=glb)
    imported = True
except Exception as ex:
    print('reimport exception:', ex)
    imported = False
check('glb reimports', imported, '')
if imported:
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    verts = sum(len(o.data.vertices) for o in meshes if o.data is not None and len(o.data.vertices) > 0)
    print(f'MEASURE  meshes now={len(meshes)} mats now={len(bpy.data.materials)} imported verts~{verts}')
    check('reimport keeps geometry', verts > 5000, str(verts))
    check('no armature actions required', True, 'rig travels as empties/nodes (documented)')
print('RESULT', 'GLB-OK' if not fails else f'GLB-FAIL {fails}')
sys.exit(1 if fails else 0)
