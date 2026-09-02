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
signal facing_finished(direction: int)

@export_group("Locomotion")
@export var max_speed: float = 275.0
@export var acceleration: float = 1350.0
@export var deceleration: float = 2100.0
@export var arrival_radius: float = 6.0
@export var walk_speed_scale_min: float = 0.85
@export var walk_speed_scale_max: float = 1.15
@export var walk_bob_amount: float = 0.0
@export var walk_sway_amount: float = 0.0

@export_group("Visuals")
@export var base_scale: float = 1.0
@export var lantern_anchor: Vector2 = Vector2(-36.0, -95.0)

@onready var visual_root: Node2D = $VisualRoot
@onready var contact_shadow: Sprite2D = $VisualRoot/ContactShadow
@onready var animated_sprite: AnimatedSprite2D = $VisualRoot/AnimatedSprite2D
@onready var lantern_prop: Node2D = $VisualRoot/LanternProp
@onready var personal_light: PointLight2D = $PersonalLight
@onready var interaction_anchor: Marker2D = $InteractionAnchor
@onready var lantern: PointLight2D = personal_light

var current_state: State = State.IDLE
var target_position: Vector2 = Vector2.ZERO
var facing_direction: int = 1
var is_moving: bool = false
var current_surface: String = "wood"
var light_time: float = 0.0
var target_light_energy: float = 0.52
var last_footstep_frame: int = -1
var depth_scale_factor: float = 1.0

var _pending_facing: int = 1
var _resume_state_after_turn: State = State.IDLE
var _turn_flip_applied: bool = false
var _sprite_base_position: Vector2 = Vector2.ZERO
var _lantern_base_position: Vector2 = Vector2.ZERO

func _ready() -> void:
	add_to_group("Player")
	target_position = global_position
	if animated_sprite:
		_sprite_base_position = animated_sprite.position
		animated_sprite.frame_changed.connect(_on_sprite_frame_changed)
		animated_sprite.animation_finished.connect(_on_sprite_animation_finished)
	if lantern_prop:
		_lantern_base_position = lantern_prop.position
		lantern_prop.visible = false
	if personal_light:
		personal_light.visible = false

	if not Sanity.sanity_changed.is_connected(_on_sanity_changed):
		Sanity.sanity_changed.connect(_on_sanity_changed)

	_apply_visual_transform()
	_reset_pose_offsets()
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

func _process_idle(delta: float) -> void:
	if velocity.length() > 0.0:
		velocity = velocity.move_toward(Vector2.ZERO, deceleration * delta)
		move_and_slide()

	if global_position.distance_to(target_position) > arrival_radius:
		_transition_to(State.WALKING)
	else:
		_reset_pose_offsets()
		_play_appropriate_idle()

func _process_walking(delta: float) -> void:
	var to_target: Vector2 = target_position - global_position
	var dist: float = to_target.length()

	if dist <= arrival_radius:
		velocity = Vector2.ZERO
		global_position = target_position
		is_moving = false
		_reset_animation_speed()
		_reset_pose_offsets()
		_transition_to(State.IDLE)
		movement_finished.emit(global_position)
		return

	var desired_direction: Vector2 = to_target.normalized()
	var desired_facing: int = facing_direction
	if desired_direction.x < -0.05:
		desired_facing = -1
	elif desired_direction.x > 0.05:
		desired_facing = 1

	if desired_facing != facing_direction:
		_begin_turn(desired_facing, State.WALKING)
		return

	var braking_distance: float = maxf(26.0, velocity.length() * velocity.length() / maxf(1.0, 2.0 * deceleration))
	var desired_speed: float = max_speed
	if dist < braking_distance:
		desired_speed = max_speed * clampf(dist / braking_distance, 0.28, 1.0)

	var target_velocity: Vector2 = desired_direction * desired_speed
	var rate: float = acceleration if target_velocity.length() > velocity.length() else deceleration
	velocity = velocity.move_toward(target_velocity, rate * delta)
	move_and_slide()

	is_moving = velocity.length() > 15.0
	if animated_sprite:
		if animated_sprite.animation != &"walk":
			animated_sprite.play(&"walk")
		var speed_ratio: float = clampf(velocity.length() / maxf(1.0, max_speed), 0.0, 1.0)
		animated_sprite.speed_scale = lerpf(walk_speed_scale_min, walk_speed_scale_max, speed_ratio)
		_apply_walk_motion(speed_ratio)

func _process_turning(delta: float) -> void:
	velocity = velocity.move_toward(Vector2.ZERO, deceleration * delta)
	move_and_slide()
	_reset_pose_offsets()

