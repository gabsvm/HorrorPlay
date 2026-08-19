# HorrorPlay — AA Vertical Slice

## Product target

A polished 30–45 minute narrative-horror vertical slice that feels authored, coherent and replayable instead of like a point-and-click systems demo.

The target is AA-level player-facing discipline rather than literal AA budget: cohesive presentation, investigation with consequences, escalating dread, stable persistence, restrained UI and a complete beginning-to-payoff arc.

## Experience pillars

1. **Investigation before key hunting** — evidence, testimony and physical clues form a case the player can reason through.
2. **Dread through anticipation** — sound, environmental staging and unreliable perception escalate before the threat is shown clearly.
3. **Consequences without dead ends** — approaches reconverge while preserving social, sanity and evidence state.
4. **Sanity changes perception** — mental state affects image, ambience, descriptions and available decisions rather than acting as health.
5. **PC and touch share one authored experience** — no debug-only path is required to complete the slice.

## Current playable slice

### 0. Main menu — IMPLEMENTED
- New Investigation / Continue / desktop Quit.
- Save-slot awareness.
- Animated panel entrance and room-ambience cleanup.
- Dedicated real Pause menu with Resume / Save / Load / Main Menu.

### 1. Coast Guard cold open — IMPLEMENTED
- The slice opens four nights before the investigation aboard Coast Guard unit 317.
- Authored boat / reef / fog / underwater-light staging replaces the old black-screen exposition sequence.
- Establishes the recurring motifs paid off later: underwater green light, three bells, names spoken over radio and submerged architecture.
- Creature-shadow pass, rain, ambience and cinematic stingers escalate the sequence without changing the future inspector's sanity state.
- Skip remains available.

### 2. Inspector office — EXPANDED INVESTIGATION TUTORIAL
- Rebuilt authored environment with integrated desk, evidence cabinet, case board, confiscated-book library, window lighting and depth staging.
- Removed oversized placeholder hotspot sprites from the composition.
- Coast Guard reports become formal evidence and expose a timeline inconsistency.
- Optional 1898 pathology monograph becomes persistent evidence.
- Occult diary adds coordinates and the three-bells motif while costing sanity.
- Low-sanity bookshelf event changes perception instead of acting as a generic damage button.
- Case board summarizes discovered facts dynamically.
- Evidence-cabinet interaction now establishes that somebody removed material before the inspector received the case.

### 3. Marsh Street — REACTIVE INVESTIGATION HUB
- Rebuilt as three readable visual zones: police station, tavern/social center, and fish-market/harbor edge.
- Harbor notice is optional evidence proving the reef was officially restricted before the Coast Guard disappearance.
- Fish market has sanity-reactive descriptions.
- Silas can advance the case through the Coast Guard file even if the player never reads the occult diary.
- The docks can be reconnoitered before obtaining the key.
- Threatening Barnaby empties the street, removes Silas and triggers a visible watcher beat with sound / perception / sanity consequences.
- Stone footsteps, wet reflection, rain and low fog give the hub its own surface and ambience identity.

### 4. The Golden Fish tavern — MULTI-ROUTE SOCIAL PROBLEM
- Rebuilt environment with integrated bar, shelves, fireplace, patrons, missing-men board and atmospheric smoke.
- Barnaby access problem now supports four meaningful approaches:
  1. Silas testimony,
  2. dock manifest documentary pressure,
  3. overheard patron rumor,
  4. police intimidation.
- Barnaby attitude persists and changes later dialogue.
- Intimidation creates a visible downstream consequence in Marsh Street and costs sanity.
- Patron and notice-board interactions reward prior investigation.

### 5. Innsmouth docks — PLAYABLE INVESTIGATION SPACE
- Accessible before the dock key, separating reconnaissance from progression.
- Manifest establishes boat / locker number 317 and supports a documentary route back to Barnaby.
- Amphibious tracks provide optional physical evidence and sanity impact.
- Finding both clues triggers an order-independent water event with sound, perception and sanity response.
- Boat 317, boathouse and town return path are all staged as integrated hotspots.
- Wet-wood footsteps, sea/wind ambience, rain and fog differentiate the location sonically and visually.

### 6. Coast Guard boathouse — MULTI-STAGE PUZZLE + DANGER BEAT
- Manifest-gated locker deduction identifies service locker 317.
- Locker provides a physical brass fuse inventory item.
- Fuse installation and breaker restoration are separate puzzle steps.
- Power restoration changes lighting and wakes the radio.
- Last 317 transmission becomes evidence and repeats the cold-open motif.
- Optional black scale rewards deeper exploration.
- After the radio, an immediate-danger concealment sequence occurs at the door:
  - evidence-aware darkness strategy using the amphibious tracks,
  - hiding inside locker 317,
  - high-sanity confrontation.
- All routes reconverge without arbitrary death, but preserve outcome and different sanity costs.
- Boat launch requires both the radio evidence and surviving the encounter.

### 7. Devil's Reef — INTERACTIVE VERTICAL-SLICE FINALE
- Three resolution paths depend on evidence and sanity:
  - investigation / dark navigation,
  - disciplined course holding,
  - answering the voice at low sanity.
