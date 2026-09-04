"""
HorrorPlay — Stage Art Adaptation Pipeline
Transforms raw third-party asset packs into cohesive, palette-unified,
multi-layered pixel art production environments at 1920x1080.
"""

import os
import glob
import math
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageDraw

RAW_DIR = "assets/third_party"
OUTPUT_BASE = "assets/images/rooms"

PALETTE = {
    "shadow_charcoal": (17, 20, 24),
    "deep_navy": (22, 33, 42),
    "cold_slate": (48, 62, 72),
    "wet_gray": (68, 81, 92),
    "aged_wood": (44, 38, 33),
    "dark_oak": (35, 26, 20),
    "warm_amber": (229, 168, 91),
    "aged_brass": (166, 128, 66),
    "sickly_green": (36, 64, 53),
    "emerald_surge": (50, 115, 94),
}

def grade_image(img, shadow_mult=(0.7, 0.8, 0.95), mid_tint=(0.85, 0.9, 0.95), highlight_mult=(1.0, 0.95, 0.85), contrast=1.1, sat=0.82):
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    r, g, b, a = img.split()
    rgb = Image.merge("RGB", (r, g, b))
    
    rgb = ImageEnhance.Color(rgb).enhance(sat)
    rgb = ImageEnhance.Contrast(rgb).enhance(contrast)
    
    r_arr, g_arr, b_arr = rgb.split()
    
    def tint_band(band, mult):
        lut = [min(255, int(i * mult)) for i in range(256)]
        return band.point(lut)
        
    r_out = tint_band(r_arr, (shadow_mult[0] + mid_tint[0] + highlight_mult[0]) / 3.0)
    g_out = tint_band(g_arr, (shadow_mult[1] + mid_tint[1] + highlight_mult[1]) / 3.0)
    b_out = tint_band(b_arr, (shadow_mult[2] + mid_tint[2] + highlight_mult[2]) / 3.0)
    
    graded_rgb = Image.merge("RGB", (r_out, g_out, b_out))
    return Image.merge("RGBA", (*graded_rgb.split(), a))

def add_dither_noise(img, strength=5):
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    w, h = img.size
    import random
    random.seed(42)
    noise_data = bytearray(w * h * 4)
    orig = img.tobytes()
    for i in range(0, len(orig), 4):
        a = orig[i+3]
        if a > 0:
            n = random.randint(-strength, strength)
            noise_data[i] = max(0, min(255, orig[i] + n))
            noise_data[i+1] = max(0, min(255, orig[i+1] + n))
            noise_data[i+2] = max(0, min(255, orig[i+2] + n))
            noise_data[i+3] = a
        else:
            noise_data[i+3] = 0
    return Image.frombytes("RGBA", (w, h), bytes(noise_data))

def make_canvas(w=1920, h=1080, bg_color=(17, 22, 28, 255)):
    return Image.new("RGBA", (w, h), bg_color)

