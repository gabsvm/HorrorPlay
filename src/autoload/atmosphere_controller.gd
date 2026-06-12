# res://src/autoload/atmosphere_controller.gd
extends Node

var post_process_layer: CanvasLayer
var post_process_rect: ColorRect
var current_material: ShaderMaterial

var film_grain_shader = preload("res://src/common/shaders/film_grain_atmosphere.gdshader")

func _ready() -> void:
	# Create a persistent CanvasLayer for post-processing that renders on top of everything
	post_process_layer = CanvasLayer.new()
	post_process_layer.layer = 5 # Put it below UI (layer 10) but above everything else
	
	post_process_rect = ColorRect.new()
	post_process_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	# Use Anchor mode to cover full screen even on resize
	post_process_rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	
	current_material = ShaderMaterial.new()
	current_material.shader = film_grain_shader
	
	post_process_rect.material = current_material
	
	post_process_layer.add_child(post_process_rect)
	add_child(post_process_layer)
	
	# Default base values for Sanitarium-like vibe (toned down)
	set_atmosphere(0.35, 0.04, 0.3, Color(0.85, 0.9, 0.95), 0.1)

func set_atmosphere(vignette_intensity: float, grain_amount: float, desaturation: float, tint_color: Color, tint_strength: float) -> void:
	current_material.set_shader_parameter("vignette_intensity", vignette_intensity)
	current_material.set_shader_parameter("grain_amount", grain_amount)
	current_material.set_shader_parameter("desaturation", desaturation)
	current_material.set_shader_parameter("tint_color", tint_color)
	current_material.set_shader_parameter("tint_strength", tint_strength)

func tween_atmosphere(target_vignette: float, target_desaturation: float, duration: float = 2.0) -> void:
	var tween = create_tween().set_parallel(true)
	var current_vig = current_material.get_shader_parameter("vignette_intensity")
	var current_desat = current_material.get_shader_parameter("desaturation")
	
	# Handle nulls gracefully if parameters weren't set yet
	if current_vig == null: current_vig = 0.5
	if current_desat == null: current_desat = 0.4
	
	tween.tween_method(func(v): current_material.set_shader_parameter("vignette_intensity", v), current_vig, target_vignette, duration)
	tween.tween_method(func(v): current_material.set_shader_parameter("desaturation", v), current_desat, target_desaturation, duration)
