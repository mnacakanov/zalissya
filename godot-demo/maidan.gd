extends Node2D
## Zalissya's maidan, the game's main scene, in the chosen style
## (Pillars-lite, styles/pillars/). Everything on it comes from one data file,
## zalissya/maidan.json, laid out in metres on the ground (x east, y south,
## the fire at 0, 0), so a collaborator can add or move a building without
## touching this script (or with the level editor, editor.gd). This script
## builds the world (ground, buildings, forests, props, light, the kobzar) and
## makes the game's other scripts: people, state, hud, herbs, sheet, evening,
## work, map.

const DATA := "res://zalissya/maidan.json"
const Editor := preload("res://editor.gd")
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
var fps_l: Label            # the frame rate, small, in the bottom-left corner (always on, for testing on phones)
var fps_t := 0.0
var stick := Vector2.ZERO
var hole_r := 1.3              # metres: the see-through hole round him in a forest (maidan.json "see_through")
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
var extra_rooms: Array[Dictionary] = []   # lower levels (a komora's lyokh), added after the buildings
var portals: Array[Dictionary] = []       # {at, to, r}: step on one, fade, arrive at its 'to'
var portal_armed := true                  # (re-armed once you step off every portal)
var fader: ColorRect
var fading := false
var editing := false                      # the level editor is on (editor.gd): the game pauses
var prop_nodes: Array[Dictionary] = []    # each prop's sprite and its entry, for the editor
var ui_top := 12.0                        # where the HUD starts (lower under the developer's row, ?edit)


func _ready() -> void:
	data = Editor.load_level(DATA)
	style = data.get("style", "pillars")
	layout = JSON.parse_string(FileAccess.get_file_as_string("res://styles/%s/layout.json" % style))
	k = layout.get("scale", 1.0)
	hole_r = float(data.get("see_through", hole_r))
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
	var bl: Array = data.get("buildings", [])
	for bi in bl.size():
		var b: Dictionary = bl[bi]
		var n0 := buildings.size()
		if b.kind == "khata":
			_build_khata(b)
		elif b.kind == "sprite":
			_build_sprite(b)
		else:
			push_warning("maidan.json: a building of unknown kind: %s" % b.get("id", "?"))
		# (the editor finds which entry a building came from)
		if buildings.size() > n0:
			buildings[n0]["src"] = {"list": "buildings", "i": bi}
	buildings.append_array(extra_rooms)
	_build_forests()
	var pl: Array = data.get("props", [])
	for pi in pl.size():
		var p: Dictionary = pl[pi]
		var s := _sprite(p.file, 1.0)
		if s.texture != null:
			s.scale = Vector2.ONE * (float(p.get("metres", 1.0)) * metre / s.texture.get_height())
		s.flip_h = p.get("flip", false)
		s.position = P(p.at[0], p.at[1])
		prop_nodes.append({"fade": s, "rect": _sprite_rect(s), "src": {"list": "props", "i": pi}})
		# a flat thing you walk on (a jetty, lilies on the water) lies on the
		# ground under everyone, not sorted among them by its foot
		if p.get("flat", false):
			ground.add_child(s)
		else:
			world.add_child(s)
	_build_player()
	_build_light()
	# the people of the maidan (people.gd: where they stand, talking to them)
	var people := preload("res://people.gd").new()
	add_child(people)
	people.setup(self)
	# the HUD: where, when, the objective, the title card (hud.gd)
	# the game's state and its save (game_state.gd), then the HUD (hud.gd)
	var state := preload("res://game_state.gd").new()
	add_child(state)
	state.setup(self)
	var hud := preload("res://hud.gd").new()
	add_child(hud)
	hud.setup(self, people, state)
	# the herbs of the meadow, to pick for Vesna (herbs.gd)
	var herbs := preload("res://herbs.gd").new()
	add_child(herbs)
	herbs.setup(self, hud, state)
	# the character sheet: stats, skills, the satchel, the quests (sheet.gd)
	var sheet := preload("res://sheet.gd").new()
	add_child(sheet)
	sheet.setup(self, hud, state)
	hud.sheet = sheet
	# the kobza at the fire, of an evening (evening.gd)
	var evening := preload("res://evening.gd").new()
	add_child(evening)
	evening.setup(self, hud, state)
	hud.evening = evening
	# the khutir's work: fishing, cooking, the forge, brewing, a bath, a wish (work.gd)
	var work := preload("res://work.gd").new()
	add_child(work)
	work.setup(self, hud, state, people, herbs)
	hud.sheet.work = work
	# the map, on parchment (map.gd): M, gamepad Y, or the HUD's button
	var map := preload("res://map.gd").new()
	add_child(map)
	map.setup(self, hud, state, people, herbs)
	debug_layer = Node2D.new()
	debug_layer.z_index = 100
	debug_layer.visible = false
	debug_layer.draw.connect(_draw_debug)
	add_child(debug_layer)
	# the level editor, for whoever opens the game with ?edit (editor.gd)
	if Editor.allowed():
		var ed := Editor.new()
		add_child(ed)
		ed.setup(self)


## a point on the ground, in metres (x east, y south), in scene px
func P(x: float, y: float) -> Vector2:
	return x * east - y * north


## and back: a point of the scene, in metres on the ground
func M(p: Vector2) -> Vector2:
	return Transform2D(east, -north, Vector2.ZERO).affine_inverse() * p


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


