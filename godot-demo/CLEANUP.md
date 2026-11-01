# Godot code cleanup (review of 2026-11-01)

A full sweep of `godot-demo/` asked for by Kateryna: stale code, leftovers
from the demo, repeated code. This file is the work list, so any session can
pick it up where the last one stopped. **Tick an item (`[x]`) in the same
commit that fixes it**, and keep each commit to one item or a few small ones.

How to check a change: the headless Godot run in `PIPELINE.md` (load the
scene, walk, screenshot); a script error makes the run hang, so read its log.
After each pass, play: walk, talk, pick herbs, fish, open the sheet and the
map, save and reload.

## Pass 1: bugs and leftovers (small, safe)

### Bugs
- [x] **1.1 The clock runs while a window is open.** `hud.gd` stops time only
  for talking, the sheet and the editor; the map, the evening's song menu and
  work's questions (brewing, the well, the bath) let it run. Stop it whenever
  `m.fading` is set (they all set it), as the 2D game does in dialogue.
- [x] **1.2 Words not in the locales (CLAUDE.md rule 0).**
  - `people.gd`: "Говорити: ", "Далі…", "Бувай" typed in the code.
  - `zalissya/people.json`: every line is Ukrainian text, made by
    `tools/people_dialogue.py` from `uk.json`. Store the **keys** instead, and
    look them up with `hud.t()`, so English works.
  - `maidan.gd`: the top buttons ("Контури", "День / ніч") and the key-hint
    line; the HUD's place name comes from `maidan.json`'s `name` (Ukrainian
    only): give buildings a locale key.
  - The editor's own words (`editor.gd`) are a developer tool's: leave them.
  *Done: people.json holds keys (the tool checks each exists), people.gd
  looks them up and renames the tags when the language changes; the HUD's
  place is `ui.hut.<id>` (the 2D game's, plus five in `locales/godot/`).
  Left on purpose: the developer's row and F3 line (only with `?edit`).*
- [x] **1.3 The web build ships art nothing uses** (about 4 MB): the old
  `trees/flat/dub_a..c`, `bereza_a..c` (the catalog uses `k_*`); `cow`,
  `horod`, `skull_stake`, `npc_prokip`, `bench` (+ `_n`) at the style's root;
  `hut_interior` (the style's fallback hut; every khata has its own art).
  Delete them or add them to `export_presets.cfg`'s `exclude_filter`.
  *Done: the style-test pictures and old trees deleted (git keeps them);
  the standing `kobzar.png` excluded from the build; `hut_interior` kept as
  the fallback hut.*
- [x] **1.4 "День / ніч" (N) winds the clock back** (`hud.gd`: 21:10 → 08:00
  the same day). A developer's switch: move it behind F3/`?edit` (1.5), and
  have it move the clock *forward* to the next morning or evening.

### Leftovers from the demo
- [x] **1.5 Developer controls shown to every player**: "Контури", "День /
  ніч", "−" "+", the key-hint line (`maidan.gd` `_build_ui`). Show them only
  with `?edit` (`Editor.allowed()`) or F3. Keep zoom on the wheel and −/=.
- [x] **1.6 "Demo" labels**: `project.godot` ("technical demo. Not the game",
  name "Залісся демо"), `README.md` title, `maidan.gd`'s header comment (the
  style test, "labelled blocks"). The folder name `godot-demo/` stays for now
  (CI, Pages path and docs point at it).
- [x] **1.7 Style-test keys in `styles/pillars/layout.json`**: `horod`,
  `skull_stake`, the heights of `npc_prokip`, `cow`, `bench`, and the hut
  interior's `prokip` and `solids`. Keep `hut.exterior.footprint` (it sets
  the ground's east/north) and `walk`, `metre`, `scale`.
- [x] **1.8 Dead code**: `maidan.gd` `_build_placeholder` (no data uses a
  third kind) and the `sign` option in `_build_sprite`; `print("forest…")`;
  the hidden developer line `hud_info` and `fps_hist`, rebuilt every frame
  (compute only when F3 shows it); `hud.gd` `DAWN`, `DUSK`;
  `game_state.gd` `talked()`. *(`talked()` turned out to be used by
  `add_talked`: kept.)*
- [ ] **1.9 Raw generations in the repo**: `styles/raw/` (21 MB) and
  `styles/pillars/kobzar_parts/`, excluded from the build. Ask Kateryna
  before deleting (they are references); `art/` is the usual place.

## Pass 2: one of each (shared modules)

- [ ] **2.1 One UI kit** (`ui_kit.gd`, static funcs): the parchment style,
  the two buttons (dark, light), the wrapped label, `plain()` (no emoji, the
  web font lacks them). Today: `hud._style`, `sheet._parch/_btn/_text`,
  `map._parch/_btn` (a copy), inline StyleBoxes in `evening.gd`, `work.gd`;
  `_plain` in herbs (a different variant), evening, sheet, work.
- [ ] **2.2 One rules file** (`rules.gd`): the skill thresholds (Herbalism,
  Fishing, Craft, Carpentry), the level lookup, the stats and carry weight.
  Today: `THRESH` tables and a `_lvl` in herbs, evening, sheet, work; stats
  and carry in `sheet.gd`, read by work.
- [ ] **2.3 Metres back from the scene**: one `m.M(pos)` beside `m.P()`.
  Today five copies: maidan (hud_info), `game_state._capture`,
  `editor._metres`, `map.metres`, `work._metres`.
- [ ] **2.4 One action button** (`interact.gd`): the 2D game's "nearest
  interactable" prompt. Today four buttons in the same spot (people, herbs,
  evening, work), each with its own E/T/A handling and its own rule for who
  wins (herbs yield to people, evening to people, work by distance through
  `people.yield_to`, a patch). Each module should only *offer* `{label,
  distance, act}`; the nearest wins.
- [ ] **2.5 One dialogue window**: people's talk panel, the evening's song
  menu and work's `_ask` are three panels in two looks. One parchment window
  with lines and choices.
- [ ] **2.6 One place for the quests** (`quests.gd`): today the rules sit in
  `hud._check_quests`, `hud._objective`, `hud.MEET`, the sheet's quest tab
  list, `map.target()`, and Vesna's lines in `hud.greeting/extra_topics`.
  Kateryna will rewrite the quests: this is only moving them, no new quests.
- [ ] **2.7 "A window is open"**: six scripts set and clear `m.fading`, and
  the fade between levels uses it too. Replace with a small counter
  (`m.pause(who)` / `m.resume(who)`) so one closing cannot unpause another.
- [ ] **2.8 Small repeats**: the evening's hours typed again in
  `hud._objective` (use `evening.gd`'s constants); the maidan's oval built
  twice in `maidan.gd` (use `_oval`); the name label made four times in
  `maidan.gd`; the WASD read twice in `_physics_process`.

## Pass 3: speed

- [ ] **3.1** `maidan._process` walks every building **and every tree**
  (~360) each frame: `_front_y`, the alpha look-up, the shader's hole. Only
  things near the kobzar (or on screen) need it.
- [ ] **3.2** `hud._process` writes the clock and day counters, the talked
  list, the quests and the labels every frame: do it when the minute changes.
- [ ] **3.3** Every lamp makes its own 256 px light texture (`_light_tex`):
  make one and share it (herbs' glow too).
