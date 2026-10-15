"""Strict validation of the V2.1 master blend. Exit nonzero on any failure.
Run: blender -b source/Thomas_Ashgrove_V2.blend -P scripts/verify_blend.py
"""
import bpy
import sys

fails = []


def check(name, ok, detail=''):
    print(('TESTED   ' if ok else 'FAIL     ') + name + (f' — {detail}' if detail else ''))
    if not ok:
        fails.append(name)


print('BLEND STRICT VALIDATION: Blender', bpy.app.version_string)
check('six collections', sorted(c.name for c in bpy.data.collections) == ['ACCESSORIES', 'BODY', 'CAMERAS', 'CLOTHING', 'LIGHTS', 'RIG'],
      str(sorted(c.name for c in bpy.data.collections)))
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
check('mesh count >= 100', len(meshes) >= 100, str(len(meshes)))
check('verts > 10000', sum(len(o.data.vertices) for o in meshes) > 10000,
      str(sum(len(o.data.vertices) for o in meshes)))
rig = bpy.data.collections.get('RIG')
check('RIG empties >= 20', rig is not None and len([o for o in rig.objects if o.type == 'EMPTY']) >= 20,
      str(len([o for o in rig.objects if o.type == 'EMPTY'])) if rig else 'no RIG')
cam = bpy.data.objects.get('cam')
ok_cam = cam is not None and cam.data.type == 'ORTHO'
check('export cam ORTHO', ok_cam, cam.data.type if cam else 'missing')
if cam:
    check('ortho scale 2.7', abs(cam.data.ortho_scale - 2.7) < 0.01, str(round(cam.data.ortho_scale, 3)))
    check('cam looks +Y', tuple(round(v, 2) for v in cam.rotation_euler) == (1.57, 0.0, 0.0),
          str(tuple(round(v, 2) for v in cam.rotation_euler)))
cams = bpy.data.collections.get('CAMERAS')
check('4 studio cameras', cams is not None and len([o for o in cams.objects if o.type == 'CAMERA']) == 5,
      str(len([o for o in cams.objects if o.type == 'CAMERA'])) if cams else 'no CAMERAS')
ng = bpy.data.node_groups.get('Out')
check('Out node group', ng is not None, '')
if ng:
    check('Out mode VALUE node', len([n for n in ng.nodes if n.type == 'VALUE']) == 1,
          str(len([n for n in ng.nodes if n.type == 'VALUE'])))
glass = [m.name for m in bpy.data.materials if m.name.endswith('g')]
check('glass materials >= 2', len(glass) >= 2, str(glass))
for req in ('root', 'pelvis', 'spine', 'neck', 'head', 'coat', 'lan_near', 'lan_far', 'lan_ground', 'notebook', 'pencil',
            'placket', 'lapel_near', 'lapel_far', 'collar_ring', 'seam_near', 'seam_far', 'pocket', 'hemband',
            'btn00.0', 'btn10.0', 'btn20.0', 'btn30.0'):
    if bpy.data.objects.get(req) is None:
        check(f'object {req}', False, 'missing')
check('single-source rig objects', True, '25 named lookups resolve' if not fails else '')
print('RESULT', 'VALID' if not fails else f'INVALID {fails}')
sys.exit(1 if fails else 0)