## a building's name over its middle, shown with F3 (the outlines)
func _name_tag(inner: Node2D, text: String, foot: PackedVector2Array, off: Vector2) -> Label:
	var l := _label(text)
	l.position = (foot[0] + foot[2]) / 2.0 + off
	l.visible = false
	inner.add_child(l)
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
		var oval := _oval(m.center, m.radius, 0.06)
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
	# other ground: a pond's shore and water, a meadow…, as rough ovals in
	# metres, each its own tile (or a plain colour until its tile is painted);
	# a "solid" one (water) can't be walked into
	for a in data.get("areas", []):
		var ov := _oval(a.center, a.radius, float(a.get("wobble", 0.06)))
		if not _fill(a.get("texture", ""), ov, float(a.get("tile", 7.0))):
			var poly := Polygon2D.new()
			poly.polygon = ov
			poly.color = Color(a.get("color", "#6b6a4a"))
			ground.add_child(poly)
		if a.get("solid", false):
			# (the walkable edge sits a little inside the drawn one: you can
			# stand at the waterline, not on it)
			var inner := _oval(a.center, [a.radius[0] - 0.5, a.radius[1] - 0.5], float(a.get("wobble", 0.06)))
			# a jetty or a ford ("walks": outlines in metres) is cut out of it,
			# so you can walk out over the water to its end
			var pieces: Array = [inner]
			for w in data.get("walks", []):
				var wp := PackedVector2Array()
				for q in w.points:
					wp.append(P(q[0], q[1]))
				var next: Array = []
				for piece in pieces:
					for c in Geometry2D.clip_polygons(piece, wp):
						if not Geometry2D.is_polygon_clockwise(c):
							next.append(c)
				pieces = next
			for piece in pieces:
				var cp := CollisionPolygon2D.new()
				cp.polygon = piece
				walls.add_child(cp)
	for r in data.get("roads", []):
		_strip("ground_road" if r.get("kind", "road") == "road" else "ground_path", r.points, r.width, 5.0)
	for r in data.get("paths", []):
		_strip("ground_path", r.points, r.width, 6.0)


## a rough oval on the ground, in metres: centre [x, y], radius [east-west, north-south]
func _oval(c: Array, r: Array, wob_k: float) -> PackedVector2Array:
	var oval := PackedVector2Array()
	for i in 48:
		var a := TAU * i / 48.0
		var wob := 1.0 + wob_k * sin(3.0 * a + 1.3) + wob_k * 0.66 * sin(5.0 * a)
		oval.append(P(c[0] + cos(a) * r[0] * wob, c[1] + sin(a) * r[1] * wob))
	return oval


