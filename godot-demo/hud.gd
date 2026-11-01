extends Node
## The game's HUD on the maidan, the 2D game's own look and words
## (GAME_PLAN.md, B1, B2 and B12, a first piece of each):
##   · a title card: "Залісся · Козацька казка", "Іти на хутір", the language;
##   · top left, a dark card: where you are and the time of day, and under it
##     the one current objective (as the 2D game's HUD: client/src/App.tsx);
##   · a clock: a day passes in about ten minutes (400 ms a game minute), and
##     night falls and lifts by it (the maidan's own lighting). The
##     developer's "День / ніч" (?edit) moves it on to evening or morning;
##   · "✦ Знайдено" when a step is done.
##
## All its words come from the 2D game's locales (locales/uk.json, en.json,
## copied by tools/sync_locales.py); nothing here is hand-written text.
## For now it knows one quest, "meet the khutir" (talk to the otaman, Vesna
## and Radek), read from people.gd; the quest system proper comes next.
## The day, the clock and whom you have met are kept in the save
## (game_state.gd), so a reload goes on where you were.
## Kept in a script of its own beside maidan.gd; the maidan makes it.

const UI := preload("res://ui_kit.gd")   # the parchment look, plain()
const MS_PER_MINUTE := 400.0      # client/src/systems/time.ts: MS_PER_GAME_MINUTE
const START_MINUTE := 8 * 60
const NIGHT_FROM := 21 * 60
const NIGHT_UNTIL := 4 * 60
const MEET := ["myroslav", "vesna", "radek"]   # quest "meet": the three villagers

var m: Node2D
var people: Node
var state: Node                   # game_state.gd: flags, talked, the save
var sheet: Node                   # sheet.gd: the character sheet (time stops while it is open)
var evening: Node                 # evening.gd: the kobza at the fire (songs to learn)
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
var since_look := 0.0             # seconds since the save, the quests and the card were looked at


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
	# and the few words only the Godot game says (locales/godot/)
	var own := "res://locales/godot/%s.json" % l
	if FileAccess.file_exists(own):
		words.merge(JSON.parse_string(FileAccess.get_file_as_string(own)), true)
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
		people.hooks = self
		people.retext()
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
	var sb := UI.box(bg, radius, 10, border)
	sb.content_margin_left = 14   # (the HUD card and the toast: a little wider than tall)
	sb.content_margin_right = 14
	return sb


func _build_card() -> void:
	card = PanelContainer.new()
	card.add_theme_stylebox_override("panel", _style(Color(0.11, 0.08, 0.035, 0.62)))
	card.position = Vector2(12, m.ui_top)
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
	toast.offset_left = -280
	toast.offset_right = 280
	toast.offset_top = 120
	toast.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART   # (the work's toasts run long)
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
			if people != null:
				people.retext()
			_fill_title()
			_refresh())
		langs.add_child(lb)
	_fill_title()
	m.pause("title")   # (he waits on the title card)
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
	m.resume("title")
	title_card.queue_free()
	title_card = null


# --- the clock ------------------------------------------------------------------------------
func _is_night(mi: int) -> bool:
	return mi >= NIGHT_FROM or mi < NIGHT_UNTIL


