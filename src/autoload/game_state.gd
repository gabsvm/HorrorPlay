# res://src/autoload/game_state.gd
extends Node

signal flag_changed(flag_name: String, value: bool)
signal variable_changed(var_name: String, value: Variant)

var story_flags: Dictionary = {
	"has_read_necronomicon": false,
	"inspector_met": false,
	"office_drawer_unlocked": false
}

var story_variables: Dictionary = {
	"player_location": "office",
	"current_day": 1
}

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
