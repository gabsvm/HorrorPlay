# res://src/rooms/room_01_office/room_01_office.gd
extends Room

@onready var player: Player = $CharactersLayer/Player
@onready var desk: Hotspot = $HotspotsLayer/Desk
@onready var bookcase: Hotspot = $HotspotsLayer/Bookcase
@onready var drawer: Hotspot = $HotspotsLayer/Drawer
@onready var door: Hotspot = $HotspotsLayer/Door

# Item resources for testing
@export var key_item: ItemData
@export var book_item: ItemData

func _ready() -> void:
	super._ready()
	
	# Register for the generalized input clicks/taps
	InputController.interaction_requested.connect(_on_interaction_requested)
	
	# Wire up hotspots to room-specific narratives
	desk.interacted.connect(_on_desk_interacted)
	bookcase.interacted.connect(_on_bookcase_interacted)
	
	drawer.interacted.connect(_on_drawer_interacted)
	drawer.item_used_successfully.connect(_on_drawer_unlocked)
	drawer.item_used_failed.connect(_on_drawer_unlock_failed)
	
	door.interacted.connect(_on_door_interacted)

func _on_interaction_requested(action_type: String, pos: Vector2) -> void:
	if InputController.is_input_blocked:
		return
		
	# Find what was clicked/tapped by query of 2D physics
	var query = PhysicsPointQueryParameters2D.new()
	query.position = pos
	query.collision_mask = 1 # Hotspot layer
	query.collide_with_areas = true
	query.collide_with_bodies = false
	
	var space_state = get_world_2d().direct_space_state
	var results = space_state.intersect_point(query)
	
	if results.size() > 0:
		# Clicked on a hotspot! Find the topmost one (by Z Index or first result)
		var area = results[0]["collider"] as Hotspot
		if area and area.is_active:
			_walk_and_execute(area, action_type)
	else:
		# Clicked on the floor! Walk player there if not examining/using item
		if action_type == "interact" and Inventory.active_item == null:
			player.walk_to(pos)

func _walk_and_execute(hotspot: Hotspot, verb: String) -> void:
	if hotspot.walk_to_point:
		InputController.block_input(true)
		await player.walk_to(hotspot.walk_to_point.global_position)
		InputController.block_input(false)
		
	if Inventory.active_item != null and verb == "interact":
		hotspot.execute_interaction("use_item")
	else:
		hotspot.execute_interaction(verb)

func _on_desk_interacted(verb: String) -> void:
	if verb == "interact":
		if not GameState.get_flag("office_drawer_unlocked"):
			DialogueManager.show_dialogue([
				"Un escritorio desordenado con reportes policiales.",
				"Encuentro una llave oxidada oculta bajo unos papeles amarillentos."
			], "Inspector")
			if key_item:
				Inventory.add_item(key_item)
		else:
			DialogueManager.show_dialogue(["El escritorio ya no tiene nada de interés."], "Inspector")
	elif verb == "examine":
		DialogueManager.show_dialogue(["Es mi escritorio de roble. Huele a tabaco rancio y humedad."], "Inspector")

func _on_bookcase_interacted(verb: String) -> void:
	if verb == "interact":
		DialogueManager.show_choices(
			"Una enorme biblioteca repleta de libros antiguos. ¿Qué tomo reviso?",
			[
				{
					"text": "Leer tomo médico moderno.",
					"callback": _on_read_modern_book
				},
				{
					"text": "[Sanidad > 60] Consultar el antiguo diario de cuero.",
					"sanity_min": 60,
					"callback": _on_read_ancient_diary
				},
				{
					"text": "[Sanidad <= 50] Entregarse a los susurros de los estantes inferiores.",
					"sanity_max": 50,
					"callback": _on_read_whispers
				}
			],
			"Inspector"
		)
	elif verb == "examine":
		DialogueManager.show_dialogue(["Cientos de lomos gastados me miran desde la oscuridad."], "Inspector")

func _on_read_modern_book() -> void:
	DialogueManager.show_dialogue(["Habla de tratamientos psiquiátricos obsoletos. Nada útil."])

func _on_read_ancient_diary() -> void:
	DialogueManager.show_dialogue([
		"Las páginas están llenas de símbolos astrológicos y menciones a un arrecife costero.",
		"Siento una ligera punzada en la nuca al leerlo."
	])
	Sanity.drain_sanity(10)
	GameState.set_flag("has_read_necronomicon", true)
	if book_item:
		Inventory.add_item(book_item)

func _on_read_whispers() -> void:
	DialogueManager.show_dialogue([
		"Un coro de voces inaudibles describe la geometría de las estrellas.",
		"Mi mente tiembla ante tal verdad."
	])
	Sanity.drain_sanity(30)

func _on_drawer_interacted(verb: String) -> void:
	if GameState.get_flag("office_drawer_unlocked"):
		DialogueManager.show_dialogue(["El cajón está abierto, pero solo queda aserrín."], "Inspector")
	else:
		DialogueManager.show_dialogue(["El cajón de bronce está cerrado bajo llave."], "Inspector")

func _on_drawer_unlocked(item: ItemData) -> void:
	GameState.set_flag("office_drawer_unlocked", true)
	Inventory.remove_item(item)
	DialogueManager.show_dialogue([
		"La llave oxidada gira con un chirrido metálico espantoso.",
		"El cajón de bronce está desbloqueado."
	], "Inspector")

func _on_drawer_unlock_failed(item: ItemData) -> void:
	DialogueManager.show_dialogue(["Este objeto no encaja en la cerradura del cajón."], "Inspector")

func _on_door_interacted(verb: String) -> void:
	if verb == "interact":
		if GameState.get_flag("office_drawer_unlocked"):
			DialogueManager.show_dialogue(["Es hora de salir a las calles lluviosas de Innsmouth..."], "Inspector")
			SceneRouter.change_room("res://src/rooms/room_02_streets/room_02_streets.tscn")
		else:
			DialogueManager.show_dialogue(["No puedo marcharme de la oficina sin antes asegurar mis pertenencias cerradas."], "Inspector")
	elif verb == "examine":
		DialogueManager.show_dialogue(["La puerta pesada de roble conduce al pasillo de salida."], "Inspector")
