# res://src/rooms/room_05_boathouse/room_05_boathouse.gd
extends Room

@onready var player: Player = $CharactersLayer/Player
@onready var door_back: Hotspot = $HotspotsLayer/DoorBack
@onready var service_lockers: Hotspot = $HotspotsLayer/ServiceLockers
@onready var fuse_box: Hotspot = $HotspotsLayer/FuseBox
@onready var radio: Hotspot = $HotspotsLayer/Radio
@onready var floor_drain: Hotspot = $HotspotsLayer/FloorDrain
@onready var boat_317: Hotspot = $HotspotsLayer/Boat317
@onready var main_light: PointLight2D = $MainLight
@onready var canvas_modulate: CanvasModulate = $CanvasModulate
@onready var intruder_shadow: Polygon2D = $ForegroundLayer/IntruderShadow

@export var brass_fuse_item: ItemData

func _ready() -> void:
	super._ready()
	door_back.interacted.connect(_on_door_back_interacted)
	service_lockers.interacted.connect(_on_lockers_interacted)
	fuse_box.interacted.connect(_on_fuse_box_interacted)
	radio.interacted.connect(_on_radio_interacted)
	floor_drain.interacted.connect(_on_floor_drain_interacted)
	boat_317.interacted.connect(_on_boat_interacted)
	GameState.set_var("player_location", "boathouse")
	intruder_shadow.visible = false
	_apply_power_state(false)
	if not GameState.get_flag("boathouse_entered"):
		GameState.set_flag("boathouse_entered", true)
		call_deferred("_show_entry_beat")
	elif GameState.get_flag("reef_radio_heard") and not GameState.get_flag("boathouse_intrusion_survived"):
		call_deferred("_trigger_intrusion")

func _show_entry_beat() -> void:
	var lines: Array[String] = [
		"El cobertizo está más frío que el muelle. No debería ser posible: todas las ventanas están cerradas.",
		"El pescante sostiene al 317 sobre la rampa, inmóvil. La instalación eléctrica está muerta.",
		"En la pared hay tres casilleros de servicio: 315, 316 y 317."
	]
	if GameState.get_flag("barnaby_threatened"):
		lines.append("Detrás de mí, afuera, una tabla cruje bajo un peso que no es el mío. Cuando miro por la ventana no hay nadie.")
		Sanity.drain_sanity(3)
	await DialogueManager.show_dialogue(lines, "Inspector")

func _apply_power_state(animate: bool) -> void:
	var power_on = GameState.get_flag("boathouse_power_on")
	if power_on:
		main_light.energy = 1.25
		canvas_modulate.color = Color(0.52, 0.5, 0.42, 1)
	else:
		main_light.energy = 0.0
		canvas_modulate.color = Color(0.19, 0.24, 0.25, 1)
	if animate and power_on:
		var tween = create_tween()
		main_light.energy = 0.0
		tween.tween_property(main_light, "energy", 1.7, 0.08)
		tween.tween_property(main_light, "energy", 0.25, 0.06)
		tween.tween_property(main_light, "energy", 1.4, 0.1)
		tween.tween_property(main_light, "energy", 0.7, 0.07)
		tween.tween_property(main_light, "energy", 1.25, 0.2)

func _on_door_back_interacted(verb: String) -> void:
	if verb == "interact":
		await DialogueManager.show_dialogue(["Salgo otra vez al muelle. La lluvia casi parece cálida después de este lugar."], "Inspector")
		SceneRouter.change_room("res://src/rooms/room_04_docks/room_04_docks.tscn")
	elif verb == "examine":
		DialogueManager.show_dialogue(["La puerta al muelle. Conviene recordar que sigue siendo una salida."], "Inspector")

func _on_lockers_interacted(verb: String) -> void:
	if verb == "examine":
		DialogueManager.show_dialogue([
			"Tres casilleros de acero castigados por la sal: 315, 316 y 317.",
			"Todos están cerrados. El 317 tiene marcas de uñas alrededor del tirador."
		], "Inspector")
		return
	if verb != "interact":
		return
	if GameState.get_flag("service_locker_opened"):
		DialogueManager.show_dialogue(["El casillero 317 está abierto. Solo quedan un abrigo mojado, una caja vacía y el hueco donde encontré el fusible."], "Inspector")
		return
	DialogueManager.show_choices(
		"Los cierres son de combinación simple. ¿Qué casillero reviso?",
		[
			{"text": "Probar el casillero 315.", "callback": _on_wrong_locker},
			{"text": "Probar el casillero 316.", "callback": _on_wrong_locker},
			{
				"text": "[Evidencia: manifiesto] Abrir el casillero 317 usando la anotación de servicio.",
				"required_evidence": "dock_manifest",
				"callback": _on_open_locker_317
			},
			{"text": "Dejar los casilleros por ahora.", "callback": _on_leave_lockers}
		],
		"Inspector"
	)

