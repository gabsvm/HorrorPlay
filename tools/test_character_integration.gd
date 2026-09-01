# res://tools/test_character_integration.gd
extends Node

var screenshots_dir: String = "res://docs/screenshots"
var drawer_success_count: int = 0
var turn_state_seen: bool = false

func _ready() -> void:
	print("[TEST] Initializing AA Character Overhaul Integration Test...")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(screenshots_dir))
	call_deferred("_start_tests")

func _start_tests() -> void:
	SaveSystem.reset_runtime_state()
	Investigation.start_case()

	for evidence_id in ["lantern_field_tag", "signal_without_recording", "lantern_roster"]:
		if not Investigation.EVIDENCE_CATALOG.has(evidence_id):
			_fail_test("Narrative overhaul evidence missing: %s" % evidence_id)
			return

	print("[TEST] 1. Loading Office Room...")
	var office_scene = load("res://src/rooms/room_01_office/room_01_office.tscn").instantiate()
	get_tree().root.add_child(office_scene)
	get_tree().current_scene = office_scene
	await _wait_frames(15)
	_capture_screenshot("01_office_initial.png")

	var player = office_scene.get_node_or_null("CharactersLayer/Player") as Player
	if not player:
		_fail_test("Player not found in Office scene")
		return
	if player.base_scale < 1.30:
		_fail_test("Office Inspector is still underscaled for benchmark staging: %.2f" % player.base_scale)
		return
	if player.personal_light.visible:
		_fail_test("Office Inspector lantern/light must be disabled indoors")
		return
	if player.max_speed > 265.0:
		_fail_test("Office Inspector still moves too fast for an interior: %.1f" % player.max_speed)
		return
	if player.walk_speed_scale_max < 1.30:
		_fail_test("Office walk cadence is still too slow for physical speed: %.2f" % player.walk_speed_scale_max)
		return
	if player.walk_bob_amount > 0.60:
		_fail_test("Office still uses excessive procedural walk bob: %.2f" % player.walk_bob_amount)
		return
	for required_node in ["PixelBackdrop", "PixelDetail", "CinematicCamera", "NearCameraLayer", "WorldGrade", "OfficeSoundscape"]:
		if not office_scene.has_node(required_node):
			_fail_test("Office production benchmark node missing: %s" % required_node)
			return
	var grade_layer := office_scene.get_node("WorldGrade") as CanvasLayer
	var ui_layer := office_scene.get_node("UILayer") as CanvasLayer
	if not grade_layer or not ui_layer or grade_layer.layer >= ui_layer.layer:
		_fail_test("Office world grade must remain below the HUD/UI layer")
		return
	player.state_changed.connect(_on_player_state_changed)

	var desk = office_scene.get_node("HotspotsLayer/Desk") as Hotspot
	print("[TEST] 2. Requesting Desk through InputController...")
	_request_hotspot(desk, "interact")
	if not await _wait_for_dialogue():
		_fail_test("Desk interaction never opened dialogue")
		return
	await _dismiss_dialogue_cleanly()
	await _wait_frames(4)

	var key_item: ItemData = office_scene.key_item
	if not key_item or not Inventory.has_item(key_item.id):
		_fail_test("Desk did not naturally award the Rusty Key")
		return
	if not GameState.get_flag("inspector_water_memory_seen"):
		_fail_test("Office report failed to seed Inspector water-memory foreshadowing")
		return
	if InputController.is_input_blocked:
		_fail_test("Input remained blocked after Desk dialogue: dialogue=%s room=%s legacy=%s" % [
			InputController.is_input_locked_by(&"dialogue"),
			InputController.is_input_locked_by(&"room_interaction"),
			InputController.is_input_locked_by(&"legacy")
		])
		return
	_capture_screenshot("02_office_at_desk.png")

	print("[TEST] 3. Arming key and using the real world interaction flow...")
	var drawer = office_scene.get_node("HotspotsLayer/Drawer") as Hotspot
	drawer.item_used_successfully.connect(_on_drawer_item_success)
	Inventory.set_active_item(key_item)
	_request_hotspot(drawer, "interact")

	if not await _wait_for_animation_frame(player, &"use_mid", 2):
		_fail_test("Rusty Key interaction never reached use_mid; state=%d pos=%s active_item=%s locks(dialogue=%s room=%s legacy=%s)" % [
			player.current_state,
			player.global_position,
			Inventory.active_item.id if Inventory.active_item else "none",
			InputController.is_input_locked_by(&"dialogue"),
			InputController.is_input_locked_by(&"room_interaction"),
			InputController.is_input_locked_by(&"legacy")
		])
		return
	_capture_screenshot("04_office_using_key_mid.png")

	if not await _wait_for_flag("office_drawer_unlocked"):
		_fail_test("Drawer failed to unlock through Room/InputController flow")
		return
	if await _wait_for_dialogue(120):
		await _dismiss_dialogue_cleanly()
	await _wait_frames(4)

	if Inventory.has_item(key_item.id):
		_fail_test("Rusty Key was not consumed after successful use")
		return
	if Inventory.active_item != null:
		_fail_test("Inventory active_item was not cleared after successful use")
		return
	if drawer_success_count != 1:
		_fail_test("Drawer success callback fired %d times; expected exactly once" % drawer_success_count)
		return
	if not GameState.get_flag("lantern_code_seen"):
		_fail_test("Office drawer failed to seed L-17 foreshadowing")
		return
	_capture_screenshot("05_office_drawer_unlocked.png")

	print("[TEST] 4. Verifying authored turn state and retargeting...")
	turn_state_seen = false
	await player.face_direction(-1)
	if not turn_state_seen or player.facing_direction != -1:
		_fail_test("TURNING state was not used for an explicit facing change")
		return

	var retarget_destination = Vector2(900, 820)
	player.set_target_position(Vector2(1500, 820))
	await _wait_frames(6)
	player.set_target_position(retarget_destination)
	if not await _wait_for_position(player, retarget_destination):
		_fail_test("Player failed to retarget safely during walking")
		return

	print("[TEST] 5. Verifying sanity-linked idle...")
	Sanity.current_sanity = 50
	await _wait_frames(8)
	if player.animated_sprite.animation != &"idle_uneasy":
		_fail_test("Sanity 50 did not switch the player to idle_uneasy")
		return
	Sanity.reset_sanity()
	await _wait_frames(4)

	office_scene.queue_free()
	await _wait_frames(8)

	print("[TEST] 6. Loading Streets and Tavern presentation acceptance scenes...")
	var streets_scene = load("res://src/rooms/room_02_streets/room_02_streets.tscn").instantiate()
	get_tree().root.add_child(streets_scene)
	get_tree().current_scene = streets_scene
	await _wait_frames(12)
	var streets_player = streets_scene.get_node("CharactersLayer/Player") as Player
	if streets_player.base_scale < 1.10:
		_fail_test("Streets Inspector is underscaled")
		return
	_capture_screenshot("06_streets_room.png")
	streets_scene.queue_free()
	await _wait_frames(6)

	var tavern_scene = load("res://src/rooms/room_03_tavern/room_03_tavern.tscn").instantiate()
	get_tree().root.add_child(tavern_scene)
	get_tree().current_scene = tavern_scene
	await _wait_frames(12)
	var barnaby = tavern_scene.get_node("HotspotsLayer/Innkeeper") as Hotspot
	var tavern_player = tavern_scene.get_node("CharactersLayer/Player") as Player
	if barnaby.interaction_pose != "none":
		_fail_test("Barnaby must not trigger a generic item-use animation")
		return
	if tavern_player.base_scale < 1.16:
		_fail_test("Tavern Inspector is underscaled")
		return
	if tavern_player.personal_light.visible:
		_fail_test("Tavern Inspector lantern/light must be disabled indoors")
		return
	_capture_screenshot("07_tavern_room.png")
	tavern_scene.queue_free()
	await _wait_frames(6)

	print("[TEST] 7. Loading Docks...")
	var docks_scene = load("res://src/rooms/room_04_docks/room_04_docks.tscn").instantiate()
	get_tree().root.add_child(docks_scene)
	get_tree().current_scene = docks_scene
	await _wait_frames(12)
	var docks_player = docks_scene.get_node("CharactersLayer/Player") as Player
	if not docks_player.personal_light.visible:
		_fail_test("Docks Inspector lantern/light should be available outdoors")
		return
	_capture_screenshot("08_docks_room.png")
	docks_scene.queue_free()
	await _wait_frames(6)

	print("[TEST] 8. Testing Brass Fuse through inventory world-use flow...")
	GameState.set_flag("boathouse_entered", true)
	var boathouse_scene = load("res://src/rooms/room_05_boathouse/room_05_boathouse.tscn").instantiate()
	get_tree().root.add_child(boathouse_scene)
	get_tree().current_scene = boathouse_scene
	await _wait_frames(12)
	var boathouse_player = boathouse_scene.get_node("CharactersLayer/Player") as Player
	var fuse_box = boathouse_scene.get_node("HotspotsLayer/FuseBox") as Hotspot
	var fuse_item: ItemData = boathouse_scene.brass_fuse_item
	if not fuse_item:
		_fail_test("Boathouse fuse item is missing")
		return
	if fuse_item.world_use_animation == "use_mid":
		_fail_test("Brass fuse still reuses the Rusty Key animation")
		return
	Inventory.add_item(fuse_item)
	Inventory.set_active_item(fuse_item)
	_request_hotspot(fuse_box, "interact")
	if not await _wait_for_flag("boathouse_fuse_installed"):
		_fail_test("Brass Fuse failed to install through real inventory world-use flow")
		return
	if await _wait_for_dialogue(120):
		await _dismiss_dialogue_cleanly()
	if Inventory.has_item(fuse_item.id) or Inventory.active_item != null:
		_fail_test("Brass Fuse was not consumed/cleared after installation")
		return
	if boathouse_player.animated_sprite.animation == &"use_mid":
		_fail_test("Boathouse player ended in Rusty Key use animation during fuse test")
		return
	_capture_screenshot("09_boathouse_room.png")

	await _cleanup_scene_for_shutdown(boathouse_scene)
	await _settle_audio_for_shutdown()
	print("[TEST] ALL CHARACTER/NARRATIVE/BENCHMARK INTEGRATION TESTS PASSED SUCCESSFULLY!")
	get_tree().quit(0)

