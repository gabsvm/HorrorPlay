# res://tools/capture_real_motion_review.gd
extends Node

const SCREENSHOTS_DIR: String = "res://docs/screenshots"

var room_scene: PackedScene = preload("res://src/rooms/room_01_office/room_01_office.tscn")
var office: Room = null
var player: Player = null
var desk: Hotspot = null
var drawer: Hotspot = null

var recorded_walk_right_frames: Array[Image] = []
var recorded_walk_left_frames: Array[Image] = []
var recorded_key_flow_frames: Array[Image] = []

func _ready() -> void:
	print("[MOTION REVIEW] Starting real physical motion review & capture...")
	var dir = DirAccess.open("res://docs")
	if dir and not dir.dir_exists("screenshots"):
		dir.make_dir("screenshots")

	call_deferred("_run_review_choreography")

func _run_review_choreography() -> void:
	office = room_scene.instantiate() as Room
	get_tree().root.add_child(office)
	await _wait_frames(25)

	player = office.get_node_or_null("CharactersLayer/Player") as Player
	desk = office.get_node_or_null("HotspotsLayer/Desk") as Hotspot
	drawer = office.get_node_or_null("HotspotsLayer/Drawer") as Hotspot

	if not player or not desk or not drawer:
		printerr("[MOTION REVIEW] Failed to find required nodes in room_01_office")
		get_tree().quit(1)
		return

	# =========================================================================
	# PHASE 1: Real Physical Walk Left -> Right (320 to 980)
	# =========================================================================
	print("[MOTION REVIEW] Phase 1: Physical walk left -> right...")
	player.global_position = Vector2(320, 825)
	player.set_depth_scale(1.0)
	await _wait_frames(10)

	# Command player to walk using physical pathfinding
	player.set_target_position(Vector2(980, 825))
	
	# Sample motion at acceleration
	await _wait_frames(8)
	_capture_named("01_motion_walk_right_accel.png")
	_record_frame(recorded_walk_right_frames)

	# Record mid-stride while in motion
	var timeout = 0
	var mid_captured = false
	while player.is_moving and timeout < 240:
		timeout += 1
		await _wait_frames(2)
		_record_frame(recorded_walk_right_frames)
		if not mid_captured and player.global_position.x > 620:
			_capture_named("02_motion_walk_right_mid_stride.png")
			mid_captured = true

	# Wait until player brakes to arrival
	_capture_named("03_motion_walk_right_braking.png")
	_record_frame(recorded_walk_right_frames)
	await _wait_frames(15)

	# =========================================================================
	# PHASE 2: Real Physical Turn & Walk Right -> Left (980 to 320)
	# =========================================================================
	print("[MOTION REVIEW] Phase 2: Physical turn & walk right -> left...")
	player.set_target_position(Vector2(320, 825))

	# Capture during turn state / initial leftward step
	await _wait_frames(6)
	_capture_named("04_motion_turn_facing_left.png")
	_record_frame(recorded_walk_left_frames)

	timeout = 0
	var left_mid_captured = false
	while player.is_moving and timeout < 240:
		timeout += 1
		await _wait_frames(2)
		_record_frame(recorded_walk_left_frames)
		if not left_mid_captured and player.global_position.x < 750:
			_capture_named("05_motion_walk_left_stride.png")
			left_mid_captured = true

	await _wait_frames(15)

	# =========================================================================
	# PHASE 3: Real Hotspot Walk to Desk & Acquire Rusty Key
	# =========================================================================
	print("[MOTION REVIEW] Phase 3: Walk to desk & obtain Rusty Key...")
	var desk_pos = office.get_viewport().get_canvas_transform() * desk.get_center_position()
	InputController.interaction_requested.emit("interact", desk_pos)
	
	# Wait for dialogue to appear and dismiss it
	await _wait_for_dialogue()
	await _dismiss_dialogue()
	await _wait_frames(10)
	_capture_named("06_motion_at_desk_key_obtained.png")

	# =========================================================================
	# PHASE 4: Full Rusty Key Use Sequence on Drawer
	# =========================================================================
	print("[MOTION REVIEW] Phase 4: Full Rusty Key use flow on Drawer...")
	var key_item: ItemData = office.key_item
	if not key_item or not Inventory.has_item(key_item.id):
		printerr("[MOTION REVIEW] Key item not in inventory after desk interaction!")
		get_tree().quit(1)
		return

	# Arm key through inventory system
	Inventory.set_active_item(key_item)

	# Click Drawer hotspot with armed item
	var drawer_pos = office.get_viewport().get_canvas_transform() * drawer.get_center_position()
	InputController.interaction_requested.emit("interact", drawer_pos)

	# Wait for player to approach drawer
	timeout = 0
	while player.is_moving and timeout < 300:
		timeout += 1
		await _wait_frames(2)
		_record_frame(recorded_key_flow_frames)

	_capture_named("07_motion_arriving_at_drawer.png")

	# Wait for use_mid contextual animation
	timeout = 0
	var mid_key_captured = false
	while timeout < 120:
		timeout += 1
		await _wait_frames(2)
		_record_frame(recorded_key_flow_frames)
		if not mid_key_captured and player.animated_sprite.animation == &"use_mid":
			_capture_named("08_motion_rusty_key_use_mid.png")
			mid_key_captured = true
		if GameState.get_flag("office_drawer_unlocked"):
			break

	await _wait_frames(15)
	_capture_named("09_motion_drawer_unlocked_success.png")

	# Dismiss any post-unlock dialogue
	if DialogueManager.current_balloon:
		await _dismiss_dialogue()

	# Save animated clips (as multi-frame GIFs or stitched contact strips)
	_save_clip(recorded_walk_right_frames, "clip_walk_left_to_right.png")
	_save_clip(recorded_walk_left_frames, "clip_walk_right_to_left.png")
	_save_clip(recorded_key_flow_frames, "clip_rusty_key_full_flow.png")

	print("[MOTION REVIEW] ALL REAL PHYSICAL MOTION CAPTURES COMPLETED SUCCESSFULLY!")
	AudioBus.cleanup_for_shutdown()
	await _wait_frames(10)
	get_tree().quit(0)

