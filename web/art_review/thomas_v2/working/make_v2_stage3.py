"""Stage3 V2 deltas: face, hat, scarf, coat furniture, pose dynamics."""
import os
P = os.path.join('web', 'art_review', 'thomas_v2', 'scripts', 'render_candidate.py')
s = open(P, 'r', encoding='utf-8').read().replace('\r\n', '\n')

def rep(old, new):
    global s
    assert s.count(old) == 1, f"pattern {s.count(old)}x: {old[:90]!r}"
    s = s.replace(old, new)

# --- head/face: character, not flat ---
rep("""sk, hc = C['skin'], C['hair']
obj('skull', lathe(capsule(0.06, 0.098, 0.088), 16, 1.06, 0.9), sk, head, (0, 0, 0.055))
obj('jaw', lathe(capsule(0.04, 0.07, 0.05), 14, 1.0, 0.85), sk, head, (0.03, 0, -0.035))
obj('nose', lathe([(0.0, 0.0), (-0.004, 0.012), (-0.03, 0.016), (-0.036, 0.0)], 8), sk, head, (0.098, 0, 0.0), (0, -(PI / 2 - 0.3), 0))
obj('brow', lathe(capsule(0.06, 0.016, 0.016), 8), sk, head, (0.082, -0.03, 0.03), (PI / 2, 0, 0))
obj('lips', lathe(capsule(0.03, 0.008, 0.008), 6), shaded(sk, 0.78), head, (0.09, -0.015, -0.045), (PI / 2, 0, 0))
for s in (-1, 1):
    obj(f'ear{s}', lathe(capsule(0.03, 0.022, 0.018), 8, 1.0, 0.45), sk, head, (-0.01, s * 0.085, 0.02))
    obj(f'eye{s}', lathe(capsule(0.002, 0.012, 0.012), 8), shaded(sk, 0.75) if C['eyesClosed'] else '#2a1e18', head, (0.085, s * 0.034, 0.012))
    if C['sideburns']:
        obj(f'burn{s}', lathe(capsule(0.035, 0.013, 0.011), 8, 1.0, 0.5), hc, head, (0.03, s * 0.084, 0.01))""",
"""sk, hc = C['skin'], C['hair']
# V2 skull: longer, gaunter; cheek hollows; stronger chin; tired human eyes
obj('skull', lathe(capsule(0.062, 0.1, 0.089), 22, 1.07, 0.9), sk, head, (0, 0, 0.055))
obj('cheek_near', lathe(capsule(0.03, 0.028, 0.02), 10, 1.0, 0.6), shaded(sk, 0.92), head, (0.055, -0.055, -0.005), (0.3, 0, 0))
obj('cheek_far', lathe(capsule(0.03, 0.028, 0.02), 10, 1.0, 0.6), shaded(sk, 0.88), head, (0.055, 0.055, -0.005), (-0.3, 0, 0))
obj('jaw', lathe(capsule(0.042, 0.072, 0.05), 20, 1.0, 0.85), sk, head, (0.032, 0, -0.035))
obj('chin', lathe(capsule(0.018, 0.032, 0.024), 12), shaded(sk, 0.95), head, (0.062, 0, -0.062))
obj('stubble', lathe(capsule(0.03, 0.071, 0.052), 18, 1.0, 0.86), '#6f5c48', head, (0.033, 0, -0.038))
obj('nose_bridge', lathe(capsule(0.035, 0.014, 0.012), 10), shaded(sk, 0.97), head, (0.095, 0, 0.012), (0, -0.35, 0))
obj('nose', lathe([(0.0, 0.0), (-0.004, 0.013), (-0.032, 0.017), (-0.038, 0.0)], 12), sk, head, (0.1, 0, -0.002), (0, -(PI / 2 - 0.3), 0))
obj('brow', lathe(capsule(0.062, 0.018, 0.016), 12), shaded(sk, 0.94), head, (0.082, -0.03, 0.032), (PI / 2, 0, 0))
obj('mouth_line', lathe(capsule(0.028, 0.006, 0.006), 8), shaded(sk, 0.62), head, (0.088, -0.012, -0.048), (PI / 2, 0, 0))
obj('lips', lathe(capsule(0.028, 0.009, 0.008), 8), shaded(sk, 0.78), head, (0.089, -0.015, -0.052), (PI / 2, 0, 0))
for s in (-1, 1):
    obj(f'ear{s}', lathe(capsule(0.034, 0.026, 0.02), 12, 1.0, 0.45), sk, head, (-0.012, s * 0.086, 0.02))
    obj(f'earfold{s}', lathe(capsule(0.018, 0.009, 0.007), 8, 1.0, 0.4), shaded(sk, 0.85), head, (-0.008, s * 0.088, 0.022))
    obj(f'socket{s}', lathe(capsule(0.004, 0.02, 0.017), 10), shaded(sk, 0.8), head, (0.084, s * 0.034, 0.014))
    obj(f'eye{s}', lathe(capsule(0.003, 0.0145, 0.013), 12), shaded(sk, 0.7) if C['eyesClosed'] else '#241a14', head, (0.088, s * 0.034, 0.013))
    obj(f'lid{s}', lathe(capsule(0.02, 0.007, 0.006), 8), shaded(sk, 0.9), head, (0.086, s * 0.034, 0.026), (PI / 2, 0, 0))
    obj(f'browhair{s}', lathe(capsule(0.032, 0.008, 0.007), 8), hc, head, (0.088, s * 0.036, 0.042), (PI / 2 + s * 0.12, 0, 0))
    if C['sideburns']:
        obj(f'burn{s}', lathe(capsule(0.05, 0.016, 0.012), 10, 1.0, 0.5), hc, head, (0.028, s * 0.085, 0.005))""")