func _apply_walk_motion(_speed_ratio: float) -> void:
	# Weight and footstep timing are transmitted directly via the authored frames.
	# Leaving the sprite firmly anchored at _sprite_base_position keeps the soles
	# flush with the floor and ContactShadow at all times without artificial jitter.
	pass

func _reset_pose_offsets() -> void:
	if animated_sprite:
		animated_sprite.position = _sprite_base_position
	if lantern_prop:
		lantern_prop.position = _lantern_base_position

func _play_appropriate_idle() -> void:
	if not animated_sprite or current_state != State.IDLE:
		return
	_reset_animation_speed()
	_reset_pose_offsets()
	var is_uneasy: bool = Sanity.current_sanity <= 55
	var target_anim: StringName = &"idle_uneasy" if is_uneasy else &"idle"
	if animated_sprite.animation != target_anim:
		animated_sprite.play(target_anim)

func _on_sanity_changed(_new_val: int) -> void:
	if current_state == State.IDLE:
		_play_appropriate_idle()

func _on_sprite_frame_changed() -> void:
	if not animated_sprite:
		return

	if current_state == State.TURNING and animated_sprite.animation == &"turn":
		if not _turn_flip_applied and animated_sprite.frame >= 2:
			_apply_facing_immediate(_pending_facing)
			_turn_flip_applied = true
		return

	if animated_sprite.animation == &"walk":
		var frame: int = animated_sprite.frame
		if frame != last_footstep_frame and (frame == 1 or frame == 5):
			last_footstep_frame = frame
			if velocity.length() > 45.0:
				_play_footstep()

func _play_footstep() -> void:
	var surface: String = current_surface
	if SceneRouter.current_room is Room:
		surface = SceneRouter.current_room.footstep_surface
	var speed_ratio: float = clampf(velocity.length() / maxf(1.0, max_speed), 0.0, 1.0)
	AudioBus.play_footstep(surface, lerpf(0.48, 0.72, speed_ratio))

func _on_sprite_animation_finished() -> void:
	if current_state == State.TURNING:
		if not _turn_flip_applied:
			_apply_facing_immediate(_pending_facing)
			_turn_flip_applied = true
		var resume_state: State = _resume_state_after_turn
		_transition_to(resume_state)
		facing_finished.emit(facing_direction)
		return

	if current_state == State.INTERACTING or current_state == State.REACTING:
		_transition_to(State.IDLE)
		interaction_finished.emit()

func _update_light(delta: float) -> void:
	if personal_light and personal_light.visible:
		light_time += delta
		var noise: float = sin(light_time * 0.8) * cos(light_time * 0.43) + sin(light_time * 1.5) * cos(light_time * 0.9)
		personal_light.energy = lerpf(target_light_energy * 0.85, target_light_energy * 1.15, (noise + 2.0) / 4.0)

func configure_light(enabled: bool, energy: float = 0.52, color: Color = Color(0.96, 0.84, 0.65, 1.0), light_scale: float = 1.35) -> void:
	if personal_light:
		personal_light.visible = enabled
		target_light_energy = energy
		personal_light.energy = energy
		personal_light.color = color
		personal_light.scale = Vector2(light_scale, light_scale)
	if lantern_prop:
		lantern_prop.visible = enabled

func set_depth_scale(scale_val: float) -> void:
	depth_scale_factor = scale_val
	_apply_visual_transform()

func _apply_facing_immediate(new_facing: int) -> void:
	facing_direction = -1 if new_facing < 0 else 1
	_apply_visual_transform()

func _apply_visual_transform() -> void:
	var visual_scale: float = depth_scale_factor * base_scale
	if visual_root:
		visual_root.scale = Vector2(float(facing_direction) * visual_scale, visual_scale)
	if personal_light:
		personal_light.position = Vector2(
			lantern_anchor.x * float(facing_direction) * visual_scale,
			lantern_anchor.y * visual_scale
		)

func _begin_turn(new_facing: int, resume_state: State = State.IDLE) -> void:
	var normalized_facing: int = -1 if new_facing < 0 else 1
	if normalized_facing == facing_direction:
		return

	_pending_facing = normalized_facing
	_resume_state_after_turn = resume_state
	_turn_flip_applied = false
	velocity = Vector2.ZERO
	is_moving = false
	_reset_pose_offsets()
	_transition_to(State.TURNING)
	_reset_animation_speed()

	if animated_sprite and animated_sprite.sprite_frames.has_animation(&"turn"):
		animated_sprite.play(&"turn")
	else:
		_apply_facing_immediate(_pending_facing)
		_turn_flip_applied = true
		_transition_to(_resume_state_after_turn)
		facing_finished.emit(facing_direction)

