extends Node2D
## Zalissya's maidan in the chosen style (Pillars-lite), the first piece of
## the khutir built in Godot. Everything on it comes from one data file,
## zalissya/maidan.json, laid out in metres on the ground (x east, y south,
## the fire at 0, 0), so a collaborator can add or move a building without
## touching this script. The art is the style's (styles/pillars/): its hut,
## with the walk-in room from the style test, and its kobzar. Things with no
## art yet stand as labelled blocks of their real size, to be replaced.

const DATA := "res://zalissya/maidan.json"
const SPEED := 150.0
const PLAYER_R := 12.0

var data: Dictionary
var style := "pillars"
var layout: Dictionary
var k := 1.0                 # sprite px → scene px
var metre := 1.0             # scene px per metre, upright (people, walls)
var east := Vector2.ZERO     # scene px per metre along the ground, east
var north := Vector2.ZERO    # … and north (the hut's art sets both)
var world: Node2D            # everything that sorts by its feet
var ground: Node2D           # the floor, under everything
var walls: StaticBody2D
var player: CharacterBody2D
var player_anim: AnimatedSprite2D
var buildings: Array[Dictionary] = []   # {node, inner, foot, walk_in, room}
var inside_of := -1
var debug := false
var debug_layer: Node2D
var hud_info: Label
var stick := Vector2.ZERO
var stick_touch := -1
var stick_origin := Vector2.ZERO
var stick_ui: Control
var fps_hist: Array[float] = []
var cam: Camera2D
var shade: CanvasModulate
var sun: DirectionalLight2D
var lamps: Array[PointLight2D] = []   # each with meta "hut" (-1: outdoors)
var fire: PointLight2D
var night := false


func _ready() -> void:
	data = JSON.parse_string(FileAccess.get_file_as_string(DATA))
	style = data.get("style", "pillars")
	layout = JSON.parse_string(FileAccess.get_file_as_string("res://styles/%s/layout.json" % style))
	k = layout.get("scale", 1.0)
	metre = layout.metre * k
	# The ground's two directions come from the hut's own footprint: its
	# door wall (left corner → front corner) runs east, its side wall (front
	# → right) runs north, at the hut's size in metres.
	var hs: Array = data.get("hut_size", [7, 5])
	var f := _pts(layout.hut.exterior.footprint)
	east = (f[1] - f[0]) * k / float(hs[0])
	north = (f[2] - f[1]) * k / float(hs[1])
	_build_ui()
	ground = Node2D.new()
	add_child(ground)
	world = Node2D.new()
	world.y_sort_enabled = true
	add_child(world)
	walls = StaticBody2D.new()
	add_child(walls)
	_build_ground()
	for b in data.get("buildings", []):
		if b.kind == "khata":
			_build_khata(b)
		elif b.kind == "sprite":
			_build_sprite(b)
		else:
			_build_placeholder(b)
	for p in data.get("props", []):
		var s := _sprite(p.file, 1.0)
		if s.texture != null:
			s.scale = Vector2.ONE * (float(p.get("metres", 1.0)) * metre / s.texture.get_height())
		s.position = P(p.at[0], p.at[1])
		world.add_child(s)
	_build_player()
	_build_light()
	debug_layer = Node2D.new()
	debug_layer.z_index = 100
	debug_layer.visible = false
	debug_layer.draw.connect(_draw_debug)
	add_child(debug_layer)


## a point on the ground, in metres (x east, y south), in scene px
func P(x: float, y: float) -> Vector2:
	return x * east - y * north


func _rect(c: Array, size: Array) -> PackedVector2Array:
	# [left, front, right, back] as the hut's footprint is: south-west,
	# south-east, north-east, north-west
	var hw := float(size[0]) / 2.0
	var hd := float(size[1]) / 2.0
	var x := float(c[0])
	var y := float(c[1])
	return PackedVector2Array([P(x - hw, y + hd), P(x + hw, y + hd), P(x + hw, y - hd), P(x - hw, y - hd)])


