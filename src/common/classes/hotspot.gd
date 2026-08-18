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

var reveal_container: Node2D = null
var reveal_tween: Tween = null

func _ready() -> void:
	input_pickable = true
	add_to_group("hotspots")
	collision_layer = 1
	collision_mask = 0
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)
	_build_reveal_geometry()

func execute_interaction(verb: String) -> void:
	if not is_active:
		return
	
	if verb == "use_item":
		var active_item = Inventory.active_item
		# A selected inventory item must not make every ordinary hotspot feel dead.
		# Only item-gated hotspots consume the item-use verb; everything else falls
		# back to its normal interaction while preserving the current selection.
		if required_item == null:
			interacted.emit("interact")
		elif active_item == required_item:
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

func reveal_feedback() -> void:
	if not is_active or not reveal_container:
		return
	if reveal_tween and reveal_tween.is_valid():
		reveal_tween.kill()
	
	reveal_container.visible = true
	reveal_container.modulate.a = 0.0
	reveal_tween = create_tween()
	reveal_tween.tween_property(reveal_container, "modulate:a", 1.0, 0.16).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	reveal_tween.tween_interval(0.35)
	reveal_tween.tween_property(reveal_container, "modulate:a", 0.0, 0.5).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN)
	await reveal_tween.finished
	if reveal_container:
		reveal_container.visible = false

func _build_reveal_geometry() -> void:
	var points = _get_collision_points()
	if points.size() < 3:
		return
	
	reveal_container = Node2D.new()
	reveal_container.name = "RevealOverlay"
	reveal_container.z_index = 100
	reveal_container.visible = false
	reveal_container.modulate.a = 0.0
	add_child(reveal_container)
	
	var fill = Polygon2D.new()
	fill.polygon = points
	fill.color = Color(0.05, 0.88, 1.0, 0.14)
	reveal_container.add_child(fill)
	
	var outline = Line2D.new()
	outline.points = points
	outline.closed = true
	outline.width = 5.0
	outline.default_color = Color(0.25, 0.95, 1.0, 0.92)
	outline.antialiased = true
	reveal_container.add_child(outline)

func _get_collision_points() -> PackedVector2Array:
	var result = PackedVector2Array()
	var poly_node = get_node_or_null("CollisionPolygon2D")
	if poly_node and poly_node is CollisionPolygon2D:
		for point in poly_node.polygon:
			result.append(poly_node.transform * point)
		return result
	
	var shape_node = get_node_or_null("CollisionShape2D")
	if not shape_node or not shape_node is CollisionShape2D or not shape_node.shape:
		return result
	
	if shape_node.shape is RectangleShape2D:
		var half = shape_node.shape.size / 2.0
		for point in [
			Vector2(-half.x, -half.y),
			Vector2(half.x, -half.y),
			Vector2(half.x, half.y),
			Vector2(-half.x, half.y)
		]:
			result.append(shape_node.transform * point)
	elif shape_node.shape is CircleShape2D:
		var radius = shape_node.shape.radius
		for i in range(24):
			var angle = TAU * float(i) / 24.0
			result.append(shape_node.transform * Vector2(cos(angle), sin(angle)) * radius)
	
	return result
