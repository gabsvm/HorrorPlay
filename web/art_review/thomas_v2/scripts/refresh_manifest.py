"""Refresh SHA-256/size inventory for versioned art_review/thomas_v2 artifacts.

Does not touch the game, source model, or .git directory.
Excludes ephemeral working/ and Blender's backup .blend1 files.
"""
import hashlib
import json
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent
dest = root / "MANIFEST.json"
obj = json.loads(dest.read_text(encoding="utf-8"))
obj["base"]["head"] = "a373cae93a4abb7568ea2a13346b0da25d7fe60e"
obj["base"]["git_status"] = "QA modifications isolated to web/art_review/thomas_v2/"
files = []
for p in sorted(root.rglob("*")):
    if not p.is_file() or p == dest or "working" in p.relative_to(root).parts or p.suffix == ".blend1":
        continue
    path = p.relative_to(root).as_posix()
    data = p.read_bytes()
    entry = {"path": path, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
    if p.suffix.lower() in (".png", ".gif"):
        with Image.open(p) as im:
            entry["pixels"] = list(im.size)
    files.append(entry)
obj["files"] = files
dest.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("MANIFEST refreshed", len(files), "files (excluding working/)")
