# Gas lamp sprite — asset review

**Status:** Blender 4.2 rendered and visually inspected. The 2x sprite is now
installed as `web/assets/props/gas_lamp.png` for **full standing street lamps
only**, with the original procedural renderer retained as fallback for bracket
lamps/missing texture. The GLB is not loaded at runtime.

## Deliverables

| Path | Purpose |
| --- | --- |
| `gas_lamp.png` | 1x RGBA game sprite: **128 × 384 px**, visible lamp approximately **317 px high**. |
| `gas_lamp_2x.png` | 2x RGBA source sprite: **256 × 768 px**; recommended for retina/high-DPI scaling. |
| `preview_backgrounds.png` | Three-way preview: night blue-black, medium gray fog, checkerboard alpha check. |
| `render_sprite.py` | Repeatable Blender 4.2 GLB import, orthographic Cycles render, 1x/2x export and measured QA. |
| `make_preview.py` | Repeatable Pillow visual review/alpha validation. |
| `qa_metrics.json` | Machine-generated source hash, dimensions, alpha extents, and render details. |

## Source and reproduction

- Source GLB (self-contained copy of Dev benchmark):
  `web/art_review/gas_lamp/source/farol_victoriano.glb` (8 meshes, 3.32 m
  tall; not a stone/hitching post).
- Source SHA-256: `aa8ef262b4e97a95bd6e425d1314a4d74dd2030b1ed627b5ec55dee2ad055952`.
- Blender: **4.2.16 LTS**; Cycles, 48 samples, denoising, orthographic camera, film alpha.
- From the `HorrorPlay` root in PowerShell, regenerate via:

  ```powershell
  & 'C:\Program Files\Blender Foundation\Blender 4.2\blender.exe' -b -t 6 --python 'web\art_review\gas_lamp\render_sprite.py'
  py -3 'web\art_review\gas_lamp\make_preview.py'
  ```

  `render_sprite.py` also accepts an optional explicit GLB path after `--`. The preview helper uses Pillow (`PIL`).

## Actual QA measurements

- 1x: alpha bbox `(34, 36)–(93, 352)` inclusive: **60 × 317 px**; transparent margins left/top/right/bottom **34/36/34/31 px**.
- 2x: alpha bbox `(67, 72)–(188, 706)` inclusive: **122 × 635 px**; transparent margins **67/72/67/61 px**.
- Fully transparent pixels: **83.82% (1x)** and **84.42% (2x)**. Both contain fully opaque and partly transparent pixels, including the glass and antialiased silhouette. All four 2x corner pixels have `alpha=0`.
- 2x visible-pixel luminance p99: **0.7472 linear**; max **0.8973 linear**. There is no saturated white clipping in the final render.
- The complete finial, lantern, ladder support bar, fluted shaft and base are present; the double gas-burner mechanism remains visible through translucent amber glass.
- Visually inspected the 2x asset and 1x downsample as well as three real alpha composites. The fog background preview does not show dark fringes or a black rectangle around the sprite.

## Visual adjustment and rationale

The source GLB loses Blender's procedural cast-iron color when exported to glTF, leaving a near-white base material. The script restores a graphite cast-iron PBR base and retains the imported mesh and historical detailing. Physically refractive glass produced washed-out rectangular reflections at game-sprite resolution; the sprite shader uses a thin amber emission/transparent blend. This preserves visibility of the brass burner and controls highlight clipping while working over arbitrary game background colors. No geometry was authored or substituted.

The amber glow and rays into fog should come from the **existing game light system**, rather than being baked outside the alpha silhouette. This allows runtime lighting/flicker to match the scene.

## Integration and audit (executed)

The former procedural lamp was called as `A.lampPost(ctx, x, groundY, 320)`
from `web/src/scenes/bucks_row.js` and other streets. The 2x PNG is
rendered by the existing model-prop loader and `paint.js::lampPost()`.
It uses `ax=128,ay=706` as a ground-relative anchor and a scale `h/635`.
Scene lights remain under the original runtime lamp IDs with an adjusted flame
origin. Full standing lamp output has been inspected in Buck's Row, 640×360;
comparison is under
`web/art_review/scenery_refresh/comparison/AB_bucks_row_640.png`.

The 1x reference sprite could alternatively be placed at original resolution:

```js
ctx.drawImage(gasLampImage, x - 64, groundY - 352, 128, 384);
```

The model's burner sits lower inside the glass; the runtime source now returns
`groundY-h+h*0.20` while preserving game bloom, flicker, fog and wet-street
reflections. Mobile WebView performance still needs physical testing.

## Remaining limitations

- This is a **static, single-angle** sprite. No left-facing mirror, dynamic occlusion or per-pixel normal maps are supplied.
- Tiny metallic details are naturally lost at native 1x; the 2x sprite offers cleaner downsampling where supported.
- Runtime placement/lighting **was tested visually in Edge headless** on
  Buck's Row; Chrome/Edge emulation cannot establish actual Android
  thermal/performance. See scene screenshots and complete test-all report in
  `web/art_review/scenery_refresh/REPORT.md`.