func _request_hotspot(hotspot: Hotspot, verb: String) -> void:
	var viewport_position = get_viewport().get_canvas_transform() * hotspot.get_center_position()
	InputController.interaction_requested.emit(verb, viewport_position)

func _on_drawer_item_success(_item: ItemData) -> void:
	drawer_success_count += 1

func _on_player_state_changed(_old_state: int, new_state: int) -> void:
	if new_state == Player.State.TURNING:
		turn_state_seen = true

func _wait_for_dialogue(max_frames: int = 300) -> bool:
	for _i in range(max_frames):
		if DialogueManager.current_balloon != null:
			return true
		await get_tree().physics_frame
	return false

func _dismiss_dialogue_cleanly() -> void:
	var safety_counter = 0
	while DialogueManager.current_balloon != null and safety_counter < 60:
		safety_counter += 1
		var balloon = DialogueManager.current_balloon
		if balloon and is_instance_valid(balloon) and balloon.has_method("advance_dialogue"):
			balloon.advance_dialogue()
		await _wait_frames(4)
	await _wait_frames(4)

func _wait_for_animation_frame(player: Player, animation_name: StringName, minimum_frame: int, max_frames: int = 360) -> bool:
	for _i in range(max_frames):
		if player and player.animated_sprite and player.animated_sprite.animation == animation_name and player.animated_sprite.frame >= minimum_frame:
			return true
		await get_tree().physics_frame
	return false

