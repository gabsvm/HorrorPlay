# res://src/autoload/scene_router.gd
extends Node

signal transition_started
signal transition_finished

const INPUT_LOCK_OWNER: StringName = &"scene_transition"

var current_room: Node2D = null
var fade_layer: CanvasLayer
var fade_rect: ColorRect
var transition_in_progress: bool = false
var fade_tween: Tween = null

func _ready() -> void:
	fade_layer = CanvasLayer.new()
	fade_layer.layer = 128

	fade_rect = ColorRect.new()
	fade_rect.color = Color(0, 0, 0, 0)
	fade_rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	fade_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE

	fade_layer.add_child(fade_rect)
	add_child(fade_layer)

func _exit_tree() -> void:
	if fade_tween and fade_tween.is_valid():
		fade_tween.kill()
	fade_tween = null
	if is_instance_valid(InputController):
		InputController.release_input_lock(INPUT_LOCK_OWNER)
	transition_in_progress = false

func change_room(target_scene_path: String) -> void:
	if transition_in_progress:
		return
	if not ResourceLoader.exists(target_scene_path):
		printerr("SceneRouter: Target scene path does not exist: ", target_scene_path)
		return

	transition_in_progress = true
	InputController.acquire_input_lock(INPUT_LOCK_OWNER)
	transition_started.emit()
	fade_rect.mouse_filter = Control.MOUSE_FILTER_STOP

	if fade_tween and fade_tween.is_valid():
		fade_tween.kill()
	fade_tween = create_tween()
	fade_tween.tween_property(fade_rect, "color", Color.BLACK, 0.4).set_trans(Tween.TRANS_SINE)
	await fade_tween.finished

	var err := get_tree().change_scene_to_file(target_scene_path)
	if err != OK:
		printerr("SceneRouter: Error changing scene: ", err)
		_finish_transition_immediately()
		return

	await get_tree().process_frame

	if fade_tween and fade_tween.is_valid():
		fade_tween.kill()
	fade_tween = create_tween()
	fade_tween.tween_property(fade_rect, "color", Color(0, 0, 0, 0), 0.4).set_trans(Tween.TRANS_SINE)
	await fade_tween.finished

	_finish_transition()

func _finish_transition_immediately() -> void:
	if fade_tween and fade_tween.is_valid():
		fade_tween.kill()
	fade_tween = null
	if fade_rect:
		fade_rect.color = Color(0, 0, 0, 0)
	_finish_transition()

func _finish_transition() -> void:
	if fade_tween and fade_tween.is_valid():
		fade_tween.kill()
	fade_tween = null
	if fade_rect:
		fade_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	InputController.release_input_lock(INPUT_LOCK_OWNER)
	transition_in_progress = false
	transition_finished.emit()
