extends Node
## The kobza at the fire (GAME_PLAN.md, B9, a first piece): the 2D game's
## evenings, client/src/systems/songs.ts.
##   · from 18:00 to 23:30, by the vatra: "Заграти на кобзі" (E, T, A or the
##     button), once an evening ("playedDay");
##   · the evening has a mood (a wedding every third day: happy; a memorial
##     on the fifth: sad; else neutral), and each song has one too. A song
##     that matches pays best, a neutral one is fine, a clash sends people
##     home without kulish;
##   · each evening grows Music (CHA), and a listener who liked it brings a
##     bowl of kulish ("meals" in the satchel);
##   · the kobzar knows "Дума про козака Голоту" from the start; Vesna, the
##     otaman and Radek each teach a song (a topic in their talk).
## All the words are the 2D game's (ui.play.*, ui.mood.*, song.*).

const UI := preload("res://ui_kit.gd")   # the parchment look, plain()
const SONGS := {"holota": "neutral", "kolyskova": "neutral", "voly": "neutral", "dunai": "neutral",
	"hopak": "happy", "zhentsi": "happy", "rozpriahaite": "happy", "pidmanula": "happy", "hrytsiu": "happy",
	"polechko": "sad", "burya": "sad", "marusia": "sad"}
const TEACH := {"vesna": "kolyskova", "myroslav": "zhentsi", "radek": "rozpriahaite"}   # songTopics.ts
const Rules := preload("res://rules.gd")   # Music levels, CHA
const EVENING_FROM := 18 * 60
const EVENING_UNTIL := 23 * 60 + 30
const REACH := 2.6   # metres from the fire's middle

var m: Node2D
var hud: Node
var state: Node
var fire_at := Vector2.ZERO
var near := false
var btn: Button
var panel: PanelContainer
var text_l: Label
var choices: VBoxContainer


func setup(maidan: Node2D, the_hud: Node, the_state: Node) -> void:
	m = maidan
	hud = the_hud
	state = the_state
	for b in m.data.buildings:
		if b.get("id", "") == "vatra":
			fire_at = m.P(b.at[0], b.at[1])
	_build_ui()
	_build_flame()


## the fire's flames (Sunny's six frames), flickering from dusk to dawn
var flame: AnimatedSprite2D
func _build_flame() -> void:
	var sf := SpriteFrames.new()
	sf.set_animation_speed("default", 9)
	for i in range(1, 7):
		var tex: Texture2D = m._tex("vatra_flame/flame_%d" % i)
		if tex != null:
			sf.add_frame("default", tex)
	if sf.get_frame_count("default") == 0:
		return
	flame = AnimatedSprite2D.new()
	flame.sprite_frames = sf
	flame.centered = false
	var t0: Texture2D = sf.get_frame_texture("default", 0)
	flame.scale = Vector2.ONE * (m.metre / 88.0)
	# it sorts at the ring's front edge (so the stones never cover it), but is
	# drawn rising from the middle of the fire
	var lift: float = 1.0 * m.metre
	flame.offset = Vector2(-t0.get_width() / 2.0, -t0.get_height() - lift / flame.scale.y)
	flame.position = fire_at + Vector2(0, lift)
	var mat := CanvasItemMaterial.new()
	mat.light_mode = CanvasItemMaterial.LIGHT_MODE_UNSHADED   # (it gives light, the night does not darken it)
	flame.material = mat
	m.world.add_child(flame)
	flame.play()


func knows(id: String) -> bool:
	return id == "holota" or state.has("song:" + id)


func _mood() -> Array:
	var day: int = hud.day
	if day % 3 == 0:
		return ["happy", "wedding"]
	if day % 5 == 4:
		return ["sad", "memorial"]
	return ["neutral", "ordinary"]


# --- the window ------------------------------------------------------------------------------
func _build_ui() -> void:
	var layer := CanvasLayer.new()
	layer.layer = 6
	add_child(layer)
	btn = Button.new()
	btn.visible = false
	btn.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	btn.position = Vector2(-110, -150)
	btn.custom_minimum_size = Vector2(220, 52)
	btn.focus_mode = Control.FOCUS_NONE
	btn.pressed.connect(_sit)
	layer.add_child(btn)
	panel = PanelContainer.new()
	panel.visible = false
	panel.add_theme_stylebox_override("panel", UI.window())
	layer.add_child(panel)
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 8)
	panel.add_child(col)
	var kobza: Texture2D = m._tex("items/kobza")
	if kobza != null:
		var pic := TextureRect.new()
		pic.texture = kobza
		pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		pic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		pic.custom_minimum_size = Vector2(0, 72)
		col.add_child(pic)
	text_l = Label.new()
	text_l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	text_l.add_theme_color_override("font_color", Color(0.2, 0.14, 0.1))
	col.add_child(text_l)
	choices = VBoxContainer.new()
	col.add_child(choices)