func _on_wrong_locker() -> void:
	DialogueManager.show_dialogue([
		"El mecanismo gira, pero no encuentro ninguna referencia que justifique esa elección.",
		"Adivinar combinaciones aquí puede llevarme toda la noche. Necesito una pista concreta."
	], "Inspector")

func _on_leave_lockers() -> void:
	DialogueManager.show_dialogue(["Primero voy a buscar algo que identifique qué equipo pertenecía al 317."], "Inspector")

func _on_open_locker_317() -> void:
	GameState.set_flag("service_locker_opened", true)
	if brass_fuse_item and not Inventory.has_item(brass_fuse_item.id):
		Inventory.add_item(brass_fuse_item)
	await DialogueManager.show_dialogue([
		"La anotación del manifiesto era literal. El seguro del 317 cede al alinear los números de servicio.",
		"Dentro encuentro un abrigo de guardacostas todavía húmedo... y una caja de mantenimiento sellada con grasa.",
		"El [color=#ca8a04]fusible de latón[/color] del pescante está intacto. Alguien lo retiró deliberadamente antes de abandonar el cobertizo."
	], "Inspector")

func _on_fuse_box_interacted(verb: String) -> void:
	if verb == "examine":
		if GameState.get_flag("boathouse_power_on"):
			DialogueManager.show_dialogue(["La caja zumba bajo carga. El fusible nuevo está caliente pero estable."], "Inspector")
		elif GameState.get_flag("boathouse_fuse_installed"):
			DialogueManager.show_dialogue(["El fusible ya está colocado. Solo falta subir el interruptor principal."], "Inspector")
		else:
			DialogueManager.show_dialogue(["Falta el fusible principal del pescante. El receptáculo coincide con una pieza industrial de latón."], "Inspector")
		return
	if verb != "interact":
		return
	if GameState.get_flag("boathouse_power_on"):
		DialogueManager.show_dialogue(["No voy a tocar una instalación centenaria mientras está funcionando."], "Inspector")
		return
	if GameState.get_flag("boathouse_fuse_installed"):
		DialogueManager.show_choices(
			"El fusible está asentado. El interruptor principal sigue abajo.",
			[
				{"text": "Subir el interruptor principal.", "callback": _on_restore_power},
				{"text": "Dejarlo apagado por ahora.", "callback": _on_leave_fuse_box}
			],
			"Inspector"
		)
		return
	DialogueManager.show_choices(
		"El receptáculo está vacío.",
		[
			{
				"text": "Instalar el fusible de latón.",
				"required_item_id": "brass_fuse",
				"callback": _on_install_fuse
			},
			{"text": "Cerrar la caja.", "callback": _on_leave_fuse_box}
		],
		"Inspector"
	)

func _on_install_fuse() -> void:
	var fuse = Inventory.get_item_by_id("brass_fuse")
	if fuse:
		Inventory.remove_item(fuse)
	GameState.set_flag("boathouse_fuse_installed", true)
	DialogueManager.show_dialogue([
		"Los contactos encajan con un golpe seco.",
		"Ahora entiendo por qué el circuito estaba muerto: alguien no cortó la corriente. [i]Se llevó la única pieza que podía devolverla.[/i]"
	], "Inspector")

func _on_leave_fuse_box() -> void:
	DialogueManager.show_dialogue(["Todavía no."], "Inspector")

func _on_restore_power() -> void:
	GameState.set_flag("boathouse_power_on", true)
	Investigation.set_objective("launch_boat")
	_apply_power_state(true)
	AudioBus.play_horror_stinger(0.45)
	AtmosphereController.horror_pulse(1.0)
	await DialogueManager.show_dialogue([
		"El interruptor sube.",
		"[shake rate=18 level=7]THUNK—THUNK—THUNK.[/shake] Las lámparas despiertan una detrás de otra y el motor del pescante empieza a vibrar sobre mi cabeza.",
		"Entonces la radio, que no he tocado, se enciende sola.",
		"Entre la estática escucho tres golpes de campana... [wave amp=15 freq=2]desde muy abajo.[/wave]"
	], "Inspector")
	_play_radio_log()

func _on_radio_interacted(verb: String) -> void:
	if not GameState.get_flag("boathouse_power_on"):
		DialogueManager.show_dialogue(["La radio está completamente muerta. Sin corriente no puedo saber si conserva algo en el receptor."], "Inspector")
		return
	if verb == "examine" and GameState.get_flag("reef_radio_heard"):
		DialogueManager.show_dialogue(["El dial permanece clavado en la frecuencia del 317. No quiero volver a escuchar esa grabación."], "Inspector")
		return
	if verb == "interact" or verb == "examine":
		_play_radio_log()

