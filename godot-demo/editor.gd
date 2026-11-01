extends Node2D
## The level editor: place things on the maidan by hand (GAME_PLAN.md, track A).
##
## It is shown only when the game is opened with ?edit in the address (or run
## from the Godot editor, or with --edit). "Редагувати" or Tab switches edit
## mode: the game pauses, the camera flies free, and you can
##   · click a building or a prop to select it, drag it to move it (it snaps
##     to a half-metre grid; hold Shift to move freely),
##   · duplicate (Ctrl+D), delete (Del), turn a quarter round (R), mirror (F), make it bigger or smaller ([ ]),
##   · pick a picture from the palette and click the ground to place it,
##   · undo and redo (Ctrl+Z, Ctrl+Y),
##   · drag empty ground (or right-drag) to pan, wheel or − + to zoom.
##
## Every edit rewrites the level's data (maidan.json's layout, same order and
## style) and rebuilds the scene from it, so what you see is exactly what the
## file says. The edits are kept in the browser (user://) as you go; "Зберегти"
## writes zalissya/maidan.json when run from the Godot editor, and in a
## browser downloads it, to be committed (see zalissya/README.md).
##
## Kept in a script of its own beside maidan.gd (as people.gd is); the maidan
## only hands it the level and lists what was built from which entry.

const LOCAL := "user://maidan_edit.json"
const GRID := 0.5          # metres: what a drag snaps to
const PX_PER_M := 88.0     # the pictures' density: a prop's "metres" is its height
const PALETTE_DIRS := ["res://styles/pillars/props/"]

var m: Node2D                     # the maidan
var on := false
var ui: CanvasLayer
var panel: PanelContainer
var toggle_btn: Button
var info: Label
var palette: ItemList
var palette_files: Array[String] = []
var place_file := ""              # a picture picked in the palette, to place
var picks: Array[Dictionary] = [] # what can be clicked: {rect, fade, src: {list, i}}
var sel := {}                     # the selected entry's src, or {}
var drag := {}                    # {pick, start (scene px), moved}
var pan := {}                     # {start (screen px), from (player pos)}


# --- where the level comes from, and whether editing is allowed -------------------------
static func allowed() -> bool:
	if OS.has_feature("editor"):
		return true
	if "--edit" in OS.get_cmdline_user_args() or "--edit" in OS.get_cmdline_args():
		return true
	if OS.has_feature("web"):
		var q = JavaScriptBridge.eval("window.location.search", true)
		return q is String and q.contains("edit")
	return false


## The level as the maidan should build it: the one being edited (kept across
## the editor's rebuilds), else this browser's unsaved edits (editing only),
## else the file.
static func load_level(path: String) -> Dictionary:
	if Engine.has_meta("edit_level"):
		var d = JSON.parse_string(Engine.get_meta("edit_level"))
		if d is Dictionary:
			return d
	if allowed() and FileAccess.file_exists(LOCAL):
		var d = JSON.parse_string(FileAccess.get_file_as_string(LOCAL))
		if d is Dictionary:
			return d
	return JSON.parse_string(FileAccess.get_file_as_string(path))


# --- setting up ---------------------------------------------------------------------------
func setup(maidan: Node2D) -> void:
	m = maidan
	z_index = 200
	_collect_picks()
	_build_ui()
	on = Engine.get_meta("edit_on", false)
	if Engine.has_meta("edit_view"):
		var v: Dictionary = Engine.get_meta("edit_view")
		m.player.position = v.pos
		m.cam.zoom = v.zoom
		m.cam.reset_smoothing()
	sel = Engine.get_meta("edit_sel", {})
	_set_on(on)


func _collect_picks() -> void:
	picks.clear()
	for b in m.buildings:
		if b.has("src"):
			picks.append(b)
	for p in m.prop_nodes:
		picks.append(p)


