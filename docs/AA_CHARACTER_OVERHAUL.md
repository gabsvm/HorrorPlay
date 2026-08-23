# HorrorPlay — AA Character Overhaul Contract

## Working branch

Work **only** on:

`agent/aa-character-overhaul`

This branch is based on `agent/aa-vertical-slice-foundation`.

Do not modify `main`. Do not merge. Do not rewrite or remove the vertical-slice gameplay, Investigation, inventory, save/load, dialogue, sanity or room progression unless a very small compatibility change is required by the character system.

The purpose of this branch is to bring the playable inspector from prototype quality to a convincing AA-quality 2D adventure character and to leave a reusable actor pipeline for later NPC upgrades.

---

## 1. Current audit

The current inspector is a visible production bottleneck.

### Art / resolution

- Current idle frames are native **39 x 52 px** PNGs displayed at `Vector2(4, 4)` in `player.gd`.
- This produces an effective ~156 x 208 px sprite composed of very large nearest-neighbor pixels.
- The environments are illustrated/vector-based and substantially higher-frequency than the character, so the inspector reads as a pixel-art asset pasted on top of another game.
- There are only four idle files, and `hat-man-idle-2.png` and `hat-man-idle-4.png` are the same blob, so there are only three unique idle poses.
- Walk has only six frames.
- The fallback `inspector.svg` has glowing cyan eyes and a different art language. It must never be used as a production fallback.

### Animation

Only two animation states effectively exist:

- idle
- walk

Missing player-facing states include:

- turn / settle
- inspect
- use object at mid height
- pickup / use low
- react / recoil
- contextual fear/uneasy idle
- hiding entry/hold/exit support

The player therefore slides to a hotspot and the game action happens through dialogue/state changes with no physical performance from the protagonist.

### Movement

`Player.walk_to()` currently moves the CharacterBody2D using a Tween with `TRANS_SINE / EASE_IN_OUT`.

Consequences:

- movement reads as interpolation/gliding rather than authored locomotion;
- visual foot cadence is only loosely related to world velocity;
- there is no acceleration/deceleration model owned by the character;
- CharacterBody2D is not being used as an actual physics-driven controller;
- changing direction is an immediate horizontal flip;
- arrival at an interaction has no settle/face/action phase.

### Architecture

Every gameplay room currently contains its own duplicated Player node tree. The player visual/light/collider definition is not a reusable scene.

This means character changes must be repeated across rooms and creates a high risk of configuration drift.

### Environment integration

- Y-sort exists, but the character has no authored contact shadow.
- There is no configurable depth scaling.
- Attached light exists, but the visible artwork does not clearly show a matching carried light source.
- The character has no explicit interaction anchor/facing contract with hotspots.
- There is no coherent visual reaction to sanity except global post-processing.

---

## 2. Target quality

The goal is not photorealism. The goal is a **cohesive illustrated 2D protagonist that belongs in the same image as the environments**.

Target perception at 1920x1080:

- believable adult human proportions;
- strong readable detective silhouette;
- face and coat readable without giant pixels;
- smooth but restrained animation;
- convincing foot contact;
- clear physical response when interacting;
- subtle environmental grounding through shadow, light and depth;
- no debug/fallback visual ever appearing during normal play.

The inspector should feel closer to a hand-painted / illustrated narrative-adventure character than to a retro pixel character.

### Art direction

1926 Massachusetts investigator:

- adult male, lean/average build, approximately 7–7.5 heads tall;
- dark charcoal/brown fedora;
- period-appropriate wool/trench overcoat, shirt, tie/waistcoat layers;
- dark leather shoes/boots;
- restrained burgundy/brass accent colors that fit HorrorPlay's UI and lighting;
- coat and hat should create a recognizable silhouette even at ~200 px display height;
- face mostly shaded by the hat brim but still human/readable;
- no glowing eyes in the stable character state;
- no chibi proportions;
- no glossy 3D-render look;
- no obvious generative-art artifacts, extra fingers, inconsistent coat buttons, changing hat shape or unstable face between frames.