# --- art --------------------------------------------------------------------------
func _tex(name: String) -> Texture2D:
	var path := "res://styles/%s/%s.png" % [style, name]
	if not ResourceLoader.exists(path):
		push_warning("missing art: " + path)
		return null
	return load(path)


## a sprite anchored at the bottom centre of its PNG, with its normal map
func _sprite(name: String, scale_k: float) -> Sprite2D:
	var tex := _tex(name)
	var s := Sprite2D.new()
	if tex == null:
		return s
	var npath := "res://styles/%s/%s_n.png" % [style, name]
	if ResourceLoader.exists(npath):
		var ct := CanvasTexture.new()
		ct.diffuse_texture = tex
		ct.normal_texture = load(npath)
		s.texture = ct
	else:
		s.texture = tex
	s.centered = false
	s.offset = Vector2(-tex.get_width() / 2.0, -tex.get_height())
	s.scale = Vector2(scale_k, scale_k)
	return s


func _pts(arr: Array) -> PackedVector2Array:
	var out := PackedVector2Array()
	for p in arr:
		out.append(Vector2(p[0], p[1]))
	if out.size() == 3:
		out.append(out[0] + out[2] - out[1])
	return out


func _fit(src: PackedVector2Array, dst: PackedVector2Array) -> Transform2D:
	var a := Transform2D(src[1] - src[0], src[2] - src[1], src[0])
	var b := Transform2D(dst[1] - dst[0], dst[2] - dst[1], dst[0])
	return b * a.affine_inverse()


func _label(text := "") -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_color_override("font_color", Color(1, 0.97, 0.88))
	l.add_theme_color_override("font_outline_color", Color(0.1, 0.07, 0.04))
	l.add_theme_constant_override("outline_size", 5)
	return l


# --- the ground: grass, the trodden maidan, the road and paths ------------------------
func _build_ground() -> void:
	var bd: Array = data.get("bounds", [-30, -24, 30, 26])
	var corners := _rect([(bd[0] + bd[2]) / 2.0, (bd[1] + bd[3]) / 2.0], [bd[2] - bd[0], bd[3] - bd[1]])
	var box := Rect2(corners[0], Vector2.ZERO)
	for c in corners:
		box = box.expand(c)
	var grass := _tex("ground_grass")
	if grass != null:
		var spr := Sprite2D.new()
		spr.texture = grass
		spr.texture_repeat = CanvasItem.TEXTURE_REPEAT_ENABLED
		spr.region_enabled = true
		spr.centered = false
		var tile := 6.0 * metre / grass.get_width()
		spr.scale = Vector2(tile, tile)
		spr.position = box.position
		spr.region_rect = Rect2(box.position / tile, box.size / tile)
		ground.add_child(spr)
	# the maidan: bare trodden earth in a rough oval, its edge feathered
	var m: Dictionary = data.get("maidan", {})
	if not m.is_empty():
		var oval := PackedVector2Array()
		for i in 48:
			var a := TAU * i / 48.0
			var wob := 1.0 + 0.06 * sin(3.0 * a + 1.3) + 0.04 * sin(5.0 * a)
			oval.append(P(m.center[0] + cos(a) * m.radius[0] * wob, m.center[1] + sin(a) * m.radius[1] * wob))
		# (its own trodden-earth tile when there is one; until then the road's,
		# its ruts turned along the road, as if the carts cross the maidan)
		var road_dir := Vector2.DOWN
		var roads: Array = data.get("roads", [])
		if not roads.is_empty():
			var rp: Array = roads[0].points
			road_dir = (P(rp[-1][0], rp[-1][1]) - P(rp[0][0], rp[0][1])).normalized()
		var tex_name: String = m.get("texture", "ground_maidan")
		if not ResourceLoader.exists("res://styles/%s/%s.png" % [style, tex_name]):
			tex_name = "ground_road"
		_fill(tex_name, oval, 7.0, PI / 2 - road_dir.angle())
		ground.set_meta("oval", oval)
	for r in data.get("roads", []):
		_strip("ground_road" if r.get("kind", "road") == "road" else "ground_path", r.points, r.width, 5.0)
	for r in data.get("paths", []):
		_strip("ground_path", r.points, r.width, 6.0)


