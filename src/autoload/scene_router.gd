# res://src/autoload/scene_router.gd
extends Node

signal transition_started
signal transition_finished

var current_room: Node2D = null
var fade_layer: CanvasLayer
var fade_rect: ColorRect

func _ready() -> void:
	# Programmatic setup of UI transition layer
	fade_layer = CanvasLayer.new()
	fade_layer.layer = 128
	
	fade_rect = ColorRect.new()
	fade_rect.color = Color(0, 0, 0, 0)
	fade_rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	fade_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	fade_layer.add_child(fade_rect)
	add_child(fade_layer)

func change_room(target_scene_path: String) -> void:
	if not ResourceLoader.exists(target_scene_path):
		printerr("SceneRouter: Target scene path does not exist: ", target_scene_path)
		return
		
	transition_started.emit()
	fade_rect.mouse_filter = Control.MOUSE_FILTER_STOP
	
	# Fade Out
	var tween = create_tween()
	tween.tween_property(fade_rect, "color", Color.BLACK, 0.4).set_trans(Tween.TRANS_SINE)
	await tween.finished
	
	# Perform the native Godot scene change
	var err = get_tree().change_scene_to_file(target_scene_path)
	if err != OK:
		printerr("SceneRouter: Error changing scene: ", err)
		
	# Wait for the next frame so the new scene has its _ready called and registers itself
	await get_tree().process_frame
	
	# Fade In
	tween = create_tween()
	tween.tween_property(fade_rect, "color", Color(0, 0, 0, 0), 0.4).set_trans(Tween.TRANS_SINE)
	await tween.finished
	
	fade_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	transition_finished.emit()