func _build_ui() -> void:
	ui = CanvasLayer.new()
	ui.layer = 20
	add_child(ui)
	toggle_btn = Button.new()
	toggle_btn.text = "Редагувати"
	toggle_btn.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	toggle_btn.offset_left = -170
	toggle_btn.offset_right = -12
	toggle_btn.offset_top = 10
	toggle_btn.pressed.connect(func(): _set_on(not on))
	ui.add_child(toggle_btn)
	panel = PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_RIGHT_WIDE)
	panel.custom_minimum_size = Vector2(290, 0)
	panel.offset_left = -302
	panel.offset_right = -12
	panel.offset_bottom = -12
	panel.clip_contents = true
	panel.offset_top = 50
	ui.add_child(panel)
	var col := VBoxContainer.new()
	panel.add_child(col)
	info = Label.new()
	info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	info.custom_minimum_size = Vector2(270, 60)
	col.add_child(info)
	var grid := GridContainer.new()
	grid.columns = 2
	col.add_child(grid)
	for b in [["Назад", _undo], ["Вперед", _redo], ["Копія", _duplicate],
			["Видалити", _delete], ["Повернути", _turn], ["Дзеркало", _flip], ["Більше", func(): _scale_sel(1.1)],
			["Менше", func(): _scale_sel(1.0 / 1.1)], ["Зберегти", _save], ["Копіювати", _copy]]:
		var btn := Button.new()
		btn.text = b[0]
		btn.custom_minimum_size = Vector2(134, 0)
		btn.pressed.connect(b[1])
		grid.add_child(btn)
	var reset := Button.new()
	reset.text = "Скинути мої зміни"
	reset.pressed.connect(_discard)
	col.add_child(reset)
	var ph := Label.new()
	ph.text = "Палітра: вибери, тоді клацни на землі"
	ph.custom_minimum_size = Vector2(270, 0)
	ph.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	col.add_child(ph)
	palette = ItemList.new()
	palette.size_flags_vertical = Control.SIZE_EXPAND_FILL
	palette.fixed_icon_size = Vector2i(48, 48)
	palette.icon_mode = ItemList.ICON_MODE_LEFT
	palette.item_selected.connect(func(i):
		place_file = palette_files[i]
		sel = {}
		_refresh())
	col.add_child(palette)
	_fill_palette()


func _fill_palette() -> void:
	palette_files.clear()
	palette.clear()
	for root in PALETTE_DIRS:
		for d in _list(root):
			if not d.ends_with("/"):
				continue
			for f in _list(root + d):
				if f.ends_with(".png") and not f.ends_with("_n.png"):
					var path: String = root + d + f
					var rel := path.trim_prefix("res://styles/%s/" % m.style).trim_suffix(".png")
					palette_files.append(rel)
					var tex = load(path)
					palette.add_item(f.trim_suffix(".png"), tex if tex is Texture2D else null)


func _list(dir: String) -> PackedStringArray:
	var out := ResourceLoader.list_directory(dir)
	out.sort()
	return out


# --- edit mode on and off -----------------------------------------------------------------
func _set_on(v: bool) -> void:
	on = v
	Engine.set_meta("edit_on", on)
	m.editing = on
	panel.visible = on
	toggle_btn.text = "Грати" if on else "Редагувати"
	if m.player_anim != null:
		m.player_anim.modulate.a = 0.35 if on else 1.0
	if not on:
		place_file = ""
		drag = {}
	_refresh()


func _refresh() -> void:
	queue_redraw()
	if not on:
		return
	var t := "Режим редагування. Клацни річ, щоб вибрати; тягни, щоб пересунути (Shift: без сітки).\n"
	var e = _entry(sel)
	if e != null:
		t = "Вибрано: %s\nм: %s" % [e.get("name", e.get("id", e.get("file", "?"))), str(e.get("at", ""))]
	elif place_file != "":
		t = "Ставлю: %s\nКлацни на землі. Esc: скасувати." % place_file.get_file()
	info.text = t


