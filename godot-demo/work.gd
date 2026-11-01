extends Node
## The khutir's work (GAME_PLAN.md, B7 and B8, a first piece): what the 2D
## game lets the kobzar do with his hands (client/src/App.tsx doInteract),
## each growing its skill and through it a stat (systems/skills.ts, stats.ts):
##   · fishing from the end of the kladka: cast, wait for the float to dip,
##     strike in the bite window (longer with DEX); karas, perch, roach, tench,
##     a pike now and then, and the pond's old boot (Fishing → DEX);
##   · cooking at the vatra: a fish and a herb make a bowl of kulish
##     (Cooking → CON), when the evening's song isn't asked for;
##   · smithing in Radek's kuznia: a horseshoe off the anvil, a second one now
##     and then for a strong arm (Smithing → STR);
##   · brewing at Vesna's drying rack: 2 herbs a tonic, 3 the strong one once
##     INT is 3 (Alchemy → INT);
##   · bathing from the pond's bank: fresh until dawn (CHA +1);
##   · a wish at the krynytsia: the well's lucky pebble for a warm tongue (CHA).
## Eating and drinking are in the sheet's satchel (sheet.gd asks use()).
## The meal, the tonics and the bath end at dawn (time.ts UNTIL_DAWN_FLAGS).
## All the words are the 2D game's.

const UI := preload("res://ui_kit.gd")   # the parchment look, plain()
const Rules := preload("res://rules.gd")   # skill levels, stats, carry
const UNTIL_DAWN := ["wellfed", "tonic", "strongtonic", "rested", "bathed"]
const DAWN := 6 * 60
# items.ts FISH_CATCH: what bites, and how often (DEX tilts it)
const CATCH := [["karas", 34], ["perch", 24], ["roach", 20], ["tench", 12], ["boot", 6], ["pike", 4]]
const REACH := 1.6          # metres
const SMITH_REST := 7.0     # seconds between two heats

var m: Node2D
var hud: Node
var state: Node
var people: Node
var herbs: Node
var btn: Button
var ask_panel: PanelContainer
var ask_text: Label
var ask_row: VBoxContainer

var spots := {}             # kind -> where to stand (scene px)
var water_c := Vector2.ZERO # the pond (metres): centre and radii
var water_r := Vector2.ONE
var near := ""              # the work the kobzar stands by
var fishing := ""           # "", "wait", "bite"
var bite_at := 0.0
var bite_end := 0.0
var cast_from := Vector2.ZERO
var smith_ready := 0.0
var float_node: Node2D
var last_abs := -1          # the clock, in minutes since day 0 (for the dawn)


func setup(maidan: Node2D, the_hud: Node, the_state: Node, the_people: Node, the_herbs: Node) -> void:
	m = maidan
	hud = the_hud
	state = the_state
	people = the_people
	herbs = the_herbs
	var d: Dictionary = m.data
	for w in d.get("walks", []):
		if w.id == "kladka":
			# the plank end out over the water: the two points nearest the pond
			var pts: Array = w.points
			var a := Vector2(pts[2][0], pts[2][1])
			var b := Vector2(pts[3][0], pts[3][1])
			var tip := (a + b) / 2.0
			var shore := (Vector2(pts[0][0], pts[0][1]) + Vector2(pts[1][0], pts[1][1])) / 2.0
			var out := (tip - shore).normalized()
			spots["fish"] = m.P(tip.x - out.x * 0.5, tip.y - out.y * 0.5)
			spots["float"] = m.P(tip.x + out.x * 1.6, tip.y + out.y * 1.6)
	for a in d.get("areas", []):
		if a.get("solid", false):
			water_c = Vector2(a.center[0], a.center[1])
			water_r = Vector2(a.radius[0], a.radius[1])
	for b in d.get("buildings", []):
		match b.id:
			"sushka": spots["brew"] = m.P(b.at[0], b.at[1] + 0.8)
			"krynytsia": spots["wish"] = m.P(b.at[0], b.at[1] + 0.6)
	_build_ui()
	_build_float()


func t(key: String, params := {}) -> String:
	return hud.t(key, params)


func _toast(s: String) -> void:
	hud.show_toast(UI.plain(s))


func _stats() -> Dictionary:
	return Rules.stats(state, hud.t)


