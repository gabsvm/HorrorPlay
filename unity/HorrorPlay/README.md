# HorrorPlay Unity Reboot — Innsmouth Street V1

This is the isolated Unity reboot vertical slice. The legacy Godot project remains at repository root for reference and is not required to run this slice.

## Editor

- Unity: `6000.3.15f1` (Unity 6.3 LTS)
- URP: `17.3.0`
- Input System: `1.17.0`

## Open

1. Add `unity/HorrorPlay` as a project in Unity Hub.
2. Open with Unity `6000.3.15f1`.
3. Wait for packages/scripts to import.
4. Run `HorrorPlay > Setup Innsmouth Street V1` once. The setup is idempotent and may be rerun to repair the generated scene/project render settings.
5. Open `Assets/HorrorPlay/Scenes/InnsmouthStreet.unity` and press Play.

The street composition is deterministic and built at runtime by `StreetBootstrap`. This is intentional: final coherent environment art can replace facade/prop primitives without rewriting movement, interaction, camera, or narrative code.

## V1 controls

- Left mouse click: interact or walk.
- Primary touch: same interaction path as mouse.
- Notice / resident: unlock the atmospheric bell sequence.
- Tavern door: readable end-of-slice hotspot; no Tavern scene exists yet.

## Visual rule

Do not import the old Godot room production art into this Unity slice. V1 uses project-owned geometry/materials only until the street composition is visually accepted.
