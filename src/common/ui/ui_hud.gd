# res://src/common/ui/ui_hud.gd
extends Control

@onready var hover_label: Label = $HoverLabel
@onready var sanity_bar: ProgressBar = $TopBar/SanityBar
@onready var objective_label: Label = $TopBar/ObjectiveLabel
@onready var slots_container: HBoxContainer = $InventoryPanel/ScrollContainer/SlotsContainer
@onready var active_item_label: Label = $InventoryPanel/ActiveItemLabel
@onready var vignette: TextureRect = $Vignette

var cached_sfx: Dictionary = {}
var custom_font: Font = null

func _ready() -> void:
	_init_sfx_cache()
	
	custom_font = load("res://assets/fonts/SpecialElite-Regular.ttf")
	if custom_font:
		_apply_theme_font_recursive(self, custom_font)
	
	Inventory.item_added.connect(_on_item_added)
	Inventory.item_removed.connect(_on_item_removed)
	Inventory.active_item_changed.connect(_on_active_item_changed)
	Sanity.sanity_changed.connect(_on_sanity_changed)
	Investigation.objective_changed.connect(_on_objective_changed)
	
	_update_inventory_ui()
	_update_sanity_ui(Sanity.current_sanity)
	_on_active_item_changed(Inventory.active_item)
	_on_objective_changed(Investigation.current_objective_id, Investigation.get_current_objective_text())
	clear_hover_text()
	_setup_safe_area()

func _setup_safe_area() -> void:
	var os = OS.get_name()
	if os == "Android" or os == "iOS":
		var safe_area = DisplayServer.get_display_safe_area()
		var window_size = DisplayServer.window_get_size()
		
		$TopBar.offset_top = max(0, safe_area.position.y)
		$TopBar.offset_left = max(0, safe_area.position.x)
		$TopBar.offset_right = -max(0, window_size.x - safe_area.end.x)
		
		$InventoryPanel.offset_bottom = -max(0, window_size.y - safe_area.end.y)
		$InventoryPanel.offset_left = max(0, safe_area.position.x)
		$InventoryPanel.offset_right = -max(0, window_size.x - safe_area.end.x)

func _apply_theme_font_recursive(node: Node, font: Font) -> void:
	if node is Control:
		node.add_theme_font_override("font", font)
	for child in node.get_children():
		_apply_theme_font_recursive(child, font)

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
	if vignette:
		var target_alpha = lerp(0.78, 0.16, float(value) / 100.0)
		var tween = create_tween()
		tween.tween_property(vignette, "modulate:a", target_alpha, 0.6).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)

func _on_objective_changed(_objective_id: String, objective_text: String) -> void:
	if objective_text.is_empty():
		objective_label.text = "CASO — Sin objetivo activo"
	else:
		objective_label.text = "CASO — " + objective_text

func _on_item_added(_item: ItemData) -> void:
	_update_inventory_ui()
	_play_pickup_sfx()

func _on_item_removed(_item: ItemData) -> void:
	_update_inventory_ui()

func _on_active_item_changed(item: ItemData) -> void:
	if item:
		active_item_label.text = "Seleccionado: " + item.name
		hover_label.text = "Item activo: " + item.name
		_play_select_sfx()
	else:
		active_item_label.text = "Sin selección"
		clear_hover_text()

func _update_inventory_ui() -> void:
	for child in slots_container.get_children():
		child.queue_free()
		
	for item in Inventory.items:
		var slot_btn = TextureButton.new()
		slot_btn.pivot_offset = Vector2(70, 50)
		slot_btn.scale = Vector2.ZERO
		
		var panel = Panel.new()
		panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
		panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		slot_btn.add_child(panel)
		
		slot_btn.custom_minimum_size = Vector2(140, 100)
		
		if item.icon:
			slot_btn.texture_normal = item.icon
			slot_btn.ignore_texture_size = true
			slot_btn.stretch_mode = TextureButton.STRETCH_KEEP_ASPECT_CENTERED
		else:
			var label = Label.new()
			label.text = item.name
			label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
			label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
			slot_btn.add_child(label)
			
		slot_btn.pressed.connect(func(): _on_slot_pressed(item))
		
		if custom_font:
			_apply_theme_font_recursive(slot_btn, custom_font)
			
		slots_container.add_child(slot_btn)
		
		var tween = create_tween()
		tween.tween_property(slot_btn, "scale", Vector2.ONE, 0.45).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

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

func _init_sfx_cache() -> void:
	cached_sfx["pickup_1"] = _generate_sfx_stream(0.12, 80)
	cached_sfx["pickup_2"] = _generate_sfx_stream(0.18, 120)
	cached_sfx["select"] = _generate_sfx_stream(0.3, 20)
	cached_sfx["reveal"] = _generate_sfx_stream(0.15, 100)

func _generate_sfx_stream(freq: float, duration_ms: int) -> AudioStreamWAV:
	var stream = AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_8_BITS
	stream.mix_rate = 11025
	var data = PackedByteArray()
	for i in range(duration_ms * 11):
		var val = int(sin(i * freq) * 127 + 128)
		data.append(val)
	stream.data = data
	return stream

func _play_cached_sfx(key: String, pitch: float = 1.0) -> void:
	if not cached_sfx.has(key):
		return
		
	var sfx_player = AudioStreamPlayer.new()
	for i in AudioServer.bus_count:
		if AudioServer.get_bus_name(i) == "SFX":
			sfx_player.bus = &"SFX"
			break
	add_child(sfx_player)
	
	sfx_player.stream = cached_sfx[key]
	sfx_player.pitch_scale = pitch
	sfx_player.play()
	sfx_player.finished.connect(func(): sfx_player.queue_free())

func _on_reveal_pressed() -> void:
	_play_cached_sfx("reveal", 1.6)
	
	if OS.get_name() in ["Android", "iOS"]:
		Input.vibrate_handheld(120)
	
	var hotspots = get_tree().get_nodes_in_group("hotspots")
	for hs in hotspots:
		if hs is Hotspot:
			var sprite = hs.get_node_or_null("Sprite2D")
			if sprite:
				var tween = create_tween()
				tween.tween_property(sprite, "modulate", Color(0, 0.94, 1.0, 1.0), 0.5)
				tween.tween_property(sprite, "modulate", Color(1.0, 1.0, 1.0, 1.0), 0.7)

func _play_pickup_sfx() -> void:
	_play_cached_sfx("pickup_1", 1.0)
	await get_tree().create_timer(0.06).timeout
	_play_cached_sfx("pickup_2", 1.2)

func _play_select_sfx() -> void:
	_play_cached_sfx("select", 0.85)
