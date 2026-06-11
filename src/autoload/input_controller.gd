# res://src/autoload/input_controller.gd
extends Node

signal interaction_requested(action_type: String, global_pos: Vector2)

var is_input_blocked: bool = false
var long_press_duration: float = 0.65
var touch_timer: Timer

var last_touch_pos: Vector2 = Vector2.ZERO
var touch_start_pos: Vector2 = Vector2.ZERO
var drag_threshold: float = 25.0
var has_dragged: bool = false
var is_touching: bool = false

func _ready() -> void:
	touch_timer = Timer.new()
	touch_timer.one_shot = true
	touch_timer.wait_time = long_press_duration
	touch_timer.timeout.connect(_on_touch_timer_timeout)
	add_child(touch_timer)

func block_input(status: bool) -> void:
	is_input_blocked = status

func vibrate_device(duration_ms: int) -> void:
	if OS.get_name() in ["Android", "iOS"]:
		Input.vibrate_handheld(duration_ms)

func _unhandled_input(event: InputEvent) -> void:
	if is_input_blocked:
		return
		
	# PC Mouse Support
	if event is InputEventMouseButton and event.is_pressed():
		if event.button_index == MOUSE_BUTTON_LEFT:
			interaction_requested.emit("interact", event.global_position)
		elif event.button_index == MOUSE_BUTTON_RIGHT:
			interaction_requested.emit("examine", event.global_position)

	# Mobile Touch Support (Filter event.index == 0 for primary touch only)
	if event is InputEventScreenTouch and event.index == 0:
		if event.pressed:
			is_touching = true
			has_dragged = false
			touch_start_pos = event.position
			last_touch_pos = event.position
			touch_timer.start()
		else:
			if is_touching:
				is_touching = false
				if not touch_timer.is_stopped():
					touch_timer.stop()
				if not has_dragged:
					vibrate_device(30) # Sutil feedback háptico al tocar
					interaction_requested.emit("interact", event.position)
					
	elif event is InputEventScreenDrag and event.index == 0:
		if is_touching:
			last_touch_pos = event.position
			if event.position.distance_to(touch_start_pos) > drag_threshold:
				has_dragged = true
				if not touch_timer.is_stopped():
					touch_timer.stop()

func _on_touch_timer_timeout() -> void:
	if is_touching and not has_dragged:
		is_touching = false
		vibrate_device(60) # Vibración algo más marcada para el long-press (examinar)
		interaction_requested.emit("examine", last_touch_pos)
