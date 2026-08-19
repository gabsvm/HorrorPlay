# res://src/common/ui/dialogue_balloon.gd
extends Control

signal dialogue_finished

@onready var panel: Panel = $Panel
@onready var speaker_label: Label = $Panel/SpeakerLabel
@onready var text_label: RichTextLabel = $Panel/TextLabel
@onready var choices_container: VBoxContainer = $Panel/ChoicesContainer
@onready var next_indicator: Label = $Panel/NextIndicator

var dialog_lines: Array[String] = []
var current_line_index: int = 0
var speaker_name: String = ""
var is_typing: bool = false
var choices_list: Array[Dictionary] = []
var selected_choice: Dictionary = {}
var is_choice_mode: bool = false
var last_visible_chars: int = 0
var synth_player: AudioStreamPlayer
var beep_stream: AudioStreamWAV
var typing_canceled: bool = false

func _ready() -> void:
	next_indicator.visible = false
	choices_container.visible = false
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var style_box = StyleBoxFlat.new()
	style_box.bg_color = Color(0.025, 0.026, 0.031, 0.955)
	style_box.border_width_top = 2
	style_box.border_width_bottom = 2
	style_box.border_color = Color(0.42, 0.34, 0.23, 0.82)
	style_box.content_margin_left = 60
	style_box.content_margin_right = 60
	style_box.content_margin_top = 28
	style_box.content_margin_bottom = 28
	panel.add_theme_stylebox_override("panel", style_box)
	var custom_font = load("res://assets/fonts/SpecialElite-Regular.ttf")
	if custom_font:
		speaker_label.add_theme_font_override("font", custom_font)
		text_label.add_theme_font_override("normal_font", custom_font)
		next_indicator.add_theme_font_override("font", custom_font)
	_setup_synth()

func _setup_synth() -> void:
	synth_player = AudioStreamPlayer.new()
	for i in AudioServer.bus_count:
		if AudioServer.get_bus_name(i) == "SFX":
			synth_player.bus = &"SFX"
			break
	synth_player.volume_db = -16.0
	add_child(synth_player)
	beep_stream = AudioStreamWAV.new()
	beep_stream.format = AudioStreamWAV.FORMAT_16_BITS
	beep_stream.mix_rate = 12000
	beep_stream.stereo = false
	var sample_count := 230
	var data = PackedByteArray()
	data.resize(sample_count * 2)
	for i in range(sample_count):
		var t = float(i) / float(beep_stream.mix_rate)
		var envelope = pow(max(0.0, 1.0 - float(i) / float(sample_count)), 2.6)
		var value = (sin(TAU * 128.0 * t) * 0.65 + sin(TAU * 191.0 * t) * 0.2) * envelope * 0.22
		var sample = int(clamp(value, -1.0, 1.0) * 32767.0)
		data[i * 2] = sample & 0xff
		data[i * 2 + 1] = (sample >> 8) & 0xff
	beep_stream.data = data

func _process(_delta: float) -> void:
	if is_typing and text_label and text_label.visible_characters != last_visible_chars:
		last_visible_chars = text_label.visible_characters
		if last_visible_chars % 3 == 0:
			_play_typewriter_sound()

func _play_typewriter_sound() -> void:
	if not synth_player or not beep_stream:
		return
	if speaker_name == "Pescador Sombrío" or speaker_name == "Silas":
		synth_player.pitch_scale = randf_range(0.58, 0.68)
	elif speaker_name == "Tabernero" or speaker_name == "Tabernero Barnaby":
		synth_player.pitch_scale = randf_range(0.68, 0.77)
	elif speaker_name == "Clientes":
		synth_player.pitch_scale = randf_range(0.72, 0.9)
	elif speaker_name == "Transmisión 317":
		synth_player.pitch_scale = randf_range(0.45, 0.6)
	elif speaker_name == "Sistema" or speaker_name == "Save":
		synth_player.pitch_scale = randf_range(1.05, 1.14)
	else:
		synth_player.pitch_scale = randf_range(0.88, 1.0)
	synth_player.stream = beep_stream
	synth_player.play()

func start_dialogue(lines: Array[String], speaker: String) -> void:
	dialog_lines = lines
	speaker_name = speaker
	current_line_index = 0
	is_choice_mode = false
	selected_choice = {}
	choices_container.visible = false
	_show_current_line()

