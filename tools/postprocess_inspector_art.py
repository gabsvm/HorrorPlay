"""Production polish pass for the generated Inspector frames.

This intentionally does not change pose geometry, canvas size, pivot or baseline.
It adds fabric/noir texture, directional tonal variation and restrained rim light
so the committed raster frames read less like flat debug vector shapes.
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
    rgb = ImageEnhance.Contrast(rgb).enhance(1.08)
    rgb = ImageEnhance.Color(rgb).enhance(0.92)
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
            cp[x, y] = int(max(0.0, 1.0 - (nx * 0.75 + ny * 0.55)) * 24)
            wp[x, y] = int(max(0.0, (nx * 0.65 + ny * 0.45) - 0.45) * 18)
    cool = ImageChops.multiply(cool, alpha)
    warm = ImageChops.multiply(warm, alpha)
    image.alpha_composite(_masked_layer(image.size, (105, 160, 174, 0), cool))
    image.alpha_composite(_masked_layer(image.size, (205, 145, 79, 0), warm))

    # Fine fabric/paper grain, clipped to the actual silhouette.
    noise = Image.effect_noise(image.size, 13.0).convert("L")
    noise = noise.filter(ImageFilter.GaussianBlur(0.35))
    noise = noise.point(lambda p: int(abs(p - 128) * 0.17))
    noise = ImageChops.multiply(noise, alpha)
    image.alpha_composite(_masked_layer(image.size, (215, 220, 222, 0), noise))

    # Thin cool exterior rim and tiny warm interior edge keep the silhouette readable
    # against the dark environments without turning the actor into a glowing cutout.
    expanded = alpha.filter(ImageFilter.MaxFilter(5))
    outer_edge = ImageChops.subtract(expanded, alpha).point(lambda p: int(p * 0.24))
    image.alpha_composite(_masked_layer(image.size, (91, 151, 163, 0), outer_edge))

    contracted = alpha.filter(ImageFilter.MinFilter(3))
    inner_edge = ImageChops.subtract(alpha, contracted).point(lambda p: int(p * 0.10))
    image.alpha_composite(_masked_layer(image.size, (202, 148, 82, 0), inner_edge))

    # Final restrained sharpening after compositing.
    image = image.filter(ImageFilter.UnsharpMask(radius=0.9, percent=75, threshold=3))
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
