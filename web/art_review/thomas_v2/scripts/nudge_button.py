"""Round-trip proof: nudge top button in the .blend, or restore it.
Run: blender -b <blend> -P scripts/nudge_button.py -- <dx>
"""
import bpy, sys
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
dx = float(args[0]) if args else 0.0
o = bpy.data.objects.get('btn00.0')
assert o is not None
o.location.x += dx
bpy.ops.wm.save_mainfile()
print(f'btn00.0 x {"+" if dx >= 0 else ""}{dx} -> {o.location.x:.4f}')
