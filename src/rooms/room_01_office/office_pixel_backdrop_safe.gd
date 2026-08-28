extends "res://src/rooms/room_01_office/office_pixel_backdrop.gd"

# Override only the window pass. The base backdrop previously created a local
# StyleBox inside _draw(); Godot's CanvasItem docs warn that local drawing
# resources can be freed before the deferred draw command executes.
func _draw_window() -> void:
	var p := Vector2(26, 26)
	var size := Vector2(122, 180)
	# Heavy stepped frame drawn entirely with immediate CanvasItem primitives.
	draw_rect(Rect2(p, size), Color("#020304"))
	draw_rect(Rect2(p + Vector2(4, 4), size - Vector2(8, 8)), Color("#06090c"))
	draw_rect(Rect2(p + Vector2(9, 9), size - Vector2(18, 18)), Color("#173442"))
	# Block the upper corners to suggest the old arched masonry opening while
	# staying on the 640x360 pixel grid.
	draw_rect(Rect2(26, 26, 18, 12), Color("#11171d"))
	draw_rect(Rect2(130, 26, 18, 12), Color("#11171d"))
	draw_rect(Rect2(30, 30, 10, 8), Color("#06090c"))
	draw_rect(Rect2(134, 30, 10, 8), Color("#06090c"))

	# Ocean/night blocks.
	draw_rect(Rect2(35, 120, 104, 77), Color("#0c1921"))
	draw_colored_polygon(PackedVector2Array([
		Vector2(35, 146), Vector2(61, 136), Vector2(77, 142), Vector2(92, 126),
		Vector2(111, 140), Vector2(139, 131), Vector2(139, 197), Vector2(35, 197)
	]), Color("#081116"))

	# Moon + cold halo.
	draw_circle(Vector2(104, 60), 11, Color(0.70, 0.84, 0.88, 0.22))
	draw_circle(Vector2(104, 60), 7, Color("#afd1dc"))

	# Mullions and deep sill.
	draw_rect(Rect2(85, 35, 5, 164), Color("#091219"))
	draw_rect(Rect2(35, 121, 104, 5), Color("#091219"))
	draw_rect(Rect2(22, 201, 132, 10), Color("#070a0d"))
	draw_line(Vector2(25, 202), Vector2(151, 202), Color(0.20,0.27,0.30,0.55), 1.0)

	# Static rain traces; the animated rain layer adds the changing streaks.
	var streaks := [
		Vector4(42,42,40,55), Vector4(55,34,53,49), Vector4(71,53,68,69),
		Vector4(102,37,100,52), Vector4(126,47,123,63), Vector4(47,83,44,100),
		Vector4(65,90,62,111), Vector4(112,79,109,98), Vector4(132,91,129,111),
		Vector4(48,133,45,150), Vector4(74,145,70,170), Vector4(104,136,101,157),
		Vector4(126,143,122,166), Vector4(58,171,55,191), Vector4(116,169,113,192)
	]
	for s in streaks:
		draw_line(Vector2(s.x, s.y), Vector2(s.z, s.w), Color(0.55,0.78,0.85,0.55), 1.0)
