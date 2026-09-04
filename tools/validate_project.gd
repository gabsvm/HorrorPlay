extends SceneTree

const RESOURCE_EXTENSIONS := [
	"gd",
	"tscn",
	"tres",
	"gdshader",
	"svg",
	"png",
	"ogg",
	"ttf"
]

var failures: Array[String] = []
var checked_count: int = 0

func _initialize() -> void:
	print("HorrorPlay validator: scanning project resources...")
	_validate_main_scene()
	_scan_directory("res://src")
	_scan_directory("res://assets")
	if failures.is_empty():
		print("HorrorPlay validator: OK — %d resources loaded successfully." % checked_count)
		quit(0)
		return
	printerr("HorrorPlay validator: FAILED — %d issue(s)." % failures.size())
	for failure in failures:
		printerr("  - %s" % failure)
	quit(1)

func _validate_main_scene() -> void:
	var main_scene = str(ProjectSettings.get_setting("application/run/main_scene", ""))
	if main_scene.is_empty():
		failures.append("application/run/main_scene is empty")
		return
	_validate_resource(main_scene)

func _scan_directory(path: String) -> void:
	if FileAccess.file_exists(path.path_join(".gdignore")):
		return
	var dir = DirAccess.open(path)
	if dir == null:
		failures.append("Cannot open directory: %s" % path)
		return
	dir.list_dir_begin()
	var entry = dir.get_next()
	while not entry.is_empty():
		if entry != "." and entry != "..":
			var resource_path = path.path_join(entry)
			if dir.current_is_dir():
				_scan_directory(resource_path)
			elif entry.get_extension().to_lower() in RESOURCE_EXTENSIONS:
				_validate_resource(resource_path)
		entry = dir.get_next()
	dir.list_dir_end()

func _validate_resource(resource_path: String) -> void:
	checked_count += 1
	if not ResourceLoader.exists(resource_path):
		failures.append("ResourceLoader cannot resolve %s" % resource_path)
		return
	var resource = ResourceLoader.load(resource_path, "", ResourceLoader.CACHE_MODE_IGNORE)
	if resource == null:
		failures.append("Failed to load %s" % resource_path)
