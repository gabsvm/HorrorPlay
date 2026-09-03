"""
Inspector Character Cinematic Pixel Art Production Sprite Generator
Inspired by the high-detail neo-noir pixel art aesthetic of REPLACED.
Generates 384x512 raster frames with true human anatomical proportions (7.2 heads),
deliberate pixel clusters, period 1926 tailoring, and an anatomically correct lateral walk cycle.
Guarantees consistent ground baseline at BASELINE_Y = 460.
"""
import os
import math
from PIL import Image, ImageDraw

CANVAS_WIDTH = 384
CANVAS_HEIGHT = 512
BASELINE_Y = 460
PIVOT_X = 192

# Palette - Cinematic Noir (Massachusetts 1926 Detective)
# Trench Coat (Deep Charcoal Navy Wool)
COLOR_COAT_SHADOW_DEEP = (14, 18, 26, 255)
COLOR_COAT_SHADOW = (22, 29, 40, 255)
COLOR_COAT_BASE = (34, 44, 60, 255)
COLOR_COAT_MID = (46, 58, 78, 255)
COLOR_COAT_RIM_COOL = (72, 92, 120, 255)
COLOR_COAT_BOUNCE_WARM = (88, 72, 52, 255)

# Fedora
COLOR_HAT_SHADOW = (12, 15, 22, 255)
COLOR_HAT_BASE = (24, 30, 42, 255)
COLOR_HAT_MID = (38, 48, 66, 255)
COLOR_HAT_HIGHLIGHT = (58, 74, 100, 255)
COLOR_HAT_BAND = (74, 22, 32, 255)  # Vintage deep burgundy silk
COLOR_HAT_BUCKLE = (190, 150, 75, 255)

# Face & Skin (Noir chiaroscuro under brim)
COLOR_FACE_SHADOW_DEEP = (38, 26, 22, 255)
COLOR_FACE_SHADOW = (75, 52, 44, 255)
COLOR_FACE_MID = (120, 90, 75, 255)
COLOR_FACE_LIGHT = (175, 140, 120, 255)

# Shirt, Tie & Vest
COLOR_SHIRT = (220, 215, 202, 255)
COLOR_SHIRT_SHADOW = (140, 134, 122, 255)
COLOR_TIE = (100, 24, 36, 255)
COLOR_TIE_LIGHT = (138, 36, 52, 255)
COLOR_VEST = (20, 25, 34, 255)
COLOR_BRASS_BUTTON = (195, 155, 75, 255)

# Trousers (Charcoal herringbone)
COLOR_PANTS_SHADOW_DEEP = (12, 15, 20, 255)
COLOR_PANTS_SHADOW = (18, 23, 30, 255)
COLOR_PANTS_BASE = (26, 33, 44, 255)
COLOR_PANTS_LIGHT = (38, 48, 64, 255)

# Boots (Polished Dark Leather Oxford Boots)
COLOR_BOOTS_SOLE = (8, 9, 12, 255)
COLOR_BOOTS_SHADOW = (18, 15, 14, 255)
COLOR_BOOTS_LEATHER = (30, 24, 20, 255)
COLOR_BOOTS_LIGHT = (58, 48, 38, 255)
COLOR_BOOTS_SHEEN = (95, 82, 70, 255)

# Props
COLOR_NOTEBOOK_COVER = (50, 36, 26, 255)
COLOR_NOTEBOOK_PAPER = (225, 218, 198, 255)
COLOR_KEY_BRASS = (195, 155, 65, 255)
COLOR_KEY_HIGHLIGHT = (245, 215, 125, 255)

def _draw_pixel_polygon(draw, points, fill_color, border_color=None):
    """Draws a clean raster polygon with deliberate pixel clustering."""
    draw.polygon(points, fill=fill_color)
    if border_color:
        draw.polygon(points, outline=border_color)

def _draw_boot(draw, foot_x, foot_y, angle_deg=0.0, is_far=False, toe_off=False):
    """
    Renders an authentic 1920s detective leather Oxford boot with heel,
    sole welt, vamp, and leather highlight sheen.
    """
    rad = math.radians(angle_deg)
    cos_a, sin_a = math.cos(rad), math.sin(rad)
    
    def rot(dx, dy):
        return (foot_x + dx * cos_a - dy * sin_a, foot_y + dx * sin_a + dy * cos_a)
    
    base_color = COLOR_BOOTS_SHADOW if is_far else COLOR_BOOTS_LEATHER
    light_color = COLOR_BOOTS_LEATHER if is_far else COLOR_BOOTS_LIGHT
    sheen_color = COLOR_BOOTS_LIGHT if is_far else COLOR_BOOTS_SHEEN
    
    if toe_off:
        # Ball of foot stays grounded, heel tilted up
        boot_pts = [
            rot(-12, -22), rot(4, -20), rot(14, -10),
            rot(16, 0), rot(0, 0), rot(-8, -8), rot(-14, -14)
        ]
        draw.polygon(boot_pts, fill=base_color)
        draw.polygon([rot(2, -18), rot(12, -10), rot(14, 0), rot(6, 0)], fill=light_color)
        draw.line([rot(0, 0), rot(16, 0)], fill=COLOR_BOOTS_SOLE, width=3)
    else:
        # Standard sole profile with heel block and defined toe cap
        boot_pts = [
            rot(-16, -24), rot(6, -22), rot(16, -14),
            rot(28, -6), rot(30, 0), rot(-18, 0), rot(-18, -10)
        ]
        draw.polygon(boot_pts, fill=base_color)
        # Toe cap sheen
        draw.polygon([rot(14, -14), rot(28, -6), rot(28, -2), rot(14, -8)], fill=light_color)
        draw.line([rot(18, -12), rot(26, -6)], fill=sheen_color, width=2)
        # Separate heel block
        draw.rectangle([
            rot(-18, -1)[0], rot(-18, -1)[1],
            rot(-6, 2)[0], rot(-6, 2)[1]
        ], fill=COLOR_BOOTS_SOLE)
        # Sole welt line
        draw.line([rot(-18, 0), rot(30, 0)], fill=COLOR_BOOTS_SOLE, width=3)

