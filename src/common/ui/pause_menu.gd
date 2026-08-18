# res://src/common/ui/pause_menu.gd
extends Control

@onready var panel: Panel = $Backdrop/Panel
@onready var title: Label = $Backdrop/Panel/Content/Title
@onready var status_label: Label = $Backdrop/Panel/Content/StatusLabel
@onready var load_button: Button = $Backdrop/Panel/Content/LoadButton

var custom_font: Font = null

func _ready() -> void:
	visible = false
	custom_font = load("res://assets/fonts/SpecialElite-Regular.ttf")
	if custom_font:
		_apply_font_recursive(self)
	_apply_style()
	_refresh_state()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		if visible:
			close_menu()
		else:
			open_menu()

func open_menu() -> void:
	if visible or DialogueManager.current_balloon:
		return
	visible = true
	status_label.text = ""
	_refresh_state()
	InputController.block_input(true)

func close_menu() -> void:
	if not visible:
		return
	visible = false
	InputController.block_input(false)

func _refresh_state() -> void:
	load_button.disabled = not SaveSystem.has_save(1)

func _apply_font_recursive(node: Node) -> void:
	if node is Control:
		node.add_theme_font_override("font", custom_font)
	for child in node.get_children():
		_apply_font_recursive(child)

func _apply_style() -> void:
	var panel_style = StyleBoxFlat.new()
	panel_style.bg_color = Color(0.024, 0.025, 0.029, 0.97)
	panel_style.border_width_left = 2
	panel_style.border_width_top = 2
	panel_style.border_width_right = 2
	panel_style.border_width_bottom = 2
	panel_style.border_color = Color(0.38, 0.3, 0.19, 0.92)
	panel_style.corner_radius_top_left = 7
	panel_style.corner_radius_top_right = 7
	panel_style.corner_radius_bottom_left = 7
	panel_style.corner_radius_bottom_right = 7
	panel.add_theme_stylebox_override("panel", panel_style)

func _on_resume_pressed() -> void:
	close_menu()

func _on_save_pressed() -> void:
	var err = SaveSystem.save_game(1)
	if err == OK:
		status_label.text = "Partida guardada."
		load_button.disabled = false
	else:
		status_label.text = "No se pudo guardar la partida."

func _on_load_pressed() -> void:
	if not SaveSystem.has_save(1):
		status_label.text = "No hay ninguna partida guardada."
		load_button.disabled = true
		return
	
	var err = SaveSystem.load_game(1)
	if err != OK:
		status_label.text = "No se pudo cargar la partida."
		return
	
	# SceneRouter now owns the visual transition. Do not spawn a success dialogue
	# on the old scene while it is being destroyed.
	visible = false
	InputController.block_input(false)

func _on_main_menu_pressed() -> void:
	SaveSystem.save_checkpoint(1)
	visible = false
	InputController.block_input(false)
	SceneRouter.change_room("res://src/menu/main_menu.tscn")