func _wait_for_flag(flag_name: String, max_frames: int = 480) -> bool:
	for _i in range(max_frames):
		if GameState.get_flag(flag_name):
			return true
		await get_tree().physics_frame
	return false

func _wait_for_position(player: Player, target: Vector2, max_frames: int = 600) -> bool:
	for _i in range(max_frames):
		if player.global_position.distance_to(target) <= player.arrival_radius + 1.0:
			return true
		await get_tree().physics_frame
	return false

func _cleanup_scene_for_shutdown(scene: Node) -> void:
	if scene and is_instance_valid(scene):
		if get_tree().current_scene == scene:
			get_tree().current_scene = null
		scene.queue_free()
	await _wait_frames(6)

func _settle_audio_for_shutdown() -> void:
	if AudioBus.music_tween and AudioBus.music_tween.is_valid():
		AudioBus.music_tween.kill()
	AudioBus.music_tween = null
	if AudioBus.ambience_tween and AudioBus.ambience_tween.is_valid():
		AudioBus.ambience_tween.kill()
	AudioBus.ambience_tween = null

	var managed_players: Array[AudioStreamPlayer] = []
	for player in AudioBus.music_players:
		managed_players.append(player)
		player.stop()
		player.stream = null
	for player in AudioBus.ambience_players:
		managed_players.append(player)
		player.stop()
		player.stream = null
	for child in AudioBus.get_children():
		if child is AudioStreamPlayer and not managed_players.has(child):
			child.stop()
			child.queue_free()
	await _wait_frames(12)

func _wait_frames(count: int) -> void:
	for _i in range(count):
		await get_tree().process_frame

func _capture_screenshot(filename: String) -> void:
	if DisplayServer.get_name() == "headless":
		return
	var img = get_viewport().get_texture().get_image()
	if img and not img.is_empty():
		var save_path = ProjectSettings.globalize_path(screenshots_dir.path_join(filename))
		img.save_png(save_path)
		print("[TEST] Captured screenshot: ", save_path)

func _fail_test(reason: String) -> void:
	printerr("[TEST FAILED] ", reason)
	get_tree().quit(1)
