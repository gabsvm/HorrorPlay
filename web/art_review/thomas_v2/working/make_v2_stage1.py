"""Build render_candidate.py V2 from the figure.py copy. Run once with system python."""
import os
P = os.path.join('web', 'art_review', 'thomas_v2', 'scripts', 'render_candidate.py')
s = open(P, 'r', encoding='utf-8').read()
s = s.replace('\r\n', '\n')
orig_len = len(s)

def rep(old, new):
    global s
    assert s.count(old) == 1, f"pattern found {s.count(old)}x: {old[:80]!r}"
    s = s.replace(old, new)

# E1: header + imports + V2 params + frozen framing
rep('''"""A character of the cast as a 3D figure, rendered to sprite atlases for the game.

usage: blender -b --factory-startup -P tools/blender/figure.py -- OUT_DIR WHO [anim,anim...]''',
'''"""Thomas Ashgrove V2 -- candidate renderer (BENCHMARK, isolated).

Fork of web/tools/blender/figure.py (HEAD ffe46380) with V2 art deltas. NEVER writes to
web/assets/models/. Destination is always inside web/art_review/thomas_v2/.

usage: blender -b --factory-startup -P web/art_review/thomas_v2/scripts/render_candidate.py -- OUT_DIR [anim,anim...]''')

rep('''sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cast import CAST  # noqa: E402

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(ARGS[0])
WHO = ARGS[1]
ONLY = ARGS[2].split(',') if len(ARGS) > 2 else None
os.makedirs(os.path.join(OUT, 'frames'), exist_ok=True)''',
'''_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _THIS_DIR)
sys.path.insert(0, os.path.join(_THIS_DIR, '..', '..', '..', 'tools', 'blender'))
try:
    from cast import CAST  # noqa: E402
    _BASE_THOMAS = dict(CAST.get('thomas', {}))
except Exception:
    _BASE_THOMAS = {}

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(ARGS[0])
WHO = 'thomas'
ONLY = ARGS[1].split(',') if len(ARGS) > 1 else None
os.makedirs(os.path.join(OUT, 'frames'), exist_ok=True)''')

rep('''C = {**DEF, **CAST[WHO]}''',
'''V2 = dict(
    h=206, hat='bowler', hatColor='#0f1114', coat='#2e3238', coatLen=0.88, flare=1.34, build=1.0,
    skin='#a78a6f', trousers='#141518', boots='#171310', skirt=False, apron=None,
    scarf='#5c1a15', cane=False, lantern=True, lanternOn=True, stoop=0,
    hair='#17110c', cape=False, beard=None, moustache=None, sideburns=True, collarUp=True,
    buttons='single', belt=False, tails=False, rolled=False, patches=False,
    shawl=None, waistcoat=None, chain=False, number=False, bustle=False, lapel='#d9cfba',
    notebook=True, gloves='#38301f', walk=True, run=True, reach=True, poses=None, base=None,
    idle=12, lying=None, eyesClosed=False, cover=None, talk=True,
    gait=(('walk', 1.0, 16), ('walk3', 0.75, 12), ('walkh', 0.5, 12), ('walkq', 0.25, 12)),
    runFrames=12,
)
C = {**DEF, **_BASE_THOMAS, **V2}
C['poses'] = ['kneel', 'take', 'inspect', 'recoil', 'clutch', 'write', 'sit', 'reach']''')

rep('''B = C['build']
if C['lying']:
    FW, FH = round(300 * SC), round(120 * SC)
    AX, AY = FW // 2, FH - round(14 * SC)   # the middle of the body, on the ground
else:
    FW, FH = round(210 * SC * (1 + (B - 1) * 0.6)), round(262 * SC)
    AX, AY = FW // 2, FH - round(20 * SC)   # where the point between the feet lands in a frame''',
'''B = 1.0  # framing build frozen; visual width comes from the meshes, not the frame
# FROZEN framing = thomas baseline so V2 aligns pixel-fair with production (216x270, anchor 108,249)
FW, FH, AX, AY = 216, 270, 108, 249''')

open(P, 'w', encoding='utf-8', newline='\n').write(s)
print(f"stage1 ok {orig_len} -> {len(s)}")
