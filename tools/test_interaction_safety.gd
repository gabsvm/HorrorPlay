extends Node

var trigger_count: int = 0

func _ready() -> void:
	print("[SAFETY TEST] Initializing interaction safety regressions...")
	call_deferred("_run")

func _run() -> void:
	SaveSystem.reset_runtime_state()
	Investigation.start_case()

	var office = load("res://src/rooms/room_01_office/room_01_office.tscn").instantiate()
	get_tree().root.add_child(office)
	get_tree().current_scene = office
	await _wait_physics_frames(8)

	var player := office.get_node("CharactersLayer/Player") as Player
	if not player:
		_fail("Player not found")
		return

	var hotspot := Hotspot.new()
	hotspot.hotspot_name = "Cancellation Probe"
	hotspot.interaction_facing = "none"
	hotspot.interaction_pose = "none"
	office.get_node("HotspotsLayer").add_child(hotspot)

	var marker := Marker2D.new()
	marker.position = Vector2(1700, 825)
	hotspot.add_child(marker)
	hotspot.walk_to_point = marker
	hotspot.interacted.connect(_on_probe_interacted)

	var start_position := player.global_position
	office._walk_and_execute(hotspot, "interact")

	if not await _wait_for_state(player, Player.State.WALKING, 120):
		_fail("Probe interaction never entered WALKING")
		return
	if not await _wait_until_moved(player, start_position, 20.0, 120):
		_fail("Player never physically moved toward probe")
		return

	player.stop_movement()
	await _wait_physics_frames(45)

	if trigger_count != 0:
		_fail("Canceled movement still executed the distant hotspot (%d callback(s))" % trigger_count)
		return
	print("[SAFETY TEST] PASS: canceled movement cannot execute its pending hotspot")

	trigger_count = 0
	var reaction_hotspot := Hotspot.new()
	reaction_hotspot.hotspot_name = "Reaction Probe"
	reaction_hotspot.interaction_facing = "none"
	reaction_hotspot.interaction_pose = "none"
	office.get_node("HotspotsLayer").add_child(reaction_hotspot)
	reaction_hotspot.interacted.connect(_on_probe_interacted)

	player.play_reaction()
	await _wait_physics_frames(1)
	if player.current_state != Player.State.REACTING:
		_fail("Reaction setup did not enter REACTING")
		return

	office._walk_and_execute(reaction_hotspot, "interact")
	await _wait_physics_frames(3)
	if trigger_count != 0:
		_fail("REACTING actor still executed a world hotspot (%d callback(s))" % trigger_count)
		return
	print("[SAFETY TEST] PASS: reacting actor rejects world hotspots")

	if not await _wait_for_state(player, Player.State.IDLE, 180):
		_fail("Player did not return to IDLE after reaction")
		return

	var key_item: ItemData = office.key_item
	if not key_item:
		_fail("Office Rusty Key resource missing for modal reentry probes")
		return
	Inventory.add_item(key_item)
	Inventory.set_active_item(key_item)

	var item_hotspot := Hotspot.new()
	item_hotspot.hotspot_name = "Modal Reentry Probe"
	item_hotspot.interaction_facing = "none"
	item_hotspot.interaction_pose = "none"
	item_hotspot.required_item = key_item
	office.get_node("HotspotsLayer").add_child(item_hotspot)
	var item_marker := Marker2D.new()
	item_marker.position = Vector2(1600, 825)
	item_hotspot.add_child(item_marker)
	item_hotspot.walk_to_point = item_marker

	office._walk_and_execute(item_hotspot, "interact")
	if not await _wait_for_state(player, Player.State.WALKING, 120):
		_fail("Inventory reentry probe never entered WALKING")
		return
	if not InputController.is_input_locked_by(&"room_interaction"):
		_fail("Room interaction lock was not acquired before inventory reentry probe")
		return

	var hud = office.find_child("UI_HUD*", true, false)
	if not hud:
		_fail("HUD not found for modal reentry probes")
		return
	var inventory_menu = hud.get_node_or_null("InventoryMenu")
	if not inventory_menu:
		_fail("InventoryMenu not found for inventory reentry probe")
		return
	inventory_menu.open_menu()
	await _wait_physics_frames(1)
	if inventory_menu.visible:
		_fail("Inventory opened while a Room-owned world interaction was in progress")
		return
	if Inventory.active_item != key_item:
		_fail("Inventory reentry canceled/replaced the item armed for an in-progress world interaction")
		return
	print("[SAFETY TEST] PASS: inventory cannot interrupt a Room-owned world interaction")

	player.stop_movement()
	await _wait_physics_frames(4)
	if InputController.is_input_locked_by(&"room_interaction"):
		_fail("Room interaction lock remained after stopping inventory probe movement")
		return

	Inventory.set_active_item(key_item)
	item_marker.position = Vector2(1450, 825)
	office._walk_and_execute(item_hotspot, "interact")
	if not await _wait_for_state(player, Player.State.WALKING, 120):
		_fail("Casebook reentry probe never entered WALKING")
		return
	if not InputController.is_input_locked_by(&"room_interaction"):
		_fail("Room interaction lock was not acquired before casebook reentry probe")
		return

	hud._on_case_pressed()
	await _wait_physics_frames(1)
	var casebook = hud.get_node_or_null("CasebookBackdrop")
	if casebook and casebook.visible:
		_fail("Casebook opened while a Room-owned world interaction was in progress")
		return
	if Inventory.active_item != key_item:
		_fail("Casebook reentry canceled/replaced the item armed for an in-progress world interaction")
		return
	print("[SAFETY TEST] PASS: casebook cannot interrupt a Room-owned world interaction")

	var pause_menu = hud.get_node_or_null("PauseMenu")
	if not pause_menu:
		_fail("PauseMenu not found for escape reentry probe")
		return
	var cancel_event := InputEventAction.new()
	cancel_event.action = &"ui_cancel"
	cancel_event.pressed = true
	pause_menu._unhandled_input(cancel_event)
	await _wait_physics_frames(1)
	if Inventory.active_item != key_item:
		_fail("Esc canceled the armed item while a Room-owned world interaction was in progress")
		return
	if pause_menu.visible or get_tree().paused:
		_fail("Pause opened while a Room-owned world interaction was in progress")
		return
	print("[SAFETY TEST] PASS: Esc cannot interrupt a Room-owned world interaction")

	var desk_hotspot := office.get_node_or_null("HotspotsLayer/Desk") as Hotspot
	if not desk_hotspot or not desk_hotspot.reveal_container:
		_fail("Desk reveal overlay missing for reveal lock probe")
		return
	if desk_hotspot.reveal_container.visible:
		_fail("Desk reveal overlay unexpectedly visible before reveal lock probe")
		return
	hud._on_reveal_pressed()
	await _wait_physics_frames(1)
	if desk_hotspot.reveal_container.visible:
		_fail("Reveal fired while a Room-owned world interaction was in progress")
		return
	print("[SAFETY TEST] PASS: reveal cannot fire during a Room-owned world interaction")

	player.stop_movement()
	await _wait_physics_frames(4)
	Inventory.set_active_item(null)
	if InputController.is_input_blocked:
		_fail("Unexpected input lock remained before casebook escape probe")
		return

	hud._on_case_pressed()
	await _wait_physics_frames(1)
	if not casebook or not casebook.visible:
		_fail("Casebook escape probe could not open the casebook")
		return
	if not InputController.is_input_locked_by(&"casebook"):
		_fail("Casebook did not acquire its owner-scoped input lock")
		return
	pause_menu._unhandled_input(cancel_event)
	await _wait_physics_frames(1)
	if casebook.visible:
		_fail("Esc did not close the open casebook")
		return
	if InputController.is_input_locked_by(&"casebook"):
		_fail("Esc closed the casebook visually but leaked the casebook input lock")
		return
	if InputController.is_input_blocked:
		_fail("Input remained blocked after closing casebook with Esc")
		return
	print("[SAFETY TEST] PASS: Esc closes casebook and releases its owner lock")

	var dialogue_hotspot := Hotspot.new()
	dialogue_hotspot.hotspot_name = "Dialogue Lock Probe"
	dialogue_hotspot.interaction_facing = "none"
	dialogue_hotspot.interaction_pose = "none"
	office.get_node("HotspotsLayer").add_child(dialogue_hotspot)
	dialogue_hotspot.interacted.connect(_on_dialogue_probe_interacted)

	office._walk_and_execute(dialogue_hotspot, "interact")
	await _wait_physics_frames(1)
	if DialogueManager.current_balloon == null:
		_fail("Dialogue lock probe failed to open its dialogue")
		return
	if not InputController.is_input_blocked:
		_fail("Room released input while DialogueManager still owns an active balloon")
		return
	print("[SAFETY TEST] PASS: active dialogue retains the input lock")

	await _dismiss_dialogue_cleanly()
	if InputController.is_input_blocked:
		_fail("Input remained blocked after the dialogue ended")
		return

	await _cleanup_scene_for_shutdown(office)
	await _settle_audio_for_shutdown()
	print("[SAFETY TEST] ALL INTERACTION SAFETY REGRESSIONS PASSED")
	get_tree().quit(0)

