# Unity Innsmouth Street V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first bootable, playable HorrorPlay reboot vertical slice in Unity 6.3 LTS: one coherent 2.5D Innsmouth street with mouse/touch movement, cinematic camera, interaction beats, rain/fog, and the three-bell/green-anomaly narrative event.

**Architecture:** Keep the legacy Godot project untouched and create an isolated Unity project under `unity/HorrorPlay/`. Use a deterministic runtime street builder composed of focused C# components rather than committing fragile hand-authored Unity YAML for the environment. An Editor setup utility creates/repairs the URP project asset and `InnsmouthStreet` scene, while gameplay components remain runtime-only and replaceable when final art arrives.

**Tech Stack:** Unity `6000.3.15f1`, Universal Render Pipeline `17.3.x`, Unity Input System `1.17.0`, C#, NUnit/EditMode tests, Windows x86_64 + Android ARM64 landscape targets.

**Spec:** `docs/superpowers/specs/2026-09-04-unity-innsmouth-street-v1-design.md`

## Global Constraints

- Work only on branch `reboot/unity-innsmouth-street-v1`.
- Branch baseline is `main`; do not merge or copy the prior `agent/aa-character-overhaul` art implementation.
- Keep the existing Godot project intact.
- Unity project root is `unity/HorrorPlay/`.
- Engine baseline is exactly `6000.3.15f1`.
- Use URP 17.3.x and Input System 1.17.0.
- V1 must require no paid Asset Store content and no unrelated external environment packs.
- Rendering must remain credible for Android: no planar reflections, heavy volumetrics, or large transparent particle stacks.
- Landscape 16:9 is the authored framing; UI must not depend on hover.
- Do not add inventory, sanity, save/load, combat, or the full Tavern scene.
- Runtime components stay focused; no global GameManager.

---

### Task 1: Scaffold the isolated Unity 6.3 project

**Files:**
- Create: `unity/HorrorPlay/ProjectSettings/ProjectVersion.txt`
- Create: `unity/HorrorPlay/Packages/manifest.json`
- Create: `unity/HorrorPlay/.gitignore`
- Create: `unity/HorrorPlay/README.md`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/HorrorPlay.Runtime.asmdef`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Tests/EditMode/HorrorPlay.EditModeTests.asmdef`

**Interfaces:**
- Produces a Unity project recognized by Unity Hub/editor with URP and Input System dependencies.
- Runtime assembly name: `HorrorPlay.Runtime`.

- [ ] Create `ProjectVersion.txt` with `m_EditorVersion: 6000.3.15f1`.
- [ ] Add package manifest with `com.unity.render-pipelines.universal` `17.3.0`, `com.unity.inputsystem` `1.17.0`, Test Framework and standard Unity modules.
- [ ] Ignore Library/Temp/Logs/UserSettings/Builds while retaining Assets/Packages/ProjectSettings.
- [ ] Add README with exact open/run flow and the generated-scene setup behavior.
- [ ] Add runtime and EditMode assembly definitions.
- [ ] Commit as `build: scaffold isolated Unity 6.3 HorrorPlay reboot`.

Acceptance: the directory is a structurally valid Unity project and does not conflict with the repository's legacy lowercase `assets/` directory.

### Task 2: Implement deterministic gameplay primitives with tests

**Files:**
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Interaction/InteractionIntent.cs`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Interaction/WorldHotspot.cs`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Player/InspectorMover.cs`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Camera/StreetCameraMath.cs`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Camera/StreetCameraController.cs`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Tests/EditMode/StreetCoreTests.cs`

**Interfaces:**
- `InspectorMover.ClampTarget(float requestedX) -> float`
- `InspectorMover.SetTarget(float worldX)`
- `WorldHotspot.CanActivate(Vector3 actorPosition) -> bool`
- `WorldHotspot.TryActivate(Vector3 actorPosition) -> bool`
- `StreetCameraMath.ClampX(float desiredX, float minX, float maxX) -> float`
- `InteractionIntent` carries screen position and pointer source without mouse/touch-specific gameplay branching.

