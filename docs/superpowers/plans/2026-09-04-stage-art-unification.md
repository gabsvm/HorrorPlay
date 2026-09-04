# Stage Art Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. If those skills are not available in the execution environment, follow the same task/checkpoint discipline manually. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revamp Streets, Tavern, Docks, Boathouse and Devil's Reef with authored third-party pixel-art assets while preserving a single HorrorPlay art direction so the game does not look like a collage of unrelated packs.

**Architecture:** Keep Office as the visual benchmark and keep gameplay architecture intact. Import third-party packs into `assets/third_party/` unchanged, create adapted derivatives under HorrorPlay-owned room asset folders, then compose each room from one dominant pack plus at most one supporting pack. Apply the same palette, lighting hierarchy, material treatment, pixel density and post-process rules across all rooms.

**Tech Stack:** Godot 4.6.3, GDScript, PNG pixel art, existing HorrorPlay lighting/post-process pipeline, GitHub Actions validation.

**Spec:** This document is both the implementation spec and execution plan.

## Global Constraints

- Repository: `gabsvm/HorrorPlay`.
- Work only on branch `agent/aa-character-overhaul`.
- Authoring baseline at plan creation: `18b6af16092ab539ab06f1ee35d72567386820dc`. If the branch has advanced, do **not** reset it; inspect current HEAD and continue from the latest valid state.
- Do **not** create another branch.
- Do **not** touch, merge or rewrite `main`.
- Do **not** squash commits.
- Do **not** rewrite narrative or gameplay systems except where strictly required to preserve visual integration or fix a regression discovered by tests.
- Office (`src/rooms/room_01_office`) is the approved visual benchmark. Do not redesign it.
- Preserve the current Cartoon Detective integration and its third-party attribution.
- Do not reintroduce the old procedural Inspector art pipeline as production art.
- Use only assets whose licenses explicitly permit this project's use. Record license/source/author before importing.
- No paid/PLUS/EXTRA content unless the user explicitly approves it. Use only free/base tiers in this plan.
- Third-party originals stay untouched in `assets/third_party/<pack>/`.
- Room scenes must reference adapted HorrorPlay derivatives, not random raw assets from multiple packs.
- Each room may use **one dominant pack + at most one supporting pack**.
- Every imported pack must be visually normalized before appearing in-game.
- Preserve 1920x1080 viewport, current HUD hierarchy, current input locks, save/load, Inventory→USAR→world-target flow, SceneRouter ownership and current validation tests.
- Godot 4.6.3 validation is mandatory before final handoff.

---

# Canonical HorrorPlay Art Direction

Use Office as the source of truth for contrast, mood, lighting and density.

## Palette hierarchy

Use a consistent 70/20/10 logic across all rooms:

- **70% base:** charcoal, near-black blue, petroleum blue, wet gray, desaturated brown.
- **20% secondary:** aged brass, tungsten amber, muted warm wood.
- **10% accents:** dried burgundy, sickly sea green, pale moonlit gray.

Suggested working swatches; tune against Office rather than treating them as immutable constants:

- Near-black blue: `#071014`
- Petroleum shadow: `#0E1A20`
- Cold structure: `#18272C`
- Wet neutral: `#2B3436`
- Warm wood shadow: `#3A2E27`
- Aged brass/brown: `#80603D`
- Tungsten highlight: `#D2AA68`
- Moon gray: `#BAC6CB`
- Sea green: `#536F69`
- Dried burgundy: `#6B3035`

## Lighting rules

**Exterior rooms**
- Cold moon/overcast ambience is the key/fill.
- Warm light is local only: windows, lamps, tavern doorway, narrative props.
- Keep broad darkness; do not wash the whole scene with blue.
- Rain/haze/reflection layers may support depth but must remain subtle.

**Interior rooms**
- Tungsten is localized and directional.
- Exterior cold fill may enter through windows/doors.
- Materials near warm sources must visibly pick up that warmth.
- Dark regions remain dark; readability comes from composition, not global brightness.

## Material rules

Every adapted asset should read consistently:

- **Wood:** worn edges, darker grain bands, dampness, restrained warm highlights.
- **Metal:** thin cold edge highlights, rust/paint variation where plausible.
- **Paper:** dirty ivory, contact shadows, no pure white.
- **Glass:** subdued reflection, grime/rain, interior/exterior separation.
- **Stone/rock:** wet value variation, desaturated, no fantasy candy saturation.
- **Fabric:** low-saturation masses, readable folds, no smooth vector gradients.

## Pixel-art normalization rules

