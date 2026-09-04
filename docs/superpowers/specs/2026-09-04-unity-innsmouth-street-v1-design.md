# HorrorPlay Unity Reboot — Innsmouth Street V1 Design

## Purpose

This spec defines the first visual/gameplay vertical slice for a clean HorrorPlay reboot in Unity. It is intentionally narrow: one playable Innsmouth street must establish the rendering language, camera grammar, interaction feel, Android viability, and narrative tone before any broader game migration begins.

The existing Godot project remains historical/reference material. The new Unity implementation lives under `unity/` so the repository can carry both during evaluation without namespace/path conflicts on case-insensitive filesystems.

## Product Goal

Build a 2.5D cinematic point-and-click street scene set in Innsmouth, Massachusetts, October 1926, combining:

- the strong readable composition of a remastered graphic adventure;
- layered depth, local lighting, wet materials, and cinematic atmosphere associated with premium 2.5D pixel-art games;
- HorrorPlay's established maritime-noir/Lovecraft narrative identity;
- a renderer and input model that can ship on Windows and Android landscape.

The target is not to copy REPLACED, Monkey Island, or another title. Those references define quality bars and presentation techniques only.

## Engine and Platform Baseline

- Engine: Unity 6.3 LTS.
- Minimum editor baseline for the branch: `6000.3.15f1`.
- Render pipeline: Universal Render Pipeline (URP).
- Input: Unity Input System, shared mouse/touch abstraction.
- Primary targets: Windows x86_64 and Android ARM64 landscape.
- Scene target aspect: 16:9, safe-area-aware UI.
- Performance target for the vertical slice: 60 FPS on midrange desktop hardware and 30+ FPS on a midrange Android device, with a 60 FPS quality path where hardware allows.

## Repository Strategy

Create and work only on branch:

`reboot/unity-innsmouth-street-v1`

Branch from `main`, not from the prior `agent/aa-character-overhaul` art branch. The purpose is to avoid carrying forward the room-by-room asset collage and Godot-specific production assumptions.

The new Unity project root is:

`unity/HorrorPlay/`

Do not delete or rewrite the Godot project during this vertical-slice phase.

## Scope

### Included

1. A bootable Unity project using URP.
2. One playable scene: `InnsmouthStreet`.
3. Side-on 2.5D camera with subtle perspective/depth.
4. Inspector represented by a clean authored placeholder silhouette/capsule rig that can later be swapped for final 2D character art without changing movement code.
5. Click/tap-to-walk on a constrained gameplay strip.
6. Camera follow with hard room bounds and soft damping.
7. Five visual depth groups:
   - distant sky/harbor silhouettes;
   - far architecture;
   - primary building facades;
   - gameplay plane;
   - near foreground/atmosphere.
8. Cold maritime ambience with localized tungsten windows/doorway.
9. Wet ground treatment and puddle/reflection cues.
10. Rain and fog implemented with mobile-conscious effects.
11. Three narrative beats:
    - harbor closure notice hotspot;
    - short local-resident interaction;
    - three-bell atmospheric event followed by a subtle green-water/reflection anomaly.
12. A Tavern doorway exit hotspot that is visibly readable but does not transition into a full Tavern scene yet.
13. Minimal interaction prompt and dialogue presentation suitable for mouse and touch.
14. Automated edit-mode tests for movement target clamping, hotspot activation, and narrative event sequencing where practical without scene rendering.
15. A validation/readme describing how to open and run the Unity slice.

### Explicitly Excluded

- Full inventory system.
- Sanity system.
- Save/load migration.
- Full Tavern implementation.
- Full narrative Act migration.
- Final Inspector art/animation set.
- Asset Store dependency on paid packages.
- Multiple unrelated environment art packs.
- Procedural generation.
- Combat.

## Visual Direction

### Canonical Palette

Base visual hierarchy follows a 70/20/10 distribution:

- 70%: near-black blue, petroleum blue, wet charcoal, desaturated slate, dark damp wood;
- 20%: aged brass, muted amber, tungsten-lit timber;
- 10%: pale moon gray, dried burgundy, sickly sea green.

