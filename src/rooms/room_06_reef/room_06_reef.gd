# res://src/rooms/room_06_reef/room_06_reef.gd
extends Node2D

@onready var background: Sprite2D = $Background
@onready var underwater_glow: PointLight2D = $UnderwaterGlow
@onready var creature_shadow: Polygon2D = $CreatureShadow
@onready var end_panel: Panel = $EndLayer/EndPanel
@onready var ending_title: Label = $EndLayer/EndPanel/Content/EndingTitle
@onready var ending_body: Label = $EndLayer/EndPanel/Content/EndingBody
@onready var stats_label: Label = $EndLayer/EndPanel/Content/StatsLabel

var custom_font: Font = null

func _ready() -> void:
	GameState.set_var("player_location", "devils_reef")
	end_panel.visible = false
	creature_shadow.modulate.a = 0.0
	custom_font = load("res://assets/fonts/SpecialElite-Regular.ttf")
	if custom_font:
		_apply_font_recursive($EndLayer)
	call_deferred("_begin_approach")

func _apply_font_recursive(node: Node) -> void:
	if node is Control:
		node.add_theme_font_override("font", custom_font)
	for child in node.get_children():
		_apply_font_recursive(child)

func _begin_approach() -> void:
	if GameState.get_flag("reef_sequence_seen"):
		_show_end_panel("EL ARRECIFE RECUERDA", "La aproximación al Arrecife del Diablo ya forma parte del expediente.")
		return
	
	await get_tree().create_timer(0.7).timeout
	AudioBus.play_horror_stinger(0.45)
	AtmosphereController.horror_pulse(0.55)
	await DialogueManager.show_dialogue([
		"El pueblo desaparece detrás de la niebla antes de que el 317 complete la primera milla.",
		"Las coordenadas del diario y la última ruta de los guardacostas señalan el mismo punto: una línea de roca negra que apenas sobresale del agua.",
		"La brújula empieza a oscilar.",
		"Entonces la radio pronuncia mi apellido con la voz de un hombre muerto hace tres días."
	], "Inspector")
	
	DialogueManager.show_choices(
		"Una luz verdosa se mueve bajo el bote. Algo está siguiendo al 317.",
		[
			{
				"text": "[Investigación] Apagar la lámpara y navegar por las coordenadas del diario.",
				"required_evidence": ["occult_diary", "reef_radio_log"],
				"callback": _on_dark_navigation
			},
			{
				"text": "[Disciplina] Mantener motor y luz; no reaccionar a las voces.",
				"sanity_min": 45,
				"callback": _on_hold_course
			},
			{
				"text": "[Susurros] Responder a la voz que conoce mi nombre.",
				"sanity_max": 44,
				"callback": _on_answer_voice
			}
		],
		"Inspector"
	)

func _on_dark_navigation() -> void:
	Sanity.drain_sanity(6)
	await DialogueManager.show_dialogue([
		"Apago la lámpara. La oscuridad cae de golpe sobre el 317.",
		"Sin la luz, la presencia bajo el casco deja de seguirme... pero ahora puedo ver lo que la lámpara ocultaba.",
		"[wave amp=10 freq=2]Docenas de luces verdes se abren bajo la superficie, demasiado separadas para pertenecer a un solo animal.[/wave]"
	], "Inspector")
	await _play_creature_pass(0.75)
	await DialogueManager.show_dialogue([
		"Entre dos bancos de niebla aparece una estructura de piedra en el arrecife. No figura en ninguna carta náutica.",
		"La entrada está por debajo de la línea de marea.",
		"Los guardacostas no desaparecieron en el mar. Encontraron algo construido dentro de él."
	], "Inspector")
	_finish_slice("RUMBO A LO PROFUNDO", "Seguiste las pistas sin atraer por completo la atención de aquello que vive bajo el arrecife.")