Reference language: cinematic illustrated neo-noir / Lovecraftian investigation, not pixel art.

### Source asset resolution

For final production frames:

- recommended transparent frame canvas: **at least 256 x 384**, preferably **320 x 480 or 384 x 512**;
- all frames in one state must share the same canvas size, foot baseline and pivot;
- render/display size at 1080p should normally land around 180–240 px tall depending on room perspective;
- high-resolution source should be scaled down, never a 39x52 asset scaled up 4x;
- use linear filtering for the illustrated production character;
- preserve alpha and clean silhouette edges.

If image-generation tooling is available, create **original license-safe character artwork**. Do not scrape or reuse copyrighted game sprites. If high-quality artwork cannot be generated in the environment, implement the full runtime pipeline and explicitly report the missing art deliverables instead of pretending hand-coded geometric SVG placeholders are final art.

---

## 3. Required runtime architecture

### 3.1 One reusable inspector scene

Create a reusable scene, recommended path:

`src/characters/inspector/inspector.tscn`

Recommended hierarchy:

- `Inspector` — CharacterBody2D
  - `VisualRoot` — Node2D
    - `ContactShadow` — Sprite2D / Polygon2D
    - `AnimatedSprite2D`
    - optional foreground equipment/prop anchor
  - `CollisionShape2D`
  - `InteractionAnchor` — Marker2D
  - `PersonalLight` — PointLight2D
  - optional `AnimationPlayer` for non-frame ancillary animation

Move controller logic from the generic duplicated `src/rooms/player.gd` into the reusable inspector system. `class_name Player` may be retained for compatibility if necessary, but the room scenes must instantiate one packed inspector scene rather than rebuilding the node tree manually.

Replace the duplicated Player nodes in all rooms that contain the inspector:

- office
- streets
- tavern
- docks
- boathouse

Do not introduce a visible inspector into scenes that intentionally do not contain one.

### 3.2 Animation resource

Use `AnimatedSprite2D` + a committed `SpriteFrames` resource or equivalent Godot-native animation resource.

Do not load individual frame paths every `_ready()` and do not assign `sprite.texture` manually every `_process()`.

The animation system must expose stable semantic states rather than frame arrays.

Required animation names at minimum:

- `idle`
- `idle_uneasy`
- `walk`
- `turn` or a convincing directional settle solution
- `inspect`
- `use_mid`
- `pickup_low`
- `react`

Recommended for the boathouse sequence if feasible:

- `hide_enter`
- `hide_hold`
- `hide_exit`

The game must still function if optional contextual clips are absent, but required clips must be present for acceptance.

### 3.3 Character state machine

Implement explicit runtime states, for example:

- IDLE
- WALKING
- TURNING
- INTERACTING
- REACTING
- LOCKED

Do not let arbitrary room code directly mutate sprite frames.

The controller owns:

- desired target;
- movement velocity;
- facing;
- current animation state;
- interaction sequence;
- movement cancellation/re-targeting rules.

---

## 4. Movement quality

Replace Tween-owned locomotion with a proper `_physics_process()` movement loop.

Suggested starting tuning, adjust by feel:

- max speed: 290–330 px/s;
- acceleration: ~1200–1700 px/s²;
- deceleration: ~1600–2200 px/s²;
- arrival radius: ~5–8 px.

Use actual velocity to drive walk animation speed.

Requirements:

- no skating after feet visually plant;
- no slow sine-ease glide at the beginning/end of every walk;
- walking left/right uses a consistent facing system;
- changing direction should not visually pop if a short turn/settle can solve it;
- new free-walk clicks can retarget safely;
- hotspot-directed movement remains deterministic;
- interaction callbacks fire only after arrival and any required facing/interaction animation phase.

The current point-and-click behavior must remain: selecting a hotspot/item target causes the inspector to move automatically to the authored interaction point.

---

## 5. Interaction performance

Upgrade the current contract between `Room`, `Hotspot` and Player.

A hotspot should be able to describe how the inspector approaches it without room scripts manually animating the sprite.

Recommended exported hotspot metadata:

