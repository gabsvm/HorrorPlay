"""Multiply btn00.0 scale (persists: pose code sets locations, never scales).
Run: blender -b <blend> -P scripts/set_btn_scale.py -- <k>
"""
import bpy, sys
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
k = float(args[0]) if args else 1.0
o = bpy.data.objects.get('btn00.0')
assert o is not None
o.scale = tuple(v * k for v in o.scale)
bpy.ops.wm.save_mainfile()
print(f'btn00.0 scale x{k} -> {tuple(round(v, 4) for v in o.scale)}')
