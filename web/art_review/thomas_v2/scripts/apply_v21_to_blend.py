"""Idempotent V2.1 readability pass on a *V2.0* Blender master.

The distributed master already contains this pass. Re-running the command must
never multiply eye, hand, or button scales. It detects previously-upgraded
masters by their material colors (older V2.1 masters have no version marker).
Run only when upgrading a fresh V2.0 master; rendering never calls this script.
"""
import bpy

MARKER = 'thomas_visual_revision'
REVISION = 'v2.1'

def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1.0,)

def material_color(name):
    m = bpy.data.materials.get(name)
    assert m is not None and m.node_tree is not None, f'missing material {name}'
    for node in m.node_tree.nodes:
        if node.type == 'GROUP':
            for inp in node.inputs:
                if inp.name == 'Color':
                    return tuple(inp.default_value)
    raise AssertionError(f'missing Color input in {name}')

COLORS = {
    '#241a14': '#160e0a',
    '#866e59': '#75614e',
    '#685645': '#544538',
    '#433a25': '#4c412a',
    '#25282d': '#202327',
}

scene = bpy.context.scene
if scene.get(MARKER) == REVISION:
    print('SKIP: V2.1 already applied (scene marker); no changes or save')
elif all(max(abs(a - b) for a, b in zip(material_color(src), hexrgb(dst))) < 1e-4
         for src, dst in COLORS.items()):
    # The master committed at a373cae already contains the changes but was
    # saved before we introduced a version marker. Adopt it without growing it.
    scene[MARKER] = REVISION
    bpy.ops.wm.save_mainfile()
    print('SKIP: legacy V2.1 detected from colors; stamped marker only')
else:
    # For a fresh V2.0 master, require all five original colors before scaling.
    # An inconsistent/partially upgraded file must not be modified silently.
    for src, dst in COLORS.items():
        assert max(abs(a - b) for a, b in zip(material_color(src), hexrgb(src))) < 1e-4, (
            f'partial/unknown material state {src}; restore the V2.0 master first'
        )

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
        assert changed >= 1, f'no Color input in {mat_name}'

    def grow(obj_name, k):
        o = bpy.data.objects.get(obj_name)
        assert o is not None, f'missing object {obj_name}'
        o.scale = tuple(v * k for v in o.scale)

    for original, upgraded in COLORS.items():
        recolor(original, upgraded)
    for name, amount in (
        ('eye-1', 1.25), ('eye1', 1.25),
        ('browhair-1', 1.3), ('browhair1', 1.3),
        ('burn-1', 1.25), ('burn1', 1.25),
        ('hand_near', 1.15), ('hand_far', 1.15),
        ('thumb_near', 1.15), ('thumb_far', 1.15),
        ('btn00.0', 1.3), ('btn10.0', 1.3),
        ('btn20.0', 1.3), ('btn30.0', 1.3),
        ('pad_near', 1.12), ('pad_far', 1.12),
    ):
        grow(name, amount)
    scene[MARKER] = REVISION
    bpy.ops.wm.save_mainfile()
    print('V2.1 applied once; scene marked')