def _draw_leg(draw, hip_x, hip_y, foot_x, foot_y, knee_x, knee_y, is_far=False):
    """
    Renders an anatomically contoured tailored trouser leg with forward knee flexion.
    """
    base_color = COLOR_PANTS_SHADOW_DEEP if is_far else COLOR_PANTS_BASE
    mid_color = COLOR_PANTS_SHADOW if is_far else COLOR_PANTS_LIGHT
    
    # Thigh contour (from hip to knee)
    thigh_pts = [
        (hip_x - 14, hip_y),
        (hip_x + 14, hip_y),
        (knee_x + 12, knee_y),
        (knee_x - 12, knee_y)
    ]
    draw.polygon(thigh_pts, fill=base_color)
    # Thigh crease / highlight
    draw.line([(hip_x + 2, hip_y + 4), (knee_x + 4, knee_y - 4)], fill=mid_color, width=3)
    
    # Lower leg / calf contour (from knee to ankle)
    calf_pts = [
        (knee_x - 12, knee_y),
        (knee_x + 12, knee_y),
        (foot_x + 11, foot_y - 18),
        (foot_x - 11, foot_y - 18)
    ]
    draw.polygon(calf_pts, fill=base_color)
    # Shin crease
    draw.line([(knee_x + 3, knee_y + 4), (foot_x + 2, foot_y - 20)], fill=mid_color, width=2)

