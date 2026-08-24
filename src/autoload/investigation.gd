# res://src/autoload/investigation.gd
extends Node

signal case_started
signal evidence_discovered(evidence_id: String, evidence: Dictionary)
signal objective_changed(objective_id: String, objective_text: String)

const EVIDENCE_CATALOG = {
	"coast_guard_reports": {
		"title": "Autopsias de los guardacostas",
		"description": "El expediente 47-B contiene una contradicción imposible: Hale habría muerto casi una hora antes de aparecer en la última transmisión oficial del 317.",
		"category": "document"
	},
	"pathology_monograph": {
		"title": "Patologías costeras, 1898",
		"description": "Un estudio médico describe en familias antiguas de Innsmouth ojos inmóviles, piel queratinizada y estructuras branquiales internas. Notas posteriores marcan a varias familias como 'receptores'.",
		"category": "document"
	},
	"occult_diary": {
		"title": "Diario de cuero",
		"description": "Un cuaderno de mareas y coordenadas del Arrecife del Diablo. Repite una regla: cuando la voz pronuncie tu nombre, no respondas.",
		"category": "document"
	},
	"reef_testimony": {
		"title": "Testimonio de Silas",
		"description": "Silas ha visto antes equipos oficiales investigar el arrecife. Afirma que el pueblo teme más a quienes intentan reabrirlo que a la propia niebla.",
		"category": "testimony"
	},
	"harbor_notice": {
		"title": "Aviso de mareas del puerto",
		"description": "El cierre del Arrecife del Diablo fue emitido antes de la desaparición del 317. No fue una respuesta al desastre: formaba parte de algo ya planificado.",
		"category": "document"
	},
	"dock_key": {
		"title": "Llave del muelle",
		"description": "Barnaby conservó la llave del cobertizo después de una visita oficial anterior. Su miedo parece dirigido a que alguien vuelva a activar lo que hay allí.",
		"category": "physical"
	},
	"dock_manifest": {
		"title": "Manifiesto de salida N.º 317",
		"description": "El 317 llevaba tres guardacostas y una carga técnica no declarada: receptor acústico L-17, propiedad federal. La línea de regreso quedó vacía.",
		"category": "document"
	},
	"amphibious_tracks": {
		"title": "Huellas en la bajamar",
		"description": "Pisadas humanas llegan al agua y marcas membranosas regresan a tierra. Alguien conocía esta posibilidad antes de clausurar el arrecife.",
		"category": "physical"
	},
	"lantern_field_tag": {
		"title": "Etiqueta PROJECT LANTERN",
		"description": "Una etiqueta federal oculta en el casillero 317 identifica el equipo L-17 como parte de PROJECT LANTERN y ordena que no figure en el manifiesto público.",
		"category": "document"
	},
	"reef_radio_log": {
		"title": "Transmisión del 317",
		"description": "La radio reproduce voces del 317, campanas y una advertencia sobre los nombres. El contenido coincide con el expediente, pero el aparato no contiene mecanismo de grabación.",
		"category": "audio"
	},
	"signal_without_recording": {
		"title": "Señal sin soporte físico",
		"description": "El receptor del cobertizo está recibiendo una transmisión que no puede estar almacenada allí. Entre la estática aparecen sonidos producidos durante la investigación actual.",
		"category": "anomaly"
	},
	"black_scale": {
		"title": "Escama negra",
		"description": "Una placa quitinosa húmeda encontrada bajo techo. No demuestra por sí sola qué son las criaturas del arrecife ni si alguna vez fueron humanas.",
		"category": "physical"
	},
	"lantern_roster": {
		"title": "Análisis de señales LANTERN",
		"description": "Un registro del arrecife enumera cuatro firmas asociadas al 317: Hale, Mercer, Ward y una cuarta señal UNKNOWN vinculada al investigador del caso 47-B antes de su llegada.",
		"category": "classified"
	}
}

