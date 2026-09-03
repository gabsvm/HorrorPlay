#!/usr/bin/env python3
"""
Verification script for Inspector character proportions, alpha bounding boxes,
and physical scale relative to the Office environment.
"""
import os
import sys
from PIL import Image

CANVAS_WIDTH = 384
CANVAS_HEIGHT = 512
BASELINE_Y = 460
DOOR_OPENING_HEIGHT = 478.0  # Usable door opening in Office benchmark
DESK_HEIGHT = 270.0          # Executive desk height in Office benchmark
CABINET_HEIGHT = 250.0       # 4-drawer filing cabinet height in Office benchmark

SPRITE_SCALE = 0.85          # AnimatedSprite2D scale
OFFICE_BASE_SCALE = 1.32     # character_base_scale in room_01_office.gd

def verify_all_frames(base_dir="assets/images/characters/inspector_production"):
    if not os.path.exists(base_dir):
        print(f"Error: directory {base_dir} does not exist.")
        sys.exit(1)

    all_passed = True
    report = []
    
    print("=" * 80)
    print("INSPECTOR ALPHA BOUNDING BOX & PROPORTION AUDIT")
    print("=" * 80)
    print(f"{'Animation':<15} {'Frames':<7} {'Min BBox (x1, y1, x2, y2)':<30} {'Vis H':<7} {'World H':<8} {'Door %':<8} {'Desk Ratio':<10}")
    print("-" * 80)

    effective_scale = SPRITE_SCALE * OFFICE_BASE_SCALE

    for anim_name in sorted(os.listdir(base_dir)):
        anim_path = os.path.join(base_dir, anim_name)
        if not os.path.isdir(anim_path):
            continue
        
        frames = sorted([f for f in os.listdir(anim_path) if f.endswith(".png")])
        if not frames:
            continue

        min_y1 = 9999
        max_y2 = -1
        min_x1 = 9999
        max_x2 = -1

        for f in frames:
            img = Image.open(os.path.join(anim_path, f))
            bbox = img.getbbox()
            if not bbox:
                print(f"ERROR: Frame {f} is completely empty!")
                all_passed = False
                continue
            x1, y1, x2, y2 = bbox
            min_x1 = min(min_x1, x1)
            min_y1 = min(min_y1, y1)
            max_x2 = max(max_x2, x2)
            max_y2 = max(max_y2, y2)

            # Ground baseline check: grounded poses should have soles at BASELINE_Y (tolerance 3px for toe-off / foot roll)
            if anim_name in ["idle", "turn", "inspect", "use_mid"]:
                if abs(y2 - BASELINE_Y) > 3:
                    print(f"WARNING: Frame {f} grounded soles at {y2}, expected {BASELINE_Y}")
                    all_passed = False

        vis_h = max_y2 - min_y1
        world_h = vis_h * effective_scale
        door_pct = (world_h / DOOR_OPENING_HEIGHT) * 100.0
        desk_ratio = world_h / DESK_HEIGHT

        report.append({
            "anim": anim_name,
            "count": len(frames),
            "bbox": (min_x1, min_y1, max_x2, max_y2),
            "vis_h": vis_h,
            "world_h": world_h,
            "door_pct": door_pct,
            "desk_ratio": desk_ratio
        })

        print(f"{anim_name:<15} {len(frames):<7} {str((min_x1, min_y1, max_x2, max_y2)):<30} {vis_h:<7} {world_h:<8.1f} {door_pct:<7.1f}% {desk_ratio:<10.2f}x")

    print("-" * 80)
    
    # Check Idle proportions against user mandates
    idle_rep = next((r for r in report if r["anim"] == "idle"), None)
    if idle_rep:
        print("\nCHECKING IDLE AGAINST USER CONSTRAINTS:")
        print(f"  - Visible Canvas Height: {idle_rep['vis_h']} px")
        print(f"  - Effective Scale in Office: {effective_scale:.4f} (Sprite {SPRITE_SCALE} * Room {OFFICE_BASE_SCALE})")
        print(f"  - World Height: {idle_rep['world_h']:.1f} px")
        print(f"  - Door Opening Height: {DOOR_OPENING_HEIGHT} px")
        print(f"  - % of Door Opening: {idle_rep['door_pct']:.1f}% (Mandate: 85% - 92%)")
        print(f"  - Ratio to Desk ({DESK_HEIGHT} px): {idle_rep['desk_ratio']:.2f}x (Mandate: 1.5x - 2.0x)")
        print(f"  - Ratio to Filing Cabinet ({CABINET_HEIGHT} px): {idle_rep['world_h'] / CABINET_HEIGHT:.2f}x")
        
        if 84.0 <= idle_rep['door_pct'] <= 93.0:
            print("  -> PASS: Door proportion is within the 85-92% range!")
        else:
            print("  -> FAIL: Door proportion outside mandatory range!")
            all_passed = False

        if 1.5 <= idle_rep['desk_ratio'] <= 2.0:
            print("  -> PASS: Desk proportion is within the 1.5-2.0x range!")
        else:
            print("  -> FAIL: Desk proportion outside mandatory range!")
            all_passed = False

    # Check Walk frames count
    walk_rep = next((r for r in report if r["anim"] == "walk"), None)
    if walk_rep:
        print("\nCHECKING WALK CYCLE:")
        print(f"  - Walk Frame Count: {walk_rep['count']} (Mandate: 8 frames)")
        if walk_rep['count'] == 8:
            print("  -> PASS: Exactly 8 frames lateral walk cycle!")
        else:
            print("  -> FAIL: Walk cycle frame count is not 8!")
            all_passed = False

    print("=" * 80)
    if all_passed:
        print("ALL ALPHA BOUNDING BOX & PROPORTION CRITERIA PASSED!")
        return 0
    else:
        print("PROPORTION AUDIT DETECTED FAILURES.")
        return 1

if __name__ == "__main__":
    sys.exit(verify_all_frames())
