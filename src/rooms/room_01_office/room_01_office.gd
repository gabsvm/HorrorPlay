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
				"Reportes de muertes locales... Autopsias inconclusas que hablan de 'asfixia seca' en tierra firme.",
				"Bajo la pila de expedientes confiscados, encuentro una [color=#ca8a04]llave de bronce[/color] cubierta de herrumbre verdosa."
			], "Inspector")
			if key_item:
				Inventory.add_item(key_item)
		else:
			DialogueManager.show_dialogue(["Solo quedan expedientes con manchas de humedad salina."], "Inspector")
	elif verb == "examine":
		DialogueManager.show_dialogue(["Mi escritorio de roble. Huele a [i]tabaco rancio[/i], papel viejo y a ese persistente hedor a pescado descompuesto que sube desde el muelle."], "Inspector")

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
		DialogueManager.show_dialogue(["Cientos de lomos gastados me miran desde la [i]oscuridad[/i]."], "Inspector")

func _on_read_modern_book() -> void:
	DialogueManager.show_dialogue([
		"Un tratado de patologías costeras de 1898...",
		"Describe deformidades congénitas en los pobladores de Innsmouth: ojos fijos sin párpados, piel escamosa e hipoplasia pulmonar con indicios de hendiduras branquiales internas.",
		"Qué aberración científica..."
	])

func _on_read_ancient_diary() -> void:
	DialogueManager.show_dialogue([
		"Las páginas están llenas de [color=#ca8a04]símbolos astrológicos[/color] y menciones a un [color=#06b6d4]arrecife costero[/color].",
		"Siento una ligera [shake rate=20 level=10]punzada en la nuca[/shake] al leerlo."
	])
	Sanity.drain_sanity(10)
	GameState.set_flag("has_read_necronomicon", true)
	if book_item:
		Inventory.add_item(book_item)

func _on_read_whispers() -> void:
	DialogueManager.show_dialogue([
		"[wave amp=20 freq=4]Un coro de voces inaudibles describe la geometría de las estrellas.[/wave]",
		"[shake rate=25 level=12]Mi mente tiembla ante tal verdad.[/shake]"
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
		"La llave oxidada gira con un [shake rate=15 level=5][i]chirrido metálico espantoso[/i][/shake].",
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