const OBJECTIVES = {
	"prepare_departure": "Revisar el expediente y determinar qué no encaja en la cronología del 317.",
	"find_local_lead": "Descubrir por qué Innsmouth conocía el peligro antes de la desaparición.",
	"get_dock_access": "Conseguir acceso a los botes y averiguar quién intentó mantener cerrado el cobertizo.",
	"reach_docks": "Llegar al muelle y reconstruir la misión real del 317.",
	"enter_boathouse": "Entrar al cobertizo y localizar el equipo vinculado al 317.",
	"restore_boathouse_power": "Restaurar la energía del cobertizo y descubrir qué intentaron apagar.",
	"launch_boat": "Botar el 317 y seguir la ruta del equipo L-17 hacia el Arrecife del Diablo.",
	"survive_reef_approach": "Llegar al origen de la señal y averiguar por qué el caso 47-B ya estaba previsto."
}

var case_active: bool = false
var discovered_evidence: Array[String] = []
var completed_objectives: Array[String] = []
var current_objective_id: String = ""

func start_case() -> void:
	if case_active:
		return
	case_active = true
	case_started.emit()
	set_objective("prepare_departure")

func discover_evidence(evidence_id: String) -> bool:
	if not EVIDENCE_CATALOG.has(evidence_id):
		push_warning("Investigation: unknown evidence id '%s'" % evidence_id)
		return false
	if discovered_evidence.has(evidence_id):
		return false
	
	discovered_evidence.append(evidence_id)
	evidence_discovered.emit(evidence_id, EVIDENCE_CATALOG[evidence_id])
	return true

func has_evidence(evidence_id: String) -> bool:
	return discovered_evidence.has(evidence_id)

func get_evidence(evidence_id: String) -> Dictionary:
	return EVIDENCE_CATALOG.get(evidence_id, {})

func set_objective(objective_id: String) -> void:
	if not OBJECTIVES.has(objective_id):
		push_warning("Investigation: unknown objective id '%s'" % objective_id)
		return
	if current_objective_id == objective_id:
		return
	
	if current_objective_id != "" and not completed_objectives.has(current_objective_id):
		completed_objectives.append(current_objective_id)
	current_objective_id = objective_id
	objective_changed.emit(current_objective_id, get_current_objective_text())

func complete_current_objective() -> void:
	if current_objective_id != "" and not completed_objectives.has(current_objective_id):
		completed_objectives.append(current_objective_id)
	current_objective_id = ""
	objective_changed.emit("", "")

func get_current_objective_text() -> String:
	return OBJECTIVES.get(current_objective_id, "")

func get_save_data() -> Dictionary:
	return {
		"case_active": case_active,
		"discovered_evidence": discovered_evidence.duplicate(),
		"completed_objectives": completed_objectives.duplicate(),
		"current_objective_id": current_objective_id
	}

func load_save_data(data: Dictionary) -> void:
	case_active = bool(data.get("case_active", false))
	discovered_evidence.clear()
	completed_objectives.clear()
	
	for evidence_id in data.get("discovered_evidence", []):
		var evidence_key = str(evidence_id)
		if EVIDENCE_CATALOG.has(evidence_key) and not discovered_evidence.has(evidence_key):
			discovered_evidence.append(evidence_key)
	
	for objective_id in data.get("completed_objectives", []):
		var objective_key = str(objective_id)
		if OBJECTIVES.has(objective_key) and not completed_objectives.has(objective_key):
			completed_objectives.append(objective_key)
	
	current_objective_id = str(data.get("current_objective_id", ""))
	if current_objective_id != "" and OBJECTIVES.has(current_objective_id):
		objective_changed.emit(current_objective_id, get_current_objective_text())
	else:
		current_objective_id = ""
		objective_changed.emit("", "")

func reset_case() -> void:
	case_active = false
	discovered_evidence.clear()
	completed_objectives.clear()
	current_objective_id = ""
	objective_changed.emit("", "")
