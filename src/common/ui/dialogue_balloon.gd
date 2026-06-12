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
var current_tween: Tween

var choices_list: Array[Dictionary] = []
var is_choice_mode: bool = false

var last_visible_chars: int = 0
var synth_player: AudioStreamPlayer
var beep_stream: AudioStreamWAV
var typing_canceled: bool = false

func _ready() -> void:
	next_indicator.visible = false
	choices_container.visible = false
	# Ensure the balloon covers the full viewport or sits at the bottom nicely
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	
	# Style the flat gray panel with a gorgeous antique framed brass stylebox
	var style_box = StyleBoxFlat.new()
	style_box.bg_color = Color(0.06, 0.06, 0.08, 0.9) # Dark blueish-charcoal abisall
	style_box.border_width_top = 4
	style_box.border_width_bottom = 4
	style_box.border_color = Color(0.35, 0.3, 0.25, 0.75) # Muted antique brass / bronze
	style_box.content_margin_left = 60
	style_box.content_margin_right = 60
	style_box.content_margin_top = 30
	style_box.content_margin_bottom = 30
	panel.add_theme_stylebox_override("panel", style_box)
	
	# Apply vintage typewriter font to dialogue elements
	var custom_font = load("res://assets/fonts/SpecialElite-Regular.ttf")
	if custom_font:
		speaker_label.add_theme_font_override("font", custom_font)
		text_label.add_theme_font_override("normal_font", custom_font)
		next_indicator.add_theme_font_override("font", custom_font)
		
	_setup_synth()

func _setup_synth() -> void:
	synth_player = AudioStreamPlayer.new()
	# Safely assign to master or SFX
	for i in AudioServer.bus_count:
		if AudioServer.get_bus_name(i) == "SFX":
			synth_player.bus = &"SFX"
			break
	add_child(synth_player)
	
	beep_stream = AudioStreamWAV.new()
	beep_stream.format = AudioStreamWAV.FORMAT_8_BITS
	beep_stream.mix_rate = 8000
	var data = PackedByteArray()
	for i in range(350): # ~45ms of retro wave sound
		var val = int(sin(i * 0.25) * 127 + 128)
		data.append(val)
	beep_stream.data = data

func _process(_delta: float) -> void:
	if is_typing and text_label:
		if text_label.visible_characters != last_visible_chars:
			last_visible_chars = text_label.visible_characters
			# Play bleep sound every 2 characters to avoid machine-gun ear fatigue
			if last_visible_chars % 2 == 0:
				_play_typewriter_sound()

func _play_typewriter_sound() -> void:
	if not synth_player or not beep_stream:
		return
		
	# Adjust pitch based on speaker name to give them unique synthetic "voices"
	if speaker_name == "Pescador Sombrío":
		synth_player.pitch_scale = randf_range(0.4, 0.55) # Deep raspy voice
	elif speaker_name == "Tabernero" or speaker_name == "Tabernero Barnaby":
		synth_player.pitch_scale = randf_range(0.5, 0.65) # Gruff bartender voice
	elif speaker_name == "Sistema" or speaker_name == "Save":
		synth_player.pitch_scale = randf_range(1.1, 1.25) # High synth chime
	else:
		synth_player.pitch_scale = randf_range(0.8, 1.0) # Detective standard voice
		
	synth_player.stream = beep_stream
	synth_player.play()

func start_dialogue(lines: Array[String], speaker: String) -> void:
	dialog_lines = lines
	speaker_name = speaker
	current_line_index = 0
	is_choice_mode = false
	choices_container.visible = false
	_show_current_line()

func start_choices(prompt: String, choices: Array[Dictionary], speaker: String) -> void:
	dialog_lines = [prompt]
	speaker_name = speaker
	current_line_index = 0
	choices_list = choices
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
		
		# Get the current character to determine the punctuation pause delay
		var current_char = parsed_text[text_label.visible_characters - 1]
		var delay = 0.02 # Base typing speed
		
		if current_char in [".", "!", "?", "…"]:
			delay = 0.45 # Punctuation pause
		elif current_char in [",", ";", ":", "-"]:
			delay = 0.22 # Short breathing pause
		elif current_char == " ":
			delay = 0.01 # Spaces flow faster
			
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
	
	# Clear previous choice buttons
	for child in choices_container.get_children():
		child.queue_free()
		
	for i in range(choices_list.size()):
		var choice = choices_list[i]
		
		# Check sanity condition if present
		if choice.has("sanity_min") and Sanity.current_sanity < choice["sanity_min"]:
			continue
		if choice.has("sanity_max") and Sanity.current_sanity > choice["sanity_max"]:
			continue
			
		var btn = Button.new()
		btn.text = choice.get("text", "...")
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.theme_type_variation = &"FlatButton"
		
		# Button style configuration
		btn.pressed.connect(func(): _on_choice_selected(choice))
		choices_container.add_child(btn)

func _on_choice_selected(choice: Dictionary) -> void:
	choices_container.visible = false
	if choice.has("callback") and choice["callback"] is Callable:
		choice["callback"].call()
	dialogue_finished.emit()

func _input(event: InputEvent) -> void:
	if is_choice_mode and choices_container.visible:
		return # Don't advance click in choice mode
		
	var is_advance_input = false
	if event is InputEventMouseButton and event.is_pressed() and event.button_index == MOUSE_BUTTON_LEFT:
		is_advance_input = true
	elif event is InputEventScreenTouch and not event.pressed:
		is_advance_input = true
		
	if is_advance_input:
		get_viewport().set_input_as_handled()
		if is_typing:
			# Skip typing and show whole line
			typing_canceled = true
			text_label.visible_characters = text_label.get_parsed_text().length()
			_on_typing_finished()
		else:
			current_line_index += 1
			if current_line_index < dialog_lines.size():
				_show_current_line()
			else:
				dialogue_finished.emit()