- Preserve hard pixel edges; use nearest filtering where the asset is intended to stay pixel-art.
- Avoid arbitrary fractional scaling that causes shimmer.
- If a source pack is lower-resolution than the room, scale by integer factors where possible, then compose at the room's target resolution.
- Do not blur low-resolution art to make it look "HD".
- Do not add uniform outlines to every pack just to force similarity.
- Normalize through palette/value/material/light, not through destructive filters.
- Do not allow one pack to remain bright/saturated while another is dark/noir.

## Anti-Frankenstein rule

A third-party asset is not production-ready merely because it is legal and attractive. Before it enters a room it must pass these checks:

1. scale matches the room and Inspector;
2. silhouette density matches Office;
3. saturation/value range matches the HorrorPlay palette;
4. local light direction matches the room;
5. material treatment matches HorrorPlay;
6. no obviously modern or genre-incompatible visual language remains;
7. it is stored as an adapted derivative under the room's own asset folder.

---

# Approved Source Packs

Gemini must open the source pages, verify the current license text, and write the exact result into `THIRD_PARTY_ASSETS.md` before importing binaries.

## Streets — dominant pack

**Gothicvania Town — ansimuz**
- Source: `https://ansimuz.itch.io/gothicvania-town`
- Free base download only; do not use Plus content.
- Intended use: houses, street architecture, props, parallax structure, optional NPC bases.
- Known page metadata at plan creation: base pack includes 2-layer parallax, tileset, houses/barrels/props, 4 animated NPCs; CC0 was shown on the source page.

Adaptation target: Innsmouth 1926, not Castlevania fantasy. Remove/replace medieval cues, oversaturated colors and decorative motifs that read as gothic-fantasy rather than New England maritime decay.

## Tavern — dominant + support

**FREE Bar Asset Pack — styloo**
- Source: `https://styloo.itch.io/freebarassetspack`
- Intended use: bar architecture, bottles, floor/bar structure, beams and large interior props.

**FREE Pixel Art Bar and Cafe Items Pack — karsiori**
- Source: `https://karsiori.itch.io/free-pixel-art-bar-and-cafe-items-pack`
- Intended use: microprops only: glasses, bottles, cups and small accessories.

Adaptation target: dark 1926 tavern. Remove cute/cafe language, modern refrigeration cues or contemporary signage. Dirty wood, tarnished brass, smoke/dampness, local tungsten pools.

## Docks — dominant + support

**SeaHook Basic Pack — Spriteshift**
- Source: `https://spriteshift.itch.io/seahook-pack`
- Use BASIC/free content only.
- Intended use: terrain/building tiles, animated water, marine hazards/tentacles where narratively appropriate.
- Known page metadata at plan creation: CC-BY 4.0; attribution required.

**FREE Pixel Art Sidescroller Sea Backgrounds — IndieKit**
- Source: `https://indiekit.itch.io/free-pixel-art-sidescroller-sea-backgrounds`
- Intended use: distant ocean/background/parallax layers only.
- Do not redistribute the source pack independently; store only what the license permits and document the source.

Adaptation target: wet working harbor, not pirate adventure. Desaturate, remove tropical/fantasy feel, introduce industrial-maritime 1920s cues, mist, sodium/tungsten pockets and cold water reflections.

## Boathouse — dominant + support

**Warehouse / Factory — ACTG**
- Source: `https://actg.itch.io/warehouse-factory`
- Intended use: pallets, boxes, rusty barrels, storage/structural shapes.

Support may reuse adapted **SeaHook Basic** marine wood/building elements where needed for continuity with Docks.

Adaptation target: coastal boathouse/storehouse. Do not use forklifts, modern cargo containers, modern machinery or visual cues that break 1926. Add rope, damp timber, salt damage, aged storage and maritime clutter.

## Devil's Reef — dominant + support

**Magic Cliffs Pack — ansimuz**
- Source: `https://ansimuz.itch.io/magic-cliffs-environment`
- Intended use: cliff/rock/terrain/parallax forms.

**Warped Ocean View — ansimuz**
- Source: `https://ansimuz.itch.io/warped-ocean-view`
- Intended use: distant sea/parallax/large-scale horizon shapes.

Adaptation target: hostile maritime geology and cosmic unease. Remove bright fantasy presentation; push wet dark rock, sickly green undertones, pale foam, impossible silhouette hints and restrained occult geometry.

## Optional library only

**Ansimuz Legacy Collection**
- Source: `https://ansimuz.itch.io/gothicvania-patreon-collection`
- Use only to fill a specific missing prop/background need after the dominant/support pack fails to provide it.
- Never let this become a third visible art language inside one room.

---

