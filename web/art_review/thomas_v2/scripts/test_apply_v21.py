"""Headless logic test for the one-time Blender edit.

Blender 5.2 may not be installed on the machine running this check. This tests
idempotence of the edit code with a minimal bpy double; it does NOT validate
opening or rendering the real .blend.
Run: python web/art_review/thomas_v2/scripts/test_apply_v21.py
"""
import runpy
import sys
import types
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCRIPT = HERE / "apply_v21_to_blend.py"
colors = {
    '#241a14': '#160e0a',
    '#866e59': '#75614e',
    '#685645': '#544538',
    '#433a25': '#4c412a',
    '#25282d': '#202327',
}
names = [
    'eye-1', 'eye1', 'browhair-1', 'browhair1', 'burn-1', 'burn1',
    'hand_near', 'hand_far', 'thumb_near', 'thumb_far',
    'btn00.0', 'btn10.0', 'btn20.0', 'btn30.0', 'pad_near', 'pad_far',
]


def rgba(h):
    return tuple(int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)) + (1.0,)


def test(legacy_already_applied=False):
    mats = {}
    for old, new in colors.items():
        inp = types.SimpleNamespace(name='Color', default_value=rgba(new if legacy_already_applied else old))
        group = types.SimpleNamespace(type='GROUP', inputs=[inp])
        mats[old] = types.SimpleNamespace(node_tree=types.SimpleNamespace(nodes=[group]))
    scales = {
        'eye': 1.25, 'browhair': 1.3, 'burn': 1.25, 'hand': 1.15,
        'thumb': 1.15, 'btn': 1.3, 'pad': 1.12,
    }
    objs = {}
    for n in names:
        multiplier = next((v for prefix, v in scales.items() if n.startswith(prefix)), 1)
        obj_scale = multiplier if legacy_already_applied else 1
        objs[n] = types.SimpleNamespace(scale=(obj_scale,) * 3)
    scene = {}
    saves = []
    fake = types.SimpleNamespace(
        context=types.SimpleNamespace(scene=scene),
        data=types.SimpleNamespace(materials=mats, objects=objs),
        ops=types.SimpleNamespace(wm=types.SimpleNamespace(save_mainfile=lambda: saves.append('save'))),
    )
    previous = sys.modules.get('bpy')
    sys.modules['bpy'] = fake
    try:
        runpy.run_path(str(SCRIPT))
        after_first = {k: v.scale for k, v in objs.items()}
        first_saves = len(saves)
        runpy.run_path(str(SCRIPT))
        after_second = {k: v.scale for k, v in objs.items()}
    finally:
        if previous is None:
            del sys.modules['bpy']
        else:
            sys.modules['bpy'] = previous
    assert after_first == after_second, 'repeating V2.1 changed mesh scale'
    assert len(saves) == first_saves, 'second run saved unnecessarily'
    assert scene.get('thomas_visual_revision') == 'v2.1'
    assert first_saves == 1
    for n, v in after_first.items():
        multiplier = next((value for prefix, value in scales.items() if n.startswith(prefix)), 1)
        assert max(abs(a - multiplier) for a in v) < 1e-6, (n, v)
    print('PASS idempotent', 'legacy master' if legacy_already_applied else 'fresh V2.0')


test()
test(legacy_already_applied=True)
