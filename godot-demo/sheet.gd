extends Node
## The character sheet (GAME_PLAN.md, B3, B4 and B12, a first piece of
## each): the 2D game's "Персонаж" and "Завдання" windows, its parchment
## look and its words, in four tabs:
##   · Характеристики: the six stats, each from the skill that feeds it plus
##     what lifts it (keepsakes, a meal, a tonic…), systems/stats.ts;
##   · Вміння: each skill's level and how far to the next, systems/skills.ts;
##   · Торба: what you carry and its weight against 6 + 2×STR, systems/carry.ts;
##   · Завдання: what is done and what is next.
## Everything is read from the save (game_state.gd); nothing is stored here.
## Opened by the HUD's two buttons, C (character), J (quests), or a gamepad's
## Start / Back; closed by Esc, B or the cross.

const THRESH := [0, 3, 7, 12, 18, 25, 34]        # Herbalism (skills.ts)
const FISH_THRESH := [0, 2, 5, 9, 14, 20]        # Fishing
const CRAFT_THRESH := [0, 2, 5, 9, 14, 20]       # Cooking, Smithing, Alchemy, Music
const CARPENTRY_THRESH := [0, 5, 12, 22, 36]     # Carpentry
const UNIT_WEIGHT := {"fish": 1, "herbStock": 1, "iron": 3, "forged": 2}   # carry.ts
const STATS := ["str", "dex", "con", "int", "wis", "cha"]

var m: Node2D
var hud: Node
var state: Node
var ui: CanvasLayer
var panel: PanelContainer
var title_l: Label
var body: VBoxContainer
var tabs: Array[Button] = []
var tab := "stats"
var buttons: HBoxContainer


func setup(maidan: Node2D, the_hud: Node, the_state: Node) -> void:
	m = maidan
	hud = the_hud
	state = the_state
	ui = CanvasLayer.new()
	ui.layer = 8
	add_child(ui)
	_build_buttons()
	_build_panel()


func t(key: String, params := {}) -> String:
	return hud.t(key, params)


## the font has no emoji: words only (the 2D game's labels carry a few)
func _plain(s: String) -> String:
	var out := ""
	for c in s:
		if c.unicode_at(0) < 0x2190:
			out += c
	return out.strip_edges()


# --- the numbers, as the 2D game derives them -----------------------------------------
func _lvl(table: Array, done: int) -> int:
	var lvl := 1
	for i in table.size():
		if done >= table[i]:
			lvl = i + 1
	return lvl


func _skills() -> Array:
	var herbs := int(state.data.herbs)
	var rows := [
		["ui.skillRows.name.0", THRESH, herbs, "ui.skillRows.stat.0"],
		["ui.skillRows.name.1", FISH_THRESH, state.count("fishTotal"), "ui.skillRows.stat.1"],
		["ui.skillRows.name.2", CRAFT_THRESH, state.count("cooked"), "ui.skillRows.stat.2"],
		["ui.skillRows.name.3", CRAFT_THRESH, state.count("smithed"), "ui.skillRows.stat.3"],
		["ui.skillRows.name.4", CRAFT_THRESH, state.count("brewed"), "ui.skillRows.stat.4"],
		["ui.skillRows.name.music", CRAFT_THRESH, state.count("played"), "ui.skillRows.stat.music"],
		["ui.skillRows.name.carpentry", CARPENTRY_THRESH, state.count("carpentry"), "ui.skillRows.stat.carpentry"],
	]
	var out := []
	for r in rows:
		var lvl := _lvl(r[1], r[2])
		out.append({"name": t(r[0]), "level": lvl, "done": r[2], "next": r[1][lvl] if lvl < r[1].size() else null, "stat": t(r[3])})
	return out


