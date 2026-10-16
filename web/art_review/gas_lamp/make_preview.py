"""Review the transparent sprite against three game-style backgrounds.

Requires Pillow: py -3 web/art_review/gas_lamp/make_preview.py
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


HERE = Path(__file__).resolve().parent
SPRITE = HERE / "gas_lamp_2x.png"
OUTPUT = HERE / "preview_backgrounds.png"


def main():
    with Image.open(SPRITE) as original:
        assert original.mode == "RGBA", f"Expected RGBA, got {original.mode}"
        assert original.size == (256, 768), original.size
        sprite = original.copy()

    alpha = sprite.getchannel("A")
    assert alpha.getextrema()[0] == 0, "Missing fully transparent pixels"
    assert alpha.getextrema()[1] == 255, "Missing fully opaque pixels"
    assert all(alpha.getpixel(p) == 0 for p in [(0, 0), (255, 0), (0, 767), (255, 767)])

    labels = ["NIGHT STREET", "FOG / TWILIGHT", "TRANSPARENCY CHECK"]
    atlas = Image.new("RGB", (832, 842), (21, 24, 28))
    draw = ImageDraw.Draw(atlas)
    for idx, label in enumerate(labels):
        x = 8 + idx * 280
        backdrop = Image.new("RGBA", (256, 768), [(11, 18, 25, 255), (78, 87, 89, 255), (47, 52, 57, 255)][idx])
        if idx == 2:
            pattern = ImageDraw.Draw(backdrop)
            for row in range(0, 768, 32):
                for col in range(0, 256, 32):
                    if ((row + col) // 32) % 2 == 0:
                        pattern.rectangle((col, row, col + 31, row + 31), fill=(76, 80, 82, 255))
        backdrop.alpha_composite(sprite)
        atlas.paste(backdrop.convert("RGB"), (x, 54))
        draw.text((x + 6, 18), label, fill=(228, 219, 202), font=ImageFont.load_default())
    atlas.save(OUTPUT, optimize=True)
    print(f"QA PASS: RGBA, 256x768, transparent/opaque pixels present, transparent corners")
    print(f"Preview: {OUTPUT}")


if __name__ == "__main__":
    main()