## a ground texture lying flat in the world, over a polygon, its edge
## feathered by a wider, fainter copy underneath (false: no such texture)
func _fill(name: String, poly_pts: PackedVector2Array, tile_m: float, rot := 0.0) -> bool:
	if name == "" or not ResourceLoader.exists("res://styles/%s/%s.png" % [style, name]):
		return false
	var tex := _tex(name)
	if tex == null:
		return false
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
	return true


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
	# its own art when it has some (styles/<style>/huts/<art>/: hut.json and
	# the pictures it names), else the style's one hut
	var h: Dictionary = layout.hut
	var dir := ""
	var own := "res://styles/%s/huts/%s/hut.json" % [style, b.get("art", b.id)]
	if ResourceLoader.exists(own) or FileAccess.file_exists(own):
		h = JSON.parse_string(FileAccess.get_file_as_string(own))
		dir = "huts/%s/" % b.get("art", b.id)
	# the walls follow the picture's own footprint, set down with its middle
	# at 'at' (a picture's camera can drift a little from the style's; the
	# house must stand where it is drawn)
	var src := _pts(h.exterior.footprint)
	var foot := PackedVector2Array()
	var shift := P(b.at[0], b.at[1]) - _centroid(src) * k
	for p in src:
		foot.append(p * k + shift)
	var node := Node2D.new()
	world.add_child(node)
	var inner := Node2D.new()   # counter-moved against node (see _process)
	node.add_child(inner)
	var ext := _sprite(dir + h.exterior.file, k)
	ext.position = foot[0] - src[0] * k
	inner.add_child(ext)
	# No room yet (its picture still to come), or none at all (a cellar's
	# mound): a closed house, solid. A mound's door leads down to its cellar.
	if not h.has("interior"):
		var cp := CollisionPolygon2D.new()
		cp.polygon = foot
		walls.add_child(cp)
		if h.has("cellar") and h.has("descend"):
			_build_cellar(b, h, dir, _fit(_pts(h.exterior.footprint), foot))
		var nl := _name_tag(inner, b.get("name", b.id), foot, Vector2(-60, -5.5 * metre))
		buildings.append({"node": node, "inner": inner, "foot": foot, "walk_in": false, "fade": ext, "label": nl,
			"rect": _sprite_rect(ext), "strips": _strips(ext, foot)})
		return
	# The room, on the ground under everything, laid onto the same
	# footprint. A long house can come as several rooms side by side
	# ("parts"), each a picture of its own laid onto its stretch of the door
	# wall ("span": [t0, t1]): a picture generator keeps one room at the
	# style's tilt, but not a long plan of three.
	var pich := Vector2.INF
	var inn: Dictionary = h.interior
	var rooms: Array[Node2D] = []
	if inn.has("parts"):
		for part in inn.parts:
			var sp: Array = part.get("span", [0, 1])
			var l := foot[0].lerp(foot[1], sp[0])
			var f := foot[0].lerp(foot[1], sp[1])
			var p := _lay_room(part, dir, PackedVector2Array([l, f, f + foot[2] - foot[1], l + foot[2] - foot[1]]), inner)
			rooms.append_array(_laid)
			if pich == Vector2.INF:
				pich = p
	else:
		pich = _lay_room(inn, dir, foot, inner)
		rooms.append_array(_laid)
	# the walls along the footprint, with a gap for the door. The door is
	# [t0, t1] along the south wall, or {"wall": "east", "t": [t0, t1]}: in a
	# horseshoe the huts on its arms face the maidan, east or west. The
	# footprint's edges run SW→SE (south), SE→NE (east), NE→NW (north),
	# NW→SW (west).
	var dw := 0
	var dt: Array = []
	if h.door is Dictionary:
		dw = ["south", "east", "north", "west"].find(h.door.get("wall", "south"))
		dt = h.door.t
	else:
		dt = h.door
	var d0: float = dt[0]
	var d1: float = dt[1]
	# the wall's gap is a little wider than the drawn door (0.25 m each side):
	# seen at this camera a door wall runs at a slant, and a door a man fits
	# through in life would catch his round collision on its jambs
	var dlen := foot[dw].distance_to(foot[(dw + 1) % 4])
	var pad := 0.25 * (east.length() + north.length()) / 2.0 / dlen
	d0 = maxf(0.0, d0 - pad)
	d1 = minf(1.0, d1 + pad)
	for i in 4:
		var a := foot[i]
		var c := foot[(i + 1) % 4]
		if i == dw:
			_wall(a, a.lerp(c, d0))
			_wall(a.lerp(c, d1), c)
		else:
			_wall(a, c)
	if h.has("cellar") and h.has("descend"):
		_build_cellar(b, h, dir, _fit(_pts(inn.footprint), foot))
	var name_l := _name_tag(inner, b.get("name", b.id), foot, Vector2(-60, -5.5 * metre))
	var door := foot[dw].lerp(foot[(dw + 1) % 4], (d0 + d1) / 2.0)
	var outward := (door - _centroid(foot)).normalized()
	var entry := {"node": node, "inner": inner, "foot": foot, "walk_in": true, "fade": ext, "label": name_l,
		"rect": _sprite_rect(ext), "door": door + outward * 0.6 * metre, "strips": _strips(ext, foot)}
	if h.get("sunken", false):
		# A sunken room (a lyokh walked into like a hut): its picture shows
		# the pit at its true depth, so it reaches below the house's outline
		# and is shown only as the roof lifts; it is dark down there but for
		# its lamp; and the kobzar's figure goes down by the depth under him.
		var rt := _fit(_pts(inn.footprint), foot)
		entry["sunken_nodes"] = _laid.duplicate()
		entry["dark"] = true
		if h.has("lamp"):
			entry["lamp"] = rt * Vector2(h.lamp[0], h.lamp[1])
		var hs: Array = []
		for r in inn.get("heights", []):
			var q := PackedVector2Array()
			for p in r.quad:
				q.append(rt * Vector2(p[0], p[1]))
			var e := {"quad": q}
			if r.has("foot"):
				e.merge({"foot": rt * Vector2(r.foot[0], r.foot[1]), "top": rt * Vector2(r.top[0], r.top[1]), "from": float(r.from), "to": float(r.to)})
			else:
				e["h"] = float(r.h)
			hs.append(e)
		entry["heights"] = hs
		for n in entry.sunken_nodes:
			n.modulate.a = 0.0
	else:
		entry["pich"] = pich if pich != Vector2.INF else _centroid(foot)
		# The room shows only from inside, or through the house gone
		# see-through: a painted room's far walls can stand taller than the
		# house's own walls, and would poke out round its roof.
		entry["room_nodes"] = rooms
		for n in rooms:
			n.modulate.a = 0.0
	buildings.append(entry)


