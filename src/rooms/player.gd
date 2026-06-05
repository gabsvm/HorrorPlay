# res://src/rooms/player.gd
class_name Player
extends CharacterBody2D

@export var speed: float = 400.0

@onready var sprite: Sprite2D = get_node_or_null("Sprite2D")
@onready var rect_visual: ColorRect = get_node_or_null("VisualRepresentation")

func _ready() -> void:
	add_to_group("Player")

func walk_to(target_position: Vector2) -> void:
	# Calculate travel duration based on speed and distance
	var distance = global_position.distance_to(target_position)
	var duration = distance / speed
	
	if duration <= 0.05:
		return
		
	var tween = create_tween()
	# Face the direction of movement without mirroring the whole parent (preventing text mirroring)
	if target_position.x < global_position.x:
		if sprite:
			sprite.flip_h = true
		elif rect_visual:
			# Shift pivot slightly to center if scaling ColorRect
			rect_visual.pivot_offset = rect_visual.size / 2
			rect_visual.scale.x = -1
	else:
		if sprite:
			sprite.flip_h = false
		elif rect_visual:
			rect_visual.pivot_offset = rect_visual.size / 2
			rect_visual.scale.x = 1
		
	tween.tween_property(self, "global_position", target_position, duration).set_trans(Tween.TRANS_LINEAR)
	await tween.finished
