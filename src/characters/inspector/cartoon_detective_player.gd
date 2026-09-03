# res://src/characters/inspector/cartoon_detective_player.gd
extends "res://src/characters/inspector/inspector.gd"

func get_visible_silhouette_height() -> float:
	if not animated_sprite or not visual_root:
		return 0.0
	var frames := animated_sprite.sprite_frames
	if not frames or not frames.has_animation(&"idle") or frames.get_frame_count(&"idle") == 0:
		return 0.0
	var texture := frames.get_frame_texture(&"idle", 0)
	if not texture:
		return 0.0
	var image := texture.get_image()
	if not image or image.is_empty():
		return 0.0
	var used_rect := image.get_used_rect()
	return float(used_rect.size.y) * absf(animated_sprite.scale.y) * absf(visual_root.scale.y)