# ==============================================================================
# 1. STREETS (Gothicvania Town — Dominant)
# ==============================================================================
def adapt_streets():
    print("[1/5] Compositing Streets (Gothicvania Town)...")
    out_dir = os.path.join(OUTPUT_BASE, "streets")
    os.makedirs(out_dir, exist_ok=True)
    canvas = make_canvas(1920, 1080, (14, 18, 24, 255))
    
    town_dir = os.path.join(RAW_DIR, "gothicvania_town/GothicVania-town-files/PNG/environment")
    layers_dir = os.path.join(town_dir, "layers")
    props_dir = os.path.join(town_dir, "props-sliced")
    
    # Parallax Sky
    bg_sky = Image.open(os.path.join(layers_dir, "background.png")).convert("RGBA")
    bg_sky = grade_image(bg_sky, shadow_mult=(0.45, 0.6, 0.8), mid_tint=(0.6, 0.7, 0.85), contrast=1.15, sat=0.7)
    bg_sky = bg_sky.resize((1920, 720), Image.NEAREST)
    canvas.paste(bg_sky, (0, 0), bg_sky)
    
    # Parallax Midground Town Silhouettes
    mg = Image.open(os.path.join(layers_dir, "middleground.png")).convert("RGBA")
    mg = grade_image(mg, shadow_mult=(0.35, 0.5, 0.65), mid_tint=(0.5, 0.6, 0.75), contrast=1.2, sat=0.6)
    mg = mg.resize((1920, 520), Image.NEAREST)
    canvas.paste(mg, (0, 240), mg)
    
    # Cobblestone ground plane (Y = 720 to 1080)
    tileset = Image.open(os.path.join(layers_dir, "tileset.png")).convert("RGBA")
    tileset = grade_image(tileset, shadow_mult=(0.5, 0.55, 0.65), mid_tint=(0.7, 0.75, 0.8), contrast=1.1, sat=0.65)
    
    # Extract cobblestone blocks from tileset
    ground_tile = tileset.crop((16, 16, 64, 64)).resize((96, 96), Image.NEAREST)
    for gy in range(740, 1080, 96):
        for gx in range(0, 1920, 96):
            canvas.paste(ground_tile, (gx, gy), ground_tile)
            
    # Wet cobblestone sheen overlay
    draw = ImageDraw.Draw(canvas)
    for y in range(740, 1080, 4):
        alpha = int(35 * ((y - 740) / 340.0))
        draw.line([(0, y), (1920, y)], fill=(20, 32, 42, alpha))
        
    # Houses layout
    h_a = Image.open(os.path.join(props_dir, "house-a.png")).convert("RGBA")
    h_b = Image.open(os.path.join(props_dir, "house-b.png")).convert("RGBA")
    h_c = Image.open(os.path.join(props_dir, "house-c.png")).convert("RGBA")
    
    h_a = grade_image(h_a, shadow_mult=(0.6, 0.65, 0.75), mid_tint=(0.8, 0.8, 0.85), contrast=1.12, sat=0.75)
    h_b = grade_image(h_b, shadow_mult=(0.6, 0.65, 0.75), mid_tint=(0.8, 0.8, 0.85), contrast=1.12, sat=0.75)
    h_c = grade_image(h_c, shadow_mult=(0.6, 0.65, 0.75), mid_tint=(0.8, 0.8, 0.85), contrast=1.12, sat=0.75)
    
    # Scale factor for houses to establish realistic human-to-architecture scale
    scale_factor = 3.6
    
    # Left Block: Office / Police exit (DoorBack hotspot at 230, 775)
    ha_scaled = h_a.resize((int(h_a.width * scale_factor), int(h_a.height * scale_factor)), Image.NEAREST)
    canvas.paste(ha_scaled, (-40, 770 - ha_scaled.height), ha_scaled)
    
    # Center-Left: Tavern entrance block (TavernEntrance hotspot at 750, 790)
    hb_scaled = h_b.resize((int(h_b.width * scale_factor), int(h_b.height * scale_factor)), Image.NEAREST)
    canvas.paste(hb_scaled, (520, 780 - hb_scaled.height), hb_scaled)
    
    # Center-Right: Fish market facade (FishMarket hotspot at 1250, 800)
    hc_scaled = h_c.resize((int(h_c.width * scale_factor), int(h_c.height * scale_factor)), Image.NEAREST)
    canvas.paste(hc_scaled, (1080, 790 - hc_scaled.height), hc_scaled)
    
    # Far Right: Descent toward Docks (DocksEntrance at 1730, 800)
    ha_right = ImageOps.mirror(ha_scaled)
    canvas.paste(ha_right, (1560, 800 - ha_right.height), ha_right)
    
    # Street Props (Street lamps, well, wagon, barrels, crate stacks)
    lamp = Image.open(os.path.join(props_dir, "street-lamp.png")).convert("RGBA")
    lamp = grade_image(lamp, shadow_mult=(0.7, 0.7, 0.8), mid_tint=(1.0, 0.95, 0.8), contrast=1.2, sat=0.85)
    lamp = lamp.resize((int(lamp.width * 3.5), int(lamp.height * 3.5)), Image.NEAREST)
    canvas.paste(lamp, (450, 770 - lamp.height), lamp)
    canvas.paste(lamp, (1015, 780 - lamp.height), lamp)
    canvas.paste(lamp, (1500, 790 - lamp.height), lamp)
    
    wagon = Image.open(os.path.join(props_dir, "wagon.png")).convert("RGBA")
    wagon = grade_image(wagon, shadow_mult=(0.55, 0.6, 0.7), mid_tint=(0.75, 0.75, 0.8), contrast=1.1, sat=0.7)
    wagon = wagon.resize((int(wagon.width * 3.0), int(wagon.height * 3.0)), Image.NEAREST)
    canvas.paste(wagon, (1320, 800 - wagon.height), wagon)
    
    crates = Image.open(os.path.join(props_dir, "crate-stack.png")).convert("RGBA")
    crates = grade_image(crates, shadow_mult=(0.6, 0.65, 0.7), mid_tint=(0.8, 0.8, 0.8), contrast=1.1, sat=0.75)
    crates = crates.resize((int(crates.width * 3.2), int(crates.height * 3.2)), Image.NEAREST)
    canvas.paste(crates, (40, 800 - crates.height), crates)
    canvas.paste(crates, (1680, 810 - crates.height), crates)
    
    barrel = Image.open(os.path.join(props_dir, "barrel.png")).convert("RGBA")
    barrel = grade_image(barrel, shadow_mult=(0.6, 0.65, 0.7), mid_tint=(0.8, 0.8, 0.8), contrast=1.1, sat=0.75)
    barrel = barrel.resize((int(barrel.width * 3.0), int(barrel.height * 3.0)), Image.NEAREST)
    canvas.paste(barrel, (180, 810 - barrel.height), barrel)
    canvas.paste(barrel, (1000, 805 - barrel.height), barrel)
    
    sign = Image.open(os.path.join(props_dir, "sign.png")).convert("RGBA")
    sign = grade_image(sign, shadow_mult=(0.6, 0.65, 0.7), mid_tint=(0.8, 0.8, 0.8), contrast=1.1, sat=0.75)
    sign = sign.resize((int(sign.width * 3.2), int(sign.height * 3.2)), Image.NEAREST)
    canvas.paste(sign, (720, 680), sign)
    
    canvas = add_dither_noise(canvas, 4)
    canvas.save(os.path.join(out_dir, "streets_production_bg.png"), optimize=True)
    # Also copy to backgrounds root for drop-in loading
    canvas.save("assets/images/backgrounds/streets_production_bg.png", optimize=True)
    print("  -> Streets background successfully generated.")