func face_direction(direction: int) -> void:
	var normalized_facing: int = -1 if direction < 0 else 1
	if normalized_facing == facing_direction:
		return
	if current_state == State.INTERACTING or current_state == State.REACTING or current_state == State.LOCKED:
		return
	_begin_turn(normalized_facing, State.IDLE)
	await facing_finished

func face_position(world_pos: Vector2) -> void:
	var dir: int = 1 if world_pos.x >= global_position.x else -1
	await face_direction(dir)

func _transition_to(new_state: State) -> void:
	if current_state == new_state:
		return
	var old_state: State = current_state
	current_state = new_state
	last_footstep_frame = -1
	state_changed.emit(old_state, new_state)

	if new_state == State.IDLE:
		_play_appropriate_idle()

func set_target_position(new_target: Vector2) -> void:
	target_position = new_target
	if global_position.distance_to(target_position) > arrival_radius:
		if current_state == State.IDLE:
			_transition_to(State.WALKING)
			movement_started.emit(target_position)
		elif current_state == State.WALKING:
			movement_started.emit(target_position)

func walk_to(dest_position: Vector2) -> void:
	if current_state == State.LOCKED or current_state == State.INTERACTING or current_state == State.REACTING:
		return
	if global_position.distance_to(dest_position) <= arrival_radius:
		target_position = dest_position
		return
	set_target_position(dest_position)
	await movement_finished

func play_interaction_animation(anim_name: StringName) -> void:
	if anim_name == &"" or anim_name == &"none":
		return
	if not animated_sprite or not animated_sprite.sprite_frames.has_animation(anim_name):
		return
	_reset_pose_offsets()
	_reset_animation_speed()
	_transition_to(State.INTERACTING)
	animated_sprite.play(anim_name)
	await interaction_finished

func play_item_interaction(item: ItemData, fallback_animation: StringName = &"none") -> void:
	var animation_to_play: StringName = fallback_animation
	if item and item.world_use_animation != "":
		animation_to_play = StringName(item.world_use_animation)
	if animation_to_play == &"generic_reach":
		await play_generic_use_motion()
		return
	await play_interaction_animation(animation_to_play)

func play_generic_use_motion() -> void:
	if not visual_root:
		return
	_reset_animation_speed()
	_transition_to(State.INTERACTING)
	if animated_sprite:
		animated_sprite.play(&"idle")
	var start_position: Vector2 = visual_root.position
	var reach_offset: Vector2 = Vector2(10.0 * float(facing_direction), -2.0)
	var tween: Tween = create_tween()
	tween.tween_property(visual_root, "position", start_position + reach_offset, 0.16).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.tween_interval(0.16)
	tween.tween_property(visual_root, "position", start_position, 0.22).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	await tween.finished
	if visual_root:
		visual_root.position = start_position
	_transition_to(State.IDLE)
	interaction_finished.emit()

func play_reaction() -> void:
	if not animated_sprite or not animated_sprite.sprite_frames.has_animation(&"react"):
		return
	_reset_pose_offsets()
	_reset_animation_speed()
	_transition_to(State.REACTING)
	animated_sprite.play(&"react")
	await interaction_finished

func enter_hide() -> void:
	if animated_sprite and animated_sprite.sprite_frames.has_animation(&"hide_enter"):
		await play_interaction_animation(&"hide_enter")
	_transition_to(State.LOCKED)
	if animated_sprite and animated_sprite.sprite_frames.has_animation(&"hide_hold"):
		animated_sprite.play(&"hide_hold")

func exit_hide() -> void:
	if current_state != State.LOCKED:
		return
	_transition_to(State.INTERACTING)
	if animated_sprite and animated_sprite.sprite_frames.has_animation(&"hide_exit"):
		animated_sprite.play(&"hide_exit")
		await interaction_finished
	else:
		_transition_to(State.IDLE)

func stop_movement() -> void:
	target_position = global_position
	velocity = Vector2.ZERO
	is_moving = false
	_reset_animation_speed()
	_reset_pose_offsets()
	if current_state == State.WALKING or current_state == State.TURNING:
		_transition_to(State.IDLE)
		movement_finished.emit(global_position)

func lock_actor(locked: bool) -> void:
	if locked:
		stop_movement()
		_transition_to(State.LOCKED)
	else:
		if current_state == State.LOCKED:
			_transition_to(State.IDLE)

func _reset_animation_speed() -> void:
	if animated_sprite:
		animated_sprite.speed_scale = 1.0