extends Node

var trigger_count: int = 0

func _ready() -> void:
	print("[SAFETY TEST] Initializing interaction cancellation regression...")
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
	get_tree().quit(0)

func _on_probe_interacted(_verb: String) -> void:
	trigger_count += 1

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

func _wait_physics_frames(count: int) -> void:
	for _i in range(count):
		await get_tree().physics_frame

func _fail(reason: String) -> void:
	printerr("[SAFETY TEST FAILED] ", reason)
	get_tree().quit(1)
