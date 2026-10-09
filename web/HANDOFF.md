# El Huésped: handoff

State on 2026-10-08, branch `reboot/web-el-huesped`, last commit `619c269`. Working tree clean.
The user played the 1.0-rc6 APK on their phone (Moto g86 Power) and reports it runs very well.

## What it is

Lovecraftian point-and-click horror set in Whitechapel in 1888. The protagonist, Inspector Thomas
Ashgrove, investigates the Ripper murders without knowing that he is the Ripper, possessed by "the
Guest". It is a vanilla JS web game in `web/`, with no framework and no runtime dependencies. It is
published as a single-file claude.ai Artifact and as an Android APK. The story and the characters
are in `web/STORY_BIBLE.md`. The Godot project at the repo root (`project.godot`, `src/`) and `unity/`
are earlier attempts and are not used.

The user writes in Spanish, and all game text is in Spanish. They test on Android, and nothing is
hosted publicly.

## Commands (run from `web/`)

| What | Command |
|---|---|
| Dev server | `python tools/serve.py 5317`, or `preview_start` with the name `el-huesped` (`.claude/launch.json` at the repo root) |
| Smoke test (every scene, mocked canvas/WebGL) | `node tools/smoke.mjs` |
| Full playthrough (expects 22 deductions, no errors) | `node tools/walk.mjs` |
| Bad-player playthrough | `node tools/walk.mjs alt` (expects `"ok": true`) |
| Audio | `node tools/audio-smoke.mjs` |
| Sprite lab | `tests/sprites.html?who=&s=&cols=&only=&portrait=1` |
| Artifact build | `npx esbuild src/main.js --bundle --format=iife --minify --outfile=<scratch>/bundle.js`, then `python tools/build-artifact.py <scratch>/el-huesped.html` (it reads `bundle.js` next to the output) |
| Republish | Artifact publish to `https://claude.ai/artifact/AZiipwBV3rbng52121UQsX` |
| APK | `VERSION=1.0-rcN bash tools/build-apk.sh`, then copy `dist/el-huesped.apk` to `dist/ElHuesped-1.0-rcN.apk` and send it with SendUserFile. The version code is the git commit count, so each build installs over the previous one. The debug keystore `android/debug.keystore` is local and gitignored. |
| Character models | `blender -b --factory-startup -P tools/blender/figure.py -- <scratch>/m/<who> <who> [anims]`, then `python tools/blender/pack.py <scratch>/m/<who> <who>` (writes `assets/models/<who>/`). The cast is in `tools/blender/cast.py`; Blender 5.2 is installed with winget; pack needs Pillow and numpy. |
| Portraits | Generate with `PORTRAITS.md`, then `python tools/portraits.py <folder>` (writes `assets/portraits/`). Missing ones fall back to the painted bust. |
| Rebuild audio | `python tools/build-audio.py` (CC0 sources in the gitignored `assets-src/audio/`; credits in `assets/audio/CREDITS.md`) |

Dev URL parameters: `?scene=<id>&x=<px>&noenter&flags=a,b` or `?chapter=<n>`.

## Browser verification tips (built-in pane)

- Adaptive quality drops to low in the slow pane. Force it with `game.adaptQuality = () => {}; game.r.lowFx = false`.
- When the pane is hidden, `requestAnimationFrame` and timers stall. Drive frames by hand with
  `game.tick(performance.now(), dt)`. Avoid scripts that await rAF.
- To capture: `game.r.view.toDataURL()` (the canvas is created with `preserveDrawingBuffer`), then
  show it scaled up in an `<img>` with `image-rendering: pixelated` and take a screenshot or zoom.
  To compare low and high quality, render one frame with `r.lowFx = true` and another with
  `false`, setting `r._staticKey = null` before each.
- Restore saves and prefs in localStorage after browser tests. Reset the viewport to `desktop` when done.

## Architecture

The renderer is `src/engine/renderer.js`.
- Everything is painted with Canvas 2D at a logical 1280x720 and reduced to a 640x360 pixel grid,
  snapped to the palette in `src/art/pixel.js` with Bayer dither.
- A WebGL pass composites these layers:
  - `tFar`: background, pre-lit.
  - `tNear`: the playable plane, actors and live props.
  - `tFg`: foreground, with depth of field.
  - `tLight`: a 320x180 lightmap.
  - `tFog`.
  - `tGlow`: additive.
  - `tStat`: a copy of the static near layer only, used to tell scenery from figures.
  - `tFront`: a fog bank in front of everything.
  - `tPal`: the palette lookup texture.
