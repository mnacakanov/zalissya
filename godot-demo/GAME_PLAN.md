# From the Godot demo to the game

*A plan, written 2026-11-01 for Kateryna, the owner and every agent working on Zalissya. Status of each item is tracked on the issues named below.*

## Where we are

There are two Zalissyas.

| | The 2D game (`client/src`) | The Godot demo (`godot-demo/`) |
|---|---|---|
| What it is | The playable game: React + canvas, on Pages and in Muse | The same world rebuilt in the painted Pillars-lite style |
| Has | The whole story, quests, dialogue, 6 skills and stats, satchel, fishing, cooking, smithing, alchemy, the kobza and songs, day and night, Viy's vigil, saving | The maidan and its huts (walk-in), the forest, the pond with a walkable jetty, the korchma and windmill, props, day and night lighting, people standing in place who can be talked to |
| Lacks | The new art | Everything that makes it a game: quests, items, skills, saving, most places, moving people |

**Goal:** the Godot version becomes *the* game, with the 2D game as its living specification until it is replaced.

## The decision that shapes everything

**Port the game's logic to GDScript, system by system, keeping the content as data.**

- The 2D game's systems (`client/src/systems/*.ts`, about 20 modules) are pure logic with tests, so each is a well-specified unit to port. The TypeScript stays as the reference: a port is done when it passes the same cases.
- **All player-facing text already lives in `client/src/content/locales/uk.json` and `en.json`.** Godot loads those files directly; no text is copied (CLAUDE.md rule 0).
- Dialogue that is written as code (`client/src/dialogue/*.ts`) is converted to data files (topics, conditions, grants) once, and both games read them while both exist.
- Rejected: calling the TypeScript from Godot (web-only, it would kill the Steam Deck build) and C# (no web export in Godot 4).

The owner should confirm this before Track B starts.

---

## Track A: the level editor (top priority)

**Today you cannot place things by hand in the running game.** Everything comes from `zalissya/maidan.json`, built at runtime, so the Godot editor shows an empty scene. Moving a bush means editing numbers in a JSON file. That has to change first, because every other track needs to place things.