## A lower level (a komora's lyokh): its own picture and plan (hut.json
## "cellar"), laid out underground, far south of the maidan where only the
## dark is (the 2D game keeps its cave and tunnel in such a band too). You
## go down by stepping onto the hatch and come up by the top of the steps,
## through a fade.
const UNDER := 300.0   # metres south of its building
func _build_cellar(b: Dictionary, h: Dictionary, dir: String, room_t: Transform2D) -> void:
	var cel: Dictionary = h.cellar
	var src := _pts(cel.footprint)
	var foot := PackedVector2Array()
	var shift := P(b.at[0], b.at[1] + UNDER) - _centroid(src) * k
	for p in src:
		foot.append(p * k + shift)
	var node := Node2D.new()
	world.add_child(node)
	var inner := Node2D.new()
	node.add_child(inner)
	_lay_room(cel, dir, foot, inner)
	# its walls, with a gap where steps come in ("gap": {wall, t}, as a door)
	var gw := -1
	var gt := [0.0, 0.0]
	if cel.has("gap"):
		gw = ["south", "east", "north", "west"].find(cel.gap.wall)
		gt = cel.gap.t
	for i in 4:
		if i == gw:
			_wall(foot[i], foot[i].lerp(foot[(i + 1) % 4], gt[0]))
			_wall(foot[i].lerp(foot[(i + 1) % 4], gt[1]), foot[(i + 1) % 4])
		else:
			_wall(foot[i], foot[(i + 1) % 4])
	var ct := _fit(src, foot)
	var v := func(a: Array) -> Vector2: return ct * Vector2(a[0], a[1])
	var hv := func(a: Array) -> Vector2: return room_t * Vector2(a[0], a[1])
	var r := 0.45 * metre
	portals.append({"at": hv.call(h.descend.at), "to": v.call(cel.arrive), "r": r})
	portals.append({"at": v.call(cel.up), "to": hv.call(h.descend.out), "r": r})
	# steps you walk on: where they are, and how high you stand on them
	var stairs := {}
	if cel.has("stairs"):
		var q := PackedVector2Array()
		for p in cel.stairs.quad:
			q.append(v.call(p))
		stairs = {"quad": q, "foot": v.call(cel.stairs.foot), "top": v.call(cel.stairs.top), "rise": float(cel.stairs.rise)}
	var nm: String = cel.get("name", "Льох")
	var lbl := _name_tag(inner, nm, foot, Vector2(-30, -3.0 * metre))
	extra_rooms.append({"node": node, "inner": inner, "foot": foot, "walk_in": true, "label": lbl,
		"name": nm, "underground": true, "lamp": v.call(cel.get("lamp", [0, -100])), "stairs": stairs})


## One room picture laid onto its stretch of the house: its walls inside
## ([x1, y1, x2, y2], e.g. the siny's partitions), its furniture and its
## pich, all in the picture's own pixels. Returns where the pich is (INF:
## none).
var _laid: Array[Node2D] = []   # the nodes the last _lay_room made (room, front)
func _lay_room(inn: Dictionary, dir: String, dst: PackedVector2Array, over: Node2D) -> Vector2:
	var room := Node2D.new()
	_laid = [room]
	room.transform = _fit(_pts(inn.footprint), dst)
	ground.add_child(room)
	room.add_child(_sprite(dir + inn.file, 1.0))
	# The room lies on the ground, under the kobzar; but its near walls, cut
	# knee-high, must hide his legs when he stands behind them. A mask (the
	# model renders it: tools/model/) picks those walls out of the same
	# picture, and that part is drawn again with the building, which sorts
	# by its front edge, under the exterior (which covers it from outside).
	if inn.has("front") and ResourceLoader.exists("res://styles/%s/%s%s.png" % [style, dir, inn.front]):
		var fr := _sprite(dir + inn.file, 1.0)
		var sm := ShaderMaterial.new()
		sm.shader = _mask_shader()
		sm.set_shader_parameter("mask", _tex(dir + inn.front))
		fr.material = sm
		fr.transform = room.transform * fr.transform
		_laid.append(fr)
		over.add_child(fr)
		over.move_child(fr, 0)
	for w in inn.get("walls", []):
		_wall(room.transform * Vector2(w[0], w[1]), room.transform * Vector2(w[2], w[3]))
	for r in inn.get("solids", []):
		var c := Vector2(r[0], r[1])
		var hw := Vector2(r[2] / 2.0, 0)
		var hh := Vector2(0, r[3] / 2.0)
		var poly := CollisionPolygon2D.new()
		poly.polygon = PackedVector2Array([room.transform * (c - hw - hh), room.transform * (c + hw - hh), room.transform * (c + hw + hh), room.transform * (c - hw + hh)])
		walls.add_child(poly)
	# furniture as outlines on the floor, in the picture's pixels (a model's
	# plan gives them exactly, tools/model/)
	for poly_pts in inn.get("polys", []):
		var cp := CollisionPolygon2D.new()
		var pp := PackedVector2Array()
		for q in poly_pts:
			pp.append(room.transform * Vector2(q[0], q[1]))
		cp.polygon = pp
		walls.add_child(cp)
	if not inn.has("pich"):
		return Vector2.INF
	var cs := CollisionShape2D.new()
	var sh := CircleShape2D.new()
	sh.radius = 0.45 * metre
	cs.shape = sh
	cs.position = room.transform * Vector2(inn.pich[0], inn.pich[1])
	walls.add_child(cs)
	return cs.position


var _sway_sh: Shader
func _sway_shader() -> Shader:
	if _sway_sh == null:
		_sway_sh = Shader.new()
		_sway_sh.code = """shader_type canvas_item;
uniform float amount = 6.0;
uniform float phase = 0.0;
// a see-through hole round the kobzar, when this tree stands in front of
// him: in a forest, crown over crown, fading whole trees is not enough
uniform vec2 hole_center = vec2(0.0);
uniform float hole_r = 0.0;
uniform float hole_on = 0.0;
varying vec2 world_pos;
void vertex() {
	// the top of the picture moves most, its foot not at all
	float h = 1.0 - UV.y;
	VERTEX.x += (sin(TIME * 1.1 + phase) * 0.7 + sin(TIME * 2.3 + phase * 1.7) * 0.3) * amount * h * h;
	world_pos = (MODEL_MATRIX * vec4(VERTEX, 0.0, 1.0)).xy;
}
void fragment() {
	COLOR = texture(TEXTURE, UV) * COLOR;
	if (hole_on > 0.0) {
		// an upright oval, a little taller than wide, soft at its edge
		vec2 d = (world_pos - hole_center) / vec2(hole_r, hole_r * 1.35);
		float k = smoothstep(0.55, 1.0, length(d));
		COLOR.a *= mix(1.0, mix(0.12, 1.0, k), hole_on);
	}
}"""
	return _sway_sh


