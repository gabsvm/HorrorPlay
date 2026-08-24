# res://src/rooms/room_04_docks/room_04_docks.gd
extends Room

@onready var player: Player = $CharactersLayer/Player
@onready var back_path: Hotspot = $HotspotsLayer/BackPath
@onready var boathouse_door: Hotspot = $HotspotsLayer/BoathouseDoor
@onready var manifest: Hotspot = $HotspotsLayer/Manifest
@onready var shoreline: Hotspot = $HotspotsLayer/Shoreline
@onready var boat_317: Hotspot = $HotspotsLayer/Boat317

func _ready() -> void:
	footstep_surface = "wet_wood"
	walk_bounds = Rect2(30, 700, 1860, 330)
	character_base_scale = 1.08
	character_max_speed = 292.0
	character_acceleration = 1450.0
	character_deceleration = 2050.0
	character_walk_bob = 2.1
	character_walk_sway = 1.45
	character_depth_scaling_enabled = true
	character_depth_y_min = 710.0
	character_depth_y_max = 860.0
	character_scale_far = 0.96
	character_scale_near = 1.05
	personal_light_enabled = true
	personal_light_energy = 0.46
	personal_light_scale = 1.28
	super._ready()
	back_path.interacted.connect(_on_back_path_interacted)
	boathouse_door.interacted.connect(_on_boathouse_door_interacted)
	manifest.interacted.connect(_on_manifest_interacted)
	shoreline.interacted.connect(_on_shoreline_interacted)
	boat_317.interacted.connect(_on_boat_interacted)
	GameState.set_flag("docks_visited", true)
	GameState.set_var("player_location", "docks")
	if GameState.get_flag("has_dock_key") and Investigation.current_objective_id == "reach_docks":
		Investigation.set_objective("enter_boathouse")

func _on_back_path_interacted(verb: String) -> void:
	if verb == "interact":
		await DialogueManager.show_dialogue(["Regreso por el callejón hacia las calles altas de Innsmouth."], "Inspector")
		SceneRouter.change_room("res://src/rooms/room_02_streets/room_02_streets.tscn")
	elif verb == "examine":
		DialogueManager.show_dialogue(["Las luces del pueblo apenas atraviesan la niebla detrás de mí. Por primera vez, el pueblo parece menos una amenaza que una frontera."], "Inspector")

func _on_boathouse_door_interacted(verb: String) -> void:
	if verb == "examine":
		if GameState.get_flag("boathouse_unlocked"):
			DialogueManager.show_dialogue(["La cerradura ya está abierta. Del interior llega un olor a aceite, sal y aislamiento eléctrico viejo."], "Inspector")
		elif GameState.get_flag("has_dock_key"):
			DialogueManager.show_dialogue(["Una cerradura naval antigua. La llave de Barnaby coincide con el perfil. Debajo de la pintura hay un pequeño círculo azul con la marca L-17."], "Inspector")
		else:
			DialogueManager.show_dialogue(["Una cerradura naval demasiado sólida para forzarla sin contaminar la escena. Bajo la sal asoma una marca de inventario federal."], "Inspector")
		return
	if verb != "interact":
		return
	if not GameState.get_flag("has_dock_key"):
		if Investigation.current_objective_id == "find_local_lead":
			Investigation.set_objective("get_dock_access")
		DialogueManager.show_dialogue([
			"La cerradura no cede.",
			"Necesito identificar quién controlaba el acceso al cobertizo y por qué alguien quiso mantenerlo cerrado después de la misión."
		], "Inspector")
		return
	if not GameState.get_flag("boathouse_unlocked"):
		GameState.set_flag("boathouse_unlocked", true)
		await DialogueManager.show_dialogue([
			"La llave de hierro entra hasta el fondo. Tengo que hacer fuerza para vencer la costra de sal.",
			"[shake rate=12 level=5]CLACK.[/shake] El cerrojo se retrae.",
			"Algo golpea suavemente del otro lado de la puerta. Después escucho un zumbido eléctrico muy bajo, imposible en un edificio sin corriente."
		], "Inspector")
		Sanity.drain_sanity(4)
	if GameState.get_flag("boathouse_power_on"):
		Investigation.set_objective("launch_boat")
	else:
		Investigation.set_objective("restore_boathouse_power")
	SceneRouter.change_room("res://src/rooms/room_05_boathouse/room_05_boathouse.tscn")

