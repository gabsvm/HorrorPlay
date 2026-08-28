extends Node2D

@export var streak_count: int = 44
@export var speed_min: float = 26.0
@export var speed_max: float = 54.0

var _drops: Array[Dictionary] = []
var _rng := RandomNumberGenerator.new()

const WINDOW_MIN := Vector2(35, 35)
const WINDOW_MAX := Vector2(139, 199)

func _ready() -> void:
	_rng.seed = 31747
	for i in range(streak_count):
		_drops.append(_new_drop(true))
	queue_redraw()

func _process(delta: float) -> void:
	var redraw := false
	for i in range(_drops.size()):
		var drop := _drops[i]
		drop.pos += Vector2(-3.0, drop.speed) * delta
		if drop.pos.y > WINDOW_MAX.y:
			drop = _new_drop(false)
		_drops[i] = drop
		redraw = true
	if redraw:
		queue_redraw()

func _draw() -> void:
	for drop in _drops:
		var p: Vector2 = drop.pos
		var length: float = drop.length
		var alpha: float = drop.alpha
		draw_line(p, p + Vector2(-1.0, length), Color(0.56,0.79,0.86,alpha), 1.0)

func _new_drop(random_y: bool) -> Dictionary:
	return {
		"pos": Vector2(
			_rng.randf_range(WINDOW_MIN.x, WINDOW_MAX.x),
			_rng.randf_range(WINDOW_MIN.y, WINDOW_MAX.y) if random_y else WINDOW_MIN.y
		),
		"speed": _rng.randf_range(speed_min, speed_max),
		"length": _rng.randf_range(3.0, 8.0),
		"alpha": _rng.randf_range(0.18, 0.48)
	}
