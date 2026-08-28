extends Camera2D

@export var drift_x: float = 2.4
@export var drift_y: float = 1.5
@export var drift_speed: float = 0.19
@export var breathing_zoom: float = 0.0025

var _time: float = 0.0
var _base_zoom: Vector2 = Vector2.ONE

func _ready() -> void:
	_base_zoom = zoom

func _process(delta: float) -> void:
	_time += delta
	offset = Vector2(
		sin(_time * drift_speed) * drift_x + sin(_time * drift_speed * 0.43) * drift_x * 0.35,
		cos(_time * drift_speed * 0.71) * drift_y
	)
	var breath := sin(_time * 0.16) * breathing_zoom
	zoom = _base_zoom * (1.0 + breath)
