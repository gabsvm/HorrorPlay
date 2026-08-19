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
	super._ready()
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
			"El expediente 47-B está abierto por la página de las autopsias."
		], "Inspector")
		return
	if verb != "interact":
		return
	
	var first_read = Investigation.discover_evidence("coast_guard_reports")
	if first_read:
		await DialogueManager.show_dialogue([
			"EXPEDIENTE 47-B. Tres guardacostas desaparecidos durante una patrulla nocturna frente a Innsmouth.",
			"Dos cuerpos recuperados días después. Pulmones secos, piel cubierta de sal y traumatismos que el médico local se negó a describir.",
			"Bajo la carpeta encuentro una [color=#ca8a04]llave de bronce[/color] etiquetada «ARCHIVO DE EVIDENCIAS»."
		], "Inspector")
		if key_item and not Inventory.has_item(key_item.id):
			Inventory.add_item(key_item)
	else:
		DialogueManager.show_dialogue([
			"Las fechas no encajan. La última transmisión ocurrió casi una hora después de la hora que figura como probable muerte del primer guardacostas.",
			"Alguien cerró el informe demasiado rápido."
		], "Inspector")

func _on_case_board_interacted(verb: String) -> void:
	if verb == "examine":
		DialogueManager.show_dialogue(["Recortes, mapas costeros y fotografías de los tres desaparecidos. Una línea roja une Innsmouth con un punto marcado mar adentro."], "Inspector")
		return
	if verb != "interact":
		return
	
	var lines: Array[String] = ["Repaso lo que sé antes de salir:"]
	if Investigation.has_evidence("coast_guard_reports"):
		lines.append("— Tres hombres desaparecen en el mismo sector; dos cuerpos desafían la explicación médica.")
	else:
		lines.append("— Todavía no revisé el expediente principal del escritorio.")
	if Investigation.has_evidence("pathology_monograph"):
		lines.append("— Un estudio antiguo documenta rasgos fisiológicos extraños en familias de Innsmouth.")
	if Investigation.has_evidence("occult_diary"):
		lines.append("— El diario confiscado señala coordenadas precisas: el Arrecife del Diablo.")
	if Investigation.has_evidence("coast_guard_reports") and not Investigation.has_evidence("occult_diary"):
		lines.append("Me falta un vínculo entre las muertes y el lugar donde ocurrió la patrulla.")
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
			"Lo atribuyó a endogamia. En el margen, otra mano escribió: [i]«preguntar qué ocurre cuando llegan al agua»[/i]."
		], "Inspector")
	else:
		DialogueManager.show_dialogue(["La anotación marginal sigue siendo lo más inquietante: «preguntar qué ocurre cuando llegan al agua»."], "Inspector")

func _on_read_ancient_diary() -> void:
	if Investigation.has_evidence("occult_diary"):
		DialogueManager.show_dialogue(["Ya registré las coordenadas. Cuanto más miro los símbolos, menos seguro estoy de que sean escritura."], "Inspector")
		return
	await DialogueManager.show_dialogue([
		"Las páginas mezclan mareas, posiciones estelares y un mismo punto costero repetido obsesivamente.",
		"Las coordenadas señalan el [color=#06b6d4]Arrecife del Diablo[/color]. En la última página: [i]«cuando suenen tres veces, no respondas»[/i].",
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
		"Durante un instante los lomos parecen ordenados formando una palabra: [shake rate=18 level=7]VOLVÉ[/shake].",
		"Parpadeo y solo hay polvo."
	], "Inspector")
	Sanity.drain_sanity(22)

func _on_close_bookcase() -> void:
	DialogueManager.show_dialogue(["Ya tengo suficiente lectura para una noche."], "Inspector")

func _on_drawer_interacted(verb: String) -> void:
	if verb == "examine":
		if GameState.get_flag("office_drawer_unlocked"):
			DialogueManager.show_dialogue(["El archivador está abierto. La etiqueta interior fue arrancada hace años."], "Inspector")
		else:
			DialogueManager.show_dialogue(["El archivador de evidencias está cerrado. La cerradura es del mismo latón envejecido que la llave del escritorio."], "Inspector")
	elif verb == "interact":
		if GameState.get_flag("office_drawer_unlocked"):
			DialogueManager.show_dialogue(["Solo quedan sobres vacíos, aserrín y la silueta limpia de un objeto rectangular que alguien retiró."], "Inspector")
		else:
			DialogueManager.show_dialogue(["Necesito abrirlo con la llave correcta."], "Inspector")

func _on_drawer_unlocked(item: ItemData) -> void:
	GameState.set_flag("office_drawer_unlocked", true)
	Inventory.remove_item(item)
	await DialogueManager.show_dialogue([
		"La llave gira con resistencia y el cajón superior se abre apenas un centímetro.",
		"Dentro no hay arma ni dinero: solo la marca reciente de algo que fue retirado antes de que yo recibiera el caso.",
		"Quien preparó este expediente sabía que yo iba a revisarlo."
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
	await DialogueManager.show_dialogue(["Guardo el cuaderno, ajusto la linterna y salgo a la lluvia."], "Inspector")
	SceneRouter.change_room("res://src/rooms/room_02_streets/room_02_streets.tscn")
