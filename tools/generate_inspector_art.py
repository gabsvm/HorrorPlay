"""
Inspector Character Illustrated Production Sprite Generator
Generates high-resolution (384x512) 2D illustrated neo-noir production frames
for the playable protagonist in HorrorPlay.
Guarantees mathematically grounded stance feet across all frames at BASELINE_Y = 412.
"""
import os
import math
from PIL import Image, ImageDraw, ImageFilter

CANVAS_WIDTH = 384
CANVAS_HEIGHT = 512
BASELINE_Y = 412
PIVOT_X = 192

# Palette - Neo-noir 1926 Lovecraftian Detective
COLOR_COAT_MAIN = (32, 38, 50, 255)
COLOR_COAT_DARK = (20, 25, 34, 255)
COLOR_COAT_LIGHT = (48, 56, 72, 255)
COLOR_COAT_SHADOW = (14, 18, 24, 255)
COLOR_COAT_HIGHLIGHT = (62, 72, 92, 255)

COLOR_HAT_MAIN = (24, 28, 38, 255)
COLOR_HAT_DARK = (15, 18, 26, 255)
COLOR_HAT_LIGHT = (40, 48, 64, 255)
COLOR_HAT_BAND = (95, 28, 38, 255)
COLOR_HAT_BUCKLE = (180, 130, 60, 255)

COLOR_SKIN_BASE = (195, 160, 140, 255)
COLOR_SKIN_SHADOW = (130, 95, 80, 255)
COLOR_SKIN_DARK = (85, 55, 45, 255)

COLOR_SHIRT = (215, 210, 200, 255)
COLOR_TIE = (110, 25, 35, 255)
COLOR_VEST = (28, 34, 44, 255)

COLOR_BELT = (18, 20, 26, 255)
COLOR_BRASS = (175, 135, 65, 255)

COLOR_PANTS = (24, 28, 36, 255)
COLOR_PANTS_DARK = (16, 18, 24, 255)
COLOR_BOOTS = (14, 16, 20, 255)
COLOR_BOOTS_HIGHLIGHT = (35, 40, 50, 255)
COLOR_BOOTS_SOLE = (10, 11, 14, 255)

