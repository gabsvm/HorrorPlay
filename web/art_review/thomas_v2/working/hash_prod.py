import hashlib
files = ['web/assets/models/thomas/albedo.png', 'web/assets/models/thomas/normal.png',
         'web/assets/models/thomas/model.json', 'web/src/engine/model.js', 'web/src/engine/actor.js',
         'web/src/engine/renderer.js', 'web/src/engine/game.js', 'web/tools/blender/figure.py',
         'web/tools/blender/cast.py', 'web/tools/blender/pack.py']
for f in files:
    print(hashlib.sha256(open(f, 'rb').read()).hexdigest()[:12], f)