func _layout() -> void:
	var vw := get_viewport().get_visible_rect().size
	var w := minf(620.0, vw.x - 24.0)
	panel.custom_minimum_size = Vector2(w, 0)
	text_l.custom_minimum_size = Vector2(w - 28.0, 0)
	panel.position = Vector2((vw.x - w) / 2.0, vw.y * 0.32)
	panel.reset_size()
	# (wrapped text knows its height only a frame later: shrink again then)
	(func(): if panel.visible: panel.reset_size()).call_deferred()


func _choice(text: String, cb: Callable) -> void:
	var b := UI.choice(text)
	b.pressed.connect(cb)
	choices.add_child(b)
	if choices.get_child_count() == 1 and b.focus_mode != Control.FOCUS_NONE:
		(func(): if is_instance_valid(b) and b.is_inside_tree(): b.grab_focus()).call_deferred()


func _show(text: String) -> void:
	for c in choices.get_children():
		choices.remove_child(c)
		c.queue_free()
	text_l.text = text
	panel.visible = true
	m.fading = true
	_layout()


func _close() -> void:
	panel.visible = false
	m.fading = false


# --- playing ---------------------------------------------------------------------------------
func _sit() -> void:
	if panel.visible:
		return
	var mi: int = hud.minute
	if mi < EVENING_FROM or mi >= EVENING_UNTIL:
		hud.show_toast(hud.t("ui.play.daytime"))
		return
	if state.count("playedDay") == hud.day:
		hud.show_toast(hud.t("ui.play.alreadyPlayed"))
		return
	var mood := _mood()
	var first: bool = state.count("played") == 0
	_show(hud.t("ui.play.first" if first else "ui.play.prompt") + "\n\n" + hud.t("ui.mood." + mood[1]))
	for id in SONGS:
		if knows(id):
			_choice(UI.plain(hud.t("song.name." + id)), func(): _play(id))


func _play(id: String) -> void:
	var ev: String = _mood()[0]
	var sm: String = SONGS[id]
	var rec := "match" if ev == sm else ("fine" if ev == "neutral" or sm == "neutral" else "clash")
	var before: int = Rules.level(Rules.CRAFT_THRESH, state.count("played"))
	var after_n: int = state.bump("played", 2 if rec == "match" else 1)
	state.set_count("playedDay", hud.day)
	if rec != "clash":
		state.bump("meals")
	var lvl := Rules.level(Rules.CRAFT_THRESH, after_n)
	var say: String = hud.t("ui.play.clash." + ev) if rec == "clash" else hud.t("ui.play.audience." + id)
	var tail: String = hud.t("ui.play." + rec, {"song": UI.plain(hud.t("song.name." + id)), "level": lvl})
	if lvl > before:
		tail += " " + hud.t("ui.play.levelUpTail", {"cha": Rules.stats(state, hud.t).cha.total})
	_show(say + "\n\n" + tail)
	_choice(hud.t("ui.misc.71"), _close)


# --- a song to learn, from the people who know one (people.gd asks the HUD) -------------
func teach_topic(person: String) -> Array:
	if not TEACH.has(person) or knows(TEACH[person]):
		return []
	var song: String = TEACH[person]
	return [{"question": hud.t("song.topic.%s.question" % person), "run": func() -> Array:
		state.add("song:" + song)
		return [hud.t("song.topic.%s.0" % person), hud.t("song.topic.%s.1" % person)]}]


func _process(_d: float) -> void:
	var mi: int = hud.minute
	if flame != null:
		flame.visible = mi >= EVENING_FROM or mi < 6 * 60
	var evening: bool = mi >= EVENING_FROM and mi < EVENING_UNTIL
	near = evening and not panel.visible and not m.editing and not m.fading \
		and m.player.position.distance_to(fire_at) < REACH * m.metre \
		and (hud.people == null or (hud.people.talking < 0 and hud.people.near < 0))
	btn.visible = near
	if near:
		btn.text = UI.plain(hud.t("ui.promptLabel.play"))


func _unhandled_input(event: InputEvent) -> void:
	var key: bool = event is InputEventKey and event.pressed and not event.echo and event.physical_keycode in [KEY_E, KEY_T]
	var pad: bool = event is InputEventJoypadButton and event.pressed and event.button_index == JOY_BUTTON_A
	if panel.visible:
		var back: bool = (event is InputEventKey and event.pressed and event.physical_keycode == KEY_ESCAPE) \
			or (event is InputEventJoypadButton and event.pressed and event.button_index == JOY_BUTTON_B)
		if back:
			_close()
			get_viewport().set_input_as_handled()
		return
	if near and (key or pad):
		_sit()
		get_viewport().set_input_as_handled()