func _room_for(weight: int) -> bool:
	return Rules.carried(state) + weight <= Rules.cap(_stats())


# --- the window and the button -------------------------------------------------------
func _build_ui() -> void:
	var layer := CanvasLayer.new()
	layer.layer = 6
	add_child(layer)
	btn = Button.new()
	btn.visible = false
	btn.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	btn.position = Vector2(-120, -150)
	btn.custom_minimum_size = Vector2(240, 52)
	btn.focus_mode = Control.FOCUS_NONE
	btn.pressed.connect(func(): act(near))
	layer.add_child(btn)
	ask_panel = PanelContainer.new()
	ask_panel.visible = false
	ask_panel.add_theme_stylebox_override("panel", UI.window())
	layer.add_child(ask_panel)
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 10)
	ask_panel.add_child(col)
	ask_text = Label.new()
	ask_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	ask_text.add_theme_color_override("font_color", Color(0.2, 0.14, 0.1))
	col.add_child(ask_text)
	ask_row = VBoxContainer.new()   # (the choices one under another, as in a talk)
	ask_row.add_theme_constant_override("separation", 6)
	col.add_child(ask_row)


## a question with its choices (the brewing bench's two recipes)
func _ask(text: String, options: Array) -> void:
	for c in ask_row.get_children():
		ask_row.remove_child(c)
		c.queue_free()
	ask_text.text = UI.plain(text)
	for o in options:
		var b := UI.choice(UI.plain(o[0]))
		b.pressed.connect(func():
			_close_ask()
			o[1].call())
		ask_row.add_child(b)
	var vw := get_viewport().get_visible_rect().size
	var w := minf(560.0, vw.x - 24.0)
	ask_panel.custom_minimum_size = Vector2(w, 0)
	ask_text.custom_minimum_size = Vector2(w - 28.0, 0)
	ask_row.custom_minimum_size = Vector2(w - 28.0, 0)   # (wrapped choices measure their height by it)
	ask_panel.position = Vector2((vw.x - w) / 2.0, vw.y * 0.34)
	ask_panel.visible = true
	ask_panel.reset_size()
	(func(): if ask_panel.visible: ask_panel.reset_size()).call_deferred()
	m.pause("work")
	(func(): if ask_row.get_child_count() > 0 and ask_row.get_child(0).focus_mode != Control.FOCUS_NONE: ask_row.get_child(0).grab_focus()).call_deferred()


func _close_ask() -> void:
	ask_panel.visible = false
	m.resume("work")


## the float on the water: it bobs while he waits, and dives at a bite
func _build_float() -> void:
	if not spots.has("float"):
		return
	float_node = Node2D.new()
	float_node.position = spots.float
	float_node.visible = false
	var mm: float = m.metre
	float_node.draw.connect(func():
		var tt := Time.get_ticks_msec() * 0.001
		var bite := fishing == "bite"
		var dip := (0.12 + 0.05 * sin(tt * 20.0)) * mm if bite else 0.03 * mm * sin(tt * 2.2)
		# the rings it makes on the water
		for i in 2:
			var ph := fmod(tt * (1.6 if bite else 0.6) + i * 0.5, 1.0)
			float_node.draw_arc(Vector2.ZERO, (0.15 + ph * (0.6 if bite else 0.35)) * mm, 0, TAU, 28,
				Color(0.9, 0.95, 0.95, (1.0 - ph) * 0.6), 1.5)
		if not bite or sin(tt * 20.0) < 0.6:
			float_node.draw_circle(Vector2(0, dip - 0.08 * mm), 0.07 * mm, Color(0.85, 0.15, 0.1))
			float_node.draw_circle(Vector2(0, dip - 0.02 * mm), 0.06 * mm, Color(0.95, 0.93, 0.88))
		# the line, back to the rod over the plank end
		var rod: Vector2 = spots.fish - spots.float + Vector2(0, -1.4 * mm)
		float_node.draw_line(Vector2(0, dip - 0.14 * mm), rod, Color(0.15, 0.12, 0.1, 0.6), 1.0))
	m.world.add_child(float_node)
	float_node.z_index = 5


# --- what he is near ---------------------------------------------------------------------
func _metres(p: Vector2) -> Vector2:
	return m.M(p)


