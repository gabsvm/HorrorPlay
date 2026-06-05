# res://src/autoload/inventory.gd
extends Node

signal item_added(item: ItemData)
signal item_removed(item: ItemData)
signal active_item_changed(item: ItemData)
signal items_combined(item_a: ItemData, item_b: ItemData, result: ItemData)

var items: Array[ItemData] = []
var active_item: ItemData = null

func add_item(item: ItemData) -> void:
	if item and not items.has(item):
		items.append(item)
		item_added.emit(item)

func remove_item(item: ItemData) -> void:
	if items.has(item):
		items.erase(item)
		if active_item == item:
			set_active_item(null)
		item_removed.emit(item)

func set_active_item(item: ItemData) -> void:
	active_item = item
	active_item_changed.emit(item)

func has_item(item_id: String) -> bool:
	for i in items:
		if i.id == item_id:
			return true
	return false

func get_item_by_id(item_id: String) -> ItemData:
	for i in items:
		if i.id == item_id:
			return i
	return null

func try_combine_items(item_a: ItemData, item_b: ItemData) -> bool:
	if not item_a or not item_b:
		return false
	
	if item_a.combinable_with.has(item_b) and item_a.resulting_item:
		var result = item_a.resulting_item
		remove_item(item_a)
		remove_item(item_b)
		add_item(result)
		items_combined.emit(item_a, item_b, result)
		return true
	elif item_b.combinable_with.has(item_a) and item_b.resulting_item:
		var result = item_b.resulting_item
		remove_item(item_a)
		remove_item(item_b)
		add_item(result)
		items_combined.emit(item_b, item_a, result)
		return true
		
	return false
