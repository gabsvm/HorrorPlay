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
		DialogueManager.show_dialogue(["Las luces del pueblo apenas atraviesan la niebla detrás de mí."], "Inspector")

func _on_boathouse_door_interacted(verb: String) -> void:
	if verb == "examine":
		if GameState.get_flag("boathouse_unlocked"):
			DialogueManager.show_dialogue(["La cerradura ya está abierta. Del interior llega un olor a aceite, sal y madera húmeda."], "Inspector")
		elif GameState.get_flag("has_dock_key"):
			DialogueManager.show_dialogue(["Una cerradura naval antigua. La llave de Barnaby coincide con el perfil del cilindro."], "Inspector")
		else:
			DialogueManager.show_dialogue(["Una cerradura naval antigua, demasiado sólida para forzarla sin herramientas. Alguien en el pueblo tiene que conservar un duplicado."], "Inspector")
		return
	if verb != "interact":
		return
	if not GameState.get_flag("has_dock_key"):
		if Investigation.current_objective_id == "find_local_lead":
			Investigation.set_objective("get_dock_access")
		DialogueManager.show_dialogue([
			"La cerradura no cede.",
			"Necesito identificar quién controlaba el acceso al cobertizo y conseguir la llave sin destrozar una posible escena de evidencia."
		], "Inspector")
		return
	if not GameState.get_flag("boathouse_unlocked"):
		GameState.set_flag("boathouse_unlocked", true)
		await DialogueManager.show_dialogue([
			"La llave de hierro entra hasta el fondo. Tengo que hacer fuerza para vencer la costra de sal.",
			"[shake rate=12 level=5]CLACK.[/shake] El cerrojo se retrae y algo golpea suavemente del otro lado de la puerta.",
			"No fue una rata."
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
			DialogueManager.show_dialogue(["El manifiesto confirma la relación: bote 317, tres hombres, casillero de servicio 317."], "Inspector")
		return
	if verb == "examine":
		DialogueManager.show_dialogue(["Un portapapeles empapado quedó atrapado bajo una caja. Todavía se distingue el sello de la Guardia Costera."], "Inspector")
		return
	if verb == "interact":
		GameState.set_flag("dock_manifest_read", true)
		Investigation.discover_evidence("dock_manifest")
		if not GameState.get_flag("has_dock_key"):
			Investigation.set_objective("get_dock_access")
		await DialogueManager.show_dialogue([
			"MANIFIESTO DE SALIDA — UNIDAD 317.",
			"Tres guardacostas. Combustible para seis horas. Bengalas. Radio portátil. Destino declarado: patrulla del Arrecife del Diablo.",
			"En el margen alguien escribió: [color=#ca8a04]«equipo de repuesto — casillero 317»[/color].",
			"La línea de regreso está vacía. El documento lleva la firma del hombre cuya fotografía vi en la taberna."
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
		"Pero junto a ellas hay otras marcas.",
		"Cinco dedos demasiado largos unidos por una membrana. [shake rate=14 level=6]Apuntan desde el mar hacia tierra.[/shake]",
		"No estoy siguiendo solamente el rastro de tres hombres desaparecidos."
	], "Inspector")
	await _maybe_trigger_water_event()

func _on_boat_interacted(verb: String) -> void:
	if verb == "examine":
		DialogueManager.show_dialogue([
			"El casco lleva el número 317. La pintura parece raspada desde abajo, no contra el muelle.",
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
		"Después, nada. Solo lluvia."
	], "Inspector")
	Sanity.drain_sanity(5)
