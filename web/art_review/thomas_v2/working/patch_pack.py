import os
P = os.path.join('web', 'art_review', 'thomas_v2', 'scripts', 'pack_candidate.py')
s = open(P, encoding='utf-8').read().replace('\r\n', '\n')
old = """src, who = sys.argv[1], sys.argv[2]
dst = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'assets', 'models', who)
os.makedirs(dst, exist_ok=True)"""
new = """# ISOLATED: never writes to web/assets/models/. Default destination is the benchmark folder.
# usage: python pack_candidate.py RENDER_DIR [DST_DIR]
src = sys.argv[1]
_this = os.path.dirname(os.path.abspath(__file__))
_default_dst = os.path.normpath(os.path.join(_this, '..', 'exports', 'game_candidate'))
dst = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else _default_dst
assert 'art_review/thomas_v2' in dst.replace(os.sep, '/'), f"refusing destination outside benchmark: {dst}"
who = 'thomas'
os.makedirs(dst, exist_ok=True)"""
assert s.count(old) == 1
s = s.replace(old, new)
s = s.replace('"""Compress what figure.py rendered into the game\'s model files.',
              '"""Compress the V2 candidate render into game-format atlases (ISOLATED).')
open(P, 'w', encoding='utf-8', newline='\n').write(s)
print("pack patch ok")
