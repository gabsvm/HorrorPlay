# res://src/rooms/room_02_streets/room_02_streets.gd
extends Room

@onready var player: Player = $CharactersLayer/Player
@onready var door_back: Hotspot = $HotspotsLayer/DoorBack
@onready var tavern_door: Hotspot = $HotspotsLayer/TavernDoor
@onready var fisherman: Hotspot = $HotspotsLayer/Fisherman
@onready var fish_market: Hotspot = $HotspotsLayer/FishMarket
@onready var harbor_notice: Hotspot = $HotspotsLayer/HarborNotice
@onready var dock_path: Hotspot = $HotspotsLayer/DockPath
@onready var threat_watcher: Polygon2D = $ForegroundLayer/ThreatWatcher

func _ready() -> void:
	footstep_surface = "stone"
	walk_bounds = Rect2(30, 720, 1860, 310)
	super._ready()
	GameState.set_var("player_location", "streets")
	door_back.interacted.connect(_on_door_back_interacted)
	tavern_door.interacted.connect(_on_tavern_door_interacted)
	fisherman.interacted.connect(_on_fisherman_interacted)
	fish_market.interacted.connect(_on_fish_market_interacted)
	harbor_notice.interacted.connect(_on_harbor_notice_interacted)
	dock_path.interacted.connect(_on_dock_path_interacted)
	threat_watcher.visible = false
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
		call_deferred("_run_after_threat_beat")

func _run_after_threat_beat() -> void:
	await DialogueManager.show_dialogue([
		"Al salir de la taberna, la calle se ha vaciado demasiado rápido.",
		"Silas ya no está bajo el farol. Su colilla sigue encendida en un charco.",
		"En una ventana del mercado una silueta se aparta apenas giro la cabeza. Barnaby cumplió su advertencia: ahora Innsmouth sabe que estoy preguntando."
	], "Inspector")
	threat_watcher.visible = true
	threat_watcher.modulate.a = 0.0
	var tween = create_tween()
	tween.tween_property(threat_watcher, "modulate:a", 0.62, 0.18)
	tween.tween_interval(0.45)
	tween.tween_property(threat_watcher, "position:x", threat_watcher.position.x + 65.0, 0.28)
	tween.parallel().tween_property(threat_watcher, "modulate:a", 0.0, 0.28)
	await tween.finished
	threat_watcher.visible = false
	AudioBus.play_horror_stinger(0.45)
	AtmosphereController.horror_pulse(0.4)
	Sanity.drain_sanity(3)

func _on_door_back_interacted(verb: String) -> void:
	if verb == "interact":
		await DialogueManager.show_dialogue(["La oficina sigue siendo el único lugar del pueblo donde puedo cerrar una puerta y fingir que estoy solo."], "Inspector")
		SceneRouter.change_room("res://src/rooms/room_01_office/room_01_office.tscn")
	elif verb == "examine":
		DialogueManager.show_dialogue(["La estación de policía ocupa un edificio demasiado grande para la cantidad de agentes que vi trabajando."], "Inspector")

func _on_tavern_door_interacted(verb: String) -> void:
	if verb == "interact":
		await DialogueManager.show_dialogue(["El calor y las voces de El Pez Dorado escapan cada vez que alguien abre la puerta."], "Inspector")
		SceneRouter.change_room("res://src/rooms/room_03_tavern/room_03_tavern.tscn")
	elif verb == "examine":
		DialogueManager.show_dialogue(["La taberna es el único negocio que no cerró al verme pasar. Eso no significa que sea bienvenida la policía."], "Inspector")

func _on_fish_market_interacted(verb: String) -> void:
	if verb != "interact" and verb != "examine":
		return
	if Sanity.current_tier >= Sanity.Tier.FRACTURED:
		AudioBus.play_horror_stinger(0.28)
		await DialogueManager.show_dialogue([
			"El mercado está cerrado y las persianas tienen candado.",
			"Detrás de los barrotes, uno de los peces sobre hielo abre y cierra la boca.",
			"Parpadeo. Está congelado. Lleva horas muerto."
		], "Inspector")
	else:
		DialogueManager.show_dialogue([
			"El mercado cerró antes del anochecer. Docenas de peces quedaron alineados detrás de la verja, todos con los ojos orientados hacia la calle.",
			"Un cartel promete producto «fresco de la madrugada». Ningún pescador que vi parece dispuesto a salir esta noche."
		], "Inspector")

