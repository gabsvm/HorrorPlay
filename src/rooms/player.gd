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
var movement_tween: Tween = null

func _ready() -> void:
	add_to_group("Player")
	current_target = global_position
	_load_default_animation_frames()
	
	# Autohide debug tag above the player's head
	var debug_label = get_node_or_null("DetectiveLabel")
	if debug_label:
		debug_label.queue_free()

func _load_default_animation_frames() -> void:
	# Several room scenes reference the inspector animation resources but currently
	# leave the exported arrays empty. Recover the shared animation set here so a
	# room can never silently regress to the static SVG fallback again.
	if idle_textures.is_empty():
		for path in [
			"res://assets/images/characters/inspector/idle/hat-man-idle-1.png",
			"res://assets/images/characters/inspector/idle/hat-man-idle-2.png",
			"res://assets/images/characters/inspector/idle/hat-man-idle-3.png",
			"res://assets/images/characters/inspector/idle/hat-man-idle-4.png"
		]:
			var texture = load(path) as Texture2D
			if texture:
				idle_textures.append(texture)
	
	if walk_textures.is_empty():
		for path in [
			"res://assets/images/characters/inspector/walk/hat-man-walk-1.png",
			"res://assets/images/characters/inspector/walk/hat-man-walk-2.png",
			"res://assets/images/characters/inspector/walk/hat-man-walk-3.png",
			"res://assets/images/characters/inspector/walk/hat-man-walk-4.png",
			"res://assets/images/characters/inspector/walk/hat-man-walk-5.png",
			"res://assets/images/characters/inspector/walk/hat-man-walk-6.png"
		]:
			var texture = load(path) as Texture2D
			if texture:
				walk_textures.append(texture)

func _process(delta: float) -> void:
	var was_moving = is_moving
	is_moving = global_position.distance_to(current_target) > 5.0
	if was_moving != is_moving:
		anim_time = 0.0
	
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
		# Last-resort fallback if the animation files are genuinely unavailable.
		if sprite:
			if sprite.texture == null:
				sprite.texture = load("res://assets/images/characters/inspector.svg")
			sprite.position = Vector2(0, 30)
			sprite.rotation = 0.0
			sprite.scale = Vector2(1.0, 1.0)

func walk_to(target_position: Vector2) -> void:
	current_target = target_position
	
	# Abort a previous floor-click movement before starting the next one. This
	# avoids multiple tweens fighting over global_position when the player taps
	# quickly on PC or mobile.
	if movement_tween and movement_tween.is_valid():
		movement_tween.kill()
	
	var distance = global_position.distance_to(target_position)
	var duration = distance / speed
	if duration <= 0.05:
		global_position = target_position
		return
	
	if target_position.x < global_position.x:
		if sprite:
			sprite.flip_h = true
	else:
		if sprite:
			sprite.flip_h = false
	
	movement_tween = create_tween()
	movement_tween.tween_property(self, "global_position", target_position, duration).set_trans(Tween.TRANS_LINEAR)
	await movement_tween.finished
	movement_tween = null
