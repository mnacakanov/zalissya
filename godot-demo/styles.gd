extends Node2D
## The render-style test (issue #2): one little scene, Did Prokip's walkable
## hut with the kobzar, Prokip, a cow, a bench and a horod, built three times
## and switchable at runtime: Drova (pixel art: nearest filter, pixel snap),
## Pillars-lite (painted plates relit through normal maps) and BG2 / Icewind
## Dale (painted plates, light baked in). The same logic drives all three;
## only the art (styles/<style>/*.png), its layout (styles/<style>/
## layout.json) and the rendering settings change.

const STYLES := ["drova", "pillars", "bg2"]
const STYLE_NAMES := {"drova": "Drova", "pillars": "Pillars-lite", "bg2": "BG2 / IWD"}
const SPEED := 150.0
const PLAYER_R := 12.0
const PROKIP_LINES := [
	"Знову співак. Ну заходь, коли вже прийшов. Тільки кобзу не чіпай.",
	"Ворон є, кіт є, мухомори є. Співака не було. Тепер є. Халепа.",
	"Іди вже. Корову не дражни — вона в мене розумніша за пів хутора.",
]

var style := "bg2"
var layout: Dictionary
var k := 1.0                # sprite px → scene px (the exterior's scale)
var metre := 1.0            # scene px per metre
var world: Node2D           # everything that sorts by its feet
var ground: Node2D          # the floor of the scene, under everything
var player: CharacterBody2D
var player_sprite: Sprite2D
var player_anim: AnimatedSprite2D   # the walk, when the style has one
var anim_kind := ""                 # "sheet4" (Drova's 4 directions) or "frontback"
var walls: StaticBody2D
var hut_ext: Node2D         # the hut's exterior, faded away while you are inside
var hut_ext_sprite: Node2D
var footprint := PackedVector2Array()
var door := Vector2.ZERO
var pich := Vector2.ZERO
var prokip: Node2D
var shade: CanvasModulate
var sun: DirectionalLight2D
var lamps: Array[PointLight2D] = []
var night := false
var inside := false
var debug := false
var debug_layer: Node2D
var hud_info: Label
var talk_btn: Button
var dialog: PanelContainer
var dialog_text: Label
var dialog_i := -1
var stick := Vector2.ZERO
var stick_touch := -1
var stick_origin := Vector2.ZERO
var stick_ui: Control
var fps_hist: Array[float] = []
var load_ms := -1.0
var built_ms := 0.0
var style_bytes := 0
var style_buttons := {}


func _ready() -> void:
	_build_ui()
	_set_style("bg2")
	if OS.has_feature("web"):
		load_ms = float(JavaScriptBridge.eval("performance.now()", true))


# --- art -------------------------------------------------------------------------
func _tex(name: String) -> Texture2D:
	var path := "res://styles/%s/%s.png" % [style, name]
	if not ResourceLoader.exists(path):
		push_warning("missing art: " + path)
		return null
	var t: Texture2D = load(path)
	style_bytes += t.get_width() * t.get_height() * 4
	return t


func _normal_for(name: String) -> Texture2D:
	var path := "res://styles/%s/%s_n.png" % [style, name]
	return load(path) if ResourceLoader.exists(path) else null


## A sprite anchored at the bottom centre of its PNG (feet, or a building's
## front edge); in Pillars-lite with its normal map, so lamps rake across it.
func _sprite(name: String, scale_k: float) -> Sprite2D:
	var tex := _tex(name)
	var s := Sprite2D.new()
	if tex == null:
		return s
	var normal := _normal_for(name)
	if normal != null:
		var ct := CanvasTexture.new()
		ct.diffuse_texture = tex
		ct.normal_texture = normal
		s.texture = ct
	else:
		s.texture = tex
	s.centered = false
	s.offset = Vector2(-tex.get_width() / 2.0, -tex.get_height())
	s.scale = Vector2(scale_k, scale_k)
	return s


## A sprite scaled to a real height (people, the cow, the bench). Pixel
## art (layout "pixel": true) is drawn at one fixed density instead, so
## its texels stay whole.
func _sprite_m(name: String, metres: float) -> Sprite2D:
	var s := _sprite(name, 1.0)
	if s.texture != null and layout.get("pixel", false):
		s.scale = Vector2(k, k)
	elif s.texture != null:
		var h: float = s.texture.get_height()
		s.scale = Vector2.ONE * (metres * metre / h)
	return s


