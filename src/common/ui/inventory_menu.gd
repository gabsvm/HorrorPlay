extends Control

signal item_armed(item: ItemData)

const INPUT_LOCK_OWNER: StringName = &"inventory"

@onready var inventory_panel: Panel = $Backdrop/InventoryPanel
@onready var items_list: VBoxContainer = $Backdrop/InventoryPanel/ItemsSection/ItemsScroll/ItemsList
@onready var empty_label: Label = $Backdrop/InventoryPanel/ItemsSection/EmptyLabel
@onready var item_icon: TextureRect = $Backdrop/InventoryPanel/DetailSection/ItemIcon
@onready var item_name: Label = $Backdrop/InventoryPanel/DetailSection/ItemName
@onready var item_meta: Label = $Backdrop/InventoryPanel/DetailSection/ItemMeta
@onready var item_description: Label = $Backdrop/InventoryPanel/DetailSection/ItemDescription
@onready var use_button: Button = $Backdrop/InventoryPanel/DetailSection/Actions/UseButton
@onready var examine_button: Button = $Backdrop/InventoryPanel/DetailSection/Actions/ExamineButton
@onready var hint_label: Label = $Backdrop/InventoryPanel/DetailSection/HintLabel

var selected_item: ItemData = null
var item_buttons: Dictionary = {}
var custom_font: Font = null

func _ready() -> void:
	visible = false
	custom_font = load("res://assets/fonts/SpecialElite-Regular.ttf")
	if custom_font:
		_apply_font_recursive(self)
	_apply_styles()
	Inventory.item_added.connect(_on_inventory_changed)
	Inventory.item_removed.connect(_on_inventory_changed)

func _exit_tree() -> void:
	InputController.release_input_lock(INPUT_LOCK_OWNER)

func open_menu() -> void:
	if visible or DialogueManager.current_balloon or InputController.is_input_blocked:
		return
	# Opening the inventory cancels a previously armed object so browsing and
	# world-use mode remain two explicit states. Never do this while another
	# subsystem owns input: that would invalidate an in-flight world interaction.
	if Inventory.active_item:
		Inventory.set_active_item(null)
	visible = true
	InputController.acquire_input_lock(INPUT_LOCK_OWNER)
	_refresh_items()

func close_menu() -> void:
	if not visible:
		return
	visible = false
	InputController.release_input_lock(INPUT_LOCK_OWNER)

func _unhandled_input(event: InputEvent) -> void:
	if not visible:
		return
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		close_menu()

func _refresh_items() -> void:
	for child in items_list.get_children():
		child.queue_free()
	item_buttons.clear()
	empty_label.visible = Inventory.items.is_empty()
	if Inventory.items.is_empty():
		_select_item(null)
		return

	for item in Inventory.items:
		var button = Button.new()
		button.custom_minimum_size = Vector2(410, 82)
		button.text = item.name
		button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		button.toggle_mode = true
		button.tooltip_text = item.description
		if item.icon:
			button.icon = item.icon
		button.pressed.connect(func(): _select_item(item))
		if custom_font:
			button.add_theme_font_override("font", custom_font)
		button.add_theme_font_size_override("font_size", 19)
		items_list.add_child(button)
		item_buttons[item] = button

	var next_selection = selected_item if selected_item and Inventory.items.has(selected_item) else Inventory.items[0]
	_select_item(next_selection)

func _select_item(item: ItemData) -> void:
	selected_item = item
	for key in item_buttons:
		var btn = item_buttons[key] as Button
		if btn:
			btn.set_pressed_no_signal(key == selected_item)

	var has_item = selected_item != null
	use_button.disabled = not has_item
	examine_button.disabled = not has_item
	if not has_item:
		item_icon.texture = null
		item_name.text = "SIN OBJETO SELECCIONADO"
		item_meta.text = "INVENTARIO DE CAMPO"
		item_description.text = "Los objetos recogidos durante la investigación aparecerán aquí."
		hint_label.text = ""
		return

	item_icon.texture = selected_item.icon
	item_name.text = selected_item.name.to_upper()
	item_meta.text = "OBJETO DE INVESTIGACIÓN · %s" % selected_item.id.to_upper().replace("_", " ")
	item_description.text = selected_item.description
	hint_label.text = "USAR prepara el objeto. Después toca en el escenario dónde querés utilizarlo."

func _on_use_pressed() -> void:
	if not selected_item:
		return
	var armed_item = selected_item
	visible = false
	InputController.release_input_lock(INPUT_LOCK_OWNER)
	Inventory.set_active_item(armed_item)
	item_armed.emit(armed_item)

func _on_examine_pressed() -> void:
	if not selected_item:
		return
	var examined_item = selected_item
	close_menu()
	var description = examined_item.description
	if description.is_empty():
		description = "No encuentro nada más relevante a simple vista."
	await DialogueManager.show_dialogue([
		"[color=#c8ad76]%s[/color]" % examined_item.name,
		description
	], "Inspector")

func _on_inventory_changed(_item: ItemData) -> void:
	if visible:
		_refresh_items()

func _on_close_pressed() -> void:
	close_menu()

func _apply_styles() -> void:
	var panel_style = StyleBoxFlat.new()
	panel_style.bg_color = Color(0.018, 0.021, 0.024, 0.985)
	panel_style.border_width_left = 2
	panel_style.border_width_top = 2
	panel_style.border_width_right = 2
	panel_style.border_width_bottom = 2
	panel_style.border_color = Color(0.43, 0.35, 0.22, 0.9)
	panel_style.corner_radius_top_left = 5
	panel_style.corner_radius_top_right = 5
	panel_style.corner_radius_bottom_left = 5
	panel_style.corner_radius_bottom_right = 5
	inventory_panel.add_theme_stylebox_override("panel", panel_style)

	var action_style = StyleBoxFlat.new()
	action_style.bg_color = Color(0.12, 0.13, 0.13, 0.96)
	action_style.border_width_left = 1
	action_style.border_width_top = 1
	action_style.border_width_right = 1
	action_style.border_width_bottom = 1
	action_style.border_color = Color(0.48, 0.39, 0.24, 0.7)
	action_style.corner_radius_top_left = 3
	action_style.corner_radius_top_right = 3
	action_style.corner_radius_bottom_left = 3
	action_style.corner_radius_bottom_right = 3
	use_button.add_theme_stylebox_override("normal", action_style)

func _apply_font_recursive(node: Node) -> void:
	if node is Control:
		node.add_theme_font_override("font", custom_font)
	for child in node.get_children():
		_apply_font_recursive(child)