Working swatches:

- near-black blue `#071014`
- petroleum shadow `#0E1A20`
- cold structure `#18272C`
- wet neutral `#2B3436`
- warm wood shadow `#3A2E27`
- aged brass `#80603D`
- tungsten highlight `#D2AA68`
- moon gray `#BAC6CB`
- sea green `#536F69`
- dried burgundy `#6B3035`

### Composition

The first street should read immediately as a single authored shot rather than a tilemap assembled from unrelated packs.

Camera framing:

- side-on, slightly elevated;
- enough perspective to reveal building depth and foreground overlap;
- Inspector remains roughly 18–24% of viewport height;
- architecture establishes scale through doors, windows, awnings, drainpipes, crates, and street furniture;
- no object should use an obviously different pixel density or outline language once final art is substituted.

### Material Language

- Stone: wet, dark, cold edge highlights.
- Timber: worn edges, moisture darkening, restrained warm bounce near lit windows.
- Metal: oxidized/rusted, cool highlights, no modern clean steel.
- Glass: grimy, low-intensity reflection, tungsten only where internally lit.
- Pavement: broad dark value masses with selective puddle response, not mirror-like global reflectivity.

### Lighting

Exterior key/fill is cold and weak. Warmth is local only:

- Tavern doorway/window cluster;
- one or two residential windows;
- a street lamp if composition requires it.

The Inspector must remain readable from silhouette and local contrast, not from a character-attached spotlight.

The green anomaly must be visually minor enough to register as wrong rather than as a fantasy special effect.

## Asset Strategy

V1 deliberately avoids importing a large art-pack library.

The street is assembled from:

1. simple Unity meshes/primitives authored into modular facade pieces;
2. project-owned procedural/static materials using the canonical palette;
3. minimal project-owned texture masks if required;
4. no more than one coherent external environment family later, after the shot composition is approved.

This gives the art direction a stable skeleton before final sprites/models are selected.

Any future third-party asset must pass:

- era compatibility (1926);
- maritime New England compatibility;
- palette/value normalization;
- consistent scale;
- consistent material response;
- license verification;
- no direct raw-pack appearance in the final shot.

## Scene Layout

The playable street spans approximately 45–60 Unity world units horizontally. The Inspector walks on a narrow XZ strip, not freely through depth.

Suggested spatial beats from left to right:

1. harbor-side edge / fog-heavy opening;
2. municipal closure notice on a post or boarded checkpoint;
3. recessed alley and resident NPC;
4. central wet street composition with strongest depth layering;
5. warm Tavern frontage/doorway as visual destination;
6. blocked continuation beyond the Tavern to imply a larger town.

The distant harbor/sea is visible only through selected gaps so it remains a threatening presence rather than an open scenic panorama.

## Player Interaction

### Pointer Abstraction

Mouse click and single-finger tap feed the same world-pointer service.

Pointer resolution order:

1. UI consumes pointer if over interactive UI;
2. hotspot raycast checks interactables;
3. otherwise ground/walk strip receives a movement target.

### Movement

- click/tap sets a horizontal target;
- target clamps to walkable X bounds;
- Inspector eases toward target at a fixed authored speed;
- orientation flips based on direction;
- no pathfinding is necessary for V1 because the street is a single readable strip;
- interaction can optionally auto-walk to a hotspot anchor before dialogue.

### Hotspots

Hotspots expose:

- display label;
- interaction anchor;
- activation radius;
- optional one-shot flag;
- callback/event.

Required hotspots:

- Harbor Closure Notice;
- Local Resident;
- Tavern Door.

## Narrative Beat Design

### Harbor Closure Notice

The notice communicates that the harbor closure predates the public understanding of Unit 317's disappearance. It should create bureaucratic unease, not dump the full PROJECT LANTERN reveal.

### Resident

A local gives a terse warning that reinforces the town's hostility/containment ambiguity. The exchange should be short enough to keep this V1 focused on presentation.

