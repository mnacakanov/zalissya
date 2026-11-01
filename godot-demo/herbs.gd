extends Node2D
## The herbs of the meadow (GAME_PLAN.md, B7, a first piece): Vesna's five
## (kropyva, polyn, kalendula, zvirobiy, dereviy) growing round the khutir,
## each with the soft glow of its colour (client/src/data/items.ts), picked
## as in the 2D game (App.tsx "gather"):
##   · walk up to one: "Зірвати: Кропива" (E, T or the button);
##   · zvirobiy hides from a green eye: below WIS 2 you can't tell it;
##   · each herb counts toward Herbalism (its level is WIS, skills.ts) and
##     goes into the satchel (herbStock), and grows back in a while.
## The spots are maidan.json "herbs": [{kind, at}]. Their pictures are
## styles/<style>/herbs/<kind>.png; a herb with no picture yet is drawn as a
## small cluster of its flowers.

const KINDS := ["kropyva", "polyn", "kalendula", "zvirobiy", "dereviy"]
# items.ts: each herb's glow and flower colours, and its name's key
const GLOW := {"kropyva": Color8(120, 220, 110), "polyn": Color8(200, 205, 190), "kalendula": Color8(255, 150, 50),
	"zvirobiy": Color8(255, 205, 70), "dereviy": Color8(245, 242, 230)}
const NAME_KEY := {"kropyva": "item.HERBS.name.0", "polyn": "item.HERBS.name.1", "kalendula": "item.HERBS.name.2",
	"zvirobiy": "item.HERBS.name.3", "dereviy": "item.HERBS.name.4"}
const Rules := preload("res://rules.gd")   # Herbalism levels, WIS
const REACH := 1.3                          # metres: near enough to pick
const REGROW := 26.0                        # seconds (App.tsx: respawnAt)

var m: Node2D
var hud: Node
var state: Node
var spots: Array[Dictionary] = []   # {kind, at (scene px), node, glow, regrow}
var near := -1
var pick_btn: Button
var glow_tex: GradientTexture2D


func setup(maidan: Node2D, the_hud: Node, the_state: Node) -> void:
	m = maidan
	hud = the_hud
	state = the_state
	glow_tex = _glow_texture()
	for h in m.data.get("herbs", []):
		if not h.kind in KINDS:
			continue
		var at: Vector2 = m.P(h.at[0], h.at[1])
		var glow := Sprite2D.new()
		glow.texture = glow_tex
		glow.modulate = GLOW[h.kind]
		glow.scale = Vector2(1.0, 0.45) * (1.6 * m.metre / 128.0)
		glow.position = at
		var mat := CanvasItemMaterial.new()
		mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
		glow.material = mat
		m.ground.add_child(glow)
		var node: Node2D
		var spr: Sprite2D = m._sprite("herbs/" + h.kind, m.k)
		if spr.texture != null:
			node = spr
		else:
			node = _cluster(h.kind)
		node.position = at
		m.world.add_child(node)
		spots.append({"kind": h.kind, "at": at, "node": node, "glow": glow, "regrow": 0.0})
	_build_ui()


func _glow_texture() -> GradientTexture2D:
	var g := Gradient.new()
	g.set_color(0, Color(1, 1, 1, 0.55))
	g.set_color(1, Color(1, 1, 1, 0))
	var t := GradientTexture2D.new()
	t.gradient = g
	t.fill = GradientTexture2D.FILL_RADIAL
	t.fill_from = Vector2(0.5, 0.5)
	t.fill_to = Vector2(1.0, 0.5)
	t.width = 128
	t.height = 128
	return t


