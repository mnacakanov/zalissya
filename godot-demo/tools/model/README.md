# Models: buildings in 3D, rendered from the Pillars-lite camera

A picture generator can draw one room at the style's angle, but it can't
keep a long house with three rooms at that angle. So the buildings are
built here as simple 3D models in code. Each model is rendered from
**exactly the camera the Pillars-lite pictures are drawn from**, and then
painted over in the style.

The camera is orthographic, at about **94.6 px a metre**:
- it looks down about 21°;
- a metre east is (68.5, 21.3) px on the picture;
- a metre south is (−65.5, 26.7) px;
- a metre up is (0, −88) px.

It is measured from the style's own hut and the maidan's ground scale. The
renders therefore line up with the maidan with no fitting.

## What a render gives

`node render.cjs <model> <out>` writes these files into `<out>`.

**Pictures,** all on one canvas, with the building standing on its bottom
edge as the game expects:

| File | What it is |
|---|---|
| `exterior_color.png` | the house in flat colours, lit by the sun from the upper left (the game's sun) |
| `exterior_ink.png` | line art: the edges and the roof's courses, on a white silhouette |
| `exterior_depth.png` | depth, for a depth-guided generation |
| `exterior_normal.png` | view-space normals |
| `interior_*.png` | the same four for the cutaway, the way the game shows a room you have walked into: the roof gone, the near walls (south, east) and the partitions knee-high |
| `interior_front.png` | a mask of where the cutaway's near walls show. Copy it as it is into the hut's folder as `hut_interior_front.png`. The game draws that part of the painted room over the kobzar, so his legs go behind the stub walls. |

**The model:** `<model>.glb`, for Blender, Godot or anyone else's renders.

**The plan:** `plan.json`, the numbers the game needs, measured from the
model. Its `hut` block can be copied into the hut's `hut.json` as it is.
It holds:
- the footprint;
- the door's span;
- the pich;
- the partitions;
- the furniture as outlines on the floor (`polys`).

## Making the art from it

1. Paint over `exterior_color.png` and `interior_color.png` in the style of
   `ART_STYLE.md`, guided by the ink, depth and normal renders.
2. Keep the canvas, the camera and the outline exactly, so the plan's
   numbers stay true. Change the look, not the geometry: the door, the
   windows and the furniture stay where they are.
3. Save the results as `hut_exterior.png` and `hut_interior.png` in the
   hut's folder, for example `styles/pillars/huts/otaman/`.
4. Set its `hut.json` to the plan's `hut` block.

To change the house itself (a room wider, the door moved, more furniture),
edit the model (`otaman.js`), render again and paint again.

## Running it

```bash
cd godot-demo/tools/model && npm install
```

```bash
node render.cjs otaman ../../styles/pillars/huts/otaman/model
```

It needs Playwright with Chromium. Software GL is enough, but slow: about
a minute.

- `otaman.js` is the otaman's khata, following `DESIGN.md` ("The otaman's
  khata"). It faces south.
- `domovyk.js` is the Domovyk's khata, the kobzar's lodging. It faces east
  (door in the east wall), as the horseshoe's west arm does.
- `vesna.js` is Vesna's khata. It faces west (door in the west wall,
  turned away from the camera), as the horseshoe's east arm does.
- `pustka.js` is Taras Dovhyi's empty hut, gone grey, its thatch holed. It
  faces south.
- `komora.js` is a komora (storehouse) with its lyokh (cellar) under a
  hatch, reached by a ladder: two levels (see `../../PIPELINE.md`).
- `lyokh.js` is a cellar on its own (a pohrib): walked into like a hut,
  its pit shown at its true depth, steps you walk down. It is a sunken
  room, `"sunken": true` with `heights` in its plan.
- `kaplytsia.js` is the log chapel at the head of the maidan, with a
  pear-shaped wooden dome. It faces south.
- `kuznia.js` is Radek's forge: sooty clay walls, the horn, the mikh, the
  anvil. It faces east, its double door open on the road.
- `krynytsia.js` (the crane well) and `vatra.js` (the fire, its tahan and
  kazan) are things you walk round, not into: `NO_INTERIOR`, used in
  `maidan.json` as `"kind": "sprite"`.
- `korchma.js` is the inn on the chumak road, a long log house under a
  dark thatch, its door to the south. `mlyn.js` is the post windmill, its
  sails on the north gable. Neither stands on the maidan yet: they are for
  the scenes beyond it.
- **Props** (all `NO_INTERIOR`, rendered into `styles/pillars/props/<id>/model/`,
  used in `maidan.json` as sprites `props/<id>/<id>`): `lava` (bench),
  `kolody` (a log seat by the fire), `tyn` (a wattle fence section),
  `vulyky` (log beehives), `sushka` (Vesna's herb rack), `khrest` (the
  wayside cross), `dorohovkaz` (signpost), `viz` (hay cart), `maza` (a
  chumak's ox-cart), `kolodka` (chopping block), `diizhka` (water barrel
  and wheel), `plug` (plough), `kozly` (sawhorse), `tochylo` (grindstone),
  `hlechyky` (a bench of clay pots). `wheel.js` is the shared cart wheel.
- `lib.js` holds the shared pieces: walls round their openings, a hip
  roof, the pryzba, solid furniture. New models should use it, as
  `vesna.js` and `pustka.js` do.
- `render.html` sets the camera and renders the passes.
- `render.cjs` drives it in a headless browser.

Nothing in this folder goes into the game's export.
