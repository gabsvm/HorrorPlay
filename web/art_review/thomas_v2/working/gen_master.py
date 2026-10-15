"""Generate scripts/build_master.py from render_candidate.py (cut before frame loop)."""
import os
SRC = os.path.join('web', 'art_review', 'thomas_v2', 'scripts', 'render_candidate.py')
DST = os.path.join('web', 'art_review', 'thomas_v2', 'scripts', 'build_master.py')
s = open(SRC, encoding='utf-8').read().replace('\r\n', '\n')
cut = s.find('frames = []')
assert cut > 0
head = s[:cut]
# drop the OUT/ONLY render-dir arg handling tail? keep (harmless) but master takes blend path
tail = '''
# ------------------------------------------------------------------ master: pose, organize, studio, save
import sys as _sys
MASTER_OUT = os.path.abspath(_sys.argv[_sys.argv.index('--') + 1] if '--' in _sys.argv and len(_sys.argv) > _sys.argv.index('--') + 1 else os.path.join(_THIS_DIR, '..', 'source', 'Thomas_Ashgrove_V2.blend'))
os.makedirs(os.path.dirname(MASTER_OUT), exist_ok=True)

# neutral showcase pose: standing idle, breath mid-cycle, facing export yaw
pose(t=0.0)
bpy.context.view_layer.update()

def ensure_coll(name):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
        scn.collection.children.link(c)
    return c

BODY = ensure_coll('BODY'); CLOTH = ensure_coll('CLOTHING'); ACC = ensure_coll('ACCESSORIES')
RIG = ensure_coll('RIG'); LIGHTS = ensure_coll('LIGHTS'); CAMS = ensure_coll('CAMERAS')

def move(o, coll):
    for c in list(o.users_collection):
        try:
            c.objects.unlink(o)
        except Exception:
            pass
    try:
        coll.objects.link(o)
    except Exception:
        pass

for o in list(coll.objects):
    n = o.name.lower()
    if o.type == 'EMPTY':
        move(o, RIG)
    elif n.startswith(('skull', 'jaw', 'chin', 'stubble', 'nose', 'brow', 'mouth', 'lips', 'ear', 'socket', 'eye', 'lid', 'burn', 'hair', 'nape', 'neckm', 'hand', 'thumb', 'cheek')):
        move(o, BODY)
    elif n.startswith(('coat', 'placket', 'lapel', 'collar', 'seam', 'pocket', 'hem', 'scarf', 'knot', 'fringe', 'upper', 'fore', 'fold', 'cuff', 'pad', 'glove', 'thigh', 'shin', 'shaft', 'boot', 'sole', 'toe')):
        move(o, CLOTH)
    else:
        move(o, ACC)
# keep the export ortho camera in CAMERAS
try:
    move(cam, CAMS)
except Exception:
    pass

# ---- studio: 4 showcase cameras + export-equivalent ortho already present ----
def studio_cam(name, loc, rot):
    c = bpy.data.objects.new(name, bpy.data.cameras.new(name))
    CAMS.objects.link(c)
    c.location = loc
    c.rotation_euler = rot
    c.data.type = 'PERSP'
    c.data.lens = 85
    return c

studio_cam('STUDIO_front', (0.2, -4.2, 1.15), (1.35, 0, 0))
studio_cam('STUDIO_threequarter', (2.6, -3.2, 1.35), (1.3, 0, 0.68))
studio_cam('STUDIO_side', (4.2, -0.4, 1.1), (1.45, 0, 1.5708))
studio_cam('STUDIO_back', (-0.4, 4.2, 1.3), (1.35, 0, 3.1416))

def area(name, color, energy, loc, size=2.0):
    l = bpy.data.objects.new(name, bpy.data.lights.new(name, 'AREA'))
    LIGHTS.objects.link(l)
    l.location = loc
    l.data.color = color
    l.data.energy = float(energy)
    l.data.size = size
    return l

area('KEY_amber', (1.0, 0.72, 0.42), 900, (2.5, -3.0, 3.0))
area('FILL_blue', (0.35, 0.45, 0.62), 350, (-3.0, -1.5, 2.0))
area('RIM_cool', (0.6, 0.7, 0.85), 500, (-1.0, 3.5, 2.5))
# note for the next artist
txt = bpy.data.texts.new('THOMAS_V2_NOTES') if 'THOMAS_V2_NOTES' not in bpy.data.texts else bpy.data.texts['THOMAS_V2_NOTES']
txt.clear()
txt.write("THOMAS ASHGROVE V2 master\\nSame construction/pose code as scripts/render_candidate.py.\\nAnim rig = RIG empties; reproduce any animation by running render_candidate.py.\\nExport ortho camera = 'cam' (FW=216 FH=270 AX=108 AY=249).\\nStudio cameras: STUDIO_* (perspective, showcase only).\\n")
print('MASTER pose set; collections:', [(c.name, len(c.objects)) for c in (BODY, CLOTH, ACC, RIG, LIGHTS, CAMS)], flush=True)
bpy.ops.wm.save_as_mainfile(filepath=MASTER_OUT)
print('MASTER saved', MASTER_OUT, flush=True)
# optional GLB next to the blend
glb = os.path.join(os.path.dirname(MASTER_OUT), 'thomas_v2.glb')
try:
    bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB')
    print('GLB saved', glb, flush=True)
except Exception as ex:
    print('GLB export skipped:', ex, flush=True)
'''
open(DST, 'w', encoding='utf-8', newline='\n').write(head + tail)
print("build_master written", len(head + tail))