# --- the data: entries, undo, rebuild -----------------------------------------------------
func _entry(src: Dictionary):
	if src.is_empty():
		return null
	var list: Array = m.data.get(src.list, [])
	return list[src.i] if src.i < list.size() else null


func _commit(change: Callable) -> void:
	var before := _pretty(m.data)
	change.call()
	var after := _pretty(m.data)
	if after == before:
		return
	var undo: Array = Engine.get_meta("edit_undo", [])
	undo.append(before)
	if undo.size() > 100:
		undo.pop_front()
	Engine.set_meta("edit_undo", undo)
	Engine.set_meta("edit_redo", [])
	_rebuild(after)


func _rebuild(text: String) -> void:
	Engine.set_meta("edit_level", text)
	Engine.set_meta("edit_sel", sel)
	Engine.set_meta("edit_view", {"pos": m.player.position, "zoom": m.cam.zoom})
	var f := FileAccess.open(LOCAL, FileAccess.WRITE)
	if f != null:
		f.store_string(text)
	get_tree().reload_current_scene()


func _undo() -> void:
	var undo: Array = Engine.get_meta("edit_undo", [])
	if undo.is_empty():
		return
	var redo: Array = Engine.get_meta("edit_redo", [])
	redo.append(_pretty(m.data))
	Engine.set_meta("edit_redo", redo)
	sel = {}
	_rebuild(undo.pop_back())


func _redo() -> void:
	var redo: Array = Engine.get_meta("edit_redo", [])
	if redo.is_empty():
		return
	var undo: Array = Engine.get_meta("edit_undo", [])
	undo.append(_pretty(m.data))
	Engine.set_meta("edit_undo", undo)
	sel = {}
	_rebuild(redo.pop_back())


# --- the edits ----------------------------------------------------------------------------
func _duplicate() -> void:
	var e = _entry(sel)
	if e == null:
		return
	_commit(func():
		var c: Dictionary = e.duplicate(true)
		c.at = [_r(c.at[0] + 1.0), _r(c.at[1] + 1.0)]
		var list: Array = m.data[sel.list]
		list.append(c)
		sel = {"list": sel.list, "i": list.size() - 1})


func _delete() -> void:
	var e = _entry(sel)
	if e == null:
		return
	_commit(func():
		(m.data[sel.list] as Array).remove_at(sel.i)
		sel = {})


func _flip() -> void:
	var e = _entry(sel)
	if e == null or e.get("kind", "") == "khata":
		return
	_commit(func():
		if e.get("flip", false):
			e.erase("flip")
		else:
			e["flip"] = true)


## a quarter-turn: a bench along the road instead of across it. Props
## (no footprint) just mirror, which at this camera is the same picture.
func _turn() -> void:
	var e = _entry(sel)
	if e == null or e.get("kind", "") == "khata":
		return
	_commit(func():
		var key := "flip" if sel.list == "props" else "turned"
		if e.get(key, false):
			e.erase(key)
		else:
			e[key] = true)


func _scale_sel(f: float) -> void:
	var e = _entry(sel)
	if e == null or e.get("kind", "") == "khata":
		return
	_commit(func():
		if sel.list == "props":
			e["metres"] = _r(float(e.get("metres", 1.0)) * f)
		else:
			e["scale"] = _r(float(e.get("scale", 1.0)) * f))


func _move(src: Dictionary, d: Vector2, free: bool) -> void:
	var e = _entry(src)
	if e == null:
		return
	_commit(func():
		var x: float = float(e.at[0]) + d.x
		var y: float = float(e.at[1]) + d.y
		if not free:
			x = roundf(x / GRID) * GRID
			y = roundf(y / GRID) * GRID
		e.at = [_r(x), _r(y)]
		sel = src)


func _place(at_m: Vector2) -> void:
	var tex: Texture2D = m._tex(place_file)
	if tex == null:
		return
	_commit(func():
		var list: Array = m.data.get("props", [])
		list.append({"file": place_file, "at": [_r(roundf(at_m.x / GRID) * GRID), _r(roundf(at_m.y / GRID) * GRID)],
			"metres": _r(tex.get_height() / PX_PER_M)})
		m.data["props"] = list
		sel = {"list": "props", "i": list.size() - 1})