func _on_manifest_interacted(verb: String) -> void:
	if GameState.get_flag("dock_manifest_read"):
		if verb == "examine" or verb == "interact":
			DialogueManager.show_dialogue(["El manifiesto confirma algo peor que una patrulla perdida: el 317 llevaba equipo federal L-17 que nunca debió figurar en una misión ordinaria."], "Inspector")
		return
	if verb == "examine":
		DialogueManager.show_dialogue(["Un portapapeles empapado quedó atrapado bajo una caja. Todavía se distingue el sello de la Guardia Costera y, debajo, la sombra de otra marca arrancada."], "Inspector")
		return
	if verb == "interact":
		GameState.set_flag("dock_manifest_read", true)
		GameState.set_flag("lantern_code_seen", true)
		Investigation.discover_evidence("dock_manifest")
		if not GameState.get_flag("has_dock_key"):
			Investigation.set_objective("get_dock_access")
		await DialogueManager.show_dialogue([
			"MANIFIESTO DE SALIDA — UNIDAD 317.",
			"Hale. Mercer. Ward. Combustible para seis horas. Bengalas. Radio portátil.",
			"Debajo de la carga ordinaria aparece una línea escrita con otra máquina: [color=#06b6d4]«RECEPTOR ACÚSTICO L-17 / PROPIEDAD FEDERAL / NO INVENTARIAR»[/color].",
			"Mercer tiene un asterisco junto al apellido. La nota al pie fue arrancada.",
			"En el margen: «equipo de repuesto — casillero 317». La línea de regreso está vacía.",
			"Esto no fue una patrulla que se topó con algo. Alguien llevó deliberadamente un experimento hasta el arrecife."
		], "Inspector")
		await _maybe_trigger_water_event()

func _on_shoreline_interacted(verb: String) -> void:
	if verb != "interact" and verb != "examine":
		return
	if GameState.get_flag("dock_tracks_examined"):
		DialogueManager.show_dialogue(["La marea está borrando las marcas. Preferiría que lo hiciera más rápido."], "Inspector")
		return
	GameState.set_flag("dock_tracks_examined", true)
	GameState.set_var("dock_tension", max(1, int(GameState.get_var("dock_tension", 0))))
	Investigation.discover_evidence("amphibious_tracks")
	Sanity.drain_sanity(8)
	await DialogueManager.show_dialogue([
		"Hay huellas entre los pilotes. Botas de trabajo, profundas, que llegan desde el muelle hasta el borde del agua.",
		"Junto a ellas aparecen cinco dedos demasiado largos unidos por membrana. [shake rate=14 level=6]Apuntan desde el mar hacia tierra.[/shake]",
		"En una tabla cercana alguien talló tres líneas verticales y una frase casi borrada: «NO DIGAS LOS NOMBRES». Parece mucho más antigua que el incidente del 317.",
		"El pueblo no aprendió esta regla hace cuatro noches."
	], "Inspector")
	await _maybe_trigger_water_event()

func _on_boat_interacted(verb: String) -> void:
	if verb == "examine":
		DialogueManager.show_dialogue([
			"El casco lleva el número 317. La pintura parece raspada desde abajo, no contra el muelle.",
			"Dentro del compartimiento de radio hay cuatro puntos de fijación. Solo tres corresponden al equipo estándar. El cuarto fue retirado con prisa.",
			"El pescante sigue conectado al cobertizo; sin electricidad no podré botarlo con seguridad."
		], "Inspector")
	elif verb == "interact":
		if GameState.get_flag("boathouse_power_on"):
			DialogueManager.show_dialogue(["El sistema del pescante responde desde el cobertizo. Ya puedo preparar el 317."], "Inspector")
		else:
			DialogueManager.show_dialogue(["El bote está suspendido por el pescante. Primero tengo que recuperar la energía del cobertizo."], "Inspector")

func _maybe_trigger_water_event() -> void:
	if not GameState.get_flag("dock_manifest_read") or not GameState.get_flag("dock_tracks_examined"):
		return
	if int(GameState.get_var("dock_tension", 0)) >= 2:
		return
	GameState.set_var("dock_tension", 2)
	await get_tree().create_timer(0.4).timeout
	AudioBus.play_horror_stinger(0.55)
	AtmosphereController.horror_pulse(0.8)
	await DialogueManager.show_dialogue([
		"Algo pesado roza un pilote debajo de mí.",
		"El agua se abomba durante un segundo, como si una espalda enorme pasara justo bajo la superficie.",
		"Entonces mi radio portátil escupe una sílaba con mi propia voz. No llevaba el micrófono abierto.",
		"Después, nada. Solo lluvia."
	], "Inspector")
	Sanity.drain_sanity(5)
