# HorrorPlay — Godot 4.6.3 Test Checklist

Target branch: `agent/aa-vertical-slice-foundation`

Do not merge this branch to `main` until the runtime checklist below is clean.

## 1. Import / static validation

Recommended editor: **Godot 4.6.3 stable**.

From a terminal in the project root, the same checks committed to CI can be run manually:

```bash
godot --headless --path . --import
godot --headless --path . --script res://tools/validate_project.gd
```

Expected validator result:

```text
HorrorPlay validator: OK — <n> resources loaded successfully.
```

Any parser error, missing resource, failed import or invalid scene reference must be fixed before gameplay testing.

## 2. Boot / shell

- Run the project normally with F6/F5 as appropriate.
- Main scene must be the Innsmouth main menu, not a gameplay room.
- `Continuar` must be disabled when no slot exists.
- New Investigation must reset previous runtime state.
- On desktop, Quit is visible; mobile/web should hide it.
- Menu entrance animation should finish without layout jump.

## 3. Cold open

Play New Investigation without skipping first.

Verify:
- Coast Guard 317 background renders at 1920×1080 and scales correctly to the viewport.
- Rain and underwater lighting are visible but do not obscure copy.
- Each click / touch completes or advances the current line.
- The underwater-light beat, three bells, radio voice and creature-shadow pass occur in order.
- Skip works while text is typing and while waiting for input.
- Cold open never modifies inspector sanity / evidence.
- Final blackout transitions to the office cleanly.

## 4. Office

Verify:
- Inspector uses animated idle/walk frames, never the static SVG fallback during normal import.
- Floor clicks stay on the floor; clicks high on walls do not move the player into scenery.
- Desk discovers Coast Guard reports and grants the evidence-cabinet key only once.
- Case board changes its summary according to discovered evidence.
- Medical monograph registers optional evidence.
- Diary registers occult evidence and changes sanity.
- Drawer accepts the correct key and does not duplicate inventory state on re-entry.
- Leaving updates the objective and enters Marsh Street.
- Evidence / objective toast cards are readable and disappear cleanly.

## 5. Marsh Street — test three progression routes

### Route A — Silas testimony
- Read the Coast Guard report.
- Ask Silas about the patrol (the occult diary is not required).
- Testimony should update the case and point toward Barnaby.
- Enter tavern and obtain dock access through testimony.

### Route B — Patron rumor
- Read the Coast Guard report.
- Enter the tavern before resolving Silas.
- Eavesdrop on the fishermen table.
- The rumor must unlock a Barnaby approach and allow the key to be obtained.

### Route C — Documentary pressure
- Go to docks before obtaining the key.
- Read the 317 manifest.
- Return to the tavern.
- The manifest option must appear against Barnaby and grant the key.

For all routes:
- Stone footsteps must differ from office/tavern wood.
- Fish market description must change when sanity reaches Fractured.
- Harbor notice should register optional evidence.
- Returning to office / tavern / docks must not corrupt the current objective.

## 6. Barnaby intimidation consequence

On a separate New Investigation / save:
- Threaten Barnaby instead of persuading him.
- Obtain the key.
- Return to Marsh Street.

Expected:
- Silas is gone.
- The street is staged as emptied / hostile.
- Watcher silhouette appears and leaves.
- Horror stinger / perception pulse occur once.
- Sanity changes once.
- Re-entering the street later must not replay the whole consequence beat.

## 7. Docks

Verify both clue orders:

Order 1:
1. Manifest.
2. Amphibious tracks.

Order 2 on another save:
1. Amphibious tracks.
2. Manifest.

Expected in both:
- Water event triggers exactly once after both clues exist.
- Wet-wood footsteps play.
- Keyless boathouse interaction explains the access problem without falsely assuming Silas was visited.
- With key, boathouse door unlocks and re-entry never resets objective backwards.

## 8. Boathouse puzzle

Required sequence:
1. Inspect lockers before manifest knowledge if possible; 317 solution should not be exposed incorrectly.
2. With manifest evidence, open locker 317.
3. Receive brass fuse.
4. Install fuse.
5. Restore power.
6. Hear the 317 radio log.

Verify:
- Fuse leaves inventory when installed.
- Lighting visibly changes when power returns.
- Radio evidence registers once.
- Replaying radio does not duplicate evidence or sanity loss.
- Black scale is optional and registers once.

## 9. Boathouse danger encounter

After first radio log, verify the door encounter starts once.

Test at least two routes:
- With amphibious-track evidence: darkness / stay-still option.
- Locker 317 hide option.

If sanity is at least 60, also test confrontation.

Expected:
- Door shadow appears.
- Dialogue blocks world input.
- Route outcome changes sanity by the authored amount.
- `boathouse_intrusion_survived` prevents replay.
- Boat launch is unavailable until radio + encounter are complete.

## 10. Devil's Reef endings

Test all reachable endings across saves:

### Investigation ending
Requires occult diary + reef radio log.

### Discipline ending
Requires sanity >= 45.

### Voice ending
Requires sanity <= 44.

A low-sanity run is naturally reachable by combining sanity-costing optional investigation, intimidation / dangerous choices, radio, encounter and black-scale evidence; no debug damage control is required.

Expected:
- Appropriate choice filtering.
- Underwater creature pass renders correctly.
- Ending title / body match chosen route.
- Evidence / optional evidence / sanity stats render correctly.
- Returning to menu leaves game unpaused and removes reef ambience.
- Continue after ending restores the persisted ending state instead of replaying the whole approach.

## 11. Pause / save / load

From office, street, docks and boathouse:
- Open Pause by button and `ui_cancel` / Escape.
- World particles and movement must freeze.
- Resume must restore gameplay processing.
- Manual Save creates / updates slot 1.
- Load must unpause before scene transition and must not leave the new scene frozen.
- Main Menu from Pause saves a checkpoint and returns safely.
- Continue from main menu restores room, evidence, inventory, sanity and branch flags.

## 12. Reveal / inventory interaction

- Reveal should outline interaction collision geometry even where an object is painted into the background.
- On Android/iOS it should also vibrate briefly.
- Selecting an inventory item must update hover copy.
- Clicking a non-item-gated hotspot while an irrelevant item is selected must not make that hotspot appear dead.
- Required-item interactions still need the correct item.

## 13. Mobile / touch smoke test

At minimum test:
- 16:9 desktop.
- One Android viewport with display cutout / safe area.
- Touch advance in dialogue.
- Choice buttons.
- Casebook scroll.
- Inventory selection.
- Reveal.
- Pause / Resume.
- Floor walking and hotspot interaction.

Pay special attention to 48 px choice/button minimums and whether the top HUD collides with a notch / system inset.

## Report format for failures

For each issue, capture:

```text
ROOM:
ACTION / ROUTE:
EXPECTED:
ACTUAL:
ERROR / DEBUGGER TEXT:
SCREENSHOT (if visual):
SAVE STATE / SANITY (if relevant):
```

With that information, a runtime-fix pass can be made without guessing which branch state produced the issue.
