extends Node
## The map (GAME_PLAN.md, B12, a piece): the 2D game's map overlay
## (client/src/ui/MapOverlay.tsx, render/map.ts) on parchment, drawn from
## maidan.json, so it grows with the world:
##   · the forests, the pond and its bank, the maidan, the roads and paths,
##     every building's footprint, the windmill's sails;
##   · a red dot where the kobzar stands, a gold star where the current
##     objective wants him (hud.gd's order: meet, herbs, the evening, spirits);
##   · two zooms: the whole world, or around me;
##   · M, gamepad Y or the HUD's "Мапа" button opens it; Esc, B or M again
##     closes it. Time stops while it is open (as the sheet).
## In the 2D game the map is an item (flag "map": the chumak map from Hnat,
## or the Chort's). Nobody here can hand it over yet, so NEEDS_ITEM is off
## until they can; then "map.none" says who has one.

const NEEDS_ITEM := false
const NEAR_SPAN := 70.0   # metres across, zoomed in

var m: Node2D
var hud: Node
var state: Node
var people: Node
var herbs: Node
var panel: PanelContainer
var canvas: Control
var title_l: Label
var zoom_btn: Button
var zoom := "world"
var map_btn: Button


func setup(maidan: Node2D, the_hud: Node, the_state: Node, the_people: Node, the_herbs: Node) -> void:
	m = maidan
	hud = the_hud
	state = the_state
	people = the_people
	herbs = the_herbs
	_build_ui()


## a point of the scene, back to metres on the ground
func metres(p: Vector2) -> Vector2:
	return m.M(p)


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


func _build_ui() -> void:
	var layer := CanvasLayer.new()
	layer.layer = 8
	add_child(layer)
	# the HUD's button, beside Персонаж and Завдання (sheet.gd)
	if hud.sheet != null and hud.sheet.buttons != null:
		map_btn = _btn(hud.t("map.button"), true)
		map_btn.modulate.a = 0.92
		map_btn.pressed.connect(toggle)
		hud.sheet.buttons.add_child(map_btn)
		hud.sheet.buttons.move_child(map_btn, 0)
	panel = PanelContainer.new()
	var sb := _parch(Color(0.953, 0.914, 0.824), 18)
	sb.set_border_width_all(2)
	sb.border_color = Color(0.85, 0.77, 0.57)
	panel.add_theme_stylebox_override("panel", sb)
	panel.visible = false
	layer.add_child(panel)
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 8)
	panel.add_child(col)
	var head := HBoxContainer.new()
	head.add_theme_constant_override("separation", 6)
	col.add_child(head)
	title_l = Label.new()
	title_l.add_theme_font_size_override("font_size", 22)
	title_l.add_theme_color_override("font_color", Color(0.2, 0.14, 0.1))
	title_l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title_l.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	title_l.clip_text = true
	head.add_child(title_l)
	zoom_btn = _btn("", false)
	zoom_btn.pressed.connect(func():
		zoom = "near" if zoom == "world" else "world"
		_refresh())
	head.add_child(zoom_btn)
	var close := _btn(hud.t("ui.misc.71"), false)
	close.pressed.connect(close_map)
	head.add_child(close)
	canvas = Control.new()
	canvas.size_flags_vertical = Control.SIZE_EXPAND_FILL
	canvas.clip_contents = true
	canvas.draw.connect(_draw_map)
	col.add_child(canvas)
	get_viewport().size_changed.connect(_layout)


func _layout() -> void:
	var vw := get_viewport().get_visible_rect().size
	var w := minf(760.0, vw.x - 24.0)
	var h := minf(640.0, vw.y - 40.0)
	panel.position = Vector2((vw.x - w) / 2.0, (vw.y - h) / 2.0)
	panel.custom_minimum_size = Vector2(w, h)
	panel.size = Vector2(w, h)


func _refresh() -> void:
	var key := "map.button"
	if state.has("map"):
		key = "map.title.chort" if state.has("mapChort") else "map.title.chumak"
	title_l.text = hud.t(key)
	# the button names the other view, the one it switches to
	zoom_btn.text = hud.t("map.zoom.near" if zoom == "world" else "map.zoom.world")
	canvas.queue_redraw()


func is_open() -> bool:
	return panel.visible


func toggle() -> void:
	if panel.visible:
		close_map()
	else:
		open_map()


