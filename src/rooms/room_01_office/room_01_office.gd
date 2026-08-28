# res://src/rooms/room_01_office/room_01_office.gd
extends Room

@onready var player: Player = $CharactersLayer/Player
@onready var desk: Hotspot = $HotspotsLayer/Desk
@onready var case_board: Hotspot = $HotspotsLayer/CaseBoard
@onready var bookcase: Hotspot = $HotspotsLayer/Bookcase
@onready var drawer: Hotspot = $HotspotsLayer/Drawer
@onready var door: Hotspot = $HotspotsLayer/Door

@export var key_item: ItemData
@export var book_item: ItemData

func _ready() -> void:
	# The frame canvas contains large transparent margins; this value is tuned
	# against the visible human silhouette and the 1926 door, not the PNG bounds.
	character_base_scale = 1.58
	character_max_speed = 252.0
	character_acceleration = 1180.0
	character_deceleration = 1850.0
	character_walk_bob = 0.35
	character_walk_sway = 0.25
	character_depth_scaling_enabled = false
	personal_light_enabled = false
	footstep_surface = "wood"
	walk_bounds = Rect2(55, 755, 1810, 150)
	super._ready()
	# Office uses a heavier, faster leg cadence than the old prototype walk.
	# The reduced procedural bob prevents the sprite from looking like it is
	# floating while the authored frame cycle carries the body motion.
	if player:
		player.walk_speed_scale_min = 0.82
		player.walk_speed_scale_max = 1.38
		player.arrival_radius = 4.0
	GameState.set_var("player_location", "office")
	desk.interacted.connect(_on_desk_interacted)
	case_board.interacted.connect(_on_case_board_interacted)
	bookcase.interacted.connect(_on_bookcase_interacted)
	drawer.interacted.connect(_on_drawer_interacted)
	drawer.item_used_successfully.connect(_on_drawer_unlocked)
	drawer.item_used_failed.connect(_on_drawer_unlock_failed)
	door.interacted.connect(_on_door_interacted)

func _on_desk_interacted(verb: String) -> void:
	if verb == "examine":
		DialogueManager.show_dialogue([
			"Mi escritorio de roble. Tabaco rancio, café frío y sal seca en documentos que nunca deberían haber estado cerca del mar.",
			"El expediente 47-B está abierto por la página de las autopsias. Hay dos horas subrayadas en rojo que no deberían poder coexistir."
		], "Inspector")
		return
	if verb != "interact":
		return

	var first_read = Investigation.discover_evidence("coast_guard_reports")
	if first_read:
		await DialogueManager.show_dialogue([
			"EXPEDIENTE 47-B. Tres guardacostas desaparecidos durante una patrulla nocturna frente a Innsmouth.",
			"El forense estima que Hale murió entre las 22:00 y las 22:20. La estación, sin embargo, registró su voz en la transmisión del 317 a las 23:03.",
			"No es una diferencia de minutos. Es un hombre hablando casi una hora después de la ventana probable de su muerte.",
			"En una declaración adjunta, un pescador escribió: «la voz siguió llamándolo por su nombre desde el agua». Cierro el expediente un segundo. Esa frase ya la escuché una vez, hace muchos años, y jamás la puse en un informe.",
			"Bajo la carpeta encuentro una [color=#ca8a04]llave de bronce[/color] etiquetada «ARCHIVO DE EVIDENCIAS»."
		], "Inspector")
		GameState.set_flag("inspector_water_memory_seen", true)
		if key_item and not Inventory.has_item(key_item.id):
			Inventory.add_item(key_item)
	else:
		DialogueManager.show_dialogue([
			"Hale: muerte estimada antes de las 22:20. Última voz atribuida a Hale: 23:03.",
			"Alguien aceptó esa contradicción y cerró el informe de todos modos."
		], "Inspector")