rep("""obj('hair', lathe(capsule(0.05, 0.095, 0.075), 14, 0.92, 0.94), hc, head, (-0.03, 0, 0.06))""",
"""obj('hair', lathe(capsule(0.055, 0.099, 0.078), 20, 0.94, 0.95), hc, head, (-0.032, 0, 0.062))
    obj('hair_side', lathe(capsule(0.04, 0.06, 0.05), 14, 0.9, 0.9), shaded(hc, 1.15), head, (-0.045, 0, 0.075))
    obj('nape', lathe(capsule(0.04, 0.05, 0.035), 12), hc, head, (-0.075, 0, 0.0))""")

# --- bowler: taller crown, wider brim, bow ---
rep("""if C['hat'] == 'bowler':
    hat.scale = (1.06, 1.06, 1.05)
    obj('crown', lathe([(0.135, 0.0), (0.13, 0.05), (0.112, 0.088), (0.065, 0.11), (0.0, 0.112)], 18, 1.1, 0.95), hk, hat)
    obj('band', lathe([(0.02, 0.114), (-0.005, 0.115)], 18, 1.1, 0.95), shaded(hk, 1.4), hat)
    obj('brim', lathe([(0.0, 0.112), (-0.01, 0.135), (0.002, 0.148), (-0.008, 0.15), (-0.02, 0.135), (-0.026, 0.0)], 18, 1.12, 0.96), hk, hat)""",
"""if C['hat'] == 'bowler':
    hat.scale = (1.08, 1.08, 1.07)  # V2: reads in 0.5-1 s at game size
    obj('crown', lathe([(0.148, 0.0), (0.143, 0.055), (0.122, 0.098), (0.07, 0.122), (0.0, 0.124)], 24, 1.1, 0.95), hk, hat)
    obj('band', lathe([(0.022, 0.124), (-0.006, 0.125)], 24, 1.1, 0.95), shaded(hk, 1.45), hat)
    obj('bow', lathe(capsule(0.02, 0.018, 0.014), 8, 0.7, 1.0), shaded(hk, 1.3), hat, (-0.1, 0.09, 0.02))
    obj('brim', lathe([(0.0, 0.122), (-0.011, 0.148), (0.002, 0.163), (-0.009, 0.165), (-0.022, 0.148), (-0.028, 0.0)], 24, 1.13, 0.97), hk, hat)
    obj('brim_edge', lathe([(0.0, 0.163), (-0.009, 0.165)], 24, 1.13, 0.97), shaded(hk, 0.8), hat)""")

# --- scarf: bigger knot, longer ends, fringe ---
rep("""if C['scarf']:
    obj('scarf', lathe(capsule(0.07, 0.07, 0.05), 12, 0.9, 1.1), C['scarf'], spine, (0.1, 0, SHOULDER + 0.04))
    for i, (y, ln) in enumerate(((-0.035, 0.22), (0.03, 0.18))):
        obj(f'scarf_end{i}', lathe(capsule(ln, 0.034, 0.03), 10, 0.45, 1.0), C['scarf'], spine, (0.215 * B - i * 0.012, y, SHOULDER - 0.02), (0, 0.1, 0))""",
"""if C['scarf']:
    obj('scarf', lathe(capsule(0.075, 0.082, 0.058), 18, 0.92, 1.12), C['scarf'], spine, (0.1, 0, SHOULDER + 0.04))
    obj('knot', lathe(capsule(0.05, 0.045, 0.036), 14, 0.9, 1.0), shaded(C['scarf'], 0.85), spine, (0.155, -0.01, SHOULDER + 0.005), (0, 0.35, 0))
    for i, (y, ln) in enumerate(((-0.04, 0.26), (0.032, 0.21))):
        obj(f'scarf_end{i}', lathe(capsule(ln, 0.04, 0.034), 14, 0.48, 1.0), C['scarf'], spine, (0.218 - i * 0.014, y, SHOULDER - 0.03), (0, 0.1, 0))
        for f in range(3):
            obj(f'fringe{i}_{f}', lathe(capsule(0.035, 0.007, 0.005), 6), shaded(C['scarf'], 0.9), spine, (0.218 - i * 0.014 + ln * 0.92, y - 0.018 + f * 0.018, SHOULDER - 0.03 - ln), (0, 0.12, 0))""")

open(P, 'w', encoding='utf-8', newline='\n').write(s)
print("stage3 ok", len(s))
