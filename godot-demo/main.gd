extends Node2D
## Zalissya in Godot — a technical demo, not the game.
##
## It answers one question: can a BG2-style 2D game (a painted background
## streamed as tiles, sprites sorted by their feet, "wall" overlays that hide
## whoever walks behind a building, light by time of day) run from GitHub
## Pages, on phones too? The art is baked from the current procedural game
## (tools/bake-entry.ts) as a stand-in for painted art. Everything is built
## from art/data.json here, so the scene file stays empty.

const ART := "res://art/"
const S := 0.5  # the art is baked at 2 px per world px
const SPEED := 175.0
const PLAYER_R := 13.0

var data: Dictionary
var world: Node2D
var player: CharacterBody2D
var player_sprite: AnimatedSprite2D
var npcs: Array = []
var shade: CanvasModulate
var lights: Array[PointLight2D] = []
var info: Label
var hint: Label
var stick := Vector2.ZERO
var stick_touch := -1
var stick_origin := Vector2.ZERO
var stick_ui: Control
var playing := false
var hour_i := 0
const HOURS := [[8, "08:00"], [13, "13:00"], [19, "19:00"], [23, "23:00"]]
var fps_hist: Array[float] = []
var load_ms := -1.0
var save_note := ""
var saved_pos := Vector2(-1, -1)
var first_frame := true


func _ready() -> void:
	data = JSON.parse_string(FileAccess.get_file_as_string(ART + "data.json"))
	_build_background()
	world = Node2D.new()
	world.y_sort_enabled = true
	add_child(world)
	_build_collision()
	_build_overlays()
	_build_trees()
	_build_people()
	_build_light()
	_build_ui()
	_read_old_save()
	_set_hour(0)
	if OS.has_feature("web"):
		load_ms = float(JavaScriptBridge.eval("performance.now()", true))


# --- the painted background, in tiles -------------------------------------------
func _build_background() -> void:
	var bg := Node2D.new()
	bg.z_index = -10
	add_child(bg)
	# (the tiles are named by their world position, 840×420 each, the way
	# tools/bake-entry.ts cut them; an exported build cannot list res://)
	var R: Dictionary = data.region
	for ty in range(0, int(R.h), 420):
		for tx in range(0, int(R.w), 840):
			var spr := Sprite2D.new()
			spr.texture = load(ART + "bg_%d_%d.png" % [tx, ty])
			spr.centered = false
			spr.scale = Vector2(S, S)
			spr.position = Vector2(tx, ty)
			bg.add_child(spr)


# --- where you cannot walk: the same rectangles the game uses, and the pond ------
func _build_collision() -> void:
	var body := StaticBody2D.new()
	add_child(body)
	for r in data.solids:
		var cs := CollisionShape2D.new()
		var shape := RectangleShape2D.new()
		shape.size = Vector2(r.w, r.h)
		cs.shape = shape
		cs.position = Vector2(r.x + r.w / 2.0, r.y + r.h / 2.0)
		body.add_child(cs)
	var pond := CollisionPolygon2D.new()
	var pts := PackedVector2Array()
	for p in data.pond:
		pts.append(Vector2(p.x, p.y))
	pond.polygon = pts
	body.add_child(pond)
	# the edges of the demo's piece of the world
	var R: Dictionary = data.region
	for edge in [Rect2(-20, -20, R.w + 40, 20), Rect2(-20, R.h, R.w + 40, 20), Rect2(-20, 0, 20, R.h), Rect2(R.w, 0, 20, R.h)]:
		var cs2 := CollisionShape2D.new()
		var sh := RectangleShape2D.new()
		sh.size = edge.size
		cs2.shape = sh
		cs2.position = edge.position + edge.size / 2.0
		body.add_child(cs2)


# --- BG2-style overlays: each building painted again on its own, sorted at
# its front edge, so whoever stands behind it is hidden by it ---------------------
func _build_overlays() -> void:
	for o in data.overlays:
		var holder := Node2D.new()
		holder.position = Vector2(0, o.baseY)
		var spr := Sprite2D.new()
		spr.texture = load(ART + "ov_%s.png" % o.name)
		spr.centered = false
		spr.scale = Vector2(S, S)
		spr.position = Vector2(o.x, o.y - o.baseY)
		holder.add_child(spr)
		world.add_child(holder)


func _build_trees() -> void:
	for t in data.trees:
		var holder := Node2D.new()
		holder.position = Vector2(t.x, t.y)
		var spr := Sprite2D.new()
		spr.texture = load(ART + "tree_%s.png" % t.key)
		spr.centered = false
		spr.scale = Vector2(S * t.s, S * t.s)
		spr.position = Vector2(-100.0 * t.s, -180.0 * t.s)
		holder.add_child(spr)
		world.add_child(holder)
		# the trunk is solid
		var body := StaticBody2D.new()
		var cs := CollisionShape2D.new()
		var sh := RectangleShape2D.new()
		sh.size = Vector2(20, 14)
		cs.shape = sh
		cs.position = Vector2(0, -1)
		body.add_child(cs)
		holder.add_child(body)


