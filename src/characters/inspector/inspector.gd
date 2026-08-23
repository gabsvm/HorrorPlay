# res://src/characters/inspector/inspector.gd
class_name Player
extends CharacterBody2D

@export var speed: float = 315.0
@export var idle_textures: Array[Texture2D] = []
@export var walk_textures: Array[Texture2D] = []
@export var frame_rate: float = 8.0

@onready var visual_root: Node2D = get_node_or_null("VisualRoot")
@onready var sprite: Sprite2D = get_node_or_null("VisualRoot/Sprite2D") if visual_root else get_node_or_null("Sprite2D")
@onready var personal_light: PointLight2D = get_node_or_null("PersonalLight")
@onready var lantern: PointLight2D = personal_light if personal_light else get_node_or_null("LanternLight")
@onready var interaction_anchor: Marker2D = get_node_or_null("InteractionAnchor")

var anim_time: float = 0.0
var is_moving: bool = false
var current_target: Vector2 = Vector2.ZERO
var movement_tween: Tween = null
var last_walk_frame: int = -1

func _ready() -> void:
	add_to_group("Player")
	current_target = global_position
	_load_default_animation_frames()
	var debug_label = get_node_or_null("DetectiveLabel")
	if debug_label:
		debug_label.queue_free()

func _load_default_animation_frames() -> void:
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
		last_walk_frame = -1
	anim_time += delta * frame_rate
	var active_light = personal_light if personal_light else lantern
	if active_light and active_light.visible:
		var noise = sin(anim_time * 0.8) * cos(anim_time * 0.43) + sin(anim_time * 1.5) * cos(anim_time * 0.9)
		active_light.energy = lerp(0.48, 0.74, (noise + 2.0) / 4.0)
	var textures = walk_textures if is_moving else idle_textures
	if textures.size() > 0:
		var frame = int(anim_time) % textures.size()
		if sprite:
			sprite.texture = textures[frame]
			sprite.position = Vector2(0, 30)
			sprite.rotation = 0.0
			sprite.scale = Vector2(4.0, 4.0)
		if is_moving:
			_handle_footstep_frame(frame)
	else:
		if sprite:
			if sprite.texture == null:
				sprite.texture = load("res://assets/images/characters/inspector/idle/hat-man-idle-1.png")
			sprite.position = Vector2(0, 30)
			sprite.rotation = 0.0
			sprite.scale = Vector2(4.0, 4.0)

func _handle_footstep_frame(frame: int) -> void:
	if frame == last_walk_frame:
		return
	last_walk_frame = frame
	if frame != 1 and frame != 4:
		return
	var surface := "wood"
	if SceneRouter.current_room is Room:
		surface = SceneRouter.current_room.footstep_surface
	AudioBus.play_footstep(surface, 0.72)

func walk_to(target_position: Vector2) -> void:
	current_target = target_position
	if movement_tween and movement_tween.is_valid():
		movement_tween.kill()
	var distance = global_position.distance_to(target_position)
	var duration = distance / speed
	if duration <= 0.05:
		global_position = target_position
		return
	var target_flipped = target_position.x < global_position.x
	if visual_root:
		visual_root.scale.x = -1.0 if target_flipped else 1.0
	elif sprite:
		sprite.flip_h = target_flipped
	movement_tween = create_tween()
	movement_tween.tween_property(self, "global_position", target_position, duration).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	await movement_tween.finished
	movement_tween = null