**A1. In-game edit mode.** A key (`Tab`, or a button on touch) toggles it. In edit mode:
- **Click** a building, prop, tree or person to select it (outline + name + its numbers).
- **Drag** to move it; the ground grid (F3's 1 m grid) snaps it, Shift to move freely.
- **Duplicate** (D), **delete** (Del), **flip** (F), **scale** up and down (`[` `]`) for props.
- **Shown only with `?edit`** in the address (hidden from players); a button and `Tab` toggle it.
- **A palette** down the side: every picture in `styles/pillars/props/`, `huts/` and `trees/flat/`, by category, with thumbnails. Click one, click the ground: placed.
- **Areas, roads and walks:** drag their points (the pond's outline, a road's bends, the jetty's strip).
- **Undo / redo** (Ctrl-Z / Ctrl-Y), many steps.
- What you see is what you get: the scene rebuilds live as you edit.

**A2. Saving the level.**
- **Desktop (Godot editor or a desktop build):** Save writes `zalissya/maidan.json` directly, pretty-printed in the same layout as now, so git diffs stay readable.
- **Web build:** Save keeps the edit in the browser and offers **Download maidan.json** and **Copy to clipboard**. To publish it, drop the file on an issue (or paste it) and the Claude session commits it, or commit it yourself.
- Edits never touch anything but the level file.

**A3. The whole world.** The same editor works across the world's chunk files (`zalissya/world/<region>.json`): whatever you select is saved back to the chunk it belongs to.

**A4. Docs.** A short "How to edit a level" in `zalissya/README.md`, with the keys, and a line in `PIPELINE.md`.

**Status:** A1 and A2's first version is in (`editor.gd`; how to use it: `zalissya/README.md`). Next: dragging the points of roads, areas and walks; baking a forest into single trees; the world's chunks.

*Built as its own script, `editor.gd`, next to `maidan.gd` (as `people.gd` is), so it can be built in parallel with the owner's work on the maidan code. Owner: a Claude session (Ostap volunteers). Size: about 2–3 days of agent work, with A1+A2 first.*

---

## Track B: the game systems (in parallel, one module each)

Each item is one GDScript file plus its tests (GUT), ported from the named TypeScript module and checked against the same test cases. They are independent once **B0** exists.

| # | System | From | Needs |
|---|---|---|---|
| **B0** | **Game state and saving:** the flags, counters, talked list, position and area; save/load to a file (desktop) or browser storage (web); **the same save format**, so a 2D save can load | `systems/flags.ts`, `save/types.ts`, `save/local.ts` | none, first |
| B1 | Text: `t(key, params)`, loading `uk.json` / `en.json`, language switch | `i18n/` | B0 |
| B2 | Clock, day and night, sleeping; the lighting already exists | `systems/time.ts` | B0 |
| B3 | Skills, stats, carry weight | `systems/skills.ts`, `stats.ts`, `carry.ts` | B0 |
| B4 | Satchel and items, the satchel UI | `data/items.ts`, `systems/satchel.ts` | B0, B3 |
| B5 | Dialogue engine over data topics (the people already talk; this makes them say the real lines, with conditions and grants) | `dialogue/*.ts` → data | B0, B1 |
| B6 | Quests and the quest log | `systems/quests.ts` | B0, B1 |
| B7 | Interactions: herbs, the well, swimming, the pich; the "nearest interactable" prompt | `App.tsx` interaction block | B0, B4 |
| B8 | Work: fishing (the bite minigame), cooking, smithing, alchemy | `systems/*` | B4, B7 |
| B9 | The kobza and songs, evening moods, playing at the fire and the korchma | `systems/songs.ts`, `korchma.ts` | B5, B2 |
| B10 | Schedules: people walk between work, rest and home through the day | `systems/schedules.ts` | B2 and walk animations (D2) |
| B11 | The story's set pieces: the Chort's bargain, the chumaky, the cave, the pustka, Viy's vigil | `systems/chumaky.ts`, `cave.ts`, `pustka.ts`, `viyFight.ts` | most of the above |
| B12 | HUD and sheets: objective, character sheet, map, settings | `ui/` | B1, B3, B6 |

**Controls** (CLAUDE.md rule 2) apply to every system: keyboard, touch buttons and gamepad, and no drag-only controls in Muse.

---

**Status (B1, B2, B12, a first piece of each):** `hud.gd` gives the game's title card, the HUD card (where, the day and time, the current objective) and the "✦ Знайдено" toast, all in the 2D game's own words (`locales/`, copied by `tools/sync_locales.py`), and a running clock that brings night on its own. It knows one quest so far (meet the otaman, Vesna and Radek).

## Track C: the world (in parallel, by place)

The 2D world is one map of about 3980 × 2300 px (the khutir, the steppe, Lysa Hora, fields, river, forests, the cave underground). The Godot world so far covers the maidan and its edges.

- **C1. The world map in metres:** convert the 2D layout (`data/land.ts`, `village.ts`, `lysa.ts`, `houses.ts`) into **one seamless world**, stored as chunk files by region so several people can work at once. The editor (A) is then used to dress them.
- **C2. Regions** (chunks of the one world), built and dressed in parallel: the khutir (have), the pond and gardens (started), the fields and the river with its bridges, the forests and the boloto, the steppe and the kurhan, the tobacco field, **Lysa Hora**, the cave and tunnel underground.
- **C3. The remaining buildings** as models and paint-overs: the otaman's svitlytsia is done; still to do are the hideouts (duplo, kurhan, pechera), Did Prokip's khatka in the forest, the bridges and the chumak camp.

## Track D: characters and animation

- **D1. People's portraits and standing figures:** otaman, Vesna, Radek, Odarka, Okhrim, the spirits. *On hold by Kateryna's decision; the owner's session has started figures with Harry.*
- **D2. Walk cycles** for people who move (whole-figure walk sheets worked; cut-out parts did not, see PIPELINE.md).
- **D3. Animals that move:** geese waddling, the dog's tail, the stork landing. Small, optional.

## Track E: art (ongoing, the two Muse loops)

Continues as now: requests on #5 (Sunny) and #4 (Harry), checked by Ostap, approved by Kateryna. The editor (A) makes placing what they paint immediate. Next art needs come from C2's regions.

## Track F: platform and quality

- **F1. A smoke test in CI:** the headless run used to test every change tonight (load the scene, walk, screenshot) becomes a GitHub Action, so a broken `maidan.gd` is caught before it is published.
- **F2. Performance budget:** the forest is already 329 trees; keep 60 fps on a phone and a Steam Deck (tree batching, culling off-screen sprites).
- **F3. Targets:** web (now), desktop, Steam Deck, mobile, following `PORTING.md`.

---

## Order and who can work at once

```
Week 1   A1 A2 (editor)          B0 (state + save)        C1 (world map)       E (art)
Week 2   A3 A4                   B1 B2 B3 B6 in parallel  C2 chunks start      F1
Week 3+  (editor in daily use)   B4 B5 B7 → B8 B9 → B10 B11 B12               D2 when people are unblocked
```

- **A and B0 start now and in parallel**: they touch different files (`editor.gd` vs. a new `game/` folder).
- **B1–B12 can each be taken by a different session** once B0 lands; each is its own file with its own tests.
- **C chunks can each be taken by a different person** once A2 lands.
- One rule from PIPELINE.md stays: **`maidan.gd` is changed by one session at a time.** The editor and the systems live in their own scripts and hook in through small, agreed entry points.

## Decided (Kateryna, 2026-11-01)

1. **The Godot game replaces the 2D one, eventually.** The 2D game stays playable and is the reference until the Godot one has caught up; then Pages switches over.
2. **The logic is ported to GDScript**, system by system, against the 2D game's tests (Track B as written).
3. **One big world**, seamless like the 2D game, not separate regions. Track C builds it as one world. To keep it light and still let people work in parallel, the world file is split into **chunks** (for example `zalissya/world/<region>.json`, all loaded together, each one person's at a time) and far-off things are culled.
4. **The editor's button is hidden from players:** it shows only when the game is opened with `?edit` at the end of the address.

Still open, for the owner: **who changes `maidan.gd` while the editor is built.** The editor itself goes in its own script, `editor.gd`.