# Task 1 — Fix Inspector idle cadence before environment expansion

**Files:**
- Modify: `src/characters/inspector/inspector_frames.tres`
- Test: existing character integration suite; add a small assertion if needed.

**Problem:** `idle` currently uses 4 frames at 5 FPS, creating a full cycle every 0.8 seconds and making the detective appear to crouch/bob constantly.

- [ ] Change `idle` cadence to approximately **1.5–2.0 FPS**.
- [ ] Make `idle_uneasy` distinct but not frenetic; it may be slightly faster or use uneven frame durations, but must still read as subtle breathing/posture shift rather than repeated crouching.
- [ ] If Godot SpriteFrames supports per-frame durations cleanly in the existing resource, prefer longer holds on neutral frames instead of a mechanically even loop.
- [ ] Do not alter model scale, baseline or movement speed in this task.
- [ ] Verify Office idle visually for at least 10 real seconds.
- [ ] Commit separately: `fix: calm authored detective idle cadence`.

Acceptance: standing still must feel like a person breathing, not repeatedly ducking.

---

# Task 2 — Create the production art bible and licensing registry

**Files:**
- Create: `docs/ART_DIRECTION_BIBLE.md`
- Modify: `THIRD_PARTY_ASSETS.md`
- Create room derivative roots as needed under `assets/images/rooms/`.

- [ ] Write the canonical palette, lighting, material and scaling rules from this document into `docs/ART_DIRECTION_BIBLE.md`.
- [ ] Include Office screenshots/scene references as benchmark references without importing QA screenshots into runtime resources.
- [ ] For every pack actually downloaded, record author, source URL, exact license wording/identifier, attribution requirement, allowed use, and whether derivative redistribution is restricted.
- [ ] If a source page's license is ambiguous, **do not import it** until resolved.
- [ ] Commit separately: `docs: define unified HorrorPlay environment art direction`.

Acceptance: another artist should be able to read the bible and reproduce the same visual language without seeing this chat.

---

# Task 3 — Acquire and quarantine source packs

**Files:**
- Create as applicable:
  - `assets/third_party/gothicvania_town/`
  - `assets/third_party/styloo_bar_pack/`
  - `assets/third_party/karsiori_bar_items/`
  - `assets/third_party/seahook_basic/`
  - `assets/third_party/indiekit_sea_backgrounds/`
  - `assets/third_party/actg_warehouse_factory/`
  - `assets/third_party/magic_cliffs/`
  - `assets/third_party/warped_ocean_view/`

- [ ] Download only the free/base packages from the official source pages.
- [ ] If itch.io requires an authenticated/manual browser step and the environment cannot obtain the archive legally, stop that pack and request the archive from the user; do not scrape mirrors.
- [ ] Preserve originals untouched.
- [ ] Add `.gdignore` inside any archive/reference-only directory that should not be imported by Godot.
- [ ] Do not wire raw third-party files directly into rooms yet.
- [ ] Commit source additions by pack or logical room grouping, with attribution already documented.

Acceptance: source packs are cleanly separated from production derivatives and licensing is traceable.

---

# Task 4 — Build a deterministic room adaptation workflow

**Files:**
- Create: `tools/art_direction/README.md`
- Create only if useful: `tools/art_direction/normalize_stage_assets.py`
- Create derivative folders:
  - `assets/images/rooms/streets/`
  - `assets/images/rooms/tavern/`
  - `assets/images/rooms/docks/`
  - `assets/images/rooms/boathouse/`
  - `assets/images/rooms/reef/`

Do not over-automate hand-authored art. The script is optional and may handle deterministic palette/value normalization, but composition and material edits must remain art-directed.

- [ ] Define naming convention: `sourcepack_subject_variant_horrorplay.png` or an equally explicit stable pattern.
- [ ] Keep a source map in each room derivative folder or in `THIRD_PARTY_ASSETS.md` so every derivative can be traced to its original.
- [ ] Standardize import/filter settings appropriate for pixel art.
- [ ] Establish integer-scale targets per room and Inspector-relative object scale.
- [ ] Commit separately: `build: add unified environment asset adaptation pipeline`.

Acceptance: imported packs can be updated/replaced without losing provenance or visual consistency.

---

# Task 5 — Revamp Streets using Gothicvania Town as the dominant language

**Files:**
- Modify: `src/rooms/room_02_streets/room_02_streets.tscn`
- Modify only if needed: `src/rooms/room_02_streets/room_02_streets.gd`
- Create derivatives: `assets/images/rooms/streets/**`
- Test: extend existing visual/integration acceptance if needed.