- `walk_to_point` (already exists)
- optional `interaction_facing`: AUTO / LEFT / RIGHT
- optional `interaction_pose`: DEFAULT / MID / LOW / INSPECT

When interacting:

1. resolve target;
2. walk to `walk_to_point`;
3. face the target or authored facing direction;
4. settle briefly if needed;
5. play contextual inspector action (`inspect`, `use_mid`, `pickup_low`);
6. execute/emit the hotspot action at the appropriate point;
7. return to idle.

For item use (e.g. Rusty Key -> evidence cabinet), preserve the inventory workflow already implemented:

Inventory -> select item -> USAR -> click target -> auto-walk -> contextual use animation -> actual hotspot success/failure callback.

Do not regress item-ID matching, viewport-to-world conversion, save/load behavior or the explicit item-use mode.

---

## 6. Footsteps and animation sync

Footsteps must be triggered from animation contact events, not a generic timer detached from actual foot planting.

Acceptable approaches:

- `AnimatedSprite2D.frame_changed` with named contact frames per animation; or
- AnimationPlayer Call Method tracks/events.

Continue using the existing surface abstraction:

- wood
- stone
- wet_wood
- metal

Requirements:

- footstep cadence scales with actual movement speed;
- no footstep when sliding/settling at zero velocity;
- left/right foot cadence is believable;
- stopping mid-cycle does not emit delayed steps.

---

## 7. Grounding and environment integration

### Contact shadow

Add a soft dark elliptical/contact shadow beneath the feet.

- subtle alpha, not a cartoon blob;
- scales with character scale;
- remains beneath character via z/y ordering;
- can become slightly softer/lighter on wet exterior scenes if useful.

### Depth scale

Implement a **configurable**, not hard-coded, room-level depth scaling option.

Recommended Room exports:

- `character_depth_scaling_enabled`
- `character_depth_y_min`
- `character_depth_y_max`
- `character_scale_far`
- `character_scale_near`

Default may be disabled/1.0 where the room does not need it.

The feature must not break hotspot walk-to positions or collision baselines.

### Personal light

Centralize the personal light inside the reusable inspector scene.

Room configuration should determine whether it is enabled/intensity/tint rather than duplicating a PointLight2D in each room.

The visible character art should make the source plausible (small carried lantern/torch/equipment) if the light is used prominently.

Do not add expensive normal-map complexity unless the art pipeline genuinely supports it.

---

## 8. Sanity-linked character performance

Do not turn sanity into a cartoon effect.

At minimum:

- STABLE: neutral idle;
- UNEASY/FRACTURED/BREAKING: allow `idle_uneasy` with subtle posture/breath/head movement changes;
- high-stress authored events may call `react`.

Do not recolor the protagonist into a monster and do not use glowing cyan eyes as a sanity shorthand.

Global AtmosphereController remains responsible for world/perception effects.

---

## 9. Import and performance

- Production illustrated sprites should use appropriate linear filtering.
- Avoid hundreds of individual runtime `load()` calls.
- Prefer SpriteFrames/atlas resources loaded once with the inspector scene.
- Keep transparent canvases reasonably tight while retaining one common baseline.
- Avoid enormous 4K-per-frame animations.
- Test at 1920x1080 and the project's mobile stretch configuration.
- Character animation must not create garbage/new resources every frame.
- No per-frame texture loading.

---

## 10. Legacy cleanup

After the new character is proven:

- remove runtime dependency on the old 39x52 inspector frames;
- remove or quarantine the glowing-eye `inspector.svg` fallback;
- remove duplicated per-room inspector visual/light definitions;
- do not delete legacy assets until references are confirmed gone.

Use repository search before deleting anything.

---

## 11. Acceptance scenes

The following must be tested visually and functionally:

### Office

- inspector enters/stands naturally on rug/floor;
- walk to desk;
- pick up/receive Rusty Key;
- Inventory -> USAR -> cabinet;
- auto-walk to cabinet;
- face cabinet;
- play contextual use animation;
- unlock callback fires and key is consumed;
- walk to exit.

### Streets

