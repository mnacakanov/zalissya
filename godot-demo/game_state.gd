extends Node
## The game's state and its save (GAME_PLAN.md, B0): the 2D game's own shape,
## client/src/save/types.ts's SaveData,
##   {x, y, area, talked[], herbs, flags[]},
## where nearly everything lives in flags: plain names ("bread") and
## counters ("day=2", "clock=1290", minutes after midnight), read and written
## only through has / count / set_count / bump / add / remove, as
## systems/flags.ts does. (x, y) are metres on the Godot maidan, not the 2D
## map's pixels; a converter between the two comes with the world map.
##
## Kept in this browser's storage (user://, IndexedDB on the web) or a file
## on desktop; saved 2.5 s after anything changes, as the 2D game does, and
## kept in memory across the level editor's rebuilds. Made by the maidan
## before the HUD, which reads and writes it.

const PATH := "user://zalissya_save.json"
const LIMIT_FLAGS := 250    # save/types.ts
const LIMIT_TALKED := 80

var m: Node2D
var data := {}
var dirty := false
var since := 0.0


func setup(maidan: Node2D) -> void:
	m = maidan
	if Engine.has_meta("game_state"):
		data = Engine.get_meta("game_state")
	elif exists():
		var d = JSON.parse_string(FileAccess.get_file_as_string(PATH))
		data = d if d is Dictionary else _fresh()
	else:
		data = _fresh()
	Engine.set_meta("game_state", data)


func _fresh() -> Dictionary:
	var st: Array = m.data.get("start", [0, 13])
	return {"x": float(st[0]), "y": float(st[1]), "area": "village", "talked": [], "herbs": 0, "flags": []}


func exists() -> bool:
	return FileAccess.file_exists(PATH)


## a new game: the save is gone and the scene starts afresh
func new_game() -> void:
	if exists():
		DirAccess.remove_absolute(ProjectSettings.globalize_path(PATH))
	for k in ["game_state", "started"]:
		if Engine.has_meta(k):
			Engine.remove_meta(k)
	get_tree().reload_current_scene()


# --- flags, as systems/flags.ts ----------------------------------------------------------
func has(f: String) -> bool:
	return f in (data.flags as Array)


func add(f: String) -> void:
	if not has(f) and data.flags.size() < LIMIT_FLAGS:
		data.flags.append(f)
		dirty = true


func remove(f: String) -> void:
	if has(f):
		data.flags.erase(f)
		dirty = true


func count(name: String, default := 0) -> int:
	var pre := name + "="
	for f in data.flags:
		if (f as String).begins_with(pre):
			return int((f as String).substr(pre.length()))
	return default


func set_count(name: String, v: int) -> void:
	var pre := name + "="
	var flags: Array = data.flags
	for i in flags.size():
		if (flags[i] as String).begins_with(pre):
			if flags[i] != pre + str(v):
				flags[i] = pre + str(v)
				dirty = true
			return
	if flags.size() < LIMIT_FLAGS:
		flags.append(pre + str(v))
		dirty = true


func bump(name: String, by := 1) -> int:
	var v := count(name) + by
	set_count(name, v)
	return v


func talked(id: String) -> bool:
	return id in (data.talked as Array)


func add_talked(id: String) -> void:
	if not talked(id) and data.talked.size() < LIMIT_TALKED:
		data.talked.append(id)
		dirty = true


# --- saving --------------------------------------------------------------------------------
## where he stands, in metres (not while the level editor flies the camera)
func _capture() -> void:
	if m.editing or m.player == null:
		return
	var tr := Transform2D(m.east as Vector2, -(m.north as Vector2), Vector2.ZERO)
	var mt: Vector2 = tr.affine_inverse() * (m.player.position as Vector2)
	var x := snappedf(mt.x, 0.01)
	var y := snappedf(mt.y, 0.01)
	if absf(x - float(data.x)) > 0.05 or absf(y - float(data.y)) > 0.05:
		data.x = x
		data.y = y
		dirty = true


func save_now() -> void:
	_capture()
	var f := FileAccess.open(PATH, FileAccess.WRITE)
	if f != null:
		f.store_string(JSON.stringify(data))
	dirty = false
	since = 0.0


func _process(delta: float) -> void:
	if not Engine.get_meta("started", false):
		return
	since += delta
	if since >= 2.5:
		since = 0.0
		_capture()
		if dirty:
			save_now()


func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST and Engine.get_meta("started", false):
		save_now()
