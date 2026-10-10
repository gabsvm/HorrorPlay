# El Huésped: handoff

State on 2026-10-10, branch `reboot/web-el-huesped`, after the master plan (phases 0–11,
`docs/IMPLEMENTATION_STATUS.md`, which has the commit of every phase). Working tree clean.
The user plays on a Moto g86 Power. Since rc22 there are no portraits and no voices (subtitles only),
and the train is gone. The overhaul is code-complete and tested headless; the human playtests listed
in `docs/IMPLEMENTATION_STATUS.md` are still pending.

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
| Everything | `node tools/test-all.mjs` (`--quick` skips the three long playthroughs) |
| Pure logic | `node tools/unit.mjs` (`tests/unit/*.test.mjs`: gates, saves, theories, perception, signature, hygiene) |
| Smoke test (every scene, mocked canvas/WebGL) | `node tools/smoke.mjs` |
| Full playthrough (expects 25 deductions, no errors) | `node tools/walk.mjs`; `second` as the second reading; `alt` the bad player |
| One scenario | `node tools/walk.mjs <name>` for `tests/scenarios/<name>.js`; `--snapshots DIR` dumps each chapter's checkpoint; `WALK_LOG=file` dumps the run's lines (count them with `node tools/read-count.mjs file`) |
| Audio | `node tools/audio-smoke.mjs` |
| Sprite lab | `tests/sprites.html?who=&s=&cols=&only=` |
| Artifact build | `npx esbuild src/main.js --bundle --format=iife --minify --outfile=<scratch>/bundle.js`, then `python tools/build-artifact.py <scratch>/el-huesped.html` (it reads `bundle.js` next to the output) |
| Republish | Artifact publish to `https://claude.ai/artifact/AZiipwBV3rbng52121UQsX` |
| APK | `VERSION=1.0-rcN bash tools/build-apk.sh`, then copy `dist/el-huesped.apk` to `dist/ElHuesped-1.0-rcN.apk` and send it with SendUserFile. The version code is the git commit count, so each build installs over the previous one. The debug keystore `android/debug.keystore` is local and gitignored. |
| Character models | `blender -b --factory-startup -P tools/blender/figure.py -- <scratch>/m/<who> <who> [anims]`, then `python tools/blender/pack.py <scratch>/m/<who> <who>` (writes `assets/models/<who>/`). The cast is in `tools/blender/cast.py`; Blender 5.2 is installed with winget; pack needs Pillow and numpy. |
| Scenery props | `blender -b --factory-startup -P tools/blender/props.py -- <scratch>/props [names]`, then `python tools/blender/pack_props.py <scratch>/props` (writes `assets/props/`). Painters call `drawProp(ctx, name, x, y)` from `src/art/models.js` and fall back to their own shapes. |
| Close-ups | Generate with `CLOSEUPS.md`, then `python tools/closeups.py <folder>` (writes `assets/closeups/`); `paintBody` uses them when present. |
| Script | `node tools/script/export.mjs` writes `GUION.md`: every line, choice and document, by scene, with the story bible as context (run `npm i` in `tools/script` once). |
| Rebuild audio | `python tools/build-audio.py` (CC0 sources in the gitignored `assets-src/audio/`; credits in `assets/audio/CREDITS.md`) |

Dev URL parameters: `?scene=<id>&x=<px>&noenter&flags=a,b` or `?chapter=<n>`; `?metrics` logs the dev
metrics to the console (`window.__metrics()`); on localhost or with `?dev`, script errors show as a toast.

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
- `say` shows dialogue as subtitles (name over the line, nothing behind it, no portraits); there are also the notebook and the satchel inventory.
- `inspect()` is the crime-scene close-up. Above low quality it is relit per pixel by `makeRelight`
  from the pointer, repainting only the circle around the light. `vision()` shows flash visions.

Game is in `src/engine/game.js`.
- Scene loading, camera and zoom (`G.zoom`, `frameDialogue`), hotspots and clicks (gesture and
  reach).
- Autosave when each `run` ends, and resume. Scenes opt out with `noSave` / `canSave`.
- `makeAPI` builds the scripting API `G`: say, think, voice, inspect, vision, zoom, stairs, give,
  clue, tipOnce, and others.

Story:
- Two readings (see STORY_BIBLE "Dos lecturas"): `G.two(first, second)` and `G.second()` pick the
  line; clues may have `text2` and `truth2`; `flags.second` is set by the menu's "Segunda lectura",
  unlocked by `Game.markRead()` when the game is finished. `flags.answered1866` records the prologue.
- Puzzles: `chapterHooks.beats` (Buck's Row, via Pike), `raps` + `ui.knockPuzzle` (séance table,
  needs the board under the star chart), `compareHands` (room desk, ch. III). Each has a FAST path.