## stats.ts computeStats: base from the skills, plus what lifts it
func stats() -> Dictionary:
	var base := {
		"str": _lvl(CRAFT_THRESH, state.count("smithed")) + _lvl(CARPENTRY_THRESH, state.count("carpentry")) - 1,
		"dex": _lvl(FISH_THRESH, state.count("fishTotal")),
		"con": _lvl(CRAFT_THRESH, state.count("cooked")),
		"int": _lvl(CRAFT_THRESH, state.count("brewed")),
		"wis": _lvl(THRESH, int(state.data.herbs)),
		"cha": _lvl(CRAFT_THRESH, state.count("played")),
	}
	var bonus := {}
	var why := {}
	for k in STATS:
		bonus[k] = 0
		why[k] = []
	var give := func(k: String, n: int, label: String):
		bonus[k] += n
		why[k].append("%s %s%d" % [label, "+" if n > 0 else "", n])
	if state.has("horseshoe"): give.call("str", 1, t("stat.computeStats.0"))
	if state.has("pebble"): give.call("dex", 1, t("stat.computeStats.1"))
	if state.has("stone"): give.call("con", 1, t("stat.computeStats.2"))
	if state.has("wellfed"): give.call("con", 1, t("stat.computeStats.3"))
	if state.has("rested"): give.call("con", 1, t("stat.rested"))
	if state.has("bathed"): give.call("cha", 1, t("stat.bathed"))
	if state.has("tonic"):
		give.call("int", 1, t("stat.computeStats.4"))
		give.call("wis", 1, t("stat.computeStats.5"))
	if state.has("strongtonic"):
		give.call("int", 2, t("stat.computeStats.6"))
		give.call("wis", 2, t("stat.computeStats.7"))
	if state.has("gold"): give.call("cha", 2, t("stat.computeStats.8"))
	if state.has("moonstone"):
		give.call("wis", 1, t("stat.computeStats.9"))
		give.call("cha", 1, t("stat.computeStats.10"))
	if state.has("viySealed"):
		give.call("wis", 1, t("stat.computeStats.11"))
		give.call("cha", 1, t("stat.computeStats.12"))
	if state.has("soulsold") and not state.has("soulback"):
		give.call("wis", -1, t("stat.soulless"))
	var out := {}
	for k in STATS:
		out[k] = {"base": base[k], "bonus": bonus[k], "total": maxi(1, base[k] + bonus[k]), "why": why[k]}
	return out


func carried() -> int:
	var iron: int = 0 if state.has("horseshoe") else state.count("iron")
	return state.count("fish") * UNIT_WEIGHT.fish + state.count("herbStock") * UNIT_WEIGHT.herbStock \
		+ iron * UNIT_WEIGHT.iron + state.count("forged") * UNIT_WEIGHT.forged


func cap(s: Dictionary) -> int:
	return 6 + 2 * int(s.str.total)


# --- the window ------------------------------------------------------------------------------
func _parch(bg: Color, radius := 14) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.set_corner_radius_all(radius)
	sb.set_content_margin_all(12)
	return sb


func _btn(text: String, on: bool) -> Button:
	var b := Button.new()
	b.text = text
	b.focus_mode = Control.FOCUS_NONE
	var bg := Color(0.478, 0.29, 0.169) if on else Color(0.886, 0.827, 0.682)
	for st in ["normal", "hover", "pressed"]:
		b.add_theme_stylebox_override(st, _parch(bg.darkened(0.1 if st == "pressed" else 0.0), 8))
	b.add_theme_color_override("font_color", Color(0.953, 0.914, 0.824) if on else Color(0.36, 0.27, 0.19))
	b.add_theme_color_override("font_hover_color", Color(0.953, 0.914, 0.824) if on else Color(0.2, 0.14, 0.1))
	return b


## the HUD's two buttons, top right, as the 2D game has them
func _build_buttons() -> void:
	buttons = HBoxContainer.new()
	buttons.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	buttons.offset_left = -290
	buttons.offset_right = -12
	buttons.offset_top = 56
	buttons.alignment = BoxContainer.ALIGNMENT_END
	ui.add_child(buttons)
	for b in [["ui.misc.13", "stats"], ["ui.misc.15", "quests"]]:
		var btn := _btn(t(b[0]), true)
		btn.modulate.a = 0.92
		btn.pressed.connect(func(): open(b[1]))
		buttons.add_child(btn)