## a ground texture lying flat in the world, over a polygon, its edge
## feathered by a wider, fainter copy underneath
func _fill(name: String, poly_pts: PackedVector2Array, tile_m: float, rot := 0.0) -> void:
	var tex := _tex(name)
	if tex == null:
		return
	for pass_i in 2:
		var outlines: Array = [poly_pts] if pass_i == 1 else Geometry2D.offset_polygon(poly_pts, 0.5 * metre, Geometry2D.JOIN_ROUND)
		for outline in outlines:
			var poly := Polygon2D.new()
			poly.polygon = outline
			poly.texture = tex
			poly.texture_repeat = CanvasItem.TEXTURE_REPEAT_ENABLED
			poly.texture_scale = Vector2.ONE * (tex.get_width() / (tile_m * metre))
			poly.texture_rotation = rot
			poly.color = Color(1, 1, 1, 0.45 if pass_i == 0 else 1.0)
			ground.add_child(poly)


func _strip(name: String, metres_pts: Array, width_m: float, tile_m: float) -> void:
	var pts := PackedVector2Array()
	for p in metres_pts:
		pts.append(P(p[0], p[1]))
	# (Harry's road texture runs its ruts top to bottom: turn them along the road)
	var along := (pts[pts.size() - 1] - pts[0]).normalized()
	var w := width_m * (east.length() + north.length()) / 2.0
	var outline: Array = Geometry2D.offset_polyline(pts, w / 2.0, Geometry2D.JOIN_ROUND, Geometry2D.END_ROUND)
	for o in outline:
		_fill(name, o, tile_m, PI / 2 - along.angle())


# --- buildings ------------------------------------------------------------------------
## a hut of the style's art, walk-in: its exterior fades while you are in it
func _build_khata(b: Dictionary) -> void:
	var h: Dictionary = layout.hut
	var hs: Array = data.get("hut_size", [7, 5])
	var foot := _rect(b.at, hs)
	var src := _pts(h.exterior.footprint)
	var node := Node2D.new()
	world.add_child(node)
	var inner := Node2D.new()   # counter-moved against node (see _process)
	node.add_child(inner)
	var ext := _sprite(h.exterior.file, k)
	ext.position = foot[0] - src[0] * k
	inner.add_child(ext)
	# the room, on the ground under everything, laid onto the same footprint
	var inn: Dictionary = h.interior
	var room := Node2D.new()
	room.transform = _fit(_pts(inn.footprint), foot)
	ground.add_child(room)
	room.add_child(_sprite(inn.file, 1.0))
	for r in inn.get("solids", []):
		var c := Vector2(r[0], r[1])
		var hw := Vector2(r[2] / 2.0, 0)
		var hh := Vector2(0, r[3] / 2.0)
		var poly := CollisionPolygon2D.new()
		poly.polygon = PackedVector2Array([room.transform * (c - hw - hh), room.transform * (c + hw - hh), room.transform * (c + hw + hh), room.transform * (c - hw + hh)])
		walls.add_child(poly)
	var cs := CollisionShape2D.new()
	var sh := CircleShape2D.new()
	sh.radius = 0.45 * metre
	cs.shape = sh
	cs.position = room.transform * Vector2(inn.pich[0], inn.pich[1])
	walls.add_child(cs)
	# the walls along the footprint, with a gap for the door in the south wall
	var d0: float = h.door[0]
	var d1: float = h.door[1]
	_wall(foot[0], foot[0].lerp(foot[1], d0))
	_wall(foot[0].lerp(foot[1], d1), foot[1])
	_wall(foot[1], foot[2])
	_wall(foot[2], foot[3])
	_wall(foot[3], foot[0])
	var name_l := _label(b.get("name", b.id))
	name_l.position = (foot[0] + foot[2]) / 2.0 + Vector2(-60, -5.5 * metre)
	name_l.visible = false
	inner.add_child(name_l)
	var door := foot[0].lerp(foot[1], (d0 + d1) / 2.0)
	var outward := (foot[0] - foot[3]).normalized()   # out of the south wall
	buildings.append({"node": node, "inner": inner, "foot": foot, "walk_in": true, "fade": ext, "label": name_l,
		"pich": cs.position, "door": door + outward * 0.6 * metre})


