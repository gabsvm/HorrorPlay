# res://src/common/ui/ui_hud.gd
extends Control

@onready var hover_label: Label = $HoverLabel
@onready var top_bar: Panel = $TopBar
@onready var sanity_label: Label = $TopBar/SanityLabel
@onready var sanity_bar: ProgressBar = $TopBar/SanityBar
@onready var objective_label: Label = $TopBar/ObjectiveLabel
@onready var inventory_panel: Panel = $InventoryPanel
@onready var slots_container: HBoxContainer = $InventoryPanel/ScrollContainer/SlotsContainer
@onready var active_item_label: Label = $InventoryPanel/ActiveItemLabel
@onready var vignette: TextureRect = $Vignette
@onready var casebook_backdrop: ColorRect = $CasebookBackdrop
@onready var casebook_panel: Panel = $CasebookBackdrop/CasebookPanel
@onready var casebook_objective: Label = $CasebookBackdrop/CasebookPanel/CaseObjective
@onready var evidence_list: VBoxContainer = $CasebookBackdrop/CasebookPanel/EvidenceScroll/EvidenceList

var cached_sfx: Dictionary = {}
var custom_font: Font = null
var feedback_stack: VBoxContainer = null
var hud_initialized: bool = false

func _ready() -> void:
	_init_sfx_cache()
	custom_font = load("res://assets/fonts/SpecialElite-Regular.ttf")
	if custom_font:
		_apply_theme_font_recursive(self, custom_font)
	_apply_hud_styles()
	_create_feedback_stack()
	casebook_backdrop.visible = false
	sanity_bar.show_percentage = false
	Inventory.item_added.connect(_on_item_added)
	Inventory.item_removed.connect(_on_item_removed)
	Inventory.active_item_changed.connect(_on_active_item_changed)
	Sanity.sanity_changed.connect(_on_sanity_changed)
	Sanity.sanity_tier_changed.connect(_on_sanity_tier_changed)
	Investigation.objective_changed.connect(_on_objective_changed)
	Investigation.evidence_discovered.connect(_on_evidence_discovered)
	_update_inventory_ui()
	_update_sanity_ui(Sanity.current_sanity)
	_on_active_item_changed(Inventory.active_item)
	_on_objective_changed(Investigation.current_objective_id, Investigation.get_current_objective_text())
	clear_hover_text()
	_setup_safe_area()
	hud_initialized = true

func _apply_hud_styles() -> void:
	var top_style = StyleBoxFlat.new()
	top_style.bg_color = Color(0.012, 0.016, 0.021, 0.9)
	top_style.border_width_bottom = 1
	top_style.border_color = Color(0.38, 0.3, 0.19, 0.68)
	top_style.content_margin_left = 18
	top_style.content_margin_right = 18
	top_bar.add_theme_stylebox_override("panel", top_style)
	var inventory_style = StyleBoxFlat.new()
	inventory_style.bg_color = Color(0.012, 0.016, 0.021, 0.92)
	inventory_style.border_width_top = 1
	inventory_style.border_color = Color(0.38, 0.3, 0.19, 0.62)
	inventory_panel.add_theme_stylebox_override("panel", inventory_style)
	var case_style = StyleBoxFlat.new()
	case_style.bg_color = Color(0.035, 0.032, 0.029, 0.985)
	case_style.border_width_left = 2
	case_style.border_width_top = 2
	case_style.border_width_right = 2
	case_style.border_width_bottom = 2
	case_style.border_color = Color(0.42, 0.31, 0.17, 0.95)
	case_style.corner_radius_top_left = 6
	case_style.corner_radius_top_right = 6
	case_style.corner_radius_bottom_left = 6
	case_style.corner_radius_bottom_right = 6
	casebook_panel.add_theme_stylebox_override("panel", case_style)

func _create_feedback_stack() -> void:
	feedback_stack = VBoxContainer.new()
	feedback_stack.name = "FeedbackStack"
	feedback_stack.mouse_filter = Control.MOUSE_FILTER_IGNORE
	feedback_stack.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	feedback_stack.offset_left = -500.0
	feedback_stack.offset_top = 105.0
	feedback_stack.offset_right = -38.0
	feedback_stack.offset_bottom = 500.0
	feedback_stack.add_theme_constant_override("separation", 10)
	add_child(feedback_stack)

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
		feedback_stack.offset_top = 105.0 + max(0, safe_area.position.y)

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
		hover_label.text = "Objeto activo: " + Inventory.active_item.name
	else:
		hover_label.text = ""

func _on_sanity_changed(new_val: int) -> void:
	_update_sanity_ui(new_val)