### Three Bells + Green Reflection

After the player has either inspected the closure notice or spoken with the resident, a one-shot atmosphere sequence becomes eligible. At an authored delay/position window:

1. three bell strikes sound at measured intervals;
2. ambient movement briefly settles;
3. a faint green reflection or water-light pulse appears in a location where no visible green light source exists;
4. it fades without explanation.

No creature reveal occurs.

## Camera

A dedicated follow controller:

- tracks Inspector X primarily;
- applies soft damping;
- keeps fixed authored Y/Z framing;
- clamps within scene bounds;
- supports a short narrative look offset during the green anomaly;
- exposes tuning fields rather than hardcoding values.

Do not require Cinemachine for V1 unless it materially simplifies the implementation; a small deterministic camera controller is preferred to reduce dependency surface.

## Rendering Architecture

Use URP with mobile-safe defaults.

The scene should rely on:

- one dominant directional/moon source;
- a small count of local point/spot lights;
- emissive materials for warm windows;
- transparent fog/rain layers with controlled overdraw;
- material roughness/smoothness separation for wet ground;
- color grading/post-processing that remains optional at low quality.

Avoid:

- real-time planar reflections;
- heavy volumetric fog packages;
- dense transparent particle stacks;
- per-pixel lights on every prop;
- desktop-only shader features.

## Android Constraints

- landscape orientation;
- single touch maps directly to pointer;
- minimum practical hotspot/UI touch target of ~48 dp equivalent;
- avoid hover-only interactions;
- quality tier can reduce rain density, shadow distance, post-processing, and local-light count;
- use IL2CPP/ARM64 for release validation later, but editor play-mode is sufficient for this first authored V1 checkpoint.

## Code Boundaries

The first implementation should use focused components:

- `StreetBootstrap` — creates/validates the authored V1 scene hierarchy where editor-authored assets are absent and centralizes V1 wiring.
- `InspectorMover` — movement only.
- `PointerInteractor` — pointer/raycast routing only.
- `WorldHotspot` — reusable hotspot data and activation.
- `StreetNarrativeDirector` — closure/resident/bells/green-anomaly state only.
- `StreetCameraController` — camera follow/look offset only.
- `StreetAtmosphere` — rain/fog/light pulse control only.
- `SimpleDialoguePresenter` — minimal dialogue/prompt surface only.
- `StreetPalette` / material helpers — canonical visual constants and generated materials.

No component should become a substitute for a future global GameManager.

## Test Strategy

Edit-mode tests should cover deterministic logic without requiring a rendered frame:

1. walk target clamps to authored street bounds;
2. hotspot cannot activate outside radius when proximity is required;
3. one-shot hotspot cannot fire twice;
4. narrative prerequisite state unlocks the bell/anomaly sequence once;
5. camera clamp math respects room bounds;
6. Android-safe pointer abstraction treats touch/mouse as equivalent interaction intents at the service boundary.

Play-mode/manual acceptance:

- project opens in Unity 6.3 LTS without compile errors;
- `InnsmouthStreet` runs from Play;
- click-to-walk works;
- touch simulation works;
- notice and resident interactions work;
- Tavern door is readable and interactive;
- bells/anomaly sequence triggers once;
- camera never exposes beyond authored street bounds;
- scene remains readable at 1920x1080 and a representative 16:9 Android resolution;
- no obvious frame hitch from the atmosphere sequence.

## Success Criteria

This V1 succeeds if, before adding a second room, the street demonstrates all of the following:

- one coherent visual language;
- convincing depth without looking like stacked unrelated PNGs;
- readable Inspector scale;
- localized warm/cold lighting hierarchy;
- wet maritime atmosphere;
- functional point-and-click/touch movement;
- a small but effective HorrorPlay narrative beat;
- architecture that can accept final coherent asset-family replacements later;
- a rendering budget credible for Android.

The next room must not begin until this street is visually accepted as the canonical HorrorPlay reboot direction.