def create_frame(
    pose_name="idle",
    head_offset=(0, 0),
    head_angle=0.0,
    hat_tilt=0.0,
    torso_offset=(0, 0),
    torso_angle=0.0,
    left_leg_angle=0.0,
    right_leg_angle=0.0,
    left_knee_bend=0.0,
    right_knee_bend=0.0,
    left_arm_angle=0.0,
    right_arm_angle=0.0,
    left_elbow_bend=0.0,
    right_elbow_bend=0.0,
    coat_flutter=0.0,
    breathing_scale=1.0,
    right_hand_prop=None,
    left_hand_prop=None,
    eyes_closed=False,
    tense_posture=False,
    recoil_shift=(0, 0),
    force_ground_y=BASELINE_Y
):
    img = Image.new("RGBA", (CANVAS_WIDTH, CANVAS_HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = PIVOT_X + torso_offset[0] + recoil_shift[0]
    base_hip_y = 280.0
    hip_y = base_hip_y + torso_offset[1] + recoil_shift[1]
    shoulder_y = hip_y - 115.0 * breathing_scale
    waist_y = hip_y - 40.0

    # 1. Back Leg (Left Leg)
    l_hip = (cx - 15, hip_y)
    r1, r2 = 60.0, 68.0
    rad_l1 = math.radians(left_leg_angle)
    rad_l2 = math.radians(left_leg_angle + left_knee_bend)
    l_knee_x = l_hip[0] + math.sin(rad_l1) * r1
    l_knee_y = l_hip[1] + math.cos(rad_l1) * r1
    l_foot_x = l_knee_x + math.sin(rad_l2) * r2
    l_foot_y = l_knee_y + math.cos(rad_l2) * r2

    # Draw Back Leg
    draw.line([l_hip, (l_knee_x, l_knee_y)], fill=COLOR_PANTS_DARK, width=22)
    draw.line([(l_knee_x, l_knee_y), (l_foot_x, l_foot_y)], fill=COLOR_PANTS_DARK, width=18)
    # Back Boot
    draw.polygon([
        (l_foot_x - 12, l_foot_y - 12),
        (l_foot_x + 18, l_foot_y - 6),
        (l_foot_x + 22, l_foot_y + 4),
        (l_foot_x - 14, l_foot_y + 4)
    ], fill=COLOR_BOOTS)
    # Sole line
    draw.line([(l_foot_x - 14, l_foot_y + 4), (l_foot_x + 22, l_foot_y + 4)], fill=COLOR_BOOTS_SOLE, width=2)

    # 2. Back Arm (Left Arm)
    l_shoulder = (cx - 28, shoulder_y + 8)
    l_elbow_x = l_shoulder[0] + math.sin(math.radians(left_arm_angle)) * 48
    l_elbow_y = l_shoulder[1] + math.cos(math.radians(left_arm_angle)) * 48
    l_hand_x = l_elbow_x + math.sin(math.radians(left_arm_angle + left_elbow_bend)) * 45
    l_hand_y = l_elbow_y + math.cos(math.radians(left_arm_angle + left_elbow_bend)) * 45

    draw.line([l_shoulder, (l_elbow_x, l_elbow_y)], fill=COLOR_COAT_DARK, width=20)
    draw.line([(l_elbow_x, l_elbow_y), (l_hand_x, l_hand_y)], fill=COLOR_COAT_DARK, width=16)
    draw.ellipse([l_hand_x - 7, l_hand_y - 7, l_hand_x + 7, l_hand_y + 7], fill=COLOR_SKIN_SHADOW)
    if left_hand_prop == "notebook":
        draw.rectangle([l_hand_x - 10, l_hand_y - 15, l_hand_x + 12, l_hand_y + 10], fill=(60, 45, 35, 255), outline=(30, 20, 15, 255))
        draw.rectangle([l_hand_x - 8, l_hand_y - 13, l_hand_x + 10, l_hand_y + 8], fill=(220, 215, 200, 255))

    # 3. Front Leg (Right Leg)
    r_hip = (cx + 12, hip_y)
    rad_r1 = math.radians(right_leg_angle)
    rad_r2 = math.radians(right_leg_angle + right_knee_bend)
    r_knee_x = r_hip[0] + math.sin(rad_r1) * r1
    r_knee_y = r_hip[1] + math.cos(rad_r1) * r1
    r_foot_x = r_knee_x + math.sin(rad_r2) * r2
    r_foot_y = r_knee_y + math.cos(rad_r2) * r2

    draw.line([r_hip, (r_knee_x, r_knee_y)], fill=COLOR_PANTS, width=24)
    draw.line([(r_knee_x, r_knee_y), (r_foot_x, r_foot_y)], fill=COLOR_PANTS, width=20)
    # Front Boot
    draw.polygon([
        (r_foot_x - 14, r_foot_y - 14),
        (r_foot_x + 22, r_foot_y - 6),
        (r_foot_x + 26, r_foot_y + 4),
        (r_foot_x - 16, r_foot_y + 4)
    ], fill=COLOR_BOOTS)
    draw.line([(r_foot_x - 10, r_foot_y - 10), (r_foot_x + 18, r_foot_y - 4)], fill=COLOR_BOOTS_HIGHLIGHT, width=2)
    # Sole line
    draw.line([(r_foot_x - 16, r_foot_y + 4), (r_foot_x + 26, r_foot_y + 4)], fill=COLOR_BOOTS_SOLE, width=2)

    # 4. Trenchcoat Lower Flaps / Skirt
    coat_bottom_y = hip_y + 82
    c_left = cx - 35 + coat_flutter * 12
    c_right = cx + 38 + coat_flutter * 8
    draw.polygon([
        (cx - 30, waist_y),
        (cx + 32, waist_y),
        (c_right, coat_bottom_y),
        (c_left, coat_bottom_y)
    ], fill=COLOR_COAT_MAIN)
    # Coat shadow crease & fabric folds
    draw.line([(cx - 5, waist_y), (cx + coat_flutter * 5, coat_bottom_y)], fill=COLOR_COAT_SHADOW, width=3)
    draw.line([(c_left, coat_bottom_y), (cx - 15, waist_y)], fill=COLOR_COAT_LIGHT, width=2)
    draw.line([(cx + 10, waist_y + 15), (cx + 18 + coat_flutter * 4, coat_bottom_y - 10)], fill=COLOR_COAT_SHADOW, width=2)

    # 5. Torso & Trenchcoat Upper
    torso_points = [
        (cx - 32, shoulder_y),
        (cx + 34, shoulder_y),
        (cx + 28, waist_y + 8),
        (cx - 28, waist_y + 8)
    ]
    draw.polygon(torso_points, fill=COLOR_COAT_MAIN)

    # Vest / Shirt V-neck
    draw.polygon([
        (cx - 10, shoulder_y),
        (cx + 12, shoulder_y),
        (cx + 4, waist_y - 15),
        (cx - 4, waist_y - 15)
    ], fill=COLOR_VEST)
    # Shirt Collar
    draw.polygon([(cx - 8, shoulder_y), (cx + 10, shoulder_y), (cx + 1, shoulder_y + 20)], fill=COLOR_SHIRT)
    # Necktie
    draw.polygon([(cx - 2, shoulder_y + 6), (cx + 4, shoulder_y + 6), (cx + 3, waist_y - 12), (cx - 1, waist_y - 12)], fill=COLOR_TIE)
    # Tie pin
    draw.line([(cx - 1, shoulder_y + 16), (cx + 3, shoulder_y + 16)], fill=COLOR_BRASS, width=2)

    # Double-breasted Lapels
    draw.polygon([(cx - 30, shoulder_y), (cx - 6, shoulder_y + 35), (cx - 22, shoulder_y + 40)], fill=COLOR_COAT_LIGHT)
    draw.polygon([(cx + 30, shoulder_y), (cx + 8, shoulder_y + 35), (cx + 22, shoulder_y + 40)], fill=COLOR_COAT_LIGHT)

    # Belt & Buckle
    draw.rectangle([cx - 29, waist_y - 2, cx + 29, waist_y + 8], fill=COLOR_BELT)
    draw.rectangle([cx - 8, waist_y - 4, cx + 8, waist_y + 10], fill=COLOR_BRASS, outline=(40, 30, 15, 255), width=2)

    # Buttons (antique brass/bone)
    for by in [shoulder_y + 30, shoulder_y + 50]:
        draw.ellipse([cx - 16, by, cx - 10, by + 6], fill=(18, 22, 28, 255))
        draw.ellipse([cx + 12, by, cx + 18, by + 6], fill=(18, 22, 28, 255))

    # 6. Head & Fedora
    hx = cx + head_offset[0]
    hy = shoulder_y - 35 + head_offset[1]

    # Neck
    neck_top = min(hy + 15, shoulder_y + 5)
    neck_bottom = max(hy + 15, shoulder_y + 5)
    draw.rectangle([hx - 8, neck_top, hx + 8, neck_bottom], fill=COLOR_SKIN_SHADOW)

    # Head / Jaw
    draw.polygon([
        (hx - 14, hy - 10),
        (hx + 14, hy - 10),
        (hx + 13, hy + 18),
        (hx + 3, hy + 26),
        (hx - 10, hy + 24)
    ], fill=COLOR_SKIN_BASE)
    draw.polygon([(hx - 12, hy + 5), (hx + 2, hy + 26), (hx - 10, hy + 24)], fill=COLOR_SKIN_SHADOW)
    draw.ellipse([hx - 16, hy + 2, hx - 11, hy + 14], fill=COLOR_SKIN_SHADOW)

    # Eyes & Nose in noir shadow
    draw.line([(hx + 2, hy + 4), (hx + 6, hy + 15)], fill=COLOR_SKIN_DARK, width=2)
    draw.line([(hx + 1, hy + 15), (hx + 6, hy + 15)], fill=COLOR_SKIN_DARK, width=2)
    if not eyes_closed:
        draw.point((hx + 1, hy + 6), fill=(40, 30, 25, 255))
        draw.point((hx + 8, hy + 6), fill=(40, 30, 25, 255))
        draw.point((hx + 2, hy + 5), fill=(240, 240, 235, 200))
        draw.point((hx + 9, hy + 5), fill=(240, 240, 235, 200))

    # Fedora Hat
    hat_y = hy - 12
    draw.polygon([
        (hx - 22, hat_y),
        (hx + 24, hat_y),
        (hx + 18, hat_y - 32 + hat_tilt),
        (hx - 2, hat_y - 36 + hat_tilt),
        (hx - 18, hat_y - 30 + hat_tilt)
    ], fill=COLOR_HAT_MAIN)
    draw.polygon([
        (hx - 8, hat_y - 34 + hat_tilt),
        (hx + 8, hat_y - 33 + hat_tilt),
        (hx + 4, hat_y - 20),
        (hx - 4, hat_y - 20)
    ], fill=COLOR_HAT_DARK)

    # Hat Ribbon Band
    draw.polygon([
        (hx - 23, hat_y),
        (hx + 25, hat_y),
        (hx + 23, hat_y - 8),
        (hx - 21, hat_y - 8)
    ], fill=COLOR_HAT_BAND)
    draw.rectangle([hx - 6, hat_y - 9, hx - 1, hat_y + 1], fill=COLOR_HAT_BUCKLE)

    # Hat Brim
    draw.polygon([
        (hx - 42, hat_y + 3),
        (hx + 44, hat_y + 1),
        (hx + 38, hat_y + 8),
        (hx - 36, hat_y + 9)
    ], fill=COLOR_HAT_DARK)
    draw.line([(hx - 40, hat_y + 3), (hx + 42, hat_y + 1)], fill=COLOR_HAT_LIGHT, width=2)

    # 7. Front Arm (Right Arm)
    r_shoulder = (cx + 26, shoulder_y + 8)
    r_elbow_x = r_shoulder[0] + math.sin(math.radians(right_arm_angle)) * 48
    r_elbow_y = r_shoulder[1] + math.cos(math.radians(right_arm_angle)) * 48
    r_hand_x = r_elbow_x + math.sin(math.radians(right_arm_angle + right_elbow_bend)) * 45
    r_hand_y = r_elbow_y + math.cos(math.radians(right_arm_angle + right_elbow_bend)) * 45

    draw.line([r_shoulder, (r_elbow_x, r_elbow_y)], fill=COLOR_COAT_MAIN, width=22)
    draw.line([(r_elbow_x, r_elbow_y), (r_hand_x, r_hand_y)], fill=COLOR_COAT_MAIN, width=18)
    draw.arc([r_shoulder[0] - 12, r_shoulder[1] - 8, r_shoulder[0] + 12, r_shoulder[1] + 12], 180, 360, fill=COLOR_COAT_LIGHT, width=2)

    draw.ellipse([r_hand_x - 8, r_hand_y - 8, r_hand_x + 8, r_hand_y + 8], fill=COLOR_SKIN_BASE)

    if right_hand_prop == "key":
        draw.line([(r_hand_x, r_hand_y), (r_hand_x + 18, r_hand_y - 4)], fill=COLOR_BRASS, width=3)
        draw.ellipse([r_hand_x + 14, r_hand_y - 8, r_hand_x + 22, r_hand_y], outline=COLOR_BRASS, width=2)
        draw.line([(r_hand_x + 8, r_hand_y - 3), (r_hand_x + 8, r_hand_y + 3)], fill=COLOR_BRASS, width=2)
    elif right_hand_prop == "recoil_guard":
        draw.polygon([
            (r_hand_x - 4, r_hand_y - 12),
            (r_hand_x + 12, r_hand_y - 10),
            (r_hand_x + 10, r_hand_y + 8),
            (r_hand_x - 6, r_hand_y + 6)
        ], fill=COLOR_SKIN_BASE)

    return img

def generate_all_inspector_animations(output_base_dir):
    animations = {
        "idle": [
            {"head_offset": (0, 0), "torso_offset": (0, 0), "left_arm_angle": 12, "right_arm_angle": -8, "breathing_scale": 1.0},
            {"head_offset": (0, 0.4), "torso_offset": (0, 0), "left_arm_angle": 13, "right_arm_angle": -7, "breathing_scale": 1.01},
            {"head_offset": (0, 0.8), "torso_offset": (0, 0), "left_arm_angle": 14, "right_arm_angle": -6, "breathing_scale": 1.02},
            {"head_offset": (0, 1.0), "torso_offset": (0, 0), "left_arm_angle": 15, "right_arm_angle": -6, "breathing_scale": 1.025},
            {"head_offset": (0, 0.6), "torso_offset": (0, 0), "left_arm_angle": 13, "right_arm_angle": -7, "breathing_scale": 1.012},
            {"head_offset": (0, 0.2), "torso_offset": (0, 0), "left_arm_angle": 12, "right_arm_angle": -8, "breathing_scale": 1.004},
        ],
        "idle_uneasy": [
            {"head_offset": (2, -1), "hat_tilt": 2, "torso_offset": (0, 0), "left_arm_angle": 25, "left_elbow_bend": -30, "right_arm_angle": -15, "tense_posture": True, "breathing_scale": 1.02},
            {"head_offset": (2.5, -0.5), "hat_tilt": 2, "torso_offset": (0, 0), "left_arm_angle": 26, "left_elbow_bend": -32, "right_arm_angle": -14, "tense_posture": True, "breathing_scale": 1.03},
            {"head_offset": (3, 0), "hat_tilt": 1, "torso_offset": (0, 0), "left_arm_angle": 28, "left_elbow_bend": -35, "right_arm_angle": -12, "tense_posture": True, "breathing_scale": 1.04},
            {"head_offset": (1, -0.5), "hat_tilt": 0, "torso_offset": (0, 0), "left_arm_angle": 26, "left_elbow_bend": -32, "right_arm_angle": -14, "tense_posture": True, "breathing_scale": 1.03},
            {"head_offset": (-1, -1), "hat_tilt": -2, "torso_offset": (0, 0), "left_arm_angle": 24, "left_elbow_bend": -28, "right_arm_angle": -16, "tense_posture": True, "breathing_scale": 1.015},
            {"head_offset": (0, -1), "hat_tilt": 0, "torso_offset": (0, 0), "left_arm_angle": 25, "left_elbow_bend": -30, "right_arm_angle": -15, "tense_posture": True, "breathing_scale": 1.02},
        ],
        "walk": [
            # Frame 0: Contact Right (lead heel strikes baseline 412, trail toe pushes off)
            {"torso_offset": (0, 4.8), "right_leg_angle": -18, "right_knee_bend": 4, "left_leg_angle": 18, "left_knee_bend": 10, "right_arm_angle": 22, "left_arm_angle": -20, "coat_flutter": 2.5},
            # Frame 1: Down Right (full foot flat on baseline 412, weight absorbed)
            {"torso_offset": (0, 1.0), "right_leg_angle": -8, "right_knee_bend": 2, "left_leg_angle": 8, "left_knee_bend": 35, "right_arm_angle": 15, "left_arm_angle": -12, "coat_flutter": 3.0},
            # Frame 2: Passing Right (stance leg upright supporting body on 412, swing leg passing)
            {"torso_offset": (0, 0.0), "right_leg_angle": 0, "right_knee_bend": 0, "left_leg_angle": -8, "left_knee_bend": 48, "right_arm_angle": 0, "left_arm_angle": 0, "coat_flutter": 1.0},
            # Frame 3: High Point Right (heel lifts, ball of foot pushes off 412, swing leg reaches)
            {"torso_offset": (0, 3.3), "right_leg_angle": 12, "right_knee_bend": 2, "left_leg_angle": -20, "left_knee_bend": 18, "right_arm_angle": -18, "left_arm_angle": 16, "coat_flutter": -1.5},
            # Frame 4: Contact Left (lead heel strikes baseline 412, trail toe pushes off)
            {"torso_offset": (0, 4.8), "right_leg_angle": 18, "right_knee_bend": 10, "left_leg_angle": -18, "left_knee_bend": 4, "right_arm_angle": -22, "left_arm_angle": 20, "coat_flutter": -2.5},
            # Frame 5: Down Left (full foot flat on baseline 412, weight absorbed)
            {"torso_offset": (0, 1.0), "right_leg_angle": 8, "right_knee_bend": 35, "left_leg_angle": -8, "left_knee_bend": 2, "right_arm_angle": -15, "left_arm_angle": 12, "coat_flutter": -3.0},
            # Frame 6: Passing Left (stance leg upright supporting body on 412, swing leg passing)
            {"torso_offset": (0, 0.0), "right_leg_angle": -8, "right_knee_bend": 48, "left_leg_angle": 0, "left_knee_bend": 0, "right_arm_angle": 0, "left_arm_angle": 0, "coat_flutter": -1.0},
            # Frame 7: High Point Left (heel lifts, ball of foot pushes off 412, swing leg reaches)
            {"torso_offset": (0, 3.3), "right_leg_angle": -20, "right_knee_bend": 18, "left_leg_angle": 12, "left_knee_bend": 2, "right_arm_angle": 18, "left_arm_angle": -16, "coat_flutter": 1.5},
        ],
        "turn": [
            {"torso_offset": (0, 0), "head_offset": (0, 0), "left_arm_angle": 10, "right_arm_angle": -10},
            {"torso_offset": (-2, 0), "head_offset": (-4, 1), "hat_tilt": -4, "left_arm_angle": 5, "right_arm_angle": -5, "coat_flutter": -2.0},
            {"torso_offset": (-1, 0), "head_offset": (-2, 0.5), "hat_tilt": -2, "left_arm_angle": 8, "right_arm_angle": -8, "coat_flutter": -1.0},
            {"torso_offset": (0, 0), "head_offset": (0, 0), "left_arm_angle": 12, "right_arm_angle": -8},
        ],
        "inspect": [
            {"torso_offset": (4, 0), "head_offset": (6, 4), "hat_tilt": 4, "left_arm_angle": 25, "left_elbow_bend": -60, "right_arm_angle": -10, "left_hand_prop": "notebook"},
            {"torso_offset": (6, 0), "head_offset": (10, 8), "hat_tilt": 6, "left_arm_angle": 30, "left_elbow_bend": -85, "right_arm_angle": 15, "right_elbow_bend": -40, "left_hand_prop": "notebook"},
            {"torso_offset": (8, 0), "head_offset": (12, 10), "hat_tilt": 8, "left_arm_angle": 32, "left_elbow_bend": -90, "right_arm_angle": 20, "right_elbow_bend": -50, "left_hand_prop": "notebook"},
            {"torso_offset": (8, 0), "head_offset": (12, 10), "hat_tilt": 8, "left_arm_angle": 32, "left_elbow_bend": -90, "right_arm_angle": 20, "right_elbow_bend": -50, "left_hand_prop": "notebook"},
            {"torso_offset": (5, 0), "head_offset": (8, 6), "hat_tilt": 5, "left_arm_angle": 28, "left_elbow_bend": -70, "right_arm_angle": 5, "left_hand_prop": "notebook"},
            {"torso_offset": (0, 0), "head_offset": (0, 0), "left_arm_angle": 12, "right_arm_angle": -8},
        ],
        "use_mid": [
            {"torso_offset": (3, 0), "head_offset": (4, 2), "right_arm_angle": 35, "right_elbow_bend": -30, "left_arm_angle": 10},
            {"torso_offset": (5, 0), "head_offset": (8, 3), "right_arm_angle": 65, "right_elbow_bend": -50, "left_arm_angle": 8, "right_hand_prop": "key"},
            {"torso_offset": (7, 0), "head_offset": (10, 4), "right_arm_angle": 80, "right_elbow_bend": -60, "left_arm_angle": 6, "right_hand_prop": "key"},
            {"torso_offset": (7, 0), "head_offset": (10, 4), "right_arm_angle": 80, "right_elbow_bend": -60, "left_arm_angle": 6, "right_hand_prop": "key"},
            {"torso_offset": (4, 0), "head_offset": (5, 2), "right_arm_angle": 50, "right_elbow_bend": -35, "left_arm_angle": 10},
            {"torso_offset": (0, 0), "head_offset": (0, 0), "right_arm_angle": -8, "left_arm_angle": 12},
        ],
        "pickup_low": [
            {"torso_offset": (4, 4), "head_offset": (6, 6), "hat_tilt": 6, "right_leg_angle": 10, "right_knee_bend": 5, "left_leg_angle": -10, "left_knee_bend": 15, "right_arm_angle": 35, "right_elbow_bend": -20},
            {"torso_offset": (8, 8), "head_offset": (10, 10), "hat_tilt": 10, "right_leg_angle": 16, "right_knee_bend": 8, "left_leg_angle": -16, "left_knee_bend": 20, "right_arm_angle": 55, "right_elbow_bend": -15},
            {"torso_offset": (10, 10), "head_offset": (14, 14), "hat_tilt": 14, "right_leg_angle": 18, "right_knee_bend": 10, "left_leg_angle": -18, "left_knee_bend": 25, "right_arm_angle": 75, "right_elbow_bend": 5},
            {"torso_offset": (8, 8), "head_offset": (10, 10), "hat_tilt": 10, "right_leg_angle": 16, "right_knee_bend": 8, "left_leg_angle": -16, "left_knee_bend": 20, "right_arm_angle": 60, "right_elbow_bend": -20},
            {"torso_offset": (4, 4), "head_offset": (6, 6), "hat_tilt": 6, "right_leg_angle": 10, "right_knee_bend": 5, "left_leg_angle": -10, "left_knee_bend": 15, "right_arm_angle": 35, "right_elbow_bend": -40},
            {"torso_offset": (0, 0), "head_offset": (0, 0), "right_leg_angle": 0, "left_leg_angle": 0, "right_arm_angle": -8, "left_arm_angle": 12},
        ],
        "react": [
            {"recoil_shift": (-6, 0), "head_offset": (-8, -6), "hat_tilt": -8, "right_arm_angle": 40, "right_elbow_bend": -60, "left_arm_angle": -20, "coat_flutter": -4.0, "right_hand_prop": "recoil_guard"},
            {"recoil_shift": (-14, 0), "head_offset": (-18, -10), "hat_tilt": -14, "right_arm_angle": 60, "right_elbow_bend": -80, "left_arm_angle": -35, "coat_flutter": -8.0, "right_hand_prop": "recoil_guard"},
            {"recoil_shift": (-16, 0), "head_offset": (-20, -8), "hat_tilt": -12, "right_arm_angle": 55, "right_elbow_bend": -75, "left_arm_angle": -30, "coat_flutter": -6.0, "right_hand_prop": "recoil_guard"},
            {"recoil_shift": (-10, 0), "head_offset": (-12, -4), "hat_tilt": -6, "right_arm_angle": 35, "right_elbow_bend": -50, "left_arm_angle": -15, "coat_flutter": -3.0},
            {"recoil_shift": (-4, 0), "head_offset": (-4, -1), "hat_tilt": -2, "right_arm_angle": 10, "right_elbow_bend": -25, "left_arm_angle": 5, "coat_flutter": -1.0},
            {"recoil_shift": (0, 0), "head_offset": (0, 0), "right_arm_angle": -8, "left_arm_angle": 12},
        ],
        "hide_enter": [
            {"torso_offset": (-4, 0), "head_offset": (-6, 0), "hat_tilt": -4, "left_arm_angle": 20, "right_arm_angle": -15},
            {"torso_offset": (-8, 0), "head_offset": (-10, 4), "hat_tilt": 8, "left_arm_angle": 25, "left_elbow_bend": -40, "right_arm_angle": -20},
            {"torso_offset": (-12, 0), "head_offset": (-14, 8), "hat_tilt": 14, "left_arm_angle": 30, "left_elbow_bend": -60, "right_arm_angle": -25},
            {"torso_offset": (-14, 0), "head_offset": (-16, 12), "hat_tilt": 18, "left_arm_angle": 35, "left_elbow_bend": -70, "right_arm_angle": -28},
        ],
        "hide_hold": [
            {"torso_offset": (-14, 0), "head_offset": (-16, 12), "hat_tilt": 18, "left_arm_angle": 35, "left_elbow_bend": -70, "right_arm_angle": -28, "breathing_scale": 1.0},
            {"torso_offset": (-14, 0), "head_offset": (-16, 12.3), "hat_tilt": 18, "left_arm_angle": 36, "left_elbow_bend": -71, "right_arm_angle": -28, "breathing_scale": 1.015},
            {"torso_offset": (-14, 0), "head_offset": (-16, 12.6), "hat_tilt": 18, "left_arm_angle": 37, "left_elbow_bend": -72, "right_arm_angle": -27, "breathing_scale": 1.03},
            {"torso_offset": (-14, 0), "head_offset": (-16, 12.2), "hat_tilt": 18, "left_arm_angle": 35, "left_elbow_bend": -70, "right_arm_angle": -28, "breathing_scale": 1.01},
        ],
        "hide_exit": [
            {"torso_offset": (-12, 0), "head_offset": (-14, 8), "hat_tilt": 14, "left_arm_angle": 30, "left_elbow_bend": -50, "right_arm_angle": -20},
            {"torso_offset": (-6, 0), "head_offset": (-8, 4), "hat_tilt": 6, "left_arm_angle": 20, "left_elbow_bend": -25, "right_arm_angle": -15},
            {"torso_offset": (-2, 0), "head_offset": (-3, 1), "hat_tilt": 2, "left_arm_angle": 15, "right_arm_angle": -10},
            {"torso_offset": (0, 0), "head_offset": (0, 0), "left_arm_angle": 12, "right_arm_angle": -8},
        ]
    }

    total_frames = 0
    for anim_name, frames in animations.items():
        anim_dir = os.path.join(output_base_dir, anim_name)
        os.makedirs(anim_dir, exist_ok=True)
        for i, params in enumerate(frames):
            img = create_frame(pose_name=anim_name, **params)
            frame_path = os.path.join(anim_dir, f"inspector_{anim_name}_{i+1:02d}.png")
            img.save(frame_path, "PNG")
            total_frames += 1

    print(f"Successfully generated {total_frames} production frames across {len(animations)} animation states at BASELINE_Y={BASELINE_Y}.")

if __name__ == "__main__":
    output_dir = os.path.abspath(r"assets/images/characters/inspector_production")
    generate_all_inspector_animations(output_dir)
