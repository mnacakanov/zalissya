extends Node2D
## The people of the maidan (zalissya/people.json): the otaman, Vesna, Radek
## and the Domovyk, standing where they would be (by day at their work, by
## night at home; the Domovyk in his nook by the pich at any hour), and
## talked to the 2D game's way: a greeting, then questions the player picks
## in any order, re-askable (the asked ones dimmed), until "Бувай".
##
## They don't walk yet (no animation, by the owner's word). Each is a still
## picture, styles/<style>/people/<id>.png when there is one (feet at the
## bottom centre, 88 px a metre like the huts), else a plain figure drawn in
## its colours, with its name over it.
##
## Kept in a script of its own, so the maidan's code and this can change
## side by side. The maidan makes it in _ready: people.setup(self).

const DATA := "res://zalissya/people.json"
const TALK_R := 1.8   # metres: near enough to talk

var m: Node2D                 # the maidan scene (maidan.gd)
var people: Array[Dictionary] = []
var by_house := {}            # building id -> its index in m.buildings
var was_night := false
var near := -1                # whom the kobzar stands by
var talking := -1
var met := {}                 # who has been met (the first greeting is said once)
var asked := {}               # "id/topic" asked already: marked ✓
var talk_btn: Button
var panel: PanelContainer
var who_l: Label
var text_l: Label
var choices: HFlowContainer
var pending: Array = []       # lines still to say in the answer now showing


func setup(maidan: Node2D) -> void:
	m = maidan
	for i in m.data.get("buildings", []).size():
		by_house[m.data.buildings[i].id] = i
	var d: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(DATA))
	for p in d.people:
		var node := _figure(p)
		m.world.add_child(node)
		people.append({"p": p, "node": node})
	_build_ui()
	was_night = m.night
	_place_all()


# --- the figures -----------------------------------------------------------------
func _figure(p: Dictionary) -> Node2D:
	var root := Node2D.new()
	var path := "res://styles/%s/people/%s.png" % [m.style, p.id]
	if ResourceLoader.exists(path):
		var spr: Sprite2D = m._sprite("people/" + p.id, m.k)
		root.add_child(spr)
	else:
		var fig := Figure.new()
		fig.h = float(p.height) * m.metre
		fig.col = Color(p.get("colour", "6a5a4a"))
		fig.small = float(p.height) < 1.2
		root.add_child(fig)
	var name_l: Label = m._label(p.name)
	name_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_l.custom_minimum_size = Vector2(240, 0)
	name_l.position = Vector2(-120, -float(p.height) * m.metre - 34)
	name_l.add_theme_font_size_override("font_size", 20)
	root.add_child(name_l)
	return root


## a plain stand-in figure till its picture comes: a long coat, a head, a hat
class Figure:
	extends Node2D
	var h := 150.0
	var col := Color(0.4, 0.35, 0.3)
	var small := false
	func _draw() -> void:
		var w := h * (0.36 if not small else 0.55)
		var head := h * 0.13
		var body_top := -h + head * 2.0
		# the coat, wider at the hem
		draw_colored_polygon(PackedVector2Array([Vector2(-w * 0.5, 0), Vector2(w * 0.5, 0), Vector2(w * 0.32, body_top), Vector2(-w * 0.32, body_top)]), col)
		draw_polyline(PackedVector2Array([Vector2(-w * 0.5, 0), Vector2(w * 0.5, 0), Vector2(w * 0.32, body_top), Vector2(-w * 0.32, body_top), Vector2(-w * 0.5, 0)]), Color(0.15, 0.1, 0.06), 2.0)
		# a sash
		draw_line(Vector2(-w * 0.4, body_top + h * 0.28), Vector2(w * 0.4, body_top + h * 0.28), col.lightened(0.35), 4.0)
		# the head; the Domovyk's beard down to the ground
		var hc := Vector2(0, body_top - head * 0.9)
		draw_circle(hc, head, Color(0.85, 0.72, 0.6))
		if small:
			draw_colored_polygon(PackedVector2Array([hc + Vector2(-head * 0.8, head * 0.3), hc + Vector2(head * 0.8, head * 0.3), Vector2(0, -h * 0.05)]), Color(0.86, 0.84, 0.8))
		# a hat
		draw_rect(Rect2(hc + Vector2(-head * 1.05, -head * 1.25), Vector2(head * 2.1, head * 0.7)), col.darkened(0.45))


# --- where they stand ------------------------------------------------------------------
func _place_all() -> void:
	for e in people:
		var p: Dictionary = e.p
		var w: Dictionary = p.night if m.night else p.day
		var pos: Vector2
		if w.get("near_pich", false) and by_house.has(w.house):
			var b: Dictionary = m.buildings[by_house[w.house]]
			var pich: Vector2 = b.get("pich", m._centroid(b.foot))
			pos = pich + (m._centroid(b.foot) - pich).normalized() * 1.0 * m.metre
		else:
			pos = m.P(w.at[0], w.at[1])
		e.node.position = pos
		e["house"] = by_house.get(w.get("house", ""), -1)