func _inside(id: String) -> bool:
	if m.inside_of < 0 or m.inside_of >= m.buildings.size():
		return false
	var b: Dictionary = m.buildings[m.inside_of]
	return b.has("src") and m.data.buildings[b.src.i].get("id", "") == id


## the work he stands by, and how near its spot is (scene px)
func _find_near() -> Array:
	var pp: Vector2 = m.player.position
	var r: float = REACH * m.metre
	if fishing != "":
		return ["reel" if fishing == "bite" else "waiting", 0.0]
	var cands := []
	if spots.has("fish"):
		cands.append(["cast", pp.distance_to(spots.fish), r])
	var anvil: Variant = _anvil()
	if anvil != null:
		cands.append(["smith", pp.distance_to(anvil), r])
	if spots.has("brew"):
		cands.append(["brew", pp.distance_to(spots.brew), r * 1.2])
	if spots.has("wish"):
		cands.append(["wish", pp.distance_to(spots.wish), r * 1.2])
	if hud.evening != null and not hud.evening.near:
		cands.append(["cook", pp.distance_to(hud.evening.fire_at), 2.6 * m.metre])
	var best := ["", INF]
	for c in cands:
		if c[1] < c[2] and c[1] < best[1]:
			best = [c[0], c[1]]
	if best[0] != "":
		return best
	# on the bank, just by the water (the pond's own oval, a little wider)
	var me := _metres(pp) - water_c
	var e := sqrt(pow(me.x / water_r.x, 2) + pow(me.y / water_r.y, 2))
	if e > 0.98 and e < 1.22:
		return ["bathe", 0.0]
	return ["", INF]


## Radek's anvil, before the horn (the hearth) in the kuznia: only from inside
func _anvil() -> Variant:
	if not _inside("kuznia"):
		return null
	var b: Dictionary = m.buildings[m.inside_of]
	var c: Vector2 = m._centroid(b.foot)
	var pich: Vector2 = b.get("pich", c)
	return pich + (c - pich).normalized() * 1.0 * m.metre


func _label(kind: String) -> String:
	match kind:
		"cast": return t("ui.promptLabel.5")
		"reel": return t("ui.promptLabel.6")
		"cook": return t("ui.promptLabel.11")
		"smith": return t("ui.promptLabel.12")
		"brew": return t("ui.promptLabel.13") if _stats().int.total >= 3 else t("ui.promptLabel.14")
		"wish": return t("ui.promptLabel.20")
		"bathe": return t("ui.promptLabel.bathe")
	return ""


# --- the work itself -----------------------------------------------------------------------
func act(kind: String) -> void:
	match kind:
		"cast": _cast()
		"reel": _reel()
		"cook": _cook()
		"smith": _smith()
		"brew": _brew()
		"wish": _wish()
		"bathe": _bathe()


func _now() -> float:
	return Time.get_ticks_msec() * 0.001


func _cast() -> void:
	fishing = "wait"
	bite_at = _now() + 2.2 + randf() * 3.8
	cast_from = m.player.position
	_toast(t("ui.cast.0"))


func _reel() -> void:
	fishing = ""
	var dex: int = _stats().dex.total
	# deft hands meet better fish: the pike and perch grow likelier with
	# every DEX point, and the pond's old boot grows shy
	var table := []
	var total := 0.0
	for c in CATCH:
		var w: float = c[1]
		if c[0] == "pike": w += (dex - 1) * 3
		elif c[0] == "perch": w += dex - 1
		elif c[0] == "boot": w = maxf(1.0, w - (dex - 1) * 1.5)
		table.append([c[0], w])
		total += w
	var roll := randf() * total
	var got: String = table[0][0]
	for c in table:
		roll -= c[1]
		if roll < 0.0:
			got = c[0]
			break
	var caught := t("item.%s.name.0" % got)
	if got == "boot":
		_toast(t("ui.doInteract.1"))
	elif not _room_for(1):
		var st := _stats()
		_toast(t("ui.doInteract.2", {"fish": caught, "carriedWeight": Rules.carried(state), "carryCap": Rules.cap(st), "str": st.str.total}))
	else:
		state.bump("fish")
		var n: int = state.bump("fishTotal")
		var lvl := Rules.level(Rules.FISH_THRESH, n)
		if lvl > Rules.level(Rules.FISH_THRESH, n - 1):
			_toast(t("ui.doInteract.3", {"caught": caught, "fishLevel": lvl, "total": _stats().dex.total}))
		else:
			_toast(t("ui.doInteract.4", {"caught": caught, "fishLevel": lvl, "total": n}))