## a building with its own art (not walk-in): the PNG's footprint
## [left, front, right] (sprite px from its bottom centre, as in a style's
## layout.json) is laid onto the ground at 'at', 'size' metres; the art is
## drawn at the style's density, so a picture at 88 px a metre fits
func _build_sprite(b: Dictionary) -> void:
	var foot := _rect(b.at, b.get("size", [2, 2]))
	var src := _pts(b.footprint)
	var node := Node2D.new()
	world.add_child(node)
	var inner := Node2D.new()
	node.add_child(inner)
	var spr := _sprite(b.file, k)
	spr.position = foot[0] - src[0] * k
	inner.add_child(spr)
	var name_l := _label(b.get("name", b.id))
	name_l.position = (foot[0] + foot[2]) / 2.0 + Vector2(-50, -4.0 * metre)
	name_l.visible = false
	inner.add_child(name_l)
	if b.get("solid", true):
		var cp := CollisionPolygon2D.new()
		cp.polygon = foot
		walls.add_child(cp)
	buildings.append({"node": node, "inner": inner, "foot": foot, "walk_in": false, "label": name_l})


## a thing with no art yet: a plain block of its real size, with its name
func _build_placeholder(b: Dictionary) -> void:
	var foot := _rect(b.at, b.get("size", [2, 2]))
	var up := Vector2(0, -float(b.get("height", 2.0)) * metre)
	var node := Node2D.new()
	world.add_child(node)
	var inner := Node2D.new()
	node.add_child(inner)
	var col := Color(0.55, 0.45, 0.33)
	for face in [[foot[0], foot[1], 0.8], [foot[1], foot[2], 0.62]]:
		var poly := Polygon2D.new()
		poly.polygon = PackedVector2Array([face[0], face[1], face[1] + up, face[0] + up])
		poly.color = Color(col.r * face[2], col.g * face[2], col.b * face[2], 0.85)
		inner.add_child(poly)
	var top := Polygon2D.new()
	top.polygon = PackedVector2Array([foot[0] + up, foot[1] + up, foot[2] + up, foot[3] + up])
	top.color = Color(col.r * 1.1, col.g * 1.1, col.b * 1.1, 0.85)
	inner.add_child(top)
	var line := Line2D.new()
	line.points = PackedVector2Array([foot[0] + up, foot[1] + up, foot[2] + up, foot[3] + up, foot[0] + up])
	line.width = 2
	line.default_color = Color(0.2, 0.14, 0.08, 0.8)
	inner.add_child(line)
	var name_l := _label(b.get("name", b.id))
	name_l.position = (foot[0] + foot[2]) / 2.0 + up + Vector2(-50, -30)
	inner.add_child(name_l)
	if b.get("solid", true):
		var cp := CollisionPolygon2D.new()
		cp.polygon = foot
		walls.add_child(cp)
	buildings.append({"node": node, "inner": inner, "foot": foot, "walk_in": false, "id": b.id})


func _wall(a: Vector2, b: Vector2) -> void:
	var cs := CollisionShape2D.new()
	var seg := SegmentShape2D.new()
	seg.a = a
	seg.b = b
	cs.shape = seg
	walls.add_child(cs)


# --- light: Pillars-lite's own, the sun raking the normal-mapped art by day,
# lamps and the fire by night -----------------------------------------------------------
func _light_tex() -> GradientTexture2D:
	var g := Gradient.new()
	g.set_color(0, Color(1, 1, 1, 1))
	g.set_color(1, Color(1, 1, 1, 0))
	var t := GradientTexture2D.new()
	t.gradient = g
	t.fill = GradientTexture2D.FILL_RADIAL
	t.fill_from = Vector2(0.5, 0.5)
	t.fill_to = Vector2(1.0, 0.5)
	t.width = 256
	t.height = 256
	return t


