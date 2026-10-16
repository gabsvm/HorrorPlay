# Photo v2 scripts — reproduce everything (no personal paths)

The Blender path comes from `$BLENDER` (or the argument shown); the
typical Windows install is only the documented default:

```powershell
$bl = $env:BLENDER
if (-not $bl) { $bl = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' }
$V2 = 'web/art_review/room_photo_map/v2'
# 1. studio master (procedural boys + Victorian lights + ortho camera)
&$bl -b --python $V2/scripts/build_blend.py
# 2. figure plates + JSON sidecars (head/feet pixels pin the legacy anchors)
&$bl -b $V2/source/photo_studio_v2.blend --python $V2/scripts/render_figures.py -- --variant all
# 3. candidates (PIL finish only: canvas, ageing, mount, seal — never anatomy)
python $V2/scripts/compose_v2.py --mode candidates
# 4. integrate the favorite into web/assets (asserts anchors + luminance + eyes)
python $V2/scripts/compose_v2.py --mode final --favorite B
# 5. real-engine captures before/after at 640x360 (+1280x720) and AB sheets
node $V2/scripts/capture_v2.mjs before   # run BEFORE integrating
node $V2/scripts/capture_v2.mjs after
python $V2/scripts/make_comparison_v2.py
```

`capture_v2.mjs` forces chapter 3 via the `room_phase` flag (same flag QA
uses; see `room.js` `phase(G)`), and pins the inspection lantern between
the two heads so before/after are comparable. Default outputs land in
`../work/` (regenerable, not shipped).
