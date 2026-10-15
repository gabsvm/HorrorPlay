"""Stage4 V2 deltas: coat furniture + pose dynamics."""
import os
P = os.path.join('web', 'art_review', 'thomas_v2', 'scripts', 'render_candidate.py')
s = open(P, 'r', encoding='utf-8').read().replace('\r\n', '\n')

def rep(old, new):
    global s
    assert s.count(old) == 1, f"pattern {s.count(old)}x: {old[:90]!r}"
    s = s.replace(old, new)

# --- coat cloth: deeper folds for readability ---
rep("            fold = 1 + 0.045 * f * math.sin(7 * ang + 1.3) + 0.02 * f * math.sin(13 * ang)",
    "            fold = 1 + 0.06 * f * math.sin(7 * ang + 1.3) + 0.028 * f * math.sin(13 * ang)  # V2 deeper folds")

# --- buttons: brass, larger; placket + lapels + collar + seams (V2 furniture) ---
rep("""btn_col = '#b9a36a' if C['buttons'] == 'brass' else '#14151a'
cols = (0.0, 0.05) if C['buttons'] == 'double' else (0.0,)
buttons = [] if skirt else [(obj(f'btn{i}{c}', lathe(capsule(0.002, 0.011, 0.011), 6), btn_col, root), i, c) for c in cols for i in range(4)]""",
"""btn_col = '#c9a24a'  # V2: brass always for Thomas, reads at game size
cols = (0.0,)
buttons = [] if skirt else [(obj(f'btn{i}{c}', lathe(capsule(0.003, 0.013, 0.013), 8), btn_col, root), i, c) for c in cols for i in range(4)]
# V2 furniture: placket, lapels, raised collar ring, shoulder seams, pocket flap, hem band
placket = obj('placket', lathe(capsule(0.5, 0.022, 0.02), 8, 0.6, 1.0), shaded(C['coat'], 0.88), root, (0, 0, 0))
lapel_near = obj('lapel_near', lathe([(0.0, 0.0), (0.0, 0.055), (-0.1, 0.06), (-0.11, 0.0)], 4, 0.7, 1.0), C['lapel'], root, (0, 0, 0), smooth=False)
lapel_far = obj('lapel_far', lathe([(0.0, 0.0), (0.0, 0.055), (-0.1, 0.06), (-0.11, 0.0)], 4, 0.7, 1.0), shaded(C['lapel'], 0.9), root, (0, 0, 0), smooth=False)
collar_ring = obj('collar_ring', lathe([(0.09, 0.0), (0.085, 0.075), (0.06, 0.1), (0.045, 0.1), (0.04, 0.0)], 20), shaded(C['coat'], 0.75), root, (0, 0, 0))
seam_near = obj('seam_near', lathe(capsule(0.09, 0.008, 0.008), 6), shaded(C['coat'], 0.8), root, (0, 0, 0))
seam_far = obj('seam_far', lathe(capsule(0.09, 0.008, 0.008), 6), shaded(C['coat'], 0.8), root, (0, 0, 0))
pocket = obj('pocket', lathe([(0.0, 0.0), (0.0, 0.05), (-0.015, 0.052), (-0.015, 0.0)], 4, 1.0, 0.8), shaded(C['coat'], 0.85), root, (0, 0, 0), smooth=False)
hemband = obj('hemband', lathe([(0.0, 0.0), (-0.02, 0.01)], 20), shaded(C['coat'], 0.8), root, (0, 0, 0))
V2_FURNITURE = (placket, lapel_near, lapel_far, collar_ring, seam_near, seam_far, pocket, hemband)""")

rep("""    def on_chest(zr, x, y):
        rx, rz = x * cl + zr * sl, -x * sl + zr * cl
        return (rx, y, rz + pz)
    front = max(r[2] for r in RINGS if 0.2 < r[0] < 0.62)
    for b, i, c in buttons:
        b.location = on_chest(0.48 - i * 0.12, front * 0.98 - c * 0.3, -0.02 - c)""",
"""    def on_chest(zr, x, y):
        rx, rz = x * cl + zr * sl, -x * sl + zr * cl
        return (rx, y, rz + pz)
    front = max(r[2] for r in RINGS if 0.2 < r[0] < 0.62)
    for b, i, c in buttons:
        b.location = on_chest(0.48 - i * 0.12, front * 0.98 - c * 0.3, -0.02 - c)
    # V2 furniture follows the chest
    try:
        placket.location = on_chest(0.3, front * 0.99, -0.02)
        placket.rotation_euler = (0, lean, 0)
        lapel_near.location = on_chest(0.58, front * 1.0, -0.055)
        lapel_near.rotation_euler = (0, lean + 0.28, 0.12)
        lapel_far.location = on_chest(0.58, front * 1.0, 0.055)
        lapel_far.rotation_euler = (0, lean + 0.28, -0.12)
        collar_ring.location = (math.sin(lean) * 0.68, 0, math.cos(lean) * 0.68 + pz)
        collar_ring.rotation_euler = (0, lean, 0)
        seam_near.location = on_chest(0.6, 0.1, -0.2)
        seam_near.rotation_euler = (3.14159 / 2, 0, 0)
        seam_far.location = on_chest(0.6, 0.1, 0.2)
        seam_far.rotation_euler = (3.14159 / 2, 0, 0)
        pocket.location = on_chest(0.3, front * 0.99, -0.14)
        pocket.rotation_euler = (0, lean, 0)
        hemband.location = (sway * 0.5, 0, HEM + pz + 0.01)
    except NameError:
        pass""")

# --- pose dynamics: weight, breath, swing (feet/head math untouched) ---
rep("    k = 0.42 + 0.22 * run", "    k = 0.5 + 0.24 * run  # V2: wider arm swing with weight")
rep("    br = math.sin(t * 1.7) * 0.8", "    br = math.sin(t * 1.7) * 1.0  # V2: deeper breath")
rep("    for s in arms.values():\n        s[0].location.z = SHOULDER - 0.05 + br * 0.004",
    "    for s in arms.values():\n        s[0].location.z = SHOULDER - 0.045 + br * 0.005  # V2: tense shoulders")
rep("    push = max(0.0, fa[0]) * 0.35 * w * U * stretch\n    trail = max(0.0, -fb[0]) * 0.3 * w * U * stretch",
    "    push = max(0.0, fa[0]) * 0.42 * w * U * stretch  # V2: coat answers the stride\n    trail = max(0.0, -fb[0]) * 0.36 * w * U * stretch")

open(P, 'w', encoding='utf-8', newline='\n').write(s)
print("stage4 ok", len(s))
