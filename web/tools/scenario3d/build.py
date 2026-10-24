"""Download, render and optionally install four Scenario CC-BY-4.0 props.

From the repository root:
    py -3 web/tools/scenario3d/build.py --blender "C:/Program Files/Blender Foundation/Blender 4.3/blender.exe"
    py -3 web/tools/scenario3d/build.py --install --blender "PATH_TO_BLENDER"

Default = prepare proof sprites in a temp directory; NO modifications to game.
--install = copy 4 optimized PNG sprites into web/assets/props and merge index.json.
Requires Pillow in the SYSTEM Python and Blender 3.6+ with glTF import support.
"""
import argparse
import json
import os
import shutil
import struct
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

HERE = Path(__file__).resolve().parent
WEB = HERE.parent.parent
ROOT = WEB.parent
MANIFEST = json.loads((HERE / "manifest.json").read_text(encoding="utf-8"))
BASE = "https://huggingface.co/datasets/scenario-labs/3d-collection/resolve/main/assets/"
LIMIT = 130 * 1024 * 1024  # refuse surprising oversized downloads
MAX_TRIANGLES = 5_000_000

def inspect_glb(path):
    with path.open("rb") as stream:
        header = stream.read(20)
        if len(header) < 20:
            raise ValueError("Truncated GLB")
        magic, version, length, json_size, json_type = struct.unpack("<4sIII4s", header)
        if magic != b"glTF" or version != 2 or length != path.stat().st_size or json_type != b"JSON":
            raise ValueError("Invalid glTF v2 binary header")
        if json_size > LIMIT or json_size <= 0:
            raise ValueError("Invalid GLB JSON length")
        payload = json.loads(stream.read(json_size))
    accessors = payload.get("accessors", [])
    triangles = 0
    for mesh in payload.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            if primitive.get("mode", 4) != 4:
                continue
            if "indices" in primitive:
                count = accessors[primitive["indices"]]["count"]
            else:
                count = accessors[primitive["attributes"]["POSITION"]]["count"]
            triangles += count // 3
    if not payload.get("meshes") or triangles < 10 or triangles > MAX_TRIANGLES:
        raise ValueError("GLB geometry rejected; triangles=" + str(triangles))
    return triangles

def download(asset, model_dir):
    name, asset_id = asset["name"], asset["id"]
    if not (name.startswith("scenario_") and asset_id.isalnum()):
        raise ValueError("Unexpected asset ID/name")
    target = model_dir / (name + ".glb")
    if not target.exists():
        url = BASE + "scenario_asset_" + asset_id + "/output.glb"
        req = urllib.request.Request(url, headers={"User-Agent": "HorrorPlay-scenario3d-import/1.0"})
        tmp = target.with_suffix(".download")
        total = 0
        try:
            with urllib.request.urlopen(req, timeout=90) as response, tmp.open("wb") as out:
                while True:
                    buf = response.read(1024 * 1024)
                    if not buf:
                        break
                    total += len(buf)
                    if total > LIMIT:
                        raise ValueError("Source exceeds 130 MiB: " + name)
                    out.write(buf)
            os.replace(tmp, target)
        finally:
            tmp.unlink(missing_ok=True)
    if target.stat().st_size > LIMIT:
        raise ValueError("Source exceeds size limit: " + name)
    tri = inspect_glb(target)
    print(f"{name}: {target.stat().st_size / 1048576:.1f} MiB / {tri:,} triangles")
    return target

def render(blender, source, dest):
    script = HERE / "render_glb.py"
    subprocess.run([str(blender), "-b", "--factory-startup", "-P", str(script),
                    "--", str(source), str(dest)], cwd=ROOT, check=True, timeout=1200)
    if not dest.is_file():
        raise RuntimeError("Blender did not produce " + str(dest))

def optimize(proof, target, height):
    im = Image.open(proof).convert("RGBA")
    alpha = im.getchannel("A")
    bbox = alpha.point(lambda x: 255 if x > 8 else 0).getbbox()
    if not bbox:
        raise RuntimeError("Blender rendered empty alpha: " + str(proof))
    cropped = im.crop(bbox)
    ratio = height / cropped.height
    w = max(4, min(240, round(cropped.width * ratio)))
    h = max(4, round(cropped.height * min(ratio, 240 / cropped.width)))
    cropped = cropped.resize((w, h), Image.Resampling.LANCZOS)
    # The game uses dark, aged, prerendered sprites. Preserve alpha unchanged.
    r, g, b, a = cropped.split()
    rgb = Image.merge("RGB", (r, g, b))
    rgb = ImageEnhance.Color(rgb).enhance(0.70)
    rgb = ImageEnhance.Brightness(rgb).enhance(0.73)
    rgb = Image.blend(ImageOps.colorize(rgb.convert("L"), black="#1e1b17", white="#b7aa8f"), rgb, 0.60)
    result = rgb.convert("RGBA")
    result.putalpha(a)
    result.save(target, optimize=True)
    check = Image.open(target)
    if check.mode != "RGBA" or not check.getchannel("A").getbbox():
        raise RuntimeError("Alpha validation failed")
    return {"w": w, "h": h, "ax": w // 2, "ay": h - 1}

def install(results, staging):
    prop_dir = WEB / "assets" / "props"
    index_path = prop_dir / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8"))
    existing = set(index)
    for name in results:
        if name in existing or (prop_dir / (name + ".png")).exists():
            raise RuntimeError("Refusing to overwrite existing game prop: " + name)
    # Write backup of the index in staging, then install only validated sources.
    (staging / "index-before.json").write_text(json.dumps(index, indent=1), encoding="utf-8")
    for name, meta in results.items():
        shutil.copyfile(staging / (name + ".png"), prop_dir / (name + ".png"))
        index[name] = meta
    tmp = index_path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(index, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    os.replace(tmp, index_path)
    print("INSTALLED 4 PROPS: " + ", ".join(results))

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--install", action="store_true",
                   help="Copy rendered sprites and merge index.json; default previews only.")
    p.add_argument("--blender", default=shutil.which("blender"))
    p.add_argument("--work-dir", default=str(Path(tempfile.gettempdir()) / "HorrorPlay_Scenario3D"))
    args = p.parse_args()
    if not args.blender or not Path(args.blender).is_file():
        p.error("Blender executable not found: use --blender PATH")
    work = Path(args.work_dir)
    models, staging = work / "models", work / "proof"
    models.mkdir(parents=True, exist_ok=True)
    staging.mkdir(parents=True, exist_ok=True)
    meta = {}
    for asset in MANIFEST["assets"]:
        source = download(asset, models)
        proof = staging / (asset["name"] + "_512.png")
        render(args.blender, source, proof)
        dest = staging / (asset["name"] + ".png")
        meta[asset["name"]] = optimize(proof, dest, asset["target_height"])
    (staging / "props.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print("PROOFS:", staging)
    if args.install:
        install(meta, staging)
    else:
        print("Preview-only mode: game files unchanged. Use --install after visual QA.")

if __name__ == "__main__":
    main()
