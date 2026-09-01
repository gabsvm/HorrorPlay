extends Node

const FOREIGN_LOCK: StringName = &"hud_input_probe"

func _ready() -> void:
	print("[HUD INPUT TEST] Initializing blocked inventory-hotkey regression...")
	call_deferred("_run")

func _run() -> void:
	SaveSystem.reset_runtime_state()

	var office = load("res://src/rooms/room_01_office/room_01_office.tscn").instantiate()
	get_tree().root.add_child(office)
	get_tree().current_scene = office
	await _wait_physics_frames(6)

	var hud = office.find_child("UI_HUD*", true, false)
	if not hud:
		_fail("HUD not found")
		return
	var inventory_menu = hud.get_node_or_null("InventoryMenu")
	if not inventory_menu:
		_fail("InventoryMenu not found")
		return
	if inventory_menu.visible:
		_fail("Inventory unexpectedly visible before hotkey probe")
		return
	if InputController.is_input_blocked:
		_fail("Unexpected input lock before hotkey probe")
		return

	InputController.acquire_input_lock(FOREIGN_LOCK)
	var audio_children_before := AudioBus.get_child_count()

	var inventory_event := InputEventKey.new()
	inventory_event.keycode = KEY_I
	inventory_event.pressed = true
	hud._unhandled_input(inventory_event)

	var audio_children_after := AudioBus.get_child_count()
	if inventory_menu.visible:
		_fail("Inventory opened while a foreign subsystem owned input")
		return
	if not InputController.is_input_locked_by(FOREIGN_LOCK):
		_fail("Inventory hotkey disturbed the foreign input owner")
		return
	if audio_children_after != audio_children_before:
		_fail("Inventory-open SFX fired even though the foreign lock rejected opening")
		return

	InputController.release_input_lock(FOREIGN_LOCK)
	print("[HUD INPUT TEST] PASS: blocked inventory hotkey is silent and non-destructive")
	await _cleanup(office)
	await _settle_audio_for_shutdown()
	get_tree().quit(0)

func _cleanup(office: Node) -> void:
	InputController.release_input_lock(FOREIGN_LOCK)
	if is_instance_valid(office):
		if get_tree().current_scene == office:
			get_tree().current_scene = null
		office.queue_free()
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
	InputController.release_input_lock(FOREIGN_LOCK)
	printerr("[HUD INPUT TEST FAILED] ", reason)
	get_tree().quit(1)
