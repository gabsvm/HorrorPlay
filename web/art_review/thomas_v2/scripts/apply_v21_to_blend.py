"""V2.1 readability pass, applied TO the master .blend (single source).
Run: blender -b source/Thomas_Ashgrove_V2.blend -P scripts/apply_v21_to_blend.py
Edits meshes/materials in place and saves. No canon/wardrobe change.
"""
import bpy

def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1.0,)

def recolor(mat_name, new_hex):
    m = bpy.data.materials.get(mat_name)
    assert m is not None, f'missing material {mat_name}'
    changed = 0
    for n in m.node_tree.nodes:
        if n.type == 'GROUP':
            for inp in n.inputs:
                if inp.name == 'Color':
                    inp.default_value = hexrgb(new_hex)
                    changed += 1
    print(f'recolor {mat_name} -> {new_hex} ({changed} group inputs)')
    assert changed >= 1, f'no Color input in {mat_name}'

def grow(obj_name, k):
    o = bpy.data.objects.get(obj_name)
    assert o is not None, f'missing object {obj_name}'
    o.scale = tuple(v * k for v in o.scale)
    print(f'scale {obj_name} x{k}')

# face contrast: darker eyes/sockets/mouth line (readable at ~100 px, no caricature)
recolor('#241a14', '#160e0a')   # eyes
recolor('#866e59', '#75614e')   # eye sockets
recolor('#685645', '#544538')   # mouth line
# hands: lighter cuffs vs coat, bigger hands
recolor('#433a25', '#4c412a')   # glove gauntlets
# cloth shadow lines deeper (hem, seams)
recolor('#25282d', '#202327')
# feature sizes
for n in ('eye-1', 'eye1'):
    grow(n, 1.25)
for n in ('browhair-1', 'browhair1'):
    grow(n, 1.3)
for n in ('burn-1', 'burn1'):
    grow(n, 1.25)
for n in ('hand_near', 'hand_far', 'thumb_near', 'thumb_far'):
    grow(n, 1.15)
for n in ('btn00.0', 'btn10.0', 'btn20.0', 'btn30.0'):
    grow(n, 1.3)
for n in ('pad_near', 'pad_far'):
    grow(n, 1.12)

bpy.ops.wm.save_mainfile()
print('V2.1 applied + saved')