func _play_radio_log() -> void:
	if GameState.get_flag("reef_radio_heard"):
		DialogueManager.show_dialogue([
			"Solo queda estática. Por debajo todavía creo escuchar un ritmo... tres campanadas, pausa, tres campanadas."
		], "Inspector")
		return
	GameState.set_flag("reef_radio_heard", true)
	Investigation.discover_evidence("reef_radio_log")
	Sanity.drain_sanity(12)
	AudioBus.play_horror_stinger(0.72)
	AtmosphereController.horror_pulse(1.2)
	await DialogueManager.show_dialogue([
		"[wave amp=8 freq=5]—Unidad 317 a estación... tenemos una luz debajo del agua. Repito: debajo del agua.[/wave]",
		"[wave amp=12 freq=4]—Hay campanas. Dios... no son campanas. No respondan si oyen sus nombres. NO RESP—[/wave]",
		"La grabación se corta con un ruido húmedo, demasiado cerca del micrófono.",
		"Reconozco las palabras. Son las últimas frases del registro que abrió el expediente 47-B."
	], "Transmisión 317")
	await _trigger_intrusion()

func _trigger_intrusion() -> void:
	if GameState.get_flag("boathouse_intrusion_survived") or GameState.get_flag("boathouse_intrusion_started"):
		return
	GameState.set_flag("boathouse_intrusion_started", true)
	await get_tree().create_timer(0.65).timeout
	AudioBus.play_horror_stinger(0.82)
	AtmosphereController.horror_pulse(0.8)
	if player:
		player.play_reaction()
	await _flicker_main_light()
	_show_intruder_shadow()
	await DialogueManager.show_dialogue([
		"Algo pisa el muelle justo afuera.",
		"No son botas. Cada paso termina con un roce húmedo contra las tablas.",
		"La manija de la puerta baja muy despacio. El cerrojo que abrí con la llave de Barnaby es lo único que la mantiene cerrada."
	], "Inspector")
	DialogueManager.show_choices(
		"No tengo arma larga ni refuerzos. Tengo segundos para decidir.",
		[
			{
				"text": "[Huellas] Apagar mi linterna y quedarme inmóvil lejos de la puerta.",
				"required_evidence": "amphibious_tracks",
				"callback": _on_intrusion_stay_still
			},
			{
				"text": "Ocultarme dentro del casillero 317.",
				"required_flag": "service_locker_opened",
				"callback": _on_intrusion_locker
			},
			{
				"text": "[Cordura alta] Acercarme y enfrentar lo que está detrás de la puerta.",
				"sanity_min": 60,
				"callback": _on_intrusion_confront
			}
		],
		"Inspector"
	)

func _flicker_main_light() -> void:
	var original_energy = main_light.energy
	var tween = create_tween()
	tween.tween_property(main_light, "energy", 0.05, 0.07)
	tween.tween_property(main_light, "energy", original_energy, 0.08)
	tween.tween_property(main_light, "energy", 0.0, 0.05)
	tween.tween_interval(0.11)
	tween.tween_property(main_light, "energy", original_energy, 0.16)
	await tween.finished

func _show_intruder_shadow() -> void:
	intruder_shadow.visible = true
	intruder_shadow.position = Vector2(25, 0)
	intruder_shadow.modulate.a = 0.0
	var tween = create_tween().set_parallel(true)
	tween.tween_property(intruder_shadow, "modulate:a", 0.72, 0.25)
	tween.tween_property(intruder_shadow, "position:x", 95.0, 1.5).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)

func _hide_intruder_shadow(duration: float = 0.45) -> void:
	if not intruder_shadow.visible:
		return
	var tween = create_tween()
	tween.tween_property(intruder_shadow, "modulate:a", 0.0, duration)
	await tween.finished
	intruder_shadow.visible = false

func _on_intrusion_stay_still() -> void:
	GameState.set_var("boathouse_intrusion_outcome", "observed_tracks")
	main_light.energy = 0.0
	canvas_modulate.color = Color(0.11, 0.16, 0.17, 1)
	await DialogueManager.show_dialogue([
		"Las huellas del muelle apuntaban desde el agua hacia tierra. Si esa cosa ve peor que nosotros fuera del agua, la luz me delataría.",
		"Apago la linterna. La manija deja de moverse.",
		"Una sombra cruza la ventana a una altura imposible. Después escucho el mismo roce húmedo alejándose hacia el mar."
	], "Inspector")
	Sanity.drain_sanity(4)
	_complete_intrusion()