- [ ] Preserve all current hotspots, walk points, narrative flags and transitions.
- [ ] Recompose Streets using Gothicvania Town architecture/parallax as raw material, not as a drop-in scene.
- [ ] Convert fantasy-town cues into Innsmouth/New England maritime cues.
- [ ] Apply HorrorPlay palette and wet-night material treatment.
- [ ] Add 3–5 clear depth planes: far sky/buildings, architectural background, gameplay plane, near foreground, atmosphere.
- [ ] Warm windows/lamps remain localized; Inspector remains readable without looking self-lit.
- [ ] Do not introduce more than one supporting visual source unless user explicitly approves.
- [ ] Capture runtime screenshots with Inspector at multiple positions and compare scale to doors/windows.
- [ ] Commit: `art: rebuild Innsmouth streets with unified authored pixel assets`.

Acceptance: if the source pack name were hidden, the result should look like HorrorPlay, not like Gothicvania with a blue filter.

---

# Task 6 — Revamp Tavern using one structural pack and one microprop pack

**Files:**
- Modify: `src/rooms/room_03_tavern/room_03_tavern.tscn`
- Modify only if needed: `src/rooms/room_03_tavern/room_03_tavern.gd`
- Create derivatives: `assets/images/rooms/tavern/**`

- [ ] Styloo pack supplies major bar/interior forms.
- [ ] Karsiori supplies only small bottles/glasses/accessories.
- [ ] Remove or redraw modern/cute/cafe elements.
- [ ] Use warm tungsten pools over dark wood with faint cold exterior contamination.
- [ ] Preserve Barnaby/Innkeeper interaction behavior and hotspot geometry unless geometry must move to match the new composition; if moved, update tests and walk points deliberately.
- [ ] Keep dialogue UI unchanged.
- [ ] Commit: `art: rebuild tavern around unified 1926 noir interior language`.

Acceptance: Tavern must clearly belong to the same game as Office even though its source pack is different.

---

# Task 7 — Revamp Docks with SeaHook Basic + distant ocean support

**Files:**
- Modify: `src/rooms/room_04_docks/room_04_docks.tscn`
- Modify only if needed: `src/rooms/room_04_docks/room_04_docks.gd`
- Create derivatives: `assets/images/rooms/docks/**`

- [ ] SeaHook Basic is dominant for playable dock/building/water forms.
- [ ] IndieKit backgrounds are distant/parallax support only.
- [ ] Remove pirate/tropical/fantasy cues.
- [ ] Convert to working 1920s harbor: wet timber, industrial-maritime silhouettes, ropes/posts/crates only where period-plausible.
- [ ] Use animated water subtly; do not make the water brighter than the Inspector/interaction plane.
- [ ] Tentacle/hazard art may appear only where narrative escalation supports it.
- [ ] Keep the Inspector lantern behavior expected outdoors.
- [ ] Commit: `art: rebuild docks with unified wet maritime pixel art`.

Acceptance: Docks must look like the same town seen outside Office/Tavern, not a pirate platformer level.

---

# Task 8 — Revamp Boathouse with period-safe warehouse forms

**Files:**
- Modify: `src/rooms/room_05_boathouse/room_05_boathouse.tscn`
- Modify only if needed: `src/rooms/room_05_boathouse/room_05_boathouse.gd`
- Create derivatives: `assets/images/rooms/boathouse/**`

- [ ] Use ACTG Warehouse/Factory as source for boxes, pallets, rusty barrels and structure only.
- [ ] Exclude forklifts, modern cargo containers, modern signage and modern machinery.
- [ ] Use adapted SeaHook wood/marine forms only as continuity support.
- [ ] Add salt damage, rope, wet timber, aged storage, local lantern/tungsten lighting.
- [ ] Preserve Brass Fuse flow and its animation/state behavior.
- [ ] Commit: `art: rebuild boathouse with period-safe maritime storage assets`.

Acceptance: Boathouse must feel like a believable extension of Docks and not an industrial warehouse from another century.

---

# Task 9 — Revamp Devil's Reef with Magic Cliffs + Warped Ocean

**Files:**
- Modify: `src/rooms/room_06_reef/room_06_reef.tscn`
- Modify only if needed: `src/rooms/room_06_reef/room_06_reef.gd`
- Create derivatives: `assets/images/rooms/reef/**`

- [ ] Magic Cliffs is dominant for rock/terrain structure.
- [ ] Warped Ocean is support for distant sea/horizon/parallax.
- [ ] Strip bright fantasy presentation.
- [ ] Use wet near-black rock, pale foam, sickly green undertones and cold moonlight.
- [ ] Introduce cosmic unease through silhouette/composition and subtle impossible geometry, not neon effects.
- [ ] Preserve all narrative reveal/hotspot behavior and sanity logic.
- [ ] Commit: `art: rebuild Devils Reef with unified cosmic maritime environment`.

