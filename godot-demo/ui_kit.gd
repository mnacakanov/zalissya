extends RefCounted
## The game's look, in one place: the 2D game's parchment and brown ink
## (client/src/App.tsx's colours), for every window, card and button.
##     const UI := preload("res://ui_kit.gd")
##     panel.add_theme_stylebox_override("panel", UI.window())
##     row.add_child(UI.button(t("ui.misc.71"), false))

const PAPER := Color(0.953, 0.914, 0.824)   # a window
const EDGE := Color(0.85, 0.77, 0.57)       # its border
const CARD := Color(0.906, 0.851, 0.725)    # a card in a window
const TAN := Color(0.886, 0.827, 0.682)     # a light button, a choice
const BROWN := Color(0.478, 0.29, 0.169)    # a dark button, a heading, the focus rim
const INK := Color(0.2, 0.14, 0.1)          # the text
const DIM := Color(0.36, 0.27, 0.19)        # quieter text


## a rounded box of one colour (and a border, if given)
static func box(bg: Color, radius := 14, margin := 12, border := Color(0, 0, 0, 0)) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.set_corner_radius_all(radius)
	sb.set_content_margin_all(margin)
	if border.a > 0:
		sb.set_border_width_all(2)
		sb.border_color = border
	return sb


## a window: parchment with its edge
static func window(radius := 16) -> StyleBoxFlat:
	return box(PAPER, radius, 14, EDGE)


## a button: dark (on: brown, the HUD's and a chosen tab) or light
static func button(text: String, on: bool) -> Button:
	var b := Button.new()
	b.text = text
	b.focus_mode = Control.FOCUS_NONE
	var bg := BROWN if on else TAN
	for st in ["normal", "hover", "pressed"]:
		b.add_theme_stylebox_override(st, box(bg.darkened(0.1 if st == "pressed" else 0.0), 8))
	b.add_theme_color_override("font_color", PAPER if on else DIM)
	b.add_theme_color_override("font_hover_color", PAPER if on else INK)
	return b


## a choice in a talk or a question: wide, wrapped, a brown rim when the
## keyboard or the gamepad is on it (none on a touch screen)
static func choice(text: String) -> Button:
	var b := Button.new()
	b.text = text
	b.alignment = HORIZONTAL_ALIGNMENT_LEFT
	b.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	b.custom_minimum_size = Vector2(0, 44)
	for st in ["normal", "hover", "pressed", "focus"]:
		var sb := box(TAN.darkened(0.08 if st == "pressed" else 0.0), 8, 14)
		sb.content_margin_top = 8
		sb.content_margin_bottom = 8
		if st == "focus":
			sb.bg_color = Color(0, 0, 0, 0)
			sb.set_border_width_all(2)
			sb.border_color = BROWN
		b.add_theme_stylebox_override(st, sb)
	for c in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
		b.add_theme_color_override(c, Color(0.24, 0.17, 0.11))
	if DisplayServer.is_touchscreen_available():
		b.focus_mode = Control.FOCUS_NONE
	return b


## the web font has no emoji or arrows: the 2D game's words carry a few
static func plain(s: String) -> String:
	var out := ""
	for c in s:
		if c.unicode_at(0) < 0x2190:
			out += c
	return out.strip_edges()