func _pts(arr: Array) -> PackedVector2Array:
	var out := PackedVector2Array()
	for p in arr:
		out.append(Vector2(p[0], p[1]))
	if out.size() == 3:   # [left, front, right]: the back corner follows
		out.append(out[0] + out[2] - out[1])
	return out


## The affine transform that lays three points onto three others
func _fit(src: PackedVector2Array, dst: PackedVector2Array) -> Transform2D:
	var a := Transform2D(src[1] - src[0], src[2] - src[1], src[0])
	var b := Transform2D(dst[1] - dst[0], dst[2] - dst[1], dst[0])
	return b * a.affine_inverse()


# --- the style switch: tear the scene down and build it again --------------------
func _set_style(name: String) -> void:
	var t0 := Time.get_ticks_usec()
	var was_inside := inside
	# where he stands, in metres from the door (each style has its own scale)
	var was_at := (player.position - door) / metre if player != null else Vector2.INF
	for n in [ground, world, walls, debug_layer, shade, sun]:
		if n != null:
			n.queue_free()
	sun = null
	for l in lamps:
		l.queue_free()
	lamps.clear()
	inside = false
	style = name
	style_bytes = 0
	layout = JSON.parse_string(FileAccess.get_file_as_string("res://styles/%s/layout.json" % style))
	k = layout.scale
	metre = layout.metre * k
	# Drova is pixel art: sharp texels, snapped to whole pixels
	var pixel := style == "drova"
	get_viewport().snap_2d_transforms_to_pixel = pixel
	get_viewport().canvas_item_default_texture_filter = Viewport.DEFAULT_CANVAS_ITEM_TEXTURE_FILTER_NEAREST if pixel else Viewport.DEFAULT_CANVAS_ITEM_TEXTURE_FILTER_LINEAR

	ground = Node2D.new()
	ground.z_index = -10
	add_child(ground)
	world = Node2D.new()
	world.y_sort_enabled = true
	add_child(world)
	walls = StaticBody2D.new()
	add_child(walls)
	_build_ground()
	_build_hut()
	_build_props()
	_build_roads()
	_build_people()
	_build_light()
	debug_layer = Node2D.new()
	debug_layer.z_index = 50
	debug_layer.visible = debug
	debug_layer.draw.connect(_draw_debug)
	add_child(debug_layer)
	# the kobzar stays put across a switch (inside, if he was in the hut)
	if was_inside:
		player.position = (door + _centroid(footprint)) / 2
	elif was_at != Vector2.INF:
		player.position = door + was_at * metre
	_set_night(night)
	for s in style_buttons:
		style_buttons[s].button_pressed = s == style
	built_ms = (Time.get_ticks_usec() - t0) / 1000.0


func _build_ground() -> void:
	# Harry's seamless grass, tiled across the scene (a tile is about 6 m);
	# the noise is only a fallback for a style without it
	var grass := _tex("ground_grass")
	var spr := Sprite2D.new()
	spr.texture_repeat = CanvasItem.TEXTURE_REPEAT_ENABLED
	spr.region_enabled = true
	if grass != null:
		spr.texture = grass
		var tile: float = k if layout.get("pixel", false) else 6.0 * metre / grass.get_width()
		spr.scale = Vector2(tile, tile)
		spr.region_rect = Rect2(0, 0, 2800 / tile, 2200 / tile)
	else:
		var noise := FastNoiseLite.new()
		noise.seed = 7
		noise.frequency = 0.012
		var nt := NoiseTexture2D.new()
		nt.width = 256
		nt.height = 256
		nt.seamless = true
		nt.noise = noise
		var g := Gradient.new()
		g.set_color(0, Color("76835a")); g.set_color(1, Color("aeac82"))
		nt.color_ramp = g
		spr.texture = nt
		spr.scale = Vector2(4, 4)
		spr.region_rect = Rect2(0, 0, 700, 550)
	ground.add_child(spr)


