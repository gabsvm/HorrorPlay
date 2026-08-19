# res://src/rooms/room_03_tavern/room_03_tavern.gd
extends Room

@onready var player: Player = $CharactersLayer/Player
@onready var door_back: Hotspot = $HotspotsLayer/DoorBack
@onready var innkeeper: Hotspot = $HotspotsLayer/Innkeeper
@onready var patrons: Hotspot = $HotspotsLayer/Patrons
@onready var notice_board: Hotspot = $HotspotsLayer/NoticeBoard

@export var dock_key_item: ItemData

func _ready() -> void:
	super._ready()
	GameState.set_var("player_location", "tavern")
	door_back.interacted.connect(_on_door_back_interacted)
	innkeeper.interacted.connect(_on_innkeeper_interacted)
	patrons.interacted.connect(_on_patrons_interacted)
	notice_board.interacted.connect(_on_notice_board_interacted)

func _on_door_back_interacted(verb: String) -> void:
	if verb == "interact":
		await DialogueManager.show_dialogue(["Abro la puerta. El aire frío de Marsh Street corta el humo de la taberna como una cuchilla."], "Inspector")
		SceneRouter.change_room("res://src/rooms/room_02_streets/room_02_streets.tscn")
	elif verb == "examine":
		DialogueManager.show_dialogue(["La salida. Barnaby la mira cada vez que me acerco."], "Inspector")

func _on_innkeeper_interacted(verb: String) -> void:
	if verb == "examine":
		var description = "Barnaby limpia el mismo vaso desde que entré. No parece distraído: está escuchando cada conversación del local."
		if GameState.get_flag("barnaby_threatened"):
			description = "Barnaby dejó de fingir cortesía. Sus manos están quietas y los hombres del fondo esperan una señal suya."
		DialogueManager.show_dialogue([description], "Inspector")
		return
	if verb != "interact":
		return
	
	if GameState.get_flag("has_dock_key"):
		_show_barnaby_after_key()
	elif _can_confront_barnaby():
		_show_barnaby_confrontation()
	else:
		DialogueManager.show_dialogue([
			"—No servimos alcohol a la ley, inspector.",
			"Barnaby empuja un vaso de agua hacia mí. —Terminá eso y marchate antes de que a los muchachos del muelle les moleste tu placa."
		], "Tabernero Barnaby")

func _can_confront_barnaby() -> bool:
	return Investigation.has_evidence("reef_testimony") \
		or Investigation.has_evidence("dock_manifest") \
		or GameState.get_flag("heard_barnaby_key_rumor")

func _show_barnaby_confrontation() -> void:
	DialogueManager.show_choices(
		"Barnaby deja el vaso sobre la barra. Ya tengo suficiente para obligarlo a reaccionar; la pregunta es cómo.",
		[
			{
				"text": "[Testimonio] Repetir exactamente lo que Silas contó sobre la llave.",
				"required_evidence": "reef_testimony",
				"callback": _on_barnaby_reasoned
			},
			{
				"text": "[Documento] Colocar el manifiesto del 317 sobre la barra.",
				"required_evidence": "dock_manifest",
				"callback": _on_barnaby_documented
			},
			{
				"text": "[Rumor] Preguntar por las pertenencias que el guardacostas dejó como garantía.",
				"required_flag": "heard_barnaby_key_rumor",
				"callback": _on_barnaby_rumor
			},
			{
				"text": "[Autoridad] Amenazar con cerrar la taberna y registrar el edificio.",
				"callback": _on_barnaby_threatened
			},
			{"text": "Retroceder. Todavía no.", "callback": _on_barnaby_back_off}
		],
		"Inspector"
	)

func _on_barnaby_reasoned() -> void:
	GameState.set_var("barnaby_attitude", 1)
	await DialogueManager.show_dialogue([
		"—Silas recuerda la deuda de uno de los hombres del 317. Recuerda también qué dejó como garantía.",
		"Barnaby aprieta la mandíbula. Por primera vez aparta la mirada.",
		"—Maldito viejo. Sí. Me dejó la llave la noche antes de ir al arrecife. Tomala y olvidate de mi nombre.",
		"Una [color=#ca8a04]llave pesada de hierro[/color] golpea la madera entre nosotros."
	], "Tabernero Barnaby")
	_grant_dock_key()

func _on_barnaby_documented() -> void:
	GameState.set_var("barnaby_attitude", 2)
	await DialogueManager.show_dialogue([
		"Extiendo el manifiesto del 317 sobre la barra. —El bote salió con tres hombres. El casillero de servicio sigue dentro de un cobertizo al que nadie puede entrar.",
		"—Si esta llave no existe, voy a pedir que el puerto abra cada cerradura delante de testigos.",
		"Barnaby lee la firma del oficial desaparecido. Su hostilidad se transforma en miedo.",
		"—No abras el casillero si encontrás agua adentro. —Deja la llave junto al manifiesto sin tocarme la mano."
	], "Tabernero Barnaby")
	_grant_dock_key()