var _mask_sh: Shader
func _mask_shader() -> Shader:
	if _mask_sh == null:
		_mask_sh = Shader.new()
		_mask_sh.code = """shader_type canvas_item;
uniform sampler2D mask : filter_linear;
void fragment() {
	COLOR = texture(TEXTURE, UV);
	COLOR.a *= texture(mask, UV).a;
}"""
	return _mask_sh


## a building with its own art (not walk-in): the PNG's footprint
## [left, front, right] (sprite px from its bottom centre, as in a style's
## layout.json) is laid onto the ground at 'at', 'size' metres; the art is
## drawn at the style's density, so a picture at 88 px a metre fits
func _build_sprite(b: Dictionary) -> void:
	# "turned": the thing stands a quarter-turn round (a bench along the road
	# instead of across it). The camera looks at east and south almost
	# alike, so the mirrored picture is the turned thing: its footprint
	# swaps its sides, and the picture's ground corners come mirrored, in
	# the other order (its right corner is now its left).
	var turned: bool = b.get("turned", false)
	var size: Array = b.get("size", [2, 2])
	if turned:
		size = [size[1], size[0]]
	var foot := _rect(b.at, size)
	var src := _pts(b.footprint)
	if turned:
		src = PackedVector2Array([Vector2(-src[2].x, src[2].y), Vector2(-src[1].x, src[1].y), Vector2(-src[0].x, src[0].y)])
	var node := Node2D.new()
	world.add_child(node)
	var inner := Node2D.new()
	node.add_child(inner)
	# a tree of the forest may come scaled and mirrored: the picture and its
	# footprint together (mirrored about its trunk)
	var sc: float = b.get("scale", 1.0)
	var spr := _sprite(b.file, k * sc)
	if turned:
		spr.flip_h = true
	elif b.get("flip", false):
		spr.flip_h = true
		var bx := (src[0].x + src[2].x) / 2.0
		for i in src.size():
			src[i].x -= 2.0 * bx
		spr.offset.x = -spr.texture.get_width() / 2.0 if spr.texture != null else 0.0
	spr.position = foot[0] - src[0] * k * sc
	inner.add_child(spr)
	var name_l := _name_tag(inner, b.get("name", b.id), foot, Vector2(-50, -4.0 * metre))
	if b.get("solid", true):
		var cp := CollisionPolygon2D.new()
		cp.polygon = foot
		walls.add_child(cp)
	# trees sway in the wind: the crown moves, the foot of the picture stays
	if b.get("sway", 0.0) > 0.0 and spr.texture != null:
		var sm := ShaderMaterial.new()
		sm.shader = _sway_shader()
		sm.set_shader_parameter("amount", float(b.sway) * metre * 0.12)
		sm.set_shader_parameter("phase", fmod(foot[0].x * 0.013 + foot[0].y * 0.007, TAU))
		sm.set_shader_parameter("hole_on", 0.0)
		spr.material = sm
	var entry := {"node": node, "inner": inner, "foot": foot, "walk_in": false, "label": name_l,
		"id": b.id, "fade": spr, "rect": _sprite_rect(spr)}
	if spr.material is ShaderMaterial and spr.material.shader == _sway_shader():
		entry["hole"] = spr.material
	elif b.get("strips", true):
		entry["strips"] = _strips(spr, foot)
	buildings.append(entry)