## A road or a path: the outline of a band along the points, filled with
## its texture lying flat in world space like the grass (a tile is about
## 6 m), its edge feathered by a wider, fainter band underneath, so it lies
## in the grass rather than on it.
func _strip(name: String, pts: PackedVector2Array, width: float, tile_m := 6.0, rot := 0.0) -> void:
	var tex := _tex(name)
	if tex == null:
		return
	for pass_i in 2:
		var half := width * (0.68 if pass_i == 0 else 0.5)
		for outline in Geometry2D.offset_polyline(pts, half, Geometry2D.JOIN_ROUND, Geometry2D.END_ROUND):
			var poly := Polygon2D.new()
			poly.polygon = outline
			poly.texture = tex
			poly.texture_repeat = CanvasItem.TEXTURE_REPEAT_ENABLED
			poly.texture_scale = Vector2.ONE * ((1.0 / k) if layout.get("pixel", false) else tex.get_width() / (tile_m * metre))
			poly.texture_rotation = rot
			poly.color = Color(1, 1, 1, 0.45 if pass_i == 0 else 1.0)
			ground.add_child(poly)
			ground.move_child(poly, ground.get_child_count() - 1 if ground.get_child_count() <= 2 else 1 + pass_i)


## The cart road runs past the front of the hut, parallel to its door wall;
## a footpath leaves it for the door, and another for the horod.
func _build_roads() -> void:
	var along := (footprint[1] - footprint[0]).normalized()
	var outward: Vector2 = world.get_meta("outward")
	var mid := door + outward * 5.0 * metre
	var road := PackedVector2Array()
	for i in range(-6, 7):
		var t := i * 3.0 * metre
		# a gentle wander, so it isn't ruled
		road.append(mid + along * t + outward * sin(i * 0.9) * 0.6 * metre)
	# (Harry's road texture runs its ruts top to bottom: turn them along the road)
	_strip("ground_road", road, 2.6 * metre, 5.0, PI / 2 - along.angle())
	var to_door := PackedVector2Array([mid, mid.lerp(door, 0.5) + along * 0.3 * metre, door + outward * 0.2 * metre])
	_strip("ground_path", to_door, 1.1 * metre)
	var horod: Vector2 = footprint[2] + Vector2(2.6, 3.2) * metre
	var from := mid + along * 6.0 * metre
	var to_horod := PackedVector2Array([from, from.lerp(horod, 0.5) - outward * 0.5 * metre, horod + Vector2(0, -0.8 * metre)])
	_strip("ground_path", to_horod, 1.0 * metre)


func _build_hut() -> void:
	var h: Dictionary = layout.hut
	# the exterior: its ground footprint makes the walls
	var ext_fp := _pts(h.exterior.footprint)
	footprint = PackedVector2Array()
	for p in ext_fp:
		footprint.append(p * k)
	hut_ext = Node2D.new()
	world.add_child(hut_ext)
	hut_ext_sprite = Node2D.new()   # counter-moved against hut_ext (see _process)
	hut_ext.add_child(hut_ext_sprite)
	hut_ext_sprite.add_child(_sprite(h.exterior.file, k))
	# the interior, on the ground under everything, laid onto the same
	# footprint by its own three corners
	var inn: Dictionary = h.interior
	var room := Node2D.new()
	room.transform = _fit(_pts(inn.footprint), footprint)
	ground.add_child(room)
	room.add_child(_sprite(inn.file, 1.0))
	for e in inn.get("extra", []):
		var es := _sprite(e.file, e.scale)
		es.position = Vector2(e.at[0], e.at[1])
		room.add_child(es)
	pich = room.transform * Vector2(inn.pich[0], inn.pich[1])
	room.set_meta("prokip", room.transform * Vector2(inn.prokip[0], inn.prokip[1]))
	# furniture you bump into, in the interior's own pixels
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
	cs.position = pich
	walls.add_child(cs)
	# the walls: the footprint's edges, with a gap for the door in the
	# left face (left corner → front corner)
	var d0: float = h.door[0]
	var d1: float = h.door[1]
	for i in footprint.size():
		var a := footprint[i]
		var b := footprint[(i + 1) % footprint.size()]
		if i == 0:
			_wall(a, a.lerp(b, d0))
			_wall(a.lerp(b, d1), b)
		else:
			_wall(a, b)
	door = footprint[0].lerp(footprint[1], (d0 + d1) / 2)
	ground.set_meta("room", room)


func _wall(a: Vector2, b: Vector2) -> void:
	var cs := CollisionShape2D.new()
	var seg := SegmentShape2D.new()
	seg.a = a
	seg.b = b
	cs.shape = seg
	walls.add_child(cs)


