extends Node
## The game's HUD on the maidan, the 2D game's own look and words
## (GAME_PLAN.md, B1, B2 and B12, a first piece of each):
##   · a title card: "Залісся · Козацька казка", "Іти на хутір", the language;
##   · top left, a dark card: where you are and the time of day, and under it
##     the one current objective (as the 2D game's HUD: client/src/App.tsx);
##   · a clock: a day passes in about ten minutes (400 ms a game minute), and
##     night falls and lifts by it (the maidan's own lighting). The "День /
##     ніч" button still works: it moves the clock to evening or morning;
##   · "✦ Знайдено" when a step is done.
##
## All its words come from the 2D game's locales (locales/uk.json, en.json,
## copied by tools/sync_locales.py); nothing here is hand-written text.
## For now it knows one quest, "meet the khutir" (talk to the otaman, Vesna
## and Radek), read from people.gd; the quest system proper comes next.
## The day, the clock and whom you have met are kept in the save
## (game_state.gd), so a reload goes on where you were.
## Kept in a script of its own beside maidan.gd; the maidan makes it.

const MS_PER_MINUTE := 400.0      # client/src/systems/time.ts: MS_PER_GAME_MINUTE
const START_MINUTE := 8 * 60
const DAWN := 6 * 60
const DUSK := 20 * 60
const NIGHT_FROM := 21 * 60
const NIGHT_UNTIL := 4 * 60
const MEET := ["myroslav", "vesna", "radek"]   # quest "meet": the three villagers

var m: Node2D
var people: Node
var state: Node                   # game_state.gd: flags, talked, the save
var lang := "uk"
var words := {}
var ui: CanvasLayer
var card: PanelContainer
var place_l: Label
var obj_l: Label
var toast: Label
var title_card: Control
var clock_ms := 0.0
var day := 1
var minute := START_MINUTE
var night_by_clock := false
var met_done := false


# --- words ------------------------------------------------------------------------------
func t(key: String, params := {}) -> String:
	var s: String = words.get(key, key)
	for k in params:
		s = s.replace("{%s}" % k, str(params[k]))
	return s


func _load_words(l: String) -> void:
	var path := "res://locales/%s.json" % l
	if not FileAccess.file_exists(path):
		path = "res://locales/uk.json"
	words = JSON.parse_string(FileAccess.get_file_as_string(path))
	lang = l


# --- setting up ---------------------------------------------------------------------------
func setup(maidan: Node2D, the_people: Node, the_state: Node) -> void:
	m = maidan
	people = the_people
	state = the_state
	_load_words(Engine.get_meta("lang", "uk"))
	day = state.count("day", 1)
	minute = state.count("clock", START_MINUTE)
	met_done = state.has("found:meet")
	# whom he has met, back from the save (the first greeting is said once)
	if people != null:
		for id in state.data.talked:
			people.met[id] = true
	# where he stood (unless the level editor has just rebuilt the scene)
	if not Engine.has_meta("edit_view"):
		m.player.position = m.P(float(state.data.x), float(state.data.y))
		m.cam.reset_smoothing()
	ui = CanvasLayer.new()
	ui.layer = 5
	add_child(ui)
	_build_card()
	_build_toast()
	night_by_clock = _is_night(minute)
	m._set_night(night_by_clock)
	# the title card once a session (not after the level editor's rebuilds)
	if not Engine.get_meta("started", false) and not Engine.has_meta("edit_level"):
		_build_title()
	_refresh()


func _style(bg: Color, border := Color(0, 0, 0, 0), radius := 12) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.set_corner_radius_all(radius)
	sb.set_content_margin_all(10)
	sb.content_margin_left = 14
	sb.content_margin_right = 14
	if border.a > 0:
		sb.set_border_width_all(2)
		sb.border_color = border
	return sb


func _build_card() -> void:
	card = PanelContainer.new()
	card.add_theme_stylebox_override("panel", _style(Color(0.11, 0.08, 0.035, 0.62)))
	card.position = Vector2(12, 56)
	card.custom_minimum_size = Vector2(260, 0)
	card.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.add_child(card)
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 2)
	card.add_child(col)
	place_l = Label.new()
	place_l.add_theme_color_override("font_color", Color(0.8, 0.7, 0.48))
	place_l.add_theme_font_size_override("font_size", 13)
	col.add_child(place_l)
	obj_l = Label.new()
	obj_l.add_theme_color_override("font_color", Color(0.95, 0.91, 0.82))
	obj_l.add_theme_font_size_override("font_size", 17)
	obj_l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	obj_l.custom_minimum_size = Vector2(240, 0)
	col.add_child(obj_l)


func _build_toast() -> void:
	toast = Label.new()
	toast.add_theme_color_override("font_color", Color(0.95, 0.91, 0.82))
	toast.add_theme_font_size_override("font_size", 18)
	toast.add_theme_stylebox_override("normal", _style(Color(0.48, 0.29, 0.17, 0.92)))
	toast.set_anchors_preset(Control.PRESET_CENTER_TOP)
	toast.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	toast.offset_left = -220
	toast.offset_right = 220
	toast.offset_top = 120
	toast.modulate.a = 0.0
	ui.add_child(toast)