- long horizontal walk does not skate;
- character fits rain/lighting;
- Silas interaction has proper approach/facing;
- no oversized or undersized sprite relative to environment.

### Tavern

- character is grounded against floor/bar perspective;
- interaction with Barnaby feels physical even though dialogue remains the primary UI;
- character lighting does not look pasted over the interior.

### Docks

- wet-wood footsteps;
- exterior personal light configuration;
- character remains readable through rain/fog;
- contact shadow does not look wrong on wet planks.

### Boathouse

- walk/use interactions work after power state changes;
- radio/locker/fuse interactions use appropriate contextual animation;
- `react` is used for the intrusion beat where appropriate;
- hiding route supports the new actor state if implemented.

---

## 12. Required QA

Before handoff:

- Godot 4.6.3 project imports without parser/resource errors;
- run `godot --headless --path . --import` if available;
- run `godot --headless --path . --script res://tools/validate_project.gd` if available;
- no missing textures;
- no legacy inspector fallback appears;
- save/load does not duplicate or lose the player scene;
- pause works while inspector is idle and after movement;
- inventory item-use flow still works;
- interaction callbacks fire once only;
- repeated clicks do not leave the player in a locked animation state;
- left/right movement and facing are correct;
- animation has no pivot/baseline jumping;
- no visible foot sliding at normal speed;
- no console spam.

Capture screenshots or short clips from at least Office, Streets, Docks and Boathouse for review.

---

## 13. Commit / delivery plan

Keep the work reviewable. Recommended sequence:

### Commit 1 — actor architecture

`refactor: centralize inspector into reusable actor scene`

- reusable inspector scene;
- room instances migrated;
- no major visual change required yet;
- preserve gameplay.

### Commit 2 — movement/state machine

`feat: add velocity-driven inspector locomotion and actor states`

- physics-process movement;
- state machine;
- facing/arrival contract;
- footsteps adapted.

### Commit 3 — production visual set

`art: replace prototype inspector with illustrated production character`

- high-res original character frames;
- SpriteFrames resource;
- stable baseline/pivot;
- remove normal runtime use of low-res frames.

### Commit 4 — contextual interactions

`feat: animate inspector hotspot and item interactions`

- inspect/use/pickup/react;
- Hotspot metadata;
- item-use animation and callback sequencing.

### Commit 5 — environment grounding

`polish: integrate inspector shadow depth lighting and sanity idles`

- contact shadow;
- optional room depth scaling;
- personal light centralization;
- uneasy idle/react integration.

### Commit 6 — QA / cleanup

`fix: harden inspector transitions imports and legacy cleanup`

- fix runtime issues found during testing;
- remove dead references;
- update docs/testing notes.

Do not squash these phases before review unless explicitly requested.

---

## 14. Forbidden shortcuts

Do **not**:

- merely increase the old sprite scale;
- blur the 39x52 sprite and call it high resolution;
- generate one still image and keep the current fake animation;
- replace it with simplistic hand-coded SVG geometry;
- add random shaders to hide weak source art;
- download copyrighted sprites from another game;
- convert the game into a 3D character project;
- rewrite unrelated gameplay systems;
- remove mobile/touch behavior;
- merge into main;
- declare AA quality without showing the character in actual gameplay rooms.

---

## 15. Definition of done

This overhaul is accepted only when:

1. the inspector visually belongs to the environment rather than reading as retro pixel art;
2. the actor is one reusable scene across gameplay rooms;
3. locomotion is velocity-driven and visually planted;
4. idle and walk are no longer the only physical performances;
5. item use visibly walks/faces/acts before the callback;
6. contact shadow and room lighting ground the actor;
7. sanity can alter subtle character performance;
8. save/load, pause, inventory and hotspot interactions remain correct;
9. Godot 4.6.3 runtime/import testing is clean;
10. review media is supplied for Office, Streets, Docks and Boathouse.

At handoff, report:

- branch name;
- final commit SHA;
- list of commits by phase;
- files created/modified/deleted;
- which art assets are final vs temporary;
- Godot validation commands/results;
- known limitations;
- screenshots/clips used for visual QA.
