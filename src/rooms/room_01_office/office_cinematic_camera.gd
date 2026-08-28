extends Camera2D

# Pixel-safe camera drift for the 640x360 -> x3 Office benchmark. The offset is
# snapped to the 3 px display grid so the pixel art never shimmers between
# samples while the room still has a barely perceptible cinematic "breath".
@export var drift_x: float = 3.0
@export var drift_y: float = 3.0
@export var drift_speed: float = 0.10
@export var pixel_step: float = 3.0

var _time: float = 0.0

func _process(delta: float) -> void:
	_time += delta
	var raw := Vector2(
		sin(_time * drift_speed) * drift_x,
		cos(_time * drift_speed * 0.73) * drift_y
	)
	var step := max(1.0, pixel_step)
	offset = Vector2(
		round(raw.x / step) * step,
		round(raw.y / step) * step
	)