func _build_panel() -> void:
	panel = PanelContainer.new()
	var sb := _parch(Color(0.953, 0.914, 0.824), 18)
	sb.set_border_width_all(2)
	sb.border_color = Color(0.85, 0.77, 0.57)
	panel.add_theme_stylebox_override("panel", sb)
	panel.set_anchors_preset(Control.PRESET_CENTER)
	var vw := get_viewport().get_visible_rect().size
	var w := minf(560.0, vw.x - 24)
	var h := minf(620.0, vw.y - 40)
	panel.custom_minimum_size = Vector2(w, h)
	panel.offset_left = -w / 2.0
	panel.offset_top = -h / 2.0
	panel.offset_right = w / 2.0
	panel.offset_bottom = h / 2.0
	panel.visible = false
	ui.add_child(panel)
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 8)
	panel.add_child(col)
	var head := HBoxContainer.new()
	col.add_child(head)
	title_l = Label.new()
	title_l.add_theme_font_size_override("font_size", 22)
	title_l.add_theme_color_override("font_color", Color(0.2, 0.14, 0.1))
	title_l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(title_l)
	var close := _btn(t("ui.misc.71"), false)
	close.pressed.connect(close_sheet)
	head.add_child(close)
	var row := HBoxContainer.new()
	col.add_child(row)
	for tb in [["ui.misc.74", "stats"], ["ui.misc.76", "skills"], ["ui.tab.satchel", "satchel"], ["ui.misc.78", "quests"]]:
		var b := _btn(t(tb[0]), false)
		b.set_meta("tab", tb[1])
		b.set_meta("key", tb[0])
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.pressed.connect(func(): open(tb[1]))
		row.add_child(b)
		tabs.append(b)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	col.add_child(scroll)
	body = VBoxContainer.new()
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_theme_constant_override("separation", 6)
	scroll.add_child(body)


func is_open() -> bool:
	return panel.visible


func open(which: String) -> void:
	if m.editing or (m.fading and not panel.visible):
		return
	m.fading = true   # (he stands while the sheet is open; time stops too, hud.gd)
	tab = which
	panel.visible = true
	title_l.text = t("ui.quests") if tab == "quests" else t("ui.character")
	for b in tabs:
		var on: bool = b.get_meta("tab") == tab
		var fresh := _btn(t(b.get_meta("key")), on)
		for st in ["normal", "hover", "pressed"]:
			b.add_theme_stylebox_override(st, fresh.get_theme_stylebox(st))
		b.add_theme_color_override("font_color", fresh.get_theme_color("font_color"))
		fresh.free()
	_fill()


func close_sheet() -> void:
	if panel.visible:
		m.fading = false
	panel.visible = false


func _text(s: String, size := 15, col := Color(0.2, 0.14, 0.1), bold := false) -> Label:
	var l := Label.new()
	l.text = s
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	if bold:
		l.add_theme_constant_override("outline_size", 1)
		l.add_theme_color_override("font_outline_color", col)
	return l


func _card() -> VBoxContainer:
	var pc := PanelContainer.new()
	pc.add_theme_stylebox_override("panel", _parch(Color(0.906, 0.851, 0.725), 10))
	body.add_child(pc)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 2)
	pc.add_child(v)
	return v