func _centroid(poly: PackedVector2Array) -> Vector2:
	var c := Vector2.ZERO
	for p in poly:
		c += p
	return c / poly.size()


func _solid_box(center: Vector2, size: Vector2) -> void:
	var cs := CollisionShape2D.new()
	var sh := RectangleShape2D.new()
	sh.size = size
	cs.shape = sh
	cs.position = center
	walls.add_child(cs)


func _build_props() -> void:
	var heights: Dictionary = layout.heights
	var left := footprint[0]
	var front := footprint[1]
	var along := (front - left).normalized()      # along the door wall
	var outward := Vector2(along.y, -along.x)       # away from the hut, toward the lower left
	if outward.dot(door - _centroid(footprint)) < 0:
		outward = -outward
	# the bench against the door wall, left of the door
	var bench := Node2D.new()
	bench.position = left.lerp(door, 0.45) + outward * 0.55 * metre
	bench.add_child(_sprite_m("bench", heights.bench))
	world.add_child(bench)
	_solid_box(bench.position + Vector2(0, -0.15 * metre), Vector2(1.5 * metre, 0.35 * metre))
	# the skull on its stake by the door, where a set sliced it apart
	if layout.has("skull_stake"):
		var sk := Node2D.new()
		sk.position = left.lerp(door, 0.12) + outward * 0.35 * metre
		sk.add_child(_sprite_m(layout.skull_stake.file, layout.skull_stake.metres))
		world.add_child(sk)
	# the horod: flat on the ground, beyond the hut's right corner
	var hr := _sprite(layout.horod.file, 1.0)
	if hr.texture != null and layout.get("pixel", false):
		hr.scale = Vector2(k, k)
	elif hr.texture != null:
		hr.scale = Vector2.ONE * (layout.horod.metres * metre / hr.texture.get_width())
	var horod := Node2D.new()
	horod.position = footprint[2] + Vector2(2.6, 3.2) * metre
	horod.add_child(hr)
	ground.add_child(horod)
	# the cow, grazing out front to the left
	var cow := Node2D.new()
	cow.position = door + outward * 3.6 * metre + Vector2(-2.4, 0.4) * metre
	cow.add_child(_sprite_m("cow", heights.cow))
	world.add_child(cow)
	var ccs := CollisionShape2D.new()
	var csh := CapsuleShape2D.new()
	csh.radius = 0.35 * metre
	csh.height = 2.0 * metre
	ccs.shape = csh
	ccs.rotation = PI / 2
	ccs.position = cow.position + Vector2(0, -0.1 * metre)
	walls.add_child(ccs)
	world.set_meta("outward", outward)


func _build_people() -> void:
	var heights: Dictionary = layout.heights
	var outward: Vector2 = world.get_meta("outward")
	player = CharacterBody2D.new()
	player.motion_mode = CharacterBody2D.MOTION_MODE_FLOATING
	player.position = door + Vector2(0, 2.6 * metre)   # straight below the door
	var cs := CollisionShape2D.new()
	var sh := CircleShape2D.new()
	sh.radius = PLAYER_R
	cs.shape = sh
	cs.position = Vector2(0, -5)
	player.add_child(cs)
	player_sprite = _sprite_m("kobzar", heights.kobzar)
	player.add_child(player_sprite)
	_build_walk(heights.kobzar)
	var cam := Camera2D.new()
	cam.position_smoothing_enabled = true
	cam.position_smoothing_speed = 6.0
	player.add_child(cam)
	world.add_child(player)
	# Prokip, by his pich inside
	prokip = Node2D.new()
	prokip.position = ground.get_meta("room").get_meta("prokip")
	prokip.add_child(_sprite_m("npc_prokip", heights.npc_prokip))
	world.add_child(prokip)


