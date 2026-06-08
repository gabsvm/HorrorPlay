# res://src/common/classes/hotspot.gd
class_name Hotspot
extends Area2D

signal interacted(verb: String)
signal item_used_successfully(item: ItemData)
signal item_used_failed(item: ItemData)

@export var hotspot_name: String = "Object"
@export var is_active: bool = true
@export var required_item: ItemData = null
@export var walk_to_point: Marker2D

func _ready() -> void:
	input_pickable = true
	add_to_group("hotspots")
	# Set collision layer 1 (Hotspots) as defined in project.godot
	collision_layer = 1
	collision_mask = 0
	
	# Connect to input signals for hover cursor feedback
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)

func execute_interaction(verb: String) -> void:
	if not is_active:
		return
		
	if verb == "use_item":
		var active_item = Inventory.active_item
		if active_item == required_item:
			_on_successful_item_use(active_item)
		else:
			_on_failed_item_use(active_item)
		return
			
	interacted.emit(verb)

func _on_successful_item_use(item: ItemData) -> void:
	item_used_successfully.emit(item)

func _on_failed_item_use(item: ItemData) -> void:
	item_used_failed.emit(item)

func _on_mouse_entered() -> void:
	if is_active and get_tree().current_scene:
		var hud = get_tree().current_scene.find_child("UI_HUD*", true, false)
		if hud and hud.has_method("show_hover_text"):
			hud.show_hover_text(hotspot_name)

func _on_mouse_exited() -> void:
	if get_tree().current_scene:
		var hud = get_tree().current_scene.find_child("UI_HUD*", true, false)
		if hud and hud.has_method("clear_hover_text"):
			hud.clear_hover_text()
