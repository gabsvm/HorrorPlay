# art_review: how to regenerate the art

Everything here is reproducible from the repository. Nothing depends on a personal path: scripts find their
files relative to themselves, and Blender is found through the `BLENDER` environment variable.

## Tools

- **Blender 5.2** (the scripts were written for 4.2 and adapted; the warnings about `use_nodes` are harmless).
  Windows default: `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`.
  ```powershell
  $bl = $env:BLENDER; if (-not $bl) { $bl = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' }
  & $bl -b --factory-startup -P web/art_review/<folder>/scripts/<build_script>.py
  ```
- **Python 3** with `pillow` and `numpy` (`pip install pillow numpy`) for packing, compositing and comparisons.
- **Node 20+** and **Chrome or Edge** for the captures from the real engine (`CHROME=<path>` to choose the browser).

## The flow for a prop

1. `build_*.py` (Blender) renders the sprite from the `.blend` in `source/`.
2. `pack_*.py` crops it, writes the PNG into `web/assets/props/` and its anchor into `assets/props/index.json`.
3. The scene draws it with `drawProp(...)` and keeps the procedural drawing as a fallback.
4. `capture_*.mjs` takes the before/after from the real engine at 640x360, `make_comparison.py` joins them.
5. `node web/tools/test-all.mjs` must stay green.

## Folders

`scenery_refresh` (post, boat, crate, regression audit) · `gas_lamp` · `wexley_mirror` · `room_photo_map` (`v2/`: the
photograph) · `greaves_study` (`v2/`: the jars) · `hanbury_yard` (`v2/`: mangle decision) · `alleys` · `polish_t6` ·
`thomas_v2` (benchmark, not integrated; its `working/` scripts are scratch).

Keep only the side-by-side comparison at 640x360 and the report in each folder; delete intermediate captures.
