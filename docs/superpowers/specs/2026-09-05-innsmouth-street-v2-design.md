# Innsmouth Street V2 Visual Rebuild Design

## Scope

Rebuild only the Unity `InnsmouthStreet` visual assembly on branch `reboot/unity-innsmouth-street-v1`. Preserve the existing movement, input, camera, bounds, hotspots, dialogue, narrative, rain, bells, and green anomaly contracts.

## Locked asset families

- Gothicvania Town by ansimuz: primary visible street language, facades, doors, windows, trims, urban props, and Tavern frontage.
- Warped Ocean View by ansimuz: distant ocean, fog layers, remote silhouettes, and harbor depth only.
- Ansimuz Legacy Collection: not planned; allowed only for one missing minor piece after documenting the specific need.
- SeaHook BASIC, FREE Bar Asset Pack, FREE Pixel Art Bar and Cafe Items, Magic Cliffs Pack, and all other unlisted packs are prohibited.

Raw downloads remain intact under `unity/HorrorPlay/Assets/ThirdPartyRaw/Ansimuz/`. Adapted materials, prefabs, atlases, and scene-facing assets belong under `unity/HorrorPlay/Assets/HorrorPlay/Art/StreetV2/`.

## Runtime architecture

`StreetBootstrap` remains the runtime owner and keeps the canonical bounds and hotspot IDs. Its visual builder is split into focused helpers for the five depth layers: far harbor, mid architecture, main frontage, gameplay plane, and foreground. Visual anchors are created independently from mesh/sprite instances so art changes cannot move interaction contracts.

The street uses authored 2.5D planes and modular facade pieces with minimal collision geometry only where interaction requires it. Gothicvania textures are recolored through derived materials toward petroleum blue, wet slate, charcoal, aged brass, muted tungsten, and restrained sea green. Warped Ocean View is placed behind the frontage and never supplies frontal architecture.

## Composition

1. Far harbor: subdued sea band, mist, remote silhouette, and one vertical maritime landmark.
2. Mid/far architecture: layered roofs and dark coastal-town masses.
3. Main frontage: two or three distinct Gothicvania-based facades, including a readable Tavern with one door and at most two warm windows.
4. Gameplay plane: wet modular pavement, integrated harbor closure checkpoint, resident recess, Tavern interaction anchor, and inspector-readable contrast.
5. Foreground: restrained post, cable, sign, rain layers, and partial near silhouette that do not occlude interaction.

## Lighting and atmosphere

Use cold exterior fill, localized warm Tavern/secondary-window lights, controlled emissive glass, moderate bloom-compatible values, layered rain and fog, and a subtle sea-green anomaly sequence. Avoid white window rectangles and oversized text signage.

## Validation boundary

Use Unity `6000.3.15f1` only. Run import/compile, EditMode tests, and a manual Play Mode pass covering walking, pointer/touch path, camera/bounds, all three hotspots, dialogue, bell sequence, anomaly, UI, and scene readability. Report `PASS`, `NOT RUN`, or `BLOCKED` separately for each check.

## Acquisition rule

Only official ansimuz/itch.io downloads may be used. If either required pack cannot be downloaded without manual authentication, CAPTCHA, payment, or another interaction Codex cannot legally complete, stop and request the ZIP from the user. Do not substitute another pack or revert to primitives.
