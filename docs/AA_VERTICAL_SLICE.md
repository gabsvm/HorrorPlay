# HorrorPlay — AA Vertical Slice Target

## Product target

Build a polished 30–45 minute narrative-horror vertical slice that feels deliberate, authored and replayable rather than like a point-and-click systems demo.

The goal is not to imitate a literal AA production budget. The goal is AA-level player-facing discipline: cohesive art direction, strong sound design, readable interaction, consequential investigation, stable save/load, intentional pacing, and no exposed prototype controls.

## Experience pillars

1. **Investigation before key hunting** — clues, testimony and physical evidence must form a case the player can follow.
2. **Dread through anticipation** — horror should escalate through sound, environmental change and unreliable perception before showing a creature.
3. **Consequences without dead ends** — major obstacles should support at least two approaches that reconverge while preserving state for later consequences.
4. **Sanity changes perception** — sanity is not health. It changes image, sound, descriptions, available dialogue and eventually the reliability of information.
5. **Mobile-first interaction without mobile-looking presentation** — touch remains first class, but UI must feel cinematic and unobtrusive on PC as well.

## Vertical slice structure

### 0. Main menu
- New investigation / Continue.
- Strong title treatment and atmosphere.
- Save-slot awareness.

### 1. Cold open
- 60–90 second playable or semi-playable guard-coast incident near Devil's Reef.
- Establish one visual motif and one audio motif that return later.
- End on a hard cut to the inspector's office.

### 2. Office — investigation tutorial
- Evidence file, medical report, occult diary and one physical puzzle.
- Teach examine/interact/item use without tutorial popups where possible.
- Casebook updates as evidence is found.
- Reading optional material should change future dialogue, not just add lore.

### 3. Innsmouth streets — social pressure hub
- Split the current single street into at least three visually distinct micro-zones.
- Foreground occlusion, layered fog/rain, distant silhouettes and ambient events.
- Silas provides one lead but not the only possible route forward.
- Returning through the street after threatening Barnaby should visibly change NPC behavior.

### 4. Tavern — first consequential choice
- Obtain dock access through evidence-based persuasion, intimidation, or a third systemic route.
- Barnaby attitude persists.
- Threatening him should make the next street/dock beat more dangerous or less informative.

### 5. Docks / boathouse — first horror escalation
- Locked boathouse uses the acquired dock key.
- Environmental puzzle built from guard-coast equipment, tide state and a damaged logbook.
- First unmistakable evidence of a non-human presence.
- A short pursuit / concealment sequence introduces immediate danger without turning the project into an action game.

### 6. Devil's Reef stinger
- Short boat departure or shoreline sequence.
- Pay off one motif from the cold open.
- End the vertical slice at the first undeniable glimpse of the larger threat.

## Required systems

### Investigation
- Evidence catalog with stable IDs.
- Current objective and completed objectives.
- Casebook UI.
- Evidence predicates for dialogue and interactions.
- Save/load persistence.

### Dialogue
- Choice callbacks must execute after the active balloon is released.
- Move authored dialogue out of room scripts into data resources before the content count grows substantially.
- Support conditions based on evidence, flags, variables and sanity tier.
- Support per-line speaker/portrait metadata.

### Sanity / perception
- Four readable internal tiers: Stable, Uneasy, Fractured, Breaking.
- Continuous restrained post-process response.
- Tier events for audio, false details and altered descriptions.
- Never invalidate a required puzzle solution solely because sanity is low.

### Movement and staging
- Restore real idle/walk animation everywhere.
- Replace competing movement tweens with one authoritative movement command.
- Add walk polygons/navigation before rooms become spatially complex.
- Add depth sorting and foreground occlusion where the player can pass behind scenery.

### Save/load
- Versioned save schema.
- Deterministic runtime reset before load.
- Investigation state persistence.
- Next revision must add player position, per-room entity state, checkpoint/autosave support and safe migration.

## Art direction

The current mix of simple SVG backdrops, small pixel props and post-processing is not sufficient for the target. Post-processing cannot substitute for authored environment art.

Target a single coherent visual language. Recommended direction: high-detail cinematic pixel art / illustrated pixel hybrid with layered BG/MG/FG assets, authored lighting masks and animation passes.

For each hero room, budget separate layers for:
- Background architecture / sky.
- Midground interactable architecture.
- Props and decals.
- Foreground occluders.
- Lighting masks / emissive windows.
- Weather particles.
- One or two subtle ambient animations.

Do not upscale low-detail placeholder SVGs and treat them as final art.

## Audio target

A single music track and synthetic UI beeps are prototype audio. The vertical slice needs:
- Room-tone ambience for every location.
- Rain/wind/water layers with variation.
- Footsteps by surface.
- Door, wood, metal, paper, inventory and UI one-shots.
- Creature / distant vocal stingers.
- At least three musical states: investigation, dread, escalation.
- Sanity-reactive processing or alternate layers.

## Definition of done for the slice

- 30–45 minutes for a blind first playthrough.
- No debug buttons or labels visible.
- Main menu and Continue behavior work.
- At least two meaningful approaches to the tavern/dock-access problem.
- Casebook communicates what the player knows and what they are trying to do.
- Four sanity tiers have player-visible consequences beyond a progress bar.
- Office, street, tavern and docks have final-quality or near-final-quality visual passes.
- No static player fallback during normal play.
- Save/load preserves all progression needed to resume without contradictions.
- One complete horror escalation and payoff exists before the slice ends.
- PC mouse and mobile touch both complete the slice without special debug controls.

## Current foundation branch

`agent/aa-vertical-slice-foundation` establishes the first layer of this target: restored player animation fallback, deterministic movement tween ownership, sanity tiers tied to atmosphere, investigation/evidence state, casebook HUD, dialogue-choice callback fix, consequential Barnaby routes, versioned investigation saves, runtime state reset and a main-menu shell.

The next production pass should prioritize **final-quality environment art + docks/boathouse gameplay + real audio**, not more global post-processing polish.
