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
	"dock_key": {
		"title": "Llave del muelle",
		"description": "Barnaby dice que perteneció a uno de los oficiales desaparecidos. Abre el cobertizo de los botes.",
		"category": "physical"
	}
}

const OBJECTIVES = {
	"prepare_departure": "Revisar el expediente y preparar la salida hacia Innsmouth.",
	"find_local_lead": "Encontrar a alguien que reconozca las referencias al Arrecife del Diablo.",
	"get_dock_access": "Conseguir acceso a los botes y al cobertizo del muelle.",
	"reach_docks": "Llegar al muelle y seguir el rastro de los guardacostas desaparecidos."
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
		var id = str(evidence_id)
		if EVIDENCE_CATALOG.has(id) and not discovered_evidence.has(id):
			discovered_evidence.append(id)
	
	for objective_id in data.get("completed_objectives", []):
		var id = str(objective_id)
		if OBJECTIVES.has(id) and not completed_objectives.has(id):
			completed_objectives.append(id)
	
	current_objective_id = str(data.get("current_objective_id", ""))
	if current_objective_id != "" and OBJECTIVES.has(current_objective_id):
		objective_changed.emit(current_objective_id, get_current_objective_text())

func reset_case() -> void:
	case_active = false
	discovered_evidence.clear()
	completed_objectives.clear()
	current_objective_id = ""
