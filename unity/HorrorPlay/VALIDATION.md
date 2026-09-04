# Innsmouth Street V1 Validation

## Required editor

Unity `6000.3.15f1`.

## First import

1. Open `unity/HorrorPlay` in Unity Hub.
2. Let Package Manager resolve URP 17.3.0 and Input System 1.17.0.
3. The Editor setup will generate the URP assets and `Assets/HorrorPlay/Scenes/InnsmouthStreet.unity`. If it does not run automatically, invoke `HorrorPlay > Setup Innsmouth Street V1`.
4. Open `InnsmouthStreet` and press Play.

## EditMode tests

Open Test Runner > EditMode and run `HorrorPlay.EditModeTests`.

Required contracts:
- walk target clamps to -24..24;
- hotspots enforce proximity and one-shot semantics;
- camera clamp is deterministic;
- mouse/touch produce the same screen-position interaction intent;
- notice or resident unlocks the one-shot atmosphere sequence;
- mobile rain budget is below desktop budget.

## Manual visual/gameplay acceptance

At 1920x1080 and a representative 16:9 Android Game view:
- Inspector reads at a stable human scale and can walk by clicking/tapping the street;
- five depth layers are visible without resembling unrelated stacked sprite packs;
- cold ambient light dominates, with warm light confined to selected windows and Tavern frontage;
- ground looks wet without mirror-like planar reflections;
- Harbor Closure Notice reads that the closure predates Unit 317's public disappearance;
- the resident warns not to answer if the water says the Inspector's name;
- after either interaction, three measured bells occur once, followed by a faint unexplained green reflection;
- the camera remains within authored bounds;
- Tavern door responds but does not transition to another room.

## Android checkpoint

Switch platform to Android and confirm Landscape Left/Auto Rotation policy as desired, IL2CPP and ARM64. Touch must use the same `PointerInteractor` path as mouse. The V1 uses a lower rain budget automatically on mobile.

## Deliberate placeholders

- Inspector is a project-owned geometric silhouette, not final character art.
- Bell audio is generated procedurally as a temporary tone and must be replaced by an owned/licensed bell recording before production.
- Environment is project-owned modular geometry/materials so the visual composition can be accepted before selecting a single coherent final asset family.