# --- people: animated sprites, feet at their origin -------------------------------
func _frames(who: String) -> SpriteFrames:
	var sf := SpriteFrames.new()
	sf.add_animation("walk")
	sf.set_animation_speed("walk", 12)
	for i in 8:
		sf.add_frame("walk", load(ART + "%s_walk%d.png" % [who, i]))
	sf.add_animation("idle")
	sf.add_frame("idle", load(ART + "%s_idle.png" % who))
	if who == "kobzar":
		sf.add_animation("play")
		sf.set_animation_speed("play", 8)
		for i in 6:
			sf.add_frame("play", load(ART + "kobzar_play%d.png" % i))
	sf.remove_animation("default")
	return sf


func _person(who: String, pos: Vector2) -> AnimatedSprite2D:
	var spr := AnimatedSprite2D.new()
	spr.sprite_frames = _frames(who)
	spr.centered = false
	spr.scale = Vector2(S, S)
	spr.offset = Vector2(-64, -152)
	spr.play("idle")
	return spr


func _build_people() -> void:
	player = CharacterBody2D.new()
	player.motion_mode = CharacterBody2D.MOTION_MODE_FLOATING
	player.position = Vector2(data.start.x, data.start.y)
	var cs := CollisionShape2D.new()
	var sh := CircleShape2D.new()
	sh.radius = PLAYER_R
	cs.shape = sh
	cs.position = Vector2(0, -6)
	player.add_child(cs)
	player_sprite = _person("kobzar", Vector2.ZERO)
	player.add_child(player_sprite)
	var cam := Camera2D.new()
	cam.limit_left = 0
	cam.limit_top = 0
	cam.limit_right = int(data.region.w)
	cam.limit_bottom = int(data.region.h)
	cam.position_smoothing_enabled = true
	player.add_child(cam)
	world.add_child(player)
	for n in data.npcs:
		var holder := Node2D.new()
		holder.position = Vector2(n.x, n.y)
		var spr := _person(n.name, Vector2.ZERO)
		holder.add_child(spr)
		world.add_child(holder)
		npcs.append({"node": holder, "spr": spr, "home": holder.position, "to": holder.position, "wait": randf() * 2.0})


# --- light: a colour over everything by the hour, and lamps that show at night ---
func _light_texture() -> GradientTexture2D:
	var g := Gradient.new()
	g.set_color(0, Color(1, 1, 1, 1))
	g.set_color(1, Color(1, 1, 1, 0))
	var tex := GradientTexture2D.new()
	tex.gradient = g
	tex.fill = GradientTexture2D.FILL_RADIAL
	tex.fill_from = Vector2(0.5, 0.5)
	tex.fill_to = Vector2(1.0, 0.5)
	tex.width = 256
	tex.height = 256
	return tex


func _build_light() -> void:
	shade = CanvasModulate.new()
	add_child(shade)
	var tex := _light_texture()
	var spots: Array = [[Vector2(data.fire.x, data.fire.y), 1.7, Color(1.0, 0.62, 0.3)]]
	for h in data.houses:
		if h.id == "pustka":
			continue  # nobody lights a lamp in the empty hut
		spots.append([Vector2(h.x + h.w * 0.25, h.y + h.h - 20), 0.5, Color(1.0, 0.75, 0.45)])
		spots.append([Vector2(h.x + h.w * 0.75, h.y + h.h - 20), 0.5, Color(1.0, 0.75, 0.45)])
	for s in spots:
		var l := PointLight2D.new()
		l.texture = tex
		l.position = s[0]
		l.texture_scale = s[1] * 1.6
		l.color = s[2]
		add_child(l)
		lights.append(l)


func _set_hour(i: int) -> void:
	hour_i = i % HOURS.size()
	var h: int = HOURS[hour_i][0]
	var col := Color(1, 1, 1)
	var lamp := 0.0
	if h == 19:
		col = Color(1.0, 0.82, 0.68)
		lamp = 0.6
	elif h == 23:
		col = Color(0.32, 0.36, 0.55)
		lamp = 1.4
	shade.color = col
	for l in lights:
		l.energy = lamp
		l.visible = lamp > 0.0


