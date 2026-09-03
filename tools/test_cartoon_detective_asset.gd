# res://tools/test_cartoon_detective_asset.gd
extends Node

const EXPECTED_PREFIX := "res://assets/third_party/cartoon_detective_pack/"
const REQUIRED_ANIMATIONS := [
	&"idle", &"idle_uneasy", &"walk", &"turn", &"inspect", &"use_mid",
	&"pickup_low", &"react", &"hide_enter", &"hide_hold", &"hide_exit"
]

func _ready() -> void:
	call_deferred("_run")

func _run() -> void:
	var packed := load("res://src/characters/inspector/inspector.tscn") as PackedScene
	if not packed:
		_fail("Inspector scene could not be loaded")
		return
	var player := packed.instantiate() as Player
	add_child(player)
	await get_tree().process_frame

	var frames := player.animated_sprite.sprite_frames
	var idle_texture := frames.get_frame_texture(&"idle", 0)
	if not idle_texture or not idle_texture.resource_path.begins_with(EXPECTED_PREFIX):
		_fail("Inspector still uses generated/procedural art instead of Cartoon Detective Pack: %s" % (idle_texture.resource_path if idle_texture else "null"))
		return

	if frames.get_frame_count(&"idle") != 4:
		_fail("Cartoon Detective idle must use the authored 4-frame Idle cycle")
		return
	if frames.get_frame_count(&"walk") != 8:
		_fail("Cartoon Detective walk must use the authored 8-frame Run cycle")
		return

	for animation_name in REQUIRED_ANIMATIONS:
		if not frames.has_animation(animation_name):
			_fail("Required Inspector animation missing after Cartoon Detective integration: %s" % animation_name)
			return
		for frame_index in range(frames.get_frame_count(animation_name)):
			var texture := frames.get_frame_texture(animation_name, frame_index)
			if not texture or not texture.resource_path.begins_with(EXPECTED_PREFIX):
				_fail("Animation %s frame %d falls back to old/generated Inspector art" % [animation_name, frame_index])
				return

	var image := idle_texture.get_image()
	var used_rect := image.get_used_rect()
	if used_rect.size.y <= 0:
		_fail("Cartoon Detective idle alpha bounding box is empty")
		return
	var expected_height := float(used_rect.size.y) * absf(player.animated_sprite.scale.y) * absf(player.visual_root.scale.y)
	var reported_height := player.get_visible_silhouette_height()
	if absf(expected_height - reported_height) > 1.0:
		_fail("Visible silhouette height must come from the real alpha bounds: expected %.2f, got %.2f" % [expected_height, reported_height])
		return

	var texture_height := float(image.get_height())
	var used_bottom := float(used_rect.position.y + used_rect.size.y)
	var bottom_local := player.animated_sprite.position.y + (used_bottom - texture_height * 0.5) * player.animated_sprite.scale.y
	if absf(bottom_local) > 2.0:
		_fail("Cartoon Detective boots are not grounded on actor origin: local bottom %.2f" % bottom_local)
		return

	player.queue_free()
	await get_tree().process_frame
	print("[CARTOON DETECTIVE TEST] Asset source, animation set, alpha sizing and grounding passed.")
	get_tree().quit(0)

func _fail(reason: String) -> void:
	printerr("[CARTOON DETECTIVE TEST FAILED] ", reason)
	get_tree().quit(1)