func _on_intrusion_locker() -> void:
	GameState.set_var("boathouse_intrusion_outcome", "locker")
	await DialogueManager.show_dialogue([
		"Me comprimo dentro del casillero 317, entre el abrigo mojado y el metal helado.",
		"La puerta exterior se sacude una vez. Dos. A través de la ranura veo una mano larga apoyarse contra el vidrio: cinco dedos unidos por membrana.",
		"Algo huele el aire dentro del cobertizo. Luego desaparece sin abrir la puerta."
	], "Inspector")
	Sanity.drain_sanity(8)
	_complete_intrusion()

func _on_intrusion_confront() -> void:
	GameState.set_var("boathouse_intrusion_outcome", "confronted")
	AudioBus.play_horror_stinger(1.0)
	AtmosphereController.horror_pulse(1.0)
	await DialogueManager.show_dialogue([
		"Me acerco a la puerta y apoyo una mano sobre el cerrojo.",
		"Del otro lado algo deja de respirar.",
		"Por la ventana veo un rostro pálido, húmedo, con ojos enormes que no parpadean. Lleva restos de una chaqueta de pescador.",
		"Nos miramos. Entonces sonríe con demasiados dientes y corre hacia el agua en cuatro apoyos."
	], "Inspector")
	Sanity.drain_sanity(12)
	_complete_intrusion()

func _complete_intrusion() -> void:
	GameState.set_flag("boathouse_intrusion_survived", true)
	GameState.set_flag("boathouse_intrusion_started", false)
	_apply_power_state(false)
	_hide_intruder_shadow()
	SaveSystem.save_checkpoint(1)

func _on_floor_drain_interacted(verb: String) -> void:
	if verb != "interact" and verb != "examine":
		return
	if GameState.get_flag("black_scale_found"):
		DialogueManager.show_dialogue(["Solo queda agua negra en las ranuras del desagüe."], "Inspector")
		return
	GameState.set_flag("black_scale_found", true)
	Investigation.discover_evidence("black_scale")
	Sanity.drain_sanity(5)
	DialogueManager.show_dialogue([
		"Algo refleja la luz entre las ranuras del desagüe.",
		"Lo saco con la punta de un lápiz: una escama negra, gruesa como una uña y todavía húmeda.",
		"No pertenece a ningún pez que haya visto. Y hay marcas más grandes debajo de las tablas."
	], "Inspector")

func _on_boat_interacted(verb: String) -> void:
	if verb == "examine":
		DialogueManager.show_dialogue([
			"El 317 cuelga del pescante exactamente como figura en el manifiesto. Tiene combustible, una lámpara y espacio para cuatro hombres.",
			"Hay arañazos profundos en la quilla. Ninguno parece hecho por roca."
		], "Inspector")
		return
	if verb != "interact":
		return
	if not GameState.get_flag("boathouse_power_on"):
		DialogueManager.show_dialogue(["El pescante no responde. Necesito restaurar la energía antes de intentar bajar el bote."], "Inspector")
		return
	DialogueManager.show_choices(
		"El pescante está operativo y la ruta del 317 termina en el Arrecife del Diablo.",
		[
			{
				"text": "Botar el 317 y seguir la última ruta de los guardacostas.",
				"required_flag": ["reef_radio_heard", "boathouse_intrusion_survived"],
				"callback": _on_launch_boat
			},
			{"text": "Revisar el cobertizo un poco más.", "callback": _on_delay_launch}
		],
		"Inspector"
	)

func _on_delay_launch() -> void:
	if GameState.get_flag("reef_radio_heard") and not GameState.get_flag("boathouse_intrusion_survived"):
		DialogueManager.show_dialogue(["Algo sigue afuera. No voy a tocar el pescante hasta saber si piensa entrar."], "Inspector")
	else:
		DialogueManager.show_dialogue(["Una vez que salga a mar abierto no habrá vuelta rápida. Conviene revisar cualquier pista que quede aquí."], "Inspector")

func _on_launch_boat() -> void:
	GameState.set_flag("boat_317_launched", true)
	Investigation.set_objective("survive_reef_approach")
	await DialogueManager.show_dialogue([
		"Libero el freno del pescante. Las poleas chillan y el 317 desciende hacia el agua negra.",
		"La radio portátil chisporrotea en cuanto piso el bote, aunque su batería está desconectada.",
		"Desde el muelle llega un último sonido: tres golpes lentos contra la puerta del cobertizo.",
		"No miro atrás."
	], "Inspector")
	SceneRouter.change_room("res://src/rooms/room_06_reef/room_06_reef.tscn")