func _lamp(at: Vector2, size: float, col: Color, hut: int) -> PointLight2D:
	var l := PointLight2D.new()
	l.texture = _light_tex()
	l.position = at
	l.texture_scale = size * 1.6
	l.color = col
	l.height = 40.0
	l.set_meta("hut", hut)
	l.enabled = false
	add_child(l)
	lamps.append(l)
	return l


func _build_light() -> void:
	shade = CanvasModulate.new()
	add_child(shade)
	sun = DirectionalLight2D.new()
	sun.rotation = deg_to_rad(45)   # from the upper left
	sun.height = 0.6
	sun.energy = 0.35
	sun.color = Color(1.0, 0.92, 0.75)
	add_child(sun)
	for i in buildings.size():
		var b: Dictionary = buildings[i]
		if b.has("pich"):
			# inside: the pich's glow and the room, lit while you are in the hut
			_lamp(b.pich, 1.0, Color(1.0, 0.6, 0.3), i)
			_lamp(_centroid(b.foot), 1.3, Color(1.0, 0.7, 0.4), i)
			# outside: a lamp by the door
			_lamp(b.door + Vector2(0, -1.4 * metre), 0.8, Color(1.0, 0.78, 0.45), -1)
		elif b.get("id", "") == "vatra":
			fire = _lamp(_centroid(b.foot) + Vector2(0, -0.6 * metre), 2.4, Color(1.0, 0.62, 0.3), -1)
	_set_night(false)


func _centroid(poly: PackedVector2Array) -> Vector2:
	var c := Vector2.ZERO
	for p in poly:
		c += p
	return c / poly.size()


func _update_lamps() -> void:
	for l in lamps:
		var hut: int = l.get_meta("hut")
		var lit := night and (hut < 0 or hut == inside_of)
		l.enabled = lit
		l.energy = (1.1 if hut >= 0 else 0.8) if lit else 0.0


func _set_night(on: bool) -> void:
	night = on
	shade.color = Color(0.3, 0.33, 0.52) if on else Color(1, 1, 1)
	sun.enabled = not on
	_update_lamps()


# --- the kobzar -----------------------------------------------------------------------
func _build_player() -> void:
	player = CharacterBody2D.new()
	var cs := CollisionShape2D.new()
	var sh := CircleShape2D.new()
	sh.radius = PLAYER_R
	cs.shape = sh
	cs.position = Vector2(0, -5)
	player.add_child(cs)
	var st: Array = data.get("start", [0, 10])
	player.position = P(st[0], st[1])
	world.add_child(player)
	var walk: Dictionary = layout.get("walk", {})
	var sheet := _tex(walk.get("file", "kobzar_walk"))
	var sf := SpriteFrames.new()
	if sheet != null:
		var cw := sheet.get_width() / 6.0
		var ch := sheet.get_height() / 4.0
		var rows: Array = walk.get("rows", ["down", "up", "left", "right"])
		for r in 4:
			var anim: String = "walk_" + rows[r]
			sf.add_animation(anim)
			sf.set_animation_speed(anim, 10)
			for c in 6:
				var at := AtlasTexture.new()
				at.atlas = sheet
				at.region = Rect2(c * cw, r * ch, cw, ch)
				sf.add_frame(anim, at)
		sf.remove_animation("default")
		player_anim = AnimatedSprite2D.new()
		player_anim.sprite_frames = sf
		player_anim.animation = "walk_down"
		player_anim.centered = false
		player_anim.offset = Vector2(-cw / 2.0, -ch)
		var hgt: float = layout.get("heights", {}).get("kobzar", 1.75)
		player_anim.scale = Vector2.ONE * (hgt * metre / ch)
		player.add_child(player_anim)
	cam = Camera2D.new()
	cam.position_smoothing_enabled = true
	cam.position_smoothing_speed = 6.0
	player.add_child(cam)


