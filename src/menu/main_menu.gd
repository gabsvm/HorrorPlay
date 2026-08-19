# res://src/menu/main_menu.gd
extends Control

@onready var menu_panel: Panel = $MenuPanel
@onready var continue_button: Button = $MenuPanel/Menu/ContinueButton
@onready var quit_button: Button = $MenuPanel/Menu/QuitButton
@onready var status_label: Label = $MenuPanel/Menu/StatusLabel

var custom_font: Font = null
var accepting_input: bool = false

func _ready() -> void:
	InputController.block_input(true)
	AudioBus.stop_ambience(0.75)
	custom_font = load("res://assets/fonts/SpecialElite-Regular.ttf")
	if custom_font:
		_apply_font_recursive(self)
	_apply_style()
	continue_button.disabled = not SaveSystem.has_save(1)
	quit_button.visible = OS.get_name() not in ["Android", "iOS", "Web"]
	status_label.text = ""
	var music_stream = load("res://assets/audio/music/gothic_village.ogg")
	if music_stream:
		AudioBus.play_music(music_stream, 2.0)
	_play_menu_entrance()

func _exit_tree() -> void:
	InputController.block_input(false)

func _play_menu_entrance() -> void:
	menu_panel.modulate.a = 0.0
	var target_position = menu_panel.position
	menu_panel.position = target_position + Vector2(-26, 0)
	var tween = create_tween().set_parallel(true)
	tween.tween_property(menu_panel, "modulate:a", 1.0, 0.65).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.tween_property(menu_panel, "position", target_position, 0.7).set_trans(Tween.TRANS_QUINT).set_ease(Tween.EASE_OUT)
	await tween.finished
	accepting_input = true

func _apply_font_recursive(node: Node) -> void:
	if node is Control:
		node.add_theme_font_override("font", custom_font)
	for child in node.get_children():
		_apply_font_recursive(child)

func _apply_style() -> void:
	var panel_style = StyleBoxFlat.new()
	panel_style.bg_color = Color(0.018, 0.02, 0.026, 0.93)
	panel_style.border_width_left = 2
	panel_style.border_width_top = 2
	panel_style.border_width_right = 2
	panel_style.border_width_bottom = 2
	panel_style.border_color = Color(0.38, 0.29, 0.18, 0.9)
	panel_style.corner_radius_top_left = 6
	panel_style.corner_radius_top_right = 6
	panel_style.corner_radius_bottom_left = 6
	panel_style.corner_radius_bottom_right = 6
	menu_panel.add_theme_stylebox_override("panel", panel_style)

func _on_new_game_pressed() -> void:
	if not accepting_input:
		return
	accepting_input = false
	SaveSystem.reset_runtime_state()
	status_label.text = ""
	InputController.block_input(false)
	SceneRouter.change_room("res://src/rooms/room_00_intro/room_00_intro.tscn")

func _on_continue_pressed() -> void:
	if not accepting_input:
		return
	accepting_input = false
	var err = SaveSystem.load_game(1)
	if err != OK:
		status_label.text = "No se pudo cargar la partida guardada."
		continue_button.disabled = true
		accepting_input = true
		return
	status_label.text = ""
	InputController.block_input(false)

func _on_quit_pressed() -> void:
	if accepting_input:
		get_tree().quit()
