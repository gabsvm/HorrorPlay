# res://src/rooms/room_02_streets/room_02_streets.gd
extends Room

@onready var player: Player = $CharactersLayer/Player
@onready var door_back: Hotspot = $HotspotsLayer/DoorBack
@onready var tavern_door: Hotspot = $HotspotsLayer/TavernDoor
@onready var fisherman: Hotspot = $HotspotsLayer/Fisherman
@onready var dock_path: Hotspot = $HotspotsLayer/DockPath

func _ready() -> void:
	super._ready()
	
	door_back.interacted.connect(_on_door_back_interacted)
	tavern_door.interacted.connect(_on_tavern_door_interacted)
	fisherman.interacted.connect(_on_fisherman_interacted)
	dock_path.interacted.connect(_on_dock_path_interacted)
	_apply_barnaby_consequences()

func _apply_barnaby_consequences() -> void:
	if not GameState.get_flag("barnaby_threatened"):
		return
	
	fisherman.is_active = false
	var fisherman_sprite = fisherman.get_node_or_null("Sprite2D")
	if fisherman_sprite:
		fisherman_sprite.visible = false
	
	if not GameState.get_flag("street_after_threat_seen"):
		GameState.set_flag("street_after_threat_seen", true)
		DialogueManager.show_dialogue([
			"Al salir de la taberna, las calles parecen haberse vaciado demasiado rápido.",
			"Silas ya no está bajo el farol. Solo queda una colilla encendida, aplastada en el agua de lluvia.",
			"Barnaby cumplió su advertencia: ahora Innsmouth sabe que estoy haciendo preguntas."
		], "Inspector")

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

func _on_dock_path_interacted(verb: String) -> void:
	if verb == "interact":
		if not GameState.get_flag("docks_visited"):
			DialogueManager.show_dialogue([
				"El callejón desciende hacia los muelles. El olor a sal se vuelve casi metálico.",
				"No necesito una llave para llegar al agua... solo para entrar donde los guardacostas guardaban sus equipos."
			], "Inspector")
		SceneRouter.change_room("res://src/rooms/room_04_docks/room_04_docks.tscn")
	elif verb == "examine":
		if GameState.get_flag("has_dock_key"):
			DialogueManager.show_dialogue(["El sendero baja hacia el muelle. La llave de Barnaby pesa en el bolsillo."], "Inspector")
		else:
			DialogueManager.show_dialogue(["Más abajo distingo el cobertizo de los guardacostas junto al agua."], "Inspector")

func _on_fisherman_interacted(verb: String) -> void:
	if verb == "interact":
		if GameState.get_flag("has_dock_key"):
			DialogueManager.show_dialogue([
				"Silas mira la llave y palidece. —Entonces vas en serio.",
				"—En el muelle buscá el número [color=#ca8a04]317[/color]. Pero si encontrás algo que parezca haber venido del agua... no lo lleves de vuelta al pueblo."
			], "Pescador Sombrío")
		elif GameState.get_flag("has_read_necronomicon"):
			var first_interview = not GameState.get_flag("fisherman_met")
			if first_interview:
				DialogueManager.show_dialogue([
					"¿Ese cuaderno de cuero...? Es de él. Reconozco las coordenadas... el [color=#06b6d4]Arrecife del Diablo[/color]. Los guardacostas husmearon ahí y las aguas se los tragaron.",
					"Si querés terminar igual, necesitás desatar los botes del muelle. Barnaby tiene la [color=#ca8a04]llave[/color] en la taberna... si es que no te echa antes.",
					"[wave amp=15 freq=3]No deberías seguir tentando a lo que duerme abajo, oficial. Innsmouth no olvida a los entrometidos.[/wave]"
				], "Pescador Sombrío")
				GameState.set_flag("fisherman_met", true)
				Investigation.discover_evidence("reef_testimony")
				Investigation.set_objective("get_dock_access")
			else:
				DialogueManager.show_dialogue([
					"Ya te dije lo que sé. Barnaby conserva la llave. Yo no pienso acercarme al agua esta noche.",
					"[wave amp=12 freq=2.5]Y si escuchás que algo responde desde la niebla... no respondas vos.[/wave]"
				], "Pescador Sombrío")
		else:
			DialogueManager.show_dialogue([
				"[wave amp=10 freq=2]La niebla está espesa, forastero... y la marea viene con hambre.[/wave]",
				"No meta las narices donde no debe si valora el [shake rate=15 level=6]pellejo[/shake]."
			], "Pescador Sombrío")
	elif verb == "examine":
		DialogueManager.show_dialogue(["Un anciano pescador. Huele a algas descompuestas y escamas secas."], "Inspector")