func _wait_frames(count: int) -> void:
	for _i in range(count):
		await get_tree().process_frame

func _wait_for_dialogue(max_frames: int = 240) -> bool:
	for _i in range(max_frames):
		if DialogueManager.current_balloon != null:
			return true
		await get_tree().physics_frame
	return false

func _dismiss_dialogue() -> void:
	var safety = 0
	while DialogueManager.current_balloon != null and safety < 60:
		safety += 1
		var b = DialogueManager.current_balloon
		if b and is_instance_valid(b) and b.has_method("advance_dialogue"):
			b.advance_dialogue()
		await _wait_frames(4)
	await _wait_frames(6)

func _capture_named(filename: String) -> void:
	var img = get_viewport().get_texture().get_image()
	if img and not img.is_empty():
		var save_path = ProjectSettings.globalize_path(SCREENSHOTS_DIR.path_join(filename))
		img.save_png(save_path)
		print("[MOTION REVIEW] Saved screenshot: ", save_path)

func _record_frame(buffer: Array[Image]) -> void:
	var img = get_viewport().get_texture().get_image()
	if img and not img.is_empty():
		buffer.append(img)

func _save_clip(buffer: Array[Image], filename: String) -> void:
	if buffer.is_empty():
		return
	# Sample up to 6 evenly spaced keyframes from the recorded buffer
	var count = min(6, buffer.size())
	var step = max(1, buffer.size() / count)
	var sample_imgs: Array[Image] = []
	for i in range(count):
		var idx = min(i * step, buffer.size() - 1)
		sample_imgs.append(buffer[idx])

	# Stitch horizontally into a 1/4-scale cinematic motion sequence strip
	var thumb_w = 480
	var thumb_h = 270
	var strip = Image.create(thumb_w * count, thumb_h, false, Image.FORMAT_RGBA8)
	for i in range(count):
		var src = sample_imgs[i]
		var thumb = Image.new()
		thumb.copy_from(src)
		thumb.convert(Image.FORMAT_RGBA8)
		thumb.resize(thumb_w, thumb_h, Image.INTERPOLATE_BILINEAR)
		strip.blit_rect(thumb, Rect2i(0, 0, thumb_w, thumb_h), Vector2i(i * thumb_w, 0))

	var save_path = ProjectSettings.globalize_path(SCREENSHOTS_DIR.path_join(filename))
	strip.save_png(save_path)
	print("[MOTION REVIEW] Saved motion sequence strip: ", save_path)