# --- the kobzar's walk: whatever the style's art gives ---------------------------
#   sheet4:    kobzar_walk.png, 4 rows (down, up, left, right) × 6 frames
#              (Drova's pixel-art way)
#   frontback: kobzar_walk_front_0..7.png and kobzar_walk_back_0..7.png,
#              mirrored for the left-hand directions
# With neither, the single kobzar.png bobs as he walks.
func _build_walk(metres: float) -> void:
	player_anim = null
	anim_kind = ""
	var sf := SpriteFrames.new()
	var cell_h := 0.0
	var sheet: Texture2D = _tex("kobzar_walk") if ResourceLoader.exists("res://styles/%s/kobzar_walk.png" % style) else null
	if sheet != null:
		var cw := sheet.get_width() / 6.0
		var ch := sheet.get_height() / 4.0
		cell_h = ch
		var rows := ["walk_down", "walk_up", "walk_left", "walk_right"]
		for r in 4:
			sf.add_animation(rows[r])
			sf.set_animation_speed(rows[r], 10)
			for c in 6:
				var at := AtlasTexture.new()
				at.atlas = sheet
				at.region = Rect2(c * cw, r * ch, cw, ch)
				sf.add_frame(rows[r], at)
		anim_kind = "sheet4"
	elif ResourceLoader.exists("res://styles/%s/kobzar_walk_front_0.png" % style):
		for facing in ["front", "back"]:
			var anim: String = "walk_" + facing
			sf.add_animation(anim)
			sf.set_animation_speed(anim, 10)
			for i in 8:
				var t := _tex("kobzar_walk_%s_%d" % [facing, i])
				if t != null:
					sf.add_frame(anim, t)
					cell_h = t.get_height()
		anim_kind = "frontback"
	if anim_kind == "":
		return
	sf.remove_animation("default")
	player_anim = AnimatedSprite2D.new()
	player_anim.sprite_frames = sf
	player_anim.centered = false
	var first: Texture2D = sf.get_frame_texture(sf.get_animation_names()[0], 0)
	player_anim.offset = Vector2(-first.get_width() / 2.0, -first.get_height())
	var sc: float = k if layout.get("pixel", false) else metres * metre / cell_h
	player_anim.scale = Vector2(sc, sc)
	player_anim.visible = false
	player.add_child(player_anim)


func _animate_walk(v: Vector2) -> void:
	var moving := v.length() > 0.05
	if player_anim == null:
		# no walk in this style's art: the standing figure bobs along
		if moving:
			player_sprite.position.y = -absf(sin(Time.get_ticks_msec() * 0.018)) * 4.0
			if absf(v.x) > 0.05:
				player_sprite.scale.x = absf(player_sprite.scale.x) * (-1.0 if v.x < 0 else 1.0)
		else:
			player_sprite.position.y = 0
		return
	player_anim.visible = moving
	player_sprite.visible = not moving
	if not moving:
		player_anim.stop()
		return
	if anim_kind == "sheet4":
		var anim: String = ("walk_down" if v.y > 0 else "walk_up") if absf(v.y) > absf(v.x) else ("walk_right" if v.x > 0 else "walk_left")
		player_anim.flip_h = false
		player_anim.play(anim)
	else:
		player_anim.play("walk_back" if v.y < -0.1 else "walk_front")
		if absf(v.x) > 0.05:
			player_anim.flip_h = v.x < 0
			player_sprite.scale.x = absf(player_sprite.scale.x) * (-1.0 if v.x < 0 else 1.0)


# --- light: the hour's colour over everything, lamps that show at night; in
# Pillars-lite also a sun that rakes the normal-mapped art ----------------------
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


func _build_light() -> void:
	shade = CanvasModulate.new()
	add_child(shade)
	if style == "pillars":
		sun = DirectionalLight2D.new()
		sun.rotation = deg_to_rad(45)   # from the upper left
		sun.height = 0.6
		sun.energy = 0.35
		sun.color = Color(1.0, 0.92, 0.75)
		add_child(sun)
	var tex := _light_tex()
	var outward: Vector2 = world.get_meta("outward")
	# [where, size, colour, indoors?]: the pich's glow and the room, which
	# light only while you are in the hut, and a lamp by the door
	for spot in [[pich, 1.0, Color(1.0, 0.6, 0.3), true], [_centroid(footprint), 1.3, Color(1.0, 0.7, 0.4), true],
			[door + outward * 0.6 * metre + Vector2(0, -1.4 * metre), 0.8, Color(1.0, 0.78, 0.45), false]]:
		var l := PointLight2D.new()
		l.set_meta("indoors", spot[3])
		l.texture = tex
		l.position = spot[0]
		l.texture_scale = spot[1] * 1.6
		l.color = spot[2]
		l.height = 40.0
		add_child(l)
		lamps.append(l)


func _update_lamps() -> void:
	for l in lamps:
		var lit: bool = night and (inside or not l.get_meta("indoors"))
		l.enabled = lit
		l.energy = (1.1 if l.get_meta("indoors") else 0.8) if lit else 0.0


