# res://src/common/ui/pause_menu.gd
extends Control

const INPUT_LOCK_OWNER: StringName = &"pause"

@onready var panel: Panel = $Backdrop/Panel
@onready var status_label: Label = $Backdrop/Panel/Content/StatusLabel
@onready var load_button: Button = $Backdrop/Panel/Content/LoadButton

var custom_font: Font = null

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = false
	custom_font = load("res://assets/fonts/SpecialElite-Regular.ttf")
	if custom_font:
		_apply_font_recursive(self)
	_apply_style()
	_refresh_state()

func _exit_tree() -> void:
	InputController.release_input_lock(INPUT_LOCK_OWNER)
	if get_tree() and get_tree().paused:
		get_tree().paused = false

func _unhandled_input(event: InputEvent) -> void:
	if not event.is_action_pressed("ui_cancel"):
		return

	var inventory_menu = _get_inventory_menu()
	if inventory_menu and inventory_menu.visible:
		get_viewport().set_input_as_handled()
		if inventory_menu.has_method("close_menu"):
			inventory_menu.close_menu()
		return

	var casebook = _get_casebook()
	if casebook and casebook.visible:
		get_viewport().set_input_as_handled()
		casebook.visible = false
		InputController.block_input(false)
		return

	if visible:
		get_viewport().set_input_as_handled()
		close_menu()
		return

	# A world interaction, dialogue, transition, or other modal owns input.
	# Esc must not cancel an armed item or open Pause underneath that owner.
	if InputController.is_input_blocked:
		return

	# With no modal/sequence active, Esc first cancels an armed inventory item.
	if Inventory.active_item:
		get_viewport().set_input_as_handled()
		Inventory.set_active_item(null)
		return

	get_viewport().set_input_as_handled()
	open_menu()

func open_menu() -> void:
	if visible or DialogueManager.current_balloon or InputController.is_input_blocked:
		return
	var inventory_menu = _get_inventory_menu()
	if inventory_menu and inventory_menu.visible:
		return
	var casebook = _get_casebook()
	if casebook and casebook.visible:
		return
	if Inventory.active_item:
		Inventory.set_active_item(null)
	visible = true
	status_label.text = ""
	_refresh_state()
	InputController.acquire_input_lock(INPUT_LOCK_OWNER)
	get_tree().paused = true

func close_menu() -> void:
	if not visible:
		return
	get_tree().paused = false
	visible = false
	InputController.release_input_lock(INPUT_LOCK_OWNER)

func _get_casebook() -> CanvasItem:
	var parent_node = get_parent()
	if parent_node:
		return parent_node.get_node_or_null("CasebookBackdrop") as CanvasItem
	return null

func _get_inventory_menu():
	var parent_node = get_parent()
	if parent_node:
		return parent_node.get_node_or_null("InventoryMenu")
	return null

func _refresh_state() -> void:
	load_button.disabled = not SaveSystem.has_save(1)

func _apply_font_recursive(node: Node) -> void:
	if node is Control:
		node.add_theme_font_override("font", custom_font)
	for child in node.get_children():
		_apply_font_recursive(child)

func _apply_style() -> void:
	var panel_style = StyleBoxFlat.new()
	panel_style.bg_color = Color(0.024, 0.025, 0.029, 0.98)
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
	get_tree().paused = false
	var err = SaveSystem.load_game(1)
	if err != OK:
		get_tree().paused = true
		status_label.text = "No se pudo cargar la partida."
		return
	visible = false
	InputController.release_input_lock(INPUT_LOCK_OWNER)

func _on_main_menu_pressed() -> void:
	SaveSystem.save_checkpoint(1)
	get_tree().paused = false
	visible = false
	InputController.release_input_lock(INPUT_LOCK_OWNER)
	SceneRouter.change_room("res://src/menu/main_menu.tscn")
