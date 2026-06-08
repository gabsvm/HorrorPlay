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

func is_point_inside(global_pos: Vector2) -> bool:
	var poly_node = get_node_or_null("CollisionPolygon2D")
	if poly_node and poly_node is CollisionPolygon2D:
		var local_pos = poly_node.to_local(global_pos)
		return Geometry2D.is_point_in_polygon(local_pos, poly_node.polygon)
		
	var shape_node = get_node_or_null("CollisionShape2D")
	if shape_node and shape_node is CollisionShape2D and shape_node.shape:
		var local_pos = shape_node.to_local(global_pos)
		if shape_node.shape is RectangleShape2D:
			var rect_size = shape_node.shape.size
			return abs(local_pos.x) <= rect_size.x / 2.0 and abs(local_pos.y) <= rect_size.y / 2.0
		elif shape_node.shape is CircleShape2D:
			return local_pos.length() <= shape_node.shape.radius
			
	return false
