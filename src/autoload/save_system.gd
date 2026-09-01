# res://src/autoload/save_system.gd
extends Node

signal checkpoint_saved(slot_index: int)

const SAVE_PATH = "user://save_slot_%d.dat"
const ENCRYPTION_KEY = "CthulhuFhtagnWgahNaglFhtagn"

func has_save(slot_index: int = 1) -> bool:
	return FileAccess.file_exists(SAVE_PATH % slot_index)

func reset_runtime_state() -> void:
	GameState.reset_state()
	Investigation.reset_case()
	Inventory.clear_inventory()
	Sanity.reset_sanity()

func save_checkpoint(slot_index: int = 1) -> Error:
	var err = save_game(slot_index)
	if err == OK:
		checkpoint_saved.emit(slot_index)
	return err

func save_game(slot_index: int) -> Error:
	var file = FileAccess.open_encrypted_with_pass(SAVE_PATH % slot_index, FileAccess.WRITE, ENCRYPTION_KEY)
	if file == null:
		return FileAccess.get_open_error()
	var item_paths: Array[String] = []
	for item in Inventory.items:
		if item and item.resource_path != "":
			item_paths.append(item.resource_path)
	var current_scene_path = ""
	if get_tree().current_scene:
		current_scene_path = get_tree().current_scene.scene_file_path
	var save_data = {
		"save_version": 3,
		"game_state": {"flags": GameState.story_flags, "variables": GameState.story_variables},
		"investigation": Investigation.get_save_data(),
		"inventory": {"items": item_paths},
		"sanity": Sanity.current_sanity,
		"current_room_path": current_scene_path
	}
	file.store_line(JSON.stringify(save_data))
	file.close()
	return OK

func load_game(slot_index: int) -> Error:
	var path = SAVE_PATH % slot_index
	if not FileAccess.file_exists(path):
		return ERR_FILE_NOT_FOUND
	var file = FileAccess.open_encrypted_with_pass(path, FileAccess.READ, ENCRYPTION_KEY)
	if file == null:
		return FileAccess.get_open_error()
	var json_string = file.get_as_text()
	file.close()
	var json = JSON.new()
	var error = json.parse(json_string)
	if error != OK:
		return ERR_FILE_CORRUPT
	var save_data = json.data
	if not save_data is Dictionary:
		return ERR_FILE_CORRUPT
	if not _is_valid_save_schema(save_data):
		return ERR_FILE_CORRUPT

	reset_runtime_state()
	if save_data.has("game_state"):
		var gs_data = save_data["game_state"]
		if gs_data.has("flags"):
			for flag in gs_data["flags"]:
				GameState.set_flag(flag, gs_data["flags"][flag])
		if gs_data.has("variables"):
			for variable in gs_data["variables"]:
				GameState.set_var(variable, gs_data["variables"][variable])
	if save_data.has("investigation") and save_data["investigation"] is Dictionary:
		Investigation.load_save_data(save_data["investigation"])
	else:
		_restore_legacy_investigation_state()
	if save_data.has("sanity"):
		Sanity.current_sanity = int(save_data["sanity"])
	if save_data.has("inventory") and save_data["inventory"].has("items"):
		for res_path in save_data["inventory"]["items"]:
			if ResourceLoader.exists(res_path):
				var item_res = load(res_path) as ItemData
				if item_res:
					Inventory.add_item(item_res)
	if save_data.has("current_room_path") and save_data["current_room_path"] != "":
		var target_room = save_data["current_room_path"]
		if ResourceLoader.exists(target_room):
			SceneRouter.change_room(target_room)
	return OK

func _is_valid_save_schema(save_data: Dictionary) -> bool:
	if save_data.has("save_version") and not save_data["save_version"] is int:
		return false

	if save_data.has("game_state"):
		var game_state_data = save_data["game_state"]
		if not game_state_data is Dictionary:
			return false
		if game_state_data.has("flags"):
			var flags = game_state_data["flags"]
			if not flags is Dictionary:
				return false
			for flag_name in flags:
				if not flags[flag_name] is bool:
					return false
		if game_state_data.has("variables") and not game_state_data["variables"] is Dictionary:
			return false

	if save_data.has("investigation"):
		var investigation_data = save_data["investigation"]
		if not investigation_data is Dictionary:
			return false
		if investigation_data.has("case_active") and not investigation_data["case_active"] is bool:
			return false
		if investigation_data.has("discovered_evidence") and not investigation_data["discovered_evidence"] is Array:
			return false
		if investigation_data.has("completed_objectives") and not investigation_data["completed_objectives"] is Array:
			return false
		if investigation_data.has("current_objective_id") and not investigation_data["current_objective_id"] is String:
			return false

	if save_data.has("inventory"):
		var inventory_data = save_data["inventory"]
		if not inventory_data is Dictionary:
			return false
		if inventory_data.has("items"):
			var item_paths = inventory_data["items"]
			if not item_paths is Array:
				return false
			for item_path in item_paths:
				if not item_path is String:
					return false

	if save_data.has("sanity"):
		var sanity_value = save_data["sanity"]
		if not sanity_value is int and not sanity_value is float:
			return false

	if save_data.has("current_room_path") and not save_data["current_room_path"] is String:
		return false

	return true

func _restore_legacy_investigation_state() -> void:
	Investigation.reset_case()
	Investigation.start_case()
	Investigation.discover_evidence("coast_guard_reports")
	if GameState.get_flag("has_read_necronomicon"):
		Investigation.discover_evidence("occult_diary")
		Investigation.set_objective("find_local_lead")
	if GameState.get_flag("fisherman_met"):
		Investigation.discover_evidence("reef_testimony")
		Investigation.set_objective("get_dock_access")
	if GameState.get_flag("has_dock_key"):
		Investigation.discover_evidence("dock_key")
		Investigation.set_objective("reach_docks")
