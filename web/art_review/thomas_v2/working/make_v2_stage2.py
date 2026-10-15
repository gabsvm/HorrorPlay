"""Stage2 V2 deltas: quality, materials, silhouette, face, wardrobe."""
import os
P = os.path.join('web', 'art_review', 'thomas_v2', 'scripts', 'render_candidate.py')
s = open(P, 'r', encoding='utf-8').read().replace('\r\n', '\n')

def rep(old, new):
    global s
    assert s.count(old) == 1, f"pattern {s.count(old)}x: {old[:90]!r}"
    s = s.replace(old, new)

# --- render quality: sharper, cleaner alpha ---
rep("scn.render.filter_size = 0.9", "scn.render.filter_size = 0.7  # V2: sharper edges, less halo at pack")
rep("scn.eevee.taa_render_samples = 16", "scn.eevee.taa_render_samples = 64  # V2: cleaner silhouette alpha")

# --- material response: deeper cavities, stronger rim volume ---
rep("ao = N.new('ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = 0.3",
    "ao = N.new('ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = 0.28  # V2")
rep("aok = N.new('ShaderNodeMapRange'); aok.inputs['To Min'].default_value = 0.3",
    "aok = N.new('ShaderNodeMapRange'); aok.inputs['To Min'].default_value = 0.22  # V2 deeper folds")
rep("pw = N.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.use_clamp = True; pw.inputs[1].default_value = 0.8",
    "pw = N.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.use_clamp = True; pw.inputs[1].default_value = 0.7  # V2 more volume")
rep("rim = N.new('ShaderNodeMapRange'); rim.inputs['To Min'].default_value = 0.5",
    "rim = N.new('ShaderNodeMapRange'); rim.inputs['To Min'].default_value = 0.42  # V2 stronger edge")

# --- smoother solids ---
rep("def lathe(prof, seg=14, sx=1.0, sy=1.0):", "def lathe(prof, seg=24, sx=1.0, sy=1.0):  # V2: smoother silhouette")
rep("def capsule(L, r0, r1, k=4):", "def capsule(L, r0, r1, k=6):  # V2: smoother caps")
rep("def limb(name, parent, L, r0, r1, color, seg=12, sy=1.0):",
    "def limb(name, parent, L, r0, r1, color, seg=16, sy=1.0):  # V2")

# --- legs: same planting, sturdier boots with sole/heel/toe ---
rep("""    obj(f'shaft_{side}', lathe(capsule(0.11, 0.048, 0.047), 12), C['boots'], ankle, (0, 0, 0.1))
    boot = lathe([(0.0, 0.0), (0.012, 0.03), (0.04, 0.047), (0.12, 0.049), (0.2, 0.04), (0.235, 0.025), (0.245, 0.0)], 12)
    obj(f'boot_{side}', ([(z - 0.06, y2 * 0.95, -x * 0.85 - 0.035) for x, y2, z in boot[0]], boot[1]), C['boots'], ankle)""",
"""    obj(f'shaft_{side}', lathe(capsule(0.11, 0.05, 0.049), 16), C['boots'], ankle, (0, 0, 0.1))
    boot = lathe([(0.0, 0.0), (0.012, 0.032), (0.04, 0.05), (0.12, 0.052), (0.2, 0.043), (0.235, 0.027), (0.245, 0.0)], 20)
    obj(f'boot_{side}', ([(z - 0.06, y2 * 0.95, -x * 0.85 - 0.035) for x, y2, z in boot[0]], boot[1]), C['boots'], ankle)
    # V2: sole, heel block and toe cap read at game size
    obj(f'sole_{side}', lathe([(0.0, 0.0), (0.0, 0.052), (-0.018, 0.055), (-0.02, 0.0)], 16), '#0b0a09', ankle, (0.1, 0, -0.048), (0, 0.06, 0))
    obj(f'toecap_{side}', lathe(capsule(0.03, 0.045, 0.04), 10), shaded(C['boots'], 1.25), ankle, (0.155, 0, -0.028))""")