func open_map() -> void:
	if m.editing or m.fading:
		return
	if NEEDS_ITEM and not state.has("map"):
		hud.show_toast(hud.t("map.none"))
		return
	_layout()
	_refresh()
	panel.visible = true
	m.fading = true   # (he stands, and time stops, while he reads it)


func close_map() -> void:
	if not panel.visible:
		return
	panel.visible = false
	m.fading = false


# --- where the objective leads (hud.gd's order) ----------------------------------------------
func _person_at(id: String) -> Variant:
	if people == null:
		return null
	for e in people.people:
		if e.p.id == id:
			return metres(e.node.position)
	return null


func _nearest(points: Array, from: Vector2) -> Variant:
	var best: Variant = null
	var bd := INF
	for p in points:
		if p == null:
			continue
		var d: float = from.distance_to(p)
		if d < bd:
			bd = d
			best = p
	return best


func target() -> Variant:
	var me := metres(m.player.position)
	if not hud.met_done:
		var unmet := []
		for id in hud.MEET:
			if not people.met.has(id):
				unmet.append(_person_at(id))
		return _nearest(unmet, me)
	if not state.has("found:herbs"):
		if int(state.data.herbs) >= 5:
			return _person_at("vesna")
		var spots := []
		if herbs != null:
			for s in herbs.spots:
				if s.regrow <= 0.0:
					spots.append(metres(s.at))
		return _nearest(spots, me)
	if not state.has("found:evening"):
		return metres(hud.evening.fire_at) if hud.evening != null else null
	var spirits := []
	for id in ["domovyk", "lisovyk"]:
		if not people.met.has(id):
			spirits.append(_person_at(id))
	return _nearest(spirits, me)


# --- the drawing -----------------------------------------------------------------------------
const INK := Color(0.29, 0.2, 0.13)
const PAPER := Color(0.93, 0.87, 0.73)
const FOREST := Color(0.42, 0.5, 0.3, 0.55)
const WATER := Color(0.42, 0.56, 0.6)
const BANK := Color(0.66, 0.6, 0.45)
const ROAD := Color(0.62, 0.5, 0.34)
const MAIDAN := Color(0.8, 0.7, 0.52)
const ROOF := Color(0.6, 0.45, 0.3)

var _sc := 1.0
var _org := Vector2.ZERO


func _to(p: Vector2) -> Vector2:
	return (p - _org) * _sc


func _pts(a: Array) -> PackedVector2Array:
	var out := PackedVector2Array()
	for p in a:
		out.append(_to(Vector2(p[0], p[1])))
	return out


func _oval(c: Array, r: Array, n := 40) -> PackedVector2Array:
	var out := PackedVector2Array()
	for i in n:
		var a := TAU * i / n
		out.append(_to(Vector2(c[0] + cos(a) * r[0], c[1] + sin(a) * r[1])))
	return out


func _font() -> Font:
	return canvas.get_theme_default_font()


func _label(text: String, at: Vector2, size := 15, col := INK) -> void:
	var f := _font()
	var w := f.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
	canvas.draw_string(f, at - Vector2(w / 2.0, -size / 3.0), text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, col)


func _star(c: Vector2, r: float, col: Color) -> void:
	var pts := PackedVector2Array()
	for i in 10:
		var a := -PI / 2.0 + i * PI / 5.0
		pts.append(c + Vector2(cos(a), sin(a)) * (r if i % 2 == 0 else r * 0.45))
	canvas.draw_colored_polygon(pts, col)
	pts.append(pts[0])
	canvas.draw_polyline(pts, INK, 1.5)


func _area(p: PackedVector2Array) -> float:
	var a := 0.0
	for i in p.size():
		var q: Vector2 = p[(i + 1) % p.size()]
		a += p[i].x * q.y - q.x * p[i].y
	return a / 2.0


