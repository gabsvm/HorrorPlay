# HorrorPlay — AA Vertical Slice Target

## Product target

Build a polished 30–45 minute narrative-horror vertical slice that feels deliberate, authored and replayable rather than like a point-and-click systems demo.

The goal is not to imitate a literal AA production budget. The goal is AA-level player-facing discipline: cohesive art direction, strong sound design, readable interaction, consequential investigation, stable save/load, intentional pacing, and no exposed prototype controls.

## Experience pillars

1. **Investigation before key hunting** — clues, testimony and physical evidence must form a case the player can follow.
2. **Dread through anticipation** — horror escalates through sound, environmental change and unreliable perception before showing a creature.
3. **Consequences without dead ends** — major obstacles support alternate approaches that reconverge while preserving consequences.
4. **Sanity changes perception** — sanity changes image, descriptions and available decisions instead of behaving like health.
5. **Mobile-first interaction without mobile-looking presentation** — touch remains first class, while the UI stays cinematic on PC.

## Current playable slice

### 0. Main menu — IMPLEMENTED
- New Investigation / Continue / desktop Quit.
- Save awareness.
- Game now boots through a proper shell instead of directly into the intro.

### 1. Intro — FOUNDATION PRESENT
- Existing narrative intro retained.
- Still needs the planned playable Coast Guard cold open for the final production pass.

### 2. Office — FOUNDATION PRESENT
- Evidence file, medical material and occult diary feed the Investigation system.
- Real idle/walk animation is restored automatically instead of silently falling back to a static SVG.
- Existing drawer interaction remains the weakest puzzle in the slice and should be replaced or expanded.

### 3. Innsmouth streets — EXPANDED
- Streets now connect to the docks even before the player obtains the key, allowing reconnaissance before progression.
- Silas updates the case and identifies the 317 lead.
- Threatening Barnaby has a visible consequence: Silas disappears and the return beat changes.
- Still needs the planned split into several visually distinct street micro-zones.

### 4. Tavern — FIRST CONSEQUENCE IMPLEMENTED
- Barnaby can be approached through evidence-based reasoning or intimidation.
- Reasoning requires the relevant testimony rather than merely displaying flavor text.
- Barnaby attitude persists and intimidation changes later staging.
- A third systemic route remains desirable for the production version.

### 5. Docks — PLAYABLE
- New `room_04_docks` scene and authored dock background.
- Accessible before obtaining dock access, so exploration and progression are not the same gate.
- Manifest evidence establishes boat / locker number 317.
- Amphibious tracks provide optional physical evidence and sanity impact.
- Finding both clues triggers an order-independent authored water event with sound, post-process and sanity response.
- The boathouse door respects the dock key and preserves progression correctly on re-entry.

### 6. Coast Guard boathouse — PLAYABLE MULTI-STAGE PUZZLE
- New `room_05_boathouse` scene and authored interior background.
- Evidence-gated locker puzzle: the correct 317 option appears only after discovering the manifest.
- Locker 317 provides a physical brass fuse inventory item.
- Fuse installation and breaker restoration are separate steps.
- Power restoration changes scene lighting and wakes the radio.
- The final 317 transmission becomes persistent evidence and affects sanity.
- Optional black scale evidence rewards deeper exploration.
- Boat launch is gated by restoring power and hearing the final transmission.

### 7. Devil's Reef — PLAYABLE VERTICAL-SLICE FINALE
- New `room_06_reef` scene and authored reef background.
- Three resolution paths are selected according to evidence and sanity:
  - investigation / dark navigation,
  - disciplined course holding,
  - answering the voice at low sanity.
- Creature-pass staging combines animation, underwater lighting, a horror stinger and perception pulse.
- Ending panel reports evidence count and remaining sanity, then returns to the main menu.

## Systems implemented in the foundation branch

### Investigation
- Stable evidence catalog and IDs.
- Current and completed objectives.
- Casebook UI.
- Evidence persistence in save data.
- Dialogue predicates for evidence, flags, variables, inventory and sanity.

