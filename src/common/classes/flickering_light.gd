# res://src/common/classes/flickering_light.gd
extends PointLight2D

@export var min_energy: float = 0.6
@export var max_energy: float = 1.3
@export var speed: float = 8.0

var time: float = 0.0

func _process(delta: float) -> void:
	time += delta * speed
	# Superimpose multiple sine waves to generate organic, pseudo-random flickers
	var noise = sin(time) * cos(time * 0.73) + sin(time * 2.3) * cos(time * 1.5)
	energy = lerp(min_energy, max_energy, (noise + 2.0) / 4.0)
