# The world pipeline: from a 3D model to a painted, walkable place

How Zalissya's world is built for the Godot version, and how more people
(and their Claude and Muse agents) can work on it in parallel. Read it with
[`../CLAUDE.md`](../CLAUDE.md) (the project's rules) and
[`../ART_STYLE.md`](../ART_STYLE.md) (the look).

The live result is at `https://mnacakanov.github.io/zalissya/godot-demo/`,
which opens on the maidan. To get a new build on a phone, close the demo
and open it again; if you still see the old one, do it once more.

## The idea in one picture

```
 maidan.json          tools/model/<x>.js          render.cjs                 paint-over              huts/<x>/          the game
 where things   ──►   the building as a    ──►   renders from the    ──►   Muse paints over   ──►  pictures +   ──►  walk in,
 stand (metres)       simple 3D model            game's exact camera        the renders,          hut.json          lit at night
                      (walls, doors, pich,       + its plan (numbers)       keeping the outline
                       furniture)
```

- **The 3D model is the source of truth for geometry.** Walls, doors,
  rooms and furniture are decided there, once.
- **The painting is the source of truth for the look.** It is painted over
  renders of that model, from exactly the game's camera. Because of that,
  the numbers the game needs (where the walls, the door, the pich and the
  furniture are) come straight out of the model, and they fit the painting
  with no fitting by hand.
- **Why:** a picture generator on its own draws a pretty house at a
  slightly wrong angle, with a door it moved. A long house with three rooms
  is beyond it. Painting over a render keeps the angle and the plan exact.
  Pillars of Eternity and Baldur's Gate were made this way too.

## Fixed rules (everyone follows these)

| Rule | Value |
|---|---|
| Style | **Pillars-lite**: the Pillars of Eternity camera, painted in `ART_STYLE.md`'s sepia ink and watercolour |
| Camera | orthographic, about **94.6 px a metre** on the picture, looking down about **21°** |
| Ground directions on a picture | a metre **east** = (68.5, 21.3) px, a metre **south** = (−65.5, 26.7) px, a metre **up** = (0, −88) px |
| What faces where | the **south** wall is the **lower-left** face of a building, the **east** wall the **lower-right** face; north and west are turned away |
| Units and axes | metres; on the maidan x runs east and y runs south, and (0, 0) is the fire |
| Pictures | transparent PNG, the building standing on the **bottom edge**; exterior and interior share **one canvas size** |
| A room you walk into | the roof off; the near walls (south, east) and any partitions cut to **knee height** (0.45 m) |
| Doors | at least 0.95 m wide; never put furniture in front of a door (the kobzar must get through) |
| Text | no words painted into pictures; names live in data |

The camera is fixed for the whole game. **Never** change a canvas or an
outline when painting: the numbers in `hut.json` are tied to them.

## Where things live

```
godot-demo/
  maidan.tscn / maidan.gd        the maidan scene (code: changed by the Claude session that owns it)
  zalissya/maidan.json           where everything on the maidan stands (data: anyone may edit)
  zalissya/README.md             the maidan's data format, field by field
  tools/model/                   the 3D models and their renderer (README.md there)
    otaman.js, domovyk.js        one file per building
    render.cjs, render.html      renders a model from the game's camera
  styles/pillars/                the chosen style's art
    huts/<id>/                   one walk-in building:
      hut_exterior.png           the painted house
      hut_interior.png           the painted cutaway room
      hut_interior_front.png     the near walls' mask (from the model, copied as it is)
      *_n.png                    normal maps (tools/normals.py)
      hut.json                   the plan the game uses (from the model's plan.json)
      model/                     the model's renders and plan.json, to paint over
    raw/                         raw generations, for the record
```

## Recipes

### A new walk-in building (a khata, the korchma, the forge…)

1. **Claim it.** Open an issue: "World: <building>", saying who is doing
   what. Check that nobody else has claimed it.
2. **Model it** (a Claude agent). Copy `tools/model/domovyk.js` to
   `tools/model/<id>.js` and change it:
   - `SIZE` and the walls: openings for the door and the windows.
   - The door: which wall it is in, chosen by where the building stands.
     It faces the maidan, so on the west arm the door goes in the east
     wall. Put it in `plan()` as `{wall, t}`.
   - The furniture, taken from `DESIGN.md` and `CHARACTERS.md`. Mark what
     stands on the floor as solid, as `fur()` does.
   - The roof: thatch, gont or plank.
3. **Render it.** In `tools/model`, install once:
   ```bash
   npm install
   ```
   Then render:
   ```bash
   node render.cjs <id> ../../styles/pillars/huts/<id>/model
   ```
   This writes the colour, ink, depth and normal renders of the house and
   of its cutaway, the near-wall mask, `plan.json` and `<id>.glb`.
4. **Check the plan before anyone paints.** Copy the plan's `hut` block to
   `huts/<id>/hut.json`, and put the flat colour renders in as
   `hut_exterior.png` / `hut_interior.png` for a moment. Open the demo
   (locally, or on a branch) and check, with F3 for outlines and names:
   - you can walk in through the door;
   - nothing blocks the door;
   - the furniture is solid where it should be.

   **Leave the flat renders in** until the paint-over arrives: the game
   is playable and testable at once, and the painting simply replaces the
   two pictures, with the same plan.
5. **Paint it** (a Muse agent, or a person). Paint over
   `model/exterior_color.png` and `model/interior_color.png`:
   - use the `*_ink.png` (lines), `*_depth.png` and `*_normal.png` renders
     as guides, and `styles/pillars/hut_exterior.png` as the style
     reference;
   - keep the canvas, the camera and the outline exactly;
   - you may add life inside the outline: herbs, pots, a cat, cracks, moss.

   A prompt that works:
   ```
   Repaint this 3D render as a hand-painted illustration in sepia ink and watercolour, in the style of the attached reference. Keep the exact composition: same camera angle, same outline and silhouette, same canvas size, and every door, window and piece of furniture in the same place. Do not move, add or remove any geometry. <what the building is: walls, roof, colours, details>. Transparent background.
   ```
6. **Drop it in.** Put these in `styles/pillars/huts/<id>/`:
   - `hut_exterior.png` and `hut_interior.png`;
   - `model/interior_front.png`, copied as `hut_interior_front.png`;
   - the normal maps (`python3 tools/normals.py …`);
   - `hut.json`.
7. **Put it on the maidan.** In `zalissya/maidan.json`, add or point at the
   building:
   ```json
   {"id": "<id>", "name": "…", "kind": "khata", "at": [x, y], "facing": "east"}
   ```
   A khata finds `huts/<id>/` by its id. Use `"art": "<folder>"` to point
   it at another folder.
8. **Check and publish.** Walk in by day and by night. Then open a PR to
   `main` (collaborators) or merge (the Claude session, per `CLAUDE.md`).
   CI exports the game and publishes it in about a minute.

### A building with two levels: a cellar under a hatch, or down real steps

Two models show both ways:
- **`komora.js`, a storehouse with a hatch (lyada) in its floor.** You
  step onto the hatch, the screen fades, and you are at the foot of a
  ladder in its lyokh. Step onto the ladder's foot to come back up. A
  ladder is right here: steps from a hatch would be too steep to walk.
- **`lyokh.js`, a cellar on its own, walked into like a hut, no fade at
  all.** From outside it is a pohrib (a steep A of thatch down to the
  ground, whitewashed gables, after the owner's reference photos). Walk in
  at its door and the thatch lifts away like a roof. There, in place, is
  the cellar dug 2.4 m into the ground, and you walk down its steps
  yourself, the kobzar's figure lowering with every step. Its plan says
  `"sunken": true`, and its `interior` carries `heights`:
  - flat regions `{quad, h}`;
  - ramps `{quad, foot, top, from, to}`, in metres below the ground.

  The cutaway is rendered at its true depth, so the picture reaches
  below the house's outline. **Put nothing south or east of a sunken
  cellar:** a building there would cover its pit.

How a model describes it (in `plan()`):
- `build(THREE, {level: "cellar"})` builds the lower room alone, its
  floor as its ground. `NO_INTERIOR = true` marks a building you only see
  from outside, like the mound.
- `descend: {at, out}`: where you go down (the hatch, or the threshold
  before the mound's door), and where you come back out.
- `cellar: {...}` holds:
  - `footprint`;
  - `arrive` (where you land below) and `up` (where you leave);
  - `lamp`;
  - optional `gap`, an opening in one of its walls where steps come in;
  - optional `walls`, lines such as a flight's open sides;
  - optional `stairs`: their outline, their foot and top, and how high
    they rise. The game lifts the kobzar by the height of the step under
    him.
- **Steps must come down toward the camera** (their top to the north or
  west). A flight going down away from the camera hides behind its own
  upper steps at this camera, as the first try showed.

`render.cjs` writes `cellar_*.png` (colour, ink, depth, normals, and the
near-wall mask) on a canvas of its own, and the plan's `hut` block gets
`descend` and `cellar`. In the game, the cellar is laid out 300 m south of
its building, where only the dark is. It is dark there at any hour but for
its lamp.

**For the painter:** `cellar.png` is painted over `model/cellar_color.png`
like the others. Copy `model/cellar_front.png` as `cellar_front.png`.
Upper floors would work the same way.

### A building you don't walk into (the kaplytsia, the well, a haystack…)

Same model, render and paint-over, but only the exterior is needed. In
`maidan.json` use `"kind": "sprite"` with `file`, `size` and `footprint`
(see `zalissya/README.md`). Until its art exists, a `"placeholder"` block
of its real size stands there.

### Moving things about, or a new part of the world

Edit `zalissya/maidan.json`, where all positions are in metres. Read
positions in the game: the HUD shows where the kobzar stands, F3 draws a
5 m grid, and − / + zoom out. A new area beyond the maidan (the pond, the
road, the fields) starts as a data file like `maidan.json`. Ask the Claude
session for the scene to load it.

## Working in parallel without stepping on each other

- **One building, one person, one issue, one PR.** The pieces are
  separate folders, so two people never touch the same files. The one
  shared file is `maidan.json`. Pull before editing it, keep the change to
  your building's line, and expect to rebase.
- **Code** (`maidan.gd`, `render.html`) is changed by the Claude session
  that owns it. If you need something the code can't do yet (a building
  shape, people standing about, a new kind of object), open an issue and
  describe it. A new model file (`tools/model/<id>.js`) is fine to add.
- **Agents talk through issues.** Harry (the owner's Muse agent) takes art
  requests in issue #4. Kateryna's Muse agent has its own inbox (#5). A
  comment signed `**Harry:**` on any issue, a new issue, or new art on
  `main` wakes the Claude session through the inbox PR
  (`.github/workflows/claude-inbox.yml`). The guide to that mechanism is
  the artifact "agents on call".
- **Big pictures belong in the repo,** not in issue attachments, which
  agents can't download. Raw generations go in `styles/raw/`.

## A paint-over passes when

- [ ] It is the same canvas size as the render, and the building stands on the bottom edge.
- [ ] Laid over the render, the outline matches: the walls' feet, the door, the windows and the roof's eaves.
- [ ] The door is where the model has it, at the same width.
- [ ] Furniture stands where the model has it. Small things may be added, but nothing is moved.
- [ ] The near walls in the interior are knee-high, and the door gap shows.
- [ ] It reads as `ART_STYLE.md`: sepia ink lines, watercolour washes, cracked whitewash, no glossy 3D look.
- [ ] The background is transparent: no green fringe, no white halo.
- [ ] In the game: you walk in, your legs go behind the near walls, and the pich lights at night.

## Lessons so far

- A generator asked for a whole three-room house came back nearly
  frontal, and the room flattened into a strip on the house. Painting over
  a render fixed it (the otaman's khata, Request 5 → 5b).
- A wall that faces east or west runs at a slant on screen, so a door in
  it looks narrower. The game widens every wall's gap by 0.25 m each side.
- A pich modelled right next to a door blocked it. Keep the space inside
  a door clear for a metre.
- A room's knee-high near walls need their mask
  (`hut_interior_front.png`), or the kobzar's legs show in front of them.
- Cut-out "paper doll" walk animations from generated parts did not work.
  Whole-figure walk sheets did (`kobzar_walk_4dir.png`).