## The forests (maidan.json "forests"): each an outline in metres filled
## with trees from a catalog of flat painted trees (styles/<style>/trees/
## flat/catalog.json: each picture's file and trunk footprint), at a
## spacing, by kind weights, each a little larger or smaller, some mirrored.
## Scattered on a jittered grid, seeded, so the forest is the same every
## time; never on a building, the maidan, a road or a path.
func _build_forests() -> void:
	var forests: Array = data.get("forests", [])
	if forests.is_empty():
		return
	var cat_path := "res://styles/%s/trees/flat/catalog.json" % style
	if not FileAccess.file_exists(cat_path):
		push_warning("no tree catalog: " + cat_path)
		return
	var cat: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(cat_path))
	# where trees may not stand: the buildings (and a margin round them),
	# the maidan, the roads and paths
	var keep_out: Array[PackedVector2Array] = []
	for b in buildings:
		for o in Geometry2D.offset_polygon(b.foot, 2.0 * metre):
			keep_out.append(o)
	if ground.has_meta("oval"):
		keep_out.append(ground.get_meta("oval"))
	var lanes: Array = []
	for r in data.get("roads", []) + data.get("paths", []):
		var pts := PackedVector2Array()
		for q in r.points:
			pts.append(P(q[0], q[1]))
		lanes.append([pts, (float(r.width) / 2.0 + 1.5) * (east.length() + north.length()) / 2.0])
	# the painted trees are drawn at their real 10–15 m, which dwarfs the huts
	# and the kobzar at this camera; games shrink trees, and so do we
	# (maidan.json "tree_scale")
	var tree_k: float = data.get("tree_scale", 1.0)
	var n := 0
	for f in forests:
		var rnd := RandomNumberGenerator.new()
		rnd.seed = int(f.get("seed", 1))
		var outline := PackedVector2Array()
		var lo := Vector2(INF, INF)
		var hi := Vector2(-INF, -INF)
		for q in f.outline:
			outline.append(P(q[0], q[1]))
			lo = Vector2(minf(lo.x, q[0]), minf(lo.y, q[1]))
			hi = Vector2(maxf(hi.x, q[0]), maxf(hi.y, q[1]))
		var kinds: Dictionary = f.kinds
		var total := 0.0
		for kd in kinds:
			total += float(kinds[kd])
		var step: float = f.get("spacing", 5.0)
		var y := lo.y
		while y <= hi.y:
			var x := lo.x
			while x <= hi.x:
				var mx := x + rnd.randf_range(-0.4, 0.4) * step
				var my := y + rnd.randf_range(-0.4, 0.4) * step
				x += step
				var at := P(mx, my)
				if not Geometry2D.is_point_in_polygon(at, outline):
					continue
				var blocked := false
				for o in keep_out:
					if Geometry2D.is_point_in_polygon(at, o):
						blocked = true
						break
				if not blocked:
					for ln in lanes:
						var pts: PackedVector2Array = ln[0]
						for i in pts.size() - 1:
							if Geometry2D.get_closest_point_to_segment(at, pts[i], pts[i + 1]).distance_to(at) < ln[1]:
								blocked = true
								break
						if blocked:
							break
				if blocked:
					continue
				# which kind, then which of its pictures
				var pick := rnd.randf() * total
				var kind := ""
				for kd in kinds:
					pick -= float(kinds[kd])
					if pick <= 0.0:
						kind = kd
						break
				if kind == "" or not cat.has(kind):
					continue
				var pics: Array = cat[kind]
				var pic: Dictionary = pics[rnd.randi() % pics.size()]
				_build_sprite({"id": "tree", "name": f.get("name", "Ліс"), "file": pic.file, "at": [mx, my],
					"size": pic.size, "footprint": pic.footprint, "sway": 1.0,
					"scale": rnd.randf_range(0.8, 1.15) * float(pic.get("px_scale", 1.0)) * tree_k, "flip": rnd.randf() < 0.5})
				n += 1
			y += step * 0.87   # (rows a little closer than the columns: a looser, less gridded look)


## Does a building's picture really cover this point (not just its canvas's
## empty corners)? Looks up the picture's own alpha there.
func _covers(b: Dictionary, at: Vector2) -> bool:
	var r: Rect2 = b.rect
	if not r.has_point(at):
		return false
	var spr = b.fade
	if not (spr is Sprite2D) or spr.texture == null:
		return true   # (no picture: its box is its shape)
	if not b.has("alpha"):
		var src: Texture2D = spr.texture
		if src is CanvasTexture:
			src = src.diffuse_texture
		var img := src.get_image()
		if img == null:
			b["alpha"] = null
		else:
			if img.is_compressed():
				img.decompress()
			b["alpha"] = img
	var img: Image = b.alpha
	if img == null:
		return true
	var uv := (at - r.position) / r.size
	var px := Vector2i(clampi(int(uv.x * img.get_width()), 0, img.get_width() - 1), clampi(int(uv.y * img.get_height()), 0, img.get_height() - 1))
	return img.get_pixelv(px).a > 0.5


## A building's picture cut into narrow upright strips, each sorted by the
## front edge of the footprint right under it. One picture can only have
## one place in the drawing order, and a house is wide: whatever stands by
## it (Radek at his forge's door, a sawhorse at a khata's corner) is in
## front of one part of it and behind another. Strips let everyone, not only
## the kobzar, stand right against every part of the house. The picture
## itself stays (hidden) for its size, its outline and its fading, which the
## strips copy each frame.
const STRIP_PX := 14.0   # scene px a strip is wide
func _strips(spr: Sprite2D, foot: PackedVector2Array) -> Node2D:
	var tex := spr.texture
	if tex == null:
		return null
	var sc := spr.scale.x
	var w := tex.get_width()
	var h := tex.get_height()
	var left := spr.position.x + spr.offset.x * sc
	var top := spr.position.y + spr.offset.y * sc
	var fx0 := INF
	var fx1 := -INF
	for p in foot:
		fx0 = minf(fx0, p.x)
		fx1 = maxf(fx1, p.x)
	var root := Node2D.new()
	root.y_sort_enabled = true
	world.add_child(root)
	var cw := maxi(2, int(STRIP_PX / sc))
	for c in range(0, w, cw):
		var tw := mini(cw, w - c)
		var cx := left + (c + tw / 2.0) * sc
		var fy := _front_y(foot, clampf(cx, fx0 + 0.5, fx1 - 0.5))
		var holder := Node2D.new()
		holder.position = Vector2(0, fy)
		root.add_child(holder)
		var s := Sprite2D.new()
		s.texture = tex
		s.centered = false
		s.region_enabled = true
		s.region_rect = Rect2(w - c - tw if spr.flip_h else c, 0, tw, h)
		s.flip_h = spr.flip_h
		s.scale = spr.scale
		s.material = spr.material
		s.position = Vector2(left + c * sc, top - fy)
		holder.add_child(s)
	spr.visible = false
	return root