func _on_hold_course() -> void:
	Sanity.drain_sanity(15)
	AudioBus.play_horror_stinger(0.8)
	AtmosphereController.horror_pulse(0.9)
	await DialogueManager.show_dialogue([
		"Mantengo el faro encendido y fijo la vista al frente.",
		"La luz bajo el agua cambia de dirección inmediatamente.",
		"Algo enorme golpea la quilla. El 317 se inclina hasta que el agua entra por estribor."
	], "Inspector")
	await _play_creature_pass(1.0)
	await DialogueManager.show_dialogue([
		"No respondo a la radio. No reduzco el motor.",
		"Después de veinte segundos eternos, la presión bajo el casco desaparece.",
		"Frente a mí emerge una construcción negra entre las rocas. La ruta termina allí."
	], "Inspector")
	_finish_slice("BAJO SU MIRADA", "Llegaste al Arrecife del Diablo, pero algo en las profundidades ya sabe exactamente dónde estás.")

func _on_answer_voice() -> void:
	Sanity.drain_sanity(30)
	AudioBus.play_horror_stinger(1.25)
	AtmosphereController.horror_pulse(1.35)
	await DialogueManager.show_dialogue([
		"—¿Quién está ahí?",
		"La radio deja de emitir estática.",
		"Mi propia voz responde desde el altavoz: [shake rate=22 level=10]—Mirá abajo.[/shake]"
	], "Inspector")
	await _play_creature_pass(1.35)
	await DialogueManager.show_dialogue([
		"Miro.",
		"Por un instante entiendo la forma completa bajo el 317 y comprendo por qué el cerebro humano la fragmenta en aletas, ojos y extremidades.",
		"Cuando vuelvo a levantar la cabeza, estoy frente al arrecife. No recuerdo haber navegado hasta aquí."
	], "Inspector")
	_finish_slice("LA VOZ DEL ARRECIFE", "Respondiste. Algo respondió también, y una parte de la investigación ya no puede separarse de tu propia mente.")

func _play_creature_pass(intensity: float) -> void:
	AudioBus.play_horror_stinger(intensity)
	AtmosphereController.horror_pulse(intensity)
	underwater_glow.energy = 0.25
	creature_shadow.position = Vector2(-340, 0)
	creature_shadow.modulate.a = 0.0
	var tween = create_tween().set_parallel(true)
	tween.tween_property(creature_shadow, "position", Vector2(720, -35), 2.4).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(creature_shadow, "modulate:a", min(0.72, 0.38 + intensity * 0.2), 0.55)
	tween.tween_property(underwater_glow, "energy", 1.05 + intensity * 0.25, 0.7)
	await tween.finished
	var fade = create_tween().set_parallel(true)
	fade.tween_property(creature_shadow, "modulate:a", 0.0, 0.8)
	fade.tween_property(underwater_glow, "energy", 0.38, 1.0)
	await fade.finished

func _finish_slice(title: String, body: String) -> void:
	GameState.set_flag("reef_sequence_seen", true)
	Investigation.complete_current_objective()
	SaveSystem.save_game(1)
	_show_end_panel(title, body)

func _show_end_panel(title: String, body: String) -> void:
	ending_title.text = title
	ending_body.text = body
	stats_label.text = "Evidencias registradas: %d / %d    ·    Cordura restante: %d%%" % [
		Investigation.discovered_evidence.size(),
		Investigation.EVIDENCE_CATALOG.size(),
		Sanity.current_sanity
	]
	end_panel.visible = true
	InputController.block_input(true)
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.018, 0.024, 0.026, 0.96)
	style.border_width_left = 2
	style.border_width_top = 2
	style.border_width_right = 2
	style.border_width_bottom = 2
	style.border_color = Color(0.32, 0.5, 0.43, 0.8)
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	end_panel.add_theme_stylebox_override("panel", style)

func _on_menu_pressed() -> void:
	InputController.block_input(false)
	SceneRouter.change_room("res://src/menu/main_menu.tscn")
