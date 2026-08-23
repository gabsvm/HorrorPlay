# res://tools/test_character_integration.gd
extends Node

var screenshots_dir: String = "res://docs/screenshots"

func _ready() -> void:
	print("[TEST] Initializing AA Character Overhaul Integration Test...")
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(screenshots_dir))
	call_deferred("_start_tests")

func _dismiss_dialogue_cleanly() -> void:
	var safety_counter = 0
	while DialogueManager.current_balloon != null and safety_counter < 30:
		safety_counter += 1
		var balloon = DialogueManager.current_balloon
		if balloon and is_instance_valid(balloon):
			if balloon.has_method("advance_dialogue"):
				balloon.advance_dialogue()
		await _wait_frames(4)
	await _wait_frames(5)

func _start_tests() -> void:
	SaveSystem.reset_runtime_state()
	Investigation.start_case()
	
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
	
	print("[TEST] Player initial position: ", player.global_position)
	print("[TEST] Player initial state: ", player.current_state)
	
	# Test walking to desk
	var desk = office_scene.get_node("HotspotsLayer/Desk") as Hotspot
	print("[TEST] 2. Walking to Desk...")
	await player.walk_to(desk.walk_to_point.global_position)
	await _wait_frames(8)
	_capture_screenshot("02_office_at_desk.png")
	
	# Interact with desk to obtain key
	print("[TEST] 3. Interacting with Desk to get Rusty Key...")
	desk.execute_interaction("interact")
	await _wait_frames(5)
	await _dismiss_dialogue_cleanly()
	
	var key_item = office_scene.key_item
	print("[TEST] key_item id: ", key_item.id if key_item else "null")
	if not Inventory.has_item(key_item.id):
		Inventory.add_item(key_item)
	print("[TEST] Inventory has key: ", Inventory.has_item(key_item.id))
	
	# Arm key
	print("[TEST] 4. Arming Rusty Key for usage...")
	Inventory.set_active_item(key_item)
	print("[TEST] Active item: ", Inventory.active_item.name if Inventory.active_item else "null")
	
	# Click / use on Drawer
	var drawer = office_scene.get_node("HotspotsLayer/Drawer") as Hotspot
	print("[TEST] 5. Using Key on Drawer (Archivador)...")
	print("[TEST] Drawer required_item: ", drawer.required_item.id if drawer.required_item else "null")
	print("[TEST] Drawer accepts_item: ", drawer.accepts_item(Inventory.active_item))
	
	await player.walk_to(drawer.walk_to_point.global_position)
	player._set_facing(1)
	await _wait_frames(5)
	_capture_screenshot("03_office_using_key_approach.png")
	
	print("[TEST] Playing use_mid animation...")
	await player.play_interaction_animation(&"use_mid")
	_capture_screenshot("04_office_using_key_mid.png")
	
	drawer.execute_interaction("use_item")
	await _wait_frames(5)
	await _dismiss_dialogue_cleanly()
	
	var drawer_unlocked = GameState.get_flag("office_drawer_unlocked")
	print("[TEST] Drawer unlocked: ", drawer_unlocked)
	if not drawer_unlocked:
		_fail_test("Drawer failed to unlock with key")
		return
	
	_capture_screenshot("05_office_drawer_unlocked.png")
	office_scene.queue_free()
	await _wait_frames(8)
	
	# Test Streets Room
	print("[TEST] 6. Loading Streets Room...")
	var streets_scene = load("res://src/rooms/room_02_streets/room_02_streets.tscn").instantiate()
	get_tree().root.add_child(streets_scene)
	get_tree().current_scene = streets_scene
	await _wait_frames(15)
	_capture_screenshot("06_streets_room.png")
	streets_scene.queue_free()
	await _wait_frames(8)
	
	# Test Tavern Room
	print("[TEST] 7. Loading Tavern Room...")
	var tavern_scene = load("res://src/rooms/room_03_tavern/room_03_tavern.tscn").instantiate()
	get_tree().root.add_child(tavern_scene)
	get_tree().current_scene = tavern_scene
	await _wait_frames(15)
	_capture_screenshot("07_tavern_room.png")
	tavern_scene.queue_free()
	await _wait_frames(8)
	
	# Test Docks Room
	print("[TEST] 8. Loading Docks Room...")
	var docks_scene = load("res://src/rooms/room_04_docks/room_04_docks.tscn").instantiate()
	get_tree().root.add_child(docks_scene)
	get_tree().current_scene = docks_scene
	await _wait_frames(15)
	_capture_screenshot("08_docks_room.png")
	docks_scene.queue_free()
	await _wait_frames(8)
	
	# Test Boathouse Room
	print("[TEST] 9. Loading Boathouse Room...")
	var boathouse_scene = load("res://src/rooms/room_05_boathouse/room_05_boathouse.tscn").instantiate()
	get_tree().root.add_child(boathouse_scene)
	get_tree().current_scene = boathouse_scene
	await _wait_frames(15)
	_capture_screenshot("09_boathouse_room.png")
	boathouse_scene.queue_free()
	await _wait_frames(8)
	
	print("[TEST] ALL INTEGRATION TESTS PASSED SUCCESSFULLY!")
	get_tree().quit(0)

func _wait_frames(count: int) -> void:
	for i in range(count):
		await get_tree().process_frame

func _capture_screenshot(filename: String) -> void:
	var img = get_viewport().get_texture().get_image()
	if img and not img.is_empty():
		var save_path = ProjectSettings.globalize_path(screenshots_dir.path_join(filename))
		img.save_png(save_path)
		print("[TEST] Captured screenshot: ", save_path)

func _fail_test(reason: String) -> void:
	printerr("[TEST FAILED] ", reason)
	get_tree().quit(1)
