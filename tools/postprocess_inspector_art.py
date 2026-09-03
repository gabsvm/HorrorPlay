"""Production polish pass for the generated Inspector frames.

This intentionally does not change pose geometry, canvas size, pivot or baseline.
It applies clean contrast modeling, subtle fabric texture, and restrained value separation
inspired by REPLACED, with zero outer glow around the silhouette.
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance, ImageFilter

ROOT = Path("assets/images/characters/inspector_production")


def _masked_layer(size: tuple[int, int], color: tuple[int, int, int, int], mask: Image.Image) -> Image.Image:
    layer = Image.new("RGBA", size, color)
    layer.putalpha(mask)
    return layer


def polish_frame(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    if alpha.getbbox() is None:
        return

    # Keep the underlying palette restrained while recovering midtone separation.
    rgb = image.convert("RGB")
    rgb = ImageEnhance.Contrast(rgb).enhance(1.05)
    rgb = ImageEnhance.Color(rgb).enhance(0.95)
    image = rgb.convert("RGBA")
    image.putalpha(alpha)

    # Soft directional noir lighting: cooler upper-left, warmer lower-right.
    width, height = image.size
    cool = Image.new("L", (width, height), 0)
    warm = Image.new("L", (width, height), 0)
    cp = cool.load()
    wp = warm.load()
    for y in range(height):
        ny = y / max(1, height - 1)
        for x in range(width):
            nx = x / max(1, width - 1)
            cp[x, y] = int(max(0.0, 1.0 - (nx * 0.75 + ny * 0.55)) * 18)
            wp[x, y] = int(max(0.0, (nx * 0.65 + ny * 0.45) - 0.45) * 14)
    cool = ImageChops.multiply(cool, alpha)
    warm = ImageChops.multiply(warm, alpha)
    image.alpha_composite(_masked_layer(image.size, (105, 160, 174, 0), cool))
    image.alpha_composite(_masked_layer(image.size, (205, 145, 79, 0), warm))

    # Fine wool fabric grain, strictly clipped to the interior silhouette.
    noise = Image.effect_noise(image.size, 11.0).convert("L")
    noise = noise.filter(ImageFilter.GaussianBlur(0.3))
    noise = noise.point(lambda p: int(abs(p - 128) * 0.12))
    noise = ImageChops.multiply(noise, alpha)
    image.alpha_composite(_masked_layer(image.size, (215, 220, 222, 0), noise))

    # Inner edge rim modeling (strictly inside the silhouette, no outer glow)
    contracted = alpha.filter(ImageFilter.MinFilter(3))
    inner_edge = ImageChops.subtract(alpha, contracted).point(lambda p: int(p * 0.12))
    image.alpha_composite(_masked_layer(image.size, (85, 120, 150, 0), inner_edge))

    # Clean pixel sharpness
    image = image.filter(ImageFilter.UnsharpMask(radius=0.8, percent=60, threshold=2))
    image.save(path, "PNG", optimize=True)


def main() -> None:
    frames = sorted(ROOT.rglob("*.png"))
    if not frames:
        raise SystemExit(f"No Inspector frames found below {ROOT}")
    for frame in frames:
        polish_frame(frame)
    print(f"Polished {len(frames)} Inspector production frames")


if __name__ == "__main__":
    main()
