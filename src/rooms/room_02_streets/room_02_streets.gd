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
	character_base_scale = 1.14
	character_max_speed = 295.0
	character_acceleration = 1450.0
	character_deceleration = 2050.0
	character_walk_bob = 2.0
	character_walk_sway = 1.35
	character_depth_scaling_enabled = true
	character_depth_y_min = 720.0
	character_depth_y_max = 840.0
	character_scale_far = 0.98
	character_scale_near = 1.06
	personal_light_enabled = false
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
		"En una ventana del mercado una silueta se aparta apenas giro la cabeza. No parece un culto protegiendo un secreto; parece un pueblo ejecutando un protocolo aprendido a golpes."
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
		DialogueManager.show_dialogue(["La estación ocupa un edificio demasiado grande para la cantidad de agentes que vi trabajando. Tal vez nunca se construyó solo para policía local."], "Inspector")

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
			"Durante un segundo escucho mi nombre dentro del ruido de la lluvia. No provino de ninguna boca humana.",
			"Parpadeo. El pez está congelado. Lleva horas muerto."
		], "Inspector")
	else:
		DialogueManager.show_dialogue([
			"El mercado cerró antes del anochecer. Docenas de peces quedaron alineados detrás de la verja, todos con los ojos orientados hacia la calle.",
			"Un cartel promete producto «fresco de la madrugada». Ningún pescador que vi parece dispuesto a salir esta noche."
		], "Inspector")

func _on_harbor_notice_interacted(verb: String) -> void:
	if verb == "examine":
		DialogueManager.show_dialogue(["Un tablón municipal inclinado por la humedad. Entre anuncios de mareas hay una orden de cierre reciente y un rectángulo arrancado donde debería estar el sello de autorización."], "Inspector")
		return
	if verb != "interact":
		return
	var first_read = Investigation.discover_evidence("harbor_notice")
	if first_read:
		await DialogueManager.show_dialogue([
			"ORDEN PORTUARIA: navegación nocturna suspendida en un radio de dos millas alrededor del Arrecife del Diablo.",
			"La fecha es [color=#ca8a04]dos días anterior[/color] a la desaparición del 317. Esto no fue una reacción al desastre. El desastre ocurrió dentro de una zona ya clausurada.",
			"En el reverso quedan marcas de papel carbón: «perímetro acústico», «ventana de prueba» y el mismo código que vi en mi archivador: [color=#06b6d4]L-17[/color].",
			"Alguien sabía exactamente cuándo no debía haber civiles cerca del arrecife. Y aun así envió al 317."
		], "Inspector")
		GameState.set_flag("lantern_code_seen", true)
	else:
		DialogueManager.show_dialogue(["El cierre no protege al pueblo de un accidente pasado. Protegía una operación que todavía no había ocurrido."], "Inspector")

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
			DialogueManager.show_dialogue(["La bajada termina en los muelles. La llave de Barnaby pesa más por lo que representa que por el hierro."], "Inspector")
		else:
			DialogueManager.show_dialogue(["Desde aquí se ve el cobertizo de los guardacostas. La puerta tiene una cerradura naval y demasiadas capas de pintura federal debajo de la sal."], "Inspector")

func _on_fisherman_interacted(verb: String) -> void:
	if verb == "examine":
		DialogueManager.show_dialogue(["Silas parece tener setenta años hasta que levanta la vista. Sus ojos son demasiado claros para su cara castigada por el mar. No me mira como a un extraño; me mira como a alguien que ya vio llegar antes."], "Inspector")
		return
	if verb != "interact":
		return
	if GameState.get_flag("has_dock_key"):
		DialogueManager.show_dialogue([
			"Silas mira la llave y pierde el poco color que tenía. —Entonces vas en serio.",
			"—Buscá el número 317. Y si encontrás cables donde deberían haber redes, no los enciendas por curiosidad.",
			"—No sos el primero que llega convencido de que esta vez sí va a entenderlo."
		], "Pescador Sombrío")
		return
	if GameState.get_flag("has_read_necronomicon"):
		var first_interview = not GameState.get_flag("fisherman_met")
		if first_interview:
			await DialogueManager.show_dialogue([
				"¿Ese cuaderno de cuero...? Reconozco las coordenadas. [color=#06b6d4]Arrecife del Diablo[/color].",
				"—No sos el primero que llega con papeles. Antes vinieron hombres de Boston con cajas negras, auriculares y la misma seguridad en la cara.",
				"—Siempre dicen que vienen a estudiar la costa. Siempre terminamos nosotros cerrando las puertas cuando se van.",
				"Barnaby conserva la llave del cobertizo. Uno de los hombres del 317 se la dejó la noche antes de salir.",
				"[wave amp=12 freq=2.5]No contestes si escuchás tu nombre desde el agua, oficial. No importa quién tenga la voz.[/wave]"
			], "Pescador Sombrío")
			GameState.set_flag("fisherman_met", true)
			Investigation.discover_evidence("reef_testimony")
			Investigation.set_objective("get_dock_access")
		else:
			DialogueManager.show_dialogue(["—Barnaby tiene la llave. Y si encontrás el código L-17, dejá de pensar que esto empezó con esos tres muchachos."], "Pescador Sombrío")
		return
	if Investigation.has_evidence("coast_guard_reports"):
		DialogueManager.show_choices(
			"El viejo evita mi mirada. Quizá pueda hacerlo hablar sin mostrarle todavía el diario.",
			[
				{"text": "Preguntar por la patrulla desaparecida.", "callback": _on_ask_silas_patrol},
				{"text": "Preguntar si otros investigadores vinieron antes.", "callback": _on_ask_silas_previous_teams},
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
		"Silas frota las manos. —El pueblo ya había cerrado esa zona antes de que los mandaran. Después llegaron hombres a retirar sellos y papeles antes del amanecer.",
		"—No escondemos lo que ocurrió. Escondemos el camino para que no vuelva a ocurrir."
	], "Pescador Sombrío")

func _on_ask_silas_previous_teams() -> void:
	GameState.set_flag("fisherman_met", true)
	Investigation.discover_evidence("reef_testimony")
	DialogueManager.show_dialogue([
		"Silas tarda demasiado en responder. —1919. Después 1922. Hombres distintos, mismos cajones de equipo, mismas preguntas sobre voces de muertos.",
		"—La última vez prometieron que el aparato solo escuchaba. Tres días después una mujer oyó a su hijo ahogado llamarla desde un pozo seco.",
		"—Así que cuando te decimos que te vayas, inspector, no es porque queramos conservar un secreto. Es porque ya sabemos cuánto cuesta abrirlo."
	], "Pescador Sombrío")

func _on_leave_silas() -> void:
	DialogueManager.show_dialogue(["No vale la pena presionarlo sin saber qué estoy buscando."], "Inspector")
