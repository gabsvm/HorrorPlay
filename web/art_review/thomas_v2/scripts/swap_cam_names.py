"""Swap STUDIO_front/side names so they match the pixels (front=+X facing)."""
import bpy
a = bpy.data.objects.get('STUDIO_front')
b = bpy.data.objects.get('STUDIO_side')
assert a and b
a.name = 'STUDIO_tmp'
b.name = 'STUDIO_front'
bpy.data.objects['STUDIO_tmp'].name = 'STUDIO_side'
print([(o.name, tuple(round(v, 2) for v in o.location)) for o in bpy.data.objects if o.type == 'CAMERA'])
bpy.ops.wm.save_mainfile()
print('names swapped + saved')
