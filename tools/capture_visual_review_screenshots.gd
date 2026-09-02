# res://tools/capture_visual_review_screenshots.gd
extends Node

const SCREENSHOTS_DIR: String = "res://docs/screenshots"

var room_scene: PackedScene = preload("res://src/rooms/room_01_office/room_01_office.tscn")
var current_room: Node = null
var player: Player = null
var sprite: AnimatedSprite2D = null

func _ready() -> void:
	print("[CAPTURE] Starting runtime visual review screenshot capture...")
	var dir = DirAccess.open("res://docs")
	if dir and not dir.dir_exists("screenshots"):
		dir.make_dir("screenshots")
	
	call_deferred("_run_capture_sequence")

func _run_capture_sequence() -> void:
	current_room = room_scene.instantiate()
	get_tree().root.add_child(current_room)
	await _wait_frames(25)
	
	player = current_room.get_node_or_null("CharactersLayer/Player") as Player
	if not player:
		push_error("Player not found in room")
		get_tree().quit(1)
		return

	sprite = player.get_node_or_null("VisualRoot/AnimatedSprite2D") as AnimatedSprite2D
	if not sprite:
		push_error("AnimatedSprite2D not found")
		get_tree().quit(1)
		return

	# 1. Office completa
	await _wait_frames(15)
	_capture("01_office_completa.png")

	# 2. Inspector junto a ventana
	player.global_position = Vector2(280, 810)
	sprite.play(&"idle")
	await _wait_frames(20)
	_capture("02_inspector_junto_a_ventana.png")

	# 3. Inspector frente al desk
	player.global_position = Vector2(665, 825)
	sprite.play(&"idle")
	await _wait_frames(20)
	_capture("03_inspector_frente_al_desk.png")

	# 4. Inspector caminando
	player.global_position = Vector2(500, 820)
	sprite.play(&"walk")
	sprite.frame = 1 # Grounded stance foot
	await _wait_frames(10)
	_capture("04_inspector_caminando.png")

	# 5. Inspector junto al filing cabinet
	player.global_position = Vector2(1455, 825)
	sprite.play(&"idle")
	await _wait_frames(20)
	_capture("05_inspector_junto_al_filing_cabinet.png")

	# 6. Diálogo abierto
	DialogueManager.show_dialogue([
		"Massachusetts, 1926. Las notas del caso 47-B apuntan hacia los viejos muelles de Innsmouth.",
		"Debo encontrar la llave del archivador antes de que la niebla cubra la costa."
	], "Inspector")
	await _wait_frames(30)
	if DialogueManager.current_balloon and DialogueManager.current_balloon.has_method("advance_dialogue"):
		DialogueManager.current_balloon.advance_dialogue()
	await _wait_frames(20)
	_capture("06_dialogo_abierto.png")
	
	# Dismiss dialogue cleanly
	while DialogueManager.current_balloon != null:
		if DialogueManager.current_balloon.has_method("advance_dialogue"):
			DialogueManager.current_balloon.advance_dialogue()
		await _wait_frames(5)
	await _wait_frames(15)

	# 7. HUD superior
	_capture("07_hud_superior.png")

	# 8. Inventory abierto
	var hud = current_room.get_node_or_null("UILayer/UI_HUD")
	if current_room.key_item:
		Inventory.add_item(current_room.key_item)
	if hud and hud.inventory_menu:
		hud.inventory_menu.open_menu()
	await _wait_frames(25)
	_capture("08_inventory.png")
	if hud and hud.inventory_menu:
		hud.inventory_menu.close_menu()
	await _wait_frames(15)

	# 9. Rusty Key use sequence (use_mid animation at drawer)
	player.global_position = Vector2(1455, 825)
	sprite.play(&"use_mid")
	sprite.frame = 3
	await _wait_frames(15)
	_capture("09_rusty_key_use_sequence.png")

	print("[CAPTURE] All 9 visual review runtime screenshots captured successfully!")
	await _wait_frames(10)
	get_tree().quit(0)

func _wait_frames(count: int) -> void:
	for _i in range(count):
		await get_tree().process_frame

func _capture(filename: String) -> void:
	var img = get_viewport().get_texture().get_image()
	if img and not img.is_empty():
		var save_path = ProjectSettings.globalize_path(SCREENSHOTS_DIR.path_join(filename))
		img.save_png(save_path)
		print("[CAPTURE] Saved: ", save_path)
	else:
		print("[CAPTURE] Warning: viewport texture image is empty for ", filename)
