# res://src/rooms/room_02_streets/room_02_streets.gd
extends Room

@onready var player: Player = $CharactersLayer/Player
@onready var door_back: Hotspot = $HotspotsLayer/DoorBack
@onready var tavern_door: Hotspot = $HotspotsLayer/TavernDoor
@onready var fisherman: Hotspot = $HotspotsLayer/Fisherman

func _ready() -> void:
	super._ready()
	InputController.interaction_requested.connect(_on_interaction_requested)
	
	door_back.interacted.connect(_on_door_back_interacted)
	tavern_door.interacted.connect(_on_tavern_door_interacted)
	fisherman.interacted.connect(_on_fisherman_interacted)

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
		DialogueManager.show_dialogue(["Volviendo a la seguridad de mi oficina..."], "Inspector")
		SceneRouter.change_room("res://src/rooms/room_01_office/room_01_office.tscn")
	elif verb == "examine":
		DialogueManager.show_dialogue(["La vieja puerta de roble de la estación de policía."], "Inspector")

func _on_tavern_door_interacted(verb: String) -> void:
	if verb == "interact":
		DialogueManager.show_dialogue(["La puerta de la taberna 'El Pez Dorado' rechina al abrirse..."], "Inspector")
		SceneRouter.change_room("res://src/rooms/room_03_tavern/room_03_tavern.tscn")
	elif verb == "examine":
		DialogueManager.show_dialogue(["Una fachada de taberna húmeda y maloliente con un farol verde."], "Inspector")

func _on_fisherman_interacted(verb: String) -> void:
	if verb == "interact":
		if GameState.get_flag("has_read_necronomicon"):
			DialogueManager.show_dialogue([
				"Esas coordenadas... son del Arrecife del Diablo. Los guardacostas fueron allí.",
				"Si querés ir, necesitás la llave de los botes. Barnaby en la taberna tiene un duplicado.",
				"Pero tené cuidado, muchacho... las profundidades reclaman lo suyo, y Innsmouth no olvida."
			], "Pescador Sombrío")
			GameState.set_flag("fisherman_met", true)
		else:
			DialogueManager.show_dialogue([
				"La niebla está densa hoy, extranjero...",
				"No deberías andar curioseando por estas calles si valorás tu cordura."
			], "Pescador Sombrío")
	elif verb == "examine":
		DialogueManager.show_dialogue(["Un anciano pescador. Huele a algas descompuestas y escamas secas."], "Inspector")
