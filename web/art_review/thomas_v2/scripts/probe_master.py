"""Probe V2 master: material names/users + key object names/scales. Read-only."""
import bpy
print("MATERIALS:")
for m in bpy.data.materials:
    n = 0
    for o in bpy.data.objects:
        try:
            mats = o.data.materials if hasattr(o.data, 'materials') else []
        except Exception:
            mats = []
        n += sum(1 for s in mats if s is not None and s.name == m.name)
    print(f"  {m.name!r} slots={n}")
print("KEY OBJECTS:")
for o in bpy.data.objects:
    n = o.name
    if n.startswith(('eye', 'lid', 'browhair', 'mouth', 'burn', 'hand', 'thumb', 'glovecuff', 'cuffbtn', 'btn', 'pad', 'hemband', 'socket', 'lips')):
        print(f"  {n} type={o.type} scale={tuple(round(v, 3) for v in o.scale)} loc={tuple(round(v, 3) for v in o.location)}")