Acceptance: Reef must feel like a natural escalation of Docks/Boathouse while still clearly belonging to HorrorPlay.

---

# Task 10 — Cross-room cohesion pass

**Files:**
- May modify adapted derivative assets and room-specific lighting/grade values only.
- Do not rewrite gameplay architecture.

- [ ] Capture Office, Streets, Tavern, Docks, Boathouse and Reef with the Inspector visible at comparable scale.
- [ ] Compare all six side-by-side.
- [ ] Normalize any room that is visibly brighter, more saturated, lower-detail or more "cartoony" than the others.
- [ ] Check recurring materials: wood, metal, paper, stone, glass, water.
- [ ] Check recurring warm/cold lighting logic.
- [ ] Check Inspector pixel density and silhouette against each environment.
- [ ] Remove any obvious raw-pack asset that breaks style.
- [ ] Commit: `polish: unify room palette lighting and material language`.

Acceptance: a blind reviewer should identify all rooms as one game without being told which source pack each came from.

---

# Task 11 — Visual QA, gameplay QA and CI

**Files:**
- Extend existing test tools only where necessary.
- Do not weaken existing tests to make art changes pass.

Required Godot 4.6.3 checks:

- [ ] project import succeeds;
- [ ] `tools/validate_project.gd` succeeds;
- [ ] Cartoon Detective authored-asset gate succeeds;
- [ ] character integration acceptance succeeds;
- [ ] interaction cancellation safety succeeds;
- [ ] SceneRouter input ownership succeeds;
- [ ] save schema safety succeeds;
- [ ] HUD input safety succeeds;
- [ ] shutdown leak gate succeeds.

Required gameplay smoke test:

- [ ] Office Desk → Rusty Key → Inventory → USAR → Drawer remains intact;
- [ ] Streets transition/interaction flow remains intact;
- [ ] Tavern Barnaby/Innkeeper flow remains intact;
- [ ] Docks outdoor lantern behavior remains intact;
- [ ] Boathouse Brass Fuse flow remains intact;
- [ ] Reef narrative/sanity interactions remain intact.

Required visual evidence:

- [ ] one full-room screenshot for each room;
- [ ] Inspector standing in each room;
- [ ] Inspector walking in Streets and Docks;
- [ ] Tavern with dialogue open;
- [ ] Boathouse during Fuse interaction;
- [ ] Reef final atmospheric composition;
- [ ] one side-by-side contact sheet of all six rooms.

Do not fake movement screenshots by setting animation frames manually. Use real movement/input flow.

Final CI requirement:
- [ ] HEAD SHA must be exactly the SHA that received the final successful Godot Validate run.
- [ ] No automated art bot may push another commit after validation.

---

# Commit Discipline

Use small, reviewable commits. Recommended sequence:

1. `fix: calm authored detective idle cadence`
2. `docs: define unified HorrorPlay environment art direction`
3. `build: add third party environment source registry`
4. `build: add unified environment asset adaptation pipeline`
5. `art: rebuild Innsmouth streets with unified authored pixel assets`
6. `art: rebuild tavern around unified 1926 noir interior language`
7. `art: rebuild docks with unified wet maritime pixel art`
8. `art: rebuild boathouse with period-safe maritime storage assets`
9. `art: rebuild Devils Reef with unified cosmic maritime environment`
10. `polish: unify room palette lighting and material language`
11. `test: harden cross-room visual and gameplay acceptance`

Do not squash.

---

# Stop Conditions

Stop and report instead of improvising if any of these occur:

- a pack's license is ambiguous or incompatible;
- a free download cannot be accessed legally from the environment;
- a room would require paid/Plus/Extra assets to meet the plan;
- adapting a pack would require changing core gameplay architecture;
- an existing regression test fails for a reason unrelated to art and the root cause is not understood;
- a room still looks like a raw third-party pack after one serious adaptation pass.

---

# Final Handoff Requirements

At completion, report:

- branch;
- final HEAD SHA;
- confirmation `HEAD === validated SHA`;
- exact commit list;
- source packs actually used per room;
- exact licenses/attributions;
- list of raw third-party folders;
- list of adapted derivative folders;
- files modified;
- screenshots/contact sheet;
- Godot 4.6.3 results;
- CI run/result;
- any unresolved visual mismatches;
- any pack intentionally rejected and why.

Then **STOP**. Do not merge and do not begin another room/act beyond this plan without review.