def create_frame(
    pose_name="idle",
    head_offset=(0, 0),
    hat_tilt=0.0,
    torso_offset=(0, 0),
    pelvis_drop=0.0,
    right_leg_pose=None,
    left_leg_pose=None,
    right_arm_pose=None,
    left_arm_pose=None,
    coat_flutter=0.0,
    breathing_scale=1.0,
    right_hand_prop=None,
    left_hand_prop=None,
    tense_posture=False,
    recoil_shift=(0, 0),
    force_ground_y=BASELINE_Y
):
    img = Image.new("RGBA", (CANVAS_WIDTH, CANVAS_HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = PIVOT_X + torso_offset[0] + recoil_shift[0]
    
    # Anatomy reference points (7.2 heads scale, ~376px height)
    # Ground at BASELINE_Y = 460
    base_pelvis_y = 295.0 + pelvis_drop
    pelvis_y = base_pelvis_y + torso_offset[1] + recoil_shift[1]
    waist_y = pelvis_y - 38.0
    shoulder_y = waist_y - 82.0 * breathing_scale
    neck_y = shoulder_y - 14.0
    head_center_y = neck_y - 32.0 + head_offset[1]
    head_center_x = cx + head_offset[0]

    # Default upright legs if not specified
    if not right_leg_pose:
        right_leg_pose = {"foot": (cx + 8, force_ground_y), "knee": (cx + 8, (pelvis_y + force_ground_y) * 0.5), "angle": 0.0, "toe_off": False}
    if not left_leg_pose:
        left_leg_pose = {"foot": (cx - 10, force_ground_y), "knee": (cx - 10, (pelvis_y + force_ground_y) * 0.5), "angle": 0.0, "toe_off": False}
    if not right_arm_pose:
        right_arm_pose = {"hand": (cx + 26, waist_y + 36), "elbow": (cx + 24, shoulder_y + 40)}
    if not left_arm_pose:
        left_arm_pose = {"hand": (cx - 24, waist_y + 36), "elbow": (cx - 22, shoulder_y + 40)}

    # ==========================================
    # 1. FAR LEG (Left Leg)
    # ==========================================
    l_hip_x, l_hip_y = cx - 12, pelvis_y
    l_knee_x, l_knee_y = left_leg_pose["knee"]
    l_foot_x, l_foot_y = left_leg_pose["foot"]
    _draw_leg(draw, l_hip_x, l_hip_y, l_foot_x, l_foot_y, l_knee_x, l_knee_y, is_far=True)
    _draw_boot(draw, l_foot_x, l_foot_y, left_leg_pose.get("angle", 0.0), is_far=True, toe_off=left_leg_pose.get("toe_off", False))

    # ==========================================
    # 2. FAR ARM (Left Arm)
    # ==========================================
    l_sh_x, l_sh_y = cx - 24, shoulder_y + 8
    l_el_x, l_el_y = left_arm_pose["elbow"]
    l_hd_x, l_hd_y = left_arm_pose["hand"]
    draw.polygon([(l_sh_x - 10, l_sh_y), (l_sh_x + 8, l_sh_y), (l_el_x + 7, l_el_y), (l_el_x - 7, l_el_y)], fill=COLOR_COAT_SHADOW_DEEP)
    draw.polygon([(l_el_x - 7, l_el_y), (l_el_x + 7, l_el_y), (l_hd_x + 6, l_hd_y), (l_hd_x - 6, l_hd_y)], fill=COLOR_COAT_SHADOW_DEEP)
    # Far Hand / Glove
    draw.ellipse([l_hd_x - 6, l_hd_y - 6, l_hd_x + 6, l_hd_y + 6], fill=COLOR_FACE_SHADOW_DEEP)
    if left_hand_prop == "notebook":
        # Detective evidence notebook
        draw.rectangle([l_hd_x - 14, l_hd_y - 20, l_hd_x + 14, l_hd_y + 16], fill=COLOR_NOTEBOOK_COVER, outline=(20, 14, 10, 255), width=2)
        draw.rectangle([l_hd_x - 10, l_hd_y - 16, l_hd_x + 10, l_hd_y + 12], fill=COLOR_NOTEBOOK_PAPER)
        draw.line([(l_hd_x - 6, l_hd_y - 10), (l_hd_x + 6, l_hd_y - 10)], fill=(80, 70, 60, 255), width=2)
        draw.line([(l_hd_x - 6, l_hd_y - 4), (l_hd_x + 6, l_hd_y - 4)], fill=(80, 70, 60, 255), width=2)

    # ==========================================
    # 3. NEAR LEG (Right Leg)
    # ==========================================
    r_hip_x, r_hip_y = cx + 10, pelvis_y
    r_knee_x, r_knee_y = right_leg_pose["knee"]
    r_foot_x, r_foot_y = right_leg_pose["foot"]
    _draw_leg(draw, r_hip_x, r_hip_y, r_foot_x, r_foot_y, r_knee_x, r_knee_y, is_far=False)
    _draw_boot(draw, r_foot_x, r_foot_y, right_leg_pose.get("angle", 0.0), is_far=False, toe_off=right_leg_pose.get("toe_off", False))

    # ==========================================
    # 4. TRENCH COAT SKIRT / LOWER FLAPS
    # ==========================================
    coat_bottom_y = pelvis_y + 92.0
    c_back = cx - 36 + coat_flutter * 14
    c_front = cx + 34 + coat_flutter * 8
    
    # Main coat lower mass
    coat_lower_pts = [
        (cx - 26, waist_y),
        (cx + 28, waist_y),
        (c_front, coat_bottom_y),
        (c_back, coat_bottom_y)
    ]
    draw.polygon(coat_lower_pts, fill=COLOR_COAT_BASE)
    # Deep shadow fold in coat center
    draw.polygon([
        (cx - 6, waist_y),
        (cx + 6, waist_y),
        (cx + 8 + coat_flutter * 6, coat_bottom_y),
        (cx - 4 + coat_flutter * 6, coat_bottom_y)
    ], fill=COLOR_COAT_SHADOW)
    # Cool highlight on front drape edge
    draw.line([(cx + 28, waist_y), (c_front, coat_bottom_y)], fill=COLOR_COAT_RIM_COOL, width=2)
    # Warm bounce on rear edge
    draw.line([(cx - 26, waist_y), (c_back, coat_bottom_y)], fill=COLOR_COAT_BOUNCE_WARM, width=2)

    # ==========================================
    # 5. TORSO, WAISTCOAT & TRENCH COAT UPPER
    # ==========================================
    torso_pts = [
        (cx - 28, shoulder_y),
        (cx + 30, shoulder_y),
        (cx + 26, waist_y + 6),
        (cx - 24, waist_y + 6)
    ]
    draw.polygon(torso_pts, fill=COLOR_COAT_BASE)
    # Double-breasted coat lapels
    draw.polygon([
        (cx - 18, shoulder_y),
        (cx + 2, shoulder_y + 36),
        (cx - 12, shoulder_y + 44),
        (cx - 26, shoulder_y + 12)
    ], fill=COLOR_COAT_MID)
    draw.polygon([
        (cx + 20, shoulder_y),
        (cx + 28, shoulder_y + 12),
        (cx + 14, shoulder_y + 44),
        (cx + 4, shoulder_y + 36)
    ], fill=COLOR_COAT_MID)

    # Waistcoat / Vest V-Opening
    draw.polygon([
        (cx - 10, shoulder_y),
        (cx + 12, shoulder_y),
        (cx + 4, waist_y - 8),
        (cx - 4, waist_y - 8)
    ], fill=COLOR_VEST)
    
    # White Collar & Crimson Tie
    draw.polygon([(cx - 8, shoulder_y), (cx + 10, shoulder_y), (cx + 2, shoulder_y + 18), (cx - 2, shoulder_y + 18)], fill=COLOR_SHIRT)
    draw.polygon([(cx - 2, shoulder_y + 2), (cx + 4, shoulder_y + 2), (cx + 5, shoulder_y + 28), (cx - 1, shoulder_y + 28)], fill=COLOR_TIE)
    draw.line([(cx + 1, shoulder_y + 4), (cx + 2, shoulder_y + 26)], fill=COLOR_TIE_LIGHT, width=2)
    
    # Brass Buttons on double-breasted coat
    for by in [shoulder_y + 24, shoulder_y + 38, shoulder_y + 52]:
        draw.ellipse([cx + 10, by - 2, cx + 14, by + 2], fill=COLOR_BRASS_BUTTON)

    # Belt with Brass Buckle
    draw.rectangle([cx - 25, waist_y - 2, cx + 27, waist_y + 6], fill=(16, 18, 24, 255))
    draw.rectangle([cx - 5, waist_y - 4, cx + 7, waist_y + 8], fill=COLOR_BRASS_BUTTON, outline=(30, 20, 10, 255), width=2)

    # ==========================================
    # 6. DETECTIVE HEAD & 1926 NOIR FEDORA
    # ==========================================
    # Neck
    draw.rectangle([cx - 8, neck_y, cx + 10, shoulder_y + 2], fill=COLOR_FACE_SHADOW)
    
    # Head Base Silhouette (Structured masculine jawline)
    hx = head_center_x
    hy = head_center_y
    jaw_pts = [
        (hx - 14, hy - 8),
        (hx + 16, hy - 8),
        (hx + 18, hy + 12),
        (hx + 10, hy + 24),
        (hx - 2, hy + 24),
        (hx - 12, hy + 14)
    ]
    draw.polygon(jaw_pts, fill=COLOR_FACE_MID)
    # Stubble / 5 o'clock shadow on lower jaw
    draw.polygon([
        (hx - 10, hy + 10),
        (hx + 16, hy + 10),
        (hx + 10, hy + 23),
        (hx - 2, hy + 23)
    ], fill=COLOR_FACE_SHADOW)
    # Crisp jawline edge highlight
    draw.line([(hx + 10, hy + 24), (hx + 18, hy + 12)], fill=COLOR_FACE_LIGHT, width=2)

    # Deep noir shadow cast by fedora brim across eyes/brow
    draw.rectangle([hx - 16, hy - 6, hx + 18, hy + 8], fill=COLOR_FACE_SHADOW_DEEP)

    # Fedora Crown (Pinched top)
    crown_pts = [
        (hx - 24, hy - 44 + hat_tilt * 0.5),
        (hx - 8, hy - 50 + hat_tilt * 0.5), # front pinch
        (hx + 18, hy - 48 + hat_tilt * 0.5),
        (hx + 24, hy - 14 + hat_tilt * 0.5),
        (hx - 22, hy - 14 + hat_tilt * 0.5)
    ]
    draw.polygon(crown_pts, fill=COLOR_HAT_BASE)
    draw.line([(hx - 6, hy - 48 + hat_tilt * 0.5), (hx + 2, hy - 14 + hat_tilt * 0.5)], fill=COLOR_HAT_SHADOW, width=3)
    draw.line([(hx - 22, hy - 42 + hat_tilt * 0.5), (hx - 20, hy - 14 + hat_tilt * 0.5)], fill=COLOR_HAT_HIGHLIGHT, width=2)

    # Silk Hatband with Brass Slider
    draw.polygon([
        (hx - 23, hy - 18 + hat_tilt * 0.5),
        (hx + 25, hy - 18 + hat_tilt * 0.5),
        (hx + 26, hy - 10 + hat_tilt * 0.5),
        (hx - 24, hy - 10 + hat_tilt * 0.5)
    ], fill=COLOR_HAT_BAND)
    draw.rectangle([hx - 4, hy - 17 + hat_tilt * 0.5, hx + 2, hy - 11 + hat_tilt * 0.5], fill=COLOR_HAT_BUCKLE)

    # Fedora Brim (Sharp curved double-edge)
    brim_pts = [
        (hx - 46, hy - 6 + hat_tilt),
        (hx + 48, hy - 10 + hat_tilt),
        (hx + 42, hy - 2 + hat_tilt),
        (hx - 40, hy + 2 + hat_tilt)
    ]
    draw.polygon(brim_pts, fill=COLOR_HAT_SHADOW)
    draw.line([(hx - 44, hy - 6 + hat_tilt), (hx + 46, hy - 10 + hat_tilt)], fill=COLOR_HAT_HIGHLIGHT, width=2)

    # ==========================================
    # 7. NEAR ARM (Right Arm)
    # ==========================================
    r_sh_x, r_sh_y = cx + 24, shoulder_y + 8
    r_el_x, r_el_y = right_arm_pose["elbow"]
    r_hd_x, r_hd_y = right_arm_pose["hand"]

    # Upper Arm Sleeve
    draw.polygon([
        (r_sh_x - 10, r_sh_y),
        (r_sh_x + 12, r_sh_y),
        (r_el_x + 10, r_el_y),
        (r_el_x - 8, r_el_y)
    ], fill=COLOR_COAT_BASE)
    draw.line([(r_sh_x + 10, r_sh_y), (r_el_x + 8, r_el_y)], fill=COLOR_COAT_RIM_COOL, width=2)

    # Forearm Sleeve
    draw.polygon([
        (r_el_x - 8, r_el_y),
        (r_el_x + 10, r_el_y),
        (r_hd_x + 9, r_hd_y),
        (r_hd_x - 7, r_hd_y)
    ], fill=COLOR_COAT_BASE)
    draw.line([(r_el_x + 8, r_el_y), (r_hd_x + 7, r_hd_y)], fill=COLOR_COAT_RIM_COOL, width=2)

    # Hand / Glove
    draw.ellipse([r_hd_x - 7, r_hd_y - 7, r_hd_x + 7, r_hd_y + 7], fill=COLOR_FACE_MID)

    # Hand Props
    if right_hand_prop == "key":
        # Rusty Brass Key held forward
        draw.line([(r_hd_x + 4, r_hd_y), (r_hd_x + 32, r_hd_y - 4)], fill=COLOR_KEY_BRASS, width=4)
        draw.ellipse([r_hd_x + 26, r_hd_y - 12, r_hd_x + 40, r_hd_y + 4], outline=COLOR_KEY_BRASS, width=3)
        draw.line([(r_hd_x + 14, r_hd_y - 3), (r_hd_x + 14, r_hd_y + 6)], fill=COLOR_KEY_BRASS, width=3)
        draw.line([(r_hd_x + 20, r_hd_y - 3), (r_hd_x + 20, r_hd_y + 8)], fill=COLOR_KEY_BRASS, width=3)
        draw.point((r_hd_x + 30, r_hd_y - 6), fill=COLOR_KEY_HIGHLIGHT)
    elif right_hand_prop == "recoil_guard":
        draw.polygon([
            (r_hd_x - 4, r_hd_y - 12),
            (r_hd_x + 14, r_hd_y - 8),
            (r_hd_x + 12, r_hd_y + 10),
            (r_hd_x - 6, r_hd_y + 8)
        ], fill=COLOR_FACE_MID)

    return img

def generate_all_inspector_animations(output_base_dir):
    """
    Generates all 11 production animation states with rigorous human anatomy,
    mathematical baseline ground contact, and 8-frame lateral locomotion.
    """
    ground = BASELINE_Y

    # ==========================================
    # 8-FRAME LATERAL WALK CYCLE
    # Right Contact -> Right Down -> Right Passing -> Right Up
    # Left Contact  -> Left Down  -> Left Passing  -> Left Up
    # ==========================================
    walk_frames = [
        # Frame 1: Right Contact (Heel Strike)
        # Lead right leg reaches forward (+X), heel strikes ground at 460.
        # Trail left leg extends back (-X), toe on 460.
        {
            "pelvis_drop": 0.0,
            "torso_offset": (0, 0),
            "right_leg_pose": {"foot": (PIVOT_X + 44, ground), "knee": (PIVOT_X + 26, ground - 78), "angle": 18.0, "toe_off": False},
            "left_leg_pose":  {"foot": (PIVOT_X - 42, ground), "knee": (PIVOT_X - 18, ground - 76), "angle": -16.0, "toe_off": True},
            "right_arm_pose": {"hand": (PIVOT_X - 26, 315), "elbow": (PIVOT_X - 16, 265)},
            "left_arm_pose":  {"hand": (PIVOT_X + 28, 310), "elbow": (PIVOT_X + 18, 260)},
            "coat_flutter": -2.5
        },
        # Frame 2: Right Down (Full Foot-Flat Cushion)
        # Right foot flat at 460, right knee absorbs weight bending forward (+18°). Pelvis drops 4px.
        # Left leg begins swinging forward, knee bent forward (+45°).
        {
            "pelvis_drop": 4.0,
            "torso_offset": (0, 0),
            "right_leg_pose": {"foot": (PIVOT_X + 32, ground), "knee": (PIVOT_X + 28, ground - 72), "angle": 0.0, "toe_off": False},
            "left_leg_pose":  {"foot": (PIVOT_X - 22, ground - 10), "knee": (PIVOT_X - 4, ground - 70), "angle": 12.0, "toe_off": False},
            "right_arm_pose": {"hand": (PIVOT_X - 14, 320), "elbow": (PIVOT_X - 8, 270)},
            "left_arm_pose":  {"hand": (PIVOT_X + 16, 318), "elbow": (PIVOT_X + 10, 266)},
            "coat_flutter": -1.5
        },
        # Frame 3: Right Passing (Single Stance)
        # Right leg straight vertical at 460 taking full body weight.
        # Left leg swings forward past stance leg, knee bent forward (+65°), foot clears ground.
        {
            "pelvis_drop": 0.0,
            "torso_offset": (0, 0),
            "right_leg_pose": {"foot": (PIVOT_X + 6, ground), "knee": (PIVOT_X + 8, ground - 80), "angle": 0.0, "toe_off": False},
            "left_leg_pose":  {"foot": (PIVOT_X + 6, ground - 22), "knee": (PIVOT_X + 14, ground - 68), "angle": 25.0, "toe_off": False},
            "right_arm_pose": {"hand": (PIVOT_X + 4, 322), "elbow": (PIVOT_X + 6, 272)},
            "left_arm_pose":  {"hand": (PIVOT_X - 2, 322), "elbow": (PIVOT_X, 272)},
            "coat_flutter": 0.0
        },
        # Frame 4: Right Up (Push-off)
        # Right foot pushes off with ball of foot on 460, heel lifted. Pelvis rises +3px.
        # Left leg extends forward reaching toward heel strike.
        {
            "pelvis_drop": -3.0,
            "torso_offset": (0, 0),
            "right_leg_pose": {"foot": (PIVOT_X - 18, ground), "knee": (PIVOT_X - 6, ground - 82), "angle": -14.0, "toe_off": True},
            "left_leg_pose":  {"foot": (PIVOT_X + 32, ground - 8), "knee": (PIVOT_X + 24, ground - 74), "angle": 16.0, "toe_off": False},
            "right_arm_pose": {"hand": (PIVOT_X + 24, 312), "elbow": (PIVOT_X + 16, 262)},
            "left_arm_pose":  {"hand": (PIVOT_X - 22, 316), "elbow": (PIVOT_X - 14, 266)},
            "coat_flutter": 1.5
        },
        # Frame 5: Left Contact (Heel Strike)
        # Lead left leg reaches forward (+X), heel strikes ground at 460.
        # Trail right leg extends back (-X), toe on 460.
        {
            "pelvis_drop": 0.0,
            "torso_offset": (0, 0),
            "right_leg_pose": {"foot": (PIVOT_X - 42, ground), "knee": (PIVOT_X - 18, ground - 76), "angle": -16.0, "toe_off": True},
            "left_leg_pose":  {"foot": (PIVOT_X + 44, ground), "knee": (PIVOT_X + 26, ground - 78), "angle": 18.0, "toe_off": False},
            "right_arm_pose": {"hand": (PIVOT_X + 28, 310), "elbow": (PIVOT_X + 18, 260)},
            "left_arm_pose":  {"hand": (PIVOT_X - 26, 315), "elbow": (PIVOT_X - 16, 265)},
            "coat_flutter": 2.5
        },
        # Frame 6: Left Down (Full Foot-Flat Cushion)
        # Left foot flat at 460, left knee absorbs weight bending forward (+18°). Pelvis drops 4px.
        # Right leg begins swinging forward, knee bent forward (+45°).
        {
            "pelvis_drop": 4.0,
            "torso_offset": (0, 0),
            "right_leg_pose": {"foot": (PIVOT_X - 22, ground - 10), "knee": (PIVOT_X - 4, ground - 70), "angle": 12.0, "toe_off": False},
            "left_leg_pose":  {"foot": (PIVOT_X + 32, ground), "knee": (PIVOT_X + 28, ground - 72), "angle": 0.0, "toe_off": False},
            "right_arm_pose": {"hand": (PIVOT_X + 16, 318), "elbow": (PIVOT_X + 10, 266)},
            "left_arm_pose":  {"hand": (PIVOT_X - 14, 320), "elbow": (PIVOT_X - 8, 270)},
            "coat_flutter": 1.5
        },
        # Frame 7: Left Passing (Single Stance)
        # Left leg straight vertical at 460 taking full body weight.
        # Right leg swings forward past stance leg, knee bent forward (+65°), foot clears ground.
        {
            "pelvis_drop": 0.0,
            "torso_offset": (0, 0),
            "right_leg_pose": {"foot": (PIVOT_X + 6, ground - 22), "knee": (PIVOT_X + 14, ground - 68), "angle": 25.0, "toe_off": False},
            "left_leg_pose":  {"foot": (PIVOT_X + 6, ground), "knee": (PIVOT_X + 8, ground - 80), "angle": 0.0, "toe_off": False},
            "right_arm_pose": {"hand": (PIVOT_X - 2, 322), "elbow": (PIVOT_X, 272)},
            "left_arm_pose":  {"hand": (PIVOT_X + 4, 322), "elbow": (PIVOT_X + 6, 272)},
            "coat_flutter": 0.0
        },
        # Frame 8: Left Up (Push-off)
        # Left foot pushes off with ball of foot on 460, heel lifted. Pelvis rises +3px.
        # Right leg extends forward reaching toward heel strike.
        {
            "pelvis_drop": -3.0,
            "torso_offset": (0, 0),
            "right_leg_pose": {"foot": (PIVOT_X + 32, ground - 8), "knee": (PIVOT_X + 24, ground - 74), "angle": 16.0, "toe_off": False},
            "left_leg_pose":  {"foot": (PIVOT_X - 18, ground), "knee": (PIVOT_X - 6, ground - 82), "angle": -14.0, "toe_off": True},
            "right_arm_pose": {"hand": (PIVOT_X - 22, 316), "elbow": (PIVOT_X - 14, 266)},
            "left_arm_pose":  {"hand": (PIVOT_X + 24, 312), "elbow": (PIVOT_X + 16, 262)},
            "coat_flutter": -1.5
        }
    ]

    # Stance legs for non-walking poses
    idle_right_leg = {"foot": (PIVOT_X + 10, ground), "knee": (PIVOT_X + 10, ground - 78), "angle": 0.0, "toe_off": False}
    idle_left_leg  = {"foot": (PIVOT_X - 12, ground), "knee": (PIVOT_X - 10, ground - 78), "angle": 0.0, "toe_off": False}

    animations = {
        "walk": walk_frames,
        "idle": [
            {"head_offset": (0, 0), "hat_tilt": 0, "breathing_scale": 1.0, "right_arm_pose": {"hand": (PIVOT_X + 22, 326), "elbow": (PIVOT_X + 20, 274)}, "left_arm_pose": {"hand": (PIVOT_X - 22, 326), "elbow": (PIVOT_X - 20, 274)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"head_offset": (0, 0.5), "hat_tilt": 0, "breathing_scale": 1.012, "right_arm_pose": {"hand": (PIVOT_X + 23, 325), "elbow": (PIVOT_X + 20, 273)}, "left_arm_pose": {"hand": (PIVOT_X - 22, 325), "elbow": (PIVOT_X - 20, 273)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"head_offset": (0, 1.0), "hat_tilt": 0, "breathing_scale": 1.025, "right_arm_pose": {"hand": (PIVOT_X + 24, 324), "elbow": (PIVOT_X + 21, 272)}, "left_arm_pose": {"hand": (PIVOT_X - 23, 324), "elbow": (PIVOT_X - 21, 272)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"head_offset": (0, 1.2), "hat_tilt": 0, "breathing_scale": 1.03, "right_arm_pose": {"hand": (PIVOT_X + 24, 324), "elbow": (PIVOT_X + 21, 272)}, "left_arm_pose": {"hand": (PIVOT_X - 23, 324), "elbow": (PIVOT_X - 21, 272)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"head_offset": (0, 0.6), "hat_tilt": 0, "breathing_scale": 1.015, "right_arm_pose": {"hand": (PIVOT_X + 23, 325), "elbow": (PIVOT_X + 20, 273)}, "left_arm_pose": {"hand": (PIVOT_X - 22, 325), "elbow": (PIVOT_X - 20, 273)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"head_offset": (0, 0.2), "hat_tilt": 0, "breathing_scale": 1.005, "right_arm_pose": {"hand": (PIVOT_X + 22, 326), "elbow": (PIVOT_X + 20, 274)}, "left_arm_pose": {"hand": (PIVOT_X - 22, 326), "elbow": (PIVOT_X - 20, 274)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg}
        ],
        "idle_uneasy": [
            {"head_offset": (2, -1), "hat_tilt": 2, "breathing_scale": 1.02, "right_arm_pose": {"hand": (PIVOT_X + 16, 280), "elbow": (PIVOT_X + 24, 255)}, "left_arm_pose": {"hand": (PIVOT_X - 20, 324), "elbow": (PIVOT_X - 20, 274)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg, "tense_posture": True},
            {"head_offset": (3, -0.5), "hat_tilt": 3, "breathing_scale": 1.03, "right_arm_pose": {"hand": (PIVOT_X + 16, 279), "elbow": (PIVOT_X + 24, 254)}, "left_arm_pose": {"hand": (PIVOT_X - 20, 323), "elbow": (PIVOT_X - 20, 273)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg, "tense_posture": True},
            {"head_offset": (4, 0), "hat_tilt": 2, "breathing_scale": 1.04, "right_arm_pose": {"hand": (PIVOT_X + 17, 278), "elbow": (PIVOT_X + 25, 253)}, "left_arm_pose": {"hand": (PIVOT_X - 21, 322), "elbow": (PIVOT_X - 21, 272)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg, "tense_posture": True},
            {"head_offset": (2, -0.5), "hat_tilt": 1, "breathing_scale": 1.03, "right_arm_pose": {"hand": (PIVOT_X + 16, 279), "elbow": (PIVOT_X + 24, 254)}, "left_arm_pose": {"hand": (PIVOT_X - 20, 323), "elbow": (PIVOT_X - 20, 273)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg, "tense_posture": True},
            {"head_offset": (-1, -1), "hat_tilt": -2, "breathing_scale": 1.02, "right_arm_pose": {"hand": (PIVOT_X + 15, 280), "elbow": (PIVOT_X + 23, 255)}, "left_arm_pose": {"hand": (PIVOT_X - 19, 324), "elbow": (PIVOT_X - 19, 274)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg, "tense_posture": True},
            {"head_offset": (0, -1), "hat_tilt": 0, "breathing_scale": 1.02, "right_arm_pose": {"hand": (PIVOT_X + 16, 280), "elbow": (PIVOT_X + 24, 255)}, "left_arm_pose": {"hand": (PIVOT_X - 20, 324), "elbow": (PIVOT_X - 20, 274)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg, "tense_posture": True}
        ],
        "turn": [
            {"torso_offset": (0, 0), "head_offset": (0, 0), "hat_tilt": 0, "right_arm_pose": {"hand": (PIVOT_X + 18, 326), "elbow": (PIVOT_X + 18, 274)}, "left_arm_pose": {"hand": (PIVOT_X - 18, 326), "elbow": (PIVOT_X - 18, 274)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (-3, 0), "head_offset": (-4, 1), "hat_tilt": -4, "right_arm_pose": {"hand": (PIVOT_X + 10, 326), "elbow": (PIVOT_X + 12, 274)}, "left_arm_pose": {"hand": (PIVOT_X - 10, 326), "elbow": (PIVOT_X - 12, 274)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg, "coat_flutter": -2.0},
            {"torso_offset": (-2, 0), "head_offset": (-2, 0.5), "hat_tilt": -2, "right_arm_pose": {"hand": (PIVOT_X + 14, 326), "elbow": (PIVOT_X + 15, 274)}, "left_arm_pose": {"hand": (PIVOT_X - 14, 326), "elbow": (PIVOT_X - 15, 274)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg, "coat_flutter": -1.0},
            {"torso_offset": (0, 0), "head_offset": (0, 0), "hat_tilt": 0, "right_arm_pose": {"hand": (PIVOT_X + 22, 326), "elbow": (PIVOT_X + 20, 274)}, "left_arm_pose": {"hand": (PIVOT_X - 22, 326), "elbow": (PIVOT_X - 20, 274)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg}
        ],
        "inspect": [
            {"torso_offset": (4, 0), "head_offset": (6, 4), "hat_tilt": 4, "right_arm_pose": {"hand": (PIVOT_X + 10, 260), "elbow": (PIVOT_X + 22, 245)}, "left_arm_pose": {"hand": (PIVOT_X - 6, 260), "elbow": (PIVOT_X - 18, 245)}, "left_hand_prop": "notebook", "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (6, 0), "head_offset": (10, 8), "hat_tilt": 6, "right_arm_pose": {"hand": (PIVOT_X + 8, 255), "elbow": (PIVOT_X + 20, 240)}, "left_arm_pose": {"hand": (PIVOT_X - 8, 255), "elbow": (PIVOT_X - 20, 240)}, "left_hand_prop": "notebook", "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (8, 0), "head_offset": (12, 10), "hat_tilt": 8, "right_arm_pose": {"hand": (PIVOT_X + 6, 252), "elbow": (PIVOT_X + 18, 238)}, "left_arm_pose": {"hand": (PIVOT_X - 10, 252), "elbow": (PIVOT_X - 22, 238)}, "left_hand_prop": "notebook", "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (8, 0), "head_offset": (12, 10), "hat_tilt": 8, "right_arm_pose": {"hand": (PIVOT_X + 6, 252), "elbow": (PIVOT_X + 18, 238)}, "left_arm_pose": {"hand": (PIVOT_X - 10, 252), "elbow": (PIVOT_X - 22, 238)}, "left_hand_prop": "notebook", "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (5, 0), "head_offset": (8, 6), "hat_tilt": 5, "right_arm_pose": {"hand": (PIVOT_X + 9, 256), "elbow": (PIVOT_X + 21, 242)}, "left_arm_pose": {"hand": (PIVOT_X - 7, 256), "elbow": (PIVOT_X - 19, 242)}, "left_hand_prop": "notebook", "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (0, 0), "head_offset": (0, 0), "hat_tilt": 0, "right_arm_pose": {"hand": (PIVOT_X + 22, 326), "elbow": (PIVOT_X + 20, 274)}, "left_arm_pose": {"hand": (PIVOT_X - 22, 326), "elbow": (PIVOT_X - 20, 274)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg}
        ],
        "use_mid": [
            # Inspector steps forward, raises right arm holding Rusty Key horizontally towards keyhole
            {"torso_offset": (3, 0), "head_offset": (4, 2), "hat_tilt": 2, "right_arm_pose": {"hand": (PIVOT_X + 32, 280), "elbow": (PIVOT_X + 24, 260)}, "left_arm_pose": {"hand": (PIVOT_X - 16, 324), "elbow": (PIVOT_X - 16, 274)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (6, 0), "head_offset": (8, 4), "hat_tilt": 3, "right_arm_pose": {"hand": (PIVOT_X + 54, 268), "elbow": (PIVOT_X + 34, 250)}, "left_arm_pose": {"hand": (PIVOT_X - 14, 324), "elbow": (PIVOT_X - 16, 274)}, "right_hand_prop": "key", "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (8, 0), "head_offset": (10, 4), "hat_tilt": 4, "right_arm_pose": {"hand": (PIVOT_X + 62, 265), "elbow": (PIVOT_X + 38, 248)}, "left_arm_pose": {"hand": (PIVOT_X - 14, 324), "elbow": (PIVOT_X - 16, 274)}, "right_hand_prop": "key", "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (8, 0), "head_offset": (10, 4), "hat_tilt": 4, "right_arm_pose": {"hand": (PIVOT_X + 62, 265), "elbow": (PIVOT_X + 38, 248)}, "left_arm_pose": {"hand": (PIVOT_X - 14, 324), "elbow": (PIVOT_X - 16, 274)}, "right_hand_prop": "key", "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (5, 0), "head_offset": (6, 2), "hat_tilt": 2, "right_arm_pose": {"hand": (PIVOT_X + 44, 274), "elbow": (PIVOT_X + 28, 256)}, "left_arm_pose": {"hand": (PIVOT_X - 16, 324), "elbow": (PIVOT_X - 16, 274)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (0, 0), "head_offset": (0, 0), "hat_tilt": 0, "right_arm_pose": {"hand": (PIVOT_X + 22, 326), "elbow": (PIVOT_X + 20, 274)}, "left_arm_pose": {"hand": (PIVOT_X - 22, 326), "elbow": (PIVOT_X - 20, 274)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg}
        ],
        "pickup_low": [
            {"pelvis_drop": 6.0, "torso_offset": (4, 4), "head_offset": (6, 6), "hat_tilt": 6, "right_arm_pose": {"hand": (PIVOT_X + 28, 350), "elbow": (PIVOT_X + 26, 290)}, "left_arm_pose": {"hand": (PIVOT_X - 16, 330), "elbow": (PIVOT_X - 18, 275)}, "right_leg_pose": {"foot": (PIVOT_X + 16, ground), "knee": (PIVOT_X + 20, ground - 65), "angle": 0.0, "toe_off": False}, "left_leg_pose": {"foot": (PIVOT_X - 16, ground), "knee": (PIVOT_X - 12, ground - 65), "angle": 0.0, "toe_off": False}},
            {"pelvis_drop": 14.0, "torso_offset": (8, 8), "head_offset": (10, 10), "hat_tilt": 10, "right_arm_pose": {"hand": (PIVOT_X + 34, 385), "elbow": (PIVOT_X + 30, 310)}, "left_arm_pose": {"hand": (PIVOT_X - 14, 335), "elbow": (PIVOT_X - 16, 280)}, "right_leg_pose": {"foot": (PIVOT_X + 22, ground), "knee": (PIVOT_X + 28, ground - 55), "angle": 0.0, "toe_off": False}, "left_leg_pose": {"foot": (PIVOT_X - 20, ground), "knee": (PIVOT_X - 14, ground - 55), "angle": 0.0, "toe_off": False}},
            {"pelvis_drop": 20.0, "torso_offset": (10, 10), "head_offset": (14, 14), "hat_tilt": 14, "right_arm_pose": {"hand": (PIVOT_X + 38, 420), "elbow": (PIVOT_X + 34, 335)}, "left_arm_pose": {"hand": (PIVOT_X - 12, 340), "elbow": (PIVOT_X - 14, 285)}, "right_leg_pose": {"foot": (PIVOT_X + 26, ground), "knee": (PIVOT_X + 32, ground - 48), "angle": 0.0, "toe_off": False}, "left_leg_pose": {"foot": (PIVOT_X - 22, ground), "knee": (PIVOT_X - 16, ground - 48), "angle": 0.0, "toe_off": False}},
            {"pelvis_drop": 14.0, "torso_offset": (8, 8), "head_offset": (10, 10), "hat_tilt": 10, "right_arm_pose": {"hand": (PIVOT_X + 34, 385), "elbow": (PIVOT_X + 30, 310)}, "left_arm_pose": {"hand": (PIVOT_X - 14, 335), "elbow": (PIVOT_X - 16, 280)}, "right_leg_pose": {"foot": (PIVOT_X + 22, ground), "knee": (PIVOT_X + 28, ground - 55), "angle": 0.0, "toe_off": False}, "left_leg_pose": {"foot": (PIVOT_X - 20, ground), "knee": (PIVOT_X - 14, ground - 55), "angle": 0.0, "toe_off": False}},
            {"pelvis_drop": 6.0, "torso_offset": (4, 4), "head_offset": (6, 6), "hat_tilt": 6, "right_arm_pose": {"hand": (PIVOT_X + 28, 350), "elbow": (PIVOT_X + 26, 290)}, "left_arm_pose": {"hand": (PIVOT_X - 16, 330), "elbow": (PIVOT_X - 18, 275)}, "right_leg_pose": {"foot": (PIVOT_X + 16, ground), "knee": (PIVOT_X + 20, ground - 65), "angle": 0.0, "toe_off": False}, "left_leg_pose": {"foot": (PIVOT_X - 16, ground), "knee": (PIVOT_X - 12, ground - 65), "angle": 0.0, "toe_off": False}},
            {"torso_offset": (0, 0), "head_offset": (0, 0), "hat_tilt": 0, "right_arm_pose": {"hand": (PIVOT_X + 22, 326), "elbow": (PIVOT_X + 20, 274)}, "left_arm_pose": {"hand": (PIVOT_X - 22, 326), "elbow": (PIVOT_X - 20, 274)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg}
        ],
        "react": [
            {"recoil_shift": (-6, 0), "head_offset": (-8, -4), "hat_tilt": -6, "right_arm_pose": {"hand": (PIVOT_X + 20, 240), "elbow": (PIVOT_X + 28, 235)}, "left_arm_pose": {"hand": (PIVOT_X - 30, 280), "elbow": (PIVOT_X - 26, 255)}, "coat_flutter": -4.0, "right_hand_prop": "recoil_guard", "right_leg_pose": idle_right_leg, "left_leg_pose": {"foot": (PIVOT_X - 24, ground), "knee": (PIVOT_X - 20, ground - 75), "angle": -10.0, "toe_off": False}},
            {"recoil_shift": (-14, 0), "head_offset": (-16, -8), "hat_tilt": -12, "right_arm_pose": {"hand": (PIVOT_X + 16, 230), "elbow": (PIVOT_X + 26, 225)}, "left_arm_pose": {"hand": (PIVOT_X - 36, 270), "elbow": (PIVOT_X - 30, 250)}, "coat_flutter": -8.0, "right_hand_prop": "recoil_guard", "right_leg_pose": idle_right_leg, "left_leg_pose": {"foot": (PIVOT_X - 32, ground), "knee": (PIVOT_X - 26, ground - 74), "angle": -14.0, "toe_off": False}},
            {"recoil_shift": (-16, 0), "head_offset": (-18, -6), "hat_tilt": -10, "right_arm_pose": {"hand": (PIVOT_X + 16, 232), "elbow": (PIVOT_X + 26, 227)}, "left_arm_pose": {"hand": (PIVOT_X - 34, 272), "elbow": (PIVOT_X - 28, 252)}, "coat_flutter": -6.0, "right_hand_prop": "recoil_guard", "right_leg_pose": idle_right_leg, "left_leg_pose": {"foot": (PIVOT_X - 30, ground), "knee": (PIVOT_X - 24, ground - 74), "angle": -12.0, "toe_off": False}},
            {"recoil_shift": (-10, 0), "head_offset": (-10, -3), "hat_tilt": -6, "right_arm_pose": {"hand": (PIVOT_X + 18, 250), "elbow": (PIVOT_X + 26, 240)}, "left_arm_pose": {"hand": (PIVOT_X - 28, 290), "elbow": (PIVOT_X - 24, 260)}, "coat_flutter": -3.0, "right_hand_prop": "recoil_guard", "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"recoil_shift": (-4, 0), "head_offset": (-4, -1), "hat_tilt": -2, "right_arm_pose": {"hand": (PIVOT_X + 20, 280), "elbow": (PIVOT_X + 24, 255)}, "left_arm_pose": {"hand": (PIVOT_X - 24, 310), "elbow": (PIVOT_X - 22, 265)}, "coat_flutter": -1.0, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"recoil_shift": (0, 0), "head_offset": (0, 0), "hat_tilt": 0, "right_arm_pose": {"hand": (PIVOT_X + 22, 326), "elbow": (PIVOT_X + 20, 274)}, "left_arm_pose": {"hand": (PIVOT_X - 22, 326), "elbow": (PIVOT_X - 20, 274)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg}
        ],
        "hide_enter": [
            {"torso_offset": (-4, 0), "head_offset": (-6, 0), "hat_tilt": -4, "right_arm_pose": {"hand": (PIVOT_X + 14, 324), "elbow": (PIVOT_X + 16, 274)}, "left_arm_pose": {"hand": (PIVOT_X - 18, 310), "elbow": (PIVOT_X - 16, 265)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (-8, 0), "head_offset": (-10, 4), "hat_tilt": 8, "right_arm_pose": {"hand": (PIVOT_X + 10, 316), "elbow": (PIVOT_X + 14, 270)}, "left_arm_pose": {"hand": (PIVOT_X - 14, 290), "elbow": (PIVOT_X - 14, 255)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (-12, 0), "head_offset": (-14, 8), "hat_tilt": 14, "right_arm_pose": {"hand": (PIVOT_X + 6, 310), "elbow": (PIVOT_X + 12, 265)}, "left_arm_pose": {"hand": (PIVOT_X - 10, 275), "elbow": (PIVOT_X - 12, 250)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (-14, 0), "head_offset": (-16, 12), "hat_tilt": 18, "right_arm_pose": {"hand": (PIVOT_X + 4, 305), "elbow": (PIVOT_X + 10, 260)}, "left_arm_pose": {"hand": (PIVOT_X - 8, 265), "elbow": (PIVOT_X - 10, 245)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg}
        ],
        "hide_hold": [
            {"torso_offset": (-14, 0), "head_offset": (-16, 12), "hat_tilt": 18, "right_arm_pose": {"hand": (PIVOT_X + 4, 305), "elbow": (PIVOT_X + 10, 260)}, "left_arm_pose": {"hand": (PIVOT_X - 8, 265), "elbow": (PIVOT_X - 10, 245)}, "breathing_scale": 1.0, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (-14, 0), "head_offset": (-16, 12.3), "hat_tilt": 18, "right_arm_pose": {"hand": (PIVOT_X + 4, 304), "elbow": (PIVOT_X + 10, 259)}, "left_arm_pose": {"hand": (PIVOT_X - 8, 264), "elbow": (PIVOT_X - 10, 244)}, "breathing_scale": 1.015, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (-14, 0), "head_offset": (-16, 12.6), "hat_tilt": 18, "right_arm_pose": {"hand": (PIVOT_X + 4, 303), "elbow": (PIVOT_X + 10, 258)}, "left_arm_pose": {"hand": (PIVOT_X - 8, 263), "elbow": (PIVOT_X - 10, 243)}, "breathing_scale": 1.03, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (-14, 0), "head_offset": (-16, 12.2), "hat_tilt": 18, "right_arm_pose": {"hand": (PIVOT_X + 4, 304), "elbow": (PIVOT_X + 10, 259)}, "left_arm_pose": {"hand": (PIVOT_X - 8, 264), "elbow": (PIVOT_X - 10, 244)}, "breathing_scale": 1.01, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg}
        ],
        "hide_exit": [
            {"torso_offset": (-12, 0), "head_offset": (-14, 8), "hat_tilt": 14, "right_arm_pose": {"hand": (PIVOT_X + 6, 310), "elbow": (PIVOT_X + 12, 265)}, "left_arm_pose": {"hand": (PIVOT_X - 10, 275), "elbow": (PIVOT_X - 12, 250)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (-6, 0), "head_offset": (-8, 4), "hat_tilt": 6, "right_arm_pose": {"hand": (PIVOT_X + 12, 318), "elbow": (PIVOT_X + 15, 270)}, "left_arm_pose": {"hand": (PIVOT_X - 16, 295), "elbow": (PIVOT_X - 15, 258)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (-2, 0), "head_offset": (-3, 1), "hat_tilt": 2, "right_arm_pose": {"hand": (PIVOT_X + 18, 324), "elbow": (PIVOT_X + 18, 272)}, "left_arm_pose": {"hand": (PIVOT_X - 20, 315), "elbow": (PIVOT_X - 18, 268)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg},
            {"torso_offset": (0, 0), "head_offset": (0, 0), "hat_tilt": 0, "right_arm_pose": {"hand": (PIVOT_X + 22, 326), "elbow": (PIVOT_X + 20, 274)}, "left_arm_pose": {"hand": (PIVOT_X - 22, 326), "elbow": (PIVOT_X - 20, 274)}, "right_leg_pose": idle_right_leg, "left_leg_pose": idle_left_leg}
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

    print(f"Successfully generated {total_frames} cinematic pixel art frames across {len(animations)} animation states at BASELINE_Y={BASELINE_Y}.")

if __name__ == "__main__":
    output_dir = os.path.abspath(r"assets/images/characters/inspector_production")
    generate_all_inspector_animations(output_dir)
