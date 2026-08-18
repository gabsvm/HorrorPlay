# res://src/autoload/game_state.gd
extends Node

signal flag_changed(flag_name: String, value: bool)
signal variable_changed(var_name: String, value: Variant)
signal state_reset

const DEFAULT_FLAGS = {
	"has_read_necronomicon": false,
	"inspector_met": false,
	"office_drawer_unlocked": false,
	"fisherman_met": false,
	"has_dock_key": false,
	"barnaby_threatened": false,
	"street_after_threat_seen": false,
	"docks_visited": false,
	"dock_tracks_examined": false,
	"dock_manifest_read": false,
	"boathouse_unlocked": false,
	"boathouse_entered": false,
	"service_locker_opened": false,
	"boathouse_fuse_installed": false,
	"boathouse_power_on": false,
	"reef_radio_heard": false,
	"black_scale_found": false,
	"boat_317_launched": false,
	"reef_sequence_seen": false
}

const DEFAULT_VARIABLES = {
	"player_location": "office",
	"current_day": 1,
	"barnaby_attitude": 0,
	"dock_tension": 0
}

var story_flags: Dictionary = DEFAULT_FLAGS.duplicate(true)
var story_variables: Dictionary = DEFAULT_VARIABLES.duplicate(true)

func set_flag(flag_name: String, value: bool) -> void:
	story_flags[flag_name] = value
	flag_changed.emit(flag_name, value)

func get_flag(flag_name: String) -> bool:
	return story_flags.get(flag_name, false)

func set_var(var_name: String, value: Variant) -> void:
	story_variables[var_name] = value
	variable_changed.emit(var_name, value)

func get_var(var_name: String, default: Variant = null) -> Variant:
	return story_variables.get(var_name, default)

func reset_state() -> void:
	story_flags = DEFAULT_FLAGS.duplicate(true)
	story_variables = DEFAULT_VARIABLES.duplicate(true)
	state_reset.emit()
