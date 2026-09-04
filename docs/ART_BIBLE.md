# HorrorPlay — Art Bible & Visual Cohesion Standards

## 1. Setting & Visual Identity
- **Location & Era**: Coastal Massachusetts (Innsmouth), November 1926.
- **Genre**: Neo-noir investigative psychological horror with Lovecraftian decay.
- **Visual Benchmark**: **Office (`room_01_office`)**.
  - Dense environmental composition, multi-layered depth, sharp pixel art material legibility, natural chiaroscuro shadow falloff, grounded contact shadows.
- **Protagonist Integration**: The Inspector uses the Cartoon Detective Pack as baseline silhouette, with grounded baseline ($Y = 460$ in local character coords, touching local $Y = 0$), scaled to adult human proportions relative to doors ($~90\%$ of usable door height) and desks ($~1.6\times$ desk height).

## 2. Global Palette Specification
All room artwork and props must conform to the unified HorrorPlay tonal range:
- **Base Shadow / Deep Charcoal**: `#111417` — `#1b1f23` (deepest shadows, unlit corners)
- **Petroleum Navy / Midnight Slate**: `#162129` — `#212f3d` (dominant outdoor night sky, deep water)
- **Cold Wet Gray / Rain Haze**: `#3a4752` — `#51606d` (cobblestones, wet timber, distant silhouettes)
- **Aged Salt Wood / Driftwood**: `#2c2825` — `#483e38` (weathered docks, boathouse rafters, rotting hulls)
- **Warm Tungsten / Amber Lantern**: `#e5a85b` — `#f4c67a` (lantern mantles, fireplace embers, desk lamps)
- **Aged Brass / Tarnished Metal**: `#8f7443` — `#bda061` (doorknobs, drawer handles, electrical fuses, ship fixtures)
- **Sickly Sea Green Accent**: `#203a31` — `#356353` (used ONLY for supernatural/deep-water indicators: Reef phosphorescence, cold open submerged light, sanity distortion)

## 3. Room-Specific Direction & Contrast Hierarchy

### Room 01 — Inspector Office (Approved Benchmark)
- **Lighting**: Interior warm tungsten desk lamp against exterior cold rain window.
- **Atmosphere**: Tobacco, old paper, rain beating on glass.
- **Dominant Colors**: Rich dark walnut, amber tungsten, cold slate blue exterior spill.

### Room 02 — Marsh Street
- **Dominant Pack**: Gothicvania Town (ansimuz).
- **Lighting**: Distant flickering streetlamps casting long amber cones onto rain-slick cobblestone.
- **Atmosphere**: Desolate, damp, decaying seaside town architecture, wet reflections, low ground fog.
- **Color Temperature**: Cold midnight blue exterior with isolated warm gas lamp pools.

### Room 03 — The Golden Fish Tavern
- **Dominant Pack**: FREE Bar Asset Pack (styloo).
- **Support Pack**: FREE Pixel Art Bar and Cafe Items (karsiori).
- **Lighting**: Enclosed interior with warm fireplace hearth and smoky ceiling lanterns.
- **Atmosphere**: Dense tobacco haze, dark oak wainscoting, stained tavern bar, glinting amber liquor bottles.
- **Color Temperature**: Dominantly warm tungsten/amber interior with pitch-black drafty corners.

### Room 04 — Innsmouth Docks
- **Dominant Pack**: SeaHook BASIC (Spriteshift).
- **Support Pack**: FREE Pixel Art Sidescroller Sea Backgrounds (IndieKit).
- **Lighting**: Handheld portable hurricane lantern, distant lighthouse flash, cold ocean mist.
- **Atmosphere**: Creaking rotting pier timbers, slapping dark tide, ropes, fishing barrels, heavy Atlantic rain.
- **Color Temperature**: Desaturated sea slate and deep navy with local amber lantern pool.

### Room 05 — Coast Guard Boathouse
- **Dominant Pack**: Warehouse / Factory (ACTG).
- **Support Pack**: Nautical gear derived from SeaHook BASIC.
- **Lighting**: Initially dead electrical grid lit only by doorway mist and lantern; switches to stark overhead industrial incandescent when fuse is restored.
- **Atmosphere**: Corrugated iron, heavy pine rafters, workbench clutter, service locker 317, damp sea floor.
- **Color Temperature**: Muted industrial charcoal-green and rusted iron.

### Room 06 — Devil's Reef
- **Dominant Pack**: Magic Cliffs Pack (ansimuz).
- **Support Pack**: Warped Ocean View (ansimuz).
- **Lighting**: Black turbulent sea, pale moonlight breaking through cloud rents, unnatural sickly green radiance surging from underwater depths.
- **Atmosphere**: Jagged basalt outcrops, foam-swept reef, oppressive non-human scale, sound of impossible bells.
- **Color Temperature**: Monochromatic cold ocean slate accented by eerie emerald bioluminescence.

## 4. Anti-Frankenstein Rules
1. **Never combine more than two packs in any room** (1 dominant + max 1 support).
2. **Strip all out-of-period or out-of-genre elements**: no modern electronics, modern warning signs, plastic, fantasy magic runes, cute cartoon faces, or pirate skull tropes.
3. **Harmonize pixel density**: All environmental textures must render at an effective visual resolution compatible with the character and office pixels (no mismatched mega-pixels or micro-pixels).
4. **All third-party assets must pass through the HorrorPlay adaptation grading pipeline** before runtime integration.