# --- the HUD: what the demo is measuring, and the buttons ---------------------------
func _build_ui() -> void:
	var top_m := _fit_screen()
	var layer := CanvasLayer.new()
	add_child(layer)
	stick_ui = Control.new()
	stick_ui.set_anchors_preset(Control.PRESET_FULL_RECT)
	stick_ui.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stick_ui.draw.connect(_draw_stick)
	layer.add_child(stick_ui)
	info = Label.new()
	info.position = Vector2(12, top_m)
	info.add_theme_color_override("font_color", Color(1, 0.97, 0.88))
	info.add_theme_color_override("font_outline_color", Color(0.1, 0.07, 0.04))
	info.add_theme_constant_override("outline_size", 5)
	layer.add_child(info)
	hint = Label.new()
	hint.add_theme_color_override("font_color", Color(1, 0.97, 0.88))
	hint.add_theme_color_override("font_outline_color", Color(0.1, 0.07, 0.04))
	hint.add_theme_constant_override("outline_size", 5)
	hint.text = "WASD / arrows / stick / drag to walk · E or A: play at the fire · T or Y: time of day"
	hint.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	hint.position = Vector2(12, -34)
	layer.add_child(hint)
	var box := HBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	box.position = Vector2(-330, top_m)
	layer.add_child(box)
	var b_time := Button.new()
	b_time.text = "Time >"
	b_time.pressed.connect(func(): _set_hour(hour_i + 1))
	box.add_child(b_time)
	var b_styles := Button.new()
	b_styles.text = "Стилі"
	b_styles.pressed.connect(func(): get_tree().change_scene_to_file("res://styles.tscn"))
	box.add_child(b_styles)
	var b_play := Button.new()
	b_play.text = "Play kobza"
	b_play.pressed.connect(_toggle_play)
	box.add_child(b_play)


func _draw_stick() -> void:
	if stick_touch < 0:
		return
	stick_ui.draw_circle(stick_origin, 46, Color(1, 1, 1, 0.18))
	stick_ui.draw_circle(stick_origin + stick * 40, 20, Color(1, 1, 1, 0.45))


func _read_old_save() -> void:
	# the same origin as the web game, so its localStorage is ours to read
	if not OS.has_feature("web"):
		save_note = "save: (not on the web)"
		return
	var raw = JavaScriptBridge.eval("localStorage.getItem('zalissya-save-v1') || ''", true)
	if typeof(raw) != TYPE_STRING or raw == "":
		save_note = "save: none found on this origin"
		return
	var s = JSON.parse_string(raw)
	if typeof(s) != TYPE_DICTIONARY:
		save_note = "save: unreadable"
		return
	var day := "?"
	for f in s.get("flags", []):
		if str(f).begins_with("day="):
			day = str(f).substr(4)
	save_note = "save found: day %s, at %d,%d, %d people met" % [day, int(s.get("x", 0)), int(s.get("y", 0)), s.get("talked", []).size()]
	var p := Vector2(s.get("x", 0), s.get("y", 0))
	if Rect2(0, 0, data.region.w, data.region.h).has_point(p):
		saved_pos = p


# --- input: keyboard, gamepad, and a floating stick for touch ----------------------
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
		if event.physical_keycode == KEY_T:
			_set_hour(hour_i + 1)
		elif event.physical_keycode == KEY_E or event.physical_keycode == KEY_SPACE:
			_toggle_play()
	elif event is InputEventJoypadButton and event.pressed:
		if event.button_index == JOY_BUTTON_A:
			_toggle_play()
		elif event.button_index == JOY_BUTTON_Y:
			_set_hour(hour_i + 1)


func _toggle_play() -> void:
	var fire := Vector2(data.fire.x, data.fire.y)
	if playing:
		playing = false
		return
	if player.position.distance_to(fire) < 110:
		player.position = fire + Vector2(0, 42)
		playing = true


func _physics_process(_delta: float) -> void:
	# start where the old save stood, unless that is inside a wall now
	if first_frame:
		first_frame = false
		if saved_pos.x >= 0:
			var start := player.position
			player.position = saved_pos
			if player.test_move(player.global_transform, Vector2(0, 0.1)):
				player.position = start
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
	if v.length() > 0.05:
		playing = false
	player.velocity = v * SPEED
	player.move_and_slide()
	if playing:
		player_sprite.play("play")
	elif v.length() > 0.05:
		player_sprite.play("walk")
		if absf(v.x) > 0.05:
			player_sprite.flip_h = v.x < 0
	else:
		player_sprite.play("idle")


func _process(delta: float) -> void:
	# the villagers potter about near home
	for n in npcs:
		var node: Node2D = n.node
		var spr: AnimatedSprite2D = n.spr
		if n.wait > 0.0:
			n.wait -= delta
			spr.play("idle")
			continue
		var d: Vector2 = n.to - node.position
		if d.length() < 2.0:
			n.wait = 1.5 + randf() * 3.0
			n.to = n.home + Vector2(randf_range(-50, 50), randf_range(-25, 25))
		else:
			node.position += d.normalized() * minf(d.length(), 50.0 * delta)
			spr.play("walk")
			spr.flip_h = d.x < 0
	fps_hist.append(Engine.get_frames_per_second())
	if fps_hist.size() > 120:
		fps_hist.pop_front()
	var lo: float = fps_hist.min()
	info.text = "Godot %s · web: %s · %d fps (low %d) · %s\nloaded in %s · %s\n%s" % [
		Engine.get_version_info().string, str(OS.has_feature("web")), Engine.get_frames_per_second(), int(lo),
		HOURS[hour_i][1], ("%.1f s" % (load_ms / 1000.0)) if load_ms > 0 else "—",
		RenderingServer.get_video_adapter_name(), save_note]


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