func _process(delta: float) -> void:
	if title_card != null:
		return
	# time stops while editing, talking, or with any window open: the sheet,
	# the map, the song menu, work's questions all set m.fading (as the 2D
	# game stops it in dialogue and sheets)
	var stopped: bool = m.editing or m.fading or (people != null and people.talking >= 0)
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
	# the developer's "День / ніч" (or N) turned the light by hand: the clock
	# goes forward to that evening, or to the next morning (never back)
	if m.night != night_by_clock:
		if m.night:
			minute = NIGHT_FROM + 10
		else:
			if minute >= NIGHT_FROM:
				day += 1
			minute = START_MINUTE
		night_by_clock = m.night
	elif _is_night(minute) != night_by_clock:
		night_by_clock = _is_night(minute)
		m._set_night(night_by_clock)
	# (on a phone the toast sits under the HUD card and its buttons)
	if m.portrait():
		toast.offset_top = card.position.y + card.size.y + 60.0
		toast.offset_left = -get_viewport().get_visible_rect().size.x / 2.0 + 12.0
		toast.offset_right = -toast.offset_left
		toast.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	else:   # (turned back to a wide screen: the toast's own place, under the top edge)
		toast.offset_left = -280
		toast.offset_right = 280
		toast.offset_top = 120
	if toast.modulate.a > 0.0:
		toast.modulate.a = maxf(0.0, toast.modulate.a - delta * 0.25)
	# the save, the quests and the card, five times a second rather than
	# every frame (a game minute is 0.4 s; nothing here needs it sooner)
	since_look += delta
	if since_look < 0.2:
		return
	since_look = 0.0
	state.set_count("clock", minute)
	state.set_count("day", day)
	if people != null:
		for id in people.met:
			state.add_talked(id)
	_check_quests()
	_refresh()


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


# --- what the people say, by the game's state (people.gd asks) -------------------------
## a greeting in place of people.json's "again"
func greeting(id: String) -> Array:
	if id == "vesna" and int(state.data.herbs) >= 5:
		return [t("topic.vesna.2")]
	return []


## topics the game's state opens: {question, run} (run gives the lines)
func extra_topics(id: String) -> Array:
	var out := []
	if id == "vesna" and not state.has("herbsGiven") and int(state.data.herbs) >= 5 and state.count("herbStock") >= 5:
		out.append({"question": t("topic.vesna.give.question"), "run": func() -> Array:
			state.set_count("herbStock", state.count("herbStock") - 5)
			state.add("herbsGiven")
			return [t("line.vesna.0"), t("topic.vesna.give.thanks"), t("line.vesna.2")]})
	if evening != null:
		out.append_array(evening.teach_topic(id))
	return out


func show_toast(text: String) -> void:
	toast.text = text
	toast.modulate.a = 1.0


func _found(id: String, title_key: String) -> void:
	state.add("found:" + id)
	show_toast(t("ui.quests.found", {"title": t(title_key)}))


func _check_quests() -> void:
	if not met_done and _met() >= MEET.size():
		met_done = true
		_found("meet", "quest.meet.title.0")
	if not state.has("found:herbs") and state.has("herbsGiven"):
		_found("herbs", "quest.herbs.title.0")
	if not state.has("found:evening") and state.count("played") >= 1:
		_found("evening", "quest.evening.title")


## the current objective, in the 2D game's order (quests.ts PRIORITY):
## meet the khutir, Vesna's herbs, then the first evening at the fire
func _objective() -> String:
	if not met_done:
		return t("quest.meet.1", {"metVillagers": _met()})
	if not state.has("found:herbs"):
		# five picked: take them to Vesna (she says the rest)
		if int(state.data.herbs) >= 5:
			return t("quest.herbs.bring", {"min": mini(state.count("herbStock"), 5)})
		return t("quest.herbs.1", {"min": mini(int(state.data.herbs), 5)})
	if not state.has("found:evening"):
		return t("quest.evening.now") if evening != null and evening.is_evening(minute) else t("quest.evening.wait")
	return t("quest.spirits.1", {"metSpirits": int(people != null and people.met.has("domovyk")) + int(people != null and people.met.has("lisovyk"))})


## where he is: the khutir, or the house he stands in (ui.hut.<id>)
func _where() -> String:
	if m.inside_of < 0 or m.inside_of >= m.buildings.size():
		return t("ui.zalissya")
	var b: Dictionary = m.buildings[m.inside_of]
	var id := "lyokh" if b.get("underground", false) else ""
	if b.has("src"):
		id = m.data.buildings[b.src.i].get("id", "")
	var key := "ui.hut." + id
	return UI.plain(t(key)) if words.has(key) else t("ui.zalissya")


func _refresh() -> void:
	var where := _where()
	place_l.text = "%s   %s" % [where.to_upper(), _time_label()]
	obj_l.text = _objective()
	card.visible = not m.editing
