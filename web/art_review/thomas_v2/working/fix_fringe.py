import os
P = os.path.join('web', 'art_review', 'thomas_v2', 'scripts', 'render_candidate.py')
s = open(P, encoding='utf-8').read().replace('\r\n', '\n')
old = """        for f in range(3):
            obj(f'fringe{i}_{f}', lathe(capsule(0.035, 0.007, 0.005), 6), shaded(C['scarf'], 0.9), spine, (0.218 - i * 0.014 + ln * 0.92, y - 0.018 + f * 0.018, SHOULDER - 0.03 - ln), (0, 0.12, 0))"""
new = """        for f in range(3):
            obj(f'fringe{i}_{f}', lathe(capsule(0.035, 0.007, 0.005), 6), shaded(C['scarf'], 0.9), spine, (0.218 - i * 0.014, y - 0.018 + f * 0.018, SHOULDER - 0.045 - ln), (0, 0.12, 0))  # V2 fixed at scarf tip"""
assert s.count(old) == 1
s = s.replace(old, new)
open(P, 'w', encoding='utf-8', newline='\n').write(s)
print("fringe fix ok")
