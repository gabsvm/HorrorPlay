# res://src/autoload/atmosphere_controller.gd
extends Node

var post_process_layer: CanvasLayer
var post_process_rect: ColorRect
var current_material: ShaderMaterial
var atmosphere_tween: Tween = null

var film_grain_shader = preload("res://src/common/shaders/film_grain_atmosphere.gdshader")

func _ready() -> void:
	# Persistent post-process layer below gameplay UI but above the world.
	post_process_layer = CanvasLayer.new()
	post_process_layer.layer = 5
	
	post_process_rect = ColorRect.new()
	post_process_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	post_process_rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	
	current_material = ShaderMaterial.new()
	current_material.shader = film_grain_shader
	post_process_rect.material = current_material
	
	post_process_layer.add_child(post_process_rect)
	add_child(post_process_layer)
	
	set_atmosphere(0.35, 0.03, 0.22, Color(0.85, 0.9, 0.95), 0.08)
	
	if not Sanity.sanity_changed.is_connected(_on_sanity_changed):
		Sanity.sanity_changed.connect(_on_sanity_changed)
	_apply_sanity_atmosphere(Sanity.current_sanity, 0.0)

func set_atmosphere(vignette_intensity: float, grain_amount: float, desaturation: float, tint_color: Color, tint_strength: float) -> void:
	current_material.set_shader_parameter("vignette_intensity", vignette_intensity)
	current_material.set_shader_parameter("grain_amount", grain_amount)
	current_material.set_shader_parameter("desaturation", desaturation)
	current_material.set_shader_parameter("tint_color", tint_color)
	current_material.set_shader_parameter("tint_strength", tint_strength)

func _on_sanity_changed(value: int) -> void:
	_apply_sanity_atmosphere(value, 0.9)

func _apply_sanity_atmosphere(value: int, duration: float) -> void:
	# Sanity is now a perception system rather than a number that only moves a HUD bar.
	# The effect stays restrained while stable and progressively contaminates image
	# contrast, grain and color as the investigator becomes less reliable.
	var distress = 1.0 - clamp(float(value) / 100.0, 0.0, 1.0)
	var target_vignette = lerp(0.35, 0.72, distress)
	var target_grain = lerp(0.03, 0.11, distress)
	var target_desaturation = lerp(0.22, 0.56, distress)
	var target_tint = Color(0.85, 0.9, 0.95).lerp(Color(0.55, 0.72, 0.62), distress)
	var target_tint_strength = lerp(0.08, 0.24, distress)
	
	if duration <= 0.0:
		set_atmosphere(target_vignette, target_grain, target_desaturation, target_tint, target_tint_strength)
		return
	
	if atmosphere_tween and atmosphere_tween.is_valid():
		atmosphere_tween.kill()
	
	var current_vignette = float(current_material.get_shader_parameter("vignette_intensity"))
	var current_grain = float(current_material.get_shader_parameter("grain_amount"))
	var current_desaturation = float(current_material.get_shader_parameter("desaturation"))
	var current_tint: Color = current_material.get_shader_parameter("tint_color")
	var current_tint_strength = float(current_material.get_shader_parameter("tint_strength"))
	
	atmosphere_tween = create_tween().set_parallel(true)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("vignette_intensity", v), current_vignette, target_vignette, duration)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("grain_amount", v), current_grain, target_grain, duration)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("desaturation", v), current_desaturation, target_desaturation, duration)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("tint_color", v), current_tint, target_tint, duration)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("tint_strength", v), current_tint_strength, target_tint_strength, duration)

func tween_atmosphere(target_vignette: float, target_desaturation: float, duration: float = 2.0) -> void:
	if atmosphere_tween and atmosphere_tween.is_valid():
		atmosphere_tween.kill()
	
	var current_vignette = float(current_material.get_shader_parameter("vignette_intensity"))
	var current_desaturation = float(current_material.get_shader_parameter("desaturation"))
	
	atmosphere_tween = create_tween().set_parallel(true)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("vignette_intensity", v), current_vignette, target_vignette, duration)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("desaturation", v), current_desaturation, target_desaturation, duration)