func _on_sanity_tier_changed(new_tier: int) -> void:
	_update_sanity_ui(Sanity.current_sanity)
	if hud_initialized:
		_show_feedback("ESTADO MENTAL", _sanity_tier_text(new_tier), Color(0.58, 0.73, 0.68, 1))

func _update_sanity_ui(value: int) -> void:
	sanity_bar.value = value
	sanity_bar.tooltip_text = "Cordura: %d/100" % value
	sanity_label.text = "MENTE · " + _sanity_tier_text(Sanity.current_tier)
	match Sanity.current_tier:
		Sanity.Tier.STABLE:
			sanity_label.add_theme_color_override("font_color", Color(0.72, 0.8, 0.75, 1))
		Sanity.Tier.UNEASY:
			sanity_label.add_theme_color_override("font_color", Color(0.78, 0.71, 0.52, 1))
		Sanity.Tier.FRACTURED:
			sanity_label.add_theme_color_override("font_color", Color(0.75, 0.53, 0.42, 1))
		Sanity.Tier.BREAKING:
			sanity_label.add_theme_color_override("font_color", Color(0.73, 0.36, 0.34, 1))
	if vignette:
		var target_alpha = lerp(0.78, 0.16, float(value) / 100.0)
		var tween = create_tween()
		tween.tween_property(vignette, "modulate:a", target_alpha, 0.6).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)

func _sanity_tier_text(tier: int) -> String:
	match tier:
		Sanity.Tier.STABLE: return "ESTABLE"
		Sanity.Tier.UNEASY: return "INQUIETO"
		Sanity.Tier.FRACTURED: return "FRACTURADO"
		Sanity.Tier.BREAKING: return "AL BORDE"
		_: return "DESCONOCIDO"

func _on_objective_changed(_objective_id: String, objective_text: String) -> void:
	if objective_text.is_empty():
		objective_label.text = "CASO — Sin objetivo activo"
	else:
		objective_label.text = "CASO — " + objective_text
		if hud_initialized:
			_show_feedback("OBJETIVO ACTUALIZADO", objective_text, Color(0.66, 0.72, 0.68, 1))
	if casebook_backdrop.visible:
		_refresh_casebook()

func _on_evidence_discovered(_evidence_id: String, evidence: Dictionary) -> void:
	if hud_initialized:
		_show_feedback("EVIDENCIA REGISTRADA", str(evidence.get("title", "Nueva evidencia")), Color(0.78, 0.62, 0.34, 1))
		_play_cached_sfx("evidence", 0.95)
	if casebook_backdrop.visible:
		_refresh_casebook()

func _show_feedback(kicker: String, message: String, accent: Color) -> void:
	if not feedback_stack:
		return
	var card = PanelContainer.new()
	card.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.custom_minimum_size = Vector2(440, 74)
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.015, 0.019, 0.023, 0.95)
	style.border_width_left = 3
	style.border_color = accent
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	card.add_theme_stylebox_override("panel", style)
	var copy = VBoxContainer.new()
	copy.mouse_filter = Control.MOUSE_FILTER_IGNORE
	copy.add_theme_constant_override("separation", 2)
	var kicker_label = Label.new()
	kicker_label.text = kicker
	kicker_label.add_theme_color_override("font_color", accent)
	kicker_label.add_theme_font_size_override("font_size", 13)
	copy.add_child(kicker_label)
	var message_label = Label.new()
	message_label.text = message
	message_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	message_label.add_theme_color_override("font_color", Color(0.86, 0.86, 0.82, 1))
	message_label.add_theme_font_size_override("font_size", 17)
	copy.add_child(message_label)
	card.add_child(copy)
	if custom_font:
		_apply_theme_font_recursive(card, custom_font)
	feedback_stack.add_child(card)
	card.modulate.a = 0.0
	card.position.x = 22.0
	var tween = create_tween()
	tween.tween_property(card, "modulate:a", 1.0, 0.2)
	tween.parallel().tween_property(card, "position:x", 0.0, 0.26).set_trans(Tween.TRANS_QUINT).set_ease(Tween.EASE_OUT)
	tween.tween_interval(2.7)
	tween.tween_property(card, "modulate:a", 0.0, 0.35)
	tween.finished.connect(func(): card.queue_free())

func _on_item_added(_item: ItemData) -> void:
	_update_inventory_ui()
	_play_pickup_sfx()

func _on_item_removed(_item: ItemData) -> void:
	_update_inventory_ui()

