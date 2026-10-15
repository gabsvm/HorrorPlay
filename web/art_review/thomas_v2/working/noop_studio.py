import os
P = 'web/art_review/thomas_v2/scripts/render_studio.py'
s = open(P, encoding='utf-8').read().replace('\r\n', '\n')
old = """studio_cam('STUDIO_front', (0.2, -4.2, 1.15), (1.35, 0, 0))
studio_cam('STUDIO_threequarter', (2.6, -3.2, 1.35), (1.3, 0, 0.68))
studio_cam('STUDIO_side', (4.2, -0.4, 1.1), (1.45, 0, 1.5708))
studio_cam('STUDIO_back', (-0.4, 4.2, 1.3), (1.35, 0, 3.1416))"""
assert old not in s  # cameras live in build_master.py, not here; patch there instead
print("noop")
