extends "res://src/rooms/room_01_office/office_pixel_backdrop.gd"

var bg_texture: Texture2D

func _ready() -> void:
	bg_texture = load("res://assets/images/backgrounds/office_benchmark_production.png")
	queue_redraw()

func _draw() -> void:
	if bg_texture:
		draw_texture(bg_texture, Vector2.ZERO)
	else:
		super._draw()