func _on_barnaby_rumor() -> void:
	GameState.set_var("barnaby_attitude", 0)
	await DialogueManager.show_dialogue([
		"—Uno de tus clientes dice que el guardacostas dejó algo aquí para cubrir una deuda.",
		"Barnaby mira hacia la mesa del fondo. Las conversaciones mueren de golpe.",
		"—La gente habla cuando bebe. —Saca una llave de debajo de la barra—. Llevátela antes de que hablen más.",
		"No obtuve una confesión. Pero sí acceso."
	], "Tabernero Barnaby")
	_grant_dock_key()

func _on_barnaby_threatened() -> void:
	GameState.set_var("barnaby_attitude", -1)
	GameState.set_flag("barnaby_threatened", true)
	await DialogueManager.show_dialogue([
		"Le recuerdo que tres hombres están desaparecidos y que puedo cerrar su local hasta que Boston revise cada tabla del piso.",
		"Durante unos segundos nadie en la taberna respira.",
		"Barnaby arroja la llave. —Llevátela. Pero cuando cruces esa puerta vas a estar solo.",
		"Las conversaciones a mi espalda no vuelven a empezar."
	], "Tabernero Barnaby")
	Sanity.drain_sanity(5)
	_grant_dock_key()

func _on_barnaby_back_off() -> void:
	DialogueManager.show_dialogue(["No todavía. En este pueblo una amenaza mal elegida puede cerrar más puertas de las que abre."], "Inspector")

func _grant_dock_key() -> void:
	if dock_key_item and not Inventory.has_item(dock_key_item.id):
		Inventory.add_item(dock_key_item)
	GameState.set_flag("has_dock_key", true)
	Investigation.discover_evidence("dock_key")
	if GameState.get_flag("docks_visited"):
		Investigation.set_objective("enter_boathouse")
	else:
		Investigation.set_objective("reach_docks")
	SaveSystem.save_checkpoint(1)

func _show_barnaby_after_key() -> void:
	var attitude = int(GameState.get_var("barnaby_attitude", 0))
	if attitude < 0:
		DialogueManager.show_dialogue(["—Ya tenés la llave. No tenemos nada más que hablar.", "Los hombres del fondo siguen mis movimientos con demasiado interés."], "Tabernero Barnaby")
	elif attitude >= 2:
		DialogueManager.show_dialogue(["—Si el 317 volvió vacío, dejalo así. Hay cosas que regresan mejor sin pasajeros."], "Tabernero Barnaby")
	else:
		DialogueManager.show_dialogue(["—Si oís campanas desde el mar, corré hacia tierra. Y no preguntes cómo sé eso."], "Tabernero Barnaby")

func _on_patrons_interacted(verb: String) -> void:
	if verb == "examine":
		DialogueManager.show_dialogue(["Tres hombres ocupan la mesa más alejada del fuego. Sus vasos están llenos y ninguno parece beber."], "Inspector")
		return
	if verb != "interact":
		return
	if GameState.get_flag("barnaby_threatened"):
		DialogueManager.show_dialogue(["Nadie me responde. Uno de ellos mueve la silla apenas lo suficiente para bloquear el paso entre las mesas."], "Inspector")
		return
	if GameState.get_flag("heard_barnaby_key_rumor"):
		DialogueManager.show_dialogue(["La mesa se queda en silencio cuando me acerco. Ya obtuve de ellos lo único que iban a decir sin darse cuenta."], "Inspector")
		return
	if not Investigation.has_evidence("coast_guard_reports"):
		DialogueManager.show_dialogue(["—No sabemos nada de turistas ni policías —dice uno antes de que yo haga una pregunta."], "Cliente")
		return
	
	GameState.set_flag("heard_barnaby_key_rumor", true)
	await DialogueManager.show_dialogue([
		"Me siento en la mesa contigua y dejo que crean que estoy leyendo el periódico.",
		"—El del 317 todavía le debe dos botellas a Barnaby —murmura uno—. El tabernero se quedó con sus cosas cuando no volvió.",
		"—Callate. La llave también estaba ahí.",
		"Las voces se detienen. Ya escuché suficiente."
	], "Clientes")
	if Investigation.current_objective_id == "find_local_lead":
		Investigation.set_objective("get_dock_access")

func _on_notice_board_interacted(verb: String) -> void:
	if verb != "interact" and verb != "examine":
		return
	var lines: Array[String] = [
		"Anuncios de pesca, deudas, una pelea suspendida y tres fotografías recientes clavadas debajo de un titular: DESAPARECIDOS EN SERVICIO."
	]
	if Investigation.has_evidence("coast_guard_reports"):
		lines.append("Son los mismos hombres del expediente 47-B. Alguien dibujó branquias sobre una de las fotos y luego intentó borrarlas.")
	if Investigation.has_evidence("pathology_monograph"):
		lines.append("El dibujo reproduce casi exactamente el esquema anatómico del tratado médico de 1898.")
	DialogueManager.show_dialogue(lines, "Inspector")