func _discard() -> void:
	if FileAccess.file_exists(LOCAL):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(LOCAL))
	for k in ["edit_level", "edit_undo", "edit_redo", "edit_sel"]:
		if Engine.has_meta(k):
			Engine.remove_meta(k)
	Engine.set_meta("edit_view", {"pos": m.player.position, "zoom": m.cam.zoom})
	get_tree().reload_current_scene()


# --- saving --------------------------------------------------------------------------------
func _save() -> void:
	var text := _pretty(m.data)
	if OS.has_feature("editor"):
		var f := FileAccess.open(m.DATA, FileAccess.WRITE)
		if f != null:
			f.store_string(text)
			info.text = "Збережено у zalissya/maidan.json."
			return
	if OS.has_feature("web"):
		JavaScriptBridge.download_buffer(text.to_utf8_buffer(), "maidan.json", "application/json")
		info.text = "Завантажено maidan.json. Поклади його в issue або в zalissya/ і закоміть."
		return
	var f2 := FileAccess.open("user://maidan.json", FileAccess.WRITE)
	if f2 != null:
		f2.store_string(text)
	info.text = "Збережено: " + ProjectSettings.globalize_path("user://maidan.json")


func _copy() -> void:
	DisplayServer.clipboard_set(_pretty(m.data))
	info.text = "Скопійовано весь рівень (maidan.json) у буфер."


## maidan.json's own layout: one top-level key per line, each list of things
## one thing per line, numbers as short as they can be
func _pretty(d: Dictionary) -> String:
	var lines: PackedStringArray = []
	var keys := d.keys()
	for i in keys.size():
		var key = keys[i]
		var v = d[key]
		var s := "  %s: " % JSON.stringify(key)
		if v is Array and not v.is_empty() and v[0] is Dictionary:
			var items: PackedStringArray = []
			for it in v:
				items.append("    " + _compact(it))
			s += "[\n" + ",\n".join(items) + "\n  ]"
		else:
			s += _compact(v)
		lines.append(s + ("," if i < keys.size() - 1 else ""))
	return "{\n" + "\n".join(lines) + "\n}\n"


func _compact(v) -> String:
	if v is Dictionary:
		var parts: PackedStringArray = []
		for k in v:
			parts.append("%s: %s" % [JSON.stringify(k), _compact(v[k])])
		return "{" + ", ".join(parts) + "}"
	if v is Array:
		var parts: PackedStringArray = []
		for x in v:
			parts.append(_compact(x))
		return "[" + ", ".join(parts) + "]"
	if v is float or v is int:
		var f := float(v)
		if f == roundf(f) and absf(f) < 1e9:
			return str(int(f))
		return String.num(f, 3)
	return JSON.stringify(v)


func _r(x: float) -> float:
	return snappedf(x, 0.01)


# --- scene px ↔ metres ----------------------------------------------------------------------
func _metres(p: Vector2) -> Vector2:
	var t := Transform2D(m.east as Vector2, -(m.north as Vector2), Vector2.ZERO)
	return t.affine_inverse() * p


func _pick(p: Vector2) -> Dictionary:
	var best := {}
	var best_y := -INF
	for e in picks:
		var r: Rect2 = e.rect
		if not r.has_point(p):
			continue
		if not m._covers(e, p):
			continue
		var y: float = r.end.y
		if y > best_y:
			best_y = y
			best = e
	return best


