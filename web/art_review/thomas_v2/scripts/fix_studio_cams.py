"""Fix studio camera framing inside the saved master (look at full body)."""
import bpy
from mathutils import Vector

TARGET = Vector((0.0, 0.0, 1.0))
POS = {
    'STUDIO_front': (0.3, -6.4, 1.3),
    'STUDIO_threequarter': (3.8, -5.0, 1.6),
    'STUDIO_side': (6.4, -0.7, 1.2),
    'STUDIO_back': (-0.5, 6.4, 1.5),
}
for name, loc in POS.items():
    cam = bpy.data.objects.get(name)
    if not cam:
        print('missing', name)
        continue
    cam.location = loc
    d = TARGET - Vector(loc)
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = 55
    cam.data.clip_start = 0.1
    cam.data.clip_end = 50
    print('aimed', name, tuple(round(v, 2) for v in loc))
bpy.ops.wm.save_mainfile()
print('master cameras fixed + saved')
