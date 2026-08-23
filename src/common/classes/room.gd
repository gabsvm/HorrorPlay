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

@export_group("Character Depth Scaling")
@export var character_depth_scaling_enabled: bool = false
@export var character_depth_y_min: float = 650.0
@export var character_depth_y_max: float = 900.0
@export var character_scale_far: float = 0.85
@export var character_scale_near: float = 1.0

@export_group("Personal Light Configuration")
@export var personal_light_enabled: bool = true
@export var personal_light_energy: float = 0.52
@export var personal_light_color: Color = Color(0.96, 0.84, 0.65, 1.0)
@export var personal_light_scale: float = 1.35

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
	
	var player = _get_player()
	if player:
		player.configure_light(
			personal_light_enabled,
			personal_light_energy,
			personal_light_color,
			personal_light_scale
		)
	
	if checkpoint_on_ready:
		call_deferred("_save_room_checkpoint")

func _process(_delta: float) -> void:
	if character_depth_scaling_enabled:
		var player = _get_player()
		if player:
			var t = clamp((player.global_position.y - character_depth_y_min) / max(1.0, character_depth_y_max - character_depth_y_min), 0.0, 1.0)
			var scale_factor = lerp(character_scale_far, character_scale_near, t)
			player.set_depth_scale(scale_factor)

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

	if player:
		InputController.block_input(true)
		if hotspot.walk_to_point:
			await player.walk_to(hotspot.walk_to_point.global_position)
		
		# Orient player towards hotspot or authored facing
		match hotspot.interaction_facing:
			"left":
				player._set_facing(-1)
			"right":
				player._set_facing(1)
			"auto":
				player.face_position(hotspot.get_center_position())
			"none":
				pass

	if armed_item != null and verb == "interact":
		if hotspot.required_item == null:
			if player:
				InputController.block_input(false)
			_show_item_use_hint("%s no parece tener ningún uso en %s." % [armed_item.name, hotspot.hotspot_name])
			return

		if player:
			var item_anim = &"pickup_low" if hotspot.interaction_pose == "low" else &"use_mid"
			await player.play_interaction_animation(item_anim)

		var correct_item = hotspot.accepts_item(armed_item)
		hotspot.execute_interaction("use_item")
		if correct_item and Inventory.active_item == armed_item:
			Inventory.set_active_item(null)
		if player:
			InputController.block_input(false)
		return

	if player and hotspot.interaction_pose != "none":
		if verb == "examine":
			await player.play_interaction_animation(&"inspect")
		elif verb == "interact":
			match hotspot.interaction_pose:
				"inspect":
					await player.play_interaction_animation(&"inspect")
				"mid", "use_mid":
					await player.play_interaction_animation(&"use_mid")
				"low", "pickup_low":
					await player.play_interaction_animation(&"pickup_low")
				"default":
					await player.play_interaction_animation(&"use_mid")

	hotspot.execute_interaction(verb)
	if player:
		InputController.block_input(false)

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
			if child is CharacterBody2D and child.name == "Player":
				return child as Player
	return null