func _set_night(on: bool) -> void:
	night = on
	shade.color = Color(0.3, 0.33, 0.52) if on else Color(1, 1, 1)
	_update_lamps()
	if sun != null:
		sun.enabled = not on


# --- the HUD ------------------------------------------------------------------------
func _label(text := "") -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_color_override("font_color", Color(1, 0.97, 0.88))
	l.add_theme_color_override("font_outline_color", Color(0.1, 0.07, 0.04))
	l.add_theme_constant_override("outline_size", 5)
	return l


func _build_ui() -> void:
	var top_m := _fit_screen()
	var layer := CanvasLayer.new()
	add_child(layer)
	stick_ui = Control.new()
	stick_ui.set_anchors_preset(Control.PRESET_FULL_RECT)
	stick_ui.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stick_ui.draw.connect(_draw_stick)
	layer.add_child(stick_ui)
	var top := VBoxContainer.new()
	top.position = Vector2(12, top_m)
	layer.add_child(top)
	# (the buttons wrap onto a second row on a narrow phone screen)
	var width := get_viewport().get_visible_rect().size.x - 24
	var row := HFlowContainer.new()
	row.custom_minimum_size = Vector2(width, 0)
	top.add_child(row)
	for s in STYLES:
		var b := Button.new()
		b.text = STYLE_NAMES[s]
		b.toggle_mode = true
		b.pressed.connect(func(): _set_style(s))
		row.add_child(b)
		style_buttons[s] = b
	var b_night := Button.new()
	b_night.text = "День / ніч"
	b_night.pressed.connect(func(): _set_night(not night))
	row.add_child(b_night)
	var b_dbg := Button.new()
	b_dbg.text = "Контури"
	b_dbg.pressed.connect(_toggle_debug)
	row.add_child(b_dbg)
	var b_old := Button.new()
	b_old.text = "Старе демо"
	b_old.pressed.connect(func(): get_tree().change_scene_to_file("res://main.tscn"))
	row.add_child(b_old)
	hud_info = _label()
	hud_info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	hud_info.custom_minimum_size = Vector2(width, 0)
	top.add_child(hud_info)
	talk_btn = Button.new()
	talk_btn.text = "Говорити"
	talk_btn.visible = false
	talk_btn.pressed.connect(_talk)
	talk_btn.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	talk_btn.position = Vector2(-150, -70)
	layer.add_child(talk_btn)
	dialog = PanelContainer.new()
	dialog.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	dialog.position = Vector2(-280, -160)
	dialog.custom_minimum_size = Vector2(560, 90)
	dialog.visible = false
	dialog_text = Label.new()
	dialog_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	dialog_text.custom_minimum_size = Vector2(540, 70)
	dialog.add_child(dialog_text)
	layer.add_child(dialog)
	var hint := _label("WASD / стрілки / стік / тягни пальцем · E або A: говорити · N або Y: день/ніч · 1–3 або LB/RB: стиль · F3: контури")
	hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	hint.custom_minimum_size = Vector2(width, 0)
	hint.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	hint.position = Vector2(12, -30 - (40 if width < 700 else 0))
	layer.add_child(hint)


func _draw_stick() -> void:
	if stick_touch < 0:
		return
	stick_ui.draw_circle(stick_origin, 46, Color(1, 1, 1, 0.18))
	stick_ui.draw_circle(stick_origin + stick * 40, 20, Color(1, 1, 1, 0.45))


func _toggle_debug() -> void:
	debug = not debug
	debug_layer.visible = debug
	debug_layer.queue_redraw()


func _draw_debug() -> void:
	debug_layer.draw_polyline(footprint + PackedVector2Array([footprint[0]]), Color(1, 0.2, 0.2), 2)
	for c in walls.get_children():
		if c is CollisionShape2D:
			var s: Shape2D = c.shape
			if s is SegmentShape2D:
				debug_layer.draw_line(s.a, s.b, Color(0, 1, 1), 3)
			elif s is RectangleShape2D:
				debug_layer.draw_rect(Rect2(c.position - s.size / 2, s.size), Color(0, 1, 1, 0.5), false, 2)
			elif s is CircleShape2D:
				debug_layer.draw_circle(c.position, s.radius, Color(0, 1, 1, 0.3))
		elif c is CollisionPolygon2D:
			debug_layer.draw_polyline(c.polygon + PackedVector2Array([c.polygon[0]]), Color(0, 1, 1), 2)