- Creature-pass staging combines animation, underwater lighting, ambience, horror stinger and perception pulse.
- Ending state persists.
- Ending report includes total evidence, optional evidence and remaining sanity.

## Systems now implemented

### Investigation
- Stable evidence catalog and IDs.
- Current / completed objectives.
- Casebook with evidence categories.
- Persistent evidence state.
- Conditional dialogue based on evidence, flags, variables, inventory and sanity.
- Multiple non-occult and documentary progression routes.

### Dialogue
- Choice callbacks execute only after the active balloon releases the dialogue channel.
- Conditional choice predicates are centralized.
- Authored transitions await dialogue completion.
- Dialogue feedback audio uses restrained 16-bit PCM rather than the original unsigned 8-bit prototype beep.

### Sanity / perception
- Stable / Uneasy / Fractured / Breaking internal tiers.
- HUD presents these as mental-state labels instead of a health-like percentage display.
- Continuous post-process response.
- Short authored perception pulses.
- Sanity-reactive room ambience pitch.
- Altered environmental descriptions.
- Sanity-gated decisions at the boathouse and reef.

### Audio
- Per-room procedural ambience profiles for office, streets, tavern, docks, boathouse and reef.
- Crossfaded ambience transitions.
- Surface-aware footsteps for wood, stone, wet wood and metal.
- Cached cinematic horror stinger.
- Location-specific dialogue timbres for important speakers / radio.
- These generated sounds are deliberately replaceable scaffolding: final recorded / authored sound assets can slot into the same architecture without changing room logic.

### Movement / interaction
- Real inspector idle / walk animation recovery.
- One authoritative movement tween.
- Deliberate eased movement speed.
- Free floor clicks are constrained to room walk bounds instead of allowing the inspector to walk into walls / sky.
- Hotspot walk markers still allow precise authored staging.
- Reveal outlines real hotspot geometry even when interaction art is painted into the background.
- Invalid selected-item use safely falls back where appropriate instead of swallowing interaction.

### UI / shell
- Main menu and Continue awareness.
- Dedicated pause overlay; gameplay tree actually pauses while the menu remains responsive.
- Gameplay HUD reduced to mental state / objective / Expediente / Reveal / Pause.
- Evidence and objective toast feedback.
- Inventory hides when empty.
- Safe-area adjustments for Android / iOS.
- Debug damage controls and debug player labels removed.

### Persistence
- Versioned save schema v3.
- Deterministic runtime reset before load.
- Investigation, inventory, sanity, room and branching state persistence.
- Automatic per-room checkpoints.
- Additional checkpoints after major social / danger decisions.
- Legacy investigation-state reconstruction retained for earlier saves.

### Validation infrastructure
- `tools/validate_project.gd` recursively loads project scripts, scenes, resources, shaders and imported assets.
- `.github/workflows/godot-validate.yml` installs Godot 4.6.3, imports the project headlessly and runs the resource validator on `agent/**` pushes and pull requests.
- Runtime gameplay still requires a real Godot execution / manual playthrough before merge; this branch has not been claimed as runtime-green from the ChatGPT environment.

## Art status

Office, Marsh Street and tavern have been rebuilt to match the authored staging philosophy introduced by docks / boathouse / reef. The slice is now visually coherent enough for gameplay and pacing evaluation.

These environments are still vector-based vertical-slice production art. A later commercial production pass should replace or paint over them with the chosen final language (high-detail cinematic pixel art / illustrated pixel hybrid) while preserving the composition, hotspot geometry and lighting intent established here.

## What remains after the first real Godot playtest

Do **not** expand to more chapters before resolving playtest findings. The next pass should be driven by observed runtime behavior:

1. Parser / import / signal errors found by Godot or CI.
2. Collision / walk-bound tuning based on actual clicks and touch input.
3. Dialogue pacing and branch clarity from a blind playthrough.
4. Save / Continue / re-entry edge cases.
5. Performance on the weakest target Android device.
6. Replacement of procedural sound beds with final authored audio where the mix proves effective.
7. Final painted environment / animation pass after compositions are validated in motion.
8. Move large dialogue blocks into data resources before adding substantially more narrative content.

## Definition of done for this implementation milestone

- Complete arc from cold open → office → Marsh Street / tavern / docks → boathouse → Devil's Reef payoff.
- No debug control required to progress.
- More than one viable route to dock access.
- Optional evidence changes later interpretation / options.
- One complete multi-stage physical investigation puzzle.
- One complete danger / concealment beat.
- One complete sanity / evidence-dependent finale.
- Persistent casebook, objectives and choices.
- Distinct ambience and footstep surfaces across locations.
- Main menu, pause, manual save/load and automatic checkpoints implemented.
- Automated headless validation infrastructure committed.
- Manual Godot 4.6.3 playtest remains the gate before merge to `main`.

## Working branch

`agent/aa-vertical-slice-foundation`

This branch is intentionally **not merged into `main`** yet. It is the test candidate for the first complete AA-oriented vertical slice.
