# res://src/common/classes/room.gd
class_name Room
extends Node2D

@export var room_name: String = "Unnamed Room"
@export var music_theme: AudioStream
@export var suppress_music: bool = false
@export var ambience_profile: String = ""
@export var footstep_surface: String = "wood"
@export var walk_bounds: Rect2 = Rect2(40, 690, 1840, 320)
@export var checkpoint_on_ready: bool = true

func _ready() -> void:
	SceneRouter.current_room = self
	if suppress_music:
		AudioBus.stop_music(1.0)
	elif music_theme:
		AudioBus.play_music(music_theme)
	AudioBus.play_ambience(ambience_profile)
	var ui_layer = get_node_or_null("UILayer")
	if ui_layer and not ui_layer.has_node("UI_HUD"):
		var hud_scene = load("res://src/common/ui/ui_hud.tscn")
		if hud_scene:
			var hud_instance = hud_scene.instantiate()
			hud_instance.name = "UI_HUD"
			ui_layer.add_child(hud_instance)
	if not InputController.interaction_requested.is_connected(_on_interaction_requested):
		InputController.interaction_requested.connect(_on_interaction_requested)
	if checkpoint_on_ready:
		call_deferred("_save_room_checkpoint")

func _exit_tree() -> void:
	if InputController.interaction_requested.is_connected(_on_interaction_requested):
		InputController.interaction_requested.disconnect(_on_interaction_requested)

func _save_room_checkpoint() -> void:
	if is_inside_tree():
		SaveSystem.save_checkpoint(1)

func _on_interaction_requested(action_type: String, viewport_pos: Vector2) -> void:
	if InputController.is_input_blocked:
		return

	var world_pos = _viewport_to_world(viewport_pos)
	var clicked_hotspot: Hotspot = null
	var hotspots_parent = get_node_or_null("HotspotsLayer")
	if hotspots_parent:
		for hs in hotspots_parent.get_children():
			if hs is Hotspot and hs.is_active and hs.is_point_inside(world_pos):
				clicked_hotspot = hs
				break

	if clicked_hotspot:
		_walk_and_execute(clicked_hotspot, action_type)
	elif action_type == "interact" and Inventory.active_item == null:
		var player = _get_player()
		if player:
			player.walk_to(_clamp_floor_target(world_pos))
	elif action_type == "interact" and Inventory.active_item != null:
		_show_item_use_hint("No hay ningún objeto interactuable en ese punto.")

func _viewport_to_world(viewport_pos: Vector2) -> Vector2:
	# Mouse/touch arrive in viewport coordinates. Convert through the canvas
	# transform before comparing them against authored 2D hotspot geometry.
	# This keeps hit-testing correct with stretch, resized windows and fullscreen.
	return get_viewport().get_canvas_transform().affine_inverse() * viewport_pos

func _clamp_floor_target(pos: Vector2) -> Vector2:
	var min_x = walk_bounds.position.x
	var min_y = walk_bounds.position.y
	var max_x = walk_bounds.position.x + walk_bounds.size.x
	var max_y = walk_bounds.position.y + walk_bounds.size.y
	return Vector2(clamp(pos.x, min_x, max_x), clamp(pos.y, min_y, max_y))

func _walk_and_execute(hotspot: Hotspot, verb: String) -> void:
	var player = _get_player()
	var armed_item = Inventory.active_item

	if hotspot.walk_to_point and player:
		InputController.block_input(true)
		await player.walk_to(hotspot.walk_to_point.global_position)
		InputController.block_input(false)

	# Inventory use is an explicit mode: after pressing USAR, the next target is
	# resolved only once the inspector has walked to its interaction marker.
	if armed_item != null and verb == "interact":
		if hotspot.required_item == null:
			_show_item_use_hint("%s no parece tener ningún uso en %s." % [armed_item.name, hotspot.hotspot_name])
			return

		var correct_item = hotspot.required_item == armed_item
		hotspot.execute_interaction("use_item")
		if correct_item and Inventory.active_item == armed_item:
			Inventory.set_active_item(null)
		return

	hotspot.execute_interaction(verb)

func _show_item_use_hint(message: String) -> void:
	var scene = get_tree().current_scene
	if scene:
		var hud = scene.find_child("UI_HUD*", true, false)
		if hud and hud.has_method("show_item_use_feedback"):
			hud.show_item_use_feedback(message)
			return
	DialogueManager.show_dialogue([message], "Inspector")

func _get_player() -> Player:
	var chars_layer = get_node_or_null("CharactersLayer")
	if chars_layer:
		for child in chars_layer.get_children():
			if child is Player:
				return child
	return null