## where a sprite covers the scene, to tell when it hides the kobzar
func _sprite_rect(spr: Sprite2D) -> Rect2:
	if spr.texture == null:
		return Rect2()
	var sz := spr.texture.get_size() * spr.scale
	return Rect2(spr.position + spr.offset * spr.scale, sz)


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
		if b.has("lamp"):
			# the oil lamp in its niche: the only light down there
			_lamp(b.lamp, 1.6, Color(1.0, 0.72, 0.4), i).set_meta("always", true)
		elif b.has("pich"):
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
	var under := _underground()
	for l in lamps:
		var hut: int = l.get_meta("hut")
		var always: bool = l.get_meta("always", false)
		var lit := (always and hut == inside_of) or (not always and night and not under and (hut < 0 or hut == inside_of))
		l.enabled = lit
		l.energy = (1.1 if hut >= 0 else 0.8) if lit else 0.0
	# underground (or in a sunken cellar) it is dark at any hour, but for its lamp
	var dark: bool = under or (inside_of >= 0 and buildings[inside_of].get("dark", false))
	shade.color = Color(0.22, 0.2, 0.24) if dark else (Color(0.3, 0.33, 0.52) if night else Color(1, 1, 1))
	sun.enabled = not night and not dark
	# (and round it nothing but the earth's dark, not the sky's colour)
	RenderingServer.set_default_clear_color(Color(0.03, 0.025, 0.02) if under else Color(0.2, 0.3, 0.15))


func _underground() -> bool:
	return inside_of >= 0 and buildings[inside_of].get("underground", false)


func _set_night(on: bool) -> void:
	night = on
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
	# far enough out to see the maidan round him (maidan.json "zoom")
	var z: float = data.get("zoom", 0.6)
	cam.zoom = Vector2(z, z)
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
## Is the screen upright (taller than wide)? Then everything takes its phone
## layout: the HUD's buttons under its card, the sheets edge to edge, the talk
## along the bottom. Checked afresh whenever the screen turns or resizes.
func portrait() -> bool:
	var vw := get_viewport().get_visible_rect().size
	return vw.y > vw.x


## The UI's scale: the screen's own (a phone's device pixels per CSS pixel),
## and upright never less than a phone's width of about 430 points, so the
## buttons stay thumb-sized even where the browser reports no scale (inside
## itch.io's frame, say). Kept up to date as the screen turns.
func _fit_scale() -> void:
	var ws := Vector2(get_window().size)
	var sc := maxf(1.0, DisplayServer.screen_get_scale())
	if ws.y > ws.x:
		sc = maxf(sc, ws.x / 430.0)
	if absf(get_window().content_scale_factor - sc) > 0.01:
		get_window().content_scale_factor = sc


func _build_ui() -> void:
	_fit_scale()
	get_window().size_changed.connect(_fit_scale)
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
	# the fade between levels (a komora and its lyokh)
	fader = ColorRect.new()
	fader.color = Color(0, 0, 0, 0)
	fader.set_anchors_preset(Control.PRESET_FULL_RECT)
	fader.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(fader)
	fps_l = _label()
	fps_l.add_theme_font_size_override("font_size", 13)
	fps_l.add_theme_constant_override("outline_size", 4)
	fps_l.modulate.a = 0.8
	fps_l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	fps_l.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	fps_l.offset_left = 10
	fps_l.offset_top = -26
	fps_l.offset_bottom = -6
	layer.add_child(fps_l)
	hud_info = _label()
	hud_info.visible = false   # (the developer's line: fps and metres, with F3)
	# the developer's switches (outlines, day and night, zoom, the keys) are for
	# whoever opens the game with ?edit, not for players
	if Editor.allowed():
		ui_top = 56.0
	else:
		hud_info.position = Vector2(12, 150)
		layer.add_child(hud_info)
		return
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
	top.add_child(hud_info)
	var hint := _label("WASD / стрілки / стік / тягни пальцем · N: день/ніч · M або Y: мапа · F3: контури й назви · −/= або коліщатко: масштаб")
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
	hud_info.visible = debug
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
	if editing and (event is InputEventScreenTouch or event is InputEventScreenDrag):
		return   # (the editor pans and drags with the finger)
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
			KEY_N: if Editor.allowed(): _set_night(not night)
			KEY_MINUS: _zoom(0.8)
			KEY_EQUAL: _zoom(1.25)
	elif event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_DOWN: _zoom(0.9)
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP: _zoom(1.1)


## where WASD or the arrows point
func _keys_dir() -> Vector2:
	var v := Vector2.ZERO
	if Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP): v.y -= 1
	if Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN): v.y += 1
	if Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT): v.x -= 1
	if Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT): v.x += 1
	return v


func _physics_process(_delta: float) -> void:
	if editing:
		# the editor's free camera: he floats through walls, faster when zoomed out
		player.position += _keys_dir().limit_length(1.0) * SPEED * 3.0 / cam.zoom.x * _delta
		return
	var v := _keys_dir()
	var joy := Vector2(Input.get_joy_axis(0, JOY_AXIS_LEFT_X), Input.get_joy_axis(0, JOY_AXIS_LEFT_Y))
	if joy.length() > 0.2:
		v += joy
	v += stick
	v = v.limit_length(1.0)
	if fading:
		v = Vector2.ZERO
	player.velocity = v * SPEED
	player.move_and_slide()
	_animate_walk(v)
	_check_portals()