# ==============================================================================
# 2. TAVERN (FREE Bar Asset Pack — Dominant, Karsiori — Support)
# ==============================================================================
def adapt_tavern():
    print("[2/5] Compositing Tavern (Styloo dominant + Karsiori support)...")
    out_dir = os.path.join(OUTPUT_BASE, "tavern")
    os.makedirs(out_dir, exist_ok=True)
    canvas = make_canvas(1920, 1080, (28, 20, 16, 255))
    
    styloo_dir = os.path.join(RAW_DIR, "styloo_bar/individuals sprite")
    karsiori_dir = os.path.join(RAW_DIR, "karsiori_bar/FREE Pixel Art Bar and Cafe Items Pack")
    
    # Back wall wooden paneling
    wall_tex = Image.open(os.path.join(styloo_dir, "wall_bar.png")).convert("RGBA")
    wall_tex = grade_image(wall_tex, shadow_mult=(0.58, 0.48, 0.4), mid_tint=(0.78, 0.68, 0.58), contrast=1.2, sat=0.85)
    wall_tile = wall_tex.resize((128, 128), Image.NEAREST)
    for wy in range(0, 760, 128):
        for wx in range(0, 1920, 128):
            canvas.paste(wall_tile, (wx, wy))
            
    # Dark aged oak tavern floor (Y = 740 to 1080)
    # Match Office's warm dark aged timber floor
    draw = ImageDraw.Draw(canvas)
    draw.rectangle([(0, 740), (1920, 1080)], fill=(34, 26, 20, 255))
    for fy in range(740, 1080, 28):
        # Floor plank seam
        draw.line([(0, fy), (1920, fy)], fill=(20, 15, 11, 255), width=3)
        draw.line([(0, fy + 1), (1920, fy + 1)], fill=(48, 36, 28, 255), width=1)
        # Staggered plank joints
        for fx in range((fy * 67) % 200, 1920, 260):
            draw.line([(fx, fy), (fx, fy + 28)], fill=(18, 13, 9, 255), width=2)
            
    # Ceiling beams
    beam = Image.open(os.path.join(styloo_dir, "beam.png")).convert("RGBA")
    beam = grade_image(beam, shadow_mult=(0.7, 0.6, 0.5), mid_tint=(0.9, 0.8, 0.7), contrast=1.2, sat=0.85)
    beam_h = beam.resize((1920, 72), Image.NEAREST)
    canvas.paste(beam_h, (0, 0), beam_h)
    canvas.paste(beam_h, (0, 140), beam_h)
    
    # Back-bar Shelving and Bottles (X = 900 to 1380, Y = 280 to 520)
    shelf = Image.open(os.path.join(styloo_dir, "shelf.png")).convert("RGBA")
    shelf = grade_image(shelf, shadow_mult=(0.8, 0.7, 0.6), mid_tint=(1.0, 0.9, 0.8), contrast=1.15, sat=0.85)
    shelf = shelf.resize((int(shelf.width * 3.8), int(shelf.height * 3.8)), Image.NEAREST)
    canvas.paste(shelf, (940, 380), shelf)
    canvas.paste(shelf, (940, 480), shelf)
    
    # Place Karsiori liquor bottles and glassware onto shelves
    bottle_files = sorted(glob.glob(os.path.join(karsiori_dir, "Liquor Bottle *.png")))
    bx = 960
    for bf in bottle_files[:12]:
        bot = Image.open(bf).convert("RGBA")
        bot = grade_image(bot, shadow_mult=(0.8, 0.75, 0.7), mid_tint=(1.1, 0.95, 0.8), contrast=1.2, sat=0.95)
        bot = bot.resize((int(bot.width * 2.8), int(bot.height * 2.8)), Image.NEAREST)
        canvas.paste(bot, (bx, 380 - bot.height + 4), bot)
        bx += bot.width + 6
        if bx > 1320:
            break
            
    glass_files = sorted(glob.glob(os.path.join(karsiori_dir, "Glass *.png"))) + sorted(glob.glob(os.path.join(karsiori_dir, "Beer *.png")))
    bx = 965
    for gf in glass_files[:10]:
        gl = Image.open(gf).convert("RGBA")
        gl = grade_image(gl, shadow_mult=(0.8, 0.75, 0.7), mid_tint=(1.1, 0.95, 0.8), contrast=1.2, sat=0.95)
        gl = gl.resize((int(gl.width * 2.6), int(gl.height * 2.6)), Image.NEAREST)
        canvas.paste(gl, (bx, 480 - gl.height + 4), gl)
        bx += gl.width + 12
        if bx > 1320:
            break
            
    # Styloo Main Bar Counter (Bar hotspot at 960, 815, Barnaby at 1120, 685)
    bar = Image.open(os.path.join(styloo_dir, "bar.png")).convert("RGBA")
    bar = grade_image(bar, shadow_mult=(0.8, 0.7, 0.6), mid_tint=(1.05, 0.95, 0.85), contrast=1.2, sat=0.9)
    bar_scaled = bar.resize((int(bar.width * 4.0), int(bar.height * 4.0)), Image.NEAREST)
    canvas.paste(bar_scaled, (920, 815 - bar_scaled.height + 30), bar_scaled)
    
    # Bar Stools in front of counter
    stool = Image.open(os.path.join(styloo_dir, "stool.png")).convert("RGBA")
    stool = grade_image(stool, shadow_mult=(0.75, 0.65, 0.55), mid_tint=(0.95, 0.85, 0.75), contrast=1.15, sat=0.85)
    stool = stool.resize((int(stool.width * 3.4), int(stool.height * 3.4)), Image.NEAREST)
    for sx in (950, 1070, 1190, 1310):
        canvas.paste(stool, (sx, 835 - stool.height), stool)
        
    # Left Area: Tavern tables and patrons seating (Patrons hotspot at 560, 810)
    canvas.paste(stool, (380, 820 - stool.height), stool)
    canvas.paste(stool, (620, 820 - stool.height), stool)
    boxes = Image.open(os.path.join(styloo_dir, "boxes.png")).convert("RGBA")
    boxes = grade_image(boxes, shadow_mult=(0.7, 0.6, 0.5), mid_tint=(0.9, 0.8, 0.7), contrast=1.15, sat=0.8)
    boxes = boxes.resize((int(boxes.width * 3.2), int(boxes.height * 3.2)), Image.NEAREST)
    canvas.paste(boxes, (440, 810 - boxes.height), boxes)
    
    # Notice Board on Left Wall (NoticeBoard hotspot at 500, 700)
    board = Image.open(os.path.join(styloo_dir, "Greenboard_empty.png")).convert("RGBA")
    board = grade_image(board, shadow_mult=(0.65, 0.6, 0.55), mid_tint=(0.85, 0.8, 0.75), contrast=1.1, sat=0.6)
    board = board.resize((int(board.width * 3.5), int(board.height * 3.5)), Image.NEAREST)
    canvas.paste(board, (370, 260), board)
    
    # Right Area: Stone Fireplace Hearth (FireLight at 1670, 680)
    draw = ImageDraw.Draw(canvas)
    # Fireplace stone surround
    draw.rectangle([(1520, 480), (1820, 820)], fill=(32, 28, 25, 255), outline=(55, 48, 42, 255), width=8)
    draw.rectangle([(1560, 560), (1780, 820)], fill=(12, 10, 8, 255))
    # Glowing coal / ember bed
    draw.ellipse([(1580, 760), (1760, 820)], fill=(180, 65, 20, 240))
    draw.ellipse([(1610, 775), (1730, 815)], fill=(240, 140, 45, 255))
    
    # Exit Doorway on Far Left (DoorBack at 230, 820)
    draw.rectangle([(80, 360), (280, 820)], fill=(16, 20, 24, 255), outline=(50, 42, 36, 255), width=10)
    
    canvas = add_dither_noise(canvas, 4)
    canvas.save(os.path.join(out_dir, "tavern_production_bg.png"), optimize=True)
    canvas.save("assets/images/backgrounds/tavern_production_bg.png", optimize=True)
    print("  -> Tavern background successfully generated.")

