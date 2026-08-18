# res://src/autoload/atmosphere_controller.gd
extends Node

var post_process_layer: CanvasLayer
var post_process_rect: ColorRect
var current_material: ShaderMaterial
var atmosphere_tween: Tween = null

var film_grain_shader = preload("res://src/common/shaders/film_grain_atmosphere.gdshader")

func _ready() -> void:
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

func _get_sanity_profile(value: int) -> Dictionary:
	var distress = 1.0 - clamp(float(value) / 100.0, 0.0, 1.0)
	return {
		"vignette": lerp(0.35, 0.72, distress),
		"grain": lerp(0.03, 0.11, distress),
		"desaturation": lerp(0.22, 0.56, distress),
		"tint": Color(0.85, 0.9, 0.95).lerp(Color(0.55, 0.72, 0.62), distress),
		"tint_strength": lerp(0.08, 0.24, distress)
	}

func _apply_sanity_atmosphere(value: int, duration: float) -> void:
	var profile = _get_sanity_profile(value)
	if duration <= 0.0:
		set_atmosphere(
			profile["vignette"],
			profile["grain"],
			profile["desaturation"],
			profile["tint"],
			profile["tint_strength"]
		)
		return
	
	if atmosphere_tween and atmosphere_tween.is_valid():
		atmosphere_tween.kill()
	
	var current_vignette = float(current_material.get_shader_parameter("vignette_intensity"))
	var current_grain = float(current_material.get_shader_parameter("grain_amount"))
	var current_desaturation = float(current_material.get_shader_parameter("desaturation"))
	var current_tint: Color = current_material.get_shader_parameter("tint_color")
	var current_tint_strength = float(current_material.get_shader_parameter("tint_strength"))
	
	atmosphere_tween = create_tween().set_parallel(true)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("vignette_intensity", v), current_vignette, profile["vignette"], duration)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("grain_amount", v), current_grain, profile["grain"], duration)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("desaturation", v), current_desaturation, profile["desaturation"], duration)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("tint_color", v), current_tint, profile["tint"], duration)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("tint_strength", v), current_tint_strength, profile["tint_strength"], duration)

func horror_pulse(strength: float = 1.0) -> void:
	# A short perception spike for authored horror beats. It never permanently
	# overwrites the sanity profile; after the hit the image settles back to the
	# player's current mental state.
	strength = clamp(strength, 0.0, 1.5)
	if atmosphere_tween and atmosphere_tween.is_valid():
		atmosphere_tween.kill()
	
	var current_vignette = float(current_material.get_shader_parameter("vignette_intensity"))
	var current_grain = float(current_material.get_shader_parameter("grain_amount"))
	var current_desaturation = float(current_material.get_shader_parameter("desaturation"))
	var current_tint: Color = current_material.get_shader_parameter("tint_color")
	var current_tint_strength = float(current_material.get_shader_parameter("tint_strength"))
	var pulse_tint = Color(0.48, 0.78, 0.69)
	
	atmosphere_tween = create_tween().set_parallel(true)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("vignette_intensity", v), current_vignette, min(0.95, current_vignette + 0.18 * strength), 0.12)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("grain_amount", v), current_grain, min(0.2, current_grain + 0.08 * strength), 0.12)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("desaturation", v), current_desaturation, min(0.85, current_desaturation + 0.22 * strength), 0.12)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("tint_color", v), current_tint, pulse_tint, 0.12)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("tint_strength", v), current_tint_strength, min(0.42, current_tint_strength + 0.18 * strength), 0.12)
	await atmosphere_tween.finished
	_apply_sanity_atmosphere(Sanity.current_sanity, 0.8)

func tween_atmosphere(target_vignette: float, target_desaturation: float, duration: float = 2.0) -> void:
	if atmosphere_tween and atmosphere_tween.is_valid():
		atmosphere_tween.kill()
	
	var current_vignette = float(current_material.get_shader_parameter("vignette_intensity"))
	var current_desaturation = float(current_material.get_shader_parameter("desaturation"))
	
	atmosphere_tween = create_tween().set_parallel(true)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("vignette_intensity", v), current_vignette, target_vignette, duration)
	atmosphere_tween.tween_method(func(v): current_material.set_shader_parameter("desaturation", v), current_desaturation, target_desaturation, duration)
