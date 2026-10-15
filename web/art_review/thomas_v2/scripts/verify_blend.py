"""Validate the V2 master blend: geometry, materials, cameras. Run inside Blender."""
import bpy, os, sys
print("BLEND VALIDATION")
print("blender:", bpy.app.version_string)
print("collections:", [c.name for c in bpy.data.collections])
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
print("mesh objects:", len(meshes))
verts = sum(len(o.data.vertices) for o in meshes)
polys = sum(len(o.data.polygons) for o in meshes)
print("verts:", verts, "polys:", polys)
print("materials:", len(bpy.data.materials), [m.name[:24] for m in list(bpy.data.materials)[:12]])
print("cameras:", [o.name for o in bpy.data.objects if o.type == 'CAMERA'])
print("lights:", [o.name for o in bpy.data.objects if o.type == 'LIGHT'])
print("empties:", len([o for o in bpy.data.objects if o.type == 'EMPTY']))
# check ortho export cam framing
cam = bpy.data.objects.get('cam')
if cam:
    print("export cam:", cam.data.type, cam.data.ortho_scale, tuple(round(v, 3) for v in cam.location))
print("VALID" if meshes and verts > 1000 else "INVALID")