# ==============================================================================
# 3. DOCKS (SeaHook BASIC — Dominant, IndieKit — Support)
# ==============================================================================
def adapt_docks():
    print("[3/5] Compositing Docks (SeaHook dominant + IndieKit support)...")
    out_dir = os.path.join(OUTPUT_BASE, "docks")
    os.makedirs(out_dir, exist_ok=True)
    canvas = make_canvas(1920, 1080, (12, 18, 24, 255))
    
    indie_dir = os.path.join(RAW_DIR, "indiekit_sea/FREE - Pixel Art Sidescroller Sea Backgrounds/NIGHT")
    seahook_dir = os.path.join(RAW_DIR, "seahook_basic/SeaHookPack")
    
    # IndieKit Night Sky, Moon, and Sea Layers
    sky = Image.open(os.path.join(indie_dir, "BG_NIGHT.png")).convert("RGBA")
    sky = grade_image(sky, shadow_mult=(0.35, 0.45, 0.65), mid_tint=(0.5, 0.6, 0.8), contrast=1.2, sat=0.7)
    sky = sky.resize((1920, 600), Image.NEAREST)
    canvas.paste(sky, (0, 0), sky)
    
    moon = Image.open(os.path.join(indie_dir, "MOON_NIGHT.png")).convert("RGBA")
    moon = grade_image(moon, shadow_mult=(0.6, 0.7, 0.85), mid_tint=(0.85, 0.9, 0.95), contrast=1.1, sat=0.6)
    moon = moon.resize((int(moon.width * 2.0), int(moon.height * 2.0)), Image.NEAREST)
    canvas.paste(moon, (1200, 110), moon)
    
    clouds = Image.open(os.path.join(indie_dir, "CLOUDS_NIGHT.png")).convert("RGBA")
    clouds = grade_image(clouds, shadow_mult=(0.35, 0.45, 0.6), mid_tint=(0.55, 0.65, 0.75), contrast=1.15, sat=0.6)
    clouds = clouds.resize((1920, 360), Image.NEAREST)
    canvas.paste(clouds, (0, 180), clouds)
    
    mountains = Image.open(os.path.join(indie_dir, "MONTAINS_NIGHT.png")).convert("RGBA")
    mountains = grade_image(mountains, shadow_mult=(0.3, 0.4, 0.55), mid_tint=(0.45, 0.55, 0.65), contrast=1.2, sat=0.55)
    mountains = mountains.resize((1920, 240), Image.NEAREST)
    canvas.paste(mountains, (0, 360), mountains)
    
    ocean_back = Image.open(os.path.join(indie_dir, "OCEANB_NIGHT.png")).convert("RGBA")
    ocean_back = grade_image(ocean_back, shadow_mult=(0.25, 0.35, 0.5), mid_tint=(0.4, 0.5, 0.65), contrast=1.2, sat=0.6)
    ocean_back = ocean_back.resize((1920, 320), Image.NEAREST)
    canvas.paste(ocean_back, (0, 480), ocean_back)
    
    ocean_front = Image.open(os.path.join(indie_dir, "OCEANF_NIGHT.png")).convert("RGBA")
    ocean_front = grade_image(ocean_front, shadow_mult=(0.3, 0.4, 0.55), mid_tint=(0.45, 0.55, 0.7), contrast=1.25, sat=0.65)
    ocean_front = ocean_front.resize((1920, 400), Image.NEAREST)
    canvas.paste(ocean_front, (0, 680), ocean_front)
    
    # SeaHook Pier Structure (Timber deck at Y = 740 to 860, Pilings below)
    sh_tiles = Image.open(os.path.join(seahook_dir, "SeaHookTileset.png")).convert("RGBA")
    sh_tiles = grade_image(sh_tiles, shadow_mult=(0.5, 0.55, 0.65), mid_tint=(0.7, 0.75, 0.8), contrast=1.2, sat=0.7)
    
    # Pier wood plank deck tile
    deck_plank = sh_tiles.crop((32, 64, 64, 96)).resize((96, 96), Image.NEAREST)
    pier_post = sh_tiles.crop((0, 96, 32, 160)).resize((96, 192), Image.NEAREST)
    
    # Pilings submerged into water
    for px in range(80, 1850, 190):
        canvas.paste(pier_post, (px, 780), pier_post)
        
    # Main walking pier deck
    for px in range(0, 1920, 96):
        canvas.paste(deck_plank, (px, 740), deck_plank)
        canvas.paste(deck_plank, (px, 780), deck_plank)
        
    # Right Side: Coast Guard Boathouse facade (BoathouseDoor at 1720, 800)
    sh_wall = Image.open(os.path.join(seahook_dir, "Wall.png")).convert("RGBA")
    sh_wall = grade_image(sh_wall, shadow_mult=(0.45, 0.5, 0.6), mid_tint=(0.65, 0.7, 0.75), contrast=1.2, sat=0.7)
    wall_block = sh_wall.resize((128, 128), Image.NEAREST)
    for wy in range(240, 780, 128):
        for wx in range(1450, 1920, 128):
            canvas.paste(wall_block, (wx, wy))
            
    # Boathouse heavy door frame
    draw = ImageDraw.Draw(canvas)
    draw.rectangle([(1580, 360), (1840, 780)], fill=(22, 18, 15, 255), outline=(75, 62, 52, 255), width=10)
    draw.rectangle([(1695, 360), (1705, 780)], fill=(50, 40, 34, 255))
    # Brass lock plate
    draw.rectangle([(1685, 570), (1715, 610)], fill=(166, 128, 66, 255))
    
    # Moored Coast Guard boat 317 (Boat317 hotspot at 1350, 800)
    boat_tile = Image.open(os.path.join(seahook_dir, "BoatTile.png")).convert("RGBA")
    boat_tile = grade_image(boat_tile, shadow_mult=(0.55, 0.6, 0.65), mid_tint=(0.75, 0.8, 0.8), contrast=1.2, sat=0.7)
    boat_scaled = boat_tile.resize((int(boat_tile.width * 3.8), int(boat_tile.height * 3.8)), Image.NEAREST)
    canvas.paste(boat_scaled, (1200, 830 - boat_scaled.height), boat_scaled)
    
    # Dock Lamp Post at (640, 410)
    town_props = "assets/third_party/gothicvania_town/GothicVania-town-files/PNG/environment/props-sliced"
    lamp = Image.open(os.path.join(town_props, "street-lamp.png")).convert("RGBA")
    lamp = grade_image(lamp, shadow_mult=(0.7, 0.7, 0.8), mid_tint=(1.0, 0.95, 0.8), contrast=1.2, sat=0.85)
    lamp = lamp.resize((int(lamp.width * 3.5), int(lamp.height * 3.5)), Image.NEAREST)
    canvas.paste(lamp, (610, 750 - lamp.height), lamp)
    
    # Wet cargo crates and barrels
    crates = Image.open(os.path.join(town_props, "crate-stack.png")).convert("RGBA")
    crates = grade_image(crates, shadow_mult=(0.55, 0.6, 0.65), mid_tint=(0.75, 0.75, 0.8), contrast=1.15, sat=0.7)
    crates = crates.resize((int(crates.width * 3.4), int(crates.height * 3.4)), Image.NEAREST)
    canvas.paste(crates, (480, 770 - crates.height), crates)
    
    barrel = Image.open(os.path.join(town_props, "barrel.png")).convert("RGBA")
    barrel = grade_image(barrel, shadow_mult=(0.55, 0.6, 0.65), mid_tint=(0.75, 0.75, 0.8), contrast=1.15, sat=0.7)
    barrel = barrel.resize((int(barrel.width * 3.0), int(barrel.height * 3.0)), Image.NEAREST)
    canvas.paste(barrel, (780, 780 - barrel.height), barrel)
    
    canvas = add_dither_noise(canvas, 4)
    canvas.save(os.path.join(out_dir, "docks_production_bg.png"), optimize=True)
    canvas.save("assets/images/backgrounds/docks_production_bg.png", optimize=True)
    print("  -> Docks background successfully generated.")

