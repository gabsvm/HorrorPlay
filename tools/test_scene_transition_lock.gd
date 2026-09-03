extends Node

var transition_seen: bool = false
var transition_lock_seen: bool = false
var transition_finished_seen: bool = false

func _ready() -> void:
	print("[TRANSITION TEST] Initializing scene transition input ownership probe...")
	call_deferred("_run")

func _run() -> void:
	if InputController.is_input_blocked:
		_fail("Input unexpectedly blocked before scene transition probe")
		return

	# Keep this probe alive while SceneRouter replaces the active scene.
	if get_tree().current_scene == self:
		get_tree().current_scene = null

	SceneRouter.transition_started.connect(_on_transition_started, CONNECT_ONE_SHOT)
	SceneRouter.transition_finished.connect(_on_transition_finished, CONNECT_ONE_SHOT)
	SceneRouter.change_room("res://src/menu/main_menu.tscn")
	await get_tree().process_frame

	if not transition_seen:
		_fail("SceneRouter never emitted transition_started")
		return
	if not transition_lock_seen:
		_fail("Scene transition started without owning an input lock")
		return

	if not await _wait_for_transition_finished(180):
		_fail("Scene transition never completed")
		return
	if InputController.is_input_locked_by(&"scene_transition"):
		_fail("Scene transition completed but leaked its input lock")
		return
	if SceneRouter.transition_in_progress:
		_fail("SceneRouter remained marked in-progress after transition_finished")
		return

	print("[TRANSITION TEST] PASS: scene transition owns input before fade work begins and releases it after completion")
	await _cleanup_loaded_scene()
	await _settle_audio_for_shutdown()
	get_tree().quit(0)

func _on_transition_started() -> void:
	transition_seen = true
	transition_lock_seen = InputController.is_input_locked_by(&"scene_transition")

func _on_transition_finished() -> void:
	transition_finished_seen = true

func _wait_for_transition_finished(max_frames: int) -> bool:
	for _i in range(max_frames):
		if transition_finished_seen:
			return true
		await get_tree().process_frame
	return false

func _cleanup_loaded_scene() -> void:
	var loaded_scene = get_tree().current_scene
	if loaded_scene and loaded_scene != self and is_instance_valid(loaded_scene):
		get_tree().current_scene = null
		loaded_scene.queue_free()
	for _i in range(12):
		await get_tree().process_frame

func _settle_audio_for_shutdown() -> void:
	AudioBus.cleanup_for_shutdown()
	for _i in range(12):
		await get_tree().process_frame

func _fail(reason: String) -> void:
	printerr("[TRANSITION TEST FAILED] ", reason)
	get_tree().quit(1)
