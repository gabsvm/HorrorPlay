# res://src/rooms/room_00_intro/room_00_intro.gd
extends Node2D

@onready var text_label: RichTextLabel = $CanvasLayer/TextLabel
@onready var skip_button: Button = $CanvasLayer/SkipButton
@onready var next_prompt: Label = $CanvasLayer/NextPrompt

var intro_lines: Array[String] = [
	"[center]Octubre de 1926. Boston, Massachusetts.[/center]",
	"[center]La comisaría me asignó el caso de tres guardacostas desaparecidos cerca del [color=#ea580c]Arrecife del Diablo[/color]...[/center]",
	"[center]...en las inmediaciones de [shake rate=15 level=8][color=#06b6d4]Innsmouth[/color][/shake].[/center]",
	"[center]Un decrépito pueblo pesquero que no figura en los mapas gubernamentales.[/center]",
	"[center]Un lugar de calles sombrías, donde la gente sensata no mira al mar, y del que nadie habla de buena gana.[/center]",
	"[center]Conducido por la lluvia y los presagios oscuros, preparo mis pertenencias en el despacho antes de partir hacia el muelle...[/center]",
	"[center]Que mi fe me guarde de lo que me aguarda en la [wave amp=15 freq=3]niebla[/wave].[/center]"
]

var current_line_idx: int = 0
var is_typing: bool = false
var tween: Tween

func _ready() -> void:
	InputController.block_input(true) # Block world interaction during intro
	next_prompt.visible = false
	_play_intro_music()
	_show_line()

func _play_intro_music() -> void:
	var music_stream = load("res://assets/audio/music/gothic_village.ogg")
	if music_stream:
		AudioBus.play_music(music_stream, 2.5)

func _show_line() -> void:
	if current_line_idx >= intro_lines.size():
		_start_game()
		return
		
	text_label.text = intro_lines[current_line_idx]
	text_label.visible_characters = 0
	next_prompt.visible = false
	is_typing = true
	
	if tween:
		tween.kill()
	tween = create_tween()
	var visible_chars_count = text_label.get_parsed_text().length()
	var duration = visible_chars_count * 0.04
	tween.tween_property(text_label, "visible_characters", visible_chars_count, duration)
	tween.finished.connect(_on_typing_finished)

func _on_typing_finished() -> void:
	is_typing = false
	next_prompt.visible = true

func _input(event: InputEvent) -> void:
	var advance = false
	if event is InputEventMouseButton and event.is_pressed() and event.button_index == MOUSE_BUTTON_LEFT:
		advance = true
	elif event is InputEventScreenTouch and not event.pressed:
		advance = true
		
	if advance:
		get_viewport().set_input_as_handled()
		if is_typing:
			if tween:
				tween.kill()
			text_label.visible_characters = text_label.get_parsed_text().length()
			_on_typing_finished()
		else:
			current_line_idx += 1
			_show_line()

func _on_skip_pressed() -> void:
	_start_game()

func _start_game() -> void:
	if tween:
		tween.kill()
	InputController.block_input(false)
	SceneRouter.change_room("res://src/rooms/room_01_office/room_01_office.tscn")