# ==============================================================================
# 4. BOATHOUSE (Warehouse / Factory ACTG — Dominant, SeaHook — Support)
# ==============================================================================
def adapt_boathouse():
    print("[4/5] Compositing Boathouse (ACTG Warehouse dominant + SeaHook nautical support)...")
    out_dir = os.path.join(OUTPUT_BASE, "boathouse")
    os.makedirs(out_dir, exist_ok=True)
    
    actg_dir = os.path.join(RAW_DIR, "actg_warehouse")
    seahook_dir = os.path.join(RAW_DIR, "seahook_basic/SeaHookPack")
    
    wh_v2 = Image.open(os.path.join(actg_dir, "WarehouseV2.png")).convert("RGBA")
    wh_v1 = Image.open(os.path.join(actg_dir, "warehouse.png")).convert("RGBA")
    
    for state, powered in [("dim", False), ("powered", True)]:
        canvas = make_canvas(1920, 1080, (14, 18, 22, 255) if not powered else (22, 26, 28, 255))
        draw = ImageDraw.Draw(canvas)
        
        # Corrugated iron & timber wall background
        mult = 1.0 if not powered else 1.22
        sh_mult = (0.35 * mult, 0.40 * mult, 0.48 * mult)
        graded_v2 = grade_image(wh_v2, shadow_mult=sh_mult, mid_tint=(0.55 * mult, 0.60 * mult, 0.65 * mult), contrast=1.2, sat=0.7)
        
        # Industrial structural beams & roof trusses
        truss = graded_v2.crop((0, 0, 128, 64)).resize((384, 192), Image.NEAREST)
        for tx in range(0, 1920, 384):
            canvas.paste(truss, (tx, 0), truss)
            canvas.paste(truss, (tx, 140), truss)
            
        # Corrugated wall siding
        wall_panel = graded_v2.crop((64, 64, 128, 128)).resize((192, 192), Image.NEAREST)
        for wy in range(240, 760, 192):
            for wx in range(0, 1920, 192):
                canvas.paste(wall_panel, (wx, wy))
                
        # Heavy timber dock / warehouse concrete plank floor (Y = 740 to 1080)
        floor_tile = graded_v2.crop((0, 64, 64, 128)).resize((128, 128), Image.NEAREST)
        floor_tile = grade_image(floor_tile, shadow_mult=(0.4, 0.42, 0.46), mid_tint=(0.58, 0.6, 0.64), contrast=1.15, sat=0.6)
        for fy in range(740, 1080, 128):
            for fx in range(0, 1920, 128):
                canvas.paste(floor_tile, (fx, fy))
                
        # Left: Pier exit door (DoorBack at 365, 790)
        draw.rectangle([(120, 320), (340, 780)], fill=(10, 13, 16, 255), outline=(42, 36, 30, 255), width=8)
        
        # Service Lockers 317 (ServiceLockers hotspot at 910, 800)
        draw.rectangle([(840, 320), (1340, 780)], fill=(28, 36, 38, 255), outline=(48, 58, 62, 255), width=6)
        for lkx in range(840, 1340, 100):
            draw.line([(lkx, 320), (lkx, 780)], fill=(18, 24, 26, 255), width=4)
            # Locker vent louvers
            for vy in range(350, 420, 12):
                draw.line([(lkx + 20, vy), (lkx + 80, vy)], fill=(12, 16, 18, 255), width=2)
            # Stencil "317" on second locker
            if lkx == 940:
                draw.rectangle([(lkx + 25, 460), (lkx + 75, 495)], fill=(15, 18, 20, 255))
                # Brass latch
                draw.rectangle([(lkx + 80, 520), (lkx + 92, 545)], fill=(PALETTE["aged_brass"] if not powered else (210, 175, 95)), outline=(40, 32, 20, 255))
                
        # Fuse Box / Electrical Panel (FuseBox hotspot at 620, 800)
        fuse_fill = (40, 46, 48, 255) if not powered else (50, 60, 62, 255)
        draw.rectangle([(620, 480), (800, 720)], fill=fuse_fill, outline=(70, 82, 86, 255), width=5)
        draw.rectangle([(645, 515), (775, 685)], fill=(20, 25, 27, 255))
        # Circular fuse socket
        socket_color = (80, 68, 45, 255) if not powered else (240, 180, 70, 255)
        draw.ellipse([(685, 570), (735, 620)], fill=socket_color, outline=(130, 105, 60, 255), width=3)
        if powered:
            # Indicator pilot light glow
            draw.ellipse([(700, 525), (720, 545)], fill=(255, 80, 50, 255))
            
        # Workbench / Marine Radio / Winch Launch Ramp on Right (X = 1400 to 1920)
        draw.rectangle([(1380, 560), (1780, 780)], fill=(32, 25, 20, 255), outline=(55, 44, 35, 255), width=6)
        # Marine radio console
        draw.rectangle([(1420, 440), (1650, 560)], fill=(20, 26, 28, 255), outline=(42, 52, 56, 255), width=4)
        # Dial tuner
        draw.ellipse([(1450, 470), (1500, 520)], fill=(10, 14, 16, 255), outline=(80, 98, 102, 255), width=2)
        draw.rectangle([(1520, 480), (1620, 510)], fill=(15, 18, 20, 255))
        if powered:
            # Backlit frequency display glow
            draw.rectangle([(1525, 485), (1615, 505)], fill=(60, 180, 130, 200))
            
        # Industrial overhead light fixture (MainLight at 1060, 430)
        draw.line([(1060, 0), (1060, 360)], fill=(35, 40, 45, 255), width=4)
        draw.polygon([(980, 400), (1140, 400), (1100, 360), (1020, 360)], fill=(50, 58, 62, 255))
        bulb_color = (100, 92, 80, 255) if not powered else (255, 240, 180, 255)
        draw.ellipse([(1035, 395), (1085, 435)], fill=bulb_color)
        
        canvas = add_dither_noise(canvas, 4)
        fname = "boathouse_production_bg.png" if not powered else "boathouse_production_powered_bg.png"
        canvas.save(os.path.join(out_dir, fname), optimize=True)
        if not powered:
            canvas.save("assets/images/backgrounds/boathouse_production_bg.png", optimize=True)
            
    print("  -> Boathouse backgrounds (dim & powered) successfully generated.")

