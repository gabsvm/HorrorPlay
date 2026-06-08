# res://src/rooms/room_03_tavern/room_03_tavern.gd
extends Room

@onready var player: Player = $CharactersLayer/Player
@onready var door_back: Hotspot = $HotspotsLayer/DoorBack
@onready var innkeeper: Hotspot = $HotspotsLayer/Innkeeper

@export var dock_key_item: ItemData

func _ready() -> void:
	super._ready()
	InputController.interaction_requested.connect(_on_interaction_requested)
	
	door_back.interacted.connect(_on_door_back_interacted)
	innkeeper.interacted.connect(_on_innkeeper_interacted)

func _on_interaction_requested(action_type: String, pos: Vector2) -> void:
	if InputController.is_input_blocked:
		return
		
	var query = PhysicsPointQueryParameters2D.new()
	query.position = pos
	query.collision_mask = 1 # Hotspot layer
	query.collide_with_areas = true
	
	var space_state = get_world_2d().direct_space_state
	var results = space_state.intersect_point(query)
	
	if results.size() > 0:
		var area = results[0]["collider"] as Hotspot
		if area and area.is_active:
			_walk_and_execute(area, action_type)
	else:
		if action_type == "interact" and Inventory.active_item == null:
			player.walk_to(pos)

func _walk_and_execute(hotspot: Hotspot, verb: String) -> void:
	if hotspot.walk_to_point:
		InputController.block_input(true)
		await player.walk_to(hotspot.walk_to_point.global_position)
		InputController.block_input(false)
		
	hotspot.execute_interaction(verb)

func _on_door_back_interacted(verb: String) -> void:
	if verb == "interact":
		DialogueManager.show_dialogue(["Saliendo nuevamente a las calles frías y húmedas..."], "Inspector")
		SceneRouter.change_room("res://src/rooms/room_02_streets/room_02_streets.tscn")
	elif verb == "examine":
		DialogueManager.show_dialogue(["La pesada puerta de entrada de la taberna."], "Inspector")

func _on_innkeeper_interacted(verb: String) -> void:
	if verb == "interact":
		if GameState.get_flag("has_dock_key"):
			DialogueManager.show_dialogue(["Ya te di la llave. No hay nada más para vos acá, inspector."], "Tabernero")
		elif GameState.get_flag("fisherman_met") and GameState.get_flag("has_read_necronomicon"):
			DialogueManager.show_dialogue([
				"Así que el viejo Silas te mandó... Sí, tengo la llave de los candados del muelle.",
				"El oficial desaparecido me la dejó para saldar su cuenta antes de marchar al Arrecife.",
				"Tomala, inspector. Pero si terminás ahogado como él, yo no sé nada."
			], "Tabernero")
			if dock_key_item:
				Inventory.add_item(dock_key_item)
			GameState.set_flag("has_dock_key", true)
		else:
			DialogueManager.show_dialogue([
				"No servimos a extranjeros curiosos, inspector.",
				"Tomate tu trago caliente y marchate antes de que la marea suba más."
			], "Tabernero")
	elif verb == "examine":
		DialogueManager.show_dialogue(["El tabernero Barnaby. Limpia un vaso mugriento y me mira con hostilidad."], "Inspector")