func _fill() -> void:
	for c in body.get_children():
		c.queue_free()
	var st := stats()
	var dim := Color(0.36, 0.27, 0.19)
	match tab:
		"stats":
			for i in STATS.size():
				var s: Dictionary = st[STATS[i]]
				var v := _card()
				var top := "%s  %d   (%s)" % [t("stat.STAT_DEFS.name.%d" % i), s.total, t("stat.STAT_DEFS.abbr.%d" % i)]
				v.add_child(_text(top, 17, Color(0.2, 0.14, 0.1), true))
				v.add_child(_text(t("ui.stats.from", {"feeds": t("stat.STAT_DEFS.feeds.%d" % i)}), 13, dim))
				v.add_child(_text(t("stat.STAT_DEFS.effect.%d" % i), 13, dim))
				for w in s.why:
					v.add_child(_text(w, 13, Color(0.42, 0.25, 0.14)))
			var price := 2 if int(st.cha.total) >= 4 else 3
			body.add_child(_text(t("ui.stats.footer", {"price": price}), 13, dim))
		"skills":
			for r in _skills():
				var v := _card()
				v.add_child(_text("%s · %s   %s" % [r.name, t("ui.skills.level", {"level": r.level}), t("ui.skills.feeds", {"stat": r.stat})], 16, Color(0.2, 0.14, 0.1), true))
				var bar := ProgressBar.new()
				bar.show_percentage = false
				bar.custom_minimum_size = Vector2(0, 8)
				bar.max_value = 1.0
				bar.value = 1.0 if r.next == null else minf(1.0, float(r.done) / float(r.next))
				v.add_child(bar)
				var line: String = t("ui.misc.91", {"done": r.done}) if r.next == null else t("ui.misc.90", {"done": r.done, "next": r.next, "n": r.level + 1})
				v.add_child(_text(line, 13, dim))
		"satchel":
			var c := carried()
			var cp := cap(st)
			body.add_child(_text(t("ui.satchel.load", {"carried": c, "cap": cp}), 17, Color(0.2, 0.14, 0.1), true))
			body.add_child(_text(t("ui.satchel.limit", {"str": st.str.total}) + (t("ui.misc.104") if c > cp else ""), 13, dim))
			var groups := [
				["ui.satchel.group.gather", [["herbStock", "ui.satchel.item.herbStock"], ["lysaFlower", "ui.satchel.item.lysaFlower"]]],
				["ui.satchel.group.food", [["fish", "ui.satchel.item.fish"], ["meals", "ui.satchel.item.meals"], ["potions", "ui.satchel.item.potions"], ["strongPotions", "ui.satchel.item.strongPotions"]]],
				["ui.satchel.group.iron", [["iron", "ui.satchel.item.iron"], ["forged", "ui.satchel.item.forged"]]],
				["ui.satchel.group.purse", [["chervintsi", "ui.satchel.item.chervintsi"]]],
			]
			var any := false
			for g in groups:
				var rows := []
				for it in g[1]:
					var n: int = state.count(it[0])
					if n > 0:
						rows.append([it, n])
				if rows.is_empty():
					continue
				any = true
				body.add_child(_text(_plain(t(g[0])), 14, Color(0.48, 0.29, 0.17), true))
				for r in rows:
					var v := _card()
					v.add_child(_text("%s × %d" % [_plain(t(r[0][1])), r[1]], 16))
					var unit: int = UNIT_WEIGHT.get(r[0][0], 0)
					v.add_child(_text(t("ui.satchel.weightless") if unit == 0 else t("ui.satchel.rowWeight", {"unit": unit, "total": unit * r[1]}), 13, dim))
			if not any:
				body.add_child(_text(t("ui.satchel.load", {"carried": 0, "cap": cp}), 13, dim))
		"quests":
			var known := [
				["meet", "quest.meet.title.0", "quest.meet.0", {"metVillagers": hud._met()}],
				["herbs", "quest.herbs.title.0", "quest.herbs.0", {"min": mini(int(state.data.herbs), 5)}],
			]
			var done := 0
			for q in known:
				if state.has("found:" + q[0]):
					done += 1
			body.add_child(_text(t("ui.quests.intro", {"done": done, "total": known.size(), "now": t("ui.misc.83")}), 13, dim))
			var now := _card()
			now.add_child(_text(t("ui.misc.83"), 13, Color(0.48, 0.29, 0.17), true))
			now.add_child(_text(hud._objective(), 16, Color(0.2, 0.14, 0.1), true))
			for q in known:
				if not state.has("found:" + q[0]):
					continue   # (small khutir tasks are written down once done: quests.ts "secret")
				var v := _card()
				v.add_child(_text("%s · %s" % [t(q[1]), t("ui.misc.84")], 16, Color(0.2, 0.14, 0.1), true))
				v.add_child(_text(t(q[2], q[3]), 13, dim))
			body.add_child(_text(t("ui.quests.secret"), 13, dim))


func _unhandled_input(event: InputEvent) -> void:
	if m.editing or (m.fading and not panel.visible):
		return
	if event is InputEventKey and event.pressed and not event.echo:
		match event.physical_keycode:
			KEY_C:
				if panel.visible and tab != "quests": close_sheet()
				else: open("stats")
			KEY_J:
				if panel.visible and tab == "quests": close_sheet()
				else: open("quests")
			KEY_ESCAPE:
				if panel.visible:
					close_sheet()
					get_viewport().set_input_as_handled()
	elif event is InputEventJoypadButton and event.pressed:
		match event.button_index:
			JOY_BUTTON_START:
				if panel.visible: close_sheet()
				else: open("stats")
			JOY_BUTTON_BACK:
				if panel.visible: close_sheet()
				else: open("quests")
			JOY_BUTTON_B:
				if panel.visible:
					close_sheet()
					get_viewport().set_input_as_handled()


func _process(_d: float) -> void:
	buttons.visible = not m.editing and not (m.fading and not panel.visible)