func _build_title() -> void:
	title_card = ColorRect.new()
	(title_card as ColorRect).color = Color(0.086, 0.157, 0.102, 0.72)
	title_card.set_anchors_preset(Control.PRESET_FULL_RECT)
	ui.add_child(title_card)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	title_card.add_child(center)
	var box := PanelContainer.new()
	box.add_theme_stylebox_override("panel", _style(Color(0.953, 0.914, 0.824), Color(0.85, 0.77, 0.57, 0.5), 18))
	box.custom_minimum_size = Vector2(300, 0)
	center.add_child(box)
	var col := VBoxContainer.new()
	col.alignment = BoxContainer.ALIGNMENT_CENTER
	col.add_theme_constant_override("separation", 10)
	box.add_child(col)
	var h := Label.new()
	h.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	h.add_theme_font_size_override("font_size", 40)
	h.add_theme_color_override("font_color", Color(0.2, 0.14, 0.1))
	col.add_child(h)
	var sub := Label.new()
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sub.add_theme_color_override("font_color", Color(0.36, 0.27, 0.19))
	col.add_child(sub)
	var go := Button.new()
	go.custom_minimum_size = Vector2(0, 48)
	go.add_theme_font_size_override("font_size", 18)
	var bs := _style(Color(0.478, 0.29, 0.169), Color(0, 0, 0, 0), 12)
	go.add_theme_stylebox_override("normal", bs)
	go.add_theme_stylebox_override("hover", _style(Color(0.42, 0.25, 0.14)))
	go.add_theme_stylebox_override("pressed", _style(Color(0.365, 0.227, 0.122)))
	go.add_theme_color_override("font_color", Color(0.953, 0.914, 0.824))
	go.pressed.connect(_start)
	col.add_child(go)
	# with a save: "Продовжити", and a quieter "Нова гра" under it
	var fresh: Button = null
	if state.exists():
		fresh = Button.new()
		fresh.flat = true
		fresh.add_theme_color_override("font_color", Color(0.48, 0.29, 0.17))
		fresh.pressed.connect(func(): state.new_game())
		col.add_child(fresh)
	title_parts = [h, sub, go, fresh]
	var langs := HBoxContainer.new()
	langs.alignment = BoxContainer.ALIGNMENT_CENTER
	col.add_child(langs)
	# (each language by its own name, as the 2D game's picker shows them)
	for l in [["uk", "Українська"], ["en", "English"]]:
		var lb := Button.new()
		lb.text = l[1]
		lb.flat = true
		lb.add_theme_color_override("font_color", Color(0.36, 0.27, 0.19))
		lb.pressed.connect(func():
			_load_words(l[0])
			Engine.set_meta("lang", l[0])
			_fill_title()
			_refresh())
		langs.add_child(lb)
	_fill_title()
	m.fading = true   # (he waits on the title card)
	go.grab_focus()


var title_parts: Array = []
func _fill_title() -> void:
	title_parts[0].text = t("ui.misc.1")
	title_parts[1].text = t("ui.misc.2")
	title_parts[2].text = t("ui.continue") if state.exists() else t("ui.misc.4")
	if title_parts[3] != null:
		title_parts[3].text = t("ui.misc.21")


func _start() -> void:
	Engine.set_meta("started", true)
	state.save_now()
	m.fading = false
	title_card.queue_free()
	title_card = null


# --- the clock ------------------------------------------------------------------------------
func _is_night(mi: int) -> bool:
	return mi >= NIGHT_FROM or mi < NIGHT_UNTIL


func _process(delta: float) -> void:
	if title_card != null:
		return
	# time stops while editing and while talking (as in the 2D game)
	var stopped: bool = m.editing or (people != null and people.talking >= 0)
	if not stopped:
		clock_ms += delta * 1000.0
		while clock_ms >= MS_PER_MINUTE:
			clock_ms -= MS_PER_MINUTE
			minute += 1
			if minute >= 24 * 60:
				minute = 0
				day += 1
				state.set_count("day", day)
			state.set_count("clock", minute)
	# the "День / ніч" button (or N) turned the light by hand: the clock follows
	if m.night != night_by_clock:
		minute = NIGHT_FROM + 10 if m.night else START_MINUTE
		night_by_clock = m.night
	elif _is_night(minute) != night_by_clock:
		night_by_clock = _is_night(minute)
		m._set_night(night_by_clock)
	state.set_count("clock", minute)
	state.set_count("day", day)
	if people != null:
		for id in people.met:
			state.add_talked(id)
	_check_quests()
	_refresh()
	if toast.modulate.a > 0.0:
		toast.modulate.a = maxf(0.0, toast.modulate.a - delta * 0.25)


func _time_label() -> String:
	return t("time.timeLabel.0", {"day": day, "hh": "%02d" % (minute / 60), "mm": "%02d" % (minute % 60), "icon": ""}).strip_edges()


# --- the objective ------------------------------------------------------------------------
func _met() -> int:
	var n := 0
	if people != null:
		for id in MEET:
			if people.met.has(id):
				n += 1
	return n


func _check_quests() -> void:
	if not met_done and _met() >= MEET.size():
		met_done = true
		state.add("found:meet")
		toast.text = t("ui.quests.found", {"title": t("quest.meet.title.0")})
		toast.modulate.a = 1.0


func _objective() -> String:
	if not met_done:
		return t("quest.meet.1", {"metVillagers": _met()})
	return t("quest.herbs.1", {"min": 0})


func _refresh() -> void:
	var where: String = t("ui.zalissya")
	if m.inside_of >= 0 and m.inside_of < m.buildings.size():
		var b: Dictionary = m.buildings[m.inside_of]
		if b.has("src"):
			where = m.data.buildings[b.src.i].get("name", where)
	place_l.text = "%s   %s" % [where.to_upper(), _time_label()]
	obj_l.text = _objective()
	card.visible = not m.editing