- "¿Qué hago ahora?" in the notebook: `game.hint()` (objective, then the pair of clues that fit or
  the scene's `hint(G)` with everything shown).
- Haptics: `src/engine/haptics.js` `buzz()`, on stings, the heart, thuds, raps, shakes; Vibration
  option; VIBRATE permission in the manifest.
- Playthroughs: `node tools/walk.mjs` (first reading), `walk.mjs second`, `walk.mjs alt`.
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
the builds. Footsteps are chosen per surface by `step(surface, weight, {gain, pan})`; every actor's
steps are heard, placed by `audio.spatial(x)` against `audio.listener` (Thomas's x, set each tick).
Scenes declare `space` (room, parlour, office, street, alley, yard, river: the reverb, crossfaded on
goto), `sounds` (emitters with a place: fire, grind, clock, gas, optional `when(G)`), `city` (cab,
bell, ship, muffle; default by `indoor`) and `beds` (a map, or a function of G). Drips sound where
they land; the knackers' train rolls across the stereo field.

Android:
- `web/android/` holds the manifest, `MainActivity.java` and the icons.
- The WebView runs immersive and landscape. Back calls `__appBack`; pause and resume call
  `__appPause` / `__appResume` (in `main.js`).

## Story systems (master plan)

- `src/story/progression.js`: pure gates (`canFinishC1`, `canLeaveHanbury`, `canStartSeance`,
  `canLeaveSeance`, `canLeaveMitre`, `canLeaveRoomC3b`, `canEnterFinale` with `FINAL_SOURCES`,
  `currentGate`) and `normalizeState` (fills new fields in old saves; idempotent; never renames).
  Scenes and the hint call these instead of writing their own conditions.
- `src/story/theories.js`: the case's open questions; statuses derived from clues, deductions and
  flags; shown in the notebook's Teorías tab and stored in `state.investigation.hypotheses`.
- `src/story/perception.js`: sanity bands (steady ≥65, strained 36–64, frayed ≤35) and every effect
  they have, in one place.
- `src/engine/signature.js`: the name-to-Jack morph as pure frames. `src/engine/metrics.js`: opt-in
  dev metrics.
- Hotspots may have `again` (the short second look) and close-up points `key: true`.
- Tests choose by text: `PICKS` entries may be strings matched against the options.

### Flags: old and new

Old flags and ids are never renamed or dropped. New, all optional with defaults:

| Flag / field | Values | Set in |
|---|---|---|
| `investigation.{hypotheses,routes,evaluations}` | theory statuses; `routes.c1`; `evaluations.beats/raps` | progression / theories / chapters |
| `brennan_stance` | `suspect` / `clear` / `unsure` | `closeC1` |
| `comb_custody` | `thomas` / `pike` (old saves with the comb → `thomas`) | Hanbury `comb` |
| `raps_heard`, `hospes_decoded`, `seance_prepared` | bool | séance |
| `wren_mob_reply` | `duty` / `excuse` / `silent` | `mobScene` |
| `handwriting_assessment`, `hand_inconclusive` | `greaves_like` / `inconclusive` / `self_recognition` | `compareHands` |
| `chase_mistakes`, `chase_outcome` | 0–3; `clean` / `spotted` / `injured` | `alleys` |
| `pike_cuff`, `wren_warned`, `file_torn` | bool, one per last act | `readFile` |
| `water_reply_intent`, `water_resistance` | `answer` / `silent` / `hand` / `unsure`; bool | `finaleWater` |
| `recognized`, `water_before` | bool | foreshore |
| `pike_book_read`, `s2_prologue`, `s2_draft`, `s2_1879` | bool, second reading | scenes |
| `entry_year` | 1866 / 1879, derived from `answered1866` for old saves | prologue / `normalizeState` |

Prefs (`elhuesped.prefs`): `seenFast`, `reduceMotion`. Lines already read: `elhuesped.seenLines` (not in the save).

## Recent work (this session)

- The master plan, phases 0–11 (see `docs/IMPLEMENTATION_STATUS.md`): regression baseline and
  fixtures, evidence-driven progression and theories, no mute hotspots, chapter I closed by the
  player, comb custody, séance puzzle before the scare, handwriting prudence and chase outcomes,
  consequential last acts and water attitudes, sanity as perception, a richer second reading,
  pacing and victims, QA and docs.
- Before that: the V3 script pass (ChatGPT), subtitles instead of a dialogue box, no portraits, no voices, no train.

- Lit scenery, wet reflections, bloom and rays, corpses with volume, a relit close-up, atmosphere,
  swinging signs.
- Performance: Buck's Row went from about 15 ms to about 3.8 ms of CPU per frame on desktop.

## Open items and ideas

- Pending human playtests (desktop and the Moto g86 Power): the checklist is in
  `docs/IMPLEMENTATION_STATUS.md`. Tune the sanity thresholds and the chase timer from real play.

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