# --- talking to Prokip -------------------------------------------------------------
func _near_prokip() -> bool:
	return inside and player.position.distance_to(prokip.position) < 1.6 * metre


func _talk() -> void:
	if not _near_prokip() and dialog_i < 0:
		return
	dialog_i += 1
	if dialog_i >= PROKIP_LINES.size():
		dialog_i = -1
		dialog.visible = false
		return
	dialog_text.text = "Дід Прокіп: " + PROKIP_LINES[dialog_i]
	dialog.visible = true


# --- input --------------------------------------------------------------------------
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
			KEY_1: _set_style("drova")
			KEY_2: _set_style("pillars")
			KEY_3: _set_style("bg2")
			KEY_N: _set_night(not night)
			KEY_F3: _toggle_debug()
			KEY_E, KEY_SPACE: _talk()
	elif event is InputEventJoypadButton and event.pressed:
		match event.button_index:
			JOY_BUTTON_A: _talk()
			JOY_BUTTON_Y: _set_night(not night)
			JOY_BUTTON_LEFT_SHOULDER: _set_style(STYLES[(STYLES.find(style) + 2) % 3])
			JOY_BUTTON_RIGHT_SHOULDER: _set_style(STYLES[(STYLES.find(style) + 1) % 3])


func _physics_process(_delta: float) -> void:
	if player == null:
		return
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
	if dialog.visible and v.length() > 0.05:
		dialog_i = -1
		dialog.visible = false
	player.velocity = v * SPEED
	player.move_and_slide()
	_animate_walk(v)


func _process(delta: float) -> void:
	if player == null:
		return
	# inside the hut? the exterior fades away and shows the room
	var now_inside := Geometry2D.is_point_in_polygon(player.position, footprint)
	if now_inside != inside:
		inside = now_inside
		_update_lamps()
	hut_ext_sprite.modulate.a = move_toward(hut_ext_sprite.modulate.a, 0.0 if inside else 1.0, delta * 4.0)
	# whoever is in the hut is seen only from inside it
	prokip.modulate.a = 1.0 - hut_ext_sprite.modulate.a
	# BG2's answer to sorting a building against people: the hut sorts at
	# the front edge of its footprint right where the kobzar stands (the
	# sprite is counter-moved, so only its place in the order changes)
	var fy := _front_y(player.position.x)
	hut_ext.position.y = fy
	hut_ext_sprite.position.y = -fy
	talk_btn.visible = _near_prokip()
	fps_hist.append(Engine.get_frames_per_second())
	if fps_hist.size() > 120:
		fps_hist.pop_front()
	hud_info.text = "%s · %d fps (low %d) · %s · завантаження %s · стиль зібрано за %.0f мс · текстури %.1f МБ%s" % [
		STYLE_NAMES[style], Engine.get_frames_per_second(), int(fps_hist.min()), "ніч" if night else "день",
		("%.1f с" % (load_ms / 1000.0)) if load_ms > 0 else "—", built_ms, style_bytes / 1048576.0,
		" · у хаті" if inside else ""]


## The lowest y of the footprint's outline at x: where its front edge is.
func _front_y(x: float) -> float:
	var best := -INF
	for i in footprint.size():
		var a := footprint[i]
		var b := footprint[(i + 1) % footprint.size()]
		if (x >= minf(a.x, b.x)) and (x <= maxf(a.x, b.x)) and absf(b.x - a.x) > 0.01:
			best = maxf(best, lerpf(a.y, b.y, (x - a.x) / (b.x - a.x)))
	if best == -INF:
		for p in footprint:
			best = maxf(best, p.y)
	return best


## On a phone the canvas is in device pixels (2–3 per CSS pixel), which
## leaves the HUD tiny, and a full-screen PWA puts the status bar and the
## camera notch over its top: scale the content to CSS pixels, and keep the
## HUD below the notch.
func _fit_screen() -> float:
	var sc := DisplayServer.screen_get_scale()
	if sc > 1.0:
		get_window().content_scale_factor = sc
	var mobile := OS.has_feature("web_ios") or OS.has_feature("web_android") or OS.has_feature("mobile")
	return 52.0 if mobile else 10.0
