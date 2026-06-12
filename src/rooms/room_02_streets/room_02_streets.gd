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
		
	# Find which hotspot was clicked geometrically (fully thread-safe & robust!)
	var clicked_hotspot: Hotspot = null
	var hotspots_parent = get_node_or_null("HotspotsLayer")
	if hotspots_parent:
		for hs in hotspots_parent.get_children():
			if hs is Hotspot and hs.is_active:
				if hs.is_point_inside(pos):
					clicked_hotspot = hs
					break
					
	if clicked_hotspot:
		_walk_and_execute(clicked_hotspot, action_type)
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
				"¿Ese cuaderno de cuero...? Es de él. Reconozco las coordenadas... el [color=#06b6d4]Arrecife del Diablo[/color]. Los guardacostas husmearon ahí y las aguas se los tragaron.",
				"Si querés terminar igual, necesitás desatar los botes del muelle. Barnaby tiene la [color=#ca8a04]llave[/color] en la taberna... si es que no te echa antes.",
				"[wave amp=15 freq=3]No deberías seguir tentando a lo que duerme abajo, oficial. Innsmouth no olvida a los entrometidos.[/wave]"
			], "Pescador Sombrío")
			GameState.set_flag("fisherman_met", true)
		else:
			DialogueManager.show_dialogue([
				"[wave amp=10 freq=2]La niebla está espesa, forastero... y la marea viene con hambre.[/wave]",
				"No meta las narices donde no debe si valora el [shake rate=15 level=6]pellejo[/shake]."
			], "Pescador Sombrío")
	elif verb == "examine":
		DialogueManager.show_dialogue(["Un anciano pescador. Huele a algas descompuestas y escamas secas."], "Inspector")