## a herb still waiting for its picture: a few stems and flowers of its colour
func _cluster(kind: String) -> Node2D:
	var n := Node2D.new()
	var col: Color = GLOW[kind]
	var mm: float = m.metre
	n.draw.connect(func():
		for i in 7:
			var x := (i - 3) * 0.07 * mm
			var hgt := (0.3 + 0.12 * ((i * 37) % 5) / 4.0) * mm
			n.draw_line(Vector2(x, 0), Vector2(x * 1.3, -hgt), Color(0.3, 0.45, 0.22), 2.0)
			n.draw_circle(Vector2(x * 1.3, -hgt), 0.05 * mm, col.darkened(0.15)))
	return n


func _build_ui() -> void:
	var layer := CanvasLayer.new()
	layer.layer = 5
	add_child(layer)
	pick_btn = Button.new()
	pick_btn.visible = false
	pick_btn.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	pick_btn.position = Vector2(-110, -150)
	pick_btn.custom_minimum_size = Vector2(220, 52)
	pick_btn.focus_mode = Control.FOCUS_NONE
	pick_btn.pressed.connect(func(): _pick(near))
	layer.add_child(pick_btn)


func _name(kind: String) -> String:
	return hud.t(NAME_KEY[kind])


## the font has no emoji: words only
func _plain(s: String) -> String:
	var out := ""
	for c in s:
		if c.unicode_at(0) < 0x2190 or (c.unicode_at(0) >= 0x0400 and c.unicode_at(0) < 0x0500):
			out += c
	return out.strip_edges()


func _pick(i: int) -> void:
	if i < 0 or i >= spots.size() or spots[i].regrow > 0.0:
		return
	var s: Dictionary = spots[i]
	var herbs: int = int(state.data.herbs)
	var wis: int = Rules.stats(state, hud.t).wis.total   # (Herbalism, plus a tonic or a keepsake)
	if s.kind == "zvirobiy" and wis < 2:
		hud.show_toast(_plain(hud.t("ui.gather.0", {"wisNow": wis})))
		return
	state.data.herbs = herbs + 1
	state.dirty = true
	state.bump("herbStock")
	var lvl := Rules.level(Rules.HERB_THRESH, herbs + 1)
	if lvl > Rules.level(Rules.HERB_THRESH, herbs):
		hud.show_toast(_plain(hud.t("ui.gather.1", {"name": _name(s.kind), "herbLevel": lvl, "wis": Rules.stats(state, hud.t).wis.total})))
	else:
		hud.show_toast(_plain(hud.t("ui.gather.3", {"name": _name(s.kind), "herbLevel": lvl, "flagCount": state.count("herbStock")})))
	s.regrow = REGROW
	s.node.visible = false
	s.glow.visible = false


func _process(delta: float) -> void:
	var t := Time.get_ticks_msec() * 0.001
	near = -1
	var best := INF
	var pp: Vector2 = m.player.position
	for i in spots.size():
		var s: Dictionary = spots[i]
		if s.regrow > 0.0:
			s.regrow -= delta
			if s.regrow <= 0.0:
				s.node.visible = true
				s.glow.visible = true
			continue
		# the glow breathes, each herb in its own time
		s.glow.modulate.a = 0.75 + 0.25 * sin(t * 2.0 + s.at.x * 0.01)
		var d: float = pp.distance_to(s.at)
		if d < REACH * m.metre and d < best:
			best = d
			near = i
	var busy: bool = m.editing or m.fading or (hud.people != null and (hud.people.talking >= 0 or hud.people.near >= 0))
	if busy:
		near = -1
	pick_btn.visible = near >= 0
	if near >= 0:
		pick_btn.text = _plain(hud.t("ui.promptLabel.4", {"herb": _name(spots[near].kind)}))


func _unhandled_input(event: InputEvent) -> void:
	if near < 0:
		return
	var key: bool = event is InputEventKey and event.pressed and not event.echo and event.physical_keycode in [KEY_E, KEY_T]
	var pad: bool = event is InputEventJoypadButton and event.pressed and event.button_index == JOY_BUTTON_A
	if key or pad:
		_pick(near)
		get_viewport().set_input_as_handled()
