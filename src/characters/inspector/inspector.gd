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
@export var base_scale: float = 1.0

@onready var visual_root: Node2D = $VisualRoot
@onready var contact_shadow: Sprite2D = $VisualRoot/ContactShadow
@onready var animated_sprite: AnimatedSprite2D = $VisualRoot/AnimatedSprite2D
@onready var personal_light: PointLight2D = $PersonalLight
@onready var interaction_anchor: Marker2D = $InteractionAnchor
@onready var lantern: PointLight2D = personal_light

var current_state: State = State.IDLE
var target_position: Vector2 = Vector2.ZERO
var facing_direction: int = 1 # 1 = right, -1 = left
var is_moving: bool = false
var current_surface: String = "wood"
var light_time: float = 0.0
var target_light_energy: float = 0.52
var last_footstep_frame: int = -1
var depth_scale_factor: float = 1.0

func _ready() -> void:
	add_to_group("Player")
	target_position = global_position
	if animated_sprite:
		animated_sprite.frame_changed.connect(_on_sprite_frame_changed)
		animated_sprite.animation_finished.connect(_on_sprite_animation_finished)
	
	if not Sanity.sanity_changed.is_connected(_on_sanity_changed):
		Sanity.sanity_changed.connect(_on_sanity_changed)
	
	_play_appropriate_idle()
	var debug_label = get_node_or_null("DetectiveLabel")
	if debug_label:
		debug_label.queue_free()

func _exit_tree() -> void:
	if Sanity.sanity_changed.is_connected(_on_sanity_changed):
		Sanity.sanity_changed.disconnect(_on_sanity_changed)

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
		_play_appropriate_idle()

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
	if animated_sprite and animated_sprite.animation != &"walk":
		animated_sprite.play(&"walk")

func _process_turning(_delta: float) -> void:
	velocity = velocity.move_toward(Vector2.ZERO, deceleration * _delta)
	move_and_slide()

func _play_appropriate_idle() -> void:
	if not animated_sprite or current_state != State.IDLE:
		return
	var is_uneasy = Sanity.current_sanity <= 55
	var target_anim = &"idle_uneasy" if is_uneasy else &"idle"
	if animated_sprite.animation != target_anim:
		animated_sprite.play(target_anim)

func _on_sanity_changed(_new_val: int) -> void:
	if current_state == State.IDLE:
		_play_appropriate_idle()

func _on_sprite_frame_changed() -> void:
	if not animated_sprite:
		return
	if animated_sprite.animation == &"walk":
		var frame = animated_sprite.frame
		if frame != last_footstep_frame and (frame == 1 or frame == 5):
			last_footstep_frame = frame
			if velocity.length() > 30.0:
				_play_footstep()

func _play_footstep() -> void:
	var surface = current_surface
	if SceneRouter.current_room is Room:
		surface = SceneRouter.current_room.footstep_surface
	AudioBus.play_footstep(surface, 0.72)

func _on_sprite_animation_finished() -> void:
	if current_state == State.INTERACTING or current_state == State.REACTING or current_state == State.TURNING:
		_transition_to(State.IDLE)
		interaction_finished.emit()

func _update_light(delta: float) -> void:
	if personal_light and personal_light.visible:
		light_time += delta
		var noise = sin(light_time * 0.8) * cos(light_time * 0.43) + sin(light_time * 1.5) * cos(light_time * 0.9)
		personal_light.energy = lerp(target_light_energy * 0.85, target_light_energy * 1.15, (noise + 2.0) / 4.0)

func configure_light(enabled: bool, energy: float = 0.52, color: Color = Color(0.96, 0.84, 0.65, 1.0), light_scale: float = 1.35) -> void:
	if personal_light:
		personal_light.visible = enabled
		target_light_energy = energy
		personal_light.energy = energy
		personal_light.color = color
		personal_light.scale = Vector2(light_scale, light_scale)

func set_depth_scale(scale_val: float) -> void:
	depth_scale_factor = scale_val
	_apply_visual_transform()

func _set_facing(new_facing: int) -> void:
	facing_direction = new_facing
	_apply_visual_transform()

func _apply_visual_transform() -> void:
	if visual_root:
		visual_root.scale = Vector2(float(facing_direction) * depth_scale_factor * base_scale, depth_scale_factor * base_scale)

func face_position(world_pos: Vector2) -> void:
	var dir = 1 if world_pos.x >= global_position.x else -1
	_set_facing(dir)

func _transition_to(new_state: State) -> void:
	if current_state == new_state:
		return
	var old_state = current_state
	current_state = new_state
	last_footstep_frame = -1
	state_changed.emit(old_state, new_state)
	
	if new_state == State.IDLE:
		_play_appropriate_idle()

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

func play_interaction_animation(anim_name: StringName) -> void:
	if not animated_sprite or not animated_sprite.sprite_frames.has_animation(anim_name):
		return
	_transition_to(State.INTERACTING)
	animated_sprite.play(anim_name)
	await interaction_finished

func play_reaction() -> void:
	if not animated_sprite or not animated_sprite.sprite_frames.has_animation(&"react"):
		return
	_transition_to(State.REACTING)
	animated_sprite.play(&"react")
	await interaction_finished

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