## Step onto a hatch or the top of the steps: a fade, and you arrive at the
## other level. A portal fires again only after you have stepped off.
func _check_portals() -> void:
	if fading:
		return
	var on: Dictionary = {}
	for p in portals:
		if player.position.distance_to(p.at) < p.r:
			on = p
	if on.is_empty():
		portal_armed = true
		return
	if not portal_armed:
		return
	portal_armed = false
	fading = true
	var tw := create_tween()
	tw.tween_property(fader, "color:a", 1.0, 0.25)
	tw.tween_callback(func():
		player.position = on.to
		cam.reset_smoothing())
	tw.tween_interval(0.1)
	tw.tween_property(fader, "color:a", 0.0, 0.3)
	tw.tween_callback(func(): fading = false)


func _process(delta: float) -> void:
	var now_in := -1
	for i in buildings.size():
		var b: Dictionary = buildings[i]
		var foot: PackedVector2Array = b.foot
		if b.walk_in and (Geometry2D.is_point_in_polygon(player.position, foot) \
				or (not b.get("stairs", {}).is_empty() and Geometry2D.is_point_in_polygon(player.position, b.stairs.quad))):
			now_in = i   # (a cellar's steps run out past its wall: they count as inside)
		# each building sorts at the front edge of its footprint right where
		# the kobzar stands (the art is counter-moved, so only its place in
		# the order changes)
		var fy := _front_y(foot, player.position.x)
		b.node.position.y = fy
		b.inner.position.y = -fy
		if b.has("fade"):
			# inside it, it lifts away; behind it (its picture over him and
			# its front edge below his feet), it turns see-through, the way
			# isometric games let you walk behind a house to its far door
			var behind := player.position.y < fy and _covers(b, player.position + Vector2(0, -0.8 * metre))
			var target := 0.0 if now_in == i else (0.35 if behind else 1.0)
			if b.has("hole"):
				# a tree: a hole round him instead, whenever any of its picture
				# could cover him, and only a light fade of the whole tree
				var chest := player.position + Vector2(0, -0.9 * metre)
				var near: bool = player.position.y < fy and b.rect.grow(hole_r * metre).has_point(chest)
				var mat: ShaderMaterial = b.hole
				var on: float = mat.get_shader_parameter("hole_on")
				var to := 1.0 if near else 0.0
				if on != to or near:
					mat.set_shader_parameter("hole_on", move_toward(on, to, delta * 5.0))
					mat.set_shader_parameter("hole_center", player.global_position + Vector2(0, -0.9 * metre))
					mat.set_shader_parameter("hole_r", hole_r * metre)
				target = 0.8 if behind else 1.0
			b.fade.modulate.a = move_toward(b.fade.modulate.a, target, delta * 4.0)
			if b.get("strips") != null:
				b.strips.modulate = b.fade.modulate
			# (and the pit itself shows only from inside, not through a roof
			# gone see-through as he walks behind it)
			for n in b.get("sunken_nodes", []):
				n.modulate.a = move_toward(n.modulate.a, 1.0 if now_in == i else 0.0, delta * 4.0)
			for n in b.get("room_nodes", []):
				n.modulate.a = move_toward(n.modulate.a, 1.0 if now_in == i or behind else 0.0, delta * 4.0)
	if now_in != inside_of:
		inside_of = now_in
		_update_lamps()
	# on a flight of steps he stands higher: up by the step under his feet
	var lift := 0.0
	if inside_of >= 0 and not buildings[inside_of].get("stairs", {}).is_empty():
		var st: Dictionary = buildings[inside_of].stairs
		if Geometry2D.is_point_in_polygon(player.position, st.quad):
			var run: Vector2 = st.top - st.foot
			var t := clampf((player.position - st.foot).dot(run) / run.length_squared(), 0.0, 1.0)
			lift = t * st.rise * metre
	# in a sunken room he stands as deep as the floor (or the step) under him
	if inside_of >= 0 and buildings[inside_of].has("heights"):
		for r in buildings[inside_of].heights:
			if Geometry2D.is_point_in_polygon(player.position, r.quad):
				if r.has("foot"):
					var run2: Vector2 = r.top - r.foot
					var t2 := clampf((player.position - r.foot).dot(run2) / run2.length_squared(), 0.0, 1.0)
					lift = lerpf(r.from, r.to, t2) * metre
				else:
					lift = r.h * metre
				break
	if player_anim != null:
		player_anim.position.y = -lift
	if fire != null and fire.enabled:
		var t := Time.get_ticks_msec() * 0.001
		fire.energy = 1.0 + 0.12 * sin(t * 9.0) + 0.08 * sin(t * 23.0 + 1.0)
	fps_t += delta
	if fps_l != null and fps_t >= 0.5:
		fps_t = 0.0
		fps_l.text = "%d fps" % Engine.get_frames_per_second()
	if not debug:
		return
	# the developer's line (F3): fps, the time of day, where he stands
	fps_hist.append(Engine.get_frames_per_second())
	if fps_hist.size() > 120:
		fps_hist.pop_front()
	var m := M(player.position)
	hud_info.text = "Залісся · майдан · %d fps (low %d) · %s · %.1f, %.1f м%s" % [
		Engine.get_frames_per_second(), int(fps_hist.min()), "ніч" if night else "день", m.x, m.y,
		(" · " + _room_name(inside_of)) if inside_of >= 0 else ""]


func _room_name(i: int) -> String:
	if buildings[i].has("name"):
		return buildings[i].name
	return data.buildings[i].get("name", "") if i < data.buildings.size() else ""


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
