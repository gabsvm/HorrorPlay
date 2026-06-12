# res://src/common/classes/flickering_light.gd
extends PointLight2D

@export var min_energy: float = 0.6
@export var max_energy: float = 1.3
@export var speed: float = 8.0

@export_group("Advanced Effects")
@export var scale_variation: float = 0.05
@export var color_shift: Color = Color.WHITE
@export var color_shift_intensity: float = 0.0

var time: float = 0.0
var base_scale: Vector2
var base_color: Color

func _ready() -> void:
	base_scale = scale
	base_color = color

func _process(delta: float) -> void:
	time += delta * speed
	# Superimpose multiple sine waves to generate organic, pseudo-random flickers
	var noise = sin(time) * cos(time * 0.73) + sin(time * 2.3) * cos(time * 1.5)
	var normalized_noise = (noise + 2.0) / 4.0
	
	energy = lerp(min_energy, max_energy, normalized_noise)
	
	if scale_variation > 0.0:
		scale = base_scale * (1.0 + (noise * scale_variation))
		
	if color_shift_intensity > 0.0:
		color = base_color.lerp(color_shift, normalized_noise * color_shift_intensity)
