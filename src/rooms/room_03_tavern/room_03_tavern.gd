# res://src/rooms/room_03_tavern/room_03_tavern.gd
extends Room

@onready var player: Player = $CharactersLayer/Player
@onready var door_back: Hotspot = $HotspotsLayer/DoorBack
@onready var innkeeper: Hotspot = $HotspotsLayer/Innkeeper

@export var dock_key_item: ItemData

func _ready() -> void:
	super._ready()
	# Input connection and handling are now in room.gd
	
	door_back.interacted.connect(_on_door_back_interacted)
	innkeeper.interacted.connect(_on_innkeeper_interacted)

func _on_door_back_interacted(verb: String) -> void:
	if verb == "interact":
		DialogueManager.show_dialogue(["Saliendo nuevamente a las calles frías y húmedas..."], "Inspector")
		SceneRouter.change_room("res://src/rooms/room_02_streets/room_02_streets.tscn")
	elif verb == "examine":
		DialogueManager.show_dialogue(["La pesada puerta de entrada de la taberna."], "Inspector")

func _on_innkeeper_interacted(verb: String) -> void:
	if verb == "interact":
		if GameState.get_flag("has_dock_key"):
			DialogueManager.show_dialogue(["Ya tenés la llave del cobertizo. Ahora largate, me espantás a los clientes locales."], "Tabernero")
		elif GameState.get_flag("fisherman_met") and GameState.get_flag("has_read_necronomicon"):
			DialogueManager.show_dialogue([
				"¿Silas te dijo que yo tenía el duplicado? Ese viejo habla de más...",
				"Sí, tengo la [color=#374151]llave de los botes[/color]. El oficial desaparecido me la dejó como fianza por su cuenta de ginebra antes de no volver nunca más.",
				"[wave amp=15 freq=2.5]Tomala, inspector. Si terminás en el fondo del Arrecife alimentando a las bestias, a mí no me metas en tus actas policiales.[/wave]"
			], "Tabernero")
			if dock_key_item:
				Inventory.add_item(dock_key_item)
			GameState.set_flag("has_dock_key", true)
		else:
			DialogueManager.show_dialogue([
				"No servimos alcohol a la ley, inspector.",
				"Terminá tu agua caliente y marchate antes de que a los muchachos del muelle les moleste tu placa."
			], "Tabernero")
	elif verb == "examine":
		DialogueManager.show_dialogue(["El tabernero Barnaby. Limpia un vaso mugriento y me mira con hostilidad."], "Inspector")