func _process(_delta: float) -> void:
	if m.night != was_night:
		was_night = m.night
		_place_all()
		_close()
	near = -1
	var best: float = TALK_R * m.metre
	for i in people.size():
		var e: Dictionary = people[i]
		# whoever is at home is seen only from inside, as the house's room is
		var vis := 1.0
		if e.house >= 0 and m.buildings[e.house].has("fade"):
			vis = 1.0 - m.buildings[e.house].fade.modulate.a
		e.node.modulate.a = vis
		var d: float = e.node.position.distance_to(m.player.position)
		if vis > 0.5 and d < best:
			best = d
			near = i
	talk_btn.visible = near >= 0 and talking < 0
	if near >= 0:
		talk_btn.text = "Говорити: " + people[near].p.name.split(",")[0]
	# walk away and the talk ends
	if talking >= 0 and people[talking].node.position.distance_to(m.player.position) > (TALK_R + 1.0) * m.metre:
		_close()


# --- talking ---------------------------------------------------------------------------
func _build_ui() -> void:
	var layer := CanvasLayer.new()
	layer.layer = 5
	add_child(layer)
	talk_btn = Button.new()
	talk_btn.visible = false
	talk_btn.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	talk_btn.position = Vector2(-110, -150)
	talk_btn.custom_minimum_size = Vector2(220, 52)
	talk_btn.focus_mode = Control.FOCUS_NONE
	talk_btn.pressed.connect(func(): _open(near))
	layer.add_child(talk_btn)
	panel = PanelContainer.new()
	panel.visible = false
	panel.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	var w := minf(760.0, get_viewport().get_visible_rect().size.x - 24)
	panel.custom_minimum_size = Vector2(w, 0)
	panel.position = Vector2(-w / 2.0, -330)
	var box := VBoxContainer.new()
	panel.add_child(box)
	who_l = Label.new()
	who_l.add_theme_color_override("font_color", Color(0.95, 0.82, 0.5))
	box.add_child(who_l)
	text_l = Label.new()
	text_l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	text_l.custom_minimum_size = Vector2(w - 24, 0)
	box.add_child(text_l)
	choices = HFlowContainer.new()
	choices.custom_minimum_size = Vector2(w - 24, 0)
	box.add_child(choices)
	layer.add_child(panel)


func _unhandled_input(event: InputEvent) -> void:
	var talk_key: bool = event is InputEventKey and event.pressed and not event.echo and event.physical_keycode in [KEY_E, KEY_T]
	var talk_pad: bool = event is InputEventJoypadButton and event.pressed and event.button_index == JOY_BUTTON_A
	var back: bool = (event is InputEventKey and event.pressed and event.physical_keycode == KEY_ESCAPE) \
		or (event is InputEventJoypadButton and event.pressed and event.button_index == JOY_BUTTON_B)
	if talking < 0 and near >= 0 and (talk_key or talk_pad):
		_open(near)
		get_viewport().set_input_as_handled()
	elif talking >= 0 and back:
		_close()
		get_viewport().set_input_as_handled()


func _open(i: int) -> void:
	if i < 0:
		return
	talking = i
	var p: Dictionary = people[i].p
	who_l.text = p.name
	var first: bool = not met.has(p.id)
	met[p.id] = true
	pending = (p.first if first else p.again).duplicate()
	panel.visible = true
	_next()


## say the next pending line, with "Далі" while more follow; then the menu
func _next() -> void:
	if pending.is_empty():
		_menu()
		return
	text_l.text = pending.pop_front()
	_clear_choices()
	if pending.is_empty():
		_menu_buttons()
	else:
		_button("Далі…", _next)


func _menu() -> void:
	_clear_choices()
	_menu_buttons()


func _menu_buttons() -> void:
	var p: Dictionary = people[talking].p
	for ti in p.topics.size():
		var tp: Dictionary = p.topics[ti]
		var key: String = "%s/%d" % [p.id, ti]
		_button(tp.question, func(): _ask(ti))
		if asked.has(key):   # asked already: dimmed (the font has no ✓)
			choices.get_child(choices.get_child_count() - 1).modulate = Color(1, 1, 1, 0.6)
	_button("Бувай", _close)


func _ask(ti: int) -> void:
	var p: Dictionary = people[talking].p
	asked["%s/%d" % [p.id, ti]] = true
	pending = p.topics[ti].lines.duplicate()
	_next()


func _button(text: String, cb: Callable) -> void:
	var b := Button.new()
	b.text = text
	b.pressed.connect(cb)
	choices.add_child(b)
	if choices.get_child_count() == 1:
		# (for the keyboard and the gamepad: the first choice takes the focus)
		(func(): if is_instance_valid(b) and b.is_inside_tree(): b.grab_focus()).call_deferred()


func _clear_choices() -> void:
	for c in choices.get_children():
		choices.remove_child(c)
		c.queue_free()


func _close() -> void:
	talking = -1
	pending = []
	panel.visible = false
	_clear_choices()
