extends Node2D

func _ready() -> void:
	queue_redraw()

func _draw() -> void:
	# Near-camera occlusion. These deliberately sit in front of the actor to
	# create parallax/depth without adding a 3D scene or expensive post effects.
	draw_colored_polygon(PackedVector2Array([
		Vector2(0,333), Vector2(151,330), Vector2(176,360), Vector2(0,360)
	]), Color(0.015,0.018,0.022,0.82))
	draw_colored_polygon(PackedVector2Array([
		Vector2(590,0), Vector2(640,0), Vector2(640,360), Vector2(617,360),
		Vector2(614,260), Vector2(602,185)
	]), Color(0.012,0.018,0.021,0.50))
	# Subtle bottom vignette kept pixel-sharp instead of screen-space blur.
	for i in range(6):
		var alpha := 0.035 + float(i) * 0.018
		draw_rect(Rect2(0, 354-i*2, 640, 2), Color(0,0,0,alpha))
