# res://src/rooms/room_03_tavern/room_03_tavern.gd
extends Room

@onready var player: Player = $CharactersLayer/Player
@onready var door_back: Hotspot = $HotspotsLayer/DoorBack
@onready var innkeeper: Hotspot = $HotspotsLayer/Innkeeper

@export var dock_key_item: ItemData

func _ready() -> void:
	super._ready()
	door_back.interacted.connect(_on_door_back_interacted)
	innkeeper.interacted.connect(_on_innkeeper_interacted)

func _on_door_back_interacted(verb: String) -> void:
	if verb == "interact":
		await DialogueManager.show_dialogue(["Saliendo nuevamente a las calles frías y húmedas..."], "Inspector")
		SceneRouter.change_room("res://src/rooms/room_02_streets/room_02_streets.tscn")
	elif verb == "examine":
		DialogueManager.show_dialogue(["La pesada puerta de entrada de la taberna."], "Inspector")

func _on_innkeeper_interacted(verb: String) -> void:
	if verb == "interact":
		if GameState.get_flag("has_dock_key"):
			_show_barnaby_after_key()
		elif GameState.get_flag("fisherman_met") and GameState.get_flag("has_read_necronomicon"):
			_show_barnaby_confrontation()
		else:
			DialogueManager.show_dialogue([
				"No servimos alcohol a la ley, inspector.",
				"Terminá tu agua caliente y marchate antes de que a los muchachos del muelle les moleste tu placa."
			], "Tabernero")
	elif verb == "examine":
		DialogueManager.show_dialogue(["El tabernero Barnaby. Limpia un vaso mugriento y me mira con hostilidad."], "Inspector")

func _show_barnaby_confrontation() -> void:
	DialogueManager.show_choices(
		"Barnaby deja de limpiar el vaso cuando menciono a Silas y al oficial desaparecido. Puedo intentar hacerlo hablar...",
		[
			{
				"text": "[Investigación] Decirle exactamente lo que Silas contó sobre la llave.",
				"required_evidence": "reef_testimony",
				"callback": _on_barnaby_reasoned
			},
			{
				"text": "[Autoridad] Exigir la llave y amenazar con registrar toda la taberna.",
				"callback": _on_barnaby_threatened
			},
			{
				"text": "Retroceder. Todavía no.",
				"callback": _on_barnaby_back_off
			}
		],
		"Inspector"
	)

func _on_barnaby_reasoned() -> void:
	GameState.set_var("barnaby_attitude", 1)
	DialogueManager.show_dialogue([
		"Barnaby, el guardacostas que desapareció dejó una deuda de ginebra... y una garantía. Silas sabe que fue una llave del muelle.",
		"El tabernero deja el vaso sobre la barra. Por primera vez aparta la mirada.",
		"—Maldito viejo. Sí. Me la dejó la noche antes de ir al arrecife. Tomala y olvidate de mi nombre.",
		"Una [color=#ca8a04]llave pesada de hierro[/color] golpea la madera entre nosotros."
	], "Tabernero Barnaby")
	_grant_dock_key()

func _on_barnaby_threatened() -> void:
	GameState.set_var("barnaby_attitude", -1)
	GameState.set_flag("barnaby_threatened", true)
	DialogueManager.show_dialogue([
		"Le recuerdo que tres hombres están desaparecidos y que puedo cerrar su local hasta que Boston revise cada tabla del piso.",
		"Durante unos segundos nadie en la taberna respira.",
		"Barnaby arroja una llave sobre la barra. —Llevátela. Pero cuando salgas de acá, inspector, vas a estar solo.",
		"Las conversaciones a mi espalda no vuelven a empezar."
	], "Tabernero Barnaby")
	_grant_dock_key()

func _on_barnaby_back_off() -> void:
	DialogueManager.show_dialogue([
		"No todavía. En este pueblo una amenaza mal elegida puede cerrar más puertas de las que abre.",
		"Barnaby vuelve a limpiar el mismo vaso, pero ahora sé que está esperando mi próximo movimiento."
	], "Inspector")

func _grant_dock_key() -> void:
	if dock_key_item and not Inventory.has_item(dock_key_item.id):
		Inventory.add_item(dock_key_item)
	GameState.set_flag("has_dock_key", true)
	Investigation.discover_evidence("dock_key")
	if GameState.get_flag("docks_visited"):
		Investigation.set_objective("enter_boathouse")
	else:
		Investigation.set_objective("reach_docks")

func _show_barnaby_after_key() -> void:
	if GameState.get_flag("barnaby_threatened"):
		DialogueManager.show_dialogue([
			"No tenemos nada más que hablar. Ya tenés la llave.",
			"Los hombres del fondo siguen mis movimientos con demasiado interés."
		], "Tabernero Barnaby")
	else:
		DialogueManager.show_dialogue([
			"Ya tenés la llave del cobertizo. Si sos inteligente, la vas a devolver sin haberla usado.",
			"Barnaby baja la voz: —Y si oís campanas desde el mar... corré hacia tierra."
		], "Tabernero Barnaby")