# --- arms: broader shoulders, pads, cuff buttons ---
rep("""for side, y in (('near', -0.255 * B), ('far', 0.255 * B)):
    sh = empty(f'shoulder_{side}', spine, (-0.005, y, SHOULDER - 0.05))
    limb(f'upper_{side}', sh, UPPER, 0.068 * B ** 0.5, 0.056 * B ** 0.5, C['coat'])
    el = empty(f'elbow_{side}', sh, (0, 0, -UPPER))
    fore = C['skin'] if C['rolled'] else C['coat']
    limb(f'fore_{side}', el, FORE - 0.02, 0.056 * B ** 0.5, 0.05 * B ** 0.5, fore)""",
"""for side, y in (('near', -0.262), ('far', 0.262)):  # V2: wider shoulder line
    sh = empty(f'shoulder_{side}', spine, (-0.005, y, SHOULDER - 0.045))
    obj(f'pad_{side}', lathe(capsule(0.07, 0.075, 0.062), 16), C['coat'], sh, (0, 0, 0.01))  # V2 shoulder cap
    limb(f'upper_{side}', sh, UPPER, 0.074, 0.06, C['coat'])  # V2: heavier sleeve
    el = empty(f'elbow_{side}', sh, (0, 0, -UPPER))
    fore = C['skin'] if C['rolled'] else C['coat']
    limb(f'fore_{side}', el, FORE - 0.02, 0.06, 0.053, fore)
    obj(f'fold_{side}', lathe(capsule(0.03, 0.062, 0.058), 12), shaded(C['coat'], 0.82), el, (0, 0, 0.015))  # V2 elbow fold""")

rep("""    wr = empty(f'wrist_{side}', el, (0, 0, -FORE))
    obj(f'hand_{side}', lathe(capsule(0.05, 0.032, 0.027), 10, 1.0, 0.75), hand_col, wr)""",
"""    obj(f'cuffbtn_{side}', lathe(capsule(0.004, 0.011, 0.011), 8), '#c9a24a', el, (0.055, 0, -0.245))  # V2 brass cuff
    wr = empty(f'wrist_{side}', el, (0, 0, -FORE))
    obj(f'glovecuff_{side}', lathe([(0.0, 0.036), (-0.025, 0.04), (-0.028, 0.0)], 14), shaded(hand_col, 1.2), wr, (0, 0, 0.028))  # V2 glove gauntlet
    obj(f'hand_{side}', lathe(capsule(0.055, 0.034, 0.028), 12, 1.0, 0.78), hand_col, wr)
    obj(f'thumb_{side}', lathe(capsule(0.03, 0.012, 0.01), 8), hand_col, wr, (0.03, -0.02 if side == 'near' else 0.02, -0.045), (0, 0.5, 0))""")

# --- lantern: larger, warmer glass, inner flame core ---
rep("""def build_lantern(name, parent, loc):
    lan = empty(name, parent, loc)
    lan.scale = (1.25, 1.25, 1.25)""",
"""def build_lantern(name, parent, loc):
    lan = empty(name, parent, loc)
    lan.scale = (1.38, 1.38, 1.38)  # V2: lantern reads at 100 px""")
rep("""    obj(name + 'glass', lathe([(-0.078, 0.04), (-0.165, 0.04)], 4), '#5a4628', lan, rot=(0, 0, PI / 4), smooth=False, glass=True)""",
"""    obj(name + 'glass', lathe([(-0.078, 0.043), (-0.165, 0.043)], 6), '#6a4c22', lan, rot=(0, 0, PI / 4), smooth=False, glass=True)
    obj(name + 'flame', lathe(capsule(0.035, 0.016, 0.01), 8), '#ffca7a', lan, (0, 0, -0.12), smooth=False, glass=True)  # V2 lit core""")

open(P, 'w', encoding='utf-8', newline='\n').write(s)
print("stage2 ok", len(s))
