extends Node

const TEST_SLOT := 97
const TEST_PATH := "user://save_slot_%d.dat" % TEST_SLOT

func _ready() -> void:
	print("[SAVE SAFETY TEST] Initializing malformed-schema regression...")
	call_deferred("_run")

func _run() -> void:
	SaveSystem.reset_runtime_state()
	GameState.set_flag("save_schema_runtime_sentinel", true)

	var malformed_save := {
		"save_version": 3,
		"game_state": {
			"flags": {},
			"variables": {}
		},
		"inventory": {
			"items": {}
		},
		"sanity": 72,
		"current_room_path": ""
	}

	var file := FileAccess.open_encrypted_with_pass(TEST_PATH, FileAccess.WRITE, SaveSystem.ENCRYPTION_KEY)
	if file == null:
		_fail("Could not create malformed encrypted save fixture")
		return
	file.store_line(JSON.stringify(malformed_save))
	file.close()

	var load_error := SaveSystem.load_game(TEST_SLOT)
	_cleanup_fixture()

	if load_error != ERR_FILE_CORRUPT:
		_fail("Malformed nested save schema returned %s instead of ERR_FILE_CORRUPT" % error_string(load_error))
		return
	if not GameState.get_flag("save_schema_runtime_sentinel"):
		_fail("Malformed save mutated/reset live runtime state before schema rejection")
		return

	print("[SAVE SAFETY TEST] PASS: malformed nested schema is rejected before runtime mutation")
	get_tree().quit(0)

func _cleanup_fixture() -> void:
	var absolute_path := ProjectSettings.globalize_path(TEST_PATH)
	if FileAccess.file_exists(TEST_PATH):
		DirAccess.remove_absolute(absolute_path)

func _fail(reason: String) -> void:
	_cleanup_fixture()
	printerr("[SAVE SAFETY TEST FAILED] ", reason)
	get_tree().quit(1)
