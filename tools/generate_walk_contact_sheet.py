#!/usr/bin/env python3
"""
Generates an 8-frame walk cycle contact sheet with frame labels and baseline guide
showing the lateral human walk cycle according to REPLACED aesthetic.
"""
import os
from PIL import Image, ImageDraw

CANVAS_WIDTH = 384
CANVAS_HEIGHT = 512
BASELINE_Y = 460
WALK_DIR = "assets/images/characters/inspector_production/walk"
OUTPUT_PATH = "docs/screenshots/walk_8_frames_contact_sheet.png"

FRAME_LABELS = [
    "1. R-Contact (Heel Strike)",
    "2. R-Down (Weight Cushion)",
    "3. R-Passing (Stance)",
    "4. R-Up (Push-off)",
    "5. L-Contact (Heel Strike)",
    "6. L-Down (Weight Cushion)",
    "7. L-Passing (Stance)",
    "8. L-Up (Push-off)"
]

def generate_contact_sheet():
    frames = [f"inspector_walk_{i:02d}.png" for i in range(1, 9)]
    images = [Image.open(os.path.join(WALK_DIR, f)) for f in frames]

    scale_factor = 0.5  # 192x256 per frame
    thumb_w = int(CANVAS_WIDTH * scale_factor)
    thumb_h = int(CANVAS_HEIGHT * scale_factor)
    thumb_baseline = int(BASELINE_Y * scale_factor)

    margin_x = 24
    header_h = 70
    footer_h = 60
    card_w = margin_x * 2 + thumb_w * 8 + 16 * 7
    card_h = header_h + thumb_h + footer_h

    sheet = Image.new("RGBA", (card_w, card_h), (14, 18, 24, 255))
    draw = ImageDraw.Draw(sheet)

    # Title Banner
    draw.rectangle([0, 0, card_w, header_h], fill=(20, 26, 36, 255))
    draw.line([(0, header_h - 1), (card_w, header_h - 1)], fill=(160, 130, 65, 255), width=2)
    draw.text((margin_x, 16), "HORRORPLAY - INSPECTOR LATERAL WALK CYCLE (8 FRAMES)", fill=(235, 225, 210, 255))
    draw.text((margin_x, 40), "Canonical Right-Facing (+X) Locomotion | Forward Knee Articulation | Ground Contact Baseline Y=460", fill=(140, 160, 180, 255))

    # Place the 8 frames
    for i, img in enumerate(images):
        x = margin_x + i * (thumb_w + 16)
        y = header_h + 10

        # Frame backing card
        draw.rectangle([x - 2, y - 2, x + thumb_w + 2, y + thumb_h + 2], fill=(8, 11, 15, 255), outline=(40, 50, 65, 255), width=1)
        
        # Resampled thumbnail
        thumb = img.resize((thumb_w, thumb_h), Image.Resampling.NEAREST)
        sheet.alpha_composite(thumb, (x, y))

        # Ground baseline indicator line
        draw.line([(x, y + thumb_baseline), (x + thumb_w, y + thumb_baseline)], fill=(185, 145, 65, 180), width=1)

        # Label below frame
        label_text = FRAME_LABELS[i]
        draw.text((x, y + thumb_h + 8), label_text, fill=(210, 200, 185, 255))

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    sheet.save(OUTPUT_PATH, "PNG")
    print(f"Successfully generated contact sheet at {OUTPUT_PATH} ({card_w}x{card_h})")

if __name__ == "__main__":
    generate_contact_sheet()
