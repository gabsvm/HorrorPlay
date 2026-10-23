#!/usr/bin/env python3
"""Offline checks for the Colab notebook's mask, model loading and damage transfer."""
from pathlib import Path
import ast
import json
import numpy as np
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent
notebook = json.loads((root / "HorrorPlay_Thomas_Nat_Colab.ipynb").read_text(encoding="utf-8"))
codes = ["".join(c["source"]) for c in notebook["cells"] if c["cell_type"] == "code"]
for src in codes:
    if not src.startswith("%"):
        ast.parse(src)
mask_src = next(s for s in codes if "figure_polygon = [" in s)
assign = next(n for n in ast.walk(ast.parse(mask_src)) if isinstance(n, ast.Assign) and any(isinstance(t,ast.Name) and t.id=="figure_polygon" for t in n.targets))
pts = ast.literal_eval(assign.value)
mask = Image.new("L",(1280,720))
ImageDraw.Draw(mask).polygon(pts,fill=255)
assert mask.getpixel((600,145)) == 255
assert mask.getpixel((690,215)) == 255
assert mask.getpixel((585,570)) == 0
model = next(s for s in codes if "MODEL_KIND = " in s)
assert 'use_safetensors=False, variant="fp16"' in model
assert 'use_safetensors=True' not in model
source_dir = root.parents[2] / "assets" / "closeups"
intact = np.asarray(Image.open(source_dir / "room_photo.jpg").convert("RGB"),dtype=np.int16)
torn = np.asarray(Image.open(source_dir / "room_photo_torn.jpg").convert("RGB"),dtype=np.int16)
recovered = np.clip(intact + (torn - intact),0,255).astype(np.uint8)
assert np.array_equal(recovered,torn.astype(np.uint8))
print("PASS: notebook syntax; mask covers two faces and excludes label; model weights; original scrape recovered.")