func _cook() -> void:
	var fish: int = state.count("fish")
	var hb: int = state.count("herbStock")
	if fish < 1 or hb < 1:
		_toast(t("ui.cook.0" if fish < 1 and hb < 1 else ("ui.cook.1" if fish < 1 else "ui.cook.2")))
		return
	state.bump("fish", -1)
	state.bump("herbStock", -1)
	var before: int = state.count("cooked")
	var n: int = state.bump("cooked")
	state.bump("meals")
	if Rules.level(Rules.CRAFT_THRESH, n) > Rules.level(Rules.CRAFT_THRESH, before):
		_toast(t("ui.cook.3", {"craftLevel": Rules.level(Rules.CRAFT_THRESH, n), "con": _stats().con.total}))
	else:
		_toast(t("ui.cook.4", {"craftLevel": Rules.level(Rules.CRAFT_THRESH, n), "flagCount": state.count("meals")}))


func _smith() -> void:
	if _now() < smith_ready:
		_toast(t("ui.smith.1"))
		return
	# a horseshoe weighs 2, and the anvil only works for someone who can
	# carry the result (checked before the hammer lifts)
	if not _room_for(2):
		var st := _stats()
		_toast(t("ui.carryBlockedToast.0", {"carriedWeight": Rules.carried(state), "carryCap": Rules.cap(st), "addWeight": 2, "str": st.str.total}))
		return
	smith_ready = _now() + SMITH_REST
	var before: int = state.count("smithed")
	var n: int = state.bump("smithed")
	state.bump("forged")
	var str_now: int = _stats().str.total
	var master := randf() < (str_now - 1) * 0.1 and _room_for(2)
	if master:
		state.bump("forged")
	var lvl := Rules.level(Rules.CRAFT_THRESH, n)
	if lvl > Rules.level(Rules.CRAFT_THRESH, before):
		_toast(t("ui.smith.2", {"craftLevel": lvl, "str": _stats().str.total}))
	elif master:
		_toast(t("ui.smith.3", {"str": str_now, "craftLevel": lvl}))
	else:
		_toast(t("ui.smith.4", {"craftLevel": lvl, "flagCount": state.count("forged")}))


func _brew() -> void:
	var hb: int = state.count("herbStock")
	if hb < 2:
		_toast(t("ui.brew.0", {"herbsIn": hb}))
		return
	if _stats().int.total >= 3:
		_ask(t("topic.BREW_CHOICE_LINES.0"), [
			[t("ui.misc.55"), func(): _do_brew("base")],
			[t("ui.misc.57"), func(): _do_brew("strong")],
			[t("ui.misc.59"), func(): pass]])
		return
	_do_brew("base")


func _do_brew(recipe: String) -> void:
	var strong := recipe == "strong"
	var cost := 3 if strong else 2
	var hb: int = state.count("herbStock")
	if hb < cost:
		_toast(t("ui.performBrew.0" if strong else "ui.performBrew.1", {"herbsIn": hb}))
		return
	state.bump("herbStock", -cost)
	var before: int = state.count("brewed")
	var n: int = state.bump("brewed")
	var item := "strongPotions" if strong else "potions"
	state.bump(item)
	# a bright mind coaxes a second bottle out of the same batch
	var int_now: int = _stats().int.total
	var double := randf() < (int_now - 1) * 0.1
	if double:
		state.bump(item)
	var lvl := Rules.level(Rules.CRAFT_THRESH, n)
	if lvl > Rules.level(Rules.CRAFT_THRESH, before):
		_toast(t("ui.performBrew.2" if strong else "ui.performBrew.3", {"craftLevel": lvl, "int": _stats().int.total}))
	elif double:
		_toast(t("ui.performBrew.4" if strong else "ui.performBrew.5", {"intNow": int_now, "craftLevel": lvl}))
	else:
		_toast(t("ui.performBrew.6" if strong else "ui.performBrew.7", {"craftLevel": lvl, "stock": state.count(item)}))