func _on_case_board_interacted(verb: String) -> void:
	if verb == "examine":
		DialogueManager.show_dialogue(["Recortes, mapas costeros y fotografías de Hale, Mercer y Ward. Una línea roja une Innsmouth con el Arrecife del Diablo. En el margen alguien escribió a lápiz: «L-17»."], "Inspector")
		return
	if verb != "interact":
		return

	var lines: Array[String] = ["Repaso lo que sé antes de salir:"]
	if Investigation.has_evidence("coast_guard_reports"):
		lines.append("— Hale figura muerto antes de hablar por última vez. La cronología oficial es imposible.")
	else:
		lines.append("— Todavía no revisé el expediente principal del escritorio.")
	if Investigation.has_evidence("pathology_monograph"):
		lines.append("— El tratado médico no solo describe cambios físicos: alguien añadió la palabra «receptor» junto a ciertos apellidos.")
	if Investigation.has_evidence("occult_diary"):
		lines.append("— El diario marca el Arrecife del Diablo y repite una regla: no responder cuando la voz diga tu nombre.")
	if GameState.get_flag("lantern_code_seen"):
		lines.append("— L-17 aparece en documentos que no pertenecen al procedimiento normal de la Guardia Costera.")
	DialogueManager.show_dialogue(lines, "Inspector")

func _on_bookcase_interacted(verb: String) -> void:
	if verb == "examine":
		DialogueManager.show_dialogue(["Manual policial, medicina legal, expedientes confiscados. En los estantes bajos alguien guardó libros que jamás pasaron por registro."], "Inspector")
		return
	if verb != "interact":
		return

	DialogueManager.show_choices(
		"¿Qué vale la pena revisar antes de salir?",
		[
			{"text": "Consultar el tratado médico de patologías costeras.", "callback": _on_read_modern_book},
			{
				"text": "[Cordura > 60] Examinar el diario de cuero confiscado.",
				"sanity_min": 61,
				"callback": _on_read_ancient_diary
			},
			{
				"text": "[Cordura ≤ 50] Seguir los susurros de los estantes inferiores.",
				"sanity_max": 50,
				"callback": _on_read_whispers
			},
			{"text": "Cerrar la biblioteca.", "callback": _on_close_bookcase}
		],
		"Inspector"
	)

func _on_read_modern_book() -> void:
	var first_read = Investigation.discover_evidence("pathology_monograph")
	if first_read:
		DialogueManager.show_dialogue([
			"Patologías costeras de Massachusetts, 1898.",
			"El autor describe ojos inmóviles, piel que se endurece con la edad e indicios de hendiduras branquiales internas en varias familias antiguas de Innsmouth.",
			"Lo atribuyó a endogamia. Décadas después, otra mano marcó tres apellidos con lápiz azul y una sola palabra: [color=#06b6d4]RECEPTORES[/color].",
			"Debajo: «preguntar qué ocurre cuando llegan al agua»."
		], "Inspector")
	else:
		DialogueManager.show_dialogue(["La palabra «RECEPTORES» no pertenece al autor original. Alguien volvió a estudiar estas familias muchos años después."], "Inspector")

func _on_read_ancient_diary() -> void:
	if Investigation.has_evidence("occult_diary"):
		DialogueManager.show_dialogue(["Ya registré las coordenadas. Cuanto más miro los símbolos, menos seguro estoy de que sean escritura."], "Inspector")
		return
	await DialogueManager.show_dialogue([
		"Las páginas mezclan mareas, posiciones estelares y un mismo punto costero repetido obsesivamente.",
		"Las coordenadas señalan el [color=#06b6d4]Arrecife del Diablo[/color]. En la última página: [i]«cuando suenen tres veces, no respondas si pronuncia tu nombre»[/i].",
		"Siento una punzada detrás de los ojos, como si hubiera recordado una frase que nunca leí."
	], "Inspector")
	Sanity.drain_sanity(10)
	GameState.set_flag("has_read_necronomicon", true)
	Investigation.discover_evidence("occult_diary")
	Investigation.set_objective("find_local_lead")
	if book_item and not Inventory.has_item(book_item.id):
		Inventory.add_item(book_item)