func _on_probe_interacted(_verb: String) -> void:
	trigger_count += 1

func _on_dialogue_probe_interacted(_verb: String) -> void:
	DialogueManager.show_dialogue(["Input ownership probe."], "Inspector")

func _wait_for_state(player: Player, expected_state: int, max_frames: int) -> bool:
	for _i in range(max_frames):
		if player.current_state == expected_state:
			return true
		await get_tree().physics_frame
	return false

func _wait_until_moved(player: Player, start_position: Vector2, min_distance: float, max_frames: int) -> bool:
	for _i in range(max_frames):
		if player.global_position.distance_to(start_position) >= min_distance:
			return true
		await get_tree().physics_frame
	return false

func _dismiss_dialogue_cleanly() -> void:
	var safety_counter := 0
	while DialogueManager.current_balloon != null and safety_counter < 30:
		safety_counter += 1
		var balloon = DialogueManager.current_balloon
		if balloon and is_instance_valid(balloon) and balloon.has_method("advance_dialogue"):
			balloon.advance_dialogue()
		await _wait_physics_frames(2)
	await _wait_physics_frames(2)

func _cleanup_scene_for_shutdown(scene: Node) -> void:
	if scene and is_instance_valid(scene):
		if get_tree().current_scene == scene:
			get_tree().current_scene = null
		scene.queue_free()
	await _wait_physics_frames(6)

func _settle_audio_for_shutdown() -> void:
	if AudioBus.music_tween and AudioBus.music_tween.is_valid():
		AudioBus.music_tween.kill()
	AudioBus.music_tween = null
	if AudioBus.ambience_tween and AudioBus.ambience_tween.is_valid():
		AudioBus.ambience_tween.kill()
	AudioBus.ambience_tween = null

	var managed_players: Array[AudioStreamPlayer] = []
	for audio_player in AudioBus.music_players:
		managed_players.append(audio_player)
		audio_player.stop()
		audio_player.stream = null
	for audio_player in AudioBus.ambience_players:
		managed_players.append(audio_player)
		audio_player.stop()
		audio_player.stream = null
	for child in AudioBus.get_children():
		if child is AudioStreamPlayer and not managed_players.has(child):
			child.stop()
			child.queue_free()
	await _wait_physics_frames(12)

func _wait_physics_frames(count: int) -> void:
	for _i in range(count):
		await get_tree().physics_frame

func _fail(reason: String) -> void:
	printerr("[SAFETY TEST FAILED] ", reason)
	get_tree().quit(1)