func start_choices(prompt: String, choices: Array[Dictionary], speaker: String) -> void:
	dialog_lines = [prompt]
	speaker_name = speaker
	current_line_index = 0
	choices_list = choices
	selected_choice = {}
	is_choice_mode = true
	choices_container.visible = false
	_show_current_line()

func _show_current_line() -> void:
	speaker_label.text = speaker_name
	next_indicator.visible = false
	choices_container.visible = false
	_type_text(dialog_lines[current_line_index])

func _type_text(text_to_type: String) -> void:
	text_label.text = text_to_type
	text_label.visible_characters = 0
	last_visible_chars = 0
	is_typing = true
	typing_canceled = false
	var parsed_text = text_label.get_parsed_text()
	while text_label.visible_characters < parsed_text.length():
		if typing_canceled:
			break
		text_label.visible_characters += 1
		last_visible_chars = text_label.visible_characters
		var current_char = parsed_text[text_label.visible_characters - 1]
		var delay = 0.018
		if current_char in [".", "!", "?", "…"]:
			delay = 0.31
		elif current_char in [",", ";", ":", "-"]:
			delay = 0.13
		elif current_char == " ":
			delay = 0.008
		await get_tree().create_timer(delay).timeout
	_on_typing_finished()

func _on_typing_finished() -> void:
	if not is_typing:
		return
	is_typing = false
	if is_choice_mode and current_line_index == dialog_lines.size() - 1:
		_display_choices()
	else:
		next_indicator.visible = true

func _display_choices() -> void:
	next_indicator.visible = false
	choices_container.visible = true
	for child in choices_container.get_children():
		child.queue_free()
	for i in range(choices_list.size()):
		var choice = choices_list[i]
		if not _choice_available(choice):
			continue
		var btn = Button.new()
		btn.text = choice.get("text", "...")
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.custom_minimum_size = Vector2(0, 48)
		btn.add_theme_font_size_override("font_size", 19)
		btn.theme_type_variation = &"FlatButton"
		btn.pressed.connect(func(): _on_choice_selected(choice))
		choices_container.add_child(btn)

func _choice_available(choice: Dictionary) -> bool:
	if choice.has("sanity_min") and Sanity.current_sanity < int(choice["sanity_min"]):
		return false
	if choice.has("sanity_max") and Sanity.current_sanity > int(choice["sanity_max"]):
		return false
	if choice.has("required_evidence"):
		var required_evidence = choice["required_evidence"]
		if required_evidence is Array:
			for evidence_id in required_evidence:
				if not Investigation.has_evidence(str(evidence_id)):
					return false
		else:
			if not Investigation.has_evidence(str(required_evidence)):
				return false
	if choice.has("required_flag"):
		var required_flag = choice["required_flag"]
		if required_flag is Array:
			for flag_name in required_flag:
				if not GameState.get_flag(str(flag_name)):
					return false
		else:
			if not GameState.get_flag(str(required_flag)):
				return false
	if choice.has("forbidden_flag"):
		var forbidden_flag = choice["forbidden_flag"]
		if forbidden_flag is Array:
			for flag_name in forbidden_flag:
				if GameState.get_flag(str(flag_name)):
					return false
		else:
			if GameState.get_flag(str(forbidden_flag)):
				return false
	if choice.has("required_item_id") and not Inventory.has_item(str(choice["required_item_id"])):
		return false
	if choice.has("variable_equals") and choice["variable_equals"] is Dictionary:
		for variable_name in choice["variable_equals"]:
			if GameState.get_var(str(variable_name)) != choice["variable_equals"][variable_name]:
				return false
	return true

func _on_choice_selected(choice: Dictionary) -> void:
	choices_container.visible = false
	selected_choice = choice
	dialogue_finished.emit()

func _input(event: InputEvent) -> void:
	if is_choice_mode and choices_container.visible:
		return
	var is_advance_input = false
	if event is InputEventMouseButton and event.is_pressed() and event.button_index == MOUSE_BUTTON_LEFT:
		is_advance_input = true
	elif event is InputEventScreenTouch and not event.pressed:
		is_advance_input = true
	if is_advance_input:
		get_viewport().set_input_as_handled()
		if is_typing:
			typing_canceled = true
			text_label.visible_characters = text_label.get_parsed_text().length()
			_on_typing_finished()
		else:
			current_line_index += 1
			if current_line_index < dialog_lines.size():
				_show_current_line()
			else:
				dialogue_finished.emit()