func _on_read_whispers() -> void:
	AudioBus.play_horror_stinger(0.65)
	AtmosphereController.horror_pulse(0.7)
	await DialogueManager.show_dialogue([
		"[wave amp=18 freq=3]No encuentro un libro abierto, pero escucho páginas pasando detrás de la madera.[/wave]",
		"Una voz muy baja pronuncia mi nombre con la cadencia exacta de alguien que se ahogó hace años.",
		"Durante un instante los lomos parecen ordenados formando una palabra: [shake rate=18 level=7]VOLVÉ[/shake].",
		"Parpadeo y solo hay polvo."
	], "Inspector")
	Sanity.drain_sanity(22)

func _on_close_bookcase() -> void:
	DialogueManager.show_dialogue(["Ya tengo suficiente lectura para una noche."], "Inspector")

func _on_drawer_interacted(verb: String) -> void:
	if verb == "examine":
		if GameState.get_flag("office_drawer_unlocked"):
			DialogueManager.show_dialogue(["El archivador está abierto. La etiqueta interior fue arrancada, pero quedó pegado un fragmento de papel carbón con el código «L-17»."], "Inspector")
		else:
			DialogueManager.show_dialogue(["El archivador de evidencias está cerrado. La cerradura es del mismo latón envejecido que la llave del escritorio."], "Inspector")
	elif verb == "interact":
		if GameState.get_flag("office_drawer_unlocked"):
			DialogueManager.show_dialogue(["Sobres vacíos, aserrín y la silueta limpia de una carpeta rectangular. El único fragmento legible dice: «ANEXO TÉCNICO L-17 — RETIRAR ANTES DE ASIGNACIÓN CIVIL»."], "Inspector")
		else:
			DialogueManager.show_dialogue(["Necesito abrirlo con la llave correcta."], "Inspector")

func _on_drawer_unlocked(item: ItemData) -> void:
	GameState.set_flag("office_drawer_unlocked", true)
	GameState.set_flag("lantern_code_seen", true)
	Inventory.remove_item(item)
	await DialogueManager.show_dialogue([
		"La llave gira con resistencia y el cajón superior se abre apenas un centímetro.",
		"La carpeta principal desapareció, pero quedó una copia carbón pegada al fondo: [color=#ca8a04]«ANEXO TÉCNICO L-17 — retirar antes de asignación civil»[/color].",
		"No hay membrete de la Guardia Costera. Solo una perforación donde arrancaron una insignia federal.",
		"Quien preparó este expediente no solo sabía que yo iba a revisarlo. También decidió exactamente qué no debía ver."
	], "Inspector")

func _on_drawer_unlock_failed(_item: ItemData) -> void:
	DialogueManager.show_dialogue(["No. Forzar esta cerradura con el objeto equivocado solo va a dejar marcas."], "Inspector")

func _on_door_interacted(verb: String) -> void:
	if verb == "examine":
		DialogueManager.show_dialogue(["Afuera: Innsmouth, lluvia y un pueblo que ya sabe que llegó un inspector."], "Inspector")
		return
	if verb != "interact":
		return
	if not GameState.get_flag("office_drawer_unlocked"):
		DialogueManager.show_dialogue(["Antes de salir quiero saber por qué dejaron una llave de evidencias sobre mi expediente."], "Inspector")
		return
	if Investigation.current_objective_id == "prepare_departure":
		Investigation.set_objective("find_local_lead")
	await DialogueManager.show_dialogue(["Guardo el cuaderno. La linterna queda en el bolsillo mientras esté bajo techo. Afuera, Innsmouth espera bajo la lluvia."], "Inspector")
	SceneRouter.change_room("res://src/rooms/room_02_streets/room_02_streets.tscn")