# --- input ---------------------------------------------------------------------------------
func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo and event.physical_keycode == KEY_TAB:
		_set_on(not on)
		get_viewport().set_input_as_handled()
		return
	if not on:
		return
	if event is InputEventKey and event.pressed and not event.echo:
		var ctrl: bool = event.ctrl_pressed or event.meta_pressed
		match event.physical_keycode:
			KEY_Z when ctrl:
				if event.shift_pressed: _redo()
				else: _undo()
			KEY_Y when ctrl: _redo()
			KEY_D when ctrl: _duplicate()
			KEY_DELETE, KEY_BACKSPACE: _delete()
			KEY_F: _flip()
			KEY_R: _turn()
			KEY_BRACKETRIGHT: _scale_sel(1.1)
			KEY_BRACKETLEFT: _scale_sel(1.0 / 1.1)
			KEY_ESCAPE:
				place_file = ""
				sel = {}
				palette.deselect_all()
				_refresh()
	elif event is InputEventMouseButton:
		var p := get_global_mouse_position()
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			if place_file != "":
				_place(_metres(p))
				return
			var e := _pick(p)
			if e.is_empty():
				sel = {}
				pan = {"start": event.position, "from": m.player.position}
			else:
				sel = e.src
				drag = {"pick": e, "start": p, "moved": false}
			_refresh()
		elif event.button_index == MOUSE_BUTTON_RIGHT and event.pressed:
			pan = {"start": event.position, "from": m.player.position}
		elif not event.pressed and event.button_index in [MOUSE_BUTTON_LEFT, MOUSE_BUTTON_RIGHT]:
			if not drag.is_empty() and drag.moved:
				var d := _metres(p) - _metres(drag.start)
				var src: Dictionary = drag.pick.src
				drag = {}
				_move(src, d, Input.is_key_pressed(KEY_SHIFT))
				return
			drag = {}
			pan = {}
			queue_redraw()
	elif event is InputEventMouseMotion:
		if not drag.is_empty():
			if (get_global_mouse_position() - drag.start).length() > 4.0:
				drag.moved = true
			queue_redraw()
		elif not pan.is_empty():
			m.player.position = pan.from - (event.position - pan.start) / m.cam.zoom
		elif place_file != "":
			queue_redraw()


# --- drawing: the grid, the selection, the thing being dragged --------------------------------
func _process(_delta: float) -> void:
	if on:
		queue_redraw()


func _draw() -> void:
	if not on:
		return
	# a metre grid round where you look, brighter every 5 m
	var c: Vector2 = _metres(m.player.position)
	var cx := roundf(c.x)
	var cy := roundf(c.y)
	for i in range(-30, 31):
		var a := Color(1, 1, 0.6, 0.4 if (int(cx) + i) % 5 == 0 else 0.14)
		draw_line(m.P(cx + i, cy - 30), m.P(cx + i, cy + 30), a, 1)
		a = Color(1, 1, 0.6, 0.4 if (int(cy) + i) % 5 == 0 else 0.14)
		draw_line(m.P(cx - 30, cy + i), m.P(cx + 30, cy + i), a, 1)
	var e = null
	for p in picks:
		if p.src == sel:
			e = p
	if e != null:
		draw_rect(e.rect, Color(1, 0.85, 0.2), false, 2.0)
	if not drag.is_empty() and drag.moved:
		var d: Vector2 = get_global_mouse_position() - drag.start
		var pk: Dictionary = drag.pick
		var spr = pk.fade
		var r: Rect2 = pk.rect
		r.position += d
		if spr is Sprite2D and spr.texture != null:
			var tr := r
			if spr.flip_h:
				tr = Rect2(r.position.x + r.size.x, r.position.y, -r.size.x, r.size.y)
			draw_texture_rect(spr.texture, tr, false, Color(1, 1, 1, 0.6))
		draw_rect(r, Color(0.4, 0.9, 1), false, 2.0)
	if place_file != "":
		var tex: Texture2D = m._tex(place_file)
		if tex != null:
			var h: float = tex.get_height() / PX_PER_M * m.metre
			var w: float = tex.get_width() * h / tex.get_height()
			var at := get_global_mouse_position()
			draw_texture_rect(tex, Rect2(at - Vector2(w / 2.0, h), Vector2(w, h)), false, Color(1, 1, 1, 0.55))