# ==============================================================================
# 5. DEVIL'S REEF (Magic Cliffs — Dominant, Warped Ocean View — Support)
# ==============================================================================
def adapt_reef():
    print("[5/5] Compositing Devil's Reef (Magic Cliffs dominant + Warped Ocean View support)...")
    out_dir = os.path.join(OUTPUT_BASE, "reef")
    os.makedirs(out_dir, exist_ok=True)
    canvas = make_canvas(1920, 1080, (8, 14, 18, 255))
    
    cliffs_dir = os.path.join(RAW_DIR, "ansimuz_magic_cliffs/Magic-Cliffs-Environment/PNG")
    ocean_dir = os.path.join(RAW_DIR, "ansimuz_ocean_view/Ocean View Files/Layers/Night")
    
    # Warped Ocean / Magic Cliffs stormy sky & storm clouds
    sky = Image.open(os.path.join(cliffs_dir, "sky.png")).convert("RGBA")
    sky = grade_image(sky, shadow_mult=(0.3, 0.45, 0.65), mid_tint=(0.45, 0.6, 0.75), contrast=1.25, sat=0.6)
    sky = sky.resize((1920, 650), Image.NEAREST)
    canvas.paste(sky, (0, 0), sky)
    
    clouds = Image.open(os.path.join(cliffs_dir, "clouds.png")).convert("RGBA")
    clouds = grade_image(clouds, shadow_mult=(0.35, 0.5, 0.65), mid_tint=(0.55, 0.65, 0.75), contrast=1.2, sat=0.55)
    clouds = clouds.resize((1920, 380), Image.NEAREST)
    canvas.paste(clouds, (0, 180), clouds)
    
    ocean_clouds = Image.open(os.path.join(ocean_dir, "Clouds.png")).convert("RGBA")
    ocean_clouds = grade_image(ocean_clouds, shadow_mult=(0.3, 0.4, 0.55), mid_tint=(0.45, 0.55, 0.65), contrast=1.2, sat=0.55)
    ocean_clouds = ocean_clouds.resize((1920, 420), Image.NEAREST)
    canvas.paste(ocean_clouds, (0, 260), ocean_clouds)
    
    # Sea plane
    sea = Image.open(os.path.join(cliffs_dir, "sea.png")).convert("RGBA")
    sea = grade_image(sea, shadow_mult=(0.2, 0.35, 0.5), mid_tint=(0.35, 0.55, 0.65), highlight_mult=(0.4, 0.8, 0.7), contrast=1.3, sat=0.7)
    sea = sea.resize((1920, 480), Image.NEAREST)
    canvas.paste(sea, (0, 480), sea)
    
    # Magic Cliffs: Distant volcanic sea stacks (far-grounds.png)
    far_cliffs = Image.open(os.path.join(cliffs_dir, "far-grounds.png")).convert("RGBA")
    far_cliffs = grade_image(far_cliffs, shadow_mult=(0.25, 0.35, 0.45), mid_tint=(0.35, 0.45, 0.55), contrast=1.25, sat=0.5)
    far_cliffs = far_cliffs.resize((1920, 480), Image.NEAREST)
    canvas.paste(far_cliffs, (0, 360), far_cliffs)
    
    # Magic Cliffs Tileset: Construct the foreground cyclopean basalt reef platform
    cliffs_tiles = Image.open(os.path.join(cliffs_dir, "tileset.png")).convert("RGBA")
    cliffs_tiles = grade_image(cliffs_tiles, shadow_mult=(0.32, 0.40, 0.48), mid_tint=(0.45, 0.55, 0.62), highlight_mult=(0.50, 0.75, 0.68), contrast=1.3, sat=0.65)
    
    rock_body = cliffs_tiles.crop((432, 64, 480, 112)).resize((96, 96), Image.NEAREST)
    rock_pillar = cliffs_tiles.crop((464, 48, 528, 144)).resize((192, 288), Image.NEAREST)
    rock_cap = cliffs_tiles.crop((600, 60, 650, 100)).resize((128, 102), Image.NEAREST)
    
    # Bedrock platform base (Y = 680 to 1080)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle([(0, 680), (1920, 1080)], fill=(14, 20, 24, 255))
    
    for ry in range(700, 1080, 96):
        for rx in range(0, 1920, 96):
            canvas.paste(rock_body, (rx, ry))
            
    # Surface cap along top reef rim (Y = 660)
    for rx in range(0, 1920, 120):
        canvas.paste(rock_cap, (rx, 650), rock_cap)
        
    # Flanking jagged cyclopean basalt spires
    canvas.paste(rock_pillar, (-20, 420), rock_pillar)
    pillar_right = ImageOps.mirror(rock_pillar)
    canvas.paste(pillar_right, (1740, 390), pillar_right)
    
    # Submerged non-human geometric monoliths in the background
    # Ancient basalt obelisks jutting from deep sea
    draw.polygon([(780, 460), (840, 320), (880, 460)], fill=(16, 22, 26, 255), outline=(28, 38, 42, 255), width=4)
    draw.polygon([(1020, 480), (1070, 360), (1110, 480)], fill=(14, 20, 24, 255), outline=(25, 34, 38, 255), width=4)
    
    # Sickly bioluminescent sea foam and phosphorescence surging around reef base
    for y in range(860, 1080, 6):
        alpha = int(60 * math.sin((y - 860) / 220.0 * math.pi))
        draw.line([(0, y), (1920, y)], fill=(28, 95, 75, alpha))
        
    canvas = add_dither_noise(canvas, 4)
    canvas.save(os.path.join(out_dir, "reef_production_bg.png"), optimize=True)
    canvas.save("assets/images/backgrounds/reef_production_bg.png", optimize=True)
    print("  -> Devil's Reef background successfully generated.")

def run_all():
    print("=" * 70)
    print("HORRORPLAY STAGE ART ADAPTATION PIPELINE")
    print("=" * 70)
    adapt_streets()
    adapt_tavern()
    adapt_docks()
    adapt_boathouse()
    adapt_reef()
    print("=" * 70)
    print("ALL PRODUCTION STAGE ENVIRONMENTS SUCCESSFULLY ADAPTED!")
    print("=" * 70)

if __name__ == "__main__":
    run_all()
