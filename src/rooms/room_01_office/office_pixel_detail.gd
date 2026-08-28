extends Node2D

# Static secondary pixel-art pass for the Office benchmark. Drawn at the same
# 640x360 logical resolution as office_pixel_backdrop.gd and scaled x3 by the
# room scene. No per-frame redraws: this is intentionally cheap on mobile.

func _ready() -> void:
	queue_redraw()

func _draw() -> void:
	_draw_radiator()
	_draw_typewriter()
	_draw_rotary_phone()
	_draw_wall_conduit()
	_draw_coat_hooks()
	_draw_archive_labels()
	_draw_floor_clutter()
	_draw_window_beam()

func _draw_radiator() -> void:
	var origin := Vector2(33, 190)
	draw_rect(Rect2(origin, Vector2(88, 34)), Color("#0a0f12"))
	for i in range(8):
		var x := origin.x + 4 + i * 10
		draw_rect(Rect2(x, origin.y + 4, 7, 25), Color("#2a3438"))
		draw_line(Vector2(x + 1, origin.y + 6), Vector2(x + 1, origin.y + 27), Color(0.42, 0.52, 0.56, 0.22), 1.0)
	draw_line(Vector2(118, 216), Vector2(132, 216), Color("#1b2529"), 4.0)
	draw_line(Vector2(132, 216), Vector2(132, 226), Color("#1b2529"), 4.0)

func _draw_typewriter() -> void:
	var p := Vector2(188, 193)
	# paper
	draw_rect(Rect2(p + Vector2(12, -19), Vector2(29, 23)), Color("#c6b993"))
	for y in [p.y - 14, p.y - 10, p.y - 6]:
		draw_line(Vector2(p.x + 15, y), Vector2(p.x + 37, y), Color("#5e5749"), 1.0)
	# carriage and body
	draw_rect(Rect2(p + Vector2(4, 1), Vector2(45, 6)), Color("#313b3f"))
	draw_colored_polygon(PackedVector2Array([
		p + Vector2(2, 7), p + Vector2(51, 7), p + Vector2(47, 27), p + Vector2(6, 27)
	]), Color("#12191d"))
	draw_line(p + Vector2(6, 25), p + Vector2(47, 25), Color("#6e756f"), 1.0)
	for row in range(2):
		for col in range(7):
			draw_rect(Rect2(p.x + 9 + col * 5, p.y + 12 + row * 6, 3, 2), Color("#596166"))

func _draw_rotary_phone() -> void:
	var c := Vector2(257, 207)
	draw_circle(c, 10, Color("#11171a"))
	draw_circle(c, 6, Color("#263035"))
	for angle in range(0, 360, 60):
		var r := deg_to_rad(float(angle))
		draw_circle(c + Vector2(cos(r), sin(r)) * 4.0, 1.0, Color("#8b7a5e"))
	draw_arc(c + Vector2(0, -6), 11, PI, TAU, 12, Color("#20292d"), 4.0)

func _draw_wall_conduit() -> void:
	draw_line(Vector2(483, 25), Vector2(483, 74), Color("#0b1114"), 5.0)
	draw_line(Vector2(483, 74), Vector2(506, 74), Color("#0b1114"), 5.0)
	draw_line(Vector2(506, 74), Vector2(506, 118), Color("#0b1114"), 5.0)
	draw_line(Vector2(483, 25), Vector2(483, 74), Color(0.40, 0.48, 0.51, 0.30), 1.0)
	for p in [Vector2(483, 39), Vector2(483, 63), Vector2(506, 91)]:
		draw_circle(p, 2.0, Color("#29353a"))

func _draw_coat_hooks() -> void:
	for x in [525.0, 538.0]:
		draw_line(Vector2(x, 114), Vector2(x, 130), Color("#151d21"), 3.0)
		draw_line(Vector2(x, 116), Vector2(x - 5, 111), Color("#151d21"), 2.0)
	# hanging hat/coat silhouette, kept in midground so the actual near-camera
	# foreground can occlude it independently.
	draw_colored_polygon(PackedVector2Array([
		Vector2(531, 128), Vector2(543, 128), Vector2(552, 174), Vector2(524, 174)
	]), Color(0.045, 0.060, 0.066, 0.86))
	draw_rect(Rect2(527, 121, 20, 4), Color("#11191d"))
	draw_rect(Rect2(532, 116, 10, 6), Color("#11191d"))

func _draw_archive_labels() -> void:
	for i in range(3):
		var y := 181 + i * 28
		draw_rect(Rect2(474, y, 24, 7), Color(0.68, 0.58, 0.40, 0.72))
		draw_line(Vector2(478, y + 3), Vector2(494, y + 3), Color(0.23, 0.21, 0.17, 0.80), 1.0)
	# scraped lower-cabinet oxidation
	draw_line(Vector2(454, 249), Vector2(516, 249), Color(0.48, 0.31, 0.20, 0.36), 1.0)

func _draw_floor_clutter() -> void:
	# Case folders and a wet shoe print keep the floor from reading as empty
	# vector space.
	draw_colored_polygon(PackedVector2Array([
		Vector2(356, 298), Vector2(392, 294), Vector2(396, 316), Vector2(360, 319)
	]), Color("#625645"))
	for y in [302.0, 307.0, 312.0]:
		draw_line(Vector2(363, y), Vector2(388, y - 2), Color("#39352e"), 1.0)
	draw_colored_polygon(PackedVector2Array([
		Vector2(391, 315), Vector2(417, 313), Vector2(422, 329), Vector2(394, 331)
	]), Color("#433a31"))
	draw_ellipse(Vector2(517, 292), Vector2(7, 3), Color(0.02, 0.03, 0.035, 0.52))
	draw_ellipse(Vector2(541, 303), Vector2(6, 3), Color(0.02, 0.03, 0.035, 0.44))

func _draw_window_beam() -> void:
	# Pixel-stepped moonlight rather than a smooth vector cone.
	for i in range(8):
		var alpha := 0.020 + float(7 - i) * 0.006
		var left := 39.0 + float(i) * 5.0
		var right := 129.0 + float(i) * 8.0
		var bottom_y := 284.0 + float(i) * 4.0
		draw_colored_polygon(PackedVector2Array([
			Vector2(39, 70), Vector2(129, 70), Vector2(right, bottom_y), Vector2(left, bottom_y)
		]), Color(0.28, 0.50, 0.62, alpha))

# Godot's CanvasItem API has no draw_ellipse helper, so approximate the tiny
# floor marks with polygons while keeping the logical pixel grid intact.
func draw_ellipse(center: Vector2, radii: Vector2, color: Color) -> void:
	var points := PackedVector2Array()
	for i in range(12):
		var a := TAU * float(i) / 12.0
		points.append(center + Vector2(cos(a) * radii.x, sin(a) * radii.y))
	draw_colored_polygon(points, color)