- [ ] Write tests for clamped movement target, hotspot distance gating, hotspot one-shot behavior, camera clamp math, and input-intent source equivalence.
- [ ] Implement the smallest components required for those tests.
- [ ] Ensure movement uses a constrained horizontal X target and flips the visual root by travel direction without pathfinding.
- [ ] Keep the camera controller deterministic: authored Y/Z remain fixed; X follows with damping and hard bounds.
- [ ] Commit as `feat: add tested street movement interaction and camera core`.

Acceptance: deterministic gameplay logic can be validated without rendering the scene.

### Task 3: Implement pointer routing and minimal dialogue

**Files:**
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Input/PointerInteractor.cs`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/UI/SimpleDialoguePresenter.cs`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/UI/SafeAreaPanel.cs`

**Interfaces:**
- Pointer routing order is UI -> hotspot -> walk plane.
- `SimpleDialoguePresenter.Show(string speaker, string body, float seconds = 0f)`.
- `SimpleDialoguePresenter.Hide()`.

- [ ] Read mouse and primary touch through Unity Input System and convert both to `InteractionIntent`.
- [ ] Ignore world input when pointer is over UI.
- [ ] Raycast hotspots first; if no hotspot is hit, raycast the walk layer and set the mover X target.
- [ ] Add touch-safe dialogue/prompt Canvas built at runtime, with no hover-only behavior.
- [ ] Apply the device safe area to the dialogue root.
- [ ] Commit as `feat: add shared mouse touch interaction surface`.

Acceptance: desktop click and Android-style touch enter the same interaction pipeline.

### Task 4: Implement the authored HorrorPlay palette and procedural 2.5D street composition

**Files:**
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Art/StreetPalette.cs`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Art/StreetMaterialFactory.cs`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Art/StreetGeometryFactory.cs`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Street/StreetBootstrap.cs`

**Interfaces:**
- `StreetPalette` exposes canonical colors from the spec.
- Material factory creates URP Lit/Unlit materials with explicit smoothness/emission settings.
- Geometry factory creates facade, trim, window, crate/post/pipe, foreground and walk-plane primitives.
- `StreetBootstrap` is the sole V1 composition root and wires focused components; it is not a future global manager.

- [ ] Build five visible depth groups: harbor silhouettes, far architecture, primary facades, gameplay plane, foreground/atmosphere.
- [ ] Author a 50-unit horizontal street with harbor opening, closure checkpoint, recessed alley, central composition, Tavern frontage, and blocked continuation.
- [ ] Use only project-owned primitives/materials for V1; do not import the previous Gothicvania/room art.
- [ ] Place the placeholder Inspector at an authored scale occupying roughly 18–24% of a 16:9 frame.
- [ ] Add local warm emissive windows/doorway against cold weak exterior ambience.
- [ ] Use roughness/smoothness separation and shallow puddle meshes for wet-ground cues without real-time reflection captures.
- [ ] Commit as `art: build coherent procedural Innsmouth street vertical slice`.

Acceptance: hiding all gameplay labels still leaves a readable single-shot Innsmouth street with coherent scale/material/light language.

### Task 5: Add atmosphere and narrative sequence

**Files:**
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Atmosphere/StreetAtmosphere.cs`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Runtime/Narrative/StreetNarrativeDirector.cs`
- Create: `unity/HorrorPlay/Tests/EditMode/StreetNarrativeTests.cs`

**Interfaces:**
- `StreetNarrativeDirector.MarkNoticeRead()`.
- `StreetNarrativeDirector.MarkResidentSpoken()`.
- `StreetNarrativeDirector.IsAtmosphereSequenceEligible`.
- `StreetNarrativeDirector.TryStartAtmosphereSequence() -> bool` one-shot.
- `StreetAtmosphere.PlayBellGreenAnomaly()` coroutine/equivalent.

- [ ] Test that either prerequisite unlocks the atmosphere sequence and the sequence cannot start twice.
- [ ] Add low-overdraw rain streak instances/particles and layered fog cards with mobile quality scaling.
- [ ] Implement three measured bell strikes using a tiny generated AudioClip tone if no owned bell asset is present; document it as placeholder audio.
- [ ] Briefly reduce ambient movement during the sequence.
- [ ] Pulse a faint sickly-green reflection from a source that is not visibly represented by a lamp.
- [ ] Give the camera a restrained temporary look offset toward the anomaly.
- [ ] Commit as `feat: add Innsmouth bells and green reflection narrative beat`.

Acceptance: the anomaly reads as subtle wrongness and only occurs after notice/resident interaction.

### Task 6: Add required hotspots and scene/editor setup

**Files:**
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Editor/StreetProjectSetup.cs`
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Editor/HorrorPlay.Editor.asmdef`
- Create/generated: `unity/HorrorPlay/Assets/HorrorPlay/Scenes/InnsmouthStreet.unity`
- Create/generated: URP renderer/pipeline assets under `unity/HorrorPlay/Assets/HorrorPlay/Settings/`

**Interfaces:**
- Editor menu: `HorrorPlay/Setup Innsmouth Street V1`.
- Setup is idempotent: rerunning repairs project settings and regenerates the V1 scene without duplicating runtime roots.

- [ ] Create URP UniversalRenderPipelineAsset/renderer assets through Unity Editor APIs rather than committing hand-written serialized URP objects.
- [ ] Create/save `InnsmouthStreet` with one `StreetBootstrap` root and set it as the first enabled build scene.
- [ ] Configure Input System handling, landscape orientation, linear color space, Android ARM64 intent/settings where Editor APIs permit.
- [ ] Wire closure notice hotspot copy: a municipal harbor closure date predating the understood Unit 317 disappearance without revealing PROJECT LANTERN.
- [ ] Wire resident dialogue as a terse containment warning.
- [ ] Wire Tavern door as a readable interactive destination with a "V1 ends here" response rather than scene transition.
- [ ] Commit as `build: add idempotent Unity street scene setup`.

Acceptance: opening the project and running the setup produces the canonical playable scene without manual hierarchy construction.

### Task 7: Validation documentation and CI-safe static checks

**Files:**
- Create: `unity/HorrorPlay/Assets/HorrorPlay/Tests/EditMode/StreetCompositionContractTests.cs`
- Create: `unity/HorrorPlay/VALIDATION.md`
- Create: `.github/workflows/unity-street-static.yml`

**Interfaces:**
- Static CI cannot pretend to run Unity without a licensed runner; it validates repository contracts and C# source hygiene only.
- Unity EditMode execution remains a documented local/Unity-runner gate.

- [ ] Add source-level contract tests where Unity can execute them: scene width/bounds constants, required hotspot IDs, narrative constants, and mobile quality settings.
- [ ] Add a GitHub Actions static workflow that verifies required project files, branch-safe paths, no accidental `Library/`, and no references from the Unity V1 to the old Godot room-production art.
- [ ] Document exact Unity commands/menu steps for project setup, EditMode tests, Windows play check, touch simulation, Android landscape check, and expected narrative trigger.
- [ ] Commit as `test: add Unity street validation contracts`.

Acceptance: repository-level regressions are caught in CI, while rendering/gameplay validation is explicitly separated from checks that require a Unity Editor runtime.

### Task 8: Final audit

- [ ] Confirm branch is `reboot/unity-innsmouth-street-v1`.
- [ ] Compare branch against `main` and verify legacy Godot files were not deleted or rewritten by the reboot work.
- [ ] Inspect all Unity V1 source paths for references to `gothicvania`, `production_bg`, or old Godot room assets; expected result: none.
- [ ] Verify package versions and `ProjectVersion.txt` match the spec.
- [ ] Verify every required runtime component has one responsibility and no global GameManager was introduced.
- [ ] Verify no paid/external art assets were imported.
- [ ] Report the exact final HEAD and distinguish static verification completed here from Unity Editor/manual rendering checks that require opening Unity 6.3.15f1.

Acceptance: the branch is a clean, reviewable reboot foundation and the only remaining visual question is whether the generated street direction is accepted before any second room begins.
