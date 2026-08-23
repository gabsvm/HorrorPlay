# res://src/common/classes/item_data.gd
class_name ItemData
extends Resource

@export var id: String = ""
@export var name: String = ""
@export_multiline var description: String = ""
@export var icon: Texture2D
@export_enum("", "use_mid", "pickup_low", "inspect", "none") var world_use_animation: String = ""
@export var combinable_with: Array[ItemData] = []
@export var resulting_item: ItemData = null