- With quality not low (`uFx`), the shader also does:
  - Per-pixel relief from the painted albedo, lit by up to 8 lights (`pickLights`, which always
    includes the player's lantern cone).
  - Wet-ground reflections with ripples and puddles (`scene.reflectY`, `scene.wet`).
  - Bloom from the soft buffers.
  - Rays from up to 2 lamps through the fog.
  - A specular glint on blood pixels.
- Live props (`scene.drawNear`, `scene.life[].draw`, `drawNearOver`) are drawn straight into the
  near canvas, and the shader snaps them to the palette (`uQuant`, `paletteLut()`). A CPU readback
  path remains for GPUs with fewer than 9 texture units. **Never reintroduce per-frame
  `getImageData` on canvases drawn to the GPU**: that readback was costing 8–10 ms per frame.
- Quality: `prefs.quality` can be auto, alta or baja. `adaptQuality` in `game.js` sets
  `r.lowFx` and `Actor.lowFx`. Auto switches to low when CPU cost per frame exceeds 15 ms, or when
  the real frame rate stays below 25 fps. Every new effect must be disabled under lowFx.

Actors are in `src/engine/actor.js`.
- `drawFigure` draws the figure procedurally. The sprite pass is: `_hi` canvas, then `rimLights`
  (the `_rim` canvas must stay `willReadFrequently`), then `pixelizeInto` into `_lo`, then
  `shadeVolume`, then `blit` (shadow and reflection).
- Poses: kneel, reach, cower, sit, take, inspect, recoil, clutch, write.
- Movement: `run`, `climb`, `reachTo` (two-bone IK), `lookAt`.
- Still figures rebuild their sprite at 5 fps.
- `Actor.lightsNow` is set by the renderer for live props that need the lights, such as corpses.

Models (`src/engine/model.js`): the cast from `tools/blender/cast.py`, mapped by actor name in
`modelFor`, assigned in `game.addActor`. Two atlases per character: colour (indexed PNG) and
camera-space normals at half size (blue = lantern glass). `Actor.modelFrame` picks the frame (reach by
height, pose, pose_talk, turn, walk/walkh/run by gait phase, talk, idle) and returns null for anything
not rendered, which falls back to `drawFigure`. `shadeVolume` lights the frame with `normalsFor`.
`?procedural` disables models. `pack.py` crops every frame to the box the figure uses and stores the
lantern glass lit (Actor dims it when the lantern is out). `releaseModels` (called by `goto`) drops the
decoded atlases nobody in the new scene uses; `loadModel` reloads them on demand. The victims (polly,
annie, kate) are models too, drawn by `corpse.js`, with the cape or sacking draped in Blender.
Portraits: `src/engine/portraits.js` (preloaded at start), `Actor.drawPainted`. Mrs Richardson has
none yet: the image sent for her was the widow's.

Corpses: `src/scenes/corpse.js` `drawCorpse` puts the figure on its back. Above low quality it goes
through the same sprite pass (rim and volume, re-rendered at about 3 fps).

Swinging signs:
- `src/art/paint.js` `live` collects `hangingSign` and `pawnSign` while a scene builds; only the
  bracket stays painted.
- `game.buildLayers` wraps each collected item in a `Swing` (`src/engine/life.js`, with the
  `gust(t)` wind).
- Signs with `fg: true` go to `scene.fgSwings` and are redrawn with the foreground layer.

Atmosphere, in `renderer.atmosphere`:
- Embers from lights with `sparks: n` (the brazier and torches in the knackers' yard).
- Dust in lit interiors.
- Drizzle in layers inside `drawRain`.
- Denser, curling `Smoke`.

UI is in `src/engine/ui.js`.
- `say` handles dialogue and portraits; there are also the notebook and the satchel inventory.
- `inspect()` is the crime-scene close-up. Above low quality it is relit per pixel by `makeRelight`
  from the pointer, repainting only the circle around the light. `vision()` shows flash visions.

Game is in `src/engine/game.js`.
- Scene loading, camera and zoom (`G.zoom`, `frameDialogue`), hotspots and clicks (gesture and
  reach).
- Autosave when each `run` ends, and resume. Scenes opt out with `noSave` / `canSave`.
- `makeAPI` builds the scripting API `G`: say, think, voice, inspect, vision, zoom, stairs, give,
  clue, tipOnce, and others.

Story:
- `src/story/chapters.js` holds the chapter hooks, including the finale on the foreshore stairs.
- `src/story/data.js` holds the clues and the deductions.
- `src/story/intro.js` is the new-game intro.

Scenes, in `src/scenes/`: bucks_row, hanbury, mitre, goulston, alleys (the chase), knackers
(knackers' yard, end of chapter I), room (Thomas's room), seance, greaves, millers (epilogue),
foreshore (finale).

Art:
- `src/art/build.js`: facades, `fgDressing`.
- `props.js`: stairs, lanterns, case, and other props.
- `bodies.js`: the close-up paintings of the victims.
- `paint.js`: the brushes.

Audio is in `src/engine/audio.js`: procedural WebAudio plus CC0 samples embedded as data URIs in
the builds. Footsteps are chosen per surface by `step(surface, weight)`.

Android:
- `web/android/` holds the manifest, `MainActivity.java` and the icons.
- The WebView runs immersive and landscape. Back calls `__appBack`; pause and resume call
  `__appPause` / `__appResume` (in `main.js`).

## Recent work (this session)

- Lit scenery, wet reflections, bloom and rays, corpses with volume, a relit close-up, atmosphere,
  swinging signs.
- Performance: Buck's Row went from about 15 ms to about 3.8 ms of CPU per frame on desktop.

## Open items and ideas

- The user has not yet commented on: the new footsteps, the chase and stairs animations, and the
  look of the new lighting on the phone.
- Live props now get a soft antialiased edge that the shader cuts, so they are not identical to the
  old CPU snap. Adjust if the user reports odd edges.
- Possible next steps:
  - More hand-made assets or animations for the victims and NPCs.
  - Sound design (ambient beds per scene).
  - A pass on chapter pacing.
  - A store or HTTPS release (the user chose no hosting for now).
- `docs/` and the repo root `README.md` may describe the older Godot/Unity attempts. The web
  version is the real game.

## Conventions

- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Commit only
  when asked or at the end of an approved block of work. This session has committed after each
  block, with the user's agreement.
- Code style: 2-space JS, terse comments in plain English explaining why, written in the voice of
  the surrounding code.
- After a block of work: run the tests, verify in the browser, commit, rebuild and republish the
  Artifact, build the APK and send it.
