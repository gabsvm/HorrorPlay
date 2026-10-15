"""Write MANIFEST.json with real checksums/sizes. System python."""
import hashlib, json, os
from PIL import Image

W = os.path.join('web', 'art_review', 'thomas_v2')
ROOT = os.path.abspath(W)

def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()

def entry(rel):
    p = os.path.join(ROOT, rel)
    e = {'path': rel.replace(os.sep, '/'), 'bytes': os.path.getsize(p),
         'sha256': sha(p)}
    if rel.endswith(('.png', '.gif')):
        im = Image.open(p)
        e['pixels'] = list(im.size)
    return e

files = ['README.md', 'REPORT.md',
         'source/Thomas_Ashgrove_V2.blend', 'source/thomas_v2.glb',
         'scripts/render_candidate.py', 'scripts/pack_candidate.py',
         'scripts/verify_candidate.py', 'scripts/build_master.py',
         'scripts/render_studio.py', 'scripts/verify_blend.py',
         'scripts/fix_studio_cams.py', 'scripts/swap_cam_names.py',
         'exports/game_candidate/albedo.png', 'exports/game_candidate/normal.png',
         'exports/game_candidate/model.json',
         'comparison/01_hero_modelo_antes_despues.png',
         'comparison/02_silueta_antes_despues.png',
         'comparison/03_gameplay_640x360_antes_despues.png',
         'comparison/04_gameplay_1280x720_pixelado.png',
         'comparison/05_animacion_contact_sheet.png',
         'comparison/06_rostro_manos_ropa.png',
         'comparison/07_topologia_materiales.png',
         'comparison/08_galeria_general.png',
         'comparison/preview_idle_walk.gif']
samples = sorted(os.listdir(os.path.join(ROOT, 'exports', 'sample_frames')))
files += [f'exports/sample_frames/{s}' for s in samples]
manifest = {
    'benchmark': 'thomas_v2',
    'base': {'branch': 'reboot/web-el-huesped',
             'head': 'ffe46380b12def737c968fdd9f035ce093561b55',
             'head_date': '2026-10-15',
             'production_untouched': True,
             'git_status': '?? web/art_review/ (solo nuevos, sin modificar)'},
    'toolchain': {'blender': '5.2.2 LTS', 'build_hash': 'd13f752e3b9c',
                  'python': '3.14.6', 'pillow': '12.3.0', 'numpy': '2.5.3',
                  'render': 'BLENDER_EEVEE, taa_render_samples=64, Raw, film_transparent'},
    'contract': {'frames': 122, 'anims': 19, 'height': 206, 'cols': 10, 'ns': 0.5,
                 'cand_box': {'w': 144, 'h': 242, 'ax': 66, 'ay': 223},
                 'prod_box': {'w': 134, 'h': 236, 'ax': 60, 'ay': 219}},
    'files': [entry(f) for f in files],
}
json.dump(manifest, open(os.path.join(ROOT, 'MANIFEST.json'), 'w'), indent=1)
print('manifest files:', len(manifest['files']))
print('total bytes:', sum(e['bytes'] for e in manifest['files']))
