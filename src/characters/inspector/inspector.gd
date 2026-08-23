# res://src/characters/inspector/inspector.gd
class_name Player
extends CharacterBody2D

enum State {
	IDLE,
	WALKING,
	TURNING,
	INTERACTING,
	REACTING,
	LOCKED
}

signal state_changed(old_state: State, new_state: State)
signal movement_started(target: Vector2)
signal movement_finished(target: Vector2)
signal interaction_finished()

@export_group("Locomotion")
@export var max_speed: float = 315.0
@export var acceleration: float = 1500.0
@export var deceleration: float = 2000.0
@export var arrival_radius: float = 6.0

@export_group("Visuals")
@export var frame_rate: float = 8.0
@export var idle_textures: Array[Texture2D] = []
@export var walk_textures: Array[Texture2D] = []

@onready var visual_root: Node2D = $VisualRoot
@onready var sprite: Sprite2D = $VisualRoot/Sprite2D
@onready var personal_light: PointLight2D = $PersonalLight
@onready var interaction_anchor: Marker2D = $InteractionAnchor
@onready var lantern: PointLight2D = personal_light

var current_state: State = State.IDLE
var target_position: Vector2 = Vector2.ZERO
var facing_direction: int = 1 # 1 = right, -1 = left
var is_moving: bool = false
var anim_time: float = 0.0
var last_walk_frame: int = -1
var current_surface: String = "wood"
var light_time: float = 0.0

func _ready() -> void:
	add_to_group("Player")
	target_position = global_position
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

func _physics_process(delta: float) -> void:
	_update_light(delta)
	
	match current_state:
		State.IDLE:
			_process_idle(delta)
		State.WALKING:
			_process_walking(delta)
		State.TURNING:
			_process_turning(delta)
		State.INTERACTING, State.REACTING, State.LOCKED:
			velocity = velocity.move_toward(Vector2.ZERO, deceleration * delta)
			move_and_slide()

func _process_idle(_delta: float) -> void:
	if velocity.length() > 0.0:
		velocity = velocity.move_toward(Vector2.ZERO, deceleration * _delta)
		move_and_slide()
	
	if global_position.distance_to(target_position) > arrival_radius:
		_transition_to(State.WALKING)
	else:
		_update_sprite_animation(_delta, false)

func _process_walking(delta: float) -> void:
	var to_target = target_position - global_position
	var dist = to_target.length()
	
	if dist <= arrival_radius:
		velocity = Vector2.ZERO
		global_position = target_position
		is_moving = false
		_transition_to(State.IDLE)
		movement_finished.emit(global_position)
		return
	
	var desired_direction = to_target.normalized()
	var desired_facing = -1 if desired_direction.x < -0.05 else (1 if desired_direction.x > 0.05 else facing_direction)
	if desired_facing != facing_direction:
		_set_facing(desired_facing)
	
	var target_velocity = desired_direction * max_speed
	velocity = velocity.move_toward(target_velocity, acceleration * delta)
	move_and_slide()
	
	is_moving = velocity.length() > 15.0
	_update_sprite_animation(delta, is_moving)

func _process_turning(_delta: float) -> void:
	velocity = velocity.move_toward(Vector2.ZERO, deceleration * _delta)
	move_and_slide()

func _update_sprite_animation(delta: float, moving: bool) -> void:
	var current_textures = walk_textures if (moving and not walk_textures.is_empty()) else idle_textures
	if current_textures.is_empty():
		return
	
	var speed_ratio = (velocity.length() / max_speed) if moving else 1.0
	var effective_rate = frame_rate * clamp(speed_ratio, 0.6, 1.3) if moving else frame_rate
	anim_time += delta * effective_rate
	
	var frame = int(anim_time) % current_textures.size()
	if sprite:
		sprite.texture = current_textures[frame]
		sprite.position = Vector2(0, 30)
		sprite.rotation = 0.0
		sprite.scale = Vector2(4.0, 4.0)
	
	if moving and velocity.length() > 30.0:
		_handle_footstep_frame(frame)

func _handle_footstep_frame(frame: int) -> void:
	if frame == last_walk_frame:
		return
	last_walk_frame = frame
	# Play footstep on stride contact frames
	if frame == 1 or frame == 4:
		var surface = current_surface
		if SceneRouter.current_room is Room:
			surface = SceneRouter.current_room.footstep_surface
		AudioBus.play_footstep(surface, 0.72)

func _update_light(delta: float) -> void:
	if personal_light and personal_light.visible:
		light_time += delta
		var noise = sin(light_time * 0.8) * cos(light_time * 0.43) + sin(light_time * 1.5) * cos(light_time * 0.9)
		personal_light.energy = lerp(0.48, 0.74, (noise + 2.0) / 4.0)

func _set_facing(new_facing: int) -> void:
	facing_direction = new_facing
	if visual_root:
		visual_root.scale.x = float(facing_direction)
	elif sprite:
		sprite.flip_h = (facing_direction < 0)

func face_position(world_pos: Vector2) -> void:
	var dir = 1 if world_pos.x >= global_position.x else -1
	_set_facing(dir)

func _transition_to(new_state: State) -> void:
	if current_state == new_state:
		return
	var old_state = current_state
	current_state = new_state
	anim_time = 0.0
	last_walk_frame = -1
	state_changed.emit(old_state, new_state)

func set_target_position(new_target: Vector2) -> void:
	target_position = new_target
	if global_position.distance_to(target_position) > arrival_radius:
		if current_state != State.WALKING and current_state != State.LOCKED:
			_transition_to(State.WALKING)
			movement_started.emit(target_position)

func walk_to(dest_position: Vector2) -> void:
	if global_position.distance_to(dest_position) <= arrival_radius:
		target_position = dest_position
		return
	set_target_position(dest_position)
	await movement_finished

func stop_movement() -> void:
	target_position = global_position
	velocity = Vector2.ZERO
	is_moving = false
	if current_state == State.WALKING:
		_transition_to(State.IDLE)
		movement_finished.emit(global_position)

func lock_actor(locked: bool) -> void:
	if locked:
		stop_movement()
		_transition_to(State.LOCKED)
	else:
		if current_state == State.LOCKED:
			_transition_to(State.IDLE)
