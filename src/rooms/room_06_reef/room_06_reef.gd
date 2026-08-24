# res://src/rooms/room_06_reef/room_06_reef.gd
extends Room

@onready var background: Sprite2D = $Background
@onready var underwater_glow: PointLight2D = $UnderwaterGlow
@onready var creature_shadow: Polygon2D = $CreatureShadow
@onready var end_shade: ColorRect = $EndLayer/Shade
@onready var end_panel: Panel = $EndLayer/EndPanel
@onready var ending_title: Label = $EndLayer/EndPanel/Content/EndingTitle
@onready var ending_body: Label = $EndLayer/EndPanel/Content/EndingBody
@onready var stats_label: Label = $EndLayer/EndPanel/Content/StatsLabel

var custom_font: Font = null

func _ready() -> void:
	room_name = "Arrecife del Diablo"
	ambience_profile = "reef"
	checkpoint_on_ready = true
	personal_light_enabled = true
	super._ready()
	GameState.set_var("player_location", "devils_reef")
	end_shade.visible = false
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
		var previous_title = str(GameState.get_var("reef_ending_title", "PROJECT LANTERN"))
		_show_end_panel(previous_title, "La llegada al Arrecife del Diablo ya forma parte del expediente. Ahora sé que alguien esperaba mi presencia antes de que yo recibiera el caso.")
		return
	await get_tree().create_timer(0.7).timeout
	AudioBus.play_horror_stinger(0.45)
	AtmosphereController.horror_pulse(0.55)
	await DialogueManager.show_dialogue([
		"El pueblo desaparece detrás de la niebla antes de que el 317 complete la primera milla.",
		"Las coordenadas del diario, la ruta del 317 y el cableado L-17 señalan el mismo punto: una línea de roca negra que apenas sobresale del agua.",
		"La brújula empieza a oscilar. La radio, con la batería desconectada, pronuncia mi apellido con la voz de un hombre muerto.",
		"Después reproduce durante medio segundo el sonido del cajón de mi oficina."
	], "Inspector")
	DialogueManager.show_choices(
		"Una luz verdosa se mueve bajo el bote. Algo está siguiendo al 317 mientras, desde la roca, aparece una débil luz eléctrica que no debería seguir funcionando.",
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
	GameState.set_var("reef_route", "investigation")
	Sanity.drain_sanity(6)
	await DialogueManager.show_dialogue([
		"Apago la lámpara. La oscuridad cae de golpe sobre el 317.",
		"Sin mi luz, la presencia bajo el casco deja de seguirme... pero ahora puedo ver lo que la lámpara ocultaba.",
		"[wave amp=10 freq=2]Docenas de luces verdes se abren bajo la superficie, demasiado separadas para pertenecer a un solo animal.[/wave]",
		"Entre ellas corre una línea recta de pequeños aisladores de porcelana: un cable humano desciende desde el arrecife hacia las profundidades."
	], "Inspector")
	await _play_creature_pass(0.75)
	await _reveal_lantern_station("Llegué siguiendo evidencia y descubrí que la estructura antigua fue rodeada por una estación humana de escucha.")

func _on_hold_course() -> void:
	GameState.set_var("reef_route", "discipline")
	Sanity.drain_sanity(15)
	AudioBus.play_horror_stinger(0.8)
	AtmosphereController.horror_pulse(0.9)
	await DialogueManager.show_dialogue([
		"Mantengo el faro encendido y fijo la vista al frente.",
		"La luz bajo el agua cambia de dirección inmediatamente.",
		"Algo enorme golpea la quilla. El 317 se inclina hasta que el agua entra por estribor.",
		"No respondo a la radio. Entre dos destellos alcanzo a ver postes, cable y una baranda de acero incrustada en la roca. Esto no es solo una ruina antigua. Alguien construyó aquí."
	], "Inspector")
	await _play_creature_pass(1.0)
	await _reveal_lantern_station("Llegué sin responder a las voces. La disciplina me permitió reconocer infraestructura federal escondida entre la roca negra.")

func _on_answer_voice() -> void:
	GameState.set_var("reef_route", "answered")
	Sanity.drain_sanity(30)
	AudioBus.play_horror_stinger(1.25)
	AtmosphereController.horror_pulse(1.35)
	await DialogueManager.show_dialogue([
		"—¿Quién está ahí?",
		"La radio deja de emitir estática.",
		"Mi propia voz responde desde el altavoz: [shake rate=22 level=10]—Todavía no.[/shake]",
		"No recuerdo haber pronunciado esas palabras."
	], "Inspector")
	await _play_creature_pass(1.35)
	await DialogueManager.show_dialogue([
		"Miro abajo.",
		"Por un instante entiendo la forma completa bajo el 317 y comprendo por qué el cerebro humano la fragmenta en aletas, ojos y extremidades.",
		"Después veo algo aún peor: cables humanos entrando directamente en esa forma, como electrodos colocados sobre un órgano vivo."
	], "Inspector")
	await _reveal_lantern_station("Respondí a la señal. Algo utilizó mi propia voz antes de que yo supiera qué palabras iba a decir.")

func _reveal_lantern_station(route_note: String) -> void:
	await DialogueManager.show_dialogue([
		"El 317 toca piedra. Encuentro una escalera de hierro instalada sobre escalones mucho más antiguos y desciendo a una cámara excavada en el arrecife.",
		"La mitad del lugar no pertenece a ninguna ruina. Hay mesas de trabajo, válvulas, auriculares, rollos de cable y cajas federales cubiertas por décadas de sal.",
		"En una placa de bronce todavía puede leerse: [color=#06b6d4]PROJECT LANTERN — DEVIL'S REEF LISTENING STATION[/color].",
		"Sobre la mesa central hay un receptor conectado a una piedra negra atravesada por filamentos de cobre. El receptor está encendido.",
		"Desconecto el cable de alimentación. Sigue encendido.",
		"Abro la carcasa: no hay cilindro, disco, hilo ni mecanismo de registro. Solo un circuito de recepción que termina dentro de la roca."
	], "Inspector")
	AudioBus.play_horror_stinger(0.72)
	AtmosphereController.horror_pulse(0.9)
	await DialogueManager.show_dialogue([
		"Me coloco los auriculares.",
		"Primero escucho a Hale. Después a Mercer. Después a Ward.",
		"Luego oigo una cuarta voz.",
		"Es la mía.",
		"[wave amp=10 freq=2]—No abras el archivo todavía.[/wave]",
		"La misma frase incompleta que atravesó la radio del 317 cuatro noches antes. Una frase que todavía no recuerdo haber dicho."
	], "Inspector")
	GameState.set_flag("lantern_roster_found", true)
	Investigation.discover_evidence("lantern_roster")
	await DialogueManager.show_dialogue([
		"Junto al receptor hay una hoja mecanografiada, fechada antes de la desaparición:",
		"PROJECT LANTERN — ANÁLISIS DE FIRMA 317.",
		"SIGNAL 01: HALE. SIGNAL 02: MERCER. SIGNAL 03: WARD.",
		"SIGNAL 04: UNKNOWN.",
		"Debajo, una anotación agregada en tinta roja: [color=#ca8a04]«MATCH SOURCE: CASE 47-B INVESTIGATOR»[/color].",
		"La última línea contiene la fecha de esta noche y una hora estimada de llegada al arrecife. Faltan once minutos.",
		"Miro el reloj de la estación.",
		"Faltan once minutos."
	], "Inspector")
	await DialogueManager.show_dialogue([
		route_note,
		"No me asignaron el expediente porque tres hombres desaparecieron.",
		"Alguien conservó este caso porque el 317 ya contenía una cuarta señal que todavía no existía.",
		"La mía."
	], "Inspector")
	_finish_slice(
		"PROJECT LANTERN",
		"El expediente 47-B no empezó con tu llegada a Innsmouth. Un registro anterior a la tragedia ya esperaba que llegaras al arrecife. La investigación acaba de convertirse en parte de la evidencia."
	)

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
	GameState.set_var("reef_ending_title", title)
	Investigation.complete_current_objective()
	SaveSystem.save_game(1)
	_show_end_panel(title, body)

func _show_end_panel(title: String, body: String) -> void:
	ending_title.text = title
	ending_body.text = body
	var optional_count = 0
	for evidence_id in ["pathology_monograph", "harbor_notice", "black_scale", "signal_without_recording"]:
		if Investigation.has_evidence(evidence_id):
			optional_count += 1
	stats_label.text = "Evidencias: %d / %d    ·    Anomalías opcionales: %d / 4    ·    Cordura: %d%%" % [
		Investigation.discovered_evidence.size(),
		Investigation.EVIDENCE_CATALOG.size(),
		optional_count,
		Sanity.current_sanity
	]
	end_shade.visible = true
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