func _animate_walk(v: Vector2) -> void:
	if player_anim == null:
		return
	if v.length() <= 0.05:
		# he stands on the first frame of the way he last walked
		if player_anim.is_playing():
			player_anim.stop()
			player_anim.frame = 0
		return
	player_anim.play(("walk_down" if v.y > 0 else "walk_up") if absf(v.y) > absf(v.x) else ("walk_right" if v.x > 0 else "walk_left"))


# --- HUD and input ----------------------------------------------------------------------
func _build_ui() -> void:
	var sc := DisplayServer.screen_get_scale()
	if sc > 1.0:
		get_window().content_scale_factor = sc
	var mobile := OS.has_feature("web_ios") or OS.has_feature("web_android") or OS.has_feature("mobile")
	var layer := CanvasLayer.new()
	add_child(layer)
	stick_ui = Control.new()
	stick_ui.set_anchors_preset(Control.PRESET_FULL_RECT)
	stick_ui.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stick_ui.draw.connect(func():
		if stick_touch >= 0:
			stick_ui.draw_circle(stick_origin, 46, Color(1, 1, 1, 0.18))
			stick_ui.draw_circle(stick_origin + stick * 40, 20, Color(1, 1, 1, 0.45)))
	layer.add_child(stick_ui)
	var width := get_viewport().get_visible_rect().size.x - 24
	var top := VBoxContainer.new()
	top.position = Vector2(12, 52.0 if mobile else 10.0)
	layer.add_child(top)
	var row := HFlowContainer.new()
	row.custom_minimum_size = Vector2(width, 0)
	top.add_child(row)
	var b_dbg := Button.new()
	b_dbg.text = "Контури"
	b_dbg.pressed.connect(_toggle_debug)
	row.add_child(b_dbg)
	var b_night := Button.new()
	b_night.text = "День / ніч"
	b_night.pressed.connect(func(): _set_night(not night))
	row.add_child(b_night)
	for z in [["−", 0.8], ["+", 1.25]]:
		var bz := Button.new()
		bz.text = z[0]
		bz.custom_minimum_size = Vector2(44, 0)
		bz.pressed.connect(func(): _zoom(z[1]))
		row.add_child(bz)
	var b_st := Button.new()
	b_st.text = "Тест стилів"
	b_st.pressed.connect(func(): get_tree().change_scene_to_file("res://styles.tscn"))
	row.add_child(b_st)
	hud_info = _label()
	top.add_child(hud_info)
	var hint := _label("WASD / стрілки / стік / тягни пальцем · N або Y: день/ніч · F3: контури й назви · −/= або коліщатко: масштаб")
	hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	hint.custom_minimum_size = Vector2(width, 0)
	hint.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	hint.position = Vector2(12, -30 - (40 if width < 700 else 0))
	layer.add_child(hint)


## zooming out shows the whole maidan, to see how things stand together
func _zoom(f: float) -> void:
	cam.zoom = (cam.zoom * f).clamp(Vector2(0.25, 0.25), Vector2(2, 2))


func _toggle_debug() -> void:
	debug = not debug
	debug_layer.visible = debug
	for b in buildings:
		if b.has("label"):
			b.label.visible = debug
	debug_layer.queue_redraw()


func _draw_debug() -> void:
	for b in buildings:
		var f: PackedVector2Array = b.foot
		debug_layer.draw_polyline(f + PackedVector2Array([f[0]]), Color(1, 0.2, 0.2), 2)
	for c in walls.get_children():
		if c is CollisionShape2D:
			var s: Shape2D = c.shape
			if s is SegmentShape2D:
				debug_layer.draw_line(s.a, s.b, Color(0, 1, 1), 3)
			elif s is CircleShape2D:
				debug_layer.draw_circle(c.position, s.radius, Color(0, 1, 1, 0.3))
		elif c is CollisionPolygon2D:
			debug_layer.draw_polyline(c.polygon + PackedVector2Array([c.polygon[0]]), Color(0, 1, 1), 2)
	if ground.has_meta("oval"):
		var ov: PackedVector2Array = ground.get_meta("oval")
		debug_layer.draw_polyline(ov + PackedVector2Array([ov[0]]), Color(1, 0, 1), 3)
	# a metre grid round the fire, to place things by
	for i in range(-20, 21, 5):
		debug_layer.draw_line(P(i, -20), P(i, 20), Color(1, 1, 0, 0.25), 1)
		debug_layer.draw_line(P(-20, i), P(20, i), Color(1, 1, 0, 0.25), 1)