func _draw_map() -> void:
	var size := canvas.size
	var d: Dictionary = m.data
	var b: Array = d.bounds   # [west, north, east, south], metres
	var me := metres(m.player.position)
	var view: Rect2
	if zoom == "world":
		view = Rect2(b[0], b[1], b[2] - b[0], b[3] - b[1])
	else:
		var span := Vector2(NEAR_SPAN, NEAR_SPAN * size.y / maxf(size.x, 1.0))
		view = Rect2(me - span / 2.0, span)
	_sc = minf(size.x / view.size.x, size.y / view.size.y)
	_org = view.get_center() - size / 2.0 / _sc
	canvas.draw_rect(Rect2(Vector2.ZERO, size), PAPER)
	# the forests
	for f in d.get("forests", []):
		var poly := _pts(f.outline)
		canvas.draw_colored_polygon(poly, FOREST)
		# a few little trees drawn into it, in ink
		var c := Vector2.ZERO
		for p in f.outline:
			c += Vector2(p[0], p[1])
		c /= f.outline.size()
		_label(hud.t("map.forest"), _to(c), 14, INK.lerp(FOREST, 0.3))
	# the maidan, the bank, the water
	if d.has("maidan"):
		canvas.draw_colored_polygon(_oval(d.maidan.center, d.maidan.radius), MAIDAN)
	for a in d.get("areas", []):
		var col := WATER if a.get("solid", false) else BANK
		canvas.draw_colored_polygon(_oval(a.center, a.radius), col)
		if a.get("solid", false):
			_label(hud.t("map.pond"), _to(Vector2(a.center[0], a.center[1])), 13, Color(0.95, 0.93, 0.85))
	# roads and paths
	for r in d.get("roads", []):
		canvas.draw_polyline(_pts(r.points), ROAD, maxf(2.0, float(r.width) * _sc * 0.8), true)
	for p in d.get("paths", []):
		canvas.draw_polyline(_pts(p.points), ROAD.lerp(PAPER, 0.3), maxf(1.0, float(p.width) * _sc * 0.6), true)
	for w in d.get("walks", []):
		canvas.draw_colored_polygon(_pts(w.points), Color(0.55, 0.4, 0.25))
	# the buildings: their footprints, from the scene
	for e in m.buildings:
		if not e.has("foot"):
			continue
		var poly := PackedVector2Array()
		var ground := PackedVector2Array()
		for p in e.foot:
			poly.append(_to(metres(p)))
			ground.append(metres(p))
		# (trunks and small things have footprints too: only buildings go on a map)
		if absf(_area(ground)) < 4.0:
			continue
		canvas.draw_colored_polygon(poly, ROOF)
		var closed := poly.duplicate()
		closed.append(poly[0])
		canvas.draw_polyline(closed, INK, 1.0)
	# the windmill's sails
	for bd in d.get("buildings", []):
		if bd.id == "mlyn":
			var c := _to(Vector2(bd.at[0], bd.at[1]))
			var r := maxf(8.0, 4.0 * _sc)
			canvas.draw_line(c - Vector2(r, r), c + Vector2(r, r), INK, 2.0)
			canvas.draw_line(c - Vector2(r, -r), c + Vector2(r, -r), INK, 2.0)
	# the khutir's name over the maidan
	if d.has("maidan") and zoom == "world":
		var mc: Array = d.maidan.center
		_label(hud.t("map.khutir"), _to(Vector2(mc[0], mc[1] - float(d.maidan.radius[1]) - 9.0)), 20)
	# the quest's star and the kobzar
	var tg: Variant = target()
	var t := Time.get_ticks_msec() * 0.001
	if tg != null:
		_star(_to(tg), 11.0 + 1.5 * sin(t * 3.0), Color(0.95, 0.75, 0.2))
	var at := _to(me)
	canvas.draw_circle(at, 9.0 + 2.0 * sin(t * 4.0), Color(0.75, 0.15, 0.12, 0.3))
	canvas.draw_circle(at, 6.0, Color(0.75, 0.15, 0.12))
	canvas.draw_arc(at, 6.0, 0, TAU, 20, INK, 1.5)
	# a frame of ink round the parchment
	canvas.draw_rect(Rect2(Vector2.ONE, size - Vector2(2, 2)), INK, false, 2.0)


func _process(_d: float) -> void:
	if map_btn != null:
		map_btn.visible = not m.editing and not (m.fading and not panel.visible)
	if panel.visible:
		canvas.queue_redraw()   # (the dot and the star breathe)


func _unhandled_input(event: InputEvent) -> void:
	if m.editing:
		return
	var key: int = event.physical_keycode if event is InputEventKey and event.pressed and not event.echo else -1
	var pad: int = event.button_index if event is InputEventJoypadButton and event.pressed else -1
	if key == KEY_M or pad == JOY_BUTTON_Y:
		toggle()
		get_viewport().set_input_as_handled()
	elif panel.visible and (key == KEY_ESCAPE or pad == JOY_BUTTON_B):
		close_map()
		get_viewport().set_input_as_handled()