func _on_harbor_notice_interacted(verb: String) -> void:
	if verb == "examine":
		DialogueManager.show_dialogue(["Un tablón municipal inclinado por la humedad. Entre anuncios de mareas hay una orden de cierre reciente."], "Inspector")
		return
	if verb != "interact":
		return
	var first_read = Investigation.discover_evidence("harbor_notice")
	if first_read:
		await DialogueManager.show_dialogue([
			"ORDEN PORTUARIA: navegación nocturna suspendida en un radio de dos millas alrededor del Arrecife del Diablo.",
			"Motivo: «tres incidentes de señalización no autorizada y riesgo de encallamiento». La fecha es anterior a la desaparición de los guardacostas.",
			"El sello de la autoridad que emitió la orden fue arrancado con una cuchilla. Alguien sabía del peligro antes de enviar al 317."
		], "Inspector")
	else:
		DialogueManager.show_dialogue(["La orden de cierre prueba que el riesgo del arrecife era conocido antes de la última patrulla."], "Inspector")

func _on_dock_path_interacted(verb: String) -> void:
	if verb == "interact":
		if not GameState.get_flag("docks_visited"):
			await DialogueManager.show_dialogue([
				"El empedrado se convierte en madera y el olor a sal pasa a ser aceite, algas y metal oxidado.",
				"Puedo investigar el muelle sin llave; el cobertizo es otra historia."
			], "Inspector")
		SceneRouter.change_room("res://src/rooms/room_04_docks/room_04_docks.tscn")
	elif verb == "examine":
		if GameState.get_flag("has_dock_key"):
			DialogueManager.show_dialogue(["La bajada termina en los muelles. La llave de Barnaby pesa más de lo que debería."], "Inspector")
		else:
			DialogueManager.show_dialogue(["Desde aquí se ve el cobertizo de los guardacostas. La puerta tiene una cerradura naval."], "Inspector")

func _on_fisherman_interacted(verb: String) -> void:
	if verb == "examine":
		DialogueManager.show_dialogue(["Silas parece tener setenta años hasta que levanta la vista. Sus ojos son demasiado claros para su cara castigada por el mar."], "Inspector")
		return
	if verb != "interact":
		return
	if GameState.get_flag("has_dock_key"):
		DialogueManager.show_dialogue([
			"Silas mira la llave y pierde el poco color que tenía. —Entonces vas en serio.",
			"—Buscá el número [color=#ca8a04]317[/color]. Y si encontrás algo que parezca haber venido del agua... no lo lleves de vuelta al pueblo."
		], "Pescador Sombrío")
		return
	if GameState.get_flag("has_read_necronomicon"):
		var first_interview = not GameState.get_flag("fisherman_met")
		if first_interview:
			await DialogueManager.show_dialogue([
				"¿Ese cuaderno de cuero...? Reconozco las coordenadas. [color=#06b6d4]Arrecife del Diablo[/color].",
				"Los guardacostas fueron ahí porque alguien encendía luces bajo la niebla. Después la radio quedó muda.",
				"Barnaby conserva la llave del cobertizo. Uno de esos hombres se la dejó como garantía de una deuda la noche antes de salir.",
				"[wave amp=12 freq=2.5]No contestes si escuchás tu nombre desde el agua, oficial.[/wave]"
			], "Pescador Sombrío")
			GameState.set_flag("fisherman_met", true)
			Investigation.discover_evidence("reef_testimony")
			Investigation.set_objective("get_dock_access")
		else:
			DialogueManager.show_dialogue(["Barnaby tiene la llave. Yo ya dije demasiado."], "Pescador Sombrío")
		return
	if Investigation.has_evidence("coast_guard_reports"):
		DialogueManager.show_choices(
			"El viejo evita mi mirada. Quizá pueda hacerlo hablar sin mostrarle todavía el diario.",
			[
				{"text": "Preguntar por la patrulla desaparecida.", "callback": _on_ask_silas_patrol},
				{"text": "Dejarlo tranquilo.", "callback": _on_leave_silas}
			],
			"Inspector"
		)
	else:
		DialogueManager.show_dialogue(["—La niebla está espesa, forastero. Volvé adentro mientras todavía sabés de qué lado está la costa."], "Pescador Sombrío")

func _on_ask_silas_patrol() -> void:
	GameState.set_flag("fisherman_met", true)
	Investigation.discover_evidence("reef_testimony")
	Investigation.set_objective("get_dock_access")
	DialogueManager.show_dialogue([
		"—Tres guardacostas. Sí. Uno bebía en El Pez Dorado y dejó una llave con Barnaby.",
		"Silas frota las manos. —No sé qué buscaban mar adentro. Pero el pueblo ya había cerrado esa zona antes de que los mandaran.",
		"No menciona el arrecife por nombre. Todavía."
	], "Pescador Sombrío")

func _on_leave_silas() -> void:
	DialogueManager.show_dialogue(["No vale la pena presionarlo sin saber qué estoy buscando."], "Inspector")