### Dialogue
- Choice callbacks execute only after the active balloon releases the dialogue channel.
- Conditional choices support investigation-state requirements.
- Scene transitions now wait for their authored transition dialogue instead of fading under an active balloon.

### Sanity / perception
- Four internal tiers: Stable, Uneasy, Fractured, Breaking.
- Continuous sanity-driven post-processing.
- Authored `horror_pulse()` for short perception spikes that return to the current mental-state profile.
- Reef decisions explicitly react to sanity thresholds.

### Interaction / UX
- Real idle/walk animation recovery and authoritative movement tween ownership.
- A selected inventory item no longer swallows normal interactions on non-item-gated hotspots.
- Reveal now outlines actual hotspot collision geometry, including interactables embedded in a painted background.
- Inventory hides when empty.
- Debug `Daño Mental` control is removed.

### Save / shell
- Versioned save schema v3.
- Deterministic runtime reset before load.
- Investigation, inventory, sanity and room persistence.
- Deferred room checkpoints inherited by every gameplay `Room`.
- Main menu with Continue awareness.
- Dedicated Pause menu replaces permanent Save / Load buttons in the gameplay HUD.

### Audio
- Existing music routing retained.
- Cached cinematic horror stinger added for authored escalation beats.
- This remains an interim solution; proper room ambience and authored SFX are still required.

## Art direction

The new dock, boathouse and reef SVGs are significantly more authored than the original placeholder rooms, but they are still **vertical-slice production scaffolding**, not the final art target.

Recommended final direction remains high-detail cinematic pixel art / illustrated pixel hybrid with separate BG/MG/FG layers, lighting masks and animation passes.

For each hero room, budget:
- background architecture / sky,
- midground interactable architecture,
- props and decals,
- foreground occluders,
- lighting masks / emissive windows,
- weather particles,
- subtle ambient animation.

Do not treat post-processing or enlarged low-detail SVGs as a substitute for final environment art.

## Audio target still outstanding

The largest production gap after this milestone is audio. The slice still needs:
- unique room-tone ambience per location,
- rain / wind / water layers with variation,
- footsteps by surface,
- door, wood, metal, paper, inventory and mechanical one-shots,
- radio / creature / distant vocal design,
- at least three musical states: investigation, dread and escalation,
- sanity-reactive alternate layers or processing.

## Next production pass

1. **Runtime validation in Godot 4.6.x** — launch every new scene, inspect imports, parser errors, signal paths, save/load and touch interaction. This cannot be honestly marked complete until the project is executed in Godot.
2. **Replace the office micro-puzzle** with an investigation puzzle of the same quality as the boathouse chain.
3. **Split the street hub** into multiple micro-zones and add foreground occlusion / ambient NPC staging.
4. **Create a proper ambience and SFX architecture**, then replace temporary procedural sounds beat by beat.
5. **Add walk polygons / navigation constraints** before spatial layouts become more complex.
6. **Move authored dialogue out of room scripts** into data resources before the content count grows further.
7. **Final art pass** for office, streets, tavern, docks, boathouse and reef.
8. **Cold-open Coast Guard sequence** that establishes the same bells / 317 / underwater-light motif paid off at the reef.

## Definition of done for the slice

- 30–45 minutes for a blind first playthrough.
- No debug buttons or labels visible.
- Main menu, Pause, Continue, checkpoint and manual save/load behavior work.
- At least two meaningful approaches to the tavern/dock-access problem.
- Casebook communicates what the player knows and what they are trying to do.
- Sanity changes choices and presentation beyond a progress bar.
- Office, street, tavern, docks, boathouse and reef have near-final visual passes.
- No static player fallback during normal play.
- Save/load resumes progression without contradictions.
- One complete multi-step investigation puzzle exists.
- One complete horror escalation and interactive payoff exists before the slice ends.
- PC mouse and mobile touch both complete the slice without debug controls.

## Current foundation branch

`agent/aa-vertical-slice-foundation`

At this milestone the branch is more than a systems prototype: it contains a complete investigation chain from office through docks, boathouse and an interactive Devil's Reef ending. The next highest-value work is **runtime validation + audio + replacing remaining weak early-game content**, not additional global shaders.
