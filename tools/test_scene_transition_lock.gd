extends Node

var transition_seen: bool = false
var transition_lock_seen: bool = false

func _ready() -> void:
	print("[TRANSITION TEST] Initializing scene transition input ownership probe...")
	call_deferred("_run")

func _run() -> void:
	if InputController.is_input_blocked:
		_fail("Input unexpectedly blocked before scene transition probe")
		return

	SceneRouter.transition_started.connect(_on_transition_started, CONNECT_ONE_SHOT)
	SceneRouter.change_room("res://src/menu/main_menu.tscn")
	await get_tree().process_frame

	if not transition_seen:
		_fail("SceneRouter never emitted transition_started")
		return
	if not transition_lock_seen:
		_fail("Scene transition started without owning an input lock")
		return

	print("[TRANSITION TEST] PASS: scene transition owns input before fade work begins")
	get_tree().quit(0)

func _on_transition_started() -> void:
	transition_seen = true
	transition_lock_seen = InputController.is_input_locked_by(&"scene_transition")

func _fail(reason: String) -> void:
	printerr("[TRANSITION TEST FAILED] ", reason)
	get_tree().quit(1)
