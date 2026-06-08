# res://src/rooms/player.gd
class_name Player
extends CharacterBody2D

@export var speed: float = 400.0

@export var idle_textures: Array[Texture2D] = []
@export var walk_textures: Array[Texture2D] = []
@export var frame_rate: float = 8.0

@onready var sprite: Sprite2D = $Sprite2D

var anim_time: float = 0.0
var is_moving: bool = false
var current_target: Vector2 = Vector2.ZERO

func _ready() -> void:
	add_to_group("Player")
	current_target = global_position

func _process(delta: float) -> void:
	# Check if moving
	is_moving = global_position.distance_to(current_target) > 5.0
	
	anim_time += delta * frame_rate
	var textures = walk_textures if is_moving else idle_textures
	
	if textures.size() > 0:
		var frame = int(anim_time) % textures.size()
		if sprite:
			sprite.texture = textures[frame]

func walk_to(target_position: Vector2) -> void:
	current_target = target_position
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
	else:
		if sprite:
			sprite.flip_h = false
		
	tween.tween_property(self, "global_position", target_position, duration).set_trans(Tween.TRANS_LINEAR)
	await tween.finished