func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed and stick_touch < 0 and event.position.y > 150:
			stick_touch = event.index
			stick_origin = event.position
			stick = Vector2.ZERO
		elif not event.pressed and event.index == stick_touch:
			stick_touch = -1
			stick = Vector2.ZERO
		stick_ui.queue_redraw()
	elif event is InputEventScreenDrag and event.index == stick_touch:
		stick = ((event.position - stick_origin) / 40.0).limit_length(1.0)
		stick_ui.queue_redraw()
	elif event is InputEventKey and event.pressed and not event.echo:
		match event.physical_keycode:
			KEY_F3: _toggle_debug()
			KEY_N: _set_night(not night)
			KEY_MINUS: _zoom(0.8)
			KEY_EQUAL: _zoom(1.25)
	elif event is InputEventJoypadButton and event.pressed and event.button_index == JOY_BUTTON_Y:
		_set_night(not night)
	elif event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_DOWN: _zoom(0.9)
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP: _zoom(1.1)


func _physics_process(_delta: float) -> void:
	var v := Vector2.ZERO
	if Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP): v.y -= 1
	if Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN): v.y += 1
	if Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT): v.x -= 1
	if Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT): v.x += 1
	var joy := Vector2(Input.get_joy_axis(0, JOY_AXIS_LEFT_X), Input.get_joy_axis(0, JOY_AXIS_LEFT_Y))
	if joy.length() > 0.2:
		v += joy
	v += stick
	v = v.limit_length(1.0)
	player.velocity = v * SPEED
	player.move_and_slide()
	_animate_walk(v)


func _process(delta: float) -> void:
	var now_in := -1
	for i in buildings.size():
		var b: Dictionary = buildings[i]
		var foot: PackedVector2Array = b.foot
		if b.walk_in and Geometry2D.is_point_in_polygon(player.position, foot):
			now_in = i
		# each building sorts at the front edge of its footprint right where
		# the kobzar stands (the art is counter-moved, so only its place in
		# the order changes)
		var fy := _front_y(foot, player.position.x)
		b.node.position.y = fy
		b.inner.position.y = -fy
		if b.has("fade"):
			var target := 0.0 if now_in == i else 1.0
			b.fade.modulate.a = move_toward(b.fade.modulate.a, target, delta * 4.0)
	if now_in != inside_of:
		inside_of = now_in
		_update_lamps()
	if fire != null and fire.enabled:
		var t := Time.get_ticks_msec() * 0.001
		fire.energy = 1.0 + 0.12 * sin(t * 9.0) + 0.08 * sin(t * 23.0 + 1.0)
	fps_hist.append(Engine.get_frames_per_second())
	if fps_hist.size() > 120:
		fps_hist.pop_front()
	var g := player.position
	# (back from scene px to metres, for placing things)
	var m := Transform2D(east, -north, Vector2.ZERO).affine_inverse() * g
	hud_info.text = "Залісся · майдан · %d fps (low %d) · %s · %.1f, %.1f м%s" % [
		Engine.get_frames_per_second(), int(fps_hist.min()), "ніч" if night else "день", m.x, m.y,
		(" · " + data.buildings[inside_of].get("name", "")) if inside_of >= 0 else ""]


## the lowest y of a footprint's outline at x: where its front edge is
func _front_y(foot: PackedVector2Array, x: float) -> float:
	var best := -INF
	for i in foot.size():
		var a := foot[i]
		var b := foot[(i + 1) % foot.size()]
		if x >= minf(a.x, b.x) and x <= maxf(a.x, b.x) and absf(b.x - a.x) > 0.01:
			best = maxf(best, lerpf(a.y, b.y, (x - a.x) / (b.x - a.x)))
	if best == -INF:
		for p in foot:
			best = maxf(best, p.y)
	return best
