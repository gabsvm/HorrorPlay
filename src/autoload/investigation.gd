# res://src/autoload/investigation.gd
extends Node

signal case_started
signal evidence_discovered(evidence_id: String, evidence: Dictionary)
signal objective_changed(objective_id: String, objective_text: String)

const EVIDENCE_CATALOG = {
	"coast_guard_reports": {
		"title": "Autopsias de los guardacostas",
		"description": "Tres desapariciones cerca del Arrecife del Diablo. Los informes locales mencionan una imposible 'asfixia seca'.",
		"category": "document"
	},
	"pathology_monograph": {
		"title": "Patologías costeras, 1898",
		"description": "Un estudio médico describe en familias antiguas de Innsmouth ojos inmóviles, piel queratinizada e indicios de estructuras branquiales internas. El autor lo atribuyó a endogamia.",
		"category": "document"
	},
	"occult_diary": {
		"title": "Diario de cuero",
		"description": "Un cuaderno marcado con símbolos astronómicos y coordenadas que apuntan hacia el Arrecife del Diablo.",
		"category": "document"
	},
	"reef_testimony": {
		"title": "Testimonio de Silas",
		"description": "El pescador reconoce las coordenadas del diario y vincula a los guardacostas con el arrecife. Barnaby conserva una llave de los botes.",
		"category": "testimony"
	},
	"harbor_notice": {
		"title": "Aviso de mareas del puerto",
		"description": "El puerto cerró oficialmente el acceso al Arrecife del Diablo después de tres incidentes nocturnos. Alguien arrancó del aviso el sello que identificaba quién dio la orden.",
		"category": "document"
	},
	"dock_key": {
		"title": "Llave del muelle",
		"description": "Barnaby dice que perteneció a uno de los oficiales desaparecidos. Abre el cobertizo de los botes.",
		"category": "physical"
	},
	"dock_manifest": {
		"title": "Manifiesto de salida N.º 317",
		"description": "El bote 317 salió con tres guardacostas y regresó vacío. El mismo número aparece asignado al casillero de servicio del cobertizo.",
		"category": "document"
	},
	"amphibious_tracks": {
		"title": "Huellas en la bajamar",
		"description": "Pisadas humanas llegan hasta el agua. Junto a ellas aparecen marcas anchas, membranosas, orientadas en sentido contrario: algo salió del mar.",
		"category": "physical"
	},
	"reef_radio_log": {
		"title": "Última transmisión del 317",
		"description": "La radio del cobertizo conserva una señal fragmentada: campanas bajo el agua, una luz en el arrecife y una orden desesperada de no responder a las voces.",
		"category": "audio"
	},
	"black_scale": {
		"title": "Escama negra",
		"description": "Una placa quitinosa del tamaño de una moneda, húmeda pese a llevar días bajo techo. No coincide con ninguna especie costera registrada.",
		"category": "physical"
	}
}

const OBJECTIVES = {
	"prepare_departure": "Revisar el expediente y preparar la salida hacia Innsmouth.",
	"find_local_lead": "Encontrar a alguien que reconozca las referencias al Arrecife del Diablo.",
	"get_dock_access": "Conseguir acceso a los botes y al cobertizo del muelle.",
	"reach_docks": "Llegar al muelle y seguir el rastro de los guardacostas desaparecidos.",
	"enter_boathouse": "Entrar al cobertizo de los guardacostas.",
	"restore_boathouse_power": "Restaurar la energía del cobertizo para activar el pescante del bote.",
	"launch_boat": "Botar el 317 y seguir la última ruta registrada hacia el Arrecife del Diablo.",
	"survive_reef_approach": "Mantener el rumbo mientras algo se mueve bajo la niebla del arrecife."
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