func _on_active_item_changed(item: ItemData) -> void:
	if item:
		active_item_label.text = "Seleccionado: " + item.name
		hover_label.text = "Objeto activo: " + item.name
		_play_select_sfx()
	else:
		active_item_label.text = "Sin selección"
		clear_hover_text()

func _update_inventory_ui() -> void:
	inventory_panel.visible = not Inventory.items.is_empty()
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
		tween.tween_property(slot_btn, "scale", Vector2.ONE, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func _on_slot_pressed(item: ItemData) -> void:
	if Inventory.active_item == item:
		Inventory.set_active_item(null)
	else:
		Inventory.set_active_item(item)

func _on_case_pressed() -> void:
	if DialogueManager.current_balloon:
		return
	casebook_backdrop.visible = true
	InputController.block_input(true)
	_refresh_casebook()

func _on_case_close_pressed() -> void:
	casebook_backdrop.visible = false
	InputController.block_input(false)

func _refresh_casebook() -> void:
	casebook_objective.text = Investigation.get_current_objective_text()
	if casebook_objective.text.is_empty():
		casebook_objective.text = "Sin objetivo activo."
	for child in evidence_list.get_children():
		child.queue_free()
	if Investigation.discovered_evidence.is_empty():
		var empty_label = Label.new()
		empty_label.text = "Todavía no hay evidencia registrada."
		empty_label.add_theme_font_size_override("font_size", 19)
		evidence_list.add_child(empty_label)
		if custom_font:
			_apply_theme_font_recursive(empty_label, custom_font)
		return
	for evidence_id in Investigation.discovered_evidence:
		var evidence = Investigation.get_evidence(evidence_id)
		var entry = VBoxContainer.new()
		entry.custom_minimum_size = Vector2(1100, 88)
		entry.add_theme_constant_override("separation", 5)
		var title = Label.new()
		title.text = str(evidence.get("title", evidence_id)).to_upper()
		title.add_theme_color_override("font_color", Color(0.78, 0.62, 0.34, 1))
		title.add_theme_font_size_override("font_size", 20)
		entry.add_child(title)
		var category = Label.new()
		category.text = str(evidence.get("category", "evidence")).to_upper()
		category.add_theme_color_override("font_color", Color(0.48, 0.5, 0.48, 1))
		category.add_theme_font_size_override("font_size", 12)
		entry.add_child(category)
		var description = Label.new()
		description.text = str(evidence.get("description", ""))
		description.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		description.custom_minimum_size = Vector2(1080, 45)
		description.add_theme_color_override("font_color", Color(0.82, 0.81, 0.76, 1))
		description.add_theme_font_size_override("font_size", 17)
		entry.add_child(description)
		evidence_list.add_child(entry)
		evidence_list.add_child(HSeparator.new())
		if custom_font:
			_apply_theme_font_recursive(entry, custom_font)

func _init_sfx_cache() -> void:
	cached_sfx["pickup_1"] = _generate_sfx_stream(0.12, 80)
	cached_sfx["pickup_2"] = _generate_sfx_stream(0.18, 110)
	cached_sfx["select"] = _generate_sfx_stream(0.3, 30)
	cached_sfx["reveal"] = _generate_sfx_stream(0.15, 95)
	cached_sfx["evidence"] = _generate_sfx_stream(0.08, 170)

func _generate_sfx_stream(phase_step: float, duration_ms: int) -> AudioStreamWAV:
	var stream = AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = 11025
	stream.stereo = false
	var sample_count = duration_ms * 11
	var data = PackedByteArray()
	data.resize(sample_count * 2)
	for i in range(sample_count):
		var envelope = pow(max(0.0, 1.0 - float(i) / float(sample_count)), 2.0)
		var value = sin(float(i) * phase_step) * 0.16 * envelope
		var sample = int(value * 32767.0)
		data[i * 2] = sample & 0xff
		data[i * 2 + 1] = (sample >> 8) & 0xff
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
	sfx_player.volume_db = -9.0
	sfx_player.play()
	sfx_player.finished.connect(func(): sfx_player.queue_free())

func _on_reveal_pressed() -> void:
	_play_cached_sfx("reveal", 1.6)
	if OS.get_name() in ["Android", "iOS"]:
		Input.vibrate_handheld(120)
	for hs in get_tree().get_nodes_in_group("hotspots"):
		if hs is Hotspot and hs.has_method("reveal_feedback"):
			hs.reveal_feedback()

func _play_pickup_sfx() -> void:
	_play_cached_sfx("pickup_1", 1.0)
	await get_tree().create_timer(0.06).timeout
	_play_cached_sfx("pickup_2", 1.18)

func _play_select_sfx() -> void:
	_play_cached_sfx("select", 0.85)
