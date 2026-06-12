# res://src/rooms/player.gd
class_name Player
extends CharacterBody2D

@export var speed: float = 400.0

@export var idle_textures: Array[Texture2D] = []
@export var walk_textures: Array[Texture2D] = []
@export var frame_rate: float = 8.0

@onready var sprite: Sprite2D = $Sprite2D
@onready var lantern: PointLight2D = get_node_or_null("LanternLight")

var anim_time: float = 0.0
var is_moving: bool = false
var current_target: Vector2 = Vector2.ZERO

func _ready() -> void:
	add_to_group("Player")
	current_target = global_position
	
	# Autohide debug tag above the player's head
	var debug_label = get_node_or_null("DetectiveLabel")
	if debug_label:
		debug_label.queue_free()

func _process(delta: float) -> void:
	# Check if moving
	is_moving = global_position.distance_to(current_target) > 5.0
	
	anim_time += delta * frame_rate
	
	if lantern:
		var noise = sin(anim_time * 0.8) * cos(anim_time * 0.43) + sin(anim_time * 1.5) * cos(anim_time * 0.9)
		lantern.energy = lerp(0.55, 0.85, (noise + 2.0) / 4.0)
	var textures = walk_textures if is_moving else idle_textures
	
	if textures.size() > 0:
		var frame = int(anim_time) % textures.size()
		if sprite:
			sprite.texture = textures[frame]
			sprite.position = Vector2(0, 30)
			sprite.rotation = 0.0
			sprite.scale = Vector2(4.0, 4.0)
	else:
		# Fallback to inspector SVG if no textures provided
		if sprite:
			if sprite.texture == null:
				sprite.texture = load("res://assets/images/characters/inspector.svg")
			sprite.position = Vector2(0, 30)
			sprite.rotation = 0.0
			sprite.scale = Vector2(1.0, 1.0)

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