func _wish() -> void:
	var lines := []
	for i in 10:
		var k := "item.WISH_LINES.%d" % i
		if t(k) != k:
			lines.append(k)
	var line: String = t(lines[randi() % lines.size()]) if not lines.is_empty() else ""
	if state.has("pebble"):
		_ask(line, [[t("ui.misc.71"), func(): pass]])
		return
	# the well's lucky pebble answers a CHA check; a miss costs nothing
	var cha: int = _stats().cha.total
	if randf() < 0.18 + (cha - 1) * 0.07:
		state.add("pebble")
		_ask(line + "\n\n" + t("ui.wish.0"), [[t("ui.misc.71"), func(): pass]])
	else:
		_ask(line + "\n\n" + t("ui.wish.1", {"cha": cha}), [[t("ui.misc.71"), func(): pass]])


func _bathe() -> void:
	var night: bool = m.night
	var fresh: bool = not state.has("bathed")
	state.add("bathed")
	_ask(t("pond.bathe.night" if night else ("pond.bathe.fresh" if fresh else "pond.bathe.again")),
		[[t("ui.promptLabel.shore"), func(): _toast(t("pond.shore"))]])


## the satchel's food and tonics (sheet.gd's buttons)
func use(item: String) -> void:
	match item:
		"meals":
			if state.count("meals") < 1: return
			state.bump("meals", -1)
			state.add("wellfed")
			_toast(t("ui.eatMeal.0"))
		"potions":
			if state.count("potions") < 1: return
			state.bump("potions", -1)
			state.add("tonic")
			_toast(t("ui.drinkTonic.0"))
		"strongPotions":
			if state.count("strongPotions") < 1: return
			state.bump("strongPotions", -1)
			state.add("strongtonic")
			_toast(t("ui.drinkStrongTonic.0"))


# --- each frame ------------------------------------------------------------------------------
func _process(_d: float) -> void:
	# the meal, the tonics and the bath end at dawn
	var abs_now: int = hud.day * 1440 + hud.minute
	if last_abs >= 0 and floori((abs_now - DAWN) / 1440.0) > floori((last_abs - DAWN) / 1440.0):
		for f in UNTIL_DAWN:
			if state.has(f):
				state.remove(f)
	last_abs = abs_now
	# the bite: it comes, and goes if he is slow
	if fishing == "wait" and _now() >= bite_at:
		fishing = "bite"
		bite_end = _now() + 1.1 + (_stats().dex.total - 1) * 0.12
	elif fishing == "bite" and _now() > bite_end:
		fishing = ""   # (the float comes up empty: he may cast again)
	# walking off the plank ends the fishing
	if fishing != "" and m.player.position.distance_to(cast_from) > 0.4 * m.metre:
		fishing = ""
	if ask_panel.visible:
		ask_panel.reset_size()   # (it fits what it says now, not the last, longer question)
	if float_node != null:
		float_node.visible = fishing != ""
		if fishing != "":
			float_node.queue_redraw()
	var busy: bool = m.editing or m.fading or ask_panel.visible \
		or (people != null and people.talking >= 0) or (herbs != null and herbs.near >= 0)
	var found: Array = ["", INF] if busy else _find_near()
	near = found[0]
	if people != null:
		# whoever stands nearer, the work or a person, gets the button
		people.yield_to = found[1] if near != "" else INF
		if people.near >= 0 and near != "" and near != "reel" and near != "waiting":
			var pd: float = people.people[people.near].node.position.distance_to(m.player.position)
			if pd <= found[1]:
				near = ""
	btn.visible = near != "" and near != "waiting"
	if btn.visible:
		btn.text = UI.plain(_label(near))


func _unhandled_input(event: InputEvent) -> void:
	if ask_panel.visible:
		var back: bool = (event is InputEventKey and event.pressed and event.physical_keycode == KEY_ESCAPE) \
			or (event is InputEventJoypadButton and event.pressed and event.button_index == JOY_BUTTON_B)
		if back:
			_close_ask()
			get_viewport().set_input_as_handled()
		return
	if near == "" or near == "waiting":
		return
	var key: bool = event is InputEventKey and event.pressed and not event.echo and event.physical_keycode in [KEY_E, KEY_T]
	var pad: bool = event is InputEventJoypadButton and event.pressed and event.button_index == JOY_BUTTON_A
	if key or pad:
		act(near)
		get_viewport().set_input_as_handled()
