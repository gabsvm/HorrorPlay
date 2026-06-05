# res://src/common/ui/ui_hud.gd
extends Control

@onready var hover_label: Label = $HoverLabel
@onready var sanity_bar: ProgressBar = $TopBar/SanityBar
@onready var slots_container: HBoxContainer = $InventoryPanel/ScrollContainer/SlotsContainer
@onready var active_item_label: Label = $InventoryPanel/ActiveItemLabel

func _ready() -> void:
	# Connect to Global Autoload signals
	Inventory.item_added.connect(_on_inventory_changed)
	Inventory.item_removed.connect(_on_inventory_changed)
	Inventory.active_item_changed.connect(_on_active_item_changed)
	Sanity.sanity_changed.connect(_on_sanity_changed)
	
	# Initial draw
	_update_inventory_ui()
	_update_sanity_ui(Sanity.current_sanity)
	_on_active_item_changed(Inventory.active_item)
	clear_hover_text()

func show_hover_text(text: String) -> void:
	if Inventory.active_item:
		hover_label.text = "Usar " + Inventory.active_item.name + " en " + text
	else:
		hover_label.text = text

func clear_hover_text() -> void:
	if Inventory.active_item:
		hover_label.text = "Item activo: " + Inventory.active_item.name
	else:
		hover_label.text = ""

func _on_sanity_changed(new_val: int) -> void:
	_update_sanity_ui(new_val)

func _update_sanity_ui(value: int) -> void:
	sanity_bar.value = value
	sanity_bar.tooltip_text = "Cordura: %d/100" % value

func _on_inventory_changed(_item: ItemData) -> void:
	_update_inventory_ui()

func _on_active_item_changed(item: ItemData) -> void:
	if item:
		active_item_label.text = "Seleccionado: " + item.name
		hover_label.text = "Item activo: " + item.name
	else:
		active_item_label.text = "Sin selección"
		clear_hover_text()

func _update_inventory_ui() -> void:
	# Clear slots
	for child in slots_container.get_children():
		child.queue_free()
		
	# Populate slots
	for item in Inventory.items:
		var slot_btn = TextureButton.new()
		
		# Draw a placeholder flat panel background for touch visibility
		var panel = Panel.new()
		panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
		panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		slot_btn.add_child(panel)
		
		var label = Label.new()
		label.text = item.name
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		slot_btn.add_child(label)
		
		# Touch targets are at least 140x100px
		slot_btn.custom_minimum_size = Vector2(140, 100)
		
		if item.icon:
			slot_btn.texture_normal = item.icon
			
		slot_btn.pressed.connect(func(): _on_slot_pressed(item))
		slots_container.add_child(slot_btn)

func _on_slot_pressed(item: ItemData) -> void:
	if Inventory.active_item == item:
		Inventory.set_active_item(null)
	else:
		Inventory.set_active_item(item)

func _on_save_pressed() -> void:
	var err = SaveSystem.save_game(1)
	if err == OK:
		DialogueManager.show_dialogue(["Partida guardada en la Ranura 1 exitosamente."], "Sistema")
	else:
		DialogueManager.show_dialogue(["Error al guardar partida: " + str(err)], "Sistema")

func _on_load_pressed() -> void:
	var err = SaveSystem.load_game(1)
	if err == OK:
		DialogueManager.show_dialogue(["Partida cargada exitosamente."], "Sistema")
	else:
		DialogueManager.show_dialogue(["No se encontró una partida guardada o archivo corrupto."], "Sistema")

func _on_drain_sanity_pressed() -> void:
	Sanity.drain_sanity(10)
