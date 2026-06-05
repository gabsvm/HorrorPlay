# res://src/autoload/input_controller.gd
extends Node

signal interaction_requested(action_type: String, global_pos: Vector2)

var is_input_blocked: bool = false
var long_press_duration: float = 0.65
var touch_timer: Timer

var last_touch_pos: Vector2 = Vector2.ZERO
var is_touching: bool = false

func _ready() -> void:
	touch_timer = Timer.new()
	touch_timer.one_shot = true
	touch_timer.wait_time = long_press_duration
	touch_timer.timeout.connect(_on_touch_timer_timeout)
	add_child(touch_timer)

func block_input(status: bool) -> void:
	is_input_blocked = status

func _unhandled_input(event: InputEvent) -> void:
	if is_input_blocked:
		return
		
	# PC Mouse Support
	if event is InputEventMouseButton and event.is_pressed():
		if event.button_index == MOUSE_BUTTON_LEFT:
			interaction_requested.emit("interact", event.global_position)
		elif event.button_index == MOUSE_BUTTON_RIGHT:
			interaction_requested.emit("examine", event.global_position)

	# Mobile Touch Support
	if event is InputEventScreenTouch:
		if event.pressed:
			is_touching = true
			last_touch_pos = event.position
			touch_timer.start()
		else:
			if is_touching:
				is_touching = false
				if not touch_timer.is_stopped():
					touch_timer.stop()
					interaction_requested.emit("interact", event.position)

func _on_touch_timer_timeout() -> void:
	if is_touching:
		is_touching = false
		interaction_requested.emit("examine", last_touch_pos)
