# Innsmouth Street V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the procedural graybox visual assembly of `InnsmouthStreet` with a coherent Gothicvania Town / Warped Ocean View 2.5D street while preserving all existing gameplay contracts.

**Architecture:** Keep `StreetBootstrap` as the runtime composition root, but move asset loading, authored facade construction, gameplay anchors, and foreground/atmosphere assembly into focused helpers. Raw third-party files stay immutable in `ThirdPartyRaw`; adapted materials and prefabs stay in `HorrorPlay/Art/StreetV2`.

**Tech Stack:** Unity 6000.3.15f1, URP 17.3.0, Input System 1.17.0, Unity Test Framework, C# runtime/editor scripts, PNG/sprite assets, derived URP materials.

**Spec:** `docs/superpowers/specs/2026-09-05-innsmouth-street-v2-design.md`

## Global Constraints

- Work only on `reboot/unity-innsmouth-street-v1`; never touch `main`, merge, squash, or advance to another room.
- Preserve bounds `-24f` to `24f` and hotspot IDs `harbor_closure_notice`, `local_resident`, `tavern_door`.
- Use only Gothicvania Town, Warped Ocean View, and a specifically documented minor Legacy Collection fallback.
- Stop and request ZIPs if official download requires unavailable manual authentication or payment interaction.
- Use Unity `6000.3.15f1`; do not introduce editor-version churn.

### Task 1: Acquire and document approved asset packs

**Files:**
- Create: `unity/HorrorPlay/Assets/ThirdPartyRaw/Ansimuz/GothicvaniaTown/` contents from the official pack ZIP.
- Create: `unity/HorrorPlay/Assets/ThirdPartyRaw/Ansimuz/WarpedOceanView/` contents from the official pack ZIP.
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Art/StreetV2/README.md`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Art/StreetV2/ThirdPartyCredits.md`

- [ ] Verify the official source pages and license text before download.
- [ ] If a download needs unavailable manual authentication/payment, stop and request the ZIP.
- [ ] Download only the two approved ZIPs into a temporary directory outside `Assets`.
- [ ] Inspect ZIP contents and copy raw files unchanged into the two required raw directories.
- [ ] Record author, source URL, license, downloaded filenames, and permitted usage in `ThirdPartyCredits.md`.
- [ ] Add a `StreetV2` README mapping each pack to its allowed scene role.
- [ ] Commit with `docs: record locked street v2 asset selection` and `art: import approved street v2 raw assets`.

### Task 2: Add authored asset loading and derived material helpers

**Files:**
- Create or modify: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Art/StreetV2AssetLibrary.cs`
- Create or modify: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Art/StreetV2MaterialFactory.cs`
- Modify: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Art/StreetGeometryFactory.cs` only if sprite/quad helpers are required.
- Create: derived files under `unity/HorrorPlay/Assets/HorrorPlay/Art/StreetV2/`

- [ ] Inventory the approved pack sprites and identify exact filenames for facade, door, window, trim, prop, ocean, fog, and silhouette roles.
- [ ] Add deterministic asset lookup that fails with a clear editor/runtime error when a required approved asset is missing.
- [ ] Create derived URP materials with controlled tint, smoothness, emission, and alpha behavior for wet timber, damp masonry, dirty glass, oxidized metal, wet pavement, harbor fog, and warm windows.
- [ ] Add EditMode coverage for required asset role resolution without changing gameplay contracts.
- [ ] Commit with `art: add street v2 asset library and derived materials`.

### Task 3: Rebuild depth layers and main street frontage

**Files:**
- Modify: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Street/StreetBootstrap.cs`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Art/StreetV2CompositionBuilder.cs`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Art/StreetV2FacadeBuilder.cs`
- Create: derived facade/prefab assets under `unity/HorrorPlay/Assets/HorrorPlay/Art/StreetV2/`

- [ ] Preserve existing `BuildStreet`, camera, mover, dialogue, narrative, and pointer setup entry points.
- [ ] Build far harbor exclusively from Warped Ocean View layers, recolored and placed behind the street.
- [ ] Build mid/far architecture and two or three frontage modules from Gothicvania Town pieces.
- [ ] Build the Tavern as the warm focal frontage with a legible framed door, no more than two warm windows, restrained sign treatment, and worn timber hierarchy.
- [ ] Replace cube facades and oversized faux text with authored sprite/quad assemblies and trims.
- [ ] Keep inspector contrast and all gameplay anchors stable.
- [ ] Commit with `art: rebuild innsmouth street facades and tavern frontage`.

### Task 4: Replace ground, checkpoint, resident recess, and foreground depth

**Files:**
- Modify: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Street/StreetBootstrap.cs`
- Create or modify: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Art/StreetV2GameplayBuilder.cs`
- Create or modify: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Atmosphere/StreetAtmosphere.cs`
- Create: derived ground/prop assets under `unity/HorrorPlay/Assets/HorrorPlay/Art/StreetV2/`

- [ ] Replace the flat walk strip with wet pavement modules, seams, curb/edge reads, dirt variation, puddles, and controlled reflections.
- [ ] Rebuild the Harbor Closure Notice as a supported checkpoint assembly while preserving its anchor, hotspot, and dialogue.
- [ ] Give the Local Resident a shadowed recess/alley with small secondary props while preserving proximity behavior.
- [ ] Add restrained cables, post/sign, partial silhouette, and layered rain foreground without occluding hotspots.
- [ ] Keep mobile/desktop rain budgets and anomaly sequence behavior intact; tune visuals only.
- [ ] Commit with `art: replace prototype ground with wet street materials` and `fx: tune street lighting fog rain and anomaly`.

### Task 5: Import, compile, test, and manually review Play Mode

**Files:**
- Modify tests only if required to encode preserved contracts: `unity/HorrorPlay/Assets/HorrorPlay/Tests/EditMode/`
- Modify: `unity/HorrorPlay/README.md` if setup/asset instructions change.

- [ ] Open/import with Unity `6000.3.15f1` and run project setup.
- [ ] Run the full EditMode suite and record exact test count/output.
- [ ] Run a manual Play Mode pass for walking, click/tap, camera follow/bounds, notice, resident, Tavern, dialogue, bells, anomaly, UI, and inspector readability.
- [ ] Inspect the scene for forbidden packs, remaining graybox facades, white window rectangles, and broken depth ordering.
- [ ] Fix failures and rerun affected plus full verification commands.
- [ ] Commit only after fresh verification evidence, with a final focused fix commit if needed.
