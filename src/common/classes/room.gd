# res://src/common/classes/room.gd
class_name Room
extends Node2D

@export var room_name: String = "Unnamed Room"
@export var music_theme: AudioStream

func _ready() -> void:
	SceneRouter.current_room = self
	if music_theme:
		AudioBus.play_music(music_theme)
		
	var ui_layer = get_node_or_null("UILayer")
	if ui_layer and not ui_layer.has_node("UI_HUD"):
		var hud_scene = load("res://src/common/ui/ui_hud.tscn")
		if hud_scene:
			var hud_instance = hud_scene.instantiate()
			hud_instance.name = "UI_HUD"
			ui_layer.add_child(hud_instance)
			
	# Connect to global input controller
	if not InputController.interaction_requested.is_connected(_on_interaction_requested):
		InputController.interaction_requested.connect(_on_interaction_requested)

func _exit_tree() -> void:
	if InputController.interaction_requested.is_connected(_on_interaction_requested):
		InputController.interaction_requested.disconnect(_on_interaction_requested)

func _on_interaction_requested(action_type: String, pos: Vector2) -> void:
	if InputController.is_input_blocked:
		return
		
	# Find which hotspot was clicked geometrically
	var clicked_hotspot: Hotspot = null
	var hotspots_parent = get_node_or_null("HotspotsLayer")
	if hotspots_parent:
		for hs in hotspots_parent.get_children():
			if hs is Hotspot and hs.is_active:
				if hs.is_point_inside(pos):
					clicked_hotspot = hs
					break
					
	if clicked_hotspot:
		_walk_and_execute(clicked_hotspot, action_type)
	else:
		# Clicked on the floor! Walk player there if not examining/using item
		if action_type == "interact" and Inventory.active_item == null:
			var player = _get_player()
			if player:
				player.walk_to(pos)

func _walk_and_execute(hotspot: Hotspot, verb: String) -> void:
	var player = _get_player()
	if hotspot.walk_to_point and player:
		InputController.block_input(true)
		await player.walk_to(hotspot.walk_to_point.global_position)
		InputController.block_input(false)
		
	if Inventory.active_item != null and verb == "interact":
		hotspot.execute_interaction("use_item")
	else:
		hotspot.execute_interaction(verb)

func _get_player() -> Player:
	var chars_layer = get_node_or_null("CharactersLayer")
	if chars_layer:
		for child in chars_layer.get_children():
			if child is Player:
				return child
	return null
