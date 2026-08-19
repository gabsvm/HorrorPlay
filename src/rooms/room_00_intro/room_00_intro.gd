# res://src/rooms/room_00_intro/room_00_intro.gd
extends Node2D

@onready var background: Sprite2D = $Background
@onready var underwater_glow: PointLight2D = $UnderwaterGlow
@onready var creature_shadow: Polygon2D = $CreatureShadow
@onready var text_label: RichTextLabel = $CanvasLayer/TextLabel
@onready var speaker_label: Label = $CanvasLayer/SpeakerLabel
@onready var skip_button: Button = $CanvasLayer/SkipButton
@onready var next_prompt: Label = $CanvasLayer/NextPrompt
@onready var blackout: ColorRect = $CanvasLayer/Blackout

var beats: Array[Dictionary] = [
	{
		"speaker": "JEFE DE PATRULLA",
		"text": "Patrulla 317 a estación. Entrando en el sector del Arrecife del Diablo. Visibilidad menor a cien metros."
	},
	{
		"speaker": "RADIO · ESTACIÓN INNSMOUTH",
		"text": "317, recibido. Investiguen las luces reportadas y regresen. [i]No desembarquen.[/i] Repito: no desembarquen."
	},
	{
		"speaker": "GUARDACOSTAS HALE",
		"text": "Jefe... eso no es una boya. Hay una [color=#6ed6ad]luz debajo del agua[/color]. Se está moviendo contra la corriente."
	},
	{
		"speaker": "JEFE DE PATRULLA",
		"text": "Corten el reflector. Motor a media marcha. ¿Escucharon eso? [wave amp=8 freq=2]Tres campanadas.[/wave]"
	},
	{
		"speaker": "RADIO · SEÑAL DESCONOCIDA",
		"text": "[wave amp=13 freq=3]...Hale... Mercer... Ward...[/wave]"
	},
	{
		"speaker": "GUARDACOSTAS HALE",
		"text": "Está diciendo nuestros nombres. Dios mío, hay algo pasando bajo el— [shake rate=24 level=9]¡NO MIRES ABAJO![/shake]"
	},
	{
		"speaker": "RADIO · UNIDAD 317",
		"text": "[wave amp=18 freq=4]—Estación... tenemos una entrada en la roca. Hay escalones. Están bajo la línea de marea. NO RESPONDAN SI OYEN SUS NOMB—[/wave]"
	}
]

var current_beat: int = 0
var is_typing: bool = false
var typing_tween: Tween = null
var ending: bool = false

func _ready() -> void:
	InputController.block_input(true)
	blackout.visible = false
	next_prompt.visible = false
	_apply_font()
	AudioBus.play_ambience("reef", 1.4)
	_show_beat()

func _apply_font() -> void:
	var font = load("res://assets/fonts/SpecialElite-Regular.ttf")
	if not font:
		return
	text_label.add_theme_font_override("normal_font", font)
	speaker_label.add_theme_font_override("font", font)
	$CanvasLayer/LocationLabel.add_theme_font_override("font", font)
	$CanvasLayer/UnitLabel.add_theme_font_override("font", font)
	next_prompt.add_theme_font_override("font", font)
	skip_button.add_theme_font_override("font", font)

func _show_beat() -> void:
	if current_beat >= beats.size():
		_end_cold_open()
		return
	var beat = beats[current_beat]
	speaker_label.text = str(beat.get("speaker", "UNIDAD 317"))
	text_label.text = str(beat.get("text", ""))
	text_label.visible_characters = 0
	next_prompt.visible = false
	is_typing = true
	_apply_beat_fx(current_beat)
	if typing_tween and typing_tween.is_valid():
		typing_tween.kill()
	typing_tween = create_tween()
	var char_count = text_label.get_parsed_text().length()
	var duration = max(0.6, float(char_count) * 0.024)
	typing_tween.tween_property(text_label, "visible_characters", char_count, duration)
	typing_tween.finished.connect(_on_typing_finished)

func _apply_beat_fx(index: int) -> void:
	match index:
		1:
			var tween = create_tween()
			tween.tween_property(background, "modulate", Color(0.82, 0.88, 0.88, 1), 0.5)
		2:
			var tween = create_tween()
			tween.tween_property(underwater_glow, "energy", 0.78, 1.4).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
		3:
			AudioBus.play_horror_stinger(0.45)
			AtmosphereController.horror_pulse(0.45)
			var pulse = create_tween()
			pulse.tween_property(underwater_glow, "energy", 1.18, 0.18)
			pulse.tween_property(underwater_glow, "energy", 0.5, 0.85)
		4:
			AudioBus.play_horror_stinger(0.68)
			var radio_pulse = create_tween()
			radio_pulse.tween_property(underwater_glow, "energy", 0.9, 0.22)
			radio_pulse.tween_property(underwater_glow, "energy", 0.35, 0.55)
		5:
			_play_shadow_pass()
		6:
			AudioBus.play_horror_stinger(1.05)
			AtmosphereController.horror_pulse(1.05)

func _play_shadow_pass() -> void:
	creature_shadow.position = Vector2(-500, 70)
	creature_shadow.modulate.a = 0.0
	var tween = create_tween().set_parallel(true)
	tween.tween_property(creature_shadow, "position", Vector2(930, 20), 2.6).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(creature_shadow, "modulate:a", 0.6, 0.6)
	tween.tween_property(underwater_glow, "energy", 1.35, 0.8)
	tween.chain().tween_property(creature_shadow, "modulate:a", 0.0, 0.55)

func _on_typing_finished() -> void:
	is_typing = false
	next_prompt.visible = true

func _input(event: InputEvent) -> void:
	if ending:
		return
	var advance = false
	if event is InputEventMouseButton and event.is_pressed() and event.button_index == MOUSE_BUTTON_LEFT:
		advance = true
	elif event is InputEventScreenTouch and not event.pressed:
		advance = true
	if not advance:
		return
	get_viewport().set_input_as_handled()
	if is_typing:
		if typing_tween and typing_tween.is_valid():
			typing_tween.kill()
		text_label.visible_characters = text_label.get_parsed_text().length()
		_on_typing_finished()
	else:
		current_beat += 1
		_show_beat()

func _on_skip_pressed() -> void:
	if not ending:
		_start_game()

func _end_cold_open() -> void:
	ending = true
	next_prompt.visible = false
	skip_button.visible = false
	blackout.visible = true
	blackout.modulate.a = 0.0
	AudioBus.play_horror_stinger(1.25)
	var tween = create_tween()
	tween.tween_property(blackout, "modulate:a", 1.0, 0.16)
	tween.tween_interval(0.65)
	await tween.finished
	_start_game()

func _start_game() -> void:
	if typing_tween and typing_tween.is_valid():
		typing_tween.kill()
	if not Investigation.case_active:
		Investigation.start_case()
	InputController.block_input(false)
	SceneRouter.change_room("res://src/rooms/room_01_office/room_01_office.tscn")
