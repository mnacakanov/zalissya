extends RefCounted
## The game's numbers, in one place, as the 2D game derives them
## (client/src/systems/skills.ts, stats.ts, carry.ts): each skill's level
## from what was done, the six stats from the skills plus what lifts them
## (keepsakes, a meal, a tonic, a bath…), and the weight he carries against
## 6 + 2×STR. Nothing here is stored: it is all read from the save
## (game_state.gd). Every script reads the numbers from here:
##     const Rules := preload("res://rules.gd")
##     Rules.stats(state, hud.t).dex.total

const HERB_THRESH := [0, 3, 7, 12, 18, 25, 34]   # Herbalism: herbs gathered
const FISH_THRESH := [0, 2, 5, 9, 14, 20]        # Fishing: fish caught
const CRAFT_THRESH := [0, 2, 5, 9, 14, 20]       # Cooking, Smithing, Alchemy, Music
const CARPENTRY_THRESH := [0, 5, 12, 22, 36]     # Carpentry
const UNIT_WEIGHT := {"fish": 1, "herbStock": 1, "iron": 3, "forged": 2}   # carry.ts
const STATS := ["str", "dex", "con", "int", "wis", "cha"]


static func level(table: Array, done: int) -> int:
	var lvl := 1
	for i in table.size():
		if done >= table[i]:
			lvl = i + 1
	return lvl


static func skills(state: Node, t: Callable) -> Array:
	var herbs := int(state.data.herbs)
	var rows := [
		["ui.skillRows.name.0", HERB_THRESH, herbs, "ui.skillRows.stat.0"],
		["ui.skillRows.name.1", FISH_THRESH, state.count("fishTotal"), "ui.skillRows.stat.1"],
		["ui.skillRows.name.2", CRAFT_THRESH, state.count("cooked"), "ui.skillRows.stat.2"],
		["ui.skillRows.name.3", CRAFT_THRESH, state.count("smithed"), "ui.skillRows.stat.3"],
		["ui.skillRows.name.4", CRAFT_THRESH, state.count("brewed"), "ui.skillRows.stat.4"],
		["ui.skillRows.name.music", CRAFT_THRESH, state.count("played"), "ui.skillRows.stat.music"],
		["ui.skillRows.name.carpentry", CARPENTRY_THRESH, state.count("carpentry"), "ui.skillRows.stat.carpentry"],
	]
	var out := []
	for r in rows:
		var lvl := level(r[1], r[2])
		out.append({"name": t.call(r[0]), "level": lvl, "done": r[2], "next": r[1][lvl] if lvl < r[1].size() else null, "stat": t.call(r[3])})
	return out


## stats.ts computeStats: base from the skills, plus what lifts it
static func stats(state: Node, t: Callable) -> Dictionary:
	var base := {
		"str": level(CRAFT_THRESH, state.count("smithed")) + level(CARPENTRY_THRESH, state.count("carpentry")) - 1,
		"dex": level(FISH_THRESH, state.count("fishTotal")),
		"con": level(CRAFT_THRESH, state.count("cooked")),
		"int": level(CRAFT_THRESH, state.count("brewed")),
		"wis": level(HERB_THRESH, int(state.data.herbs)),
		"cha": level(CRAFT_THRESH, state.count("played")),
	}
	var bonus := {}
	var why := {}
	for k in STATS:
		bonus[k] = 0
		why[k] = []
	var give := func(k: String, n: int, label: String):
		bonus[k] += n
		why[k].append("%s %s%d" % [label, "+" if n > 0 else "", n])
	if state.has("horseshoe"): give.call("str", 1, t.call("stat.computeStats.0"))
	if state.has("pebble"): give.call("dex", 1, t.call("stat.computeStats.1"))
	if state.has("stone"): give.call("con", 1, t.call("stat.computeStats.2"))
	if state.has("wellfed"): give.call("con", 1, t.call("stat.computeStats.3"))
	if state.has("rested"): give.call("con", 1, t.call("stat.rested"))
	if state.has("bathed"): give.call("cha", 1, t.call("stat.bathed"))
	if state.has("tonic"):
		give.call("int", 1, t.call("stat.computeStats.4"))
		give.call("wis", 1, t.call("stat.computeStats.5"))
	if state.has("strongtonic"):
		give.call("int", 2, t.call("stat.computeStats.6"))
		give.call("wis", 2, t.call("stat.computeStats.7"))
	if state.has("gold"): give.call("cha", 2, t.call("stat.computeStats.8"))
	if state.has("moonstone"):
		give.call("wis", 1, t.call("stat.computeStats.9"))
		give.call("cha", 1, t.call("stat.computeStats.10"))
	if state.has("viySealed"):
		give.call("wis", 1, t.call("stat.computeStats.11"))
		give.call("cha", 1, t.call("stat.computeStats.12"))
	if state.has("soulsold") and not state.has("soulback"):
		give.call("wis", -1, t.call("stat.soulless"))
	var out := {}
	for k in STATS:
		out[k] = {"base": base[k], "bonus": bonus[k], "total": maxi(1, base[k] + bonus[k]), "why": why[k]}
	return out


static func carried(state: Node) -> int:
	var iron: int = 0 if state.has("horseshoe") else state.count("iron")
	return state.count("fish") * UNIT_WEIGHT.fish + state.count("herbStock") * UNIT_WEIGHT.herbStock \
		+ iron * UNIT_WEIGHT.iron + state.count("forged") * UNIT_WEIGHT.forged


static func cap(s: Dictionary) -> int:
	return 6 + 2 * int(s.str.total)
