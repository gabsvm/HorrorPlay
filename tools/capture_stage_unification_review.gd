# res://tools/capture_stage_unification_review.gd
extends Node

const SCREENSHOTS_DIR: String = "res://docs/screenshots"

var rooms: Array[Dictionary] = [
	{
		"name": "stage_01_office_reference.png",
		"scene": "res://src/rooms/room_01_office/room_01_office.tscn",
		"setup": "_setup_office"
	},
	{
		"name": "stage_02_streets_full.png",
		"scene": "res://src/rooms/room_02_streets/room_02_streets.tscn",
		"setup": "_setup_streets"
	},
	{
		"name": "stage_03_tavern_full.png",
		"scene": "res://src/rooms/room_03_tavern/room_03_tavern.tscn",
		"setup": "_setup_tavern"
	},
	{
		"name": "stage_04_docks_full.png",
		"scene": "res://src/rooms/room_04_docks/room_04_docks.tscn",
		"setup": "_setup_docks"
	},
	{
		"name": "stage_05_boathouse_fuse.png",
		"scene": "res://src/rooms/room_05_boathouse/room_05_boathouse.tscn",
		"setup": "_setup_boathouse"
	},
	{
		"name": "stage_06_reef_final.png",
		"scene": "res://src/rooms/room_06_reef/room_06_reef.tscn",
		"setup": "_setup_reef"
	}
]

func _ready() -> void:
	print("[STAGE CAPTURE] Starting Stage Art Unification screenshot capture...")
	var dir = DirAccess.open("res://docs")
	if dir and not dir.dir_exists("screenshots"):
		dir.make_dir("screenshots")
	call_deferred("_run_capture_sequence")

func _run_capture_sequence() -> void:
	for item in rooms:
		var scene_res = load(item["scene"]) as PackedScene
		if not scene_res:
			printerr("Failed to load scene: ", item["scene"])
			continue
		var room_instance = scene_res.instantiate()
		get_tree().root.add_child(room_instance)
		await _wait_frames(30)
		
		call(item["setup"], room_instance)
		await _wait_frames(30)
		
		_capture(item["name"])
		await _wait_frames(10)
		room_instance.queue_free()
		await _wait_frames(10)
		
	print("[STAGE CAPTURE] All stage unification review screenshots captured successfully!")
	get_tree().quit(0)

func _setup_office(room: Node) -> void:
	var player = room.get_node_or_null("CharactersLayer/Player") as Player
	if player:
		player.global_position = Vector2(665, 825)
		var sprite = player.get_node_or_null("VisualRoot/AnimatedSprite2D") as AnimatedSprite2D
		if sprite:
			sprite.play(&"idle")

func _setup_streets(room: Node) -> void:
	var player = room.get_node_or_null("CharactersLayer/Player") as Player
	if player:
		player.global_position = Vector2(750, 785)
		var sprite = player.get_node_or_null("VisualRoot/AnimatedSprite2D") as AnimatedSprite2D
		if sprite:
			sprite.play(&"idle")

func _setup_tavern(room: Node) -> void:
	var player = room.get_node_or_null("CharactersLayer/Player") as Player
	if player:
		player.global_position = Vector2(960, 815)
		var sprite = player.get_node_or_null("VisualRoot/AnimatedSprite2D") as AnimatedSprite2D
		if sprite:
			sprite.play(&"idle")

func _setup_docks(room: Node) -> void:
	var player = room.get_node_or_null("CharactersLayer/Player") as Player
	if player:
		player.global_position = Vector2(1000, 780)
		var sprite = player.get_node_or_null("VisualRoot/AnimatedSprite2D") as AnimatedSprite2D
		if sprite:
			sprite.play(&"walk")
			sprite.frame = 1

func _setup_boathouse(room: Node) -> void:
	GameState.set_flag("boathouse_power_on", true)
	if room.has_method("_apply_power_state"):
		room._apply_power_state(false)
	var player = room.get_node_or_null("CharactersLayer/Player") as Player
	if player:
		player.global_position = Vector2(660, 790)
		var sprite = player.get_node_or_null("VisualRoot/AnimatedSprite2D") as AnimatedSprite2D
		if sprite:
			sprite.play(&"use_mid")
			sprite.frame = 3

func _setup_reef(room: Node) -> void:
	var glow = room.get_node_or_null("UnderwaterGlow")
	if glow:
		glow.energy = 0.55

func _wait_frames(count: int) -> void:
	for _i in range(count):
		await get_tree().process_frame

func _capture(filename: String) -> void:
	var img = get_viewport().get_texture().get_image()
	if img and not img.is_empty():
		var save_path = ProjectSettings.globalize_path(SCREENSHOTS_DIR.path_join(filename))
		img.save_png(save_path)
		print("[STAGE CAPTURE] Saved: ", save_path)
	else:
		print("[STAGE CAPTURE] Warning: empty image for ", filename)
